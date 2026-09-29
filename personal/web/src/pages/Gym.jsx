import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, History, Dumbbell, Clock, Zap, CheckCircle2, ChevronRight, Timer, Target } from 'lucide-react';
import { AnimatedCard, StaggerWrapper, StaggerItem, FloatingOrb } from '../components/Animated';

const Gym = () => {
  const { gymRoutines, gymHistory } = useAppContext();
  const [activeTab, setActiveTab] = useState('routines');
  const [selectedRoutine, setSelectedRoutine] = useState(gymRoutines[0]);
  const [completedSets, setCompletedSets] = useState({});

  const toggleSet = (exIdx, setIdx) => {
    const key = `${exIdx}-${setIdx}`;
    setCompletedSets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', paddingBottom: 'var(--space-8)', position: 'relative' }}>
      <FloatingOrb color="rgba(239,68,68,0.3)" size="350px" top="-80px" right="-80px" delay={0} opacity={0.08} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', position: 'relative', zIndex: 1 }}
      >
        <div>
          <h1 className="page-header__title">Entrenamiento</h1>
          <p className="page-header__subtitle">Gestiona tus rutinas y progreso</p>
        </div>
        <div className="tab-group">
          {[{ id: 'routines', label: 'Rutinas', icon: <Dumbbell size={15} /> }, { id: 'history', label: 'Historial', icon: <History size={15} /> }].map(t => (
            <button key={t.id} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {activeTab === 'routines' ? (
          <motion.div
            key="routines"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-5)', alignItems: 'start', position: 'relative', zIndex: 1 }}
          >
            {/* Sidebar */}
            <aside>
              <p className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>Mis rutinas</p>
              <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {gymRoutines.map(routine => (
                  <StaggerItem key={routine.id}>
                    <motion.div
                      className={`card card-interactive`}
                      style={{
                        padding: 'var(--space-4)', cursor: 'pointer',
                        borderColor: selectedRoutine.id === routine.id ? 'var(--border-accent)' : 'var(--border-default)',
                        background: selectedRoutine.id === routine.id ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                      }}
                      onClick={() => setSelectedRoutine(routine)}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                        <span className="badge badge-accent">{routine.dayOfWeek}</span>
                        <AnimatePresence>
                          {selectedRoutine.id === routine.id && (
                            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
                              <ChevronRight size={14} color="var(--accent-primary)" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <h4 style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>{routine.name}</h4>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {routine.targetMuscles.map((m, i) => (
                          <span key={i} style={{ fontSize: '1rem' }} data-tooltip={m.label}>{m.emoji}</span>
                        ))}
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerWrapper>
            </aside>

            {/* Exercise Detail */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRoutine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Routine hero */}
                <AnimatedCard className="card" style={{
                  padding: 'var(--space-6)', marginBottom: 'var(--space-5)',
                  background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <motion.div
                    style={{
                      position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                      background: 'radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }}
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>Rutina seleccionada</p>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>{selectedRoutine.name}</h2>
                      <p style={{ fontSize: '0.875rem' }}>{selectedRoutine.description}</p>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={14} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{selectedRoutine.exercises.length} ejercicios</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Timer size={14} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>~60 min</span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      className="btn btn-primary"
                      style={{ flexShrink: 0 }}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play size={18} fill="white" /> Iniciar
                    </motion.button>
                  </div>
                </AnimatedCard>

                {/* Exercises */}
                <p className="text-caption" style={{ marginBottom: 'var(--space-4)' }}>Ejercicios ({selectedRoutine.exercises.length})</p>
                <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {selectedRoutine.exercises.map((ex, exIdx) => (
                    <StaggerItem key={exIdx}>
                      <motion.div className="card" style={{ padding: 'var(--space-5)' }} whileHover={{ x: 4, borderColor: 'var(--border-strong)' }} transition={{ duration: 0.2 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, border: '1px solid var(--border-default)'
                          }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {String(exIdx + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                              <span>{ex.muscleGroup.emoji}</span>
                              <h4 style={{ fontSize: '0.9375rem' }}>{ex.name}</h4>
                              <span className="badge badge-ghost" style={{ marginLeft: 'auto' }}>{ex.muscleGroup.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                              {[
                                { val: ex.sets, label: 'series' },
                                { val: ex.reps, label: 'reps' },
                                ...(ex.weight > 0 ? [{ val: `${ex.weight}kg`, label: 'peso' }] : []),
                              ].map((item, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <div style={{ width: 1, background: 'var(--border-default)' }} />}
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{item.val}</div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                                  </div>
                                </React.Fragment>
                              ))}
                              <div style={{ width: 1, background: 'var(--border-default)' }} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={13} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{ex.restSeconds}s</span>
                              </div>
                            </div>

                            {/* Set buttons */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              {Array.from({ length: ex.sets }).map((_, setIdx) => {
                                const done = completedSets[`${exIdx}-${setIdx}`];
                                return (
                                  <motion.button
                                    key={setIdx}
                                    onClick={() => toggleSet(exIdx, setIdx)}
                                    style={{
                                      width: 36, height: 36,
                                      borderRadius: 'var(--radius-md)',
                                      border: `1px solid ${done ? 'var(--success)' : 'var(--border-default)'}`,
                                      background: done ? 'var(--success-subtle)' : 'var(--bg-tertiary)',
                                      cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '0.75rem', fontWeight: 700,
                                      color: done ? 'var(--success)' : 'var(--text-muted)',
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.85 }}
                                    animate={done ? {
                                      scale: [1, 1.25, 1],
                                      boxShadow: ['0 0 0px transparent', '0 0 20px rgba(52,211,153,0.5)', '0 0 4px rgba(52,211,153,0.2)']
                                    } : {}}
                                    transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
                                  >
                                    <AnimatePresence mode="wait">
                                      {done ? (
                                        <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500 }}>
                                          <CheckCircle2 size={16} />
                                        </motion.div>
                                      ) : (
                                        <motion.span key="num" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{setIdx + 1}</motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                );
                              })}
                            </div>

                            {ex.notes && (
                              <motion.p
                                style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)', fontStyle: 'italic' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                💡 {ex.notes}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerWrapper>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          /* History */
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <StaggerWrapper style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              {[
                { icon: <Zap size={20} />, value: 8, label: 'Sesiones este mes', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
                { icon: <Dumbbell size={20} />, value: '12.4t', label: 'Volumen total', color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
                { icon: <Timer size={20} />, value: '8.7h', label: 'Horas de entreno', color: 'var(--success)', bg: 'var(--success-subtle)' },
              ].map((stat, i) => (
                <StaggerItem key={i}>
                  <AnimatedCard className="card" style={{ padding: 'var(--space-5)' }}>
                    <motion.div style={{ padding: 10, background: stat.bg, borderRadius: 'var(--radius-md)', color: stat.color, width: 'fit-content', marginBottom: 'var(--space-4)' }}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                    >
                      {stat.icon}
                    </motion.div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerWrapper>

            <p className="text-caption" style={{ marginBottom: 'var(--space-4)' }}>Actividad reciente</p>
            <StaggerWrapper style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {gymHistory.map(h => (
                <StaggerItem key={h.id}>
                  <motion.div className="card card-interactive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-5)' }}
                    whileHover={{ x: 6, borderColor: 'var(--border-strong)' }}
                  >
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                      <div style={{ padding: 12, background: 'var(--success-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9375rem', marginBottom: 4 }}>{h.routineName}</h4>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{h.date}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>· {h.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-ghost)" />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerWrapper>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 280px 1fr"] { display: flex !important; flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default Gym;
