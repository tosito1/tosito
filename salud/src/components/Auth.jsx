import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { BUILD_TIME } from '../build_info';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Capacitor } from '@capacitor/core';

gsap.registerPlugin(useGSAP);

/* Animated mesh gradient background */
const MeshBackground = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{
      position: 'absolute', width: '800px', height: '800px',
      top: '-200px', left: '-200px',
      background: 'radial-gradient(circle, rgba(79,125,255,0.18) 0%, transparent 70%)',
      animation: 'float 8s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', width: '600px', height: '600px',
      bottom: '-150px', right: '-100px',
      background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
      animation: 'float 10s ease-in-out infinite reverse',
    }} />
    <div style={{
      position: 'absolute', width: '400px', height: '400px',
      top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'radial-gradient(circle, rgba(6,214,199,0.08) 0%, transparent 70%)',
      animation: 'float 6s ease-in-out infinite 2s',
    }} />
    {/* Grid lines */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/');
    });
    return unsubscribe;
  }, [navigate]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.auth-logo', { y: -40, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.auth-tagline', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .from('.auth-card', { y: 40, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.3')
      .from('.auth-feature', { y: 15, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, '-=0.3');
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('¡Bienvenido de vuelta!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('¡Cuenta creada con éxito!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
          toast.success('¡Bienvenido!');
          navigate('/');
        }
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast.success('¡Bienvenido!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message?.replace('Firebase: ', '') || 'Error al iniciar con Google');
    }
  };

  const features = [
    { icon: '🔥', label: 'Rachas Diarias' },
    { icon: '💀', label: 'Grupos Tóxicos' },
    { icon: '🏅', label: 'Insignias' },
    { icon: '📊', label: 'Análisis IA' },
  ];

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative'
    }}>
      <MeshBackground />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div className="auth-logo text-center mb-6">
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '72px', height: '72px', borderRadius: '20px', marginBottom: '1rem',
            background: 'linear-gradient(135deg, rgba(79,125,255,0.3), rgba(168,85,247,0.3))',
            border: '1px solid rgba(79,125,255,0.3)',
            boxShadow: '0 0 40px rgba(79,125,255,0.3)',
            animation: 'float 4s ease-in-out infinite'
          }}>
            <Heart size={36} style={{ color: '#a78bfa' }} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>SaludTracker</h1>
          <p className="auth-tagline" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            La app de salud para los que no están tan sanos
          </p>
        </div>

        {/* Feature pills */}
        <div className="auth-tagline flex justify-center gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
          {features.map(f => (
            <span key={f.label} className="auth-feature badge badge-blue" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* Auth Card */}
        <div className="auth-card glass-card card-glow-blue" style={{ padding: '2rem' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)',
            padding: '4px', marginBottom: '1.75rem'
          }}>
            {['Iniciar Sesión', 'Registrarse'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setIsLogin(i === 0)}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 600,
                  fontFamily: 'var(--font-main)',
                  background: (i === 0 ? isLogin : !isLogin) ? 'var(--grad-primary)' : 'transparent',
                  color: (i === 0 ? isLogin : !isLogin) ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s ease',
                  boxShadow: (i === 0 ? isLogin : !isLogin) ? '0 2px 10px rgba(79,125,255,0.3)' : 'none',
                }}
              >{tab}</button>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="btn btn-ghost w-full mb-4"
            style={{ padding: '0.85rem', fontSize: '0.95rem', gap: '12px' }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ margin: '0 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex-col gap-3">
            <input
              className="input-field"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              style={{ padding: '0.9rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear Cuenta'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* BUILD INFO TO VERIFY NEW APK */}
          <div className="text-center text-xs text-white/30 mt-4 font-mono">
            Build: {BUILD_TIME}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-cyan)' }} />
          100% gratis. Sin anuncios. Con humor negro.
        </p>
      </div>
    </div>
  );
};

export default Auth;
