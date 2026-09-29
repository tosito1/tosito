import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Plus, Search, Filter, TrendingUp, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedCard, StaggerWrapper, StaggerItem, FloatingOrb, CountUp } from '../components/Animated';

// Animated mini sparkline
const Sparkline = ({ color, delay = 0 }) => {
  const heights = [40, 65, 50, 80, 55, 90, 100];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          style={{ flex: 1, borderRadius: 3, background: i === heights.length - 1 ? color : `${color}44` }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.6, delay: delay + i * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ))}
    </div>
  );
};

const Savings = () => {
  const { 
    transactions, 
    savingsGoals, 
    budgets, 
    addTransaction 
  } = useAppContext();

  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly', 'monthly', 'annual'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Date range calculation helpers
  const getPeriodInterval = (date, type) => {
    if (type === 'weekly') return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    if (type === 'annual') return { start: startOfYear(date), end: endOfYear(date) };
    return { start: startOfMonth(date), end: endOfMonth(date) };
  };

  const currentInterval = getPeriodInterval(currentDate, timeframe);

  // Navigator functions
  const navigatePeriod = (direction) => {
    const amount = direction === 'next' ? 1 : -1;
    if (timeframe === 'weekly') setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else if (timeframe === 'annual') setCurrentDate(direction === 'next' ? addYears(currentDate, 1) : subYears(currentDate, 1));
    else setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const getPeriodLabel = () => {
    if (timeframe === 'weekly') {
      return `Semana ${format(currentInterval.start, 'd')} — ${format(currentInterval.end, 'd MMMM', { locale: es })}`;
    }
    if (timeframe === 'annual') return format(currentDate, 'yyyy');
    return format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase());
  };

  // Filter transactions based on the selected period
  const periodTransactions = transactions.filter(t => 
    isWithinInterval(parseISO(t.date), currentInterval)
  );

  const totalIncome = periodTransactions.filter(t => t.type.id === 'INCOME').reduce((a, t) => a + t.amount, 0);
  const totalExpense = periodTransactions.filter(t => t.type.id === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Critical expenses calculation (Filtered by period)
  const criticalCategoryIds = ['ALQUILER', 'SUMINISTROS', 'ALIMENTACION', 'TRANSPORTE', 'BEBIDA', 'TABACO', 'SALUD'];
  const criticalTransactions = periodTransactions.filter(t => criticalCategoryIds.includes(t.category.id) && t.type.id === 'EXPENSE');
  const criticalExpenseTotal = criticalTransactions.reduce((a, t) => a + t.amount, 0);
  const savingsCapacity = totalIncome - criticalExpenseTotal;

  // Grouped critical expenses for breakdown
  const criticalBreakdown = criticalCategoryIds.map(catTitle => {
    const amount = periodTransactions
      .filter(t => t.category.id === catTitle && t.type.id === 'EXPENSE')
      .reduce((a, t) => a + t.amount, 0);
    const categoryInfo = transactions.find(t => t.category.id === catTitle)?.category;
    return { id: catTitle, amount, label: categoryInfo?.label || catTitle, emoji: categoryInfo?.emoji || '💰' };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  // Budget calculations (Adjusted for period - purely illustrative for weekly/annual)
  const budgetAnalytics = budgets.map(budget => {
    const spent = periodTransactions
      .filter(t => t.category.id === budget.categoryId && t.type.id === 'EXPENSE')
      .reduce((a, t) => a + t.amount, 0);
    
    // Scale budget limit if not monthly? (Actually better to keep it as "Budget for this period")
    let currentLimit = budget.limit;
    if (timeframe === 'weekly') currentLimit = budget.limit / 4;
    else if (timeframe === 'annual') currentLimit = budget.limit * 12;

    const percent = (spent / currentLimit) * 100;
    let statusClass = 'success';
    let statusColor = 'var(--success)';
    if (percent >= 100) { 
      statusClass = 'danger'; 
      statusColor = 'var(--danger)'; 
    } else if (percent >= 80) { 
      statusClass = 'warning'; 
      statusColor = 'var(--warning)'; 
    }
    return { ...budget, spent, percent, statusClass, statusColor, currentLimit };
  });

  const filtered = periodTransactions.filter(t => filter === 'all' || t.type.id === filter);

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', paddingBottom: 'var(--space-8)', position: 'relative' }}>
      <FloatingOrb color="rgba(52,211,153,0.35)" size="350px" top="-80px" right="-60px" delay={0} opacity={0.1} />
      <FloatingOrb color="rgba(96,165,250,0.25)" size="250px" bottom="100px" left="-60px" delay={4} opacity={0.08} />

      {/* Header with Period Switcher */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', position: 'relative', zIndex: 1 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-1)' }}>
            <h1 className="page-header__title" style={{ marginBottom: 0 }}>Finanzas</h1>
            <div className="tab-group" style={{ padding: 2 }}>
              {[{ id: 'weekly', label: 'Semanal' }, { id: 'monthly', label: 'Mensual' }, { id: 'annual', label: 'Anual' }].map(t => (
                <button 
                  key={t.id} 
                  className={`tab-item ${timeframe === t.id ? 'active' : ''}`} 
                  onClick={() => setTimeframe(t.id)}
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <motion.button className="btn-icon" onClick={() => navigatePeriod('prev')} whileTap={{ scale: 0.9 }}><ChevronLeft size={16} /></motion.button>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 140, textAlign: 'center' }}>{getPeriodLabel()}</h2>
            <motion.button className="btn-icon" onClick={() => navigatePeriod('next')} whileTap={{ scale: 0.9 }}><ChevronRight size={16} /></motion.button>
          </div>
        </div>
        <motion.button
          className="btn btn-primary"
          style={{ padding: '9px 16px', fontSize: '0.8125rem' }}
          whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus size={16} /> Transacción
        </motion.button>
      </motion.header>

      {/* Hero stats row */}
      <StaggerWrapper
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', position: 'relative', zIndex: 1 }}
      >
        {/* Balance card */}
        <StaggerItem>
          <AnimatedCard
            className="card"
            style={{
              background: 'linear-gradient(145deg, var(--bg-secondary), var(--bg-tertiary))',
              position: 'relative', overflow: 'hidden', padding: 'var(--space-6)'
            }}
          >
            <motion.div
              style={{
                position: 'absolute', bottom: -40, right: -40, width: 180, height: 180,
                background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <motion.div
                style={{ padding: 10, background: 'var(--success-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--success)', width: 'fit-content', marginBottom: 'var(--space-4)' }}
                whileHover={{ rotate: 15, scale: 1.1 }}
              >
                <Wallet size={20} />
              </motion.div>
              <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Balance total</p>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 'var(--space-3)' }}>
                <CountUp target={balance} decimals={2} delay={0.2} />
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>€</span>
              </div>
              <Sparkline color="var(--success)" delay={0.3} />
            </div>
          </AnimatedCard>
        </StaggerItem>

        {/* Income */}
        <StaggerItem>
          <AnimatedCard className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <motion.div
                style={{ padding: 10, background: 'var(--success-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}
                whileHover={{ scale: 1.15, rotate: -10 }}
              >
                <ArrowUpRight size={20} />
              </motion.div>
              <span className="badge badge-success">+12%</span>
            </div>
            <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Ingresos</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--success)' }}>
              +<CountUp target={totalIncome} delay={0.4} />
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>€</span>
            </div>
          </AnimatedCard>
        </StaggerItem>

        {/* Expenses */}
        <StaggerItem>
          <AnimatedCard className="card" style={{ padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <motion.div
                style={{ padding: 10, background: 'var(--danger-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}
                whileHover={{ scale: 1.15, rotate: 10 }}
              >
                <ArrowDownLeft size={20} />
              </motion.div>
            </div>
            <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Gastos totales</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--danger)' }}>
              -<CountUp target={totalExpense} delay={0.5} />
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>€</span>
            </div>
          </AnimatedCard>
        </StaggerItem>
      </StaggerWrapper>

      {/* Primary analysis row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-5)', marginBottom: 'var(--space-8)', zIndex: 1, position: 'relative' }}
      >
        {/* Savings Capacity Card */}
        <AnimatedCard 
          className="card" 
          style={{ 
            padding: 'var(--space-6)', 
            background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))',
            border: '2px solid var(--accent-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{ padding: 8, background: 'var(--accent-subtle)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Capacidad de Ahorro</h3>
          </div>
          <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Tras gastos críticos</p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 'var(--space-4)' }}>
            <CountUp target={savingsCapacity} delay={0.8} /> €
          </div>
          <div className="progress-track" style={{ height: 6, background: 'var(--bg-tertiary)' }}>
            <motion.div 
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 'inherit' }}
              initial={{ width: 0 }}
              animate={{ width: `${(savingsCapacity / totalIncome) * 100}%` }}
              transition={{ duration: 1, delay: 1 }}
            />
          </div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 'var(--space-3)' }}>
            Representa el {Math.round((savingsCapacity / totalIncome) * 100)}% de tus ingresos.
          </p>
        </AnimatedCard>

        {/* Expenses Breakdown */}
        <AnimatedCard className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Desglose de Gastos Críticos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
            {criticalBreakdown.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', flexDirection: 'column', gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{item.amount.toLocaleString()}€</div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </motion.div>

      {/* NEW: Budget Control Section */}
      <section style={{ marginBottom: 'var(--space-8)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Control de Presupuestos</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Gestiona tus límites de gasto mensual</p>
          </div>
          <span className="badge badge-accent">Abril 2026</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {budgetAnalytics.map((b, i) => (
            <AnimatedCard key={b.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '1.5rem', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.emoji}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{b.label}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Límite: {b.currentLimit.toLocaleString()}€</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: b.statusColor }}>{b.spent.toLocaleString()}€</span>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: b.statusColor }}>
                    {b.percent >= 100 ? 'Excedido' : b.percent >= 80 ? 'Cerca del límite' : 'Bajo control'}
                  </div>
                </div>
              </div>

              <div className="progress-track" style={{ height: 8, background: 'var(--bg-tertiary)' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(b.percent, 100)}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1 }}
                  style={{ 
                    height: '100%', 
                    background: b.statusColor,
                    borderRadius: 'inherit',
                    boxShadow: b.percent >= 80 ? `0 0 15px ${b.statusColor}44` : 'none'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(b.percent)}% consumido</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: b.statusColor }}>
                  {b.percent >= 100 ? `+${(b.spent - b.currentLimit).toFixed(1)}€` : `Restan ${(b.currentLimit - b.spent).toFixed(1)}€`}
                </span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Main content: transactions + goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-5)', alignItems: 'start', position: 'relative', zIndex: 1 }}>

        {/* Transactions */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div className="tab-group">
              {[{ id: 'all', label: 'Todos' }, { id: 'INCOME', label: 'Ingresos' }, { id: 'EXPENSE', label: 'Gastos' }].map(f => (
                <button key={f.id} className={`tab-item ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <motion.button className="btn-icon" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}><Search size={16} /></motion.button>
              <motion.button className="btn-icon" whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}><Filter size={16} /></motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {filtered.map((t) => (
                  <StaggerItem key={t.id}>
                    <motion.div
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)' }}
                      whileHover={{ x: 4, borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        style={{
                          width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: t.type.id === 'INCOME' ? 'var(--success-subtle)' : 'var(--bg-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.25rem', border: '1px solid var(--border-default)'
                        }}
                        whileHover={{ scale: 1.1, rotate: 8 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {t.category.emoji}
                      </motion.div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 }}>{t.description}</h5>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.date} · {t.category.label}</span>
                      </div>
                      <motion.div
                        style={{ fontSize: '0.9375rem', fontWeight: 700, color: t.type.id === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {t.type.id === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                      </motion.div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerWrapper>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Savings goals sidebar */}
        <aside>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span className="section-title">Metas de ahorro</span>
            <motion.button className="btn-icon" whileHover={{ scale: 1.1, rotate: 90 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Plus size={16} />
            </motion.button>
          </div>

          <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {savingsGoals.map((goal, i) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              return (
                <StaggerItem key={goal.id}>
                  <AnimatedCard className="card" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <motion.div
                        style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-md)',
                          background: `${goal.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                      >
                        {goal.emoji}
                      </motion.div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.875rem', marginBottom: 2 }}>{goal.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faltan {remaining.toLocaleString()}€</span>
                      </div>
                      <motion.span
                        style={{ fontSize: '0.875rem', fontWeight: 800, color: goal.color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                      >
                        {Math.round(progress)}%
                      </motion.span>
                    </div>

                    <div className="progress-track">
                      <motion.div
                        style={{
                          height: '100%', borderRadius: 'inherit',
                          background: `linear-gradient(90deg, ${goal.color}88, ${goal.color})`,
                          boxShadow: `0 0 12px ${goal.color}55`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.4, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{goal.currentAmount.toLocaleString()}€</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{goal.targetAmount.toLocaleString()}€</span>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerWrapper>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 1fr 1fr"] { display: flex !important; flex-direction: column !important; }
          div[style*="gridTemplateColumns: 1fr 340px"] { display: flex !important; flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default Savings;
