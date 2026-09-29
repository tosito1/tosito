import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wine, Cigarette, Zap, AlertTriangle, Pizza, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDailyHabits, saveDailyHabits, saveUserData, getUserData, logGroupSin, unlockBadge } from '../lib/dataService';
import gsap from 'gsap';

const QUICK_SINS = [
  { id: 'beer',     icon: '🍺', label: 'Birra',    color: '#f59e0b', penalty: -0.5, msg: 'acaba de zamparse otra birra. Peligro.' },
  { id: 'spirits',  icon: '🥃', label: 'Cubata',   color: '#ef4444', penalty: -1.5, msg: 'va por los cubatas. Que alguien le quite el vaso.' },
  { id: 'tobacco',  icon: '🚬', label: 'Cigarro',  color: '#94a3b8', penalty: -0.8, msg: 'está ahumando sus pulmones en modo fiesta.' },
  { id: 'cocaine',  icon: '❄️', label: 'Tirito',   color: '#e2e8f0', penalty: -3.0, msg: 'acaba de ir al baño con las llaves. Houston tenemos un problema.' },
  { id: 'cannabis', icon: '🌿', label: 'Porro',    color: '#22c55e', penalty: -1.5, msg: 'tiene los ojos como dos tomates. Modo sofá activado.' },
  { id: 'junkfood', icon: '🍔', label: 'Munchies', color: '#f97316', penalty: -1.0, msg: 'se está dando un atracón postfiesta sin vergüenza.' },
  { id: 'mdma',     icon: '💊', label: 'Pastilla', color: '#a855f7', penalty: -2.5, msg: 'quiere abrazar a todo el mundo. Efecto pastilla.' },
  { id: 'hangover', icon: '💀', label: 'Resaca',   color: '#64748b', penalty: -2.0, msg: 'ya está en modo zombie. La resaca ha llegado.' },
];

const PartyMode = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      const habits = await getDailyHabits(todayStr);
      setCounts(habits);
      setIsLoading(false);
    };
    load();
  }, [todayStr]);

  useEffect(() => {
    if (!isLoading) {
      gsap.from('.party-btn', {
        scale: 0, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'back.out(2)'
      });
    }
  }, [isLoading]);

  const triggerRipple = (e, color) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y, color }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  };

  const handleSin = async (sin, e) => {
    triggerRipple(e, sin.color);
    const newVal = (counts[sin.id] || 0) + 1;
    const newCounts = { ...counts, [sin.id]: newVal };
    setCounts(newCounts);

    const userData = await getUserData();
    const currentScore = userData.healthScore || 70;
    const newScore = Math.min(Math.max(currentScore + sin.penalty, 0), 100);

    await saveDailyHabits(todayStr, newCounts);
    await saveUserData({ healthScore: newScore });
    await logGroupSin(sin.msg, sin.id);

    // Badge checks
    if (sin.id === 'beer' && newVal >= 10) await unlockBadge('coma_etilico');
    else if (sin.id === 'beer' && newVal >= 5) await unlockBadge('esponja');
    else if (sin.id === 'cocaine' && newVal >= 1) await unlockBadge('astronauta');
    else if (sin.id === 'mdma' && newVal >= 1) await unlockBadge('viaje_astral');
    else if (sin.id === 'cannabis' && newVal >= 3) await unlockBadge('bob_marley');

    toast(`${sin.icon} +1 ${sin.label}`, {
      style: { background: '#0d1428', color: sin.color, border: `1px solid ${sin.color}40`, fontWeight: 700, fontSize: '1rem' },
      duration: 1500,
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: '#050810',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minHeight: '100%',
        position: 'relative'
      }}>
        {/* Neon background blobs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(247,48,74,0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 5s ease-in-out infinite reverse' }} />
          <div style={{ position: 'absolute', top: '40%', left: '40%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(34,211,165,0.1) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 3s ease-in-out infinite' }} />
        </div>

        {/* Ripples */}
        {ripples.map(r => (
          <div key={r.id} style={{
            position: 'absolute', pointerEvents: 'none', zIndex: 10,
            left: r.x, top: r.y,
            width: '10px', height: '10px',
            borderRadius: '50%',
            background: r.color,
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ripple-expand 0.7s ease-out forwards',
          }} />
        ))}

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem 1rem 1rem', width: '100%' }}>
          <button
            onClick={() => navigate('/habits')}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: '50%', width: '40px', height: '40px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>🪩</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #a855f7, #f7304a, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MODO FIESTA
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Toca para registrar. No hay excusas.</p>
        </div>

        {/* Sin Buttons Grid */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          padding: '1rem 1.5rem 4rem', // extra padding at bottom so it doesn't get cut off
          width: '100%',
          maxWidth: '480px',
          alignContent: 'start',
        }}>
        {!isLoading && QUICK_SINS.map(sin => (
          <button
            key={sin.id}
            className="party-btn"
            onClick={(e) => handleSin(sin, e)}
            style={{
              position: 'relative', overflow: 'hidden',
              background: `${sin.color}12`,
              border: `2px solid ${sin.color}40`,
              borderRadius: '20px',
              padding: '1.5rem 1rem',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: `0 0 0 0 ${sin.color}40`,
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.boxShadow = `0 0 30px ${sin.color}40`; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 0 0 ${sin.color}40`; }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.boxShadow = `0 0 30px ${sin.color}40`; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 0 0 ${sin.color}40`; }}
          >
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{sin.icon}</span>
            <span style={{ color: sin.color, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em' }}>{sin.label}</span>
            {(counts[sin.id] || 0) > 0 && (
              <span style={{
                position: 'absolute', top: '8px', right: '10px',
                background: sin.color, color: '#000',
                borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900,
                padding: '2px 7px', minWidth: '20px', textAlign: 'center',
              }}>
                {counts[sin.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes ripple-expand {
          to { transform: translate(-50%, -50%) scale(40); opacity: 0; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default PartyMode;
