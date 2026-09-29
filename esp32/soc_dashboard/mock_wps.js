const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'soc_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Insert vulnerable AP
    db.run(`INSERT OR REPLACE INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, max_rssi) 
            VALUES ('AA:BB:CC:DD:EE:11', 'Router_Victima_WPS', 'TP-Link Technologies Co.,Ltd.', 0, 0, 1, 0, -45)`);
            
    // Insert locked AP
    db.run(`INSERT OR REPLACE INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, max_rssi) 
            VALUES ('AA:BB:CC:DD:EE:22', 'Router_Bloqueado_WPS', 'Cisco Systems, Inc', 0, 0, 1, 1, -60)`);
});

setTimeout(() => {
    console.log('Mock WPS data inserted. You can delete this file.');
}, 500);
