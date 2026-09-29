import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Activity, ClipboardList, Wine, Trophy, User, Users, Heart, Rss, Download, PartyPopper, ShoppingBag, Swords, BarChart3, Radar } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData } from './lib/dataService';

import Dashboard from './components/Dashboard';
import Questionnaire from './components/Questionnaire';
import HabitsTracker from './components/HabitsTracker';
import Leaderboard from './components/Leaderboard';
import Auth from './components/Auth';
import Profile from './components/Profile';
import PublicProfile from './components/PublicProfile';
import Groups from './components/Groups';
import Feed from './components/Feed';
import PartyMode from './components/PartyMode';
import XPStore from './components/XPStore';
import Duels from './components/Duels';
import Wrapped from './components/Wrapped';
import BarRadar from './components/BarRadar';
import './index.css';

const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '3px solid rgba(79,125,255,0.2)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin-slow 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando sesión...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const AnimatedRoutes = ({ user, loading, installPrompt, handleInstallClick }) => {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/auth" element={<Auth />} />
      <Route path="/party"        element={<PartyMode />} />
      <Route path="/"             element={<ProtectedRoute user={user} loading={loading}><Dashboard /></ProtectedRoute>} />
      <Route path="/questionnaire" element={<ProtectedRoute user={user} loading={loading}><Questionnaire /></ProtectedRoute>} />
      <Route path="/habits"       element={<ProtectedRoute user={user} loading={loading}><HabitsTracker /></ProtectedRoute>} />
      <Route path="/leaderboard"  element={<ProtectedRoute user={user} loading={loading}><Leaderboard /></ProtectedRoute>} />
      <Route path="/groups"       element={<ProtectedRoute user={user} loading={loading}><Groups /></ProtectedRoute>} />
      <Route path="/feed"         element={<ProtectedRoute user={user} loading={loading}><Feed /></ProtectedRoute>} />
      <Route path="/store"        element={<ProtectedRoute user={user} loading={loading}><XPStore /></ProtectedRoute>} />
      <Route path="/duels"        element={<ProtectedRoute user={user} loading={loading}><Duels /></ProtectedRoute>} />
      <Route path="/wrapped"      element={<ProtectedRoute user={user} loading={loading}><Wrapped /></ProtectedRoute>} />
      <Route path="/radar"        element={<ProtectedRoute user={user} loading={loading}><BarRadar /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute user={user} loading={loading}><Profile installPrompt={installPrompt} handleInstallClick={handleInstallClick} /></ProtectedRoute>} />
      <Route path="/user/:id"     element={<ProtectedRoute user={user} loading={loading}><PublicProfile /></ProtectedRoute>} />
    </Routes>
  );
};

const navItems = [
  { to: '/',             icon: Activity,      label: 'Dashboard',    mobileLabel: 'Inicio'  },
  { to: '/questionnaire',icon: ClipboardList, label: 'Cuestionario', mobileLabel: 'Test'    },
  { to: '/habits',       icon: Wine,          label: 'Hábitos',      mobileLabel: 'Hábitos' },
  { to: '/leaderboard',  icon: Trophy,        label: 'Ranking',      mobileLabel: 'Ranking' },
  { to: '/groups',       icon: Users,         label: 'Grupos',       mobileLabel: 'Grupos'  },
  { to: '/feed',         icon: Rss,           label: 'Actividad',    mobileLabel: 'Feed'    },
  { to: '/duels',        icon: Swords,        label: 'Duelos',       mobileLabel: 'Duelos'  },
  { to: '/store',        icon: ShoppingBag,   label: 'Tienda XP',    mobileLabel: 'Tienda'  },
  { to: '/wrapped',      icon: BarChart3,     label: 'Wrapped',      mobileLabel: 'Wrapped' },
  { to: '/radar',        icon: Radar,         label: 'Radar Bares',  mobileLabel: 'Radar'   },
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState({ level: 1, xp: 0 });
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initialize theme from local storage
    if (localStorage.getItem('saludtracker-theme') === 'light') {
      document.documentElement.classList.add('light-mode');
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const data = await getUserData();
        if (data?.gamification) setGamification(data.gamification);
      }
    });
    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || '';
  const initial = displayName.charAt(0).toUpperCase();
  const xpProgress = gamification.xp % 100;

  return (
    <Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(13,20,40,0.95)',
            color: '#eef2ff',
            border: '1px solid rgba(79,125,255,0.2)',
            backdropFilter: 'blur(20px)',
            fontFamily: 'var(--font-main)',
            fontSize: '0.9rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }
        }}
      />

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ─── Desktop Sidebar ─── */}
        <aside className="desktop-nav sidebar">
          {/* Logo */}
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <h1 className="font-title text-gradient" style={{ margin: 0, fontSize: '1.4rem' }}>SaludTracker</h1>
          </div>

          {/* User card */}
          {user && (
            <div className="sidebar-user-card">
              <div className="sidebar-avatar">
                {user.photoURL
                  ? <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  : initial
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Nivel {gamification.level} · {xpProgress}/100 XP
                </p>
                <div className="sidebar-xp-bar">
                  <div className="sidebar-xp-fill" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className="sidebar-divider" />

          {/* Nav Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
            {user ? navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )) : null}
          </nav>

          <div className="sidebar-divider" />

          {/* Profile / Login */}
          <NavLink
            to={user ? '/profile' : '/auth'}
            className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
          >
            <User size={18} />
            {user ? 'Mi Perfil' : 'Iniciar Sesión'}
          </NavLink>

          {/* Party Mode Button */}
          {user && (
            <NavLink
              to="/party"
              className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(247,48,74,0.2))', border: '1px solid rgba(168,85,247,0.3)', marginTop: '0.5rem' }}
            >
              <PartyPopper size={18} />
              Modo Fiesta 🪩
            </NavLink>
          )}

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="sidebar-nav-link"
              style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              <Download size={18} />
              Instalar App
            </button>
          )}

          {/* Footer brand */}
          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              Hecho con <Heart size={10} style={{ color: 'var(--accent-danger)' }} /> y mala salud
            </p>
          </div>
        </aside>

        {/* ─── Mobile Bottom Nav ─── */}
        {user && (
          <nav className="mobile-nav">
            <NavLink
              to="/party"
              className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
              style={{ background: 'rgba(168,85,247,0.1)' }}
            >
              <PartyPopper size={22} color="#a855f7" />
              <span style={{ color: '#a855f7' }}>Fiesta</span>
            </NavLink>
            {navItems.map(({ to, icon: Icon, mobileLabel }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={22} />
                <span>{mobileLabel}</span>
              </NavLink>
            ))}
            <NavLink
              to="/profile"
              className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
            >
              <User size={22} />
              <span>Perfil</span>
            </NavLink>
          </nav>
        )}

        {/* ─── Main Content ─── */}
        <main
          className="main-content"
          style={{
            flex: 1,
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <AnimatedRoutes user={user} loading={loading} installPrompt={deferredPrompt} handleInstallClick={handleInstallClick} />
        </main>
      </div>
    </Router>
  );
}

export default App;
