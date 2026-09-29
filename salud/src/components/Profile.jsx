import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Trash2, Edit3, Save, Activity, Calendar, ClipboardList, Award, HeartPulse, Zap, Droplets, Wine, Cigarette, Flame, AlertTriangle, Brain, Dumbbell, Pizza, Moon, Download, Sun, Apple, BookOpen, Leaf, Skull, Ghost, Gamepad2, Shield, Bell, Share2, QrCode, X } from 'lucide-react';
import { auth, messaging } from '../lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { getUserData, saveUserData, getUserStats, wipeUserData, togglePublicProfile, saveNotificationToken } from '../lib/dataService';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { QRCodeSVG } from 'qrcode.react';

gsap.registerPlugin(useGSAP);

export const BADGES_MAP = {
  first_blood: { name: 'Primer Paso', icon: Award, color: 'gold', desc: 'Realizaste tu primer análisis clínico.', type: 'good' },
  healthy: { name: 'Salud de Hierro', icon: HeartPulse, color: '#ef4444', desc: 'Obtuviste más de 80 puntos de salud.', type: 'good' },
  aquaman: { name: 'Aquaman', icon: Droplets, color: '#3b82f6', desc: 'Súper hidratación registrada.', type: 'good' },
  santo_bebedor: { name: 'Santo Bebedor', icon: Droplets, color: '#60a5fa', desc: '8 vasos de agua. Orinas agua mineral.', type: 'good' },
  vegano_extremo: { name: 'Vegano Extremo', icon: Apple, color: '#22c55e', desc: 'Mucha fruta. Casi puedes hacer la fotosíntesis.', type: 'good' },
  lector: { name: 'Cervantes', icon: BookOpen, color: '#eab308', desc: 'Te has leído hasta las etiquetas del champú.', type: 'good' },
  streaker: { name: 'Imparable', icon: Zap, color: '#f59e0b', desc: 'Racha legendaria mantenida.', type: 'good' },
  
  // Toxic Badges
  esponja: { name: 'Esponja Humana', icon: Wine, color: '#fcd34d', desc: '5 cervezas en un día. Hígado trabajando horas extra.', type: 'bad' },
  coma_etilico: { name: 'Coma Etílico', icon: Skull, color: '#991b1b', desc: 'Cantidades industriales. El Samur te conoce por tu nombre.', type: 'bad' },
  chupitos: { name: 'Rey del Chupito', icon: Wine, color: '#f43f5e', desc: 'Demasiados cubatas. Te crees invencible.', type: 'bad' },
  coyote: { name: 'El Coyote', icon: Ghost, color: '#d946ef', desc: 'Despertaste sin saber dónde ni con quién.', type: 'bad' },
  alquimista: { name: 'Alquimista', icon: Flame, color: '#f59e0b', desc: 'Mezclaste de todo. La resaca será épica.', type: 'bad' },
  astronauta: { name: 'Astronauta', icon: Zap, color: '#cbd5e1', desc: 'Un tirito (cocaína). Has viajado a la luna.', type: 'bad' },
  viaje_astral: { name: 'Viaje Astral', icon: Flame, color: '#a855f7', desc: 'MDMA / Pastis. Estás viendo colores nuevos.', type: 'bad' },
  bob_marley: { name: 'Bob Marley', icon: Leaf, color: '#16a34a', desc: 'Demasiado verde. Estás fusionado con el sofá.', type: 'bad' },
  chimenea: { name: 'Chimenea', icon: Cigarette, color: '#64748b', desc: '5 cigarros. Tienes alquitrán para asfaltar una calle.', type: 'bad' },
  pulmones_negros: { name: 'Pulmones Negros', icon: Skull, color: '#1e293b', desc: 'Fumaste lo que no está escrito. Toses como un tractor.', type: 'bad' },
  gordaco: { name: 'Rey del Colesterol', icon: Pizza, color: '#f97316', desc: 'Munchies extremos.', type: 'bad' },
  pacman: { name: 'Pac-Man', icon: Pizza, color: '#ea580c', desc: 'Atracones continuos. Tu sangre es mayonesa.', type: 'bad' },
  zombie: { name: 'The Walking Dead', icon: AlertTriangle, color: '#84cc16', desc: 'Resaca paralizante registrada. Pobre diablo.', type: 'bad' },
  yonqui_digital: { name: 'Yonqui Digital', icon: Gamepad2, color: '#0ea5e9', desc: 'Cerebro frito de tanto scroll infinito.', type: 'bad' },
  
  // Healthy/Recovery Badges
  ironman: { name: 'Ironman', icon: Dumbbell, color: '#10b981', desc: 'Sudando el alcohol en el gym.', type: 'good' },
  espartano: { name: 'Espartano', icon: Shield, color: '#dc2626', desc: 'Entrenaste como una auténtica bestia.', type: 'good' },
  monje: { name: 'Monje Tibetano', icon: Brain, color: '#8b5cf6', desc: 'Llorando en posición fetal (o meditando).', type: 'good' },
  buda: { name: 'Buda Reencarnado', icon: Brain, color: '#c084fc', desc: 'Mucha meditación. La paz mental te aburre.', type: 'good' },
  bello_durmiente: { name: 'Bello Durmiente', icon: Moon, color: '#3b82f6', desc: 'Dormiste la mona 8 horas seguidas.', type: 'good' }
};

const Profile = ({ installPrompt, handleInstallClick }) => {
  const [stats, setStats] = useState({ totalQuestionnaires: 0, totalDaysLogged: 0 });
  const [healthScore, setHealthScore] = useState(0);
  const [gamification, setGamification] = useState({ badges: [], level: 1, xp: 0 });
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('light-mode') === false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return typeof Notification !== 'undefined' && typeof Notification.permission !== 'undefined' ? Notification.permission === 'granted' : false;
    } catch (e) {
      return false;
    }
  });
  const [showQr, setShowQr] = useState(false);
  
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (auth.currentUser) {
        setDisplayName(auth.currentUser.displayName || (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Usuario'));
        const data = await getUserData();
        setHealthScore(data.healthScore || 0);
        setGamification(data.gamification || { badges: [], level: 1, xp: 0 });
        setIsPublic(data.publicProfile || false);
        const s = await getUserStats();
        setStats(s);
      }
      setLoading(false);
    };
    loadProfileData();
  }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from(".gsap-element", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out"
      });
    }
  }, { scope: containerRef, dependencies: [loading] });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleWipeData = async () => {
    if (window.confirm('🚨 ¡CUIDADO! ¿Estás totalmente seguro de que quieres borrar TODOS tus datos (hábitos, cuestionarios, puntuación)? Esta acción es IRREVERSIBLE.')) {
      if (window.confirm('¿Última oportunidad. Borrar todo?')) {
        const loadingToast = toast.loading('Borrando datos...');
        await wipeUserData();
        toast.dismiss(loadingToast);
        toast.success('Todos tus datos han sido eliminados.');
        // After wiping, refresh the page to clear states or go to dashboard
        window.location.href = '/';
      }
    }
  };

  const saveName = async () => {
    if (!displayName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    try {
      await updateProfile(auth.currentUser, { displayName });
      // To sync with leaderboard, save dummy data to trigger leaderboard update
      await saveUserData({ healthScore }); 
      setEditingName(false);
      toast.success('Nombre actualizado');
    } catch (error) {
      toast.error('Error al actualizar nombre');
    }
  };

  const toggleTheme = () => {
    const isLightMode = document.documentElement.classList.toggle('light-mode');
    setIsDark(!isLightMode);
    localStorage.setItem('saludtracker-theme', isLightMode ? 'light' : 'dark');
  };

  const enableNotifications = async () => {
    if (!messaging || typeof Notification === 'undefined') {
      toast.error('Las notificaciones no están soportadas en este navegador o aplicación nativa.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          toast.error('Falta la clave VAPID en las variables de entorno.');
          return;
        }
        const token = await getToken(messaging, { vapidKey });
        if (token) {
          await saveNotificationToken(token);
          setNotificationsEnabled(true);
          toast.success('¡Notificaciones activadas!', { style: { background: 'var(--bg-dark)', color: 'var(--accent-success)' }});
        } else {
          toast.error('No se pudo obtener el token de notificaciones.');
        }
      } else {
        toast.error('Permiso denegado para notificaciones.');
      }
    } catch (error) {
      console.error('Error al solicitar permiso para notificaciones:', error);
      toast.error('Error al activar notificaciones. Comprueba la consola.');
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'SaludTracker',
      text: '¡Únete a mi pandilla en SaludTracker y compite por ver quién tiene peor salud! 🍻',
      url: window.location.origin
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>Cargando perfil...</div>;
  }

  const user = auth.currentUser;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      <h1 className="gsap-element flex items-center gap-3 mb-4">
        <User className="text-gradient" size={32} /> Mi Perfil
      </h1>

      {installPrompt ? (
        <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem', background: 'rgba(34, 211, 165, 0.1)', border: '1px solid rgba(34, 211, 165, 0.3)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--accent-success)' }}>Instalar Aplicación</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Instala SaludTracker en tu móvil o PC para acceso rápido.</p>
          </div>
          <button className="btn" onClick={handleInstallClick} style={{ background: 'var(--accent-success)', color: '#fff', border: 'none' }}>
            <Download size={18} style={{ marginRight: '8px' }} /> Instalar
          </button>
        </div>
      ) : (
        <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>App Instalable</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Si no ves el botón verde, puedes instalar la app desde el menú de tu navegador (Chrome: icono de pantalla, Safari: Compartir {'>'} Añadir a inicio).
            </p>
          </div>
        </div>
      )}

      {/* Identity Card */}
      <div className="glass-card gsap-element flex items-center gap-6" style={{ padding: '2rem' }}>
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} 
          />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-success))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', border: '2px solid rgba(255,255,255,0.2)' }}>
            {initial}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
          
          {editingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                autoFocus
              />
              <button className="btn-icon" onClick={saveName} style={{ background: 'var(--accent-success)', color: '#fff' }}>
                <Save size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{displayName}</h2>
              <button className="btn-icon" onClick={() => setEditingName(true)} style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent' }} title="Editar nombre">
                <Edit3 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share / Invite Section */}
      <h2 className="gsap-element mt-6" style={{ fontSize: '1.4rem' }}>Invitar Colegas</h2>
      <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(79, 125, 255, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(79, 125, 255, 0.3)' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Pásales la App</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manda un WhatsApp, un Insta, o enséñales el código QR para que se unan a la secta.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-icon" onClick={() => setShowQr(true)} style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(79, 125, 255, 0.3)' }} title="Mostrar QR">
            <QrCode size={20} />
          </button>
          <button className="btn" onClick={handleShareApp} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none' }}>
            <Share2 size={18} style={{ marginRight: '6px' }} /> Compartir
          </button>
        </div>
      </div>

      {showQr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-card" style={{ background: 'var(--bg-dark)', padding: '2rem', textAlign: 'center', position: 'relative', width: '100%', maxWidth: '350px' }}>
            <button onClick={() => setShowQr(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ margin: '0 0 1rem', color: 'var(--accent-primary)' }}>Escanea el QR</h2>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block' }}>
              <QRCodeSVG value={window.location.origin} size={220} bgColor="#ffffff" fgColor="#0d1428" />
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Apunta con la cámara del móvil para unirse a SaludTracker.</p>
          </div>
        </div>
      )}

      {/* Badges Showcase */}
      <h2 className="gsap-element mt-6" style={{ fontSize: '1.4rem' }}>Vitrina de Insignias</h2>
      
      {/* Good Badges */}
      <h3 className="gsap-element mt-2" style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
        <span>👼</span> Santuario
      </h3>
      <div className="gsap-element glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(34,211,165,0.2)' }}>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          {Object.entries(BADGES_MAP).filter(([id, info]) => info.type === 'good').map(([id, info]) => {
            const hasBadge = (gamification.badges || []).includes(id);
            const BadgeIcon = info.icon;
            return (
              <div key={id} className="flex-col items-center justify-center text-center" style={{ width: '100px', gap: '0.5rem', opacity: hasBadge ? 1 : 0.3, filter: hasBadge ? 'none' : 'grayscale(100%)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: hasBadge ? `rgba(255, 215, 0, 0.1)` : 'rgba(255,255,255,0.05)', border: `2px solid ${hasBadge ? info.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hasBadge ? info.color : '#fff' }}>
                  <BadgeIcon size={30} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>{info.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bad Badges */}
      <h3 className="gsap-element mt-2" style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
        <span>🔥</span> El Inframundo
      </h3>
      <div className="gsap-element glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(247,48,74,0.2)' }}>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          {Object.entries(BADGES_MAP).filter(([id, info]) => info.type === 'bad').map(([id, info]) => {
            const hasBadge = (gamification.badges || []).includes(id);
            const BadgeIcon = info.icon;
            return (
              <div key={id} className="flex-col items-center justify-center text-center" style={{ width: '100px', gap: '0.5rem', opacity: hasBadge ? 1 : 0.3, filter: hasBadge ? 'none' : 'grayscale(100%)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: hasBadge ? `rgba(255, 215, 0, 0.1)` : 'rgba(255,255,255,0.05)', border: `2px solid ${hasBadge ? info.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hasBadge ? info.color : '#fff' }}>
                  <BadgeIcon size={30} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>{info.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Stats */}
      <h2 className="gsap-element mt-6" style={{ fontSize: '1.4rem' }}>Resumen Histórico</h2>
      <div className="gsap-element flex gap-4" style={{ flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <Activity color="var(--accent-primary)" size={32} className="mb-2" />
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--accent-primary)' }}>{Math.round(healthScore)}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Salud Actual</p>
        </div>
        
        <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <ClipboardList color="var(--accent-success)" size={32} className="mb-2" />
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--accent-success)' }}>{stats.totalQuestionnaires}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Cuestionarios</p>
        </div>

        <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <Calendar color="var(--accent-warning)" size={32} className="mb-2" />
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--accent-warning)' }}>{stats.totalDaysLogged}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Días de Hábitos</p>
        </div>
      </div>

      {/* Privacy Settings */}
      <h2 className="gsap-element mt-6" style={{ fontSize: '1.4rem' }}>Privacidad</h2>
      <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem' }}>
        <div>
          <h4 style={{ margin: 0 }}>Perfil Público</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Permite que tus seguidores vean la gráfica de tus hábitos diarios.</p>
        </div>
        <button 
          onClick={async () => {
            const newVal = !isPublic;
            setIsPublic(newVal);
            await togglePublicProfile(newVal);
            toast.success(newVal ? 'Perfil hecho público' : 'Perfil privado');
          }}
          style={{ 
            width: '50px', height: '26px', borderRadius: '13px', 
            background: isPublic ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)',
            border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
          }}
        >
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '2px', left: isPublic ? '26px' : '2px',
            transition: 'left 0.3s ease'
          }} />
        </button>
      </div>

      {/* Theme Settings */}
      <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <div>
          <h4 style={{ margin: 0 }}>Apariencia</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cambia entre modo claro y oscuro.</p>
        </div>
        <button onClick={toggleTheme} className="theme-toggle" style={{ width: 'auto' }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
      </div>

      {/* Notifications Settings */}
      <div className="glass-card gsap-element flex items-center justify-between" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <div>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--accent-primary)" />
            Notificaciones Push
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Recibe alertas cuando alguien de tu pandilla peque o cumpla retos.
          </p>
        </div>
        <button 
          onClick={enableNotifications} 
          disabled={notificationsEnabled}
          className="btn"
          style={{ 
            width: 'auto', 
            background: notificationsEnabled ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
            color: notificationsEnabled ? 'var(--text-muted)' : '#fff',
            border: 'none',
            cursor: notificationsEnabled ? 'default' : 'pointer'
          }}
        >
          {notificationsEnabled ? 'Activadas' : 'Activar'}
        </button>
      </div>

      {/* Danger Zone */}
      <h2 className="gsap-element mt-8" style={{ fontSize: '1.4rem', color: 'var(--accent-danger)' }}>Zona de Peligro</h2>
      <div className="glass-card gsap-element flex-col gap-4" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        
        <div className="flex items-center justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h4 style={{ margin: 0 }}>Cerrar Sesión</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Desconecta tu cuenta de este dispositivo.</p>
          </div>
          <button className="btn btn-outline" onClick={handleSignOut}>
            <LogOut size={18} style={{ marginRight: '8px' }} /> Salir
          </button>
        </div>

        <div className="flex items-center justify-between" style={{ paddingTop: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--accent-danger)' }}>Borrar mi Historial</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Elimina para siempre tus cuestionarios, hábitos y posición en el ranking.</p>
          </div>
          <button className="btn" onClick={handleWipeData} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <Trash2 size={18} style={{ marginRight: '8px' }} /> Borrar Datos
          </button>
        </div>

      </div>

    </div>
  );
};

export default Profile;
