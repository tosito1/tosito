const wol = require('wake_on_lan');

function wakeDevice(macAddress) {
    return new Promise((resolve, reject) => {
        if (!macAddress) {
            return reject(new Error('No MAC address provided'));
        }
        
        wol.wake(macAddress, (error) => {
            if (error) {
                console.error(`Error sending Magic Packet to ${macAddress}:`, error);
                reject(error);
            } else {
                console.log(`Magic Packet sent successfully to ${macAddress}`);
                resolve(true);
            }
        });
    });
}

module.exports = {
    wakeDevice
};
