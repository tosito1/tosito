import React, { useState, useEffect, useRef } from 'react';
import { Swords, Crown, Users, Plus, Clock, Trophy, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserGroups, getGroupDetails, createDuel, getUserDuels, acceptDuel, resolveDuel } from '../lib/dataService';
import { auth } from '../lib/firebase';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const STATUS_LABELS = {
  pending: { label: 'Esperando respuesta...', color: '#f59e0b' },
  active: { label: '⚔️ ¡En curso!', color: '#22d3a5' },
  completed: { label: 'Finalizado', color: '#64748b' },
};

const Duels = () => {
  const [duels, setDuels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [duelType, setDuelType] = useState('health'); // 'health' | 'good_habits' | 'bad_habits'
  const [duelDays, setDuelDays] = useState(3);
  const [stake, setStake] = useState('');
  const containerRef = useRef(null);

  const myUid = auth.currentUser?.uid;

  const loadData = async () => {
    setLoading(true);
    const [g, d] = await Promise.all([getUserGroups(), getUserDuels()]);
    setGroups(g);
    setDuels(d);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedGroup) { setGroupMembers([]); return; }
      const details = await getGroupDetails(selectedGroup);
      if (details) {
        setGroupMembers((details.memberDetails || []).filter(m => m.id !== myUid));
      }
    };
    loadMembers();
  }, [selectedGroup, myUid]);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.gsap-element', { y: 20, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' });
    }
  }, { scope: containerRef, dependencies: [loading, view] });

  const handleCreate = async () => {
    if (!selectedGroup || !selectedOpponent || !stake.trim()) {
      toast.error('Rellena todos los campos, cobarde.');
      return;
    }
    const opponent = groupMembers.find(m => m.id === selectedOpponent);
    const endsAt = new Date(Date.now() + duelDays * 24 * 60 * 60 * 1000).toISOString();
    const t = toast.loading('Enviando reto...');
    const id = await createDuel(selectedGroup, {
      opponentId: selectedOpponent,
      opponentName: opponent?.name || 'Desconocido',
      type: duelType,
      endsAt,
      stake,
    });
    toast.dismiss(t);
    if (id) {
      toast.success('¡Reto enviado! Que tiemble.');
      setView('list');
      loadData();
    } else {
      toast.error('Error al crear el reto.');
    }
  };

  const handleAccept = async (duel) => {
    const t = toast.loading('Aceptando reto...');
    await acceptDuel(duel.groupId, duel.id);
    toast.dismiss(t);
    toast.success('¡Reto aceptado! Es hora de la guerra.');
    loadData();
  };

  const TYPE_LABELS = {
    health: '💉 Mayor puntuación de salud',
    good_habits: '😇 Más buenos hábitos acumulados',
    bad_habits: '😈 Menos pecados (más difícil de lo que parece)',
  };

  const myDuels = duels.filter(d => d.challengerId === myUid || d.opponentId === myUid);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(79,125,255,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando arena de combate...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="gsap-element" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Swords size={28} color="var(--accent-danger)" /> Duelos <span className="text-gradient">1 vs 1</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reta a tu pandilla. El perdedor paga la ronda.</p>
        </div>
        <button
          className="btn"
          onClick={() => setView(view === 'create' ? 'list' : 'create')}
          style={{ background: view === 'create' ? 'rgba(255,255,255,0.07)' : 'var(--accent-danger)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {view === 'create' ? 'Cancelar' : <><Plus size={16} /> Retar</>}
        </button>
      </div>

      {/* Create Duel Form */}
      {view === 'create' && (
        <div className="glass-card gsap-element" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(247,48,74,0.2)' }}>
          <h3 style={{ margin: 0, color: 'var(--accent-danger)' }}>⚔️ Nuevo Reto</h3>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Grupo</label>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.6rem 0.75rem', fontSize: '0.9rem' }}
            >
              <option value="">Elige un grupo...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {groupMembers.length > 0 && (
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Rival</label>
              <select
                value={selectedOpponent}
                onChange={e => setSelectedOpponent(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.6rem 0.75rem', fontSize: '0.9rem' }}
              >
                <option value="">Elige tu víctima...</option>
                {groupMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Tipo de Duelo</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: duelType === key ? 'rgba(247,48,74,0.1)' : 'transparent', border: `1px solid ${duelType === key ? 'rgba(247,48,74,0.3)' : 'transparent'}` }}>
                  <input type="radio" name="type" value={key} checked={duelType === key} onChange={() => setDuelType(key)} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Duración: {duelDays} días</label>
            <input type="range" min={1} max={7} value={duelDays} onChange={e => setDuelDays(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-danger)' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>La apuesta (¿qué paga el perdedor?)</label>
            <input
              type="text"
              value={stake}
              onChange={e => setStake(e.target.value)}
              placeholder="Ej: Paga la ronda, lava los platos, etc."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.6rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            className="btn"
            onClick={handleCreate}
            style={{ background: 'var(--accent-danger)', border: 'none', color: '#fff', width: '100%', fontWeight: 700 }}
          >
            🗡️ Enviar Reto
          </button>
        </div>
      )}

      {/* Duels List */}
      {myDuels.length === 0 && view === 'list' ? (
        <div className="glass-card gsap-element" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Swords size={52} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sin duelos activos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>¿Tienes miedo? Reta a alguien y demuestra quién manda.</p>
        </div>
      ) : (
        myDuels.map(duel => {
          const isChallenger = duel.challengerId === myUid;
          const isPending = duel.status === 'pending';
          const isMyChallenge = isChallenger && isPending;
          const isOpponentPending = !isChallenger && isPending;
          const statusCfg = STATUS_LABELS[duel.status] || STATUS_LABELS.pending;
          const endsAt = new Date(duel.endsAt);
          const now = new Date();
          const daysLeft = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));

          return (
            <div key={duel.id} className="glass-card gsap-element" style={{ border: duel.status === 'active' ? '1px solid rgba(34,211,165,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Swords size={18} color={statusCfg.color} />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {duel.challengerName} vs {duel.opponentName}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: statusCfg.color, background: `${statusCfg.color}18`, padding: '2px 10px', borderRadius: '999px', fontWeight: 600 }}>
                  {statusCfg.label}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Tipo:</strong> {TYPE_LABELS[duel.type] || duel.type}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Apuesta:</strong> {duel.stake}
                </p>
                {duel.status !== 'completed' && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: daysLeft <= 1 ? '#f7304a' : 'var(--text-muted)' }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {daysLeft > 0 ? `Termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}` : '¡Terminado!'}
                  </p>
                )}
              </div>

              {isOpponentPending && (
                <button
                  className="btn"
                  onClick={() => handleAccept(duel)}
                  style={{ background: 'var(--accent-success)', border: 'none', color: '#fff', width: '100%', fontWeight: 700 }}
                >
                  ⚔️ ¡Acepto el reto!
                </button>
              )}
              {isMyChallenge && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Esperando a que {duel.opponentName} acepte...</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Duels;
