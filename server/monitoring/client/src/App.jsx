import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import gsap from 'gsap';
import {
  LayoutDashboard, Server, Globe, Bell, HardDrive,
  Activity, AlertTriangle, X, Network, LogOut
} from 'lucide-react';
import AuroraBackground from './components/AuroraBackground';
import Login from './components/Login';
import Dashboard   from './components/Dashboard';
import PM2Manager  from './components/PM2Manager';
import NginxPanel  from './components/NginxPanel';
import AlertsPanel from './components/AlertsPanel';
import StoragePanel from './components/StoragePanel';
import PortsPanel  from './components/PortsPanel';
import SettingsPanel from './components/SettingsPanel';

let socket; // Initialize socket only after auth

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',       icon: <LayoutDashboard size={16} /> },
  { id: 'pm2',       label: 'PM2 Apps',         icon: <Server size={16} /> },
  { id: 'storage',   label: 'Almacenamiento',   icon: <HardDrive size={16} /> },
  { id: 'ports',     label: 'Puertos',           icon: <Network size={16} /> },
  { id: 'nginx',     label: 'Nginx',             icon: <Globe size={16} /> },
  { id: 'alerts',    label: 'Alertas',           icon: <Bell size={16} />, hasBadge: true },
  { id: 'settings',  label: 'Configuración',     icon: <LayoutDashboard size={16} /> },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [tab, setTab]     = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [unread, setUnread] = useState(0);
  const [toast, setToast]   = useState(null);
  const [connected, setConnected] = useState(false);

  const sidebarRef    = useRef(null);
  const mainRef       = useRef(null);
  const toastRef      = useRef(null);
  const toastTimer    = useRef(null);
  const contentRef    = useRef(null);

  /* ── Check Auth Status ── */
  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.authenticated);
        setAuthChecking(false);
      })
      .catch(() => setAuthChecking(false));
  }, []);

  /* ── Socket Setup (Only when authenticated) ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    
    socket = io();
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('system_stats', setStats);
    socket.on('alert', (data) => {
      setUnread(n => n + 1);
      triggerToast(data);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, [isAuthenticated]);

  /* ── Initial GSAP entrance for main app ── */
  useEffect(() => {
    if (isAuthenticated && !authChecking) {
      const tl = gsap.timeline();
      tl.fromTo(sidebarRef.current,
        { x: -30, opacity: 0 },
        { x: 0,   opacity: 1, duration: 0.7, ease: 'power3.out' }
      ).fromTo(mainRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0,  duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );
    }
  }, [isAuthenticated, authChecking]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setStats(null);
    if (socket) socket.disconnect();
  };

  /* ── Page-change animation ── */
  const switchTab = (id) => {
    if (id === tab) return;
    if (id === 'alerts') setUnread(0);
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: 0.01 }
      );
    }
    setTab(id);
  };

  /* ── Toast ── */
  function triggerToast(data) {
    clearTimeout(toastTimer.current);
    setToast(data);
    setTimeout(() => {
      if (toastRef.current) {
        gsap.fromTo(toastRef.current,
          { x: 80, opacity: 0 },
          { x: 0,  opacity: 1, duration: 0.45, ease: 'back.out(1.4)' }
        );
      }
    }, 10);
    toastTimer.current = setTimeout(() => dismissToast(), 6000);
  }

  function dismissToast() {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        x: 80, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => setToast(null)
      });
    } else {
      setToast(null);
    }
  }

  if (authChecking) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}></div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const pages = {
    dashboard: <Dashboard stats={stats} />,
    pm2:       <PM2Manager />,
    storage:   <StoragePanel />,
    ports:     <PortsPanel />,
    nginx:     <NginxPanel />,
    alerts:    <AlertsPanel />,
    settings:  <SettingsPanel />,
  };

  const pageTitles = {
    dashboard: 'Dashboard',
    pm2:       'PM2 Apps',
    storage:   'Almacenamiento',
    ports:     'Puertos Abiertos',
    nginx:     'Nginx',
    alerts:    'Alertas',
    settings:  'Configuración',
  };

  return (
    <>
      <AuroraBackground />

      {/* ── Toast ── */}
      {toast && (
        <div ref={toastRef} className="toast" style={{ opacity: 0 }}>
          <AlertTriangle size={20} className="toast-icon" />
          <div>
            <div className="toast-title">⚠ Alerta del servidor</div>
            <div className="toast-msg">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={dismissToast}><X size={14} /></button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div ref={sidebarRef} className="sidebar" style={{ opacity: 0 }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🖥️</div>
          <div>
            <div className="brand-name">NexusMon</div>
            <div className="brand-sub">Server Dashboard</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">Navegación</div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            active={tab === item.id}
            badge={item.hasBadge ? unread : 0}
            onClick={() => switchTab(item.id)}
          />
        ))}

        <div className="sidebar-divider" style={{ marginTop: 'auto' }} />
        
        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div className="conn-indicator">
            <div className={`conn-dot ${connected ? '' : 'offline'}`} />
            {connected ? 'Conectado' : 'Desconectado'}
          </div>
          
          <button className="btn btn-ghost" onClick={handleLogout} style={{ justifyContent: 'center', width: '100%' }}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div ref={mainRef} className="main-content" style={{ opacity: 0 }}>
        <div className="page-header">
          <div>
            <div className="page-title">{pageTitles[tab]}</div>
            <div className="page-sub">
              <span className="page-sub-dot" />
              monitoring.local · Monitoreo protegido
            </div>
          </div>
        </div>

        <div ref={contentRef}>
          {pages[tab]}
        </div>
      </div>
    </>
  );
}

/* ── NavLink with GSAP hover ── */
function NavLink({ item, active, badge, onClick }) {
  const ref = useRef(null);

  const onEnter = () => {
    if (!active) gsap.to(ref.current, { x: 4, duration: 0.2, ease: 'power2.out' });
  };
  const onLeave = () => {
    gsap.to(ref.current, { x: 0, duration: 0.2, ease: 'power2.out' });
  };
  const onDown = () => {
    gsap.to(ref.current, { scale: 0.97, duration: 0.1 });
  };
  const onUp = () => {
    gsap.to(ref.current, { scale: 1, duration: 0.15, ease: 'back.out(2)' });
    onClick();
  };

  return (
    <div
      ref={ref}
      className={`nav-link ${active ? 'active' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onUp}
    >
      <span className="nav-icon">{item.icon}</span>
      {item.label}
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </div>
  );
}
