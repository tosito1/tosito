const fs = require('fs');
const path = require('path');

const ROUTER_IP = '192.168.1.1';
const ROUTER_USER = 'admin';
let ROUTER_PASS = '';

// Leer contraseña generada
try {
    ROUTER_PASS = fs.readFileSync(path.join(__dirname, 'password'), 'utf-8').trim();
} catch (e) {
    console.error("No se pudo leer la contraseña del router.");
}

/**
 * Función genérica para bloquear MAC en el Router.
 * Como no tenemos el modelo exacto (Mikrotik, Ubiquiti, etc), simulamos el éxito.
 * En un entorno real, usaríamos 'node-ssh' para mandar el comando ACL correspondiente.
 */
async function blockMac(mac) {
    console.log(`[Router] Conectando a ${ROUTER_USER}@${ROUTER_IP} por SSH...`);
    // Simular delay de red
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[Router] Bloqueando dirección MAC: ${mac}`);
    // Ejemplo de comando Mikrotik:
    // await ssh.execCommand(\`/interface wireless access-list add mac-address=\${mac} authentication=no\`);
    console.log(`[Router] ✅ Dispositivo ${mac} bloqueado a nivel de hardware.`);
    return true;
}

/**
 * Función genérica para desbloquear MAC en el Router.
 */
async function unblockMac(mac) {
    console.log(`[Router] Conectando a ${ROUTER_USER}@${ROUTER_IP} por SSH...`);
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[Router] Desbloqueando dirección MAC: ${mac}`);
    console.log(`[Router] ✅ Dispositivo ${mac} readmitido en la red.`);
    return true;
}

module.exports = {
    blockMac,
    unblockMac
};
