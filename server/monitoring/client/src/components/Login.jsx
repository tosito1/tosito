import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Lock, LogIn, KeyRound } from 'lucide-react';
import AuroraBackground from './AuroraBackground';

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const boxRef = useRef(null);
  const logoRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();
    tl.fromTo(boxRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
    ).fromTo(logoRef.current,
      { rotateY: 90, opacity: 0 },
      { rotateY: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' },
      '-=0.5'
    );
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Success animation before passing control to parent
        gsap.to(boxRef.current, {
          scale: 1.05, opacity: 0, filter: 'blur(10px)',
          duration: 0.5, ease: 'power2.in',
          onComplete: onLoginSuccess
        });
      } else {
        setError(data.error || 'Contraseña incorrecta');
        setLoading(false);
        // Error shake animation
        gsap.fromTo(boxRef.current,
          { x: -10 },
          { x: 10, duration: 0.1, yoyo: true, repeat: 5, ease: 'linear', clearProps: 'x' }
        );
      }
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <AuroraBackground />
      
      <div ref={boxRef} className="panel" style={{
        width: '100%', maxWidth: 420, padding: '48px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 10, position: 'relative'
      }}>
        
        <div ref={logoRef} style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, var(--purple), var(--indigo))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(139,127,247,0.5)',
          marginBottom: 24
        }}>
          <Lock size={32} color="white" />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>NexusMon</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Panel de Monitoreo Seguro</p>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ position: 'relative' }}>
            <KeyRound size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="password"
              placeholder="Contraseña de acceso"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text)', fontSize: 15,
                outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginTop: -4 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginTop: 8 }}
          >
            <LogIn size={18} />
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

      </div>
    </div>
  );
}
