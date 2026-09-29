import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Lock, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserData, saveUserData } from '../lib/dataService';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const STORE_ITEMS = [
  {
    id: 'bula_papal',
    name: 'Bula Papal 🙏',
    description: 'Te absuelve de todos los pecados del día. Los puntos negativos de hoy no cuentan.',
    cost: 200,
    emoji: '📜',
    color: '#f59e0b',
    effect: 'bula',
    rarity: 'Legendario',
  },
  {
    id: 'xp_boost',
    name: 'Chute de Dopamina ⚡',
    description: 'Multiplica x2 el XP que ganas durante 24 horas. Para los que quieren subir de nivel rápido.',
    cost: 150,
    emoji: '⚡',
    color: '#a855f7',
    effect: 'xp_boost',
    rarity: 'Épico',
  },
  {
    id: 'escudo_ranking',
    name: 'Escudo del Cobarde 🛡️',
    description: 'Congela tu posición en el ranking durante 3 días aunque te porten mal.',
    cost: 300,
    emoji: '🛡️',
    color: '#3b82f6',
    effect: 'shield',
    rarity: 'Legendario',
  },
  {
    id: 'anonimato',
    name: 'Modo Incógnito 🕵️',
    description: 'Tus pecados de hoy no aparecen en el muro de la pandilla. Nadie se entera.',
    cost: 100,
    emoji: '🕵️',
    color: '#64748b',
    effect: 'anon',
    rarity: 'Raro',
  },
  {
    id: 'titulo_vip',
    name: 'Título: El VIP 🌟',
    description: 'Muestra el título "VIP" junto a tu nombre en el Ranking durante 7 días.',
    cost: 80,
    emoji: '🌟',
    color: '#22d3a5',
    effect: 'title_vip',
    rarity: 'Raro',
  },
  {
    id: 'resurrect',
    name: 'Resurrexit ✝️',
    description: 'Recupera 20 puntos de salud de golpe. Para emergencias post-fiesta.',
    cost: 50,
    emoji: '✝️',
    color: '#ef4444',
    effect: 'health_boost',
    rarity: 'Común',
  },
];

const RARITY_COLORS = {
  'Común': '#94a3b8',
  'Raro': '#22d3a5',
  'Épico': '#a855f7',
  'Legendario': '#f59e0b',
};

const XPStore = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const containerRef = useRef(null);

  const loadData = async () => {
    const data = await getUserData();
    setUserData(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.gsap-title', { y: -30, opacity: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('.store-card', { y: 20, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.2 });
    }
  }, { scope: containerRef, dependencies: [loading] });

  const currentXP = userData?.gamification?.xp || 0;
  const activeEffects = userData?.activeEffects || {};

  const handlePurchase = async (item) => {
    if (currentXP < item.cost) {
      toast.error(`Te faltan ${item.cost - currentXP} XP, pecador arruinado.`, {
        icon: '💸', style: { background: 'var(--bg-dark)', color: '#fff' }
      });
      return;
    }

    setPurchasing(item.id);
    const now = new Date();

    // Calculate expiry
    let expiresAt = null;
    if (item.effect === 'bula') expiresAt = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    if (item.effect === 'xp_boost') expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (item.effect === 'shield') expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (item.effect === 'anon') expiresAt = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    if (item.effect === 'title_vip') expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (item.effect === 'health_boost') expiresAt = null;

    const gamification = userData?.gamification || { xp: 0, level: 1 };
    gamification.xp = Math.max(0, gamification.xp - item.cost);

    const newActiveEffects = { ...activeEffects, [item.effect]: { active: true, expiresAt, purchasedAt: new Date().toISOString() } };

    // Apply immediate effects
    let healthUpdate = {};
    if (item.effect === 'health_boost') {
      const currentHealth = userData?.healthScore || 70;
      healthUpdate = { healthScore: Math.min(100, currentHealth + 20) };
    }

    await saveUserData({ gamification, activeEffects: newActiveEffects, ...healthUpdate });
    await loadData();
    setPurchasing(null);

    toast.success(`¡Comprado! ${item.emoji} "${item.name}" activado.`, {
      style: { background: 'var(--bg-dark)', color: item.color, border: `1px solid ${item.color}40`, fontWeight: 700 },
      duration: 4000,
    });
  };

  const isActive = (item) => {
    const effect = activeEffects?.[item.effect];
    if (!effect?.active) return false;
    if (effect.expiresAt && new Date(effect.expiresAt) < new Date()) return false;
    return true;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(79,125,255,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Abriendo el Mercado Negro...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="gsap-title">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          <ShoppingBag style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px', color: 'var(--accent-primary)' }} size={28} />
          El <span className="text-gradient">Mercado Negro</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gasta tus puntos de experiencia en ventajas, privilegios y artilugios picarones.</p>
      </div>

      {/* XP Balance */}
      <div className="glass-card gsap-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.2)' }}>
        <Zap size={24} color="var(--accent-primary)" />
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tu saldo actual</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{currentXP} XP</p>
        </div>
        <p style={{ margin: '0 0 0 auto', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '200px' }}>
          Gana XP registrando buenos hábitos cada día.
        </p>
      </div>

      {/* Store Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {STORE_ITEMS.map(item => {
          const active = isActive(item);
          const canAfford = currentXP >= item.cost;
          const rarityColor = RARITY_COLORS[item.rarity];

          return (
            <div
              key={item.id}
              className="store-card glass-card"
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                border: active ? `1px solid ${item.color}60` : `1px solid rgba(255,255,255,0.07)`,
                background: active ? `${item.color}10` : 'var(--bg-card)',
                transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {active && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: item.color, color: '#000', fontSize: '0.65rem', fontWeight: 900, borderRadius: '999px', padding: '2px 8px' }}>
                  ACTIVO
                </div>
              )}
              <div style={{ fontSize: '2.5rem' }}>{item.emoji}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{item.name}</h3>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.rarity}</span>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} color={canAfford ? item.color : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: canAfford ? item.color : 'var(--text-muted)' }}>{item.cost} XP</span>
                </div>
                <button
                  onClick={() => !active && handlePurchase(item)}
                  disabled={active || purchasing === item.id}
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : canAfford ? item.color : 'rgba(255,255,255,0.05)',
                    color: active ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: active ? 'default' : canAfford ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                    opacity: !canAfford && !active ? 0.5 : 1,
                  }}
                >
                  {active ? <><CheckCircle size={14} /> Activo</> : !canAfford ? <><Lock size={14} /> Sin XP</> : purchasing === item.id ? 'Comprando...' : '¡Comprar!'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default XPStore;
