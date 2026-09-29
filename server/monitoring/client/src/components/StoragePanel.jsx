import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { HardDrive, RotateCw, Database, Search, X, Folder, Server } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function DiskScannerModal({ mount, onClose }) {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);
  const boxRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(boxRef.current,
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)' }
    );

    fetch('/api/system/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: mount })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setResults(data);
        setScanning(false);
      })
      .catch(err => {
        setError(err.message);
        setScanning(false);
      });
  }, [mount]);

  useEffect(() => {
    if (!scanning && results.length > 0 && listRef.current) {
      gsap.fromTo(listRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [scanning, results]);

  const close = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(boxRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, onComplete: onClose });
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={close} style={{ opacity: 0, zIndex: 100 }}>
      <div ref={boxRef} className="modal-box" onClick={e => e.stopPropagation()} style={{ opacity: 0, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} color="var(--cyan)" /> Uso de disco: {mount}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={close}><X size={14} /></button>
        </div>

        {scanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
            <RotateCw size={32} className="spin" color="var(--purple)" />
            <div style={{ color: 'var(--text-muted)' }}>Analizando carpetas más pesadas...</div>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ color: 'var(--red)' }}>Error: {error}</div>
        ) : (
          <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
            {results.map((item, i) => {
              const isRoot = i === 0 && item.name === mount;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: isRoot ? 'rgba(139,127,247,0.1)' : 'rgba(255,255,255,0.03)',
                  borderRadius: 10, border: isRoot ? '1px solid rgba(139,127,247,0.2)' : '1px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                    <Folder size={16} color={isRoot ? "var(--purple)" : "var(--text-dim)"} />
                    <div style={{ fontWeight: isRoot ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                  </div>
                  <div className="badge badge-gray" style={{ minWidth: 60, textAlign: 'center', fontWeight: 700, color: 'var(--cyan)' }}>
                    {item.size}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoragePanel() {
  const [data, setData] = useState(null);
  const [appsStorage, setAppsStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanMount, setScanMount] = useState(null);
  
  const gridRef = useRef(null);
  const hwRef = useRef(null);
  const appsRef = useRef(null);

  const fetchDisk = async () => {
    setLoading(true);
    try {
      const [resDisk, resApps] = await Promise.all([
        fetch('/api/system/disk'),
        fetch('/api/system/apps-storage')
      ]);
      const jsonDisk = await resDisk.json();
      const jsonApps = await resApps.json();
      setData(jsonDisk);
      setAppsStorage(jsonApps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisk();
  }, []);

  useEffect(() => {
    if (!loading && data) {
      const tl = gsap.timeline();
      if (hwRef.current) {
        tl.fromTo(hwRef.current.children,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
      }
      if (gridRef.current) {
        tl.fromTo(gridRef.current.children,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)' },
          '-=0.3'
        );
      }
      if (appsRef.current) {
        tl.fromTo(appsRef.current.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
          '-=0.2'
        );
      }
    }
  }, [loading, data]);

  if (loading && !data) return <div className="empty-state">Cargando métricas de almacenamiento...</div>;
  if (!data || !data.partitions) return <div className="empty-state">No se pudo cargar el almacenamiento.</div>;

  const getColors = (pct) => {
    if (pct > 90) return ['var(--red)', 'rgba(244,63,94,0.1)'];
    if (pct > 75) return ['var(--amber)', 'rgba(245,158,11,0.1)'];
    return ['var(--green)', 'rgba(16,211,127,0.1)'];
  };

  const DonutTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, fill } = payload[0];
    return (
      <div style={{ background: 'rgba(5,8,20,0.9)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}>
        <span style={{ color: fill, fontWeight: 600 }}>{name}:</span> {formatBytes(value)}
      </div>
    );
  };

  return (
    <div>
      {scanMount && <DiskScannerModal mount={scanMount} onClose={() => setScanMount(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} color="var(--purple)" /> Discos Físicos & Particiones
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={fetchDisk} disabled={loading}>
          <RotateCw size={14} className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      {data.diskLayout && data.diskLayout.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 12 }}>Hardware Instalado</h3>
          <div ref={hwRef} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {data.diskLayout.map((disk, i) => (
              <div key={i} className="panel" style={{ flex: '1 1 300px', padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(139,127,247,0.1)', padding: 12, borderRadius: 12 }}>
                  <HardDrive size={24} color="var(--purple)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{disk.name || disk.device}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{disk.vendor} {disk.type} • {formatBytes(disk.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 12 }}>Particiones Lógicas</h3>
      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {data.partitions.map((part, i) => {
          const colors = getColors(part.use);
          const chartData = [
            { name: 'Usado', value: part.used },
            { name: 'Libre', value: part.available || (part.size - part.used) }
          ];

          return (
            <div key={i} className="panel" style={{ padding: '24px 20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{part.mount}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{part.fs} ({part.type})</div>
                </div>
                <div style={{ background: colors[1], color: colors[0], padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                  {part.use.toFixed(1)}%
                </div>
              </div>

              <div style={{ height: 160, marginTop: 16, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<DonutTooltip />} />
                    <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive={false}>
                      <Cell fill={colors[0]} />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Total</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{formatBytes(part.size)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Usado</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{formatBytes(part.used)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Disponible</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{formatBytes(part.available || (part.size - part.used))}</div>
                </div>
              </div>
              
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => setScanMount(part.mount)}
              >
                <Search size={14} /> Analizar Uso
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Apps Storage ─── */}
      {appsStorage && appsStorage.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 12 }}>
            Espacio Ocupado por Aplicaciones (PM2)
          </h3>
          <div ref={appsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {appsStorage.map((appNode, i) => (
              <div key={i} className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Server size={16} color="var(--pink)" />
                    {appNode.apps.join(', ')}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {appNode.path}
                  </div>
                </div>
                <div className="badge badge-gray" style={{ minWidth: 64, textAlign: 'center', fontWeight: 700, color: 'var(--cyan)' }}>
                  {appNode.size}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
