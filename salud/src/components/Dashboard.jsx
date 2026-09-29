import React, { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Zap, Flame, Star, TrendingUp, Lightbulb, Award, BookOpen } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, ComposedChart } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getUserData, getMoodHistory } from '../lib/dataService';
import MoodTracker from './MoodTracker';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Lightweight animated number — no external dependency
const AnimatedNumber = ({ value, duration = 1500 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(Math.round(value)); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return display;
};

gsap.registerPlugin(useGSAP);

// ─── Daily Tips ──────────────────────────────────────────────────────────────
const DAILY_TIPS = [
  "💧 Beber 2L de agua al día mejora la concentración un 14%. Hoy, rellena tu botella.",
  "🧘 5 minutos de respiración profunda reducen el cortisol. Prueba inhalar 4s, aguantar 4s, exhalar 4s.",
  "🦶 Caminar 8.000 pasos diarios reduce el riesgo cardiovascular en un 51%.",
  "🥦 Comer 5 raciones de verduras/frutas al día puede añadir hasta 10 años de vida.",
  "😴 Dormir menos de 6h eleva el riesgo de enfermedades metabólicas. ¡Cuida tu sueño!",
  "🏋️ 20 minutos de ejercicio de fuerza al día bastan para mejorar la densidad ósea.",
  "🧠 Aprender algo nuevo cada día forma nuevas conexiones neuronales. Hoy: una palabra en otro idioma.",
  "🍵 El té verde contiene L-teanina, que mejora el foco sin el nerviosismo del café.",
  "☀️ 15 minutos de sol antes de las 10am regula tu ritmo circadiano y mejora el sueño.",
  "🤝 Las personas con buenas relaciones sociales viven un 50% más. Llama a alguien hoy.",
  "🥜 Un puñado de frutos secos al día reduce el colesterol malo (LDL) hasta un 10%.",
  "⏰ Comer con intervalos de 12-16h (ayuno intermitente simple) mejora la sensibilidad a la insulina.",
  "🎵 Escuchar música que te gusta libera dopamina. Tu playlist favorita es medicina.",
  "📵 Dejar el móvil 1h antes de dormir mejora la calidad del sueño profundo.",
  "🌿 Las plantas en casa reducen el estrés y mejoran la calidad del aire interior.",
  "🍳 Cocinar en casa reduce el consumo de sodio, azúcar y grasas trans en un 60%.",
  "💪 La proteína en el desayuno reduce el apetito el resto del día. Huevos, yogur griego...",
  "🧊 Una ducha fría de 30 segundos activa el sistema inmune y mejora el estado de ánimo.",
  "📚 Leer 20 minutos al día puede añadir hasta 2 años de vida según estudios de Yale.",
  "🏃 El ejercicio aeróbico es el antidepresivo natural más efectivo según la APA.",
  "🥗 La dieta mediterránea reduce el riesgo de Alzheimer hasta un 35%.",
  "😂 Reírse 15 minutos al día reduce las hormonas del estrés y fortalece el corazón.",
  "🦷 Cepillarte los dientes 2 minutos, 2 veces al día, reduce el riesgo cardiovascular.",
  "🧴 El protector solar diario es la crema antienvejecimiento más efectiva que existe.",
  "🧃 Sustituir un refresco al día por agua reduce el riesgo de diabetes tipo 2 en un 25%.",
  "🛁 Un baño caliente antes de dormir baja la temperatura corporal core y facilita el sueño.",
  "🥛 El calcio no solo es para los huesos: también regula la presión arterial.",
  "🎯 Escribir 3 cosas por las que estar agradecido al día mejora el bienestar subjetivo.",
  "🍇 Los antioxidantes del vino tinto... mejor en arándanos. Más salud, mismo sabor.",
  "🏊 Nadar 30 minutos equivale a correr 45 en cuanto a quema calórica, con menor impacto.",
];

const getDailyTip = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(13,20,40,0.95)', border: '1px solid rgba(79,125,255,0.2)',
        borderRadius: '10px', padding: '0.75rem 1rem', backdropFilter: 'blur(20px)'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color || 'var(--accent-primary)', fontWeight: 700, fontSize: '1rem', margin: '2px 0' }}>
            {p.name}: {p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, unit, color, gradient }) => (
  <div
    className="gsap-card stat-card"
    style={{
      flex: '1 1 200px',
      background: `linear-gradient(135deg, rgba(13,20,40,0.9) 0%, ${gradient}15 100%)`,
      border: `1px solid ${color}25`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${color}10`,
    }}
  >
    <div className="stat-card-bg" style={{ background: gradient }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </h2>
          {unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{unit}</span>}
        </div>
      </div>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
      }}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

// ─── Mood value map for chart ─────────────────────────────────────────────────
const MOOD_LABELS = { 1: 'Fatal', 2: 'Mal', 3: 'Normal', 4: 'Bien', 5: '¡Genial!' };
const MOOD_EMOJIS = { 1: '😭', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' };

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState({ healthScore: 0, lifeExpectancy: 0, history: [], gamification: { xp: 0, level: 1, streak: 0, badges: [] } });
  const [moodHistory, setMoodHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const [userData, moodHist] = await Promise.all([getUserData(), getMoodHistory()]);
      if (!userData.gamification) userData.gamification = { xp: 0, level: 1, streak: 0, badges: [] };
      setData(userData);
      setMoodHistory(moodHist);

      // Merge history + mood into chart data
      const histMap = {};
      (userData.history || []).forEach(h => { histMap[h.date] = { ...h }; });
      moodHist.forEach(m => {
        if (!histMap[m.date]) histMap[m.date] = { date: m.date };
        histMap[m.date].mood = m.mood;
      });

      const merged = Object.values(histMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
      setChartData(merged);
    };
    loadData();
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.gsap-title', { y: -25, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.gsap-hero', { scale: 0.9, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.2')
      .from('.gsap-card', { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, '-=0.4')
      .from('.gsap-chart', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .from('.gsap-tip', { x: -20, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .from('.gsap-mood', { scale: 0.95, opacity: 0, duration: 0.5, ease: 'back.out(1.3)' }, '-=0.3');
  }, { scope: containerRef });

  const score = Math.round(data.healthScore || 0);
  const xpProgress = (data.gamification?.xp || 0) % 100;
  const scoreColor = score >= 70 ? '#22d3a5' : score >= 45 ? '#f5a623' : '#f7304a';
  const scoreGradient = score >= 70
    ? 'linear-gradient(135deg, #22d3a5, #06d6c7)'
    : score >= 45
    ? 'linear-gradient(135deg, #f5a623, #f59e0b)'
    : 'linear-gradient(135deg, #f7304a, #ef4444)';

  const totalBadges = (data.gamification?.badges || []).length;
  const dailyTip = getDailyTip();

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div className="gsap-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
            Mi <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resumen de tu salud en tiempo real</p>
        </div>
        {data.gamification?.streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(247,48,74,0.1)', border: '1px solid rgba(247,48,74,0.25)',
            borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem',
            boxShadow: '0 0 20px rgba(247,48,74,0.15)'
          }}>
            <Flame size={20} style={{ color: '#f7304a' }} />
            <span style={{ fontWeight: 700, color: '#f7304a', fontSize: '1.1rem' }}>{data.gamification.streak}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>días</span>
          </div>
        )}
      </div>

      {/* Hero: Score Circle + XP */}
      <div className="gsap-hero glass-card" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(13,20,40,0.9) 0%, rgba(30,20,60,0.6) 100%)',
        border: '1px solid rgba(79,125,255,0.15)',
        display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap'
      }}>
        {/* Circular Score */}
        <div style={{ width: '140px', height: '140px', position: 'relative', flexShrink: 0 }}>
          <CircularProgressbar
            value={score}
            text=""
            styles={buildStyles({
              pathColor: scoreColor,
              trailColor: 'rgba(255,255,255,0.05)',
              strokeLinecap: 'round',
            })}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
              <AnimatedNumber value={score} />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100 pts</span>
          </div>
        </div>

        {/* Score Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Puntuación de Salud
            </p>
            <h2 style={{ fontSize: '1.6rem', margin: 0, backgroundImage: scoreGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {score >= 70 ? '¡Buen estado!' : score >= 45 ? 'Mejorable' : 'En riesgo'}
            </h2>
          </div>

          {/* XP Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} /> Nivel {data.gamification?.level || 1}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                {xpProgress}/100 XP
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${xpProgress}%`, background: 'var(--grad-primary)' }} />
            </div>
          </div>
        </div>

        {/* Life Expectancy */}
        <div style={{
          textAlign: 'center', padding: '1.25rem 2rem',
          background: 'rgba(34,211,165,0.06)', border: '1px solid rgba(34,211,165,0.15)',
          borderRadius: 'var(--radius-md)', flexShrink: 0
        }}>
          <TrendingUp size={24} style={{ color: '#22d3a5', marginBottom: '8px' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22d3a5', lineHeight: 1 }}>
            <AnimatedNumber value={Math.round(data.lifeExpectancy || 0)} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>años estimados</p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <MetricCard icon={Activity} label="Salud" value={score} unit="pts" color="#4f7dff" gradient="linear-gradient(135deg,#4f7dff,#a855f7)" />
        <MetricCard icon={Heart} label="Esperanza de vida" value={Math.round(data.lifeExpectancy || 0)} unit="años" color="#22d3a5" gradient="linear-gradient(135deg,#22d3a5,#06d6c7)" />
        <MetricCard icon={Zap} label="XP Total" value={data.gamification?.xp || 0} unit="XP" color="#a855f7" gradient="linear-gradient(135deg,#a855f7,#7c3aed)" />
        <MetricCard icon={Flame} label="Racha diaria" value={data.gamification?.streak || 0} unit="días" color="#f7304a" gradient="linear-gradient(135deg,#f7304a,#ff6b35)" />
      </div>

      {/* Advanced Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="gsap-card glass-card" style={{ flex: '1 1 180px', textAlign: 'center', padding: '1.25rem' }}>
          <Award size={26} style={{ color: '#f59e0b', marginBottom: '8px' }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{totalBadges}</div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Insignias</p>
        </div>
        <div className="gsap-card glass-card" style={{ flex: '1 1 180px', textAlign: 'center', padding: '1.25rem' }}>
          <Star size={26} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
            <AnimatedNumber value={data.gamification?.level || 1} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Nivel Actual</p>
        </div>
        <div className="gsap-card glass-card" style={{ flex: '1 1 180px', textAlign: 'center', padding: '1.25rem' }}>
          <BookOpen size={26} style={{ color: '#22d3a5', marginBottom: '8px' }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22d3a5' }}>
            <AnimatedNumber value={data.history?.length || 0} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Días Registrados</p>
        </div>
      </div>

      {/* Daily Tip */}
      <div className="gsap-tip glass-card tip-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(6,214,199,0.15)', border: '1px solid rgba(6,214,199,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lightbulb size={22} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Consejo del día
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {dailyTip}
          </p>
        </div>
      </div>

      {/* Mood Tracker */}
      <div className="gsap-mood">
        <MoodTracker />
      </div>

      {/* Combined Chart: Health Score + Mood */}
      <div className="gsap-chart glass-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
          Evolución (últimos 14 días)
        </h3>
        <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f7dff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f7dff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={t => t.slice(5)} tickLine={false} axisLine={false} />
                <YAxis yAxisId="score" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="mood" orientation="right" domain={[0, 5]} stroke="rgba(6,214,199,0.5)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => MOOD_EMOJIS[v] || ''} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="score" type="monotoneX" dataKey="healthScore" stroke="#4f7dff" strokeWidth={2.5}
                  fill="url(#colorScore)" dot={false} activeDot={{ r: 6, fill: '#4f7dff', strokeWidth: 0 }} name="Salud" unit=" pts" />
                <Line yAxisId="mood" type="monotone" dataKey="mood" stroke="#06d6c7" strokeWidth={2}
                  dot={{ fill: '#06d6c7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                  connectNulls name="Ánimo" unit="/5" strokeDasharray="6 3" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <Activity size={36} style={{ opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)' }}>Sin datos aún. Rellena el cuestionario para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
