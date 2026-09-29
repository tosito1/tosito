import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Thermometer, Cpu, MemoryStick } from 'lucide-react';

const TYPE_META = {
  cpu:  { icon: <Cpu size={16} />, color: 'var(--purple)', label: 'CPU' },
  mem:  { icon: <MemoryStick size={16} />, color: 'var(--green)', label: 'Memoria' },
  temp: { icon: <Thermometer size={16} />, color: 'var(--amber)', label: 'Temperatura' },
};

function fmtTime(ts) {
  return new Date(ts).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    try {
      const res = await fetch('/api/alerts/list');
      setAlerts(await res.json());
    } catch { setAlerts([]); } finally { setLoading(false); }
  };

  const ack = async (id) => {
    await fetch(`/api/alerts/acknowledge/${id}`, { method: 'POST' });
    fetch_();
  };

  const ackAll = async () => {
    await Promise.all(alerts.filter(a => !a.acknowledged).map(a => ack(a.id)));
  };

  useEffect(() => { fetch_(); const t = setInterval(fetch_, 10000); return () => clearInterval(t); }, []);

  if (loading) return <div className="empty-state">Cargando alertas...</div>;

  const unacked = alerts.filter(a => !a.acknowledged);

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {unacked.length > 0
            ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{unacked.length} alerta{unacked.length > 1 ? 's' : ''} sin reconocer</span>
            : <span style={{ color: 'var(--green)' }}>✓ Todo bajo control</span>}
        </div>
        {unacked.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={ackAll}><CheckCheck size={13} /> Reconocer todas</button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Bell size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)' }}>No hay alertas registradas</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Las alertas aparecen cuando CPU, Memoria o Temperatura superan los umbrales configurados.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(alert => {
            const meta = TYPE_META[alert.type] || { icon: <AlertTriangle size={16} />, color: 'var(--red)', label: alert.type };
            return (
              <div
                key={alert.id}
                className="panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  opacity: alert.acknowledged ? 0.45 : 1,
                  borderColor: alert.acknowledged ? 'var(--border)' : 'rgba(239,68,68,0.25)'
                }}
              >
                <div style={{ color: meta.color, flexShrink: 0 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 3, color: alert.acknowledged ? 'var(--text-muted)' : 'var(--text)' }}>
                    {meta.label}: {alert.value?.toFixed(1)}{alert.type === 'temp' ? '°C' : '%'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.message}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{fmtTime(alert.timestamp)}</div>
                {!alert.acknowledged && (
                  <button className="btn btn-ghost btn-sm" onClick={() => ack(alert.id)}>
                    <CheckCheck size={13} /> OK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
