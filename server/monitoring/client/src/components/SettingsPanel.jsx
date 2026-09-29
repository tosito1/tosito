import React, { useState } from 'react';
import { Settings, KeyRound, Save } from 'lucide-react';
import gsap from 'gsap';

export default function SettingsPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (newPassword.length < 4) {
      setStatus({ type: 'error', msg: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ type: 'success', msg: '¡Contraseña actualizada exitosamente!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', msg: data.error || 'Error al cambiar contraseña' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel animate-in" style={{ maxWidth: 500 }}>
      <div className="panel-header">
        <div className="panel-title"><Settings size={14} />Configuración de Seguridad</div>
      </div>
      <div className="panel-body">
        
        <div style={{ marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Al cambiar la contraseña aquí, se creará una clave independiente solo para este panel de monitoreo. La contraseña de Nexus no se verá afectada.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Contraseña Actual</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Confirmar Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {status.msg && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: status.type === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(16,211,127,0.15)',
              color: status.type === 'error' ? 'var(--red)' : 'var(--green)',
              border: `1px solid ${status.type === 'error' ? 'rgba(244,63,94,0.3)' : 'rgba(16,211,127,0.3)'}`
            }}>
              {status.msg}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
            <Save size={16} /> {loading ? 'Guardando...' : 'Cambiar Contraseña'}
          </button>

        </form>
      </div>
    </div>
  );
}
