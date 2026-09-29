const { exec } = require('child_process');

async function getStatus() {
    return new Promise((resolve) => {
        // Ejecutar comando para obtener IP de Tailscale
        exec('tailscale ip -4', (error, stdout, stderr) => {
            if (error) {
                // Tailscale no está instalado o no está en ejecución
                return resolve({
                    active: false,
                    ip: null,
                    error: 'Tailscale no está instalado o no está activo.'
                });
            }

            const ip = stdout.trim();
            if (ip) {
                return resolve({
                    active: true,
                    ip: ip
                });
            } else {
                return resolve({
                    active: false,
                    ip: null,
                    error: 'No se pudo obtener la IP de Tailscale.'
                });
            }
        });
    });
}

module.exports = {
    getStatus
};
