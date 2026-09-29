import React, { useState, useEffect, useRef } from 'react';
import { Wine, Cigarette, Plus, Minus, Droplets, Apple, Dumbbell, Activity, BookOpen, Moon, Brain, Zap, Pizza, Gamepad2, AlertTriangle, Flame, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { getUserData, saveUserData, saveHistoryRecord, getDailyHabits, saveDailyHabits, getWeeklyHabits, updateDailyStreak, awardXP, logGroupSin, unlockBadge, removeLastGroupSin } from '../lib/dataService';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const DEFAULT_HABITS = [
  { id: 'workout', name: 'Sudar el alcohol (Gym)', icon: Dumbbell, penalty: 1.5, category: 'Mover el culo', isGood: true },
  { id: 'walk', name: 'Paseo de la vergüenza', icon: Activity, penalty: 1.0, category: 'Mover el culo', isGood: true },
  
  { id: 'water', name: 'Agua para la resaca', icon: Droplets, penalty: 0.2, category: 'Papeo Sano', isGood: true },
  { id: 'fruit', name: 'Comer algo de un árbol', icon: Apple, penalty: 0.4, category: 'Papeo Sano', isGood: true },
  
  { id: 'read', name: 'Leer (no Twitter)', icon: BookOpen, penalty: 0.8, category: 'Salud Mental', isGood: true },
  { id: 'sleep', name: 'Dormir la mona (8h+)', icon: Moon, penalty: 1.0, category: 'Salud Mental', isGood: true },
  { id: 'meditate', name: 'Llorar en posición fetal', icon: Brain, penalty: 0.8, category: 'Salud Mental', isGood: true },
  
  { id: 'beer', name: 'Birras y cañas', icon: Wine, penalty: -0.5, category: 'Pecados', isGood: false },
  { id: 'spirits', name: 'Cubatas / Chupitos', icon: Wine, penalty: -1.5, category: 'Pecados', isGood: false },
  { id: 'cocaine', name: 'Un tirito (Cocaína)', icon: Zap, penalty: -3.0, category: 'Pecados', isGood: false },
  { id: 'mdma', name: 'Pastillas / MDMA', icon: Zap, penalty: -2.5, category: 'Pecados', isGood: false },
  { id: 'tobacco', name: 'Fumar como carretero', icon: Cigarette, penalty: -0.8, category: 'Pecados', isGood: false },
  { id: 'cannabis', name: 'Darle al verde (Porros)', icon: Leaf, penalty: -1.5, category: 'Pecados', isGood: false },
  { id: 'junkfood', name: 'Atracón guarro (Munchies)', icon: Pizza, penalty: -1.0, category: 'Pecados', isGood: false },
  { id: 'gaming', name: 'Scroll infinito en TikTok', icon: Gamepad2, penalty: -0.5, category: 'Pecados', isGood: false },
  { id: 'hangover', name: 'Resaca paralizante', icon: AlertTriangle, penalty: -2.0, category: 'Pecados', isGood: false }
];

const CATEGORIES = ['Todos', 'Mover el culo', 'Papeo Sano', 'Salud Mental', 'Pecados', 'Personalizados'];

const SIN_MESSAGES = {
  beer: [
    "se está bebiendo hasta el agua de los floreros.",
    "tiene más cebada que sangre ahora mismo.",
    "ha caído en la tentación dorada. ¡Otra birra!"
  ],
  spirits: [
    "ya va por los cubatas. Que alguien le quite las llaves.",
    "se está preparando para mandar mensajes a su ex.",
    "necesita un hígado de repuesto urgentemente."
  ],
  cocaine: [
    "acaba de ir al baño con las llaves en la mano.",
    "habla más rápido que Eminem gracias a un tirito.",
    "cree que es el lobo de Wall Street ahora mismo."
  ],
  mdma: [
    "quiere abrazar a todo el mundo. Efecto MDMA.",
    "se está comiendo la mandíbula sin compasión.",
    "está viendo colores que no existen en el espectro visible."
  ],
  tobacco: [
    "está ahumando sus pulmones. Pobre alvéolo.",
    "apesta a cenicero andante de bar de carretera.",
    "está acortando su vida a caladas."
  ],
  cannabis: [
    "tiene los ojos como dos tomates cherry.",
    "se está riendo solo mirando a una pared.",
    "está a punto de zamparse la nevera entera."
  ],
  junkfood: [
    "ha sucumbido a los munchies como un gorrino.",
    "tiene las arterias llorando colesterol del bueno.",
    "se está metiendo calorías como si no hubiera un mañana."
  ],
  gaming: [
    "lleva 3 horas haciendo scroll en TikTok perdiendo neuronas.",
    "tiene el cerebro frito de tanta dopamina barata.",
    "se está quedando ciego frente a la pantalla."
  ],
  hangover: [
    "es un zombie pidiendo clemencia por la resaca.",
    "no puede con su alma, necesita suero en vena.",
    "está pagando muy caro lo de anoche."
  ]
};

const getRandomSinMessage = (habitId, habitName) => {
  const msgs = SIN_MESSAGES[habitId];
  if (msgs && msgs.length > 0) {
    const r = msgs[Math.floor(Math.random() * msgs.length)];
    return `${r} 🚨`;
  }
  return `ha vuelto a pecar con ${habitName}. ¡Vergüenza! 🚨`;
};

const HabitsTracker = () => {
  const [healthData, setHealthData] = useState({ healthScore: 70, lifeExpectancy: 80 });
  const [dailyHabits, setDailyHabits] = useState({});
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadAllData = async () => {
      const userDoc = await getUserData();
      setHealthData({ healthScore: userDoc.healthScore || 70, lifeExpectancy: userDoc.lifeExpectancy || 80 });

      const habits = await getDailyHabits(todayStr);
      setDailyHabits(habits);
      await updateDailyStreak();

      const weekly = await getWeeklyHabits();

      // Process weekly data for the chart
      const chartData = weekly.map(day => {
        let goodCount = 0;
        let badCount = 0;

        Object.entries(day.habits || {}).forEach(([key, val]) => {
          const habit = DEFAULT_HABITS.find(h => h.id === key);
          if (habit && habit.isGood) goodCount += val;
          if (habit && !habit.isGood) badCount += val;
        });

        return {
          date: day.date.slice(5), // MM-DD
          'Buenos Hábitos': goodCount,
          'Malos Hábitos': badCount
        };
      });
      setWeeklyData(chartData);
      setLoading(false);
    };
    loadAllData();
  }, [todayStr]);

  useGSAP(() => {
    if (!loading) {
      gsap.from(".gsap-title", { y: -30, opacity: 0, duration: 0.6, ease: "power3.out" });
      gsap.from(".gsap-column", { y: 30, opacity: 0, duration: 0.6, stagger: 0.2, ease: "power2.out" });
      gsap.from(".gsap-card", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "back.out(1.5)",
        delay: 0.3
      });
      gsap.from(".gsap-chart", { opacity: 0, duration: 1, delay: 0.8 });
    }
  }, { scope: containerRef, dependencies: [loading] });

  const flashCard = (id, isGood) => {
    const el = cardRefs.current[id];
    if (!el) return;
    gsap.fromTo(el,
      { scale: 1.06, boxShadow: isGood ? '0 0 30px rgba(34,211,165,0.5)' : '0 0 30px rgba(247,48,74,0.5)' },
      { scale: 1, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', duration: 0.5, ease: 'elastic.out(1,0.4)' }
    );
    // Flash color
    el.classList.add(isGood ? 'flash-green' : 'flash-red');
    setTimeout(() => el.classList.remove('flash-green', 'flash-red'), 700);
  };

  const updateHabit = async (habitDef, change) => {
    const id = habitDef.id;
    const newVal = Math.max(0, (dailyHabits[id] || 0) + change);
    if (newVal === dailyHabits[id]) return;

    const isGood = habitDef.penalty > 0;
    flashCard(id, change > 0 ? isGood : !isGood);

    const newDaily = { ...dailyHabits, [id]: newVal };
    setDailyHabits(newDaily);

    // Calculate Score Diff based on the penalty value (positive for good, negative for bad)
    // If we add a good habit (change > 0), score Diff = habitDef.penalty
    // If we remove a good habit (change < 0), score Diff = -habitDef.penalty
    const scoreDiff = change > 0 ? habitDef.penalty : -habitDef.penalty;
    let newScore = Math.min(Math.max(healthData.healthScore + scoreDiff, 0), 100);

    const newHealthData = { ...healthData, healthScore: newScore };
    setHealthData(newHealthData);

    // Save
    await saveDailyHabits(todayStr, newDaily);
    await saveUserData({ healthScore: newScore });
    await saveHistoryRecord(newScore, newHealthData.lifeExpectancy);

    // Check Badges
    if (change > 0) {
      let badgeToUnlock = null;
      if (id === 'beer' && newVal >= 10) badgeToUnlock = 'coma_etilico';
      else if (id === 'beer' && newVal >= 5) badgeToUnlock = 'esponja';
      else if (id === 'spirits' && newVal >= 8) badgeToUnlock = 'coyote';
      else if (id === 'spirits' && newVal >= 3) badgeToUnlock = 'chupitos';
      else if (id === 'cocaine' && newVal >= 1) badgeToUnlock = 'astronauta';
      else if (id === 'mdma' && newVal >= 1) badgeToUnlock = 'viaje_astral';
      else if (id === 'cannabis' && newVal >= 3) badgeToUnlock = 'bob_marley';
      else if (id === 'tobacco' && newVal >= 15) badgeToUnlock = 'pulmones_negros';
      else if (id === 'tobacco' && newVal >= 5) badgeToUnlock = 'chimenea';
      else if (id === 'junkfood' && newVal >= 5) badgeToUnlock = 'pacman';
      else if (id === 'junkfood' && newVal >= 3) badgeToUnlock = 'gordaco';
      else if (id === 'gaming' && newVal >= 5) badgeToUnlock = 'yonqui_digital';
      else if (id === 'hangover' && newVal >= 1) badgeToUnlock = 'zombie';
      else if (id === 'workout' && newVal >= 3) badgeToUnlock = 'espartano';
      else if (id === 'workout' && newVal >= 1) badgeToUnlock = 'ironman';
      else if (id === 'meditate' && newVal >= 3) badgeToUnlock = 'buda';
      else if (id === 'meditate' && newVal >= 1) badgeToUnlock = 'monje';
      else if (id === 'sleep' && newVal >= 1) badgeToUnlock = 'bello_durmiente';
      else if (id === 'water' && newVal >= 8) badgeToUnlock = 'santo_bebedor';
      else if (id === 'water' && newVal >= 5) badgeToUnlock = 'aquaman';
      else if (id === 'fruit' && newVal >= 5) badgeToUnlock = 'vegano_extremo';
      else if (id === 'read' && newVal >= 3) badgeToUnlock = 'lector';

      // Check for 'Alquimista' combo (mixing alcohol)
      if (!badgeToUnlock) {
        if ((id === 'beer' && dailyHabits['spirits'] > 0) || (id === 'spirits' && dailyHabits['beer'] > 0)) {
          badgeToUnlock = 'alquimista';
        }
      }

      if (badgeToUnlock) {
        const unlocked = await unlockBadge(badgeToUnlock);
        if (unlocked) {
          toast.success('¡Nueva Insignia Desbloqueada! 🏆 Revisa tu Perfil.', { duration: 5000, style: { background: 'var(--bg-dark)', color: 'gold', border: '1px solid gold' }});
        }
      }
    }

    // Toast feedback and XP
    if (change > 0) {
      if (habitDef.penalty > 0) {
        const xpResult = await awardXP(10, 'good_habit');
        if (xpResult && xpResult.leveledUp) {
          toast.success(`¡Subiste al Nivel ${xpResult.newLevel}! 🎉`, { icon: '⭐', style: { background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--accent-primary)' } });
        } else {
          toast.success(`+1 ${habitDef.name} (+10 XP)`, { style: { background: 'var(--bg-dark)', color: '#fff' } });
        }
      } else {
        toast.error(`+1 ${habitDef.name} (Salud ${habitDef.penalty})`, { style: { background: 'var(--bg-dark)', color: '#fff' } });
        // Log to Toxic Group
        await logGroupSin(` ${getRandomSinMessage(habitDef.id, habitDef.name)}`, habitDef.id);
      }
    } else {
      toast('Registro deshecho', { icon: '↩️', style: { background: 'var(--bg-dark)', color: '#fff' } });
      if (!habitDef.isGood) {
        await removeLastGroupSin(habitDef.id);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(79,125,255,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando hábitos...</p>
      </div>
    );
  }

  const renderHabitCard = (habit, isGood) => {
    const Icon = habit.icon;
    const count = dailyHabits[habit.id] || 0;
    const maxCount = isGood ? 10 : 5;
    const fillPct = Math.min((count / maxCount) * 100, 100);
    const color = isGood ? '#22d3a5' : '#f7304a';
    const bgColor = isGood ? 'rgba(34,211,165,0.1)' : 'rgba(247,48,74,0.1)';
    const borderColor = isGood ? 'rgba(34,211,165,0.15)' : 'rgba(247,48,74,0.15)';

    return (
      <div
        key={habit.id}
        ref={el => cardRefs.current[habit.id] = el}
        className="gsap-card"
        style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Progress fill background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${fillPct}%`, background: `${color}08`,
          transition: 'width 0.5s ease',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: bgColor, color: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${borderColor}`, flexShrink: 0,
            }}>
              <Icon size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>{habit.name}</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: color, fontWeight: 600 }}>
                {habit.penalty > 0 ? `+${habit.penalty} pts` : `${habit.penalty} pts`} · {count} hoy
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => updateHabit(habit, -1)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            ><Minus size={14} /></button>

            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: color, width: '28px', textAlign: 'center', lineHeight: 1 }}>
              {count}
            </span>

            <button
              onClick={() => updateHabit(habit, 1)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: color, border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', boxShadow: `0 4px 12px ${color}40`,
              }}
            ><Plus size={14} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="gsap-title">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Diario de <span className="text-gradient">Hábitos</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registra lo que haces hoy</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.2)',
          borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: '0.85rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Salud actual:</span>
          <strong style={{ color: 'var(--accent-primary)' }}>{Math.round(healthData.healthScore)} pts</strong>
        </div>
      </div>

      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>

        {/* Good Habits Column */}
        <div className="gsap-column" style={{ flex: '1 1 350px' }}>
          <h2 className="mb-4" style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>😇</span> Sumar Salud
          </h2>
          <div className="flex-col gap-3">
            {DEFAULT_HABITS.filter(h => h.isGood).map(h => renderHabitCard(h, true))}
          </div>
        </div>

        {/* Bad Habits Column */}
        <div className="gsap-column" style={{ flex: '1 1 350px' }}>
          <h2 className="mb-4" style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>😈</span> Pecados
          </h2>
          <div className="flex-col gap-3">
            {DEFAULT_HABITS.filter(h => !h.isGood).map(h => renderHabitCard(h, false))}
          </div>
        </div>

      </div>

      {/* Analytics Chart */}
      <div className="glass-card mt-6 gsap-chart" style={{ width: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
        <h3 className="mb-4">Balance de los últimos 7 días</h3>
        <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-darker)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Buenos Hábitos" fill="var(--accent-success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Malos Hábitos" fill="var(--accent-danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
              No hay datos de la última semana.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HabitsTracker;
