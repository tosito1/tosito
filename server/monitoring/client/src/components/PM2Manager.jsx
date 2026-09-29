import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Play, Square, RotateCw, FileText, X } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    online:   { cls: 'badge-green', dot: 'dot-green', label: 'Online' },
    stopped:  { cls: 'badge-red',   dot: 'dot-red',   label: 'Detenido' },
    errored:  { cls: 'badge-red',   dot: 'dot-red',   label: 'Error' },
    stopping: { cls: 'badge-amber', dot: 'dot-amber', label: 'Parando' },
  };
  const s = map[status] || { cls: 'badge-amber', dot: 'dot-amber', label: status };
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`status-dot ${s.dot}`} />
      {s.label}
    </span>
  );
}

function LogsModal({ app, onClose }) {
  const [logs, setLogs] = useState('Cargando logs...');
  const logRef   = useRef(null);
  const boxRef   = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    fetch(`/api/pm2/logs/${encodeURIComponent(app.name)}?lines=100`)
      .then(r => r.json())
      .then(d => setLogs(d.logs || 'Sin logs disponibles'))
      .catch(() => setLogs('Error al cargar logs'));
  }, [app.name]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  /* GSAP entrance */
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(boxRef.current,
      { opacity: 0, scale: 0.92, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' }
    );
  }, []);

  const close = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(boxRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, onComplete: onClose });
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={close} style={{ opacity: 0 }}>
      <div ref={boxRef} className="modal-box" onClick={e => e.stopPropagation()} style={{ opacity: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--purple)" /> Logs — {app.name}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={close}><X size={14} /></button>
        </div>
        <div ref={logRef} className="log-terminal">{logs}</div>
      </div>
    </div>
  );
}

export default function PM2Manager() {
  const [apps, setApps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [logApp, setLogApp] = useState(null);
  const [pending, setPending] = useState({});
  const tableRef = useRef(null);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/pm2/list');
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchApps();
    const t = setInterval(fetchApps, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!loading && tableRef.current) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      gsap.fromTo(rows,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const doAction = async (id, action) => {
    setPending(p => ({ ...p, [id]: action }));
    await fetch('/api/pm2/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    await fetchApps();
    setPending(p => { const n = { ...p }; delete n[id]; return n; });
  };

  return (
    <>
      {logApp && <LogsModal app={logApp} onClose={() => setLogApp(null)} />}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Procesos PM2</div>
          <button className="btn btn-ghost btn-sm" onClick={fetchApps}>
            <RotateCw size={13} /> Actualizar
          </button>
        </div>
        <div className="panel-body">
          {loading
            ? <p className="empty-state">Cargando...</p>
            : apps.length === 0
              ? <p className="empty-state">No se encontraron procesos PM2.</p>
              : (
                <table className="data-table" ref={tableRef}>
                  <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Estado</th><th>CPU</th><th>Memoria</th><th>Reinicios</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {apps.map(app => (
                      <tr key={app.id}>
                        <td className="mono" style={{ color: 'var(--text-dim)' }}>{app.id}</td>
                        <td style={{ fontWeight: 600 }}>{app.name}</td>
                        <td><StatusBadge status={app.status} /></td>
                        <td>
                          <span style={{ color: app.cpu > 50 ? 'var(--red)' : 'var(--text)', fontWeight: 600 }}>
                            {(app.cpu || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td>{app.memory ? `${(app.memory / 1024 / 1024).toFixed(1)} MB` : '—'}</td>
                        <td>
                          <span style={{ color: app.restarts > 5 ? 'var(--amber)' : 'var(--text-muted)' }}>
                            {app.restarts}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            {app.status !== 'online'
                              ? <button className="btn btn-success btn-sm" disabled={!!pending[app.id]}
                                  onClick={() => doAction(app.id, 'start')}>
                                  <Play size={11} /> {pending[app.id] === 'start' ? '...' : 'Iniciar'}
                                </button>
                              : <button className="btn btn-danger btn-sm" disabled={!!pending[app.id]}
                                  onClick={() => doAction(app.id, 'stop')}>
                                  <Square size={11} /> {pending[app.id] === 'stop' ? '...' : 'Parar'}
                                </button>
                            }
                            <button className="btn btn-warning btn-sm" disabled={!!pending[app.id]}
                              onClick={() => doAction(app.id, 'restart')}>
                              <RotateCw size={11} className={pending[app.id] === 'restart' ? 'spin' : ''} />
                              {pending[app.id] === 'restart' ? '...' : 'Restart'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setLogApp(app)}>
                              <FileText size={11} /> Logs
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>
    </>
  );
}
