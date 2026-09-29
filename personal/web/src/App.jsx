import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import './index.css';

// Components
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Gym from './pages/Gym';
import Meals from './pages/Meals';
import Savings from './pages/Savings';
import CV from './pages/CV';

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -10, scale: 0.98,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const ProtectedRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Animated Routes wrapper — must be inside BrowserRouter
const AnimatedRoutes = ({ user, onGuestLogin }) => {
  const location = useLocation();
  const isCVPage = location.pathname.startsWith('/cv');

  const routes = (
    <Routes location={location}>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login onGuestLogin={onGuestLogin} />}
      />
      <Route path="/" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute user={user}><Calendar /></ProtectedRoute>} />
      <Route path="/gym" element={<ProtectedRoute user={user}><Gym /></ProtectedRoute>} />
      <Route path="/meals" element={<ProtectedRoute user={user}><Meals /></ProtectedRoute>} />
      <Route path="/savings" element={<ProtectedRoute user={user}><Savings /></ProtectedRoute>} />
      <Route path="/cv" element={<ProtectedRoute user={user}><CV /></ProtectedRoute>} />
    </Routes>
  );

  if (isCVPage) {
    return <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>{routes}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: '100%' }}
      >
        {routes}
      </motion.div>
    </AnimatePresence>
  );
};

// Layout Wrapper to handle conditional styling (like removing padding for CV page)
const MainLayout = ({ user, onGuestLogin }) => {
  const location = useLocation();
  const isCVPage = location.pathname.startsWith('/cv');

  return (
    <div 
      style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: isCVPage ? '#f8fafc' : 'var(--bg-base)', 
        overflow: 'hidden',
        colorScheme: isCVPage ? 'light' : 'dark'
      }}
    >
      {!isCVPage && <Navigation />}
      <main 
        className={isCVPage ? '' : 'app-content'}
        style={isCVPage ? { 
          flex: 1, 
          padding: '0', 
          overflowY: 'hidden',
          position: 'relative',
          height: '100vh',
          background: '#f8fafc'
        } : {}}
      >
        <AnimatedRoutes user={user} onGuestLogin={onGuestLogin} />
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleGuest = () => {
    const guestUser = {
      displayName: 'Tosito',
      email: 'invitado@tosito.demo',
      uid: 'guest',
    };
    localStorage.setItem('guest_mode', 'true');
    setUser(guestUser);
  };

  useEffect(() => {
    if (localStorage.getItem('guest_mode')) {
      handleGuest();
    }

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else if (!localStorage.getItem('guest_mode')) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-base)', gap: '1.5rem',
        }}
      >
        <motion.div
          className="text-gradient"
          style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          Tosito
        </motion.div>
        <motion.div
          className="spinner"
          style={{ width: 28, height: 28, borderWidth: 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      </motion.div>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout user={user} onGuestLogin={handleGuest} />
    </BrowserRouter>
  );
}

export default App;
