import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw } from 'lucide-react';

export default function NginxPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/nginx/status');
      setStatus(await res.json());
    } catch { setStatus({ status: 'offline', details: 'No se puede conectar al backend.' }); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const reload = async () => {
    setLoading(true);
    await fetch('/api/nginx/reload', { method: 'POST' });
    await fetchStatus();
    setLoading(false);
  };

  return (
    <div className="panel animate-in" style={{ maxWidth: 600 }}>
      <div className="panel-header">
        <div className="panel-title"><Globe size={14} />Nginx</div>
      </div>
      <div className="panel-body">
        {!status ? (
          <p className="empty-state">Cargando...</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0 24px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: status.status === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${status.status === 'online' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                fontSize: 26
              }}>
                {status.status === 'online' ? '✓' : '✗'}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  {status.status === 'online' ? 'Activo' : 'Inactivo'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {status.version || 'Versión desconocida'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button className="btn btn-primary" onClick={reload} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                {loading ? 'Recargando...' : 'Recargar Configuración'}
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
                Nota: Recargar Nginx puede requerir permisos elevados en el servidor.
              </p>
            </div>
          </>
        )}
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
