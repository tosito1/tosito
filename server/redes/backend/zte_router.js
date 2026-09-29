/**
 * zte_router.js — ZTE ZXHN Router Integration
 * ──────────────────────────────────────────────────────────────
 * Control real del router ZTE ZXHN F6705/F6600 vía HTTP scraping.
 * 
 * Estrategia:
 *  1. POST /login con usuario+contraseña → sesión cookie
 *  2. Usar la cookie para llamar endpoints de gestión
 *  3. Parsear respuestas HTML/JSON con cheerio
 * 
 * NOTA: Los endpoints exactos pueden variar por firmware/ISP.
 *       Este módulo incluye autodetección y fallbacks.
 * ──────────────────────────────────────────────────────────────
 */

'use strict';

const axios  = require('axios');
const cheerio = require('cheerio');
const fs     = require('fs');
const path   = require('path');

// ── Configuración ──
const ROUTER_IP   = process.env.ROUTER_IP   || '192.168.1.1';
const ROUTER_USER = process.env.ROUTER_USER || 'user';
const BASE_URL    = `http://${ROUTER_IP}`;

// Leer contraseña del archivo de credenciales del panel (separada de la del router)
let ROUTER_PASS = '';
try {
    // El usuario guarda la contraseña del router en el panel web de Nexus
    const dbModule = require('./database');
    ROUTER_PASS = dbModule.getSetting('router_pass') || '';
} catch (e) {
    // fallback: leer desde archivo
    try {
        ROUTER_PASS = fs.readFileSync(path.join(__dirname, 'router_pass'), 'utf-8').trim();
    } catch (_) {}
}

// ── Estado de sesión ──
let _session = {
    cookie:    null,
    token:     null,
    loginTime: 0,
    model:     'zte_zxhn', // autodetectado
};

const SESSION_TTL = 5 * 60 * 1000; // 5 minutos

// ── Axios instance con timeouts ──
const http = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
});

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function buildCookieHeader(cookies) {
    if (!cookies || cookies.length === 0) return '';
    return cookies
        .map(c => c.split(';')[0])
        .join('; ');
}

function extractSetCookies(response) {
    const raw = response.headers['set-cookie'] || [];
    return raw;
}

function log(msg) {
    console.log(`[ZTE Router] ${msg}`);
}

// ─────────────────────────────────────────────
// 1. LOGIN — Autenticación en el router
// ─────────────────────────────────────────────

/**
 * Detecta el modelo/firmware del router leyendo la página de login
 * y extrae el token CSRF/session si existe.
 */
async function detectRouterModel() {
    try {
        const res = await http.get('/', { validateStatus: () => true });
        const html = res.data || '';
        const $ = cheerio.load(html);

        // Detectar token oculto (algunos firmwares ZTE)
        const token = $('input[name="token"]').val() ||
                      $('input[name="_token"]').val() ||
                      $('input[name="csrf_token"]').val() || null;

        // Detectar modelo
        let model = 'zte_zxhn';
        if (html.includes('F6705') || html.includes('&#70;&#54;&#55;&#48;&#53;')) model = 'F6705';
        else if (html.includes('F6600')) model = 'F6600';
        else if (html.includes('H3600')) model = 'H3600';

        const rootCookies = extractSetCookies(res);

        return { token, model, rootCookies };
    } catch (e) {
        return { token: null, model: 'zte_zxhn', rootCookies: [] };
    }
}

/**
 * Login al router ZTE. Devuelve true si es exitoso.
 * Maneja múltiples formatos de login que usa ZTE según el firmware.
 */
async function login(pass) {
    let password = pass || ROUTER_PASS;
    if (password && typeof password.then === 'function') {
        password = await password;
        if (!password) {
            try { password = require('fs').readFileSync(require('path').join(__dirname, 'password'), 'utf-8').trim(); } catch(_) {}
        }
    } else if (!password) {
        try { password = require('fs').readFileSync(require('path').join(__dirname, 'password'), 'utf-8').trim(); } catch(_) {}
    }
    if (!password) throw new Error('No hay contraseña configurada para el router');

    log(`Conectando a ${BASE_URL} con usuario "${ROUTER_USER}"...`);

    // Detectar modelo y token CSRF
    const { token, model, rootCookies } = await detectRouterModel();
    _session.model = model;
    log(`Modelo detectado: ${model}`);

    // Intentar diferentes estrategias de login según el firmware ZTE
    const strategies = [
        // Estrategia 1: Login estándar ZTE ZXHN (más común)
        async () => {
            const form = new URLSearchParams({
                username: ROUTER_USER,
                password: password,
                action: 'login',
            });
            if (token) form.set('token', token);
            return await http.post('/login.html', form.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxRedirects: 5,
            });
        },
        // Estrategia 2: Login via /goform/login
        async () => {
            const form = new URLSearchParams({
                loginUser: ROUTER_USER,
                loginPassword: password,
            });
            return await http.post('/goform/login', form.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
        },
        // Estrategia 3: Login via /UserLogin
        async () => {
            const form = new URLSearchParams({
                Username: ROUTER_USER,
                Password: password,
            });
            return await http.post('/UserLogin', form.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
        },
        // Estrategia 4: JSON API
        async () => {
            return await http.post('/api/login', {
                username: ROUTER_USER,
                password: password,
            });
        },
        // Estrategia 5: ZTE SHA256 XML Auth (Digi / F6705 / etc)
        async () => {
            const crypto = require('crypto');
            const tokenRes = await http.get('/?_type=loginData&_tag=login_token', {
                headers: { 'Cookie': buildCookieHeader(rootCookies) }
            });
            
            let cookies = [...rootCookies];
            const tokenCookies = extractSetCookies(tokenRes);
            tokenCookies.forEach(c => {
                const name = c.split('=')[0];
                cookies = cookies.filter(old => !old.startsWith(name + '='));
                cookies.push(c);
            });
            
            const match = /<ajax_response_xml_root>([^<]+)<\/ajax_response_xml_root>/.exec(tokenRes.data);
            if (!match) throw new Error('No se encontro login_token');
            const hash = crypto.createHash('sha256').update(password + match[1]).digest('hex');
            
            console.log("DEBUG cookies:", cookies);
            console.log("DEBUG token:", match[1]);
            console.log("DEBUG pass:", password);
            
            const form = new URLSearchParams({
                action: 'login',
                Password: hash,
                Username: ROUTER_USER
            });
            const headers = { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://192.168.1.1/'
            };
            if (cookies.length > 0) headers['Cookie'] = buildCookieHeader(cookies);

            const res = await http.post('/?_type=loginData&_tag=login_entry', form.toString(), { headers });
            
            let resData = res.data;
            if (typeof resData === 'string' && resData.includes('sess_token')) {
                try { resData = JSON.parse(resData); } catch(e) {}
            }
            if (resData && (resData.lockingTime > 0 || (resData.loginErrMsg && resData.loginErrMsg.length > 0))) {
                throw new Error(resData.promptMsg || resData.loginErrMsg || 'Router bloqueado temporalmente por intentos fallidos');
            }
            if (resData && resData.sess_token) {
                res.data = resData; // ensure it passes the success check
                return res;
            }
            throw new Error('No se recibio sess_token');
        },
    ];

    let strategyOrder = [0, 1, 2, 3, 4];
    if (model === 'F6705' || model === 'F6600') {
        strategyOrder = [4];
    }

    for (let i of strategyOrder) {
        try {
            const res = await strategies[i]();
            const cookies = extractSetCookies(res);

            if (cookies.length > 0) {
                // For Strategy 5, we need to merge the request cookies with the new response cookies
                // because the router needs BOTH SIDs and the TESTCOOKIESUPPORT
                if (i === 4 && res.config && res.config.headers && res.config.headers.Cookie) {
                    const reqCookies = res.config.headers.Cookie.split(';').map(c => c.trim());
                    const merged = [...reqCookies];
                    cookies.forEach(c => {
                        const pureCookie = c.split(';')[0].trim();
                        const name = pureCookie.split('=')[0];
                        const idx = merged.findIndex(old => old.startsWith(name + '='));
                        if (idx !== -1) merged[idx] = pureCookie;
                        else merged.push(pureCookie);
                    });
                    _session.cookie = merged.join('; ');
                } else {
                    // For other strategies, just extract the KEY=VALUE part
                    _session.cookie = buildCookieHeader(cookies.map(c => c.split(';')[0].trim()));
                }

                // If it's a JSON response with sess_token, use it instead of hiddenToken
                if (res.data && res.data.sess_token) {
                    _session.token = res.data.sess_token;
                    // For F6705, the login JSON token is temporary. We must load the main page to get the real token.
                    if (res.data.login_need_refresh) {
                        try {
                            const rootRes = await http.get('/', { headers: { 'Cookie': _session.cookie } });
                            const m = rootRes.data.match(/_sessionTmpToken\s*=\s*"([^"]+)"/);
                            if (m) {
                                let t = m[1];
                                if (t.includes('\\x')) {
                                    t = t.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                                }
                                _session.token = t;
                            }
                        } catch(e) {}
                    }
                } else {
                    _session.token = token;
                }
                
                _session.loginTime = Date.now();
                log(`✅ Login exitoso (estrategia ${i + 1})`);
                return true;
            }

            // Verificar si el HTML de respuesta indica éxito
            const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            if (html.includes('logout') || html.includes('index') || res.data.sess_token || (res.status === 200 && !html.includes('error'))) {
                // Puede que use una sesión sin Set-Cookie explícita
                if (res.headers['set-cookie']) {
                    _session.cookie = buildCookieHeader(res.headers['set-cookie']);
                } else if (i === 4) {
                    // Para la estrategia 5, la cookie se guarda en res.config.headers.Cookie o initCookies
                    // Lo dejamos en _session.cookie que se setea dentro de la estrategia si se quiere, o lo seteamos aquí
                }
                if (res.data && res.data.sess_token) {
                    _session.token = res.data.sess_token;
                    
                    // For F6705, the login JSON token is temporary. We must load the main page to get the real token.
                    if (res.data.login_need_refresh) {
                        try {
                            const rootRes = await http.get('/', { headers: { 'Cookie': _session.cookie } });
                            const m = rootRes.data.match(/_sessionTmpToken\s*=\s*"([^"]+)"/);
                            if (m) {
                                // De-obfuscate hex string if it's hex-encoded (e.g. \x6f...)
                                let t = m[1];
                                if (t.includes('\\x')) {
                                    t = t.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                                }
                                _session.token = t;
                            }
                        } catch(e) {}
                    }
                }
                _session.loginTime = Date.now();
                log(`✅ Login aceptado (estrategia ${i + 1})`);
                return true;
            }
        } catch (e) {
            log(`Estrategia ${i + 1} falló: ${e.message}`);
        }
    }

    throw new Error('No se pudo autenticar en el router. Verifica usuario/contraseña.');
}

/**
 * Asegura que hay sesión activa. Si no, hace login.
 */
async function ensureSession(pass) {
    const isExpired = Date.now() - _session.loginTime > SESSION_TTL;
    if (!_session.cookie || isExpired) {
        await login(pass);
    }
}

/**
 * Petición autenticada al router.
 */
async function routerGet(url, pass, retry = true) {
    await ensureSession(pass);
    const res = await http.get(url, {
        headers: { 'Cookie': _session.cookie || '' },
        validateStatus: () => true,
    });
    if (retry && res.data && (res.data.includes('404 Not Found') || res.data.includes('location.origin') || res.data.includes('SessionTimeout'))) {
        log('⚠️ Sesión del router inválida o expirada. Forzando re-login...');
        _session.loginTime = 0; // Invalidar sesión
        return routerGet(url, pass, false); // Reintentar sin retry infinito
    }
    return res;
}

async function routerPost(url, data, pass, retry = true) {
    await ensureSession(pass);
    const headers = {
        'Cookie': _session.cookie || '',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': BASE_URL + '/',
    };
    if (_session.token) headers['X-CSRF-Token'] = _session.token;
    const res = await http.post(url, typeof data === 'string' ? data : new URLSearchParams(data).toString(), {
        headers,
        validateStatus: () => true,
    });
    if (retry && res.data && (res.data.includes('404 Not Found') || res.data.includes('location.origin') || res.data.includes('SessionTimeout'))) {
        log('⚠️ Sesión del router inválida. Forzando re-login para POST...');
        _session.loginTime = 0;
        return routerPost(url, data, pass, false);
    }
    return res;
}

// ─────────────────────────────────────────────
// 2. CLIENTES WI-FI — Lista real
// ─────────────────────────────────────────────

/**
 * Obtiene la lista real de clientes Wi-Fi conectados al router.
 * Devuelve array de { mac, ip, name, band, signal, speed }
 */
async function getWifiClients(pass) {
    log('Obteniendo clientes Wi-Fi...');
    await ensureSession(pass);

    const candidates = [
        '/?_type=hiddenData&_tag=accessdev_data&DeveiceType=ALL', // F6705
        '/wlanAssocList.html',
        '/connected_devices.html',
        '/wlan_station_list.html',
        '/goform/getAssocList',
        '/client_list.html',
        '/status/lan.html',
        '/common_page/wifi_client_list_lua.lua',
        '/common_page/client_list_lua.lua',
    ];

    for (const url of candidates) {
        try {
            const fullUrl = url;
                
            const res = await routerGet(fullUrl, pass);
            if (url.includes('accessdev')) {
                log(`[DEBUG] accessdev response: status=${res.status}, data.length=${res.data?.length}, start=${res.data?.substring(0,50)}`);
            }
            if (res.status === 200 && res.data && !res.data.includes('SessionTimeout')) {
                const clients = parseClientList(res.data, url);
                if (url.includes('accessdev')) {
                    log(`[DEBUG] parseClientList returned ${clients.length} clients`);
                }
                if (clients.length > 0) {
                    log(`✅ ${clients.length} clientes obtenidos desde ${url}`);
                    return clients;
                }
            }
        } catch (e) {
            log(`[DEBUG] Candidate ${url} error: ${e.message}`);
            // Probar siguiente candidato
        }
    }

    // Fallback: intentar parsear la página principal de estado
    log('⚠️ No se pudo obtener lista de clientes del router. Usando fallback ARP.');
    return [];
}

function parseClientList(data, url) {
    const clients = [];

    // Caso 1: respuesta JSON
    if (typeof data === 'object') {
        const arr = data.clients || data.devices || data.stations || data.list || (Array.isArray(data) ? data : []);
        for (const item of arr) {
            clients.push({
                mac:    (item.mac || item.MAC || item.macAddress || '').toUpperCase(),
                ip:     item.ip || item.IP || item.ipAddress || '—',
                name:   item.name || item.hostname || item.Name || '',
                band:   item.band || item.frequency || item.radio || 'Wi-Fi',
                signal: item.rssi || item.signal || item.RSSI || null,
                speed:  item.txRate || item.rxRate || item.speed || null,
            });
        }
        return clients.filter(c => c.mac);
    }

    // Caso 1.5: respuesta XML de F6705 (OBJ_ACCESSDEV_ID)
    if (typeof data === 'string' && data.includes('<OBJ_ACCESSDEV_ID>')) {
        const instances = data.split('<Instance>');
        for (let i = 1; i < instances.length; i++) {
            const inst = instances[i];
            const getVal = (name) => {
                const regex = new RegExp(`<ParaName>${name}</ParaName>.*?<ParaValue>(.*?)</ParaValue>`, 'i');
                const match = inst.match(regex);
                return match ? match[1] : '';
            };
            const mac = getVal('_LuQUID_MACAddress').toUpperCase();
            if (mac) {
                clients.push({
                    mac,
                    ip: getVal('_LuQUID_IPAddress') || '—',
                    name: getVal('_LuQUID_HostName') || 'Dispositivo',
                    band: getVal('AccessMode') === 'WLAN' ? 'Wi-Fi' : 'Ethernet',
                    signal: null,
                    speed: null
                });
            }
        }
        return clients;
    }

    // Caso 2: respuesta HTML
    const $ = cheerio.load(data);

    // Patrón A: tabla con MACs
    $('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;
        const texts = cells.map((_, td) => $(td).text().trim()).get();

        // Buscar celda con MAC (formato xx:xx:xx:xx:xx:xx)
        const macCell = texts.find(t => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(t));
        if (!macCell) return;

        const macIdx = texts.indexOf(macCell);
        clients.push({
            mac:    macCell.toUpperCase(),
            ip:     texts.find(t => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t)) || '—',
            name:   texts[macIdx > 0 ? macIdx - 1 : macIdx + 1] || '',
            band:   texts.find(t => t.includes('GHz') || t.includes('2.4') || t.includes('5G')) || 'Wi-Fi',
            signal: null,
            speed:  null,
        });
    });

    // Patrón B: JavaScript embebido con arrays de datos
    if (clients.length === 0) {
        const macRegex = /([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/g;
        const ipRegex  = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
        const macs = (data.match(macRegex) || []).map(m => m.toUpperCase());
        const ips  = (data.match(ipRegex)  || []).filter(ip => !ip.startsWith('255') && !ip.startsWith('192.168.1.1'));

        const seen = new Set();
        macs.forEach((mac, i) => {
            if (seen.has(mac)) return;
            seen.add(mac);
            clients.push({ mac, ip: ips[i] || '—', name: '', band: 'Wi-Fi', signal: null, speed: null });
        });
    }

    return clients;
}

// ─────────────────────────────────────────────
// 3. BLOQUEO / DESBLOQUEO DE MAC
// ─────────────────────────────────────────────

/**
 * Bloquea una dirección MAC en el router.
 */
async function blockMac(mac, pass) {
    log(`Bloqueando MAC: ${mac}`);
    await ensureSession(pass);

    const strategies = [
        // ZTE F6705 — filtro de acceso inalámbrico (MAC Filter)
        async () => {
            const safeMac = mac.replace(/:/g, '');
            const payload = `IF_ACTION=Apply&Name:MACFilter=Nexus_${safeMac}&Type=Route&select_protocol=ALL&_InstID=-1&SrcMacAddr=${mac}&_sessionTOKEN=${_session.token || ''}`;
            return await routerPost('/?_type=menuData&_tag=firewall_macfilterv3_lua.lua', payload, pass);
        },
        // Legacy
        () => routerPost('/goform/setMacFilter', {
            action: 'add',
            macAddress: mac,
            filterMode: 'deny',
        }, pass),
        // Formato alternativo
        () => routerPost('/goform/wlan_mac_filter', {
            mac: mac,
            type: 'block',
            op: 'add',
        }, pass),
        // Formato JSON API
        async () => {
            await ensureSession(pass);
            return http.post('/api/mac_filter', { mac, action: 'block' }, {
                headers: { 'Cookie': _session.cookie, 'Content-Type': 'application/json' },
            });
        },
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ MAC ${mac} bloqueada (estrategia ${i + 1})`);
                return { success: true, method: `strategy_${i + 1}` };
            }
        } catch (e) {
            log(`Estrategia ${i + 1} de bloqueo falló: ${e.message}`);
        }
    }

    return { success: false, error: 'No se pudo bloquear. Comprueba los logs del router.' };
}

/**
 * Desbloquea una dirección MAC.
 */
async function unblockMac(mac, pass) {
    log(`Desbloqueando MAC: ${mac}`);
    await ensureSession(pass);

    const strategies = [
        () => routerPost('/goform/setMacFilter', { action: 'delete', macAddress: mac }, pass),
        () => routerPost('/goform/wlan_mac_filter', { mac, type: 'block', op: 'del' }, pass),
        async () => {
            return http.post('/api/mac_filter', { mac, action: 'unblock' }, {
                headers: { 'Cookie': _session.cookie, 'Content-Type': 'application/json' },
            });
        },
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ MAC ${mac} desbloqueada (estrategia ${i + 1})`);
                return { success: true };
            }
        } catch (e) {}
    }

    return { success: false, error: 'No se pudo desbloquear.' };
}

/**
 * Obtiene la lista de MACs bloqueadas actualmente.
 */
async function getBlockedMacs(pass) {
    await ensureSession(pass);
    const candidates = [
        '/mac_filter.html',
        '/wlan_mac_filter.html',
        '/goform/getMacFilter',
    ];

    for (const url of candidates) {
        try {
            const res = await routerGet(url, pass);
            if (res.status === 200) {
                const macRegex = /([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/gi;
                const macs = (res.data.toString().match(macRegex) || []).map(m => m.toUpperCase());
                if (macs.length > 0) return [...new Set(macs)];
            }
        } catch (e) {}
    }
    return [];
}

// ─────────────────────────────────────────────
// 4. CONTROL WI-FI — Encender / Apagar bandas
// ─────────────────────────────────────────────

/**
 * Controla el estado del Wi-Fi.
 * @param {boolean} enable - true=encender, false=apagar
 * @param {string} band - '2.4', '5', '6', 'all'
 */
async function setWifiState(enable, band = 'all', pass) {
    log(`${enable ? 'Encendiendo' : 'Apagando'} Wi-Fi banda ${band}...`);
    await ensureSession(pass);

    const bandMap = { '2.4': '0', '5': '1', '6': '2', 'all': 'all' };
    const radioId = bandMap[band] || 'all';
    const stateVal = enable ? '1' : '0';

    const strategies = [
        () => routerPost('/goform/setWlanBasicCfg', {
            wlanEnable: stateVal,
            radioId: radioId === 'all' ? '0' : radioId,
        }, pass),
        () => routerPost('/goform/wlan_config', {
            enable: stateVal,
            radio: radioId,
        }, pass),
        async () => {
            return http.post('/api/wifi/switch', { enable, band: radioId }, {
                headers: { 'Cookie': _session.cookie, 'Content-Type': 'application/json' },
            });
        },
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ Wi-Fi ${enable ? 'encendido' : 'apagado'} (estrategia ${i + 1})`);
                return { success: true, state: enable, band };
            }
        } catch (e) {}
    }
    return { success: false, error: 'No se pudo cambiar el estado del Wi-Fi.' };
}

/**
 * Obtiene el estado actual del Wi-Fi por banda.
 */
async function getWifiStatus(pass) {
    await ensureSession(pass);
    const candidates = [
        '/goform/getWlanBasicCfg',
        '/wlan_basic.html',
        '/wifi_status.html',
        '/common_page/wifi_info_lua.lua',
    ];

    for (const url of candidates) {
        try {
            const res = await routerGet(url, pass);
            if (res.status === 200 && res.data) {
                return parseWifiStatus(res.data);
            }
        } catch (e) {}
    }
    return { bands: [], ssid: 'Desconocido', enabled: null };
}

function parseWifiStatus(data) {
    if (typeof data === 'object') {
        return {
            bands: data.bands || [],
            ssid: data.ssid || data.SSID || '',
            enabled: data.enable === '1' || data.enabled === true,
        };
    }
    const $ = cheerio.load(data);
    const ssid = $('input[name*="ssid"], input[name*="SSID"]').first().val() || '';
    const enabled = $('input[name*="enable"][checked]').length > 0;
    return { ssid, enabled, bands: [] };
}

// ─────────────────────────────────────────────
// 5. QoS — Límite de ancho de banda por MAC
// ─────────────────────────────────────────────

/**
 * Establece límite de velocidad para un dispositivo.
 * @param {string} mac - Dirección MAC del dispositivo
 * @param {number} downMbps - Límite de bajada en Mbps (0 = sin límite)
 * @param {number} upMbps - Límite de subida en Mbps (0 = sin límite)
 */
async function setQoS(mac, downMbps, upMbps, pass) {
    log(`Aplicando QoS a ${mac}: ↓${downMbps} Mbps ↑${upMbps} Mbps`);
    await ensureSession(pass);

    // Convertir a kbps (unidad usada por ZTE)
    const downKbps = downMbps * 1000;
    const upKbps   = upMbps   * 1000;

    const strategies = [
        () => routerPost('/goform/setQos', {
            mac,
            downBandwidth: downKbps.toString(),
            upBandwidth:   upKbps.toString(),
            enable: (downMbps > 0 || upMbps > 0) ? '1' : '0',
        }, pass),
        () => routerPost('/goform/bandwidth_ctrl', {
            macAddress: mac,
            maxDownload: downKbps.toString(),
            maxUpload:   upKbps.toString(),
        }, pass),
        async () => {
            return http.post('/api/qos', { mac, downMbps, upMbps }, {
                headers: { 'Cookie': _session.cookie, 'Content-Type': 'application/json' },
            });
        },
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ QoS aplicado a ${mac} (estrategia ${i + 1})`);
                return { success: true, mac, downMbps, upMbps };
            }
        } catch (e) {}
    }
    return { success: false, error: 'No se pudo aplicar QoS. Puede que tu firmware no lo soporte.' };
}

/**
 * Elimina el límite de QoS para un dispositivo.
 */
async function removeQoS(mac, pass) {
    return setQoS(mac, 0, 0, pass);
}

// ─────────────────────────────────────────────
// 6. PORT FORWARDING
// ─────────────────────────────────────────────

/**
 * Obtiene las reglas de port forwarding activas.
 */
async function getPortForwarding(pass) {
    await ensureSession(pass);
    const candidates = [
        '/goform/getPortForwarding',
        '/port_forwarding.html',
        '/nat_forwarding.html',
        '/virtual_server.html',
        '/common_page/nat_forwarding_lua.lua',
    ];

    for (const url of candidates) {
        try {
            const res = await routerGet(url, pass);
            if (res.status === 200 && res.data) {
                const rules = parsePortForwardingRules(res.data);
                if (rules) return rules;
            }
        } catch (e) {}
    }
    return [];
}

function parsePortForwardingRules(data) {
    if (typeof data === 'object') {
        return (data.rules || data.list || (Array.isArray(data) ? data : [])).map(r => ({
            name:       r.name || r.description || '',
            protocol:   r.protocol || r.proto || 'TCP',
            externalPort: r.externalPort || r.extPort || r.port || '',
            internalPort: r.internalPort || r.intPort || r.port || '',
            internalIp:   r.internalIp || r.ip || '',
            enabled:    r.enabled !== false,
        }));
    }

    const $ = cheerio.load(data);
    const rules = [];
    $('tr').each((_, row) => {
        const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
        if (cells.length >= 3) {
            const ipMatch = cells.find(c => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(c));
            const portMatch = cells.find(c => /^\d{1,5}(-\d{1,5})?$/.test(c));
            if (ipMatch && portMatch) {
                rules.push({
                    name: cells[0] || '',
                    protocol: cells.find(c => /^(TCP|UDP|BOTH|ALL)/i.test(c)) || 'TCP',
                    externalPort: portMatch,
                    internalPort: portMatch,
                    internalIp: ipMatch,
                    enabled: true,
                });
            }
        }
    });
    return rules;
}

/**
 * Añade una regla de port forwarding.
 */
async function addPortForwarding({ name, protocol = 'TCP', externalPort, internalPort, internalIp, enabled = true }, pass) {
    log(`Añadiendo port forwarding: ${externalPort} → ${internalIp}:${internalPort}`);
    await ensureSession(pass);

    const strategies = [
        () => routerPost('/goform/setPortForwarding', {
            action: 'add',
            ruleName: name,
            protocol: protocol.toUpperCase(),
            externalPort: externalPort.toString(),
            internalPort: (internalPort || externalPort).toString(),
            internalIp,
            enable: enabled ? '1' : '0',
        }, pass),
        () => routerPost('/goform/nat_forward', {
            op: 'add',
            name,
            proto: protocol,
            sport: externalPort.toString(),
            dport: (internalPort || externalPort).toString(),
            ip: internalIp,
        }, pass),
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ Port forwarding ${externalPort}→${internalIp}:${internalPort} añadido`);
                return { success: true };
            }
        } catch (e) {}
    }
    return { success: false, error: 'No se pudo añadir la regla.' };
}

/**
 * Elimina una regla de port forwarding.
 */
async function deletePortForwarding(index, pass) {
    await ensureSession(pass);
    try {
        const res = await routerPost('/goform/setPortForwarding', {
            action: 'delete',
            index: index.toString(),
        }, pass);
        return { success: res.status < 400 };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// ─────────────────────────────────────────────
// 7. REINICIO DEL ROUTER
// ─────────────────────────────────────────────

/**
 * Reinicia el router remotamente.
 * ⚠️ El servidor perderá conectividad ~30 segundos.
 */
async function reboot(pass) {
    log('⚠️ Enviando comando de reinicio al router...');
    await ensureSession(pass);

    const strategies = [
        () => routerPost('/goform/reboot', { reboot: '1' }, pass),
        () => routerPost('/goform/restart', { restart: '1' }, pass),
        () => routerPost('/boaform/admin/formSysCmd', { sysCmd: 'reboot', submit: 'Apply' }, pass),
        () => routerGet('/reboot.html', pass),
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            const res = await strategies[i]();
            if (res.status < 400) {
                log(`✅ Reinicio enviado (estrategia ${i + 1})`);
                // Invalidar sesión (el router se reiniciará)
                _session.cookie = null;
                _session.loginTime = 0;
                return { success: true, message: 'Router reiniciando. Espera ~30-60 segundos.' };
            }
        } catch (e) {}
    }
    return { success: false, error: 'No se pudo enviar el comando de reinicio.' };
}

// ─────────────────────────────────────────────
// 8. ESTADÍSTICAS — Tráfico del router
// ─────────────────────────────────────────────

/**
 * Obtiene las estadísticas de tráfico del router.
 */
async function getTrafficStats(pass) {
    await ensureSession(pass);
    const candidates = [
        '/goform/getTrafficStats',
        '/status_internet.html',
        '/wan_status.html',
        '/common_page/wan_info_lua.lua',
    ];

    for (const url of candidates) {
        try {
            const res = await routerGet(url, pass);
            if (res.status === 200 && res.data) {
                return parseTrafficStats(res.data);
            }
        } catch (e) {}
    }
    return { rxBytes: 0, txBytes: 0, uptime: 'N/A' };
}

function parseTrafficStats(data) {
    if (typeof data === 'object') {
        return {
            rxBytes: parseInt(data.rxBytes || data.download || 0),
            txBytes: parseInt(data.txBytes || data.upload   || 0),
            uptime:  data.uptime || data.sysUpTime || 'N/A',
        };
    }
    const rxMatch = data.match(/rx[\s_-]*bytes[^0-9]*([0-9]+)/i);
    const txMatch = data.match(/tx[\s_-]*bytes[^0-9]*([0-9]+)/i);
    return {
        rxBytes: rxMatch ? parseInt(rxMatch[1]) : 0,
        txBytes: txMatch ? parseInt(txMatch[1]) : 0,
        uptime: 'N/A',
    };
}

// ─────────────────────────────────────────────
// 9. TEST DE CONECTIVIDAD
// ─────────────────────────────────────────────

/**
 * Verifica si el router es accesible y hace un test de login.
 */
async function testConnection(pass) {
    try {
        const res = await http.get('/login.html', { timeout: 5000, validateStatus: () => true });
        if (res.status === 0 || res.status >= 500) {
            return { reachable: false, loggedIn: false, error: 'Router no accesible' };
        }

        await login(pass);
        return { reachable: true, loggedIn: true, model: _session.model };
    } catch (e) {
        return { reachable: false, loggedIn: false, error: e.message };
    }
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
    login,
    testConnection,
    getWifiClients,
    blockMac,
    unblockMac,
    getBlockedMacs,
    setWifiState,
    getWifiStatus,
    setQoS,
    removeQoS,
    getPortForwarding,
    addPortForwarding,
    deletePortForwarding,
    reboot,
    getTrafficStats,
    routerGet,
    routerPost,
    _session
};
