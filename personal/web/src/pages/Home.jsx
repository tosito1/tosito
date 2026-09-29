import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Dumbbell, TrendingUp, Flame,
  ArrowRight, ArrowUpRight, ArrowDownLeft, CheckCheck
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatedCard, StaggerWrapper, StaggerItem, FloatingOrb, CountUp, PulseRing } from '../components/Animated';

const Home = () => {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      setUserName(auth.currentUser.displayName || auth.currentUser.email.split('@')[0]);
    } else {
      setUserName('Tosito');
    }
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const { 
    transactions, 
    savingsGoals, 
    meals, 
    gymRoutines, 
    calendarEvents 
  } = useAppContext();

  const nextEvent = calendarEvents[0];
  const todayRoutine = gymRoutines[0];
  const totalBalance = transactions.reduce(
    (acc, t) => t.type.id === 'INCOME' ? acc + t.amount : acc - t.amount, 0
  );
  const totalIncome = transactions.filter(t => t.type.id === 'INCOME').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type.id === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + m.totalCalories, pro: acc.pro + m.totalProteins
  }), { cal: 0, pro: 0 });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', position: 'relative' }}>
      {/* Ambient orbs */}
      <FloatingOrb color="rgba(99,102,241,0.4)" size="400px" top="-100px" right="-100px" delay={0} opacity={0.12} />
      <FloatingOrb color="rgba(168,85,247,0.3)" size="300px" bottom="100px" left="-80px" delay={4} opacity={0.08} />

      {/* ── Hero Greeting ── */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 'var(--space-10)', position: 'relative', zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}
        >
          <PulseRing color="var(--success)" size={10} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {format(now, "EEEE, d 'de' MMMM", { locale: es })}
          </span>
        </motion.div>

        <motion.h1
          style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {greeting},{' '}
          <motion.span
            className="text-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {userName}
          </motion.span>
          {' '}👋
        </motion.h1>
        <motion.p
          style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)', fontSize: '1rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Aquí tienes tu resumen del día.
        </motion.p>
      </motion.header>

      {/* ── Row 1: Calendar + Gym ── */}
      <StaggerWrapper style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', position: 'relative', zIndex: 1 }}>

        {/* Calendar card — 7 cols */}
        <StaggerItem style={{ gridColumn: 'span 7' }}>
          <AnimatedCard
            className="card"
            style={{ position: 'relative', overflow: 'hidden', height: '100%' }}
            onClick={() => navigate('/calendar')}
          >
            <motion.div
              style={{
                position: 'absolute', top: -30, right: -30, width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ padding: 10, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                  <CalendarDays size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Próximo evento</span>
              </div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400 }}>
                <ArrowRight size={16} color="var(--text-ghost)" />
              </motion.div>
            </div>
            {nextEvent && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span className="badge badge-accent">{nextEvent.startTime} — {nextEvent.endTime}</span>
                  <span className="badge badge-ghost">{nextEvent.category.emoji} {nextEvent.category.label}</span>
                </div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
                  {nextEvent.title}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{nextEvent.description}</p>
              </>
            )}
          </AnimatedCard>
        </StaggerItem>

        {/* Gym card — 5 cols */}
        <StaggerItem style={{ gridColumn: 'span 5' }}>
          <AnimatedCard
            className="card"
            style={{
              position: 'relative', overflow: 'hidden', height: '100%',
              background: 'linear-gradient(145deg, var(--bg-secondary), var(--bg-tertiary))'
            }}
            onClick={() => navigate('/gym')}
          >
            <motion.div
              style={{
                position: 'absolute', bottom: -40, right: -40, width: 180, height: 180,
                background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ padding: 10, background: 'rgba(239,68,68,0.12)', borderRadius: 'var(--radius-md)', color: '#f87171' }}>
                <Dumbbell size={20} />
              </div>
              <span className="badge badge-success">Hoy</span>
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p className="text-caption" style={{ marginBottom: 'var(--space-1)' }}>{todayRoutine.dayOfWeek}</p>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.3 }}>{todayRoutine.name}</h3>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {todayRoutine.targetMuscles.map((m, i) => (
                <motion.span key={i} className="badge badge-ghost"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                >
                  {m.emoji} {m.label}
                </motion.span>
              ))}
            </div>
            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-6)', fontSize: '0.875rem' }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              Empezar entrenamiento
            </motion.button>
          </AnimatedCard>
        </StaggerItem>
      </StaggerWrapper>

      {/* ── Row 2: Finance + Nutrition + Goals ── */}
      <StaggerWrapper style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>

        {/* Balance */}
        <StaggerItem style={{ gridColumn: 'span 4' }}>
          <AnimatedCard
            className="card"
            style={{ overflow: 'hidden', position: 'relative' }}
            onClick={() => navigate('/savings')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ padding: 10, background: 'var(--success-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                <TrendingUp size={20} />
              </div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400 }}>
                <ArrowRight size={16} color="var(--text-ghost)" />
              </motion.div>
            </div>
            <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Balance mensual</p>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-4)' }}>
              <CountUp target={totalBalance} decimals={2} suffix="€" delay={0.3} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpRight size={14} color="var(--success)" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>
                  <CountUp target={totalIncome} suffix="€" delay={0.5} />
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowDownLeft size={14} color="var(--danger)" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}>
                  <CountUp target={totalExpense} suffix="€" delay={0.6} />
                </span>
              </div>
            </div>
          </AnimatedCard>
        </StaggerItem>

        {/* Nutrition */}
        <StaggerItem style={{ gridColumn: 'span 4' }}>
          <AnimatedCard
            className="card"
            onClick={() => navigate('/meals')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ padding: 10, background: 'var(--warning-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
                <Flame size={20} />
              </div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400 }}>
                <ArrowRight size={16} color="var(--text-ghost)" />
              </motion.div>
            </div>
            <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Calorías hoy</p>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-4)' }}>
              <CountUp target={totals.cal} suffix=" kcal" delay={0.4} />
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-bar"
                style={{ background: 'linear-gradient(90deg, var(--warning), #f97316)', height: '100%', borderRadius: 'inherit' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totals.cal / 2200) * 100, 100)}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              {totals.pro}g proteína · objetivo 2200 kcal
            </p>
          </AnimatedCard>
        </StaggerItem>

        {/* Goals */}
        <StaggerItem style={{ gridColumn: 'span 4' }}>
          <AnimatedCard className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <span className="section-title">Metas de ahorro</span>
              <CheckCheck size={16} color="var(--success)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {savingsGoals.map((g, i) => {
                const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
                return (
                  <div key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{g.emoji} {g.name}</span>
                      <motion.span
                        style={{ fontSize: '0.75rem', fontWeight: 700, color: g.color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                      >
                        {pct}%
                      </motion.span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        className="progress-bar"
                        style={{ background: g.color, height: '100%', borderRadius: 'inherit', boxShadow: `0 0 10px ${g.color}66` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, delay: 0.6 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimatedCard>
        </StaggerItem>
      </StaggerWrapper>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: repeat(12"] > *[style*="gridColumn: span 7"],
          div[style*="gridTemplateColumns: repeat(12"] > *[style*="gridColumn: span 5"],
          div[style*="gridTemplateColumns: repeat(12"] > *[style*="gridColumn: span 4"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
