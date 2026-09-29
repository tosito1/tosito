const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'soc_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Ralink Router (Pixie Dust Vulnerable)
    db.run(`INSERT OR REPLACE INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, wps_manufacturer, wps_model, wps_device_name, wps_method, max_rssi) 
            VALUES ('11:22:33:44:55:66', 'Ralink_Pixie', 'Unknown', 0, 0, 1, 0, 'Ralink Technology, Corp.', 'RT2860', 'RalinkAPS', 'PIN', -40)`);
            
    // Push Button Router (Seguro Remoto)
    db.run(`INSERT OR REPLACE INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, wps_manufacturer, wps_model, wps_device_name, wps_method, max_rssi) 
            VALUES ('AA:BB:CC:DD:EE:33', 'Router_Push_Button', 'Cisco', 0, 0, 1, 0, 'Cisco Systems', 'Linksys E1200', 'Cisco Router', 'Push Button', -55)`);
            
    // Standard PIN Vulnerable
    db.run(`INSERT OR REPLACE INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, wps_manufacturer, wps_model, wps_device_name, wps_method, max_rssi) 
            VALUES ('11:11:11:11:11:11', 'Router_Normal_PIN', 'TP-Link', 0, 0, 1, 0, 'TP-Link Technologies Co.,Ltd.', 'TL-WR841N', 'Wireless Router', 'PIN', -30)`);
});

setTimeout(() => {
    console.log('Mock Deep DPI WPS data inserted. You can delete this file.');
}, 500);
