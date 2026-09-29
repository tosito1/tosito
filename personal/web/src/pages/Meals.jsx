import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Flame, Zap, Droplets, Cookie, ChevronDown, Plus, BarChart3 } from 'lucide-react';
import { AnimatedCard, StaggerWrapper, StaggerItem, FloatingOrb, CountUp } from '../components/Animated';

const MACRO_GOALS = { cal: 2200, pro: 160, car: 220, fat: 70 };

// Animated SVG macro ring — GSAP drives the stroke-dasharray
const MacroRing = ({ value, goal, color, label, unit, delay = 0 }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const circleRef = useRef(null);

  useEffect(() => {
    if (!circleRef.current) return;
    const pct = Math.min(value / goal, 1);
    gsap.fromTo(
      circleRef.current,
      { strokeDasharray: `0 ${circ}` },
      { strokeDasharray: `${pct * circ} ${circ}`, duration: 1.4, delay, ease: 'power3.out' }
    );
  }, [value, goal, circ, delay]);

  const pct = Math.round((value / goal) * 100);

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg-primary)" strokeWidth="6" />
          <circle
            ref={circleRef}
            cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`0 ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          <CountUp target={value} delay={delay + 0.2} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
};

const Meals = () => {
  const { meals } = useAppContext();
  const [openMeal, setOpenMeal] = useState(null);

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + m.totalCalories,
    pro: acc.pro + m.totalProteins,
    car: acc.car + m.totalCarbs,
    fat: acc.fat + m.totalFats
  }), { cal: 0, pro: 0, car: 0, fat: 0 });

  const macros = [
    { value: totals.cal, goal: MACRO_GOALS.cal, color: 'var(--warning)', label: 'Calorías', unit: ' kcal', delay: 0.2 },
    { value: totals.pro, goal: MACRO_GOALS.pro, color: 'var(--success)', label: 'Proteína', unit: 'g', delay: 0.35 },
    { value: totals.car, goal: MACRO_GOALS.car, color: 'var(--info)', label: 'Carbos', unit: 'g', delay: 0.5 },
    { value: totals.fat, goal: MACRO_GOALS.fat, color: 'var(--danger)', label: 'Grasas', unit: 'g', delay: 0.65 },
  ];

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', paddingBottom: 'var(--space-8)', position: 'relative' }}>
      <FloatingOrb color="rgba(251,191,36,0.3)" size="300px" top="-60px" right="-60px" delay={0} opacity={0.1} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', position: 'relative', zIndex: 1 }}
      >
        <div>
          <h1 className="page-header__title">Nutrición</h1>
          <p className="page-header__subtitle">Controla tu ingesta diaria de macros</p>
        </div>
        <motion.button
          className="btn btn-primary"
          style={{ padding: '9px 16px', fontSize: '0.8125rem' }}
          whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus size={16} /> Registrar
        </motion.button>
      </motion.header>

      {/* Macro Overview Card */}
      <AnimatedCard
        className="card"
        style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', position: 'relative', zIndex: 1, overflow: 'hidden' }}
      >
        {/* Subtle gradient orb inside card */}
        <motion.div
          style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
            <div>
              <p className="text-caption">Resumen de hoy</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginTop: 'var(--space-1)' }}>
                <CountUp target={totals.cal} delay={0.1} />
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>/ {MACRO_GOALS.cal} kcal</span>
              </h2>
            </div>
            <div style={{ padding: 12, background: 'var(--warning-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame size={24} />
              </motion.div>
            </div>
          </div>

          {/* Overall calorie bar */}
          <div className="progress-track" style={{ height: 8, marginBottom: 'var(--space-6)' }}>
            <motion.div
              style={{
                height: '100%', borderRadius: 'inherit',
                background: 'linear-gradient(90deg, var(--warning), #f97316)',
                boxShadow: '0 0 12px rgba(251,191,36,0.4)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totals.cal / MACRO_GOALS.cal) * 100, 100)}%` }}
              transition={{ duration: 1.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Macro rings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
            {macros.map((m, i) => (
              <MacroRing key={i} {...m} />
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Meals list */}
      <div className="section-header" style={{ position: 'relative', zIndex: 1 }}>
        <span className="section-title">Plan del día</span>
        <motion.button className="btn-icon" whileHover={{ rotate: 15, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <BarChart3 size={18} />
        </motion.button>
      </div>

      <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', position: 'relative', zIndex: 1 }}>
        {meals.map((meal, mealIdx) => (
          <StaggerItem key={meal.id}>
            <div className="card" style={{ overflow: 'hidden' }}>

              {/* Meal header row */}
              <motion.div
                style={{ padding: 'var(--space-5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
                onClick={() => setOpenMeal(openMeal === meal.id ? null : meal.id)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
              >
                <motion.div
                  style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0, border: '1px solid var(--border-default)'
                  }}
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {meal.type.emoji}
                </motion.div>

                <div style={{ flex: 1 }}>
                  <p className="text-caption" style={{ marginBottom: 2 }}>{meal.type.label}</p>
                  <h4 style={{ fontSize: '0.9375rem' }}>{meal.name}</h4>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>{meal.totalCalories} kcal</span>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>{meal.totalProteins}g P</span>
                  <motion.div
                    animate={{ rotate: openMeal === meal.id ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginLeft: 4 }}
                  >
                    <ChevronDown size={16} color="var(--text-muted)" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Expandable ingredient section */}
              <AnimatePresence>
                {openMeal === meal.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border-default)', padding: 'var(--space-5)', background: 'var(--bg-tertiary)' }}>
                      <p className="text-caption" style={{ marginBottom: 'var(--space-4)' }}>Ingredientes</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
                        {meal.ingredients.map((ing, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                              display: 'flex', justifyContent: 'space-between',
                              padding: 'var(--space-3) var(--space-4)',
                              background: 'var(--bg-secondary)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-default)'
                            }}
                          >
                            <span style={{ fontSize: '0.8125rem' }}>{ing.name}</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {ing.quantity}{ing.unit}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Macro breakdown */}
                      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
                        {[
                          { icon: <Flame size={14} />, val: meal.totalCalories, label: 'kcal', color: 'var(--warning)' },
                          { icon: <Zap size={14} />, val: `${meal.totalProteins}g`, label: 'P', color: 'var(--success)' },
                          { icon: <Droplets size={14} />, val: `${meal.totalCarbs}g`, label: 'C', color: 'var(--info)' },
                          { icon: <Cookie size={14} />, val: `${meal.totalFats}g`, label: 'G', color: 'var(--danger)' },
                        ].map((m, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 300 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}
                          >
                            <span style={{ color: m.color }}>{m.icon}</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{m.val}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </StaggerItem>
        ))}
      </StaggerWrapper>
    </div>
  );
};

export default Meals;
