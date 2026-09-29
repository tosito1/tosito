const fs = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const HIST_FILE = path.join(DATA_DIR, 'history.json');

// Asegurar que el directorio data existe
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let history = [];

// Cargar historial persistente
function load() {
    try {
        if (fs.existsSync(HIST_FILE)) {
            history = JSON.parse(fs.readFileSync(HIST_FILE, 'utf8'));
        }
    } catch { history = []; }
}

function save() {
    try {
        fs.writeFileSync(HIST_FILE, JSON.stringify(history, null, 2));
    } catch {}
}

load();

/**
 * Añade una entrada al historial.
 * @param {object} entry - { tool, target, command, flags, summary }
 */
function addEntry(entry) {
    const record = {
        id:        Date.now(),
        timestamp: new Date().toISOString(),
        tool:      entry.tool,
        target:    entry.target || '',
        command:   entry.command || '',
        flags:     entry.flags  || '',
        summary:   entry.summary || '',
        status:    entry.status || 'running',
    };
    history.unshift(record);               // más reciente primero
    if (history.length > 500) history.pop(); // máximo 500 entradas
    save();
    return record.id;
}

/**
 * Actualiza el estado/resumen de una entrada por id.
 */
function updateEntry(id, patch) {
    const idx = history.findIndex(e => e.id === id);
    if (idx !== -1) {
        Object.assign(history[idx], patch);
        save();
    }
}

/** Devuelve el historial completo (o filtrado). */
function getAll(filter = {}) {
    let result = [...history];
    if (filter.tool)   result = result.filter(e => e.tool === filter.tool);
    if (filter.target) result = result.filter(e => e.target.includes(filter.target));
    if (filter.limit)  result = result.slice(0, parseInt(filter.limit));
    return result;
}

/** Elimina una entrada por id. */
function deleteEntry(id) {
    history = history.filter(e => e.id !== parseInt(id));
    save();
}

/** Limpia todo el historial. */
function clear() {
    history = [];
    save();
}

module.exports = { addEntry, updateEntry, getAll, deleteEntry, clear };
