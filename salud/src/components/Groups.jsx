import React, { useState, useEffect, useRef } from 'react';
import { Skull, AlertTriangle, Users, Copy, Plus, LogIn, ArrowLeft, Crown, Flame, Zap, Trophy, Target, Edit3, Save, Share2, QrCode, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createGroup, joinGroup, getUserGroups, getGroupDetails, updateGroupRules } from '../lib/dataService';
import Challenges from './Challenges';
import { auth } from '../lib/firebase';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { QRCodeSVG } from 'qrcode.react';

gsap.registerPlugin(useGSAP);

const RANK_LABELS = ['👑 Líder de la Basura', '💩 Vice-Basura', '😬 Aspirante', '😇 El Aburrido'];

const Groups = () => {
  const [view, setView] = useState('list');
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // Rules state
  const [editingRules, setEditingRules] = useState(false);
  const [rules, setRules] = useState({ rewardTop: '', punishmentBottom: '', activeChallenge: '' });
  const [showQr, setShowQr] = useState(false);

  const containerRef = useRef(null);

  const loadGroups = async () => {
    setLoading(true);
    const g = await getUserGroups();
    setGroups(g);
    setLoading(false);
  };

  useEffect(() => { loadGroups(); }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.gsap-element', { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
    }
  }, { scope: containerRef, dependencies: [loading, view, currentGroup] });

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error('Escribe un nombre');
    const t = toast.loading('Creando...');
    const id = await createGroup(groupName);
    toast.dismiss(t);
    if (id) { toast.success('¡Pandilla creada!'); setGroupName(''); loadGroups(); }
    else toast.error('Error al crear');
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return toast.error('Introduce un código');
    const t = toast.loading('Uniéndose...');
    const res = await joinGroup(inviteCode.toUpperCase());
    toast.dismiss(t);
    if (res.success) { toast.success('¡Te has unido a la pandilla!'); setInviteCode(''); loadGroups(); }
    else toast.error(res.message);
  };

  const [detailTab, setDetailTab] = useState('group');

  const openGroup = async (groupId) => {
    setView('detail');
    setDetailTab('group');
    setLoading(true);
    const details = await getGroupDetails(groupId);
    setCurrentGroup(details);
    setRules({
      rewardTop: details.rewardTop || '',
      punishmentBottom: details.punishmentBottom || '',
      activeChallenge: details.activeChallenge || ''
    });
    setLoading(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado: ' + code);
  };

  const handleSaveRules = async () => {
    const t = toast.loading('Guardando reglas...');
    await updateGroupRules(currentGroup.id, rules);
    setCurrentGroup({ ...currentGroup, ...rules });
    setEditingRules(false);
    toast.dismiss(t);
    toast.success('Reglas actualizadas');
  };

  const handleShareGroup = async () => {
    const shareData = {
      title: 'SaludTracker - Invitación',
      text: `¡Únete a mi pandilla tóxica "${currentGroup.name}" en SaludTracker!\n\nCódigo de invitación: ${currentGroup.inviteCode}\n\n`,
      url: window.location.origin
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast.success('Invitación copiada al portapapeles');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(247,48,74,0.2)', borderTopColor: '#f7304a', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando pandillas...</p>
      </div>
    );
  }

  /* ─── GROUP DETAIL VIEW ─── */
  if (view === 'detail' && currentGroup) {
    const isLeader = auth.currentUser?.uid === currentGroup.createdBy;
    const totalMembers = currentGroup.memberDetails.length;

    return (
      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>

        <button className="btn gsap-element" onClick={() => { setView('list'); setCurrentGroup(null); setEditingRules(false); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', alignSelf: 'flex-start', paddingLeft: 0 }}>
          <ArrowLeft size={18} /> Volver a Grupos
        </button>

        {/* Tab Navigation */}
        <div className="gsap-element" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', alignSelf: 'flex-start' }}>
          {[{ id: 'group', label: '👥 Grupo' }, { id: 'challenges', label: '🏆 Retos' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
                fontSize: '0.88rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: detailTab === tab.id ? 'var(--grad-primary)' : 'transparent',
                color: detailTab === tab.id ? '#fff' : 'var(--text-muted)',
                boxShadow: detailTab === tab.id ? '0 2px 10px rgba(79,125,255,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="gsap-element" style={{
          background: 'linear-gradient(135deg, rgba(247,48,74,0.12) 0%, rgba(13,20,40,0.9) 60%)',
          border: '1px solid rgba(247,48,74,0.25)', borderRadius: 'var(--radius-lg)', padding: '2rem',
          boxShadow: '0 0 40px rgba(247,48,74,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Skull size={24} style={{ color: '#f7304a' }} />
              <h1 style={{ margin: 0, fontSize: '2rem' }}>{currentGroup.name}</h1>
              {isLeader && <span style={{ background: 'rgba(255,215,0,0.2)', color: 'gold', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>LÍDER</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {'Código de invitación: '}
              <code style={{ color: '#f7304a', background: 'rgba(247,48,74,0.12)', padding: '2px 10px', borderRadius: '6px', fontSize: '1.1rem', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                {currentGroup.inviteCode}
              </code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowQr(true)} className="btn-icon"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)' }} title="Mostrar QR">
              <QrCode size={18} />
            </button>
            <button onClick={handleShareGroup} className="btn"
              style={{ background: 'rgba(247,48,74,0.15)', color: '#f7304a', border: '1px solid rgba(247,48,74,0.3)', padding: '0.5rem 1rem' }}>
              <Share2 size={16} style={{ marginRight: '6px' }} /> Invitar
            </button>
          </div>
        </div>

        {showQr && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-card" style={{ background: 'var(--bg-dark)', padding: '2rem', textAlign: 'center', position: 'relative', width: '100%', maxWidth: '350px' }}>
              <button onClick={() => setShowQr(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
              <h2 style={{ margin: '0 0 0.5rem', color: '#f7304a' }}>Únete a {currentGroup.name}</h2>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código: <strong style={{ color: '#fff', fontSize: '1.1rem', letterSpacing: '2px' }}>{currentGroup.inviteCode}</strong></p>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block' }}>
                <QRCodeSVG value={window.location.origin} size={220} bgColor="#ffffff" fgColor="#0d1428" />
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Escanea el QR para abrir la app y mete el código para unirte.</p>
            </div>
          </div>
        )}

        {/* Group Tab Content */}
        {detailTab === 'group' && (
          <>
        {/* Group Rules Section */}
        <div className="gsap-element glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(34,211,165,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)', fontSize: '1.2rem' }}>
              <Target size={20} /> Reglas de la Pandilla
            </h2>
            {isLeader && !editingRules && (
              <button className="btn-icon" onClick={() => setEditingRules(true)} style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Edit3 size={16} />
              </button>
            )}
            {isLeader && editingRules && (
              <button className="btn-icon" onClick={handleSaveRules} style={{ background: 'var(--accent-success)', color: '#fff' }}>
                <Save size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Trophy size={20} style={{ color: 'gold', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: 'gold', display: 'block', marginBottom: '4px' }}>Premio al Campeón (Top 1)</strong>
                {editingRules ? (
                  <input type="text" className="input-field" value={rules.rewardTop} onChange={e => setRules({...rules, rewardTop: e.target.value})} placeholder="Ej: No paga la próxima cena" />
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{currentGroup.rewardTop || 'Sin premio definido.'}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} style={{ color: '#f7304a', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#f7304a', display: 'block', marginBottom: '4px' }}>Castigo al Perdedor (Último)</strong>
                {editingRules ? (
                  <input type="text" className="input-field" value={rules.punishmentBottom} onChange={e => setRules({...rules, punishmentBottom: e.target.value})} placeholder="Ej: Lava los platos de todos" />
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{currentGroup.punishmentBottom || 'Sin castigo definido.'}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Flame size={20} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: 'var(--accent-warning)', display: 'block', marginBottom: '4px' }}>Reto Semanal de Pandilla</strong>
                {editingRules ? (
                  <input type="text" className="input-field" value={rules.activeChallenge} onChange={e => setRules({...rules, activeChallenge: e.target.value})} placeholder="Ej: Todos deben dar 10k pasos diarios" />
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{currentGroup.activeChallenge || 'Sin reto activo.'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Wall of Shame */}
          <div className="gsap-element" style={{ flex: '1 1 320px' }}>
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f7304a' }}>
              <Skull size={20} /> Ranking de la Vergüenza
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {currentGroup.memberDetails.map((m, index) => {
                const isWinner = index === 0 && totalMembers > 1;
                const isLoser = index === totalMembers - 1 && totalMembers > 1;
                
                let boxStyle = {
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animation: 'none'
                };
                
                if (index === 0) {
                  boxStyle = { background: 'rgba(247,48,74,0.1)', border: '1px solid rgba(247,48,74,0.3)', animation: 'pulse-red 2s ease-in-out infinite' };
                }
                
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)',
                    ...boxStyle
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: index === 0 ? 'rgba(247,48,74,0.2)' : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${index === 0 ? 'rgba(247,48,74,0.4)' : 'var(--border-subtle)'}`,
                        color: index === 0 ? '#f7304a' : 'var(--text-muted)', fontWeight: 800,
                      }}>
                        {index === 0 ? <Crown size={16} /> : index + 1}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {m.name}
                          {isWinner && currentGroup.rewardTop && <Trophy size={14} color="gold" title="Recibe el Premio" />}
                          {isLoser && currentGroup.punishmentBottom && <AlertTriangle size={14} color="#f7304a" title="Recibe el Castigo" />}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: index === 0 ? '#f7304a' : 'var(--text-muted)' }}>
                          {RANK_LABELS[index] || '🫡 Sobreviviente'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem', color: index === 0 ? '#f7304a' : 'var(--text-main)' }}>
                        {Math.round(m.score || 0)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>pts salud</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sin Feed */}
          <div className="gsap-element" style={{ flex: '1 1 360px' }}>
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)' }}>
              <Flame size={20} /> Muro de Pecados
            </h2>
            <div style={{
              background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245,166,35,0.15)', borderRadius: 'var(--radius-md)',
              padding: '1.25rem', height: '420px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '0.625rem'
            }}>
              {currentGroup.sins.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={36} style={{ opacity: 0.3 }} />
                  <p>Nadie ha pecado todavía...</p>
                  <p style={{ fontSize: '0.8rem' }}>¿Seguro que sois amigos?</p>
                </div>
              ) : currentGroup.sins.map(sin => (
                <div key={sin.id} style={{
                  padding: '0.875rem 1rem',
                  background: 'rgba(245,166,35,0.05)',
                  border: '1px solid rgba(245,166,35,0.12)',
                  borderLeft: '3px solid var(--accent-warning)',
                  borderRadius: 'var(--radius-xs)',
                }}>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 500 }}>
                    {'🚨 '}{sin.message}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(sin.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Challenges Tab */}
        {detailTab === 'challenges' && (
          <div className="gsap-element">
            <Challenges groupId={currentGroup.id} isLeader={isLeader} />
          </div>
        )}
      </div>
    );
  }

  /* ─── GROUP LIST VIEW ─── */
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>

      <div className="gsap-element">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Skull style={{ color: '#f7304a' }} size={32} />
          Pandillas <span className="text-gradient-warm">Tóxicas</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Compite con amigos por ver quién tiene los peores hábitos. El que menos puntos tenga, gana la corona de la vergüenza.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }} className="gsap-element">
        <div style={{ flex: '1 1 280px', background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid rgba(79,125,255,0.2)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--accent-primary)' }} /> Crear Pandilla
          </h3>
          <input className="input-field" type="text" placeholder="Ej: Los Sedentarios 2024"
            value={groupName} onChange={e => setGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%' }}>
            <Plus size={16} /> Crear Grupo
          </button>
        </div>

        <div style={{ flex: '1 1 280px', background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogIn size={18} style={{ color: 'var(--accent-warning)' }} /> Unirse con Código
          </h3>
          <input className="input-field" type="text" placeholder="Ej: AB12CD"
            value={inviteCode} onChange={e => setInviteCode(e.target.value)}
            maxLength={6} style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '1.2rem' }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          <button onClick={handleJoin} className="btn" style={{ background: 'var(--accent-warning)', color: '#111', width: '100%', fontWeight: 700 }}>
            <Zap size={16} /> Unirse
          </button>
        </div>
      </div>

      <div className="gsap-element">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.875rem', color: 'var(--text-sub)' }}>
          Mis Pandillas ({groups.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groups.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '3rem', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Aún no estás en ningún grupo</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Crea uno o pide a tus amigos un código de invitación</p>
            </div>
          ) : groups.map(g => (
            <div key={g.id} onClick={() => openGroup(g.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(247,48,74,0.12)', borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem', cursor: 'pointer',
              transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(247,48,74,0.35)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(247,48,74,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(247,48,74,0.12)'; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(247,48,74,0.12)', border: '1px solid rgba(247,48,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f7304a' }}>
                  <Skull size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{g.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {g.members.length} {g.members.length === 1 ? 'pecador' : 'pecadores'} - codigo: <code style={{ color: '#f7304a' }}>{g.inviteCode}</code>
                  </p>
                </div>
              </div>
              <ArrowLeft size={18} style={{ color: 'var(--text-muted)', transform: 'rotate(180deg)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Groups;
