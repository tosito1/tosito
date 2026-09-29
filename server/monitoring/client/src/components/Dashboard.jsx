import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Cpu, MemoryStick, Activity, HardDrive, Thermometer, Clock, TrendingUp, Zap } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

/* ── Recharts custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,8,20,0.96)', border: '1px solid rgba(139,127,247,0.2)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#eef2ff'
    }}>
      <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}{p.unit || ''}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Area chart gradient defs ── */
const GRADS = [
  { id: 'gCpu', color: '#8b7ff7' },
  { id: 'gMem', color: '#10d37f' },
  { id: 'gRx',  color: '#22d3ee' },
  { id: 'gTx',  color: '#f472b6' },
  { id: 'gDR',  color: '#c084fc' },
  { id: 'gDW',  color: '#f97316' },
];

function GradDefs() {
  return (
    <defs>
      {GRADS.map(g => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={g.color} stopOpacity={0.35} />
          <stop offset="95%" stopColor={g.color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  );
}

function formatBytes(b) {
  if (!b) return '0 B';
  const gb = b / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(b / 1024 / 1024).toFixed(0)} MB`;
}

function formatUptime(s) {
  if (!s) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

/* ── Animated SVG progress ring ── */
function Ring({ pct, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" className="ring-svg">
      <circle className="ring-bg" cx="34" cy="34" r={r} />
      <circle
        className="ring-fill"
        cx="34" cy="34" r={r}
        stroke={color}
        style={{
          strokeDasharray: circ,
          strokeDashoffset: circ - (circ * Math.min(pct, 100)) / 100
        }}
      />
    </svg>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, unit, sub, color, ringColor, icon, pct, accent }) {
  const cardRef = useRef(null);

  // Subtle float animation
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: '-=4', duration: 3 + Math.random() * 2,
      yoyo: true, repeat: -1, ease: 'sine.inOut',
      delay: Math.random() * 2
    });
  }, []);

  return (
    <div ref={cardRef} className={`panel stat-card ${accent}`} data-animate>
      <div className="card-orb" />
      <div className="ring-wrap">
        <Ring pct={pct ?? 0} color={ringColor} />
      </div>
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value" style={{ color }}>
        <AnimatedNumber value={value} decimals={1} />
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-sub">{sub}</div>
      <div className="progress-track">
        <div className={`progress-fill fill-${accent}`} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats }) {
  const [history, setHistory] = useState([]);
  const gridRef = useRef(null);
  const chartsRef = useRef(null);
  const procsRef = useRef(null);

  /* GSAP entrance on mount */
  useEffect(() => {
    const tl = gsap.timeline();
    if (gridRef.current) {
      tl.fromTo(gridRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0,  scale: 1, duration: 0.55, stagger: 0.1, ease: 'power3.out' }
      );
    }
    if (chartsRef.current) {
      tl.fromTo(chartsRef.current.children,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        '-=0.3'
      );
    }
    if (procsRef.current) {
      tl.fromTo(procsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        '-=0.2'
      );
    }
  }, []);

  useEffect(() => {
    if (!stats) return;
    const now = new Date();
    const label = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setHistory(prev => {
      const point = {
        t:    label,
        cpu:  parseFloat((stats.cpu?.load ?? 0).toFixed(1)),
        mem:  stats.mem ? parseFloat(((stats.mem.active / stats.mem.total) * 100).toFixed(1)) : 0,
        diskR: stats.disk ? parseFloat((stats.disk.rx_sec / 1024 / 1024).toFixed(2)) : 0,
        diskW: stats.disk ? parseFloat((stats.disk.wx_sec / 1024 / 1024).toFixed(2)) : 0,
        netR:  stats.network ? parseFloat((stats.network.rx_sec / 1024).toFixed(1)) : 0,
        netT:  stats.network ? parseFloat((stats.network.tx_sec / 1024).toFixed(1)) : 0,
      };
      const next = [...prev, point];
      return next.length > 30 ? next.slice(-30) : next;
    });
  }, [stats]);

  if (!stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '45vh', gap: 16, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 36 }}>🖥️</div>
        <div>Conectando con el servidor...</div>
      </div>
    );
  }

  const cpuPct  = parseFloat((stats.cpu?.load ?? 0).toFixed(1));
  const memPct  = stats.mem ? parseFloat(((stats.mem.active / stats.mem.total) * 100).toFixed(1)) : 0;
  const tempVal = stats.temp ?? null;
  const cores   = stats.cpu?.cores ?? [];

  const CHART_AXIS = { fill: 'var(--text-dim)', fontSize: 10 };
  const LEGEND = { wrapperStyle: { fontSize: 11, color: 'var(--text-muted)' } };

  return (
    <div>
      {/* ─── Stat Cards ─── */}
      <div className="stats-grid" ref={gridRef}>
        <StatCard
          accent="purple" ringColor="var(--purple)"
          color={cpuPct > 80 ? 'var(--red)' : 'var(--purple)'}
          label={<><Cpu size={12} style={{marginRight:4}}/> CPU Load</>}
          value={cpuPct} unit="%" pct={cpuPct}
          sub={`${cores.length} núcleos detectados`}
          icon={null}
        />
        <StatCard
          accent="green" ringColor="var(--green)"
          color={memPct > 85 ? 'var(--red)' : 'var(--green)'}
          label={<><MemoryStick size={12} style={{marginRight:4}}/> Memoria</>}
          value={memPct} unit="%" pct={memPct}
          sub={`${formatBytes(stats.mem?.active)} / ${formatBytes(stats.mem?.total)}`}
        />
        <StatCard
          accent="amber" ringColor="var(--amber)"
          color={tempVal > 75 ? 'var(--red)' : 'var(--amber)'}
          label={<><Thermometer size={12} style={{marginRight:4}}/> Temp CPU</>}
          value={tempVal ?? 0} unit="°C" pct={tempVal ? (tempVal / 100) * 100 : 0}
          sub={tempVal > 75 ? '⚠ Alta temperatura' : 'Normal'}
        />
        <div className="panel stat-card cyan" data-animate>
          <div className="card-orb" />
          <div className="stat-label"><Clock size={12} style={{marginRight:4}}/> Uptime</div>
          <div className="stat-value" style={{ color: 'var(--cyan)', fontSize: 22, letterSpacing: '-0.5px' }}>
            {formatUptime(stats.uptime)}
          </div>
          <div className="stat-sub">Servidor en línea</div>
          <div className="progress-track" style={{ marginTop: 20 }}>
            <div className="progress-fill fill-cyan" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ─── Charts ─── */}
      <div className="chart-grid" ref={chartsRef}>
        <div className="panel" data-animate>
          <div className="panel-header">
            <div className="panel-title"><Cpu size={13}/> CPU & Memoria</div>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={history}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={CHART_AXIS} />
                <YAxis domain={[0,100]} tick={CHART_AXIS} unit="%" />
                <Tooltip content={<ChartTooltip />} />
                <Legend {...LEGEND} />
                <Area type="monotone" dataKey="cpu" name="CPU" unit="%" stroke="var(--purple)" fill="url(#gCpu)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="mem" name="Mem" unit="%" stroke="var(--green)"  fill="url(#gMem)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel" data-animate>
          <div className="panel-header">
            <div className="panel-title"><Activity size={13}/> Red ({stats.network?.iface})</div>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={history}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={CHART_AXIS} />
                <YAxis tick={CHART_AXIS} unit="KB/s" />
                <Tooltip content={<ChartTooltip />} />
                <Legend {...LEGEND} />
                <Area type="monotone" dataKey="netR" name="↓ RX" unit=" KB/s" stroke="var(--cyan)" fill="url(#gRx)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="netT" name="↑ TX" unit=" KB/s" stroke="var(--pink)" fill="url(#gTx)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel" data-animate>
          <div className="panel-header">
            <div className="panel-title"><HardDrive size={13}/> Disk I/O</div>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={history}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={CHART_AXIS} />
                <YAxis tick={CHART_AXIS} unit=" MB/s" />
                <Tooltip content={<ChartTooltip />} />
                <Legend {...LEGEND} />
                <Area type="monotone" dataKey="diskR" name="Read"  unit=" MB/s" stroke="#c084fc" fill="url(#gDR)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="diskW" name="Write" unit=" MB/s" stroke="#f97316" fill="url(#gDW)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPU Cores */}
        <div className="panel" data-animate>
          <div className="panel-header">
            <div className="panel-title"><Zap size={13}/> Núcleos del CPU ({cores.length})</div>
          </div>
          <div className="panel-body">
            <div className="cores-grid">
              {cores.map((load, i) => {
                const col = load > 80 ? 'var(--red)' : load > 50 ? 'var(--amber)' : 'var(--green)';
                const bg  = load > 80 ? 'var(--red)' : load > 50 ? 'var(--amber)' : 'var(--purple)';
                return (
                  <div key={i} className="core-block">
                    <div className="core-fill" style={{ height: `${load}%`, background: bg }} />
                    <div className="core-num">C{i}</div>
                    <div className="core-val" style={{ color: col }}>{load.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top Processes ─── */}
      <div className="panel" ref={procsRef} style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div className="panel-title"><TrendingUp size={13}/> Top Procesos del Sistema</div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Actualización cada 2s</span>
        </div>
        <div className="panel-body">
          {stats.processes?.length ? (
            <table className="data-table">
              <thead>
                <tr><th>PID</th><th>Proceso</th><th>Usuario</th><th>CPU %</th><th>RAM %</th></tr>
              </thead>
              <tbody>
                {stats.processes.map(p => (
                  <tr key={p.pid}>
                    <td className="mono" style={{ color: 'var(--text-dim)' }}>{p.pid}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.user}</td>
                    <td>
                      <span style={{ color: p.cpu > 50 ? 'var(--red)' : p.cpu > 20 ? 'var(--amber)' : 'var(--green)', fontWeight: 700 }}>
                        {p.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.mem.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">Cargando procesos...</p>}
        </div>
      </div>
    </div>
  );
}
