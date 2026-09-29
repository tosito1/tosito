import React, { useState, useEffect, useRef } from 'react';
import { Rss, Star, Flame, Trophy, Award, Zap, Heart, RefreshCw, Users } from 'lucide-react';
import { getFeedEvents, addReaction } from '../lib/dataService';
import { auth } from '../lib/firebase';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Mapping event types to icons, colors, and label builders
const EVENT_CONFIG = {
  badge_unlocked: {
    icon: Award,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: (p) => `desbloqueó la insignia "${p?.badgeName || '?'}" 🏅`,
  },
  level_up: {
    icon: Star,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    label: (p) => `subió al Nivel ${p?.level || '?'} ⭐`,
  },
  questionnaire_done: {
    icon: Heart,
    color: '#22d3a5',
    bg: 'rgba(34,211,165,0.12)',
    label: (p) => `completó el cuestionario con ${p?.score || '?'} pts 💪`,
  },
  streak_milestone: {
    icon: Flame,
    color: '#f7304a',
    bg: 'rgba(247,48,74,0.12)',
    label: (p) => `lleva ${p?.streak || '?'} días de racha 🔥`,
  },
  challenge_joined: {
    icon: Trophy,
    color: '#4f7dff',
    bg: 'rgba(79,125,255,0.12)',
    label: (p) => `se unió al reto "${p?.challengeTitle || '?'}" 🎯`,
  },
  challenge_completed: {
    icon: Trophy,
    color: '#22d3a5',
    bg: 'rgba(34,211,165,0.12)',
    label: (p) => `¡completó el reto "${p?.challengeTitle || '?'}"! 🏆`,
  },
  sin: {
    icon: Zap,
    color: '#f7304a',
    bg: 'rgba(247,48,74,0.08)',
    label: (p) => p?.message || 'cometió un pecado 😈',
  },
};

const timeAgo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins > 0) return `hace ${mins}m`;
  return 'ahora mismo';
};

const REACTION_EMOJIS = ['🍺', '🤡', '🍅', '🚑', '💀', '😂'];

const FeedEventCard = ({ event, index }) => {
  const cfg = EVENT_CONFIG[event.type] || {
    icon: Zap, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)',
    label: () => 'hizo algo',
  };
  const EventIcon = cfg.icon;
  const isMe = event.userId === auth.currentUser?.uid;
  const initial = (event.userName || '?').charAt(0).toUpperCase();
  const [reactions, setReactions] = useState(event.reactions || {});
  const myUid = auth.currentUser?.uid;

  const handleReaction = async (emoji) => {
    if (!event.groupId || !event.id) return;
    // Optimistic update
    const prev = reactions[emoji] || [];
    const alreadyReacted = prev.includes(myUid);
    const updated = alreadyReacted ? prev.filter(uid => uid !== myUid) : [...prev, myUid];
    setReactions(r => ({ ...r, [emoji]: updated }));
    await addReaction(event.groupId, event.id, emoji);
  };

  return (
    <div
      className="feed-event-card"
      style={{ animationDelay: `${index * 0.05}s`, borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          className="feed-avatar"
          style={{
            background: isMe ? 'var(--grad-primary)' : `${cfg.color}18`,
            color: isMe ? '#fff' : cfg.color,
            border: `2px solid ${cfg.color}40`,
          }}
        >
          {event.userPhoto
            ? <img src={event.userPhoto} alt={event.userName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initial}
        </div>
        <div className="feed-event-icon" style={{ background: cfg.bg, color: cfg.color }}>
          <EventIcon size={14} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
          <strong style={{ color: isMe ? 'var(--accent-primary)' : 'var(--text-main)' }}>
            {isMe ? 'Tú' : event.userName}
          </strong>{' '}
          {cfg.label(event.payload)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {timeAgo(event.createdAt)}
          </span>
          {event.groupName && (
            <span style={{
              fontSize: '0.7rem', color: cfg.color,
              background: cfg.bg, border: `1px solid ${cfg.color}25`,
              padding: '1px 7px', borderRadius: 'var(--radius-full)',
            }}>
              {event.groupName}
            </span>
          )}
        </div>

        {/* Reactions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {REACTION_EMOJIS.map(emoji => {
            const reacters = reactions[emoji] || [];
            const reacted = reacters.includes(myUid);
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                style={{
                  background: reacted ? `${cfg.color}25` : 'rgba(255,255,255,0.04)',
                  border: reacted ? `1px solid ${cfg.color}50` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                  display: 'flex', alignItems: 'center', gap: '3px',
                  transition: 'all 0.15s',
                  fontWeight: reacted ? 700 : 400,
                }}
              >
                {emoji}{reacters.length > 0 && <span style={{ fontSize: '0.7rem', color: reacted ? cfg.color : 'var(--text-muted)' }}>{reacters.length}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);

  const loadEvents = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getFeedEvents();
    setEvents(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadEvents(); }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.gsap-title', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
      if (events.length > 0) {
        gsap.from('.feed-event-card', { y: 20, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 });
      }
    }
  }, { scope: containerRef, dependencies: [loading, events.length] });

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>

      {/* Header */}
      <div className="gsap-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Rss size={28} style={{ color: 'var(--accent-primary)' }} />
            Muro de <span className="text-gradient">Actividad</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Lo que está pasando en tus grupos
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => loadEvents(true)}
          disabled={refreshing}
          style={{ gap: '6px' }}
          title="Actualizar feed"
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(79,125,255,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando actividad...</p>
        </div>
      )}

      {/* Events */}
      {!loading && events.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Users size={52} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1.25rem' }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nada por aquí todavía</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Únete a un grupo y empieza a registrar hábitos para ver la actividad de tus amigos.
          </p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {/* Today separator */}
          {events.some(e => new Date(e.createdAt).toDateString() === new Date().toDateString()) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Hoy
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>
          )}
          {events.map((event, i) => (
            <FeedEventCard key={`${event.id}-${i}`} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
