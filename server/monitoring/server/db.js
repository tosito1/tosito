const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/metrics.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cpu_load REAL,
        mem_used INTEGER,
        mem_total INTEGER,
        net_rx INTEGER,
        net_tx INTEGER,
        disk_rx INTEGER,
        disk_wx INTEGER,
        cpu_temp REAL
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics(timestamp);

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        value REAL,
        acknowledged INTEGER DEFAULT 0
      );
    `);
  }
  return db;
}

function insertMetric(stats) {
  const db = getDb();
  db.prepare(`
    INSERT INTO metrics (timestamp, cpu_load, mem_used, mem_total, net_rx, net_tx, disk_rx, disk_wx, cpu_temp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Date.now(),
    stats.cpu?.load ?? null,
    stats.mem?.active ?? null,
    stats.mem?.total ?? null,
    stats.network?.rx_sec ?? null,
    stats.network?.tx_sec ?? null,
    stats.disk?.rx_sec ?? null,
    stats.disk?.wx_sec ?? null,
    stats.temp ?? null
  );

  // Cleanup old data > 24h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  db.prepare('DELETE FROM metrics WHERE timestamp < ?').run(cutoff);
}

function getHistory(hours = 1) {
  const db = getDb();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return db.prepare('SELECT * FROM metrics WHERE timestamp > ? ORDER BY timestamp ASC').all(cutoff);
}

function insertAlert(type, message, value) {
  const db = getDb();
  db.prepare('INSERT INTO alerts (timestamp, type, message, value) VALUES (?, ?, ?, ?)').run(Date.now(), type, message, value);
}

function getAlerts(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function acknowledgeAlert(id) {
  const db = getDb();
  db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(id);
}

module.exports = { insertMetric, getHistory, insertAlert, getAlerts, acknowledgeAlert };
