import React, { useState, useEffect, useRef } from 'react';
import { MapPin, LogOut, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getNearbyBars, startBarSession, getBarSession, endBarSession } from '../lib/dataService';
import toast from 'react-hot-toast';

// Fix Leaflet default marker icons (webpack/vite breaks them)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom neon icons
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#4f7dff;
    border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(79,125,255,0.4),0 0 20px rgba(79,125,255,0.8);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const barIcon = (isActive) => L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:${isActive ? '#f7304a' : '#f59e0b'};
    border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;line-height:1;
    box-shadow:0 0 0 3px ${isActive ? 'rgba(247,48,74,0.4)' : 'rgba(245,158,11,0.4)'},0 0 20px ${isActive ? 'rgba(247,48,74,0.6)' : 'rgba(245,158,11,0.5)'};
  ">🍺</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// Helper that re-centers map when location changes
const MapCenterer = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

/* ─── Animated radar ring component ─── */
const RadarAnimation = ({ scanning, hasSession }) => {
  const color = hasSession ? '#f7304a' : '#06d6c7';
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      {[1, 0.66, 0.33].map((scale, i) => (
        <div key={i} style={{
          position: 'absolute',
          borderRadius: '50%',
          border: `1px solid ${color}${['30','20','15'][i]}`,
          width: `${scale * 100}%`, height: `${scale * 100}%`,
          top: `${(1 - scale) * 50}%`, left: `${(1 - scale) * 50}%`,
        }} />
      ))}
      {hasSession && [0, 0.4, 0.8].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `2px solid ${color}`,
          animation: `radar-pulse 2s ease-out ${delay}s infinite`,
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 1, background: `${color}20` }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ height: '100%', width: 1, background: `${color}20` }} />
      </div>
      {scanning && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          animation: 'radar-spin 2.5s linear infinite',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '50%', height: 2, transformOrigin: '0% 50%',
            background: `linear-gradient(90deg, transparent, ${color}80)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 340deg, ${color}18 360deg)`,
          }} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: color,
          boxShadow: `0 0 15px ${color}, 0 0 30px ${color}60`,
        }} />
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const BarRadar = () => {
  const [phase, setPhase] = useState('loading');
  const [session, setSession] = useState(null);
  const [nearbyBars, setNearbyBars] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [userCoords, setUserCoords] = useState(null); // { lat, lng }
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const active = await getBarSession();
      if (active) {
        setSession(active);
        const mins = Math.floor((Date.now() - new Date(active.startTime)) / 60000);
        setElapsed(mins);
        setPhase('session');
        startTimerTick();
        // Still try to get user's current coords for the map
        navigator.geolocation?.getCurrentPosition(
          ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
          () => {}
        );
      } else {
        scanLocation();
      }
    })();
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimerTick = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 60000);
  };

  const scanLocation = () => {
    setPhase('scanning');
    setNearbyBars([]);
    if (!navigator.geolocation) {
      setErrorMsg('Tu navegador no soporta geolocalización.');
      setPhase('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setUserCoords({ lat: latitude, lng: longitude });
        try {
          const bars = await getNearbyBars(latitude, longitude);
          const valid = bars.filter(b => b.tags?.name);
          setNearbyBars(valid);
          setPhase(valid.length > 0 ? 'results' : 'empty');
        } catch {
          setErrorMsg('Error conectando con el radar. Comprueba tu conexión.');
          setPhase('error');
        }
      },
      () => {
        setErrorMsg('Permiso de ubicación denegado. Actívalo en los ajustes del navegador.');
        setPhase('error');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleCheckin = async (bar) => {
    await startBarSession(bar);
    const active = await getBarSession();
    setSession(active);
    setElapsed(0);
    setPhase('session');
    startTimerTick();
    toast('📍 Check-in registrado. El cronómetro corre.', {
      style: { background: '#0d1428', color: '#06d6c7', border: '1px solid rgba(6,214,199,0.3)', fontWeight: 700 },
    });
  };

  const handleLeave = async () => {
    if (!session) return;
    clearInterval(timerRef.current);
    const finalMins = Math.floor((Date.now() - new Date(session.startTime)) / 60000);
    await endBarSession(finalMins, session.barName);
    if (finalMins >= 10) {
      const penalty = Math.floor(finalMins / 10);
      toast(`☠️ Has estado ${finalMins} min. Penalización: -${penalty} ❤️`, {
        style: { background: '#0d1428', color: '#f7304a', border: '1px solid rgba(247,48,74,0.3)', fontWeight: 700 },
        duration: 5000,
      });
    } else {
      toast.success('Sesión terminada. Menos de 10 min, te has salvado.');
    }
    setSession(null);
    setElapsed(0);
    scanLocation();
  };

  /* ─── Shared map component ─── */
  const MapView = ({ activeBar }) => {
    if (!userCoords) return null;

    // Compute center: midpoint between user and active bar if possible
    let center = [userCoords.lat, userCoords.lng];
    if (activeBar?.lat && activeBar?.lon) {
      center = [
        (userCoords.lat + activeBar.lat) / 2,
        (userCoords.lng + activeBar.lon) / 2,
      ];
    }

    return (
      <div style={{
        borderRadius: '1.25rem', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 30px rgba(0,0,0,0.5)',
        height: 280,
        position: 'relative',
      }}>
        <MapContainer
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%', background: '#080d1a' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Dark OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='© OpenStreetMap © CARTO'
          />
          <MapCenterer center={center} />

          {/* User location */}
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>📍 Tú estás aquí</Popup>
          </Marker>

          {/* Accuracy circle */}
          <Circle
            center={[userCoords.lat, userCoords.lng]}
            radius={50}
            pathOptions={{ color: '#4f7dff', fillColor: '#4f7dff', fillOpacity: 0.08, weight: 1 }}
          />

          {/* Bar markers */}
          {nearbyBars.map(bar => {
            if (!bar.lat || !bar.lon) return null;
            const isActive = activeBar && activeBar.id === bar.id;
            return (
              <Marker
                key={bar.id}
                position={[bar.lat, bar.lon]}
                icon={barIcon(isActive)}
              >
                <Popup>
                  <strong>{bar.tags?.name}</strong><br />
                  {isActive ? '✅ Estás aquí ahora' : '🍺 Bar cercano'}
                </Popup>
              </Marker>
            );
          })}

          {/* If session active but bar coords not in nearbyBars list */}
          {activeBar && !nearbyBars.find(b => b.id === activeBar.barId) && activeBar.lat && activeBar.lon && (
            <Marker position={[activeBar.lat, activeBar.lon]} icon={barIcon(true)}>
              <Popup>✅ {activeBar.barName} — Estás aquí</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Map overlay label */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
          background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(10px)',
          padding: '4px 10px', borderRadius: '999px',
          fontSize: '0.7rem', color: 'var(--text-muted)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          © OpenStreetMap
        </div>
      </div>
    );
  };

  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const penalty = Math.floor(elapsed / 10);
  const safe = elapsed < 10;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '1.9rem', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg, #06d6c7, #4f7dff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          🍺 Radar de Bares
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          {phase === 'session' ? 'Cronómetro activo — te estamos viendo' : 'Detecta los antros a 50m de ti'}
        </p>
      </div>

      {/* ── Scanning ── */}
      {(phase === 'loading' || phase === 'scanning') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>
          <RadarAnimation scanning={true} hasSession={false} />
          <p style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Escaneando tu ubicación...</p>
        </div>
      )}

      {/* ── Error ── */}
      {phase === 'error' && (
        <div style={{ background: 'rgba(247,48,74,0.08)', border: '1px solid rgba(247,48,74,0.25)', borderRadius: '1.25rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} color="var(--accent-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-danger)', marginBottom: '0.4rem' }}>Radar sin señal</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: 0 }}>{errorMsg}</p>
            </div>
          </div>
          <button onClick={scanLocation} style={{
            marginTop: '1.25rem', width: '100%', padding: '0.875rem',
            background: 'rgba(247,48,74,0.12)', border: '1px solid rgba(247,48,74,0.3)',
            borderRadius: '0.875rem', color: 'var(--accent-danger)',
            fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            <RefreshCw size={16} /> Volver a escanear
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {phase === 'empty' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <RadarAnimation scanning={false} hasSession={false} />
          <h3 style={{ margin: '1.5rem 0 0.5rem', fontSize: '1.1rem' }}>Zona limpia 🌿</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 300, margin: '0 auto 1rem' }}>
            No hay bares a 50m. ¿Seguro que estás en el sitio correcto?
          </p>
          {/* Show map even when empty */}
          <div style={{ marginBottom: '1rem' }}>
            <MapView activeBar={null} />
          </div>
          <button onClick={scanLocation} style={{
            padding: '0.875rem 2rem',
            background: 'rgba(6,214,199,0.1)', border: '1px solid rgba(6,214,199,0.3)',
            borderRadius: '999px', color: 'var(--accent-cyan)',
            fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <RefreshCw size={16} /> Actualizar radar
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {phase === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Map */}
          <MapView activeBar={null} />

          {/* Count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
              🚨 {nearbyBars.length} local{nearbyBars.length !== 1 ? 'es' : ''} detectado{nearbyBars.length !== 1 ? 's' : ''}
            </span>
            <button onClick={scanLocation} style={{
              background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '999px',
              color: 'var(--text-muted)', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>

          {/* Bar list */}
          {nearbyBars.slice(0, 6).map((bar, i) => {
            const amenityColor = { bar: '#f59e0b', pub: '#a855f7', nightclub: '#f7304a' };
            const amenityEmoji = { bar: '🍺', pub: '🍻', nightclub: '🎉' };
            const color = amenityColor[bar.tags?.amenity] || '#06d6c7';
            const emoji = amenityEmoji[bar.tags?.amenity] || '🍸';
            return (
              <div
                key={bar.id}
                onClick={() => handleCheckin(bar)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: `${color}0d`,
                  border: `1px solid ${color}30`,
                  borderRadius: '1rem', cursor: 'pointer',
                  animation: `slide-up 0.4s ease ${i * 0.08}s both`,
                  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.background = `${color}20`; }}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = `${color}0d`; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: `${color}20`, border: `2px solid ${color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', boxShadow: `0 0 15px ${color}30`,
                }}>
                  {emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#eef2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bar.tags?.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color, fontWeight: 600, marginTop: 2 }}>
                    {bar.tags?.amenity === 'nightclub' ? 'Discoteca' : bar.tags?.amenity === 'pub' ? 'Pub' : 'Bar'} · &lt;50m
                  </div>
                </div>
                <div style={{
                  padding: '0.4rem 0.9rem', background: color, color: '#000',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                }}>
                  ENTRAR
                </div>
              </div>
            );
          })}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Toca un local para hacer check-in y empezar el cronómetro
          </p>
        </div>
      )}

      {/* ── Active Session ── */}
      {phase === 'session' && session && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'slide-up 0.4s ease both' }}>
          {/* Venue name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Actualmente en
            </div>
            <h2 style={{
              fontSize: '1.6rem', fontWeight: 900, margin: 0,
              background: 'linear-gradient(135deg, #f7304a, #f59e0b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {session.barName}
            </h2>
          </div>

          {/* Map showing active bar */}
          <MapView activeBar={session} />

          {/* Radar + timer side by side on desktop, stacked on mobile */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <RadarAnimation scanning={true} hasSession={true} />

            <div style={{
              flex: 1, minWidth: 140,
              background: 'rgba(0,0,0,0.4)',
              border: `2px solid ${safe ? 'rgba(34,211,165,0.4)' : 'rgba(247,48,74,0.5)'}`,
              borderRadius: '1.25rem', padding: '1.25rem',
              textAlign: 'center',
              boxShadow: safe ? '0 0 30px rgba(34,211,165,0.1)' : '0 0 30px rgba(247,48,74,0.15)',
            }}>
              <div style={{
                fontSize: '3rem', fontWeight: 900,
                fontFamily: 'var(--font-head)', letterSpacing: '-2px',
                color: safe ? 'var(--accent-success)' : 'var(--accent-danger)', lineHeight: 1,
              }}>
                {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tiempo en el local
              </div>
            </div>
          </div>

          {/* Penalty info */}
          <div style={{
            background: safe ? 'rgba(34,211,165,0.08)' : 'rgba(247,48,74,0.08)',
            border: `1px solid ${safe ? 'rgba(34,211,165,0.2)' : 'rgba(247,48,74,0.2)'}`,
            borderRadius: '0.875rem', padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            {safe
              ? <Zap size={22} color="var(--accent-success)" style={{ flexShrink: 0 }} />
              : <AlertTriangle size={22} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: safe ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {safe ? '¡Aún puedes huir!' : `Penalización actual: -${penalty} ❤️`}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {safe ? 'Menos de 10 min. Sal ahora y no pasa nada.' : `−1 de salud cada 10 min. Si sales ahora: −${penalty} puntos.`}
              </div>
            </div>
          </div>

          {/* Leave button */}
          <button
            onClick={handleLeave}
            style={{
              width: '100%', padding: '1.1rem',
              background: 'linear-gradient(135deg, #f7304a, #ff6b35)',
              color: '#fff', border: 'none', borderRadius: '1rem',
              cursor: 'pointer', fontWeight: 800, fontSize: '1.05rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              boxShadow: '0 4px 25px rgba(247,48,74,0.4)',
              WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
            }}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = ''}
          >
            <LogOut size={20} /> Abandonar el Local
          </button>
        </div>
      )}

      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes radar-pulse {
          0%   { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        /* Make Leaflet popup match dark theme */
        .leaflet-popup-content-wrapper {
          background: rgba(13,20,40,0.95) !important;
          color: #eef2ff !important;
          border: 1px solid rgba(79,125,255,0.2) !important;
          border-radius: 10px !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip { background: rgba(13,20,40,0.95) !important; }
        .leaflet-container { background: #080d1a !important; }
      `}</style>
    </div>
  );
};

export default BarRadar;
