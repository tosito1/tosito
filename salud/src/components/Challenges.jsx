import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Target, Clock, Users, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGroupChallenges, createChallenge, joinChallenge, updateChallengeProgress } from '../lib/dataService';
import { auth } from '../lib/firebase';

const isExpired = (endsAt) => endsAt && new Date(endsAt) < new Date();
const daysLeft = (endsAt) => {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
};

const ChallengeCard = ({ challenge, groupId, onRefresh }) => {
  const uid = auth.currentUser?.uid;
  const myEntry = (challenge.participants || []).find(p => p.userId === uid);
  const expired = isExpired(challenge.endsAt);
  const pct = myEntry ? Math.min((myEntry.progress / challenge.targetValue) * 100, 100) : 0;
  const completed = pct >= 100;
  const left = daysLeft(challenge.endsAt);

  const [progressInput, setProgressInput] = useState(myEntry?.progress || 0);
  const [editingProgress, setEditingProgress] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleJoin = async () => {
    setSaving(true);
    await joinChallenge(groupId, challenge.id, 0);
    toast.success('¡Te has unido al reto! 🎯');
    setSaving(false);
    onRefresh();
  };

  const handleSaveProgress = async () => {
    if (isNaN(progressInput)) return;
    setSaving(true);
    await updateChallengeProgress(groupId, challenge.id, Number(progressInput));
    toast.success('Progreso actualizado ✅');
    setSaving(false);
    setEditingProgress(false);
    onRefresh();
  };

  return (
    <div className="challenge-card" style={completed ? { border: '1px solid rgba(34,211,165,0.4)', background: 'rgba(34,211,165,0.04)' } : {}}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{challenge.title}</h4>
            {completed && <span className="challenge-tag tag-active">✅ Completado</span>}
            {!completed && !expired && myEntry && <span className="challenge-tag tag-joined">🎯 Unido</span>}
            {expired && !completed && <span className="challenge-tag tag-expired">⏰ Expirado</span>}
          </div>
          {challenge.description && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{challenge.description}</p>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-secondary)' }}>{challenge.targetValue}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{challenge.unit}</p>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Users size={13} />
          {(challenge.participants || []).length} participantes
        </span>
        {left !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: expired ? '#94a3b8' : 'var(--accent-warning)' }}>
            <Clock size={13} />
            {expired ? 'Finalizado' : `${left} ${left === 1 ? 'día' : 'días'} restantes`}
          </span>
        )}
      </div>

      {/* My Progress */}
      {myEntry && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mi progreso</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {editingProgress ? (
                <>
                  <input
                    type="number"
                    value={progressInput}
                    onChange={e => setProgressInput(e.target.value)}
                    style={{ width: '70px', padding: '3px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-secondary)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    min={0}
                    max={challenge.targetValue * 2}
                  />
                  <button
                    onClick={handleSaveProgress}
                    disabled={saving}
                    style={{ background: 'var(--accent-success)', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    {saving ? '...' : '✓'}
                  </button>
                  <button
                    onClick={() => { setEditingProgress(false); setProgressInput(myEntry.progress); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700, color: completed ? '#22d3a5' : 'var(--accent-secondary)' }}>
                    {myEntry.progress} / {challenge.targetValue} {challenge.unit}
                  </span>
                  {!expired && (
                    <button
                      onClick={() => setEditingProgress(true)}
                      style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: 'var(--accent-secondary)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Actualizar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="challenge-progress-bar">
            <div className="challenge-progress-fill" style={{ width: `${pct}%`, background: completed ? 'linear-gradient(90deg, #22d3a5, #06d6c7)' : undefined }} />
          </div>
        </div>
      )}

      {/* Leaderboard preview */}
      {(challenge.participants || []).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[...(challenge.participants || [])]
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 5)
            .map((p, i) => {
              const pPct = Math.min((p.progress / challenge.targetValue) * 100, 100);
              return (
                <div key={p.userId} title={`${p.userName}: ${p.progress}/${challenge.targetValue} ${challenge.unit}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    background: p.userId === uid ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${p.userId === uid ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '0.75rem', color: p.userId === uid ? 'var(--accent-secondary)' : 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                  <span>{p.userId === uid ? 'Tú' : p.userName}</span>
                  <span style={{ color: pPct >= 100 ? '#22d3a5' : 'inherit' }}>({Math.round(pPct)}%)</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Join button */}
      {!myEntry && !expired && (
        <button
          className="btn"
          onClick={handleJoin}
          disabled={saving}
          style={{ background: 'var(--grad-primary)', color: '#fff', alignSelf: 'flex-start' }}
        >
          <Target size={15} />
          {saving ? 'Uniéndose...' : 'Unirse al reto'}
        </button>
      )}
    </div>
  );
};

// ─── Create Challenge Modal ────────────────────────────────────────────────────
const CreateChallengeModal = ({ onClose, onCreated, groupId }) => {
  const [form, setForm] = useState({ title: '', description: '', targetValue: '', unit: '', endsAt: '' });
  const [saving, setSaving] = useState(false);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!form.title.trim() || !form.targetValue || !form.unit.trim()) {
      return toast.error('Rellena al menos el nombre, objetivo y unidad');
    }
    setSaving(true);
    const id = await createChallenge(groupId, {
      ...form,
      targetValue: Number(form.targetValue),
      endsAt: form.endsAt || null,
    });
    if (id) {
      toast.success('¡Reto creado! 🎯');
      onCreated();
      onClose();
    } else {
      toast.error('Error al crear el reto');
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,8,20,0.75)',
      backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '480px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} style={{ color: 'var(--accent-secondary)' }} />
            Nuevo Reto
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Nombre del reto *</label>
            <input className="input-field" placeholder="Ej: 10.000 pasos diarios" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Descripción (opcional)</label>
            <input className="input-field" placeholder="Ej: Supera los 10k pasos cada día esta semana" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Objetivo *</label>
              <input className="input-field" type="number" placeholder="10000" value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))} min={1} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Unidad *</label>
              <input className="input-field" placeholder="pasos, km, días..." value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Fecha límite (opcional)</label>
            <input className="input-field" type="date" value={form.endsAt} min={tomorrow} onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))}
              style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleCreate} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Creando...' : '🎯 Crear Reto'}
        </button>
      </div>
    </div>
  );
};

// ─── Main Challenges Component ────────────────────────────────────────────────
const Challenges = ({ groupId, isLeader }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getGroupChallenges(groupId);
    setChallenges(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [groupId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(168,85,247,0.2)', borderTopColor: 'var(--accent-secondary)', animation: 'spin-slow 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '1.2rem' }}>
          <Trophy size={20} />
          Retos del Grupo
        </h2>
        <button
          className="btn btn-ghost"
          onClick={() => setShowCreate(true)}
          style={{ borderColor: 'rgba(168,85,247,0.3)', color: 'var(--accent-secondary)', gap: '6px' }}
        >
          <Plus size={15} /> Crear Reto
        </button>
      </div>

      {challenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed rgba(168,85,247,0.2)', borderRadius: 'var(--radius-md)' }}>
          <Trophy size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>No hay retos todavía.</p>
          <p style={{ fontSize: '0.85rem' }}>Crea el primero para motivar al grupo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {challenges.map(c => (
            <ChallengeCard key={c.id} challenge={c} groupId={groupId} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateChallengeModal
          groupId={groupId}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
};

export default Challenges;
