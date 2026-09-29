import React, { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Dumbbell, Utensils, PiggyBank, LogOut, Sparkles, FileUser } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import styles from './Navigation.module.css';

const navItems = [
  { name: 'Inicio',     path: '/',        icon: Home,         end: true },
  { name: 'Calendario', path: '/calendar', icon: CalendarDays, end: false },
  { name: 'Gym',        path: '/gym',      icon: Dumbbell,     end: false },
  { name: 'Comidas',    path: '/meals',    icon: Utensils,     end: false },
  { name: 'Ahorros',    path: '/savings',  icon: PiggyBank,    end: false },
  { name: 'CV Builder', path: '/cv',       icon: FileUser,     end: false },
];

const Navigation = () => {
  const location = useLocation();
  const logoRef = useRef(null);

  // Logo entrance animation
  useEffect(() => {
    gsap.fromTo(logoRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('guest_mode');
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className={styles.navContainer}>
      {/* Logo */}
      <div ref={logoRef} className={styles.desktopLogo} style={{ opacity: 0 }}>
        <motion.div
          animate={{ rotate: [0, 10, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Sparkles size={22} color="var(--accent-primary)" />
        </motion.div>
        <h1 className="text-gradient">Tosito</h1>
      </div>

      {/* Nav links */}
      <div className={styles.navLinks}>
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className={styles.activePill}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </motion.div>
              </NavLink>
            </motion.div>
          );
        })}
      </div>

      {/* Logout */}
      <motion.div
        className={styles.logoutWrapper}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <motion.button
          onClick={handleLogout}
          className={styles.logoutBtn}
          whileHover={{ x: 4, color: 'var(--danger)' }}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </motion.button>
      </motion.div>
    </nav>
  );
};

export default Navigation;
