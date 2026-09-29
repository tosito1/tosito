import React, { useState, useRef, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Sparkles, ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import { FloatingOrb } from '../components/Animated';

const Login = ({ onGuestLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);

  // GSAP entrance for the card
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 60, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated ambient orbs */}
      <FloatingOrb color="rgba(99,102,241,0.5)" size="500px" top="-10%" right="-10%" delay={0} opacity={0.3} />
      <FloatingOrb color="rgba(168,85,247,0.4)" size="400px" bottom="-5%" left="-5%" delay={3} opacity={0.25} />
      <FloatingOrb color="rgba(129,140,248,0.3)" size="250px" top="40%" left="25%" delay={6} opacity={0.15} />

      {/* Particle grid */}
      <div className="login-grid" />

      <div ref={cardRef} className="login-container" style={{ opacity: 0 }}>
        {/* Brand */}
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="login-brand__icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Sparkles size={28} />
          </motion.div>
          <h1>Tosito</h1>
          <p>Tu espacio personal de gestión</p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '20px' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="login-form">
          {[
            { label: 'Email', type: showPassword ? 'text' : 'text', placeholder: 'tu@email.com', value: email, onChange: e => setEmail(e.target.value), inputType: 'email' },
            { label: 'Contraseña', type: showPassword ? 'text' : 'password', placeholder: '••••••••', value: password, onChange: e => setPassword(e.target.value), isPassword: true },
          ].map((field, i) => (
            <motion.div
              key={field.label}
              className="login-field"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <label>{field.label}</label>
              <div className={field.isPassword ? 'login-password-wrap' : ''}>
                <input
                  type={field.type}
                  className="input-base"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
                {field.isPassword && (
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          <motion.button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <div className="spinner" /> : <><LogIn size={16} /> Iniciar Sesión <ArrowRight size={16} /></>}
          </motion.button>
        </form>

        <div className="login-divider"><span>o</span></div>

        <motion.button
          type="button"
          className="btn btn-secondary login-guest"
          onClick={() => onGuestLogin && onGuestLogin()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.98 }}
        >
          Explorar como Invitado
        </motion.button>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: var(--space-6);
          position: relative;
          overflow: hidden;
          background: var(--bg-base);
        }

        .login-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(129,140,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(129,140,248,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%);
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 380px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-10);
          box-shadow: var(--shadow-xl), 0 0 80px rgba(99,102,241,0.08);
        }

        .login-brand { text-align: center; margin-bottom: var(--space-8); }

        .login-brand__icon {
          width: 56px; height: 56px;
          margin: 0 auto var(--space-5);
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-subtle);
          border-radius: var(--radius-lg);
          color: var(--accent-primary);
          border: 1px solid rgba(129,140,248,0.2);
        }

        .login-brand h1 {
          font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em;
          background: var(--accent-gradient);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .login-brand p { font-size: 0.875rem; color: var(--text-muted); margin-top: var(--space-1); }

        .login-error {
          background: var(--danger-subtle); color: var(--danger);
          padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
          font-size: 0.8125rem; font-weight: 500;
          border: 1px solid rgba(248,113,113,0.15);
          overflow: hidden;
        }

        .login-form { display: flex; flex-direction: column; gap: var(--space-5); }
        .login-field { display: flex; flex-direction: column; gap: var(--space-2); }
        .login-field label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }

        .login-password-wrap { position: relative; }
        .login-password-wrap .input-base { padding-right: 40px; }
        .login-password-toggle {
          position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer;
          transition: color 150ms;
        }
        .login-password-toggle:hover { color: var(--text-secondary); }

        .login-submit { width: 100%; padding: 13px; margin-top: var(--space-2); font-weight: 600; gap: var(--space-2); }

        .login-divider {
          display: flex; align-items: center; gap: var(--space-4); margin: var(--space-6) 0;
        }
        .login-divider::before, .login-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border-default);
        }
        .login-divider span {
          font-size: 0.75rem; color: var(--text-ghost); font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .login-guest { width: 100%; padding: 12px; }
      `}</style>
    </div>
  );
};

export default Login;
