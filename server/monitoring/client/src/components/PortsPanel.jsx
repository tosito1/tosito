import React, { useState, useEffect, useRef } from 'react';
import { Network, RotateCw, Shield, Globe, Server, Database, Cable } from 'lucide-react';
import gsap from 'gsap';

const KNOWN_PORTS = {
  22:   { name: 'SSH', color: 'var(--cyan)' },
  80:   { name: 'HTTP', color: 'var(--green)' },
  443:  { name: 'HTTPS', color: 'var(--green)' },
  3000: { name: 'Node.js', color: 'var(--purple)' },
  3001: { name: 'Node.js', color: 'var(--purple)' },
  4000: { name: 'NexusMon', color: 'var(--pink)' },
  3306: { name: 'MySQL', color: 'var(--amber)' },
  5432: { name: 'PostgreSQL', color: 'var(--amber)' },
  6379: { name: 'Redis', color: 'var(--red)' },
  27017:{ name: 'MongoDB', color: 'var(--green)' },
  53:   { name: 'DNS', color: 'var(--cyan)' },
  5353: { name: 'mDNS', color: 'var(--purple)' },
};

function getServiceBadge(port, process) {
  const p = parseInt(port, 10);
  const known = KNOWN_PORTS[p];
  if (known) {
    return (
      <span className="badge" style={{ background: `${known.color}20`, color: known.color, borderColor: `${known.color}40` }}>
        {known.name}
      </span>
    );
  }
  // Try to guess by process name
  if (process && process !== '-' && process !== 'unknown') {
    return <span className="badge badge-gray">{process.split(' ')[0]}</span>;
  }
  return <span className="badge badge-gray">Desconocido</span>;
}

export default function PortsPanel() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('LISTEN'); // LISTEN or ESTABLISHED
  
  const cardsRef = useRef(null);
  const tableRef = useRef(null);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/ports');
      const data = await res.json();
      setConnections(data);
    } catch (err) {
      console.error(err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  // Animate entries when data or filter changes
  useEffect(() => {
    if (!loading && connections.length > 0) {
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
        );
      }
      if (tableRef.current) {
        const rows = tableRef.current.querySelectorAll('tbody tr');
        gsap.fromTo(rows,
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
        );
      }
    }
  }, [loading, filter, connections.length]);

  const listening = connections.filter(c => c.state === 'LISTEN' || c.protocol === 'udp');
  const established = connections.filter(c => c.state === 'ESTABLISHED');
  
  const displayData = filter === 'LISTEN' ? listening : established;

  const tcpCount = connections.filter(c => c.protocol && c.protocol.startsWith('tcp')).length;
  const udpCount = connections.filter(c => c.protocol && c.protocol.startsWith('udp')).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12 }}>
          <button 
            className={`btn ${filter === 'LISTEN' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setFilter('LISTEN')}
          >
            <Shield size={14} /> Escuchando ({listening.length})
          </button>
          <button 
            className={`btn ${filter === 'ESTABLISHED' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setFilter('ESTABLISHED')}
          >
            <Cable size={14} /> Activos ({established.length})
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchPorts} disabled={loading}>
          <RotateCw size={14} className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'rgba(139,127,247,0.1)', padding: 12, borderRadius: 12 }}><Shield size={20} color="var(--purple)" /></div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Puertos Abiertos</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{listening.length}</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'rgba(16,211,127,0.1)', padding: 12, borderRadius: 12 }}><Cable size={20} color="var(--green)" /></div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Conexiones Activas</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{established.length}</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'rgba(34,211,238,0.1)', padding: 12, borderRadius: 12 }}><Network size={20} color="var(--cyan)" /></div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>TCP / UDP</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{tcpCount} <span style={{fontSize:16, color:'var(--text-muted)'}}>/ {udpCount}</span></div>
          </div>
        </div>
      </div>

      {/* ─── Connections Table ─── */}
      <div className="panel">
        <div className="panel-body">
          {loading && connections.length === 0 ? (
            <div className="empty-state">Escaneando red...</div>
          ) : displayData.length === 0 ? (
            <div className="empty-state">No hay conexiones en este estado.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" ref={tableRef}>
                <thead>
                  <tr>
                    <th>Puerto</th>
                    <th>Servicio</th>
                    <th>Protocolo</th>
                    <th>Dirección Local</th>
                    {filter === 'ESTABLISHED' && <th>Destino (Peer)</th>}
                    <th>Estado</th>
                    <th>Proceso / PID</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((conn, i) => (
                    <tr key={`${conn.localPort}-${conn.protocol}-${i}`}>
                      <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{conn.localPort}</td>
                      <td>{getServiceBadge(conn.localPort, conn.process)}</td>
                      <td>
                        <span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                          {conn.protocol}
                        </span>
                      </td>
                      <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>{conn.localAddress}</td>
                      {filter === 'ESTABLISHED' && (
                        <td className="mono" style={{ color: 'var(--text)', fontSize: 12 }}>
                          {conn.peerAddress}:{conn.peerPort}
                        </td>
                      )}
                      <td>
                        <span className={`badge ${conn.state === 'LISTEN' ? 'badge-purple' : conn.state === 'ESTABLISHED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                          {conn.state || 'ACTIVO'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{conn.process !== '-' && conn.process ? conn.process : 'Desconocido'}</span>
                          {conn.pid !== '-' && <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>PID: {conn.pid}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
