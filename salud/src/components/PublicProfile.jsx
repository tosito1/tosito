import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Activity, EyeOff, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getPublicUserHabits, getLeaderboard, getPublicUserData } from '../lib/dataService';
import { BADGES_MAP } from './Profile';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const goodHabitsList = ['water', 'fruit', 'workout'];
const badHabitsList = ['beer', 'wine', 'spirits', 'tobacco', 'cannabis'];

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [fullUserData, setFullUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const leaderboard = await getLeaderboard();
      const user = leaderboard.find(u => u.id === id);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setProfileData(user);
      
      const fData = await getPublicUserData(id);
      setFullUserData(fData);

      if (user.publicProfile) {
        const habits = await getPublicUserHabits(id);
        const chartData = habits.map(day => {
          let goodCount = 0;
          let badCount = 0;
          Object.entries(day.habits || {}).forEach(([key, val]) => {
            if (goodHabitsList.includes(key)) goodCount += val;
            if (badHabitsList.includes(key)) badCount += val;
          });
          return {
            date: day.date.slice(5),
            'Buenos Hábitos': goodCount,
            'Malos Hábitos': badCount
          };
        });
        setWeeklyData(chartData);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  useGSAP(() => {
    if (!loading && profileData) {
      gsap.from(".gsap-fade", { y: 30, opacity: 0, duration: 0.6, stagger: 0.2, ease: "power3.out" });
    }
  }, { scope: containerRef, dependencies: [loading, profileData] });

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>Cargando perfil público...</div>;
  }

  if (!profileData) {
    return (
      <div className="flex-col items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)', gap: '1rem' }}>
        <User size={48} style={{ opacity: 0.5 }} />
        <p>Usuario no encontrado en el ranking.</p>
        <button className="btn btn-outline" onClick={() => navigate('/leaderboard')}><ArrowLeft size={16} /> Volver</button>
      </div>
    );
  }

  const initial = profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U';

  return (
    <div ref={containerRef} className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      <button className="btn gsap-fade" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Volver
      </button>

      <div className="glass-card gsap-fade flex items-center justify-between" style={{ padding: '2rem' }}>
        <div className="flex items-center gap-6">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-success))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', border: '2px solid rgba(255,255,255,0.2)' }}>
            {initial}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{profileData.name}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Usuario de SaludTracker</p>
          </div>
        </div>
        
        <div className="flex-col items-center">
          <Activity color="var(--accent-primary)" size={24} className="mb-2" />
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--accent-primary)' }}>{Math.round(profileData.score)}</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pts de Salud</span>
        </div>
      </div>

      {fullUserData && fullUserData.gamification && fullUserData.gamification.badges && fullUserData.gamification.badges.length > 0 && (
        <>
          <h2 className="gsap-fade mt-6" style={{ fontSize: '1.4rem' }}>Insignias Desbloqueadas</h2>
          {/* Good Badges */}
          {fullUserData.gamification.badges.filter(id => BADGES_MAP[id]?.type === 'good').length > 0 && (
            <>
              <h3 className="gsap-fade mt-2" style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <span>👼</span> Santuario
              </h3>
              <div className="gsap-fade glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(34,211,165,0.2)' }}>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                  {fullUserData.gamification.badges.filter(id => BADGES_MAP[id]?.type === 'good').map(badgeId => {
                    const info = BADGES_MAP[badgeId];
                    const BadgeIcon = info.icon;
                    return (
                      <div key={badgeId} className="flex-col items-center justify-center text-center" style={{ width: '100px', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `rgba(255, 215, 0, 0.1)`, border: `2px solid ${info.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                          <BadgeIcon size={30} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{info.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Bad Badges */}
          {fullUserData.gamification.badges.filter(id => BADGES_MAP[id]?.type === 'bad').length > 0 && (
            <>
              <h3 className="gsap-fade mt-2" style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <span>🔥</span> El Inframundo
              </h3>
              <div className="gsap-fade glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(247,48,74,0.2)' }}>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                  {fullUserData.gamification.badges.filter(id => BADGES_MAP[id]?.type === 'bad').map(badgeId => {
                    const info = BADGES_MAP[badgeId];
                    const BadgeIcon = info.icon;
                    return (
                      <div key={badgeId} className="flex-col items-center justify-center text-center" style={{ width: '100px', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `rgba(255, 215, 0, 0.1)`, border: `2px solid ${info.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                          <BadgeIcon size={30} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{info.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <h2 className="gsap-fade mt-6">Historial de Hábitos</h2>

      {profileData.publicProfile ? (
        <div className="glass-card gsap-fade" style={{ width: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
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
              No hay hábitos registrados en la última semana.
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card gsap-fade flex-col items-center justify-center gap-4" style={{ minHeight: '200px', background: 'rgba(0,0,0,0.3)', borderStyle: 'dashed' }}>
          <EyeOff size={48} color="var(--text-muted)" />
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Perfil Privado</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
            Este usuario ha configurado su perfil como privado. Solo puedes ver su puntuación global, pero no el detalle de sus hábitos diarios.
          </p>
        </div>
      )}

    </div>
  );
};

export default PublicProfile;
