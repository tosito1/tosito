import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) return console.error(err);
  db.run("UPDATE users SET role = 'admin' WHERE email = 'tosito@correo.com'", function(err) {
    if (err) console.error("Error updating user:", err);
    else console.log(`User updated, changes: ${this.changes}`);
    db.close();
  });
});
