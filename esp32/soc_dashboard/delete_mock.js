const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'soc_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DELETE FROM networks WHERE ssid LIKE 'Router_%' OR ssid LIKE 'Ralink_%'", function(err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Filas borradas: ${this.changes}`);
        }
    });
});
