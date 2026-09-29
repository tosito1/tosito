const history = require('./history');

/**
 * Genera un informe HTML completo y estilizado con todos los findings.
 * @param {object} options - { title, author, targetScope, includeTools }
 * @returns {string} HTML completo
 */
function generateHTML(options = {}) {
    const title  = options.title  || 'CyberLab — Informe de Seguridad';
    const author = options.author || 'CyberLab';
    const scope  = options.scope  || 'No especificado';
    const now    = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' });

    const entries = history.getAll({ limit: 200 });
    const byTool  = {};
    entries.forEach(e => {
        if (!byTool[e.tool]) byTool[e.tool] = [];
        byTool[e.tool].push(e);
    });

    const toolSections = Object.entries(byTool).map(([tool, items]) => `
        <section class="tool-section">
            <h2 class="tool-title">${tool.toUpperCase()}</h2>
            <table>
                <thead><tr>
                    <th>Timestamp</th><th>Target</th><th>Comando</th><th>Estado</th><th>Resumen</th>
                </tr></thead>
                <tbody>
                    ${items.map(i => `
                    <tr>
                        <td class="mono">${i.timestamp.slice(0,19).replace('T',' ')}</td>
                        <td class="mono">${i.target || '—'}</td>
                        <td class="mono">${i.command || '—'}</td>
                        <td><span class="badge ${i.status === 'done' ? 'badge-done' : i.status === 'error' ? 'badge-error' : 'badge-run'}">${i.status}</span></td>
                        <td>${i.summary || '—'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </section>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="author" content="${author}">
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #080b0f; color: #e8edf5; line-height: 1.6; }
    .cover { background: linear-gradient(135deg, #0d1117, #111720); border-bottom: 2px solid rgba(0,255,157,0.2); padding: 60px 80px; }
    .cover-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #00ff9d; margin-bottom: 16px; }
    .cover h1 { font-size: 40px; font-weight: 800; margin-bottom: 8px; }
    .cover .subtitle { font-size: 16px; color: #8899aa; }
    .meta { display: flex; gap: 40px; margin-top: 40px; }
    .meta-item label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #445566; }
    .meta-item span { display: block; font-size: 14px; font-weight: 600; margin-top: 2px; color: #e8edf5; }
    .container { max-width: 1100px; margin: 0 auto; padding: 60px 40px; }
    h2.section-title { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #445566; margin: 40px 0 16px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 40px; }
    .stat-card { background: #0d1117; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; }
    .stat-num { font-size: 32px; font-weight: 800; color: #00ff9d; }
    .stat-label { font-size: 12px; color: #8899aa; margin-top: 4px; }
    .tool-section { margin-bottom: 48px; }
    .tool-title { font-size: 14px; font-weight: 700; color: #00ff9d; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(0,255,157,0.15); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: rgba(255,255,255,0.04); padding: 10px 14px; text-align: left; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #8899aa; }
    tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); }
    tbody tr:hover { background: rgba(255,255,255,0.02); }
    td { padding: 10px 14px; vertical-align: top; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .badge-done  { background: rgba(0,255,157,0.15); color: #00ff9d; }
    .badge-error { background: rgba(255,42,95,0.15);  color: #ff2a5f; }
    .badge-run   { background: rgba(255,183,77,0.15); color: #ffb74d; }
    footer { text-align: center; padding: 40px; color: #445566; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.04); }
</style>
</head>
<body>
<div class="cover">
    <div class="cover-label">Informe de Seguridad · Confidencial</div>
    <h1>${title}</h1>
    <p class="subtitle">Generado automáticamente por CyberLab</p>
    <div class="meta">
        <div class="meta-item"><label>Generado</label><span>${now}</span></div>
        <div class="meta-item"><label>Autor</label><span>${author}</span></div>
        <div class="meta-item"><label>Alcance</label><span>${scope}</span></div>
        <div class="meta-item"><label>Total de operaciones</label><span>${entries.length}</span></div>
    </div>
</div>
<div class="container">
    <h2 class="section-title">Resumen por herramienta</h2>
    <div class="stats-grid">
        ${Object.entries(byTool).map(([t, items]) => `
        <div class="stat-card">
            <div class="stat-num">${items.length}</div>
            <div class="stat-label">${t}</div>
        </div>`).join('')}
    </div>
    <h2 class="section-title">Registro de operaciones</h2>
    ${toolSections || '<p style="color:#445566">Sin operaciones registradas</p>'}
</div>
<footer>CyberLab Security Research Platform &bull; Uso exclusivo en entornos autorizados</footer>
</body>
</html>`;
}

module.exports = { generateHTML };
