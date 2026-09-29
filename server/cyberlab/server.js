require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const multer     = require('multer');

// ─── Modules v1 ────────────────────────────────────────────────────────────────
const nmapMod    = require('./modules/nmap');
const zapMod     = require('./modules/zap');
const msfMod     = require('./modules/metasploit');
const johnMod    = require('./modules/john');
const hcMod      = require('./modules/hashcat');

// ─── Modules v2 ────────────────────────────────────────────────────────────────
const sqlmapMod  = require('./modules/sqlmap');
const gobusterMod= require('./modules/gobuster');
const niktoMod   = require('./modules/nikto');
const hydraMod   = require('./modules/hydra');
const harvMod    = require('./modules/theharvester');
const subfMod    = require('./modules/subfinder');
const nucleiMod  = require('./modules/nuclei');
const cmeMod     = require('./modules/crackmapexec');
const e4lMod     = require('./modules/enum4linux');
const tsharkMod  = require('./modules/tshark');

// ─── Modules v3 ────────────────────────────────────────────────────────────────
const rustscanMod= require('./modules/rustscan');
const feroxbusterMod= require('./modules/feroxbuster');
const netexecMod = require('./modules/netexec');
const impacketMod= require('./modules/impacket');
const bloodhoundMod= require('./modules/bloodhound');
const peassMod   = require('./modules/peass');
const trufflehogMod= require('./modules/trufflehog');
const gitleaksMod= require('./modules/gitleaks');
const gitrobMod  = require('./modules/gitrob');

// ─── Utility modules ──────────────────────────────────────────────────────────
const historyMod = require('./modules/history');
const reportMod  = require('./modules/report');
const wordlistMod= require('./modules/wordlist');
const hashIdMod  = require('./modules/hashidentifier');

const app  = express();
const PORT = process.env.PORT || 3100;
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── SSE Helpers ───────────────────────────────────────────────────────────────
function initSSE(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
}
function sse(res, event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── History helper ────────────────────────────────────────────────────────────
function trackRun(tool, target, command, flags = '') {
    return historyMod.addEntry({ tool, target, command, flags, status: 'running' });
}
function trackDone(id, code, summary = '') {
    historyMod.updateEntry(id, { status: code === 0 ? 'done' : 'error', summary });
}

// ══════════════════════════════════════════════════════════════════════════════
//   NMAP
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/nmap/scan', (req, res) => {
    const { target, flags } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('nmap', target, `nmap ${flags} ${target}`, flags);
    sse(res, 'start', { message: `Iniciando nmap sobre ${target}` });
    const lines = [];
    nmapMod.scan(target, flags || '-sV -T4', (line) => { sse(res, 'output', { line }); lines.push(line); }, (code) => {
        trackDone(hId, code, `${lines.filter(l => /open/.test(l)).length} puertos abiertos`);
        sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/nmap/templates', (req, res) => res.json(nmapMod.templates));

// ══════════════════════════════════════════════════════════════════════════════
//   SQLMAP
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/sqlmap/scan', (req, res) => {
    const { url, options } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    initSSE(res);
    const hId = trackRun('sqlmap', url, `sqlmap -u ${url}`);
    sse(res, 'start', { message: `Iniciando SQLMap sobre ${url}` });
    sqlmapMod.scan(url, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/sqlmap/techniques', (req, res) => res.json(sqlmapMod.techniques));

// ══════════════════════════════════════════════════════════════════════════════
//   GOBUSTER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/gobuster/fuzz', (req, res) => {
    const { mode, url, wordlist, options } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    initSSE(res);
    const hId = trackRun('gobuster', url, `gobuster ${mode} -u ${url} -w ${wordlist || 'common.txt'}`);
    sse(res, 'start', { message: `Gobuster ${mode} sobre ${url}` });
    gobusterMod.fuzz(mode || 'dir', url, wordlist, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/gobuster/modes',     (req, res) => res.json(gobusterMod.modes));
app.get('/api/gobuster/wordlists', (req, res) => res.json(gobusterMod.commonWordlists));

// ══════════════════════════════════════════════════════════════════════════════
//   NIKTO
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/nikto/scan', (req, res) => {
    const { target, options } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('nikto', target, `nikto -h ${target}`);
    sse(res, 'start', { message: `Nikto scan sobre ${target}` });
    niktoMod.scan(target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/nikto/tuning', (req, res) => res.json(niktoMod.tuningOptions));

// ══════════════════════════════════════════════════════════════════════════════
//   HYDRA
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/hydra/attack', upload.fields([
    { name: 'userlist', maxCount: 1 },
    { name: 'passlist', maxCount: 1 },
]), (req, res) => {
    const { target, service, options: optsRaw } = req.body;
    if (!target || !service) return res.status(400).json({ error: 'Target y service requeridos' });
    const options = typeof optsRaw === 'string' ? JSON.parse(optsRaw) : (optsRaw || {});
    if (req.files?.userlist?.[0]) options.userlist = req.files.userlist[0].path;
    if (req.files?.passlist?.[0]) options.passlist = req.files.passlist[0].path;
    initSSE(res);
    const hId = trackRun('hydra', target, `hydra -l ... ${target} ${service}`);
    sse(res, 'start', { message: `Hydra atacando ${service} en ${target}` });
    hydraMod.attack(target, service, options, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/hydra/services', (req, res) => res.json(hydraMod.services));

// ══════════════════════════════════════════════════════════════════════════════
//   THEHARVESTER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/theharvester/harvest', (req, res) => {
    const { domain, sources, options } = req.body;
    if (!domain) return res.status(400).json({ error: 'Dominio requerido' });
    initSSE(res);
    const hId = trackRun('theharvester', domain, `theHarvester -d ${domain}`);
    sse(res, 'start', { message: `theHarvester recopilando info de ${domain}` });
    harvMod.harvest(domain, sources || ['google','bing','crtsh'], options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/theharvester/sources', (req, res) => res.json(harvMod.availableSources));

// ══════════════════════════════════════════════════════════════════════════════
//   SUBFINDER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/subfinder/enumerate', (req, res) => {
    const { domain, options } = req.body;
    if (!domain) return res.status(400).json({ error: 'Dominio requerido' });
    initSSE(res);
    const hId = trackRun('subfinder', domain, `subfinder -d ${domain}`);
    sse(res, 'start', { message: `Subfinder enumerando ${domain}` });
    subfMod.enumerate(domain, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//   NUCLEI
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/nuclei/scan', (req, res) => {
    const { target, options } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('nuclei', target, `nuclei -u ${target}`);
    sse(res, 'start', { message: `Nuclei scan sobre ${target}` });
    nucleiMod.scan(target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/nuclei/tags', (req, res) => res.json(nucleiMod.templateTags));

// ══════════════════════════════════════════════════════════════════════════════
//   CRACKMAPEXEC
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/cme/run', (req, res) => {
    const { protocol, target, options } = req.body;
    if (!protocol || !target) return res.status(400).json({ error: 'Protocol y target requeridos' });
    initSSE(res);
    const hId = trackRun('crackmapexec', target, `crackmapexec ${protocol} ${target}`);
    sse(res, 'start', { message: `CrackMapExec (${protocol}) sobre ${target}` });
    cmeMod.run(protocol, target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/cme/protocols', (req, res) => res.json(cmeMod.protocols));

// ══════════════════════════════════════════════════════════════════════════════
//   ENUM4LINUX
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/enum4linux/enumerate', (req, res) => {
    const { target, options } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('enum4linux', target, `enum4linux -a ${target}`);
    sse(res, 'start', { message: `enum4linux enumerando ${target}` });
    e4lMod.enumerate(target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//   TSHARK
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/tshark/capture', (req, res) => {
    const { options } = req.body;
    initSSE(res);
    const hId = trackRun('tshark', options?.interface || 'any', `tshark -i ${options?.interface || 'any'}`);
    sse(res, 'start', { message: `tshark capturando en interfaz ${options?.interface || 'any'}` });
    tsharkMod.capture(options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/tshark/interfaces', (req, res) => {
    tsharkMod.listInterfaces(ifaces => res.json(ifaces));
});
app.get('/api/tshark/filters', (req, res) => res.json(tsharkMod.commonFilters));

// ══════════════════════════════════════════════════════════════════════════════
//   RUSTSCAN (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/rustscan/scan', (req, res) => {
    const { target, options } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('rustscan', target, `rustscan -a ${target}`);
    sse(res, 'start', { message: `Iniciando RustScan sobre ${target}` });
    rustscanMod.scan(target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/rustscan/presets', (req, res) => res.json(rustscanMod.presets));

// ══════════════════════════════════════════════════════════════════════════════
//   FEROXBUSTER (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/feroxbuster/fuzz', (req, res) => {
    const { url, options } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    initSSE(res);
    const hId = trackRun('feroxbuster', url, `feroxbuster -u ${url}`);
    sse(res, 'start', { message: `Feroxbuster sobre ${url}` });
    feroxbusterMod.fuzz(url, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/feroxbuster/wordlists', (req, res) => res.json(feroxbusterMod.wordlistSuggestions));

// ══════════════════════════════════════════════════════════════════════════════
//   NETEXEC (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/netexec/run', (req, res) => {
    const { protocol, target, options } = req.body;
    if (!protocol || !target) return res.status(400).json({ error: 'Protocol y target requeridos' });
    initSSE(res);
    const hId = trackRun('netexec', target, `nxc ${protocol} ${target}`);
    sse(res, 'start', { message: `NetExec (${protocol}) sobre ${target}` });
    netexecMod.run(protocol, target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/netexec/protocols', (req, res) => res.json(netexecMod.protocols));
app.get('/api/netexec/modules', (req, res) => res.json(netexecMod.popularModules));

// ══════════════════════════════════════════════════════════════════════════════
//   IMPACKET SUITE (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/impacket/:tool', (req, res) => {
    const { tool } = req.params;
    const { target, options, command, share } = req.body;
    if (!target && !['rpcdump'].includes(tool)) return res.status(400).json({ error: 'Target requerido' });
    
    initSSE(res);
    const hId = trackRun(`impacket_${tool}`, target, `${tool}.py ${target}`);
    sse(res, 'start', { message: `Impacket ${tool} sobre ${target}` });
    
    const onLine = (line) => sse(res, 'output', { line });
    const onDone = (code) => { trackDone(hId, code); sse(res, 'done', { code }); res.end(); };
    
    switch(tool) {
        case 'secretsdump': impacketMod.secretsdump(target, options||{}, onLine, onDone); break;
        case 'psexec':      impacketMod.psexec(target, command, options||{}, onLine, onDone); break;
        case 'wmiexec':     impacketMod.wmiexec(target, command, options||{}, onLine, onDone); break;
        case 'getUserSPNs': impacketMod.getUserSPNs(target, options||{}, onLine, onDone); break;
        case 'getNPUsers':  impacketMod.getNPUsers(target, options||{}, onLine, onDone); break;
        case 'rpcdump':     impacketMod.rpcdump(target, options||{}, onLine, onDone); break;
        case 'lookupsid':   impacketMod.lookupsid(target, options||{}, onLine, onDone); break;
        case 'smbclient':   impacketMod.smbclient(target, share, options||{}, onLine, onDone); break;
        default: res.end();
    }
});
app.get('/api/impacket/tools', (req, res) => res.json(impacketMod.tools));

// ══════════════════════════════════════════════════════════════════════════════
//   BLOODHOUND (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/bloodhound/collect', (req, res) => {
    const { domain, dc, options } = req.body;
    if (!domain || !dc) return res.status(400).json({ error: 'Domain y DC requeridos' });
    initSSE(res);
    const hId = trackRun('bloodhound', domain, `bloodhound-python -d ${domain} -dc ${dc}`);
    sse(res, 'start', { message: `BloodHound recolección en ${domain}` });
    bloodhoundMod.collect(domain, dc, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/bloodhound/methods', (req, res) => res.json(bloodhoundMod.collectionMethods));

// ══════════════════════════════════════════════════════════════════════════════
//   PEASS-ng (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/peass/serve', (req, res) => {
    const { os, port } = req.body;
    initSSE(res);
    const hId = trackRun('peass_serve', `HTTP :${port || 8000}`, `python3 -m http.server ${port || 8000}`);
    sse(res, 'start', { message: `Sirviendo script PEASS para ${os || 'linux'}` });
    peassMod.serveScript(os || 'linux', port, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/peass/commands', (req, res) => res.json(peassMod.generateCommands(req.query.os || 'linux', req.query.lhost || '10.0.0.1')));
app.get('/api/peass/categories', (req, res) => res.json(peassMod.checkCategories));

// ══════════════════════════════════════════════════════════════════════════════
//   TRUFFLEHOG (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/trufflehog/scan', (req, res) => {
    const { source, target, options } = req.body;
    if (!source || !target) return res.status(400).json({ error: 'Source y target requeridos' });
    initSSE(res);
    const hId = trackRun('trufflehog', target, `trufflehog ${source} ${target}`);
    sse(res, 'start', { message: `TruffleHog escaneando ${target}` });
    trufflehogMod.scan(source, target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/trufflehog/sources', (req, res) => res.json(trufflehogMod.sources));

// ══════════════════════════════════════════════════════════════════════════════
//   GITLEAKS (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/gitleaks/scan', (req, res) => {
    const { source, target, options } = req.body;
    initSSE(res);
    const hId = trackRun('gitleaks', target || source, `gitleaks ${source || 'detect'}`);
    sse(res, 'start', { message: `Gitleaks escaneando ${target || source}` });
    gitleaksMod.scan(source, target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/gitleaks/modes', (req, res) => res.json(gitleaksMod.modes));
app.get('/api/gitleaks/rules', (req, res) => res.json(gitleaksMod.defaultRules));

// ══════════════════════════════════════════════════════════════════════════════
//   GITROB (v3)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/gitrob/scan', (req, res) => {
    const { target, options } = req.body;
    if (!target) return res.status(400).json({ error: 'Target requerido' });
    initSSE(res);
    const hId = trackRun('gitrob', target, `gitrob ${target}`);
    sse(res, 'start', { message: `Gitrob escaneando ${target}` });
    gitrobMod.scan(target, options || {}, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/gitrob/patterns', (req, res) => res.json(gitrobMod.sensitiveFilePatterns));

// ══════════════════════════════════════════════════════════════════════════════
//   OWASP ZAP  (v1 — preservado)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/zap/spider', async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Target URL requerida' });
    initSSE(res);
    const hId = trackRun('zap', target, `zap spider ${target}`);
    sse(res, 'start', { message: `ZAP Spider sobre ${target}` });
    try {
        await zapMod.ensureRunning();
        const scanId = await zapMod.spider(target);
        sse(res, 'output', { line: `Spider ID: ${scanId}` });
        const poll = setInterval(async () => {
            const p = await zapMod.spiderProgress(scanId);
            sse(res, 'progress', { progress: p });
            if (parseInt(p) >= 100) { clearInterval(poll); trackDone(hId, 0); sse(res, 'done', { code: 0 }); res.end(); }
        }, 2000);
    } catch (err) { trackDone(hId, 1, err.message); sse(res, 'error', { message: err.message }); res.end(); }
});
app.post('/api/zap/activescan', async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Target URL requerida' });
    initSSE(res);
    const hId = trackRun('zap', target, `zap activescan ${target}`);
    sse(res, 'start', { message: `ZAP Active Scan sobre ${target}` });
    try {
        await zapMod.ensureRunning();
        const scanId = await zapMod.activeScan(target);
        sse(res, 'output', { line: `Active Scan ID: ${scanId}` });
        const poll = setInterval(async () => {
            const p = await zapMod.activeScanProgress(scanId);
            sse(res, 'progress', { progress: p });
            if (parseInt(p) >= 100) { clearInterval(poll); trackDone(hId, 0); sse(res, 'done', { code: 0 }); res.end(); }
        }, 3000);
    } catch (err) { trackDone(hId, 1); sse(res, 'error', { message: err.message }); res.end(); }
});
app.get('/api/zap/alerts',  async (req, res) => { try { await zapMod.ensureRunning(); res.json(await zapMod.getAlerts(req.query.baseurl || '')); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/zap/status',  async (req, res) => res.json({ running: await zapMod.isRunning() }));
app.post('/api/zap/start',  async (req, res) => { initSSE(res); try { await zapMod.start(l => sse(res, 'output', { line: l })); sse(res, 'done', { message: 'ZAP listo' }); res.end(); } catch (e) { sse(res, 'error', { message: e.message }); res.end(); } });

// ══════════════════════════════════════════════════════════════════════════════
//   METASPLOIT (v1)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/metasploit/run', (req, res) => {
    const { commands } = req.body;
    if (!commands) return res.status(400).json({ error: 'commands requeridos' });
    initSSE(res);
    const hId = trackRun('metasploit', '', commands[0] || '');
    sse(res, 'start', { message: 'Iniciando msfconsole...' });
    msfMod.runCommands(commands, (line) => sse(res, 'output', { line }), (code) => {
        trackDone(hId, code); sse(res, 'done', { code }); res.end();
    });
});
app.get('/api/metasploit/modules/search', (req, res) => {
    msfMod.searchModules(req.query.q || '', results => res.json(results));
});

// ══════════════════════════════════════════════════════════════════════════════
//   JOHN & HASHCAT (v1)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/john/crack', upload.fields([{ name: 'hashfile', maxCount: 1 }, { name: 'wordlist', maxCount: 1 }]), (req, res) => {
    const hp = req.files?.hashfile?.[0]?.path; if (!hp) return res.status(400).json({ error: 'hashfile requerido' });
    const wp = req.files?.wordlist?.[0]?.path; const { format } = req.body;
    initSSE(res);
    const hId = trackRun('john', hp, `john ${hp}`);
    sse(res, 'start', { message: 'John the Ripper iniciado...' });
    johnMod.crack(hp, wp, format, l => sse(res, 'output', { line: l }), code => { trackDone(hId, code); sse(res, 'done', { code }); res.end(); });
});
app.post('/api/john/show', upload.single('hashfile'), (req, res) => {
    const hp = req.file?.path; if (!hp) return res.status(400).json({ error: 'hashfile requerido' });
    johnMod.show(hp, req.body.format, r => res.json(r));
});
app.post('/api/hashcat/crack', upload.fields([{ name: 'hashfile', maxCount: 1 }, { name: 'wordlist', maxCount: 1 }]), (req, res) => {
    const hp = req.files?.hashfile?.[0]?.path; if (!hp) return res.status(400).json({ error: 'hashfile requerido' });
    const wp = req.files?.wordlist?.[0]?.path; const { mode, attackMode, mask, rules } = req.body;
    initSSE(res);
    const hId = trackRun('hashcat', hp, `hashcat -m ${mode} -a ${attackMode} ${hp}`);
    sse(res, 'start', { message: `Hashcat modo ${mode} iniciado...` });
    hcMod.crack(hp, wp, mode, attackMode, mask, rules, l => sse(res, 'output', { line: l }), code => { trackDone(hId, code); sse(res, 'done', { code }); res.end(); });
});
app.get('/api/hashcat/modes', (req, res) => res.json(hcMod.hashModes));

// ══════════════════════════════════════════════════════════════════════════════
//   HASH IDENTIFIER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/hashid/identify', (req, res) => {
    const { hash } = req.body;
    if (!hash) return res.status(400).json({ error: 'hash requerido' });
    res.json(hashIdMod.identify(hash));
});
app.get('/api/hashid/sample', (req, res) => {
    const sample = hashIdMod.generateSample(req.query.type);
    res.json({ sample });
});

// ══════════════════════════════════════════════════════════════════════════════
//   WORDLIST MANAGER
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/wordlists/list',     (req, res) => res.json(wordlistMod.list(req.query.root)));
app.get('/api/wordlists/wellknown',(req, res) => res.json(wordlistMod.wellKnown));
app.get('/api/wordlists/preview',  (req, res) => {
    const { path: p, lines } = req.query;
    if (!p) return res.status(400).json({ error: 'path requerido' });
    res.json(wordlistMod.preview(p, parseInt(lines) || 20));
});

// ══════════════════════════════════════════════════════════════════════════════
//   HISTORY
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/history',         (req, res) => res.json(historyMod.getAll(req.query)));
app.delete('/api/history/:id',  (req, res) => { historyMod.deleteEntry(req.params.id); res.json({ ok: true }); });
app.delete('/api/history',      (req, res) => { historyMod.clear(); res.json({ ok: true }); });

// ══════════════════════════════════════════════════════════════════════════════
//   REPORT GENERATOR
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/report/html', (req, res) => {
    const html = reportMod.generateHTML({
        title:  req.query.title  || 'CyberLab — Informe de Seguridad',
        author: req.query.author || 'CyberLab',
        scope:  req.query.scope  || 'No especificado',
    });
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="cyberlab-report-${Date.now()}.html"`);
    res.send(html);
});

// ══════════════════════════════════════════════════════════════════════════════
//   HEALTH
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    res.json({
        status:  'ok',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        tools: [
            'nmap','sqlmap','gobuster','nikto','hydra','theharvester','subfinder',
            'nuclei','crackmapexec','enum4linux','tshark','zap','metasploit',
            'john','hashcat', 'rustscan', 'feroxbuster', 'netexec', 'impacket',
            'bloodhound', 'peass', 'trufflehog', 'gitleaks', 'gitrob'
        ],
    });
});

// ─── Serve SPA ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\x1b[32m[CyberLab v3.0] Backend en http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[36m[Tools] 24 herramientas de seguridad cargadas (incluyendo AD & Git hunting)\x1b[0m`);
    if (process.env.ZAP_AUTO_START === 'true') {
        zapMod.ensureRunning().catch(e => console.warn('[ZAP] Auto-start failed:', e.message));
    }
});
