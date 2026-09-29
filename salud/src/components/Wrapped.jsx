import React, { useState, useEffect, useRef } from 'react';
import { Share2, TrendingUp, TrendingDown, Calendar, Award, Zap, Wine } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWeeklyHabits, getUserData } from '../lib/dataService';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const DEFAULT_HABITS = {
  beer: 'Birras', spirits: 'Cubatas', cocaine: 'Tiritos', mdma: 'Pastillas',
  tobacco: 'Cigarros', cannabis: 'Porros', junkfood: 'Atracones', hangover: 'Resacas',
  workout: 'Entrenamientos', water: 'Vasos de agua', fruit: 'Piezas de fruta',
  read: 'Lecturas', sleep: 'Siestas reparadoras', meditate: 'Meditaciones', walk: 'Paseos'
};
const BAD_HABITS = ['beer', 'spirits', 'cocaine', 'mdma', 'tobacco', 'cannabis', 'junkfood', 'hangover'];
const GOOD_HABITS = ['workout', 'water', 'fruit', 'read', 'sleep', 'meditate', 'walk'];

const SIN_COMPARISONS = [
  (v) => v > 50  ? `Eso son ${v} días de resaca potencial.` : null,
  (v) => v > 20  ? `Casi suficiente para llenar una bañera. Enhorabuena.` : null,
  (v) => v > 10  ? `Tu hígado tiene nombre propio: el mártir.` : null,
  (v) => v > 30  ? `La industria tabacalera te manda un beso.` : null,
];

const FUNNY_TITLES = [
  { condition: (bad, good) => bad > 30 && good < 5,  title: '🍺 La Esponja', subtitle: 'Has vivido... intensamente.' },
  { condition: (bad, good) => good > 30 && bad < 5,  title: '😇 El Santo',   subtitle: 'Aburridísimo, pero sano.' },
  { condition: (bad, good) => bad > 20 && good > 20, title: '⚖️ El Equilibrista', subtitle: 'Pecas pero te arrepientes. Respetable.' },
  { condition: (bad, good) => bad === 0 && good === 0, title: '👻 El Fantasma', subtitle: 'No registraste nada. ¿Existes?' },
  { condition: (bad, good) => bad < 5 && good < 5,   title: '🦥 El Perezoso', subtitle: 'Ni pecas ni eres sano. Neutral.' },
  { condition: () => true,                             title: '😈 El Pecador Estándar', subtitle: 'Un clásico de los grupos.' },
];

const Wrapped = () => {
  const [stats, setStats] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [habits, user] = await Promise.all([getWeeklyHabits(), getUserData()]);
      setUserData(user);

      // Aggregate by habit type
      const totals = {};
      habits.forEach(day => {
        Object.entries(day.habits || {}).forEach(([key, val]) => {
          totals[key] = (totals[key] || 0) + val;
        });
      });

      const totalBad = BAD_HABITS.reduce((s, k) => s + (totals[k] || 0), 0);
      const totalGood = GOOD_HABITS.reduce((s, k) => s + (totals[k] || 0), 0);

      // Top sin
      const topSinKey = BAD_HABITS.reduce((a, b) => (totals[a] || 0) > (totals[b] || 0) ? a : b, 'beer');
      const topGoodKey = GOOD_HABITS.reduce((a, b) => (totals[a] || 0) > (totals[b] || 0) ? a : b, 'water');

      // Funny title
      const titleObj = FUNNY_TITLES.find(t => t.condition(totalBad, totalGood)) || FUNNY_TITLES[FUNNY_TITLES.length - 1];

      setStats({ totals, totalBad, totalGood, topSinKey, topGoodKey, titleObj });
      setLoading(false);
    };
    load();
  }, [month]);

  useGSAP(() => {
    if (!loading && cardRef.current) {
      gsap.from('.wrapped-stat', { y: 30, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out', delay: 0.2 });
      gsap.from('.wrapped-header', { scale: 0.85, opacity: 0, duration: 0.8, ease: 'back.out(1.5)' });
    }
  }, { scope: containerRef, dependencies: [loading] });

  const handleShare = () => {
    if (!stats) return;
    const { titleObj, totalBad, totalGood, topSinKey, totals } = stats;
    const userName = userData?.displayName || userData?.name || 'Alguien';
    const monthName = new Date(2024, month).toLocaleString('es-ES', { month: 'long' });
    const text = `📊 Mi Wrapped de la Vergüenza (${monthName})\n\n` +
      `🏷️ Título: "${titleObj.title}"\n` +
      `😈 Pecados totales: ${totalBad}\n` +
      `😇 Buenos hábitos: ${totalGood}\n` +
      `🏆 Mi mayor vicio: ${DEFAULT_HABITS[topSinKey] || topSinKey} x${totals[topSinKey] || 0}\n\n` +
      `¡Vergüenza total! 😂 via SaludTracker`;

    if (navigator.share) {
      navigator.share({ title: 'Mi Wrapped de la Vergüenza', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Copiado al portapapeles. ¡A pegar en el grupo!', { icon: '📋' });
      });
    }
  };

  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(79,125,255,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Calculando la vergüenza...</p>
      </div>
    );
  }

  const { totals, totalBad, totalGood, topSinKey, topGoodKey, titleObj } = stats;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>

      {/* Month Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i)}
            style={{
              background: month === i ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              color: month === i ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: '999px', padding: '4px 12px', fontSize: '0.75rem',
              fontWeight: month === i ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #0d1428 0%, #1a0d2e 50%, #0d1428 100%)',
          border: '1px solid rgba(168,85,247,0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Gradient blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(247,48,74,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '2rem' }}>

          {/* Header */}
          <div className="wrapped-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              📊 Wrapped de la Vergüenza · {MONTHS[month]}
            </p>
            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.5rem' }}>{titleObj.title.split(' ')[0]}</div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '2rem', background: 'linear-gradient(135deg, #a855f7, #f7304a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>
              {titleObj.title.split(' ').slice(1).join(' ')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontStyle: 'italic' }}>{titleObj.subtitle}</p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Total Bad */}
            <div className="wrapped-stat" style={{ background: 'rgba(247,48,74,0.1)', border: '1px solid rgba(247,48,74,0.2)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
              <TrendingDown size={20} color="#f7304a" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f7304a', lineHeight: 1 }}>{totalBad}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Pecados totales</div>
            </div>

            {/* Total Good */}
            <div className="wrapped-stat" style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
              <TrendingUp size={20} color="#22d3a5" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22d3a5', lineHeight: 1 }}>{totalGood}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Buenos hábitos</div>
            </div>

            {/* Top Sin */}
            <div className="wrapped-stat" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
              <Wine size={20} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>x{totals[topSinKey] || 0}</div>
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>{DEFAULT_HABITS[topSinKey]}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Mayor vicio</div>
            </div>

            {/* Top Good */}
            <div className="wrapped-stat" style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.2)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
              <Award size={20} color="#4f7dff" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4f7dff', lineHeight: 1 }}>x{totals[topGoodKey] || 0}</div>
              <div style={{ fontSize: '0.85rem', color: '#4f7dff', fontWeight: 600, marginTop: '4px' }}>{DEFAULT_HABITS[topGoodKey]}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Mejor hábito</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="wrapped-stat" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Desglose completo</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.entries(totals)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([key, val]) => {
                  const isBad = BAD_HABITS.includes(key);
                  const maxVal = Math.max(...Object.values(totals));
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: isBad ? '#f7304a' : '#22d3a5', width: '120px', flexShrink: 0 }}>{DEFAULT_HABITS[key] || key}</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${(val / maxVal) * 100}%`, height: '100%', background: isBad ? '#f7304a' : '#22d3a5', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isBad ? '#f7304a' : '#22d3a5', width: '24px', textAlign: 'right' }}>{val}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            style={{
              width: '100%', padding: '0.875rem',
              background: 'linear-gradient(135deg, #a855f7, #f7304a)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: 800, fontSize: '1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Share2 size={20} />
            Compartir mi Vergüenza 🤡
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wrapped;
