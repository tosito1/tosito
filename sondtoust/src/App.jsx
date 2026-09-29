import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
Search, Home, Compass, Library,
Play, Pause, SkipBack, SkipForward, Volume2,
Heart, X, AlertCircle, Maximize2,
ChevronDown, ListMusic, ListPlus, MoreHorizontal, Plus, Radio, Menu,
MessageSquare, Share2, Bot, Users, Flame, Sparkles, Send, Mic2,
List, Sliders, User, UploadCloud, Clock, CheckCircle2, Music,
Share, Link
} from 'lucide-react';

const ToustWaveLogo = ({ className = "w-8 h-8" }) => (
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {/* La "T" de Toust */}
    <path d="M3 7h8" />
    <path d="M7 7v10" />
    {/* La "W" de Wave simulando una onda de audio */}
    <path d="M13 12l2 5 2-10 2 10 2-5" />
    {/* Punto de grabación/transmisión parpadeante */}
    <circle cx="17" cy="4" r="1.5" fill="currentColor" stroke="none" className="animate-pulse" />
</svg>
);

const CustomStyles = () => (
<style dangerouslySetInnerHTML={{__html: ` :root { --sc-orange: #ff5500; --sc-orange-glow: rgba(255, 85, 0, 0.6);
    --sc-dark: #0f0f0f; --sc-panel: rgba(25, 25, 25, 0.6); } * { -webkit-tap-highlight-color: transparent; } @media
    (pointer: fine) { * { cursor: none !important; } .custom-cursor-element { display: block; } } @media (pointer:
    coarse) { .custom-cursor-element { display: none !important; } } .glass-panel { background: var(--sc-panel);
    backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.03);
    box-shadow: 0 20px 40px rgba(0,0,0,0.5); } .glass-panel-heavy { background: rgba(5, 5, 5, 0.75); backdrop-filter:
    blur(60px) saturate(200%); -webkit-backdrop-filter: blur(60px) saturate(200%); border-top: 1px solid rgba(255, 255,
    255, 0.05); } .glass-context-menu { background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(25px); border: 1px
    solid rgba(255, 255, 255, 0.1); box-shadow: 0 30px 60px rgba(0,0,0,0.8); } .text-glow { text-shadow: 0 0 30px
    rgba(255, 255, 255, 0.4); } .text-glow-orange { text-shadow: 0 0 25px var(--sc-orange-glow); }
    .custom-scroll::-webkit-scrollbar { width: 6px; } .custom-scroll::-webkit-scrollbar-track { background: transparent;
    } .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .custom-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); } /* EQ Sliders */
    input[type=range].eq-slider { -webkit-appearance: none; width: 100px; height: 4px; background:
    rgba(255,255,255,0.1); border-radius: 2px; transform: rotate(-90deg); transform-origin: center; }
    input[type=range].eq-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px;
    border-radius: 50%; background: #ff5500; box-shadow: 0 0 10px rgba(255,85,0,0.8); transition: transform 0.2s; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 15px rgba(255,255,255,0.8); } @keyframes spin-slow { from { transform:
    rotate(0deg); } to { transform: rotate(360deg); } } .vinyl-spin { animation: spin-slow 15s linear infinite; }
    .vinyl-spin.paused { animation-play-state: paused; } .playing-pulse { animation: pulse-glow 2s infinite; }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(255, 85,
    0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0); } } .lyric-line { transition: all 0.5s ease; opacity: 0.3;
    filter: blur(2px); transform: scale(0.95); } .lyric-line.active { opacity: 1; filter: blur(0px); transform:
    scale(1.05); color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,85,0,0.4); } #cursor-dot {
    width: 6px; height: 6px; background-color: var(--sc-orange); border-radius: 50%; position: fixed; top: 0; left: 0;
    pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); box-shadow: 0 0 10px var(--sc-orange); }
    #cursor-aura { width: 40px; height: 40px; border: 1px solid rgba(255, 85, 0, 0.4); border-radius: 50%; position:
    fixed; top: 0; left: 0; pointer-events: none; z-index: 9998; transform: translate(-50%, -50%); transition: width
    0.2s, height 0.2s; } body:active #cursor-aura { width: 28px; height: 28px; background-color: rgba(255, 85, 0, 0.15);
    } /* Mini EQ for active track list */ @keyframes miniEq { 0%, 100% { height: 4px; } 50% { height: 14px; } }
    .mini-eq-bar { width: 3px; background-color: var(--sc-orange); border-radius: 2px; animation: miniEq 1s ease-in-out
    infinite; } .mini-eq-bar:nth-child(1) { animation-delay: 0.1s; } .mini-eq-bar:nth-child(2) { animation-delay: 0.4s;
    } .mini-eq-bar:nth-child(3) { animation-delay: 0.2s; } .mini-eq-bar:nth-child(4) { animation-delay: 0.5s; } `}} />
);

const generateMockComments = () => {
const users = ["@bass_head", "@lofi_girl", "@night_rider", "@synth_wave", "@cloud_surfer", "@dj_khaled",
"@techno_viking"];
const texts = ["🔥 Drop incoming!!", "This bass is insane 🤯", "Vibes 🌊", "Who is listening in 2026?", "Perfect for coding 💻", "Wait for the transition...", "Masterpiece 🏆", "So chill 🍃"];
return Array.from({ length: 15 }).map(() => ({
id: Math.random().toString(36).substr(2, 9),
time: Math.floor(Math.random() * 60) + 10,
user: users[Math.floor(Math.random() * users.length)],
text: texts[Math.floor(Math.random() * texts.length)],
x: Math.random() * 80 + 10
})).sort((a, b) => a.time - b.time);
};

const SOUNDCLOUD_TRACKS = [
{ id: 1, title: "Lofi Hip Hop Radio 24/7", artist: "Lofi Girl", cover:
"https://i1.sndcdn.com/artworks-000676340356-qixw4v-t500x500.jpg", url:
"https://soundcloud.com/lofigirl-music/lofi-hip-hop-radio-beats-to", comments: generateMockComments(), likes: "2.4M",
plays: "45M", genre: "lofi" },
{ id: 2, title: "Rumble (Skrillex, Fred again.. & Flowdan)", artist: "Skrillex", cover:
"https://i1.sndcdn.com/artworks-V02y9nJzSDB1N5l8-jX1Zxg-t500x500.jpg", url: "https://soundcloud.com/skrillex/rumble",
comments: generateMockComments(), likes: "890K", plays: "12M", genre: "edm" },
{ id: 3, title: "Midnight City (Eric Prydz Private Remix)", artist: "M83", cover:
"https://i1.sndcdn.com/artworks-000010996884-256pfe-t500x500.jpg", url: "https://soundcloud.com/m83/midnight-city",
comments: generateMockComments(), likes: "1.2M", plays: "28M", genre: "electronic" },
{ id: 4, title: "Chillstep Sessions Vol. 42", artist: "Cloud Surfer", cover:
"https://i1.sndcdn.com/artworks-000123456789-abcdef-t500x500.jpg", url: "https://soundcloud.com/chill-music/chillstep",
comments: generateMockComments(), likes: "45K", plays: "1.1M", genre: "chill" },
{ id: 5, title: "Summer Vibes House 2026", artist: "DJ Solar", cover:
"https://i1.sndcdn.com/artworks-000456789012-ghijkl-t500x500.jpg", url:
"https://soundcloud.com/spinninrecords/summer-vibes", comments: generateMockComments(), likes: "120K", plays: "3.4M",
genre: "house" },
{ id: 6, title: "Deep Focus Ambient (432Hz)", artist: "Mindfulness", cover:
"https://i1.sndcdn.com/artworks-000789012345-mnopqr-t500x500.jpg", url:
"https://soundcloud.com/ambientmusicalgenre/deep-focus", comments: generateMockComments(), likes: "500K", plays: "10M",
genre: "ambient" },
];

const MOCK_LYRICS = [
{ t: 0, text: "🎵 (Instrumental Intro) 🎵" },
{ t: 15, text: "Yeah, welcome to the future..." },
{ t: 20, text: "We are in 2026, feeling the vibe." },
{ t: 25, text: "Let the bass drop." },
{ t: 30, text: "Running through the neon streets," },
{ t: 35, text: "Heartbeat syncing with the beats." },
{ t: 45, text: "🎵 (Synthesizer Solo) 🎵" },
{ t: 60, text: "Can you feel the energy?" },
];

const InteractiveWaveform = ({ trackId, progress, isPlaying, duration, onSeek, width = "100%", height = "60px", bars =
80 }) => {
const waveData = useMemo(() => {
let data = [];
const seed = trackId * 10.5;
for (let i = 0; i < bars; i++) { let val=(Math.sin(i * seed * 0.1) * 30) + (Math.cos(i * 1.3) * 20) + (Math.sin(i * 0.5)
    * 10) + 40; data.push(Math.max(15, Math.min(100, Math.abs(val)))); } return data; }, [trackId, bars]); const
    handleInteraction=(e)=> {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent);
    };

    return (
    <div className="flex items-center gap-[2px] cursor-pointer group" style={{ width, height }}
        onClick={handleInteraction}>
        {waveData.map((val, i) => {
        const isPlayed = (i / bars) * 100
        <= progress; return ( <div key={i} className="flex-1 rounded-sm transition-all duration-200" style={{ height:
            `${isPlaying ? val + (Math.random() * 10 - 5) : val}%`, backgroundColor: isPlayed ? '#ff5500'
            : 'rgba(255,255,255,0.15)' , opacity: isPlayed ? 1 : 0.6, transformOrigin: 'bottom' , boxShadow: isPlayed
            ? '0 0 10px rgba(255,85,0,0.5)' : 'none' }} />
        );
        })}
    </div>
    );
    };

    const ZenVisualizer = ({ isPlaying }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 150; i++) { particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1, speed: Math.random() * 0.5 + 0.1, angle: Math.random() * Math.PI * 2, color:
        `hsla(${Math.random() * 60 + 10}, 100%, 60%, ${Math.random() * 0.5 + 0.1})` }); } const render=()=> {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2; const centerY = canvas.height / 2;
        const speedMultiplier = isPlaying ? 5 : 0.5;

        particles.forEach(p => {
        p.angle += 0.005 * speedMultiplier;
        const dx = p.x - centerX; const dy = p.y - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        p.x -= Math.sin(p.angle) * p.speed * speedMultiplier + (dx/dist)*0.5*speedMultiplier;
        p.y += Math.cos(p.angle) * p.speed * speedMultiplier + (dy/dist)*0.5*speedMultiplier;

        if (p.x < 0 || p.x> canvas.width || p.y < 0 || p.y> canvas.height) {
                p.x = centerX + (Math.random() - 0.5) * 200; p.y = centerY + (Math.random() - 0.5) * 200;
                }

                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.fill();
                });

                animationFrameId = requestAnimationFrame(render);
                };
                render();

                return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId); };
                }, [isPlaying]);

                 return <canvas ref={canvasRef}
                     className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen" />;
                 };

const SoundCloudLoginModal = ({ onClose, onLoginSuccess }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState(() => localStorage.getItem('toustwave_client_id') || '');
  const [clientSecretInput, setClientSecretInput] = useState(() => localStorage.getItem('toustwave_client_secret') || '');
  const [loadingStep, setLoadingStep] = useState(0); // 0: idle, 1: connecting, 2: syncing, 3: success
  const [errorMsg, setErrorMsg] = useState('');

  const steps = [
    "",
    "Estableciendo conexión segura con SoundCloud...",
    "Sincronizando pistas y biblioteca pública...",
    "¡Inicio de sesión exitoso!"
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setErrorMsg('Por favor, introduce tu usuario o enlace de SoundCloud.');
      return;
    }
    setErrorMsg('');

    const hasCreds = clientIdInput.trim() && clientSecretInput.trim();

    if (hasCreds) {
      setLoadingStep(1);
      try {
        // 1. Exchange client credentials for access token
        const credentials = btoa(`${clientIdInput.trim()}:${clientSecretInput.trim()}`);
        const tokenResponse = await fetch('https://secure.soundcloud.com/oauth/token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials'
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Credenciales inválidas de SoundCloud o error en la petición.');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Resolve user profile
        let userSlug = usernameInput.trim();
        if (userSlug.includes('soundcloud.com/')) {
          const parts = userSlug.split('soundcloud.com/')[1].split('/');
          userSlug = parts[0];
        }
        
        const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(`https://soundcloud.com/${userSlug}`)}`;
        const resolveResponse = await fetch(resolveUrl, {
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Authorization': `OAuth ${accessToken}`
          }
        });

        if (!resolveResponse.ok) {
          throw new Error('No se pudo resolver el perfil de SoundCloud. Revisa el usuario o enlace.');
        }

        const userData = await resolveResponse.json();

        setLoadingStep(2);

        // 3. Fetch user tracks
        const tracksUrl = `https://api.soundcloud.com/users/${userData.id}/tracks?limit=50`;
        const tracksResponse = await fetch(tracksUrl, {
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Authorization': `OAuth ${accessToken}`
          }
        });

        let userTracks = [];
        if (tracksResponse.ok) {
          userTracks = await tracksResponse.json();
        }

        // Save credentials in localStorage
        localStorage.setItem('toustwave_client_id', clientIdInput.trim());
        localStorage.setItem('toustwave_client_secret', clientSecretInput.trim());

        setLoadingStep(3);

        setTimeout(() => {
          onLoginSuccess(userData, userTracks, false);
        }, 1000);

      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Error de conexión. Inténtalo de nuevo.');
        setLoadingStep(0);
      }
    } else {
      // Demo Flow (Simulated connection)
      setLoadingStep(1);
      setTimeout(() => {
        setLoadingStep(2);
        setTimeout(() => {
          setLoadingStep(3);
          setTimeout(() => {
            let name = usernameInput.trim();
            if (name.includes('soundcloud.com/')) {
              name = name.split('soundcloud.com/')[1].split('/')[0];
            }
            name = name.replace(/[-_]/g, ' ');
            name = name.charAt(0).toUpperCase() + name.slice(1);
            
            const demoUserData = {
              username: name,
              permalink: usernameInput.trim(),
              permalink_url: usernameInput.trim().includes('soundcloud.com/') ? usernameInput.trim() : `https://soundcloud.com/${usernameInput.trim()}`,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
            };
            onLoginSuccess(demoUserData, [], true);
          }, 1000);
        }, 1200);
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel-heavy w-full max-w-lg p-8 rounded-[2.5rem] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-[#ff5500]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        {loadingStep === 0 && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}

        {loadingStep === 0 ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#ff5500] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,85,0,0.4)] mb-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-black">
                  <path d="M18.8 11.2c-.3 0-.6.1-.8.2-.3-1.6-1.7-2.9-3.4-2.9-.6 0-1.2.2-1.7.5C12.4 7.6 11 6.5 9.4 6.5c-2 0-3.7 1.4-4 3.3-.2-.1-.5-.1-.8-.1-1.9 0-3.4 1.5-3.4 3.4s1.5 3.4 3.4 3.4h14.2c2.1 0 3.7-1.7 3.7-3.7S20.8 11.2 18.8 11.2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">Conectar SoundCloud</h2>
              <p className="text-gray-400 mt-2 text-xs max-w-xs">Vincula tu cuenta para importar tu onda musical y personalizar tu biblioteca.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 pl-1">Usuario o Enlace de Perfil</label>
              <input 
                type="text" 
                placeholder="ej. lofigirl o https://soundcloud.com/lofigirl"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5500] focus:bg-white/10 transition-all text-xs"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-500">Credenciales de Desarrollador (Opcional)</div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-bold text-gray-400">Client ID</label>
                  <a href="https://developers.soundcloud.com/docs/api/guide" target="_blank" rel="noreferrer" className="text-[9px] text-[#ff5500] hover:underline font-bold">¿Cómo obtenerlo?</a>
                </div>
                <input 
                  type="text" 
                  placeholder="Dejar vacío para Modo Demo"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff5500] focus:bg-white/10 transition-all text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 pl-1">Client Secret</label>
                <input 
                  type="password" 
                  placeholder="Dejar vacío para Modo Demo"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff5500] focus:bg-white/10 transition-all text-xs font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs pl-1 flex items-center gap-1.5 animate-bounce">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full py-3.5 bg-[#ff5500] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_10px_30px_rgba(255,85,0,0.3)] hover:shadow-[0_15px_30px_rgba(255,85,0,0.5)] text-xs"
            >
              Iniciar Conexión
            </button>
          </form>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Animated loader */}
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 border-4 border-white/5 border-t-[#ff5500] rounded-full animate-spin"></div>
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-10 h-10 text-[#ff5500] ${loadingStep === 3 ? 'scale-125' : 'animate-pulse'} transition-all duration-300`}>
                <path d="M18.8 11.2c-.3 0-.6.1-.8.2-.3-1.6-1.7-2.9-3.4-2.9-.6 0-1.2.2-1.7.5C12.4 7.6 11 6.5 9.4 6.5c-2 0-3.7 1.4-4 3.3-.2-.1-.5-.1-.8-.1-1.9 0-3.4 1.5-3.4 3.4s1.5 3.4 3.4 3.4h14.2c2.1 0 3.7-1.7 3.7-3.7S20.8 11.2 18.8 11.2z" />
              </svg>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white transition-all duration-300">{steps[loadingStep]}</h3>
              <div className="flex justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${loadingStep >= 1 ? 'bg-[#ff5500]' : 'bg-white/25'} transition-all duration-300`}></span>
                <span className={`w-2 h-2 rounded-full ${loadingStep >= 2 ? 'bg-[#ff5500]' : 'bg-white/25'} transition-all duration-300`}></span>
                <span className={`w-2 h-2 rounded-full ${loadingStep >= 3 ? 'bg-[#ff5500]' : 'bg-white/25'} transition-all duration-300`}></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


                export default function App() {
                const [gsapLoaded, setGsapLoaded] = useState(false);
                const [scLoaded, setScLoaded] = useState(() => typeof window !== 'undefined' && !!window.SC);
                const [scLoadError, setScLoadError] = useState(false);

                // User Profile & Authentication State
                const [userProfile, setUserProfile] = useState(() => {
                  try {
                    const saved = localStorage.getItem('toustwave_user');
                    return saved ? JSON.parse(saved) : { isLoggedIn: false, username: '', profileUrl: '', avatarUrl: '' };
                  } catch (e) {
                    return { isLoggedIn: false, username: '', profileUrl: '', avatarUrl: '' };
                  }
                });
                const [showLoginModal, setShowLoginModal] = useState(false);

                // Navigation & UI State
                const [currentView, setCurrentView] = useState('descubrir'); // descubrir, explorar, favoritos, playlists, artist, studio, radio
                const [notification, setNotification] = useState(null);
                const [selectedArtist, setSelectedArtist] = useState(null);
                const [showQueuePanel, setShowQueuePanel] = useState(false);
                const [showEQPanel, setShowEQPanel] = useState(false);
                const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, track: null });

                // SC Audio State
                const iframeRef = useRef(null);
                const [scWidget, setScWidget] = useState(null);
                const [isWidgetReady, setIsWidgetReady] = useState(false);
                const [isPlaying, setIsPlaying] = useState(false);
                const [currentTrack, setCurrentTrack] = useState(null);
                const [progress, setProgress] = useState(0);
                const [currentTime, setCurrentTime] = useState(0);
                const [duration, setDuration] = useState(0);
                const [volume, setVolume] = useState(80);

                // Player Views State
                const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false);
                const [playerTab, setPlayerTab] = useState('visualizer');

                // Data State
                const [allTracks, setAllTracks] = useState(() => {
                  try {
                    const saved = localStorage.getItem('toustwave_tracks');
                    return saved ? JSON.parse(saved) : SOUNDCLOUD_TRACKS;
                  } catch (e) {
                    return SOUNDCLOUD_TRACKS;
                  }
                });
                const [queue, setQueue] = useState(() => {
                  try {
                    const saved = localStorage.getItem('toustwave_tracks');
                    return saved ? JSON.parse(saved) : SOUNDCLOUD_TRACKS;
                  } catch (e) {
                    return SOUNDCLOUD_TRACKS;
                  }
                });
                const [queueIndex, setQueueIndex] = useState(0);
                const [favorites, setFavorites] = useState(() => {
                  try {
                    const saved = localStorage.getItem('toustwave_favorites');
                    return saved ? JSON.parse(saved) : [];
                  } catch (e) {
                    return [];
                  }
                });
                const [searchQuery, setSearchQuery] = useState('');
                const [urlInput, setUrlInput] = useState('');
                const [isImporting, setIsImporting] = useState(false);

                // EQ Settings
                const [eqLevels, setEqLevels] = useState({ low: 50, midLow: 50, mid: 50, midHigh: 50, high: 50 });

                // Refs
                const cursorDotRef = useRef(null);
                const cursorAuraRef = useRef(null);
                const lyricsContainerRef = useRef(null);

                useEffect(() => {
                if (window.SC) {
                  setScLoaded(true);
                }

                const scScript = document.createElement('script');
                scScript.src = '/soundcloud-widget-api.js';
                scScript.onload = () => {
                  console.log("SoundCloud API loaded successfully.");
                  setScLoaded(true);
                  setScLoadError(false);
                };
                scScript.onerror = () => {
                  console.error("Failed to load SoundCloud API script.");
                  setScLoadError(true);
                };
                document.body.appendChild(scScript);

                const gsapScript = document.createElement('script');
                gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
                gsapScript.onload = () => setGsapLoaded(true);
                document.body.appendChild(gsapScript);

                return () => {
                if(scScript.parentNode) document.body.removeChild(scScript);
                if(gsapScript.parentNode) document.body.removeChild(gsapScript);
                };
                }, []);

                useEffect(() => {
                if (scLoaded && window.SC && iframeRef.current && !scWidget) {
                console.log("Initializing SoundCloud Widget...");
                const widget = window.SC.Widget(iframeRef.current);
                setScWidget(widget);

                widget.bind(window.SC.Widget.Events.READY, () => {
                console.log("SoundCloud Widget is READY");
                setIsWidgetReady(true);
                widget.setVolume(volume);
                });
                widget.bind(window.SC.Widget.Events.PLAY, () => setIsPlaying(true));
                widget.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));

                widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
                const sec = data.currentPosition / 1000;
                setCurrentTime(sec);
                setProgress(data.relativePosition * 100);
                });

                widget.bind(window.SC.Widget.Events.FINISH, () => { setIsPlaying(false); playNext(); });
                }
                }, [scLoaded, iframeRef.current, scWidget]);

                // Cursor Animation
                useEffect(() => {
                if (!gsapLoaded || !window.gsap || window.matchMedia("(pointer: coarse)").matches) return;
                let xToDot = window.gsap.quickTo(cursorDotRef.current, "x", {duration: 0.1, ease: "power3"});
                let yToDot = window.gsap.quickTo(cursorDotRef.current, "y", {duration: 0.1, ease: "power3"});
                let xToAura = window.gsap.quickTo(cursorAuraRef.current, "x", {duration: 0.8, ease: "elastic.out(1, 0.3)"});
                let yToAura = window.gsap.quickTo(cursorAuraRef.current, "y", {duration: 0.8, ease: "elastic.out(1, 0.3)"});
                const moveCursor = (e) => { xToDot(e.clientX); yToDot(e.clientY); xToAura(e.clientX); yToAura(e.clientY); };
                window.addEventListener("mousemove", moveCursor);
                return () => window.removeEventListener("mousemove", moveCursor);
                }, [gsapLoaded]);

                // Context Menu Global Click Away
                useEffect(() => {
                const handleClickAway = () => setContextMenu({ ...contextMenu, visible: false });
                window.addEventListener('click', handleClickAway);
                return () => window.removeEventListener('click', handleClickAway);
                }, [contextMenu]);


                // Lyrics Auto-Scroll
                useEffect(() => {
                if (playerTab === 'lyrics' && lyricsContainerRef.current) {
                const activeLine = lyricsContainerRef.current.querySelector('.active');
                if (activeLine) {
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                }
                }, [currentTime, playerTab]);

                const showNotification = (msg) => {
                setNotification(msg);
                setTimeout(() => setNotification(null), 3500);
                };

                const playTrack = (track, newQueue = null, index = 0) => {
                if (newQueue) { setQueue(newQueue); setQueueIndex(index); }
                setCurrentTrack(track);

                if (scWidget && isWidgetReady) {
                scWidget.load(track.url, {
                auto_play: true, show_artwork: false, liking: false, sharing: false,
                callback: () => scWidget.getDuration((d) => setDuration(d / 1000))
                });
                } else {
                showNotification("Cargando motor de audio...");
                }
                };

                const togglePlay = (e) => {
                if(e) e.stopPropagation();
                if (!currentTrack || !scWidget) return;
                scWidget.toggle();
                };

                const playNext = useCallback((e) => {
                if(e) e.stopPropagation();
                if (queue.length > 0 && queueIndex < queue.length - 1) { playTrack(queue[queueIndex + 1], queue, queueIndex + 1); } else { scWidget?.seekTo(0); scWidget?.pause(); setIsPlaying(false); } }, [queue, queueIndex, scWidget, isWidgetReady]); const playPrev=(e)=> {
                    if(e) e.stopPropagation();
                    if (currentTime > 5 && scWidget) scWidget.seekTo(0);
                    else if (queue.length > 0 && queueIndex > 0) playTrack(queue[queueIndex - 1], queue, queueIndex - 1);
                    };

                    const handleSeek = (percent) => { if (scWidget && duration) scWidget.seekTo(percent * duration * 1000); };
                    useEffect(() => { if (scWidget) scWidget.setVolume(volume); }, [volume, scWidget]);

                    const formatTime = (seconds) => {
                    if(!seconds || isNaN(seconds)) return "0:00";
                    const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
                    return `${m}:${s < 10 ? '0' : '' }${s}`; }; const navigateToArtist=(artistName)=> {
                        setSelectedArtist(artistName);
                        setCurrentView('artist');
                        };

                        const toggleFavorite = (e, trackId) => {
                        if(e) e.stopPropagation();
                        const isFav = favorites.includes(trackId);
                        const nextFavs = isFav ? favorites.filter(id => id !== trackId) : [...favorites, trackId];
                        setFavorites(nextFavs);
                        localStorage.setItem('toustwave_favorites', JSON.stringify(nextFavs));
                        showNotification(isFav ? "Eliminado de Tus Me Gusta" : "Guardado en Favoritos ❤️");
                        };

                        const handleContextMenuOpen = (e, track) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, track });
                        };

                        const shareTrack = (track) => {
                        navigator.clipboard.writeText(track.url);
                        showNotification(`Enlace copiado al portapapeles 🔗`);
                        setContextMenu({ ...contextMenu, visible: false });
                        };

                        const renderDiscoverView = () => {
                          const heroTrack = allTracks[1] || allTracks[0];
                          return (
                          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-40">
                              {/* Hero Banner */}
                              <section
                                  className="relative w-full h-[300px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer"
                                  onClick={()=> playTrack(heroTrack, allTracks, allTracks[1] ? 1 : 0)} onContextMenu={(e) => handleContextMenuOpen(e, heroTrack)}>
                                  <div className="absolute inset-[-10%] bg-cover bg-center transform group-hover:scale-105 transition-transform duration-[2s]"
                                      style={{ backgroundImage: `url(${heroTrack.cover})`, filter: 'saturate(1.2)' }} />
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
                                  <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-[#ff5500] text-black px-4 py-2 rounded-lg flex items-center gap-2 font-black tracking-widest text-xs">
                                      <Radio className="w-4 h-4 animate-pulse" /> EXCLUSIVO
                                  </div>
                                  <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 w-[80%]">
                                      <h2 className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 text-glow tracking-tighter leading-none">{heroTrack.title}</h2>
                                      <p className="text-lg sm:text-2xl text-gray-300 hover:text-white" onClick={(e)=> {e.stopPropagation(); navigateToArtist(heroTrack.artist);}}>{heroTrack.artist}</p>
                                  </div>
                                  <button className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 md:w-20 md:h-20 bg-[#ff5500] rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(255,85,0,0.6)] group-hover:scale-110 transition-transform">
                                      <Play className="w-5 h-5 sm:w-8 sm:h-8 ml-1 sm:ml-2" />
                                  </button>
                              </section>

                              {/* Track List */}
                              <section>
                                  <h2 className="text-3xl font-black mb-6">Novedades Radar</h2>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {allTracks.map((track, idx) => {
                                      const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                                      return (
                                      <div key={track.id}
                                          className="flex items-center gap-4 p-4 glass-panel rounded-2xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                          onClick={()=> playTrack(track, allTracks, idx)}
                                          onContextMenu={(e) => handleContextMenuOpen(e, track)}>

                                        <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                            <img src={track.cover} className="w-full h-full object-cover" alt="cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isTrackPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-lg truncate transition-colors ${currentTrack?.id===track.id ? 'text-[#ff5500]' : 'group-hover:text-[#ff5500]' }`}>{track.title}</p>
                                            <p className="text-sm text-gray-400 truncate hover:underline" onClick={(e)=> {e.stopPropagation(); navigateToArtist(track.artist)}}>{track.artist}</p>
                                        </div>

                                        {/* Mini Waveform Visualizer for active track */}
                                        {currentTrack?.id === track.id && (
                                        <div className="flex items-end gap-[2px] h-4 w-6 mx-2">
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                        </div>
                                        )}

                                        <button onClick={(e)=> toggleFavorite(e, track.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                                            <Heart className={`w-6 h-6 ${favorites.includes(track.id) ? 'fill-[#ff5500] text-[#ff5500]' : 'text-gray-400 hover:text-white' }`} />
                                        </button>
                                        <button onClick={(e)=> handleContextMenuOpen(e, track)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                                            <MoreHorizontal className="w-6 h-6 text-gray-400 hover:text-white" />
                                        </button>
                                    </div>
                                    )
                                    })}
                                </div>
                            </section>
                        </div>
                        );
                        };

                        const renderRadioView = () => (
                        <div className="animate-in fade-in zoom-in-95 duration-500 pb-40">
                            <div className="relative h-80 rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex flex-col items-center justify-center bg-[#111]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff5500]/40 to-purple-900/40 opacity-50 mix-blend-screen"></div>
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: "radial-gradient(circle at center, #ff5500 2px, transparent 2px)" ,
                                    backgroundSize: "30px 30px" }}></div>

                                <div className="relative z-10 w-32 h-32 bg-black/50 backdrop-blur-md rounded-full border-4 border-[#ff5500] flex items-center justify-center shadow-[0_0_80px_rgba(255,85,0,0.6)] mb-6 animate-pulse">
                                    <Radio className="w-16 h-16 text-[#ff5500]" />
                                </div>
                                <h1 className="relative z-10 text-5xl md:text-7xl font-black text-white text-glow tracking-tighter">ToustWave.fm</h1>
                                <p className="relative z-10 text-gray-300 mt-2 font-medium tracking-widest uppercase">Estación Infinita Generativa</p>
                                <button onClick={()=> {playTrack(allTracks[3] || allTracks[0], allTracks, allTracks[3] ? 3 : 0); showNotification("Iniciando estación basada en tus gustos...");}}
                                    className="relative z-10 mt-8 px-10 py-4 bg-[#ff5500] text-black font-black rounded-full hover:scale-105 shadow-[0_0_30px_rgba(255,85,0,0.5)] uppercase tracking-widest">Sintonizar</button>
                            </div>
                        </div>
                        );

                        const renderArtistProfile = () => {
                        const artistTracks = allTracks.filter(t => t.artist === selectedArtist || allTracks.indexOf(t) < 3); // Mock data
                        return (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-40">
                            <div className="relative h-64 md:h-80 rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-8 shadow-2xl bg-gradient-to-r from-[#ff5500] to-purple-800">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute bottom-4 left-4 md:bottom-8 md:left-10 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
                                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-black shadow-2xl bg-black overflow-hidden flex items-center justify-center shrink-0">
                                        <User className="w-10 h-10 md:w-16 md:h-16 text-gray-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /><span className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-200">Artista Verificado</span>
                                        </div>
                                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white text-glow tracking-tighter line-clamp-1">{selectedArtist}</h1>
                                        <p className="text-sm md:text-lg text-white/80 font-medium mt-1">1,240,500 oyentes mensuales</p>
                                    </div>
                                </div>
                                <button className="absolute bottom-4 right-4 md:bottom-10 md:right-10 px-5 py-2 md:px-8 md:py-3 bg-white text-black rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">Seguir</button>
                            </div>

                            <h2 className="text-2xl font-black mb-6 mt-12">Populares</h2>
                            <div className="space-y-2">
                                {artistTracks.map((track, idx) => (
                                <div key={track.id} onContextMenu={(e)=> handleContextMenuOpen(e, track)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group border border-transparent hover:border-white/5 transition-colors" onClick={() => playTrack(track, artistTracks, idx)}>
                                    <span className="w-6 text-center text-gray-500 font-bold group-hover:hidden">{idx + 1}</span>
                                    <span className="w-6 text-center hidden group-hover:block">
                                        <Play className="w-4 h-4 text-white mx-auto" />
                                    </span>
                                    <img src={track.cover} className="w-12 h-12 rounded-lg shadow-md" alt="cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate ${currentTrack?.id===track.id ? 'text-[#ff5500]' : '' }`}>{track.title}</p>
                                    </div>
                                    <p className="text-gray-400 text-sm hidden md:block">{(Math.random() * 5 + 1).toFixed(1)}M reproducciones</p>
                                    <button onClick={(e)=> handleContextMenuOpen(e, track)} className="p-2 opacity-0 group-hover:opacity-100 hover:scale-125">
                                        <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-white" />
                                    </button>
                                </div>
                                ))}
                            </div>
                            </div>
                            );
                            };


                        const renderFavoritosView = () => {
                          const favTracks = allTracks.filter(track => favorites.includes(track.id));
                          return (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-40">
                              <div>
                                <h1 className="text-5xl font-black text-white text-glow tracking-tighter">Mis Me Gusta</h1>
                                <p className="text-gray-400 mt-2">Tus canciones preferidas guardadas en ToustWave.</p>
                              </div>

                              {favTracks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-[2.5rem] p-8 border border-white/5">
                                  <Heart className="w-16 h-16 text-gray-600 mb-6 animate-pulse" />
                                  <h3 className="text-2xl font-black mb-2">No tienes canciones favoritas</h3>
                                  <p className="text-gray-400 max-w-sm">Haz clic en el corazón de cualquier canción en el Inicio o en el Buscador para verla aquí.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {favTracks.map((track, idx) => {
                                    const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                                    return (
                                      <div key={track.id}
                                        className="flex items-center gap-4 p-4 glass-panel rounded-2xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                        onClick={() => playTrack(track, favTracks, idx)}
                                        onContextMenu={(e) => handleContextMenuOpen(e, track)}
                                      >
                                        <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                          <img src={track.cover} className="w-full h-full object-cover" alt="cover" />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isTrackPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                                          </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <p className={`font-bold text-lg truncate transition-colors ${currentTrack?.id === track.id ? 'text-[#ff5500]' : 'group-hover:text-[#ff5500]'}`}>{track.title}</p>
                                          <p className="text-sm text-gray-400 truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigateToArtist(track.artist) }}>{track.artist}</p>
                                        </div>

                                        {currentTrack?.id === track.id && (
                                          <div className="flex items-end gap-[2px] h-4 w-6 mx-2">
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                            <div className="mini-eq-bar"></div>
                                          </div>
                                        )}

                                        <button onClick={(e) => toggleFavorite(e, track.id)} className="p-2 hover:scale-125 transition-transform">
                                          <Heart className="w-6 h-6 fill-[#ff5500] text-[#ff5500]" />
                                        </button>
                                        <button onClick={(e) => handleContextMenuOpen(e, track)} className="p-2 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all">
                                          <MoreHorizontal className="w-6 h-6 text-gray-400 hover:text-white" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        };

                        const renderExplorarView = () => {

                          const handleImport = async (e) => {
                            e.preventDefault();
                            if (!urlInput.trim()) return;

                            const url = urlInput.trim();
                            if (!url.includes('soundcloud.com/')) {
                              showNotification('Por favor introduce un enlace válido de SoundCloud 🦊');
                              return;
                            }

                            setIsImporting(true);
                            showNotification('Importando pista desde SoundCloud...');

                            try {
                              // Attempt oEmbed resolution
                              const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                              const response = await fetch(oembedUrl);
                              if (!response.ok) throw new Error('OEmbed resolution failed');
                              const data = await response.json();

                              const newTrack = {
                                id: Date.now(),
                                title: data.title || 'SoundCloud Track',
                                artist: data.author_name || 'SoundCloud Artist',
                                cover: data.thumbnail_url || 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400&q=80',
                                url: url,
                                lyrics: '[0:00] Pista de SoundCloud cargada en vivo.\n[0:05] Disfruta del audio y el visualizador zen.'
                              };

                              const updated = [...allTracks, newTrack];
                              setAllTracks(updated);
                              setQueue(updated);
                              localStorage.setItem('toustwave_tracks', JSON.stringify(updated));
                              setUrlInput('');
                              setIsImporting(false);
                              showNotification('¡Pista importada con éxito! 🎵');
                              playTrack(newTrack, updated, updated.length - 1);
                            } catch (error) {
                              console.warn('oEmbed failed, running fallback parsing:', error);
                              // Fallback extraction
                              let title = 'SoundCloud Track';
                              let artist = 'SoundCloud Artist';
                              try {
                                const urlObj = new URL(url);
                                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                                if (pathParts.length >= 2) {
                                  artist = pathParts[0].replace(/[-_]/g, ' ');
                                  artist = artist.charAt(0).toUpperCase() + artist.slice(1);
                                  title = pathParts[1].replace(/[-_]/g, ' ');
                                  title = title.charAt(0).toUpperCase() + title.slice(1);
                                }
                              } catch (e) {}

                              const newTrack = {
                                id: Date.now(),
                                title: title,
                                artist: artist,
                                cover: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400&q=80',
                                url: url,
                                lyrics: '[0:00] Pista de SoundCloud cargada en vivo.\n[0:05] Disfruta del audio y el visualizador zen.'
                              };

                              const updated = [...allTracks, newTrack];
                              setAllTracks(updated);
                              setQueue(updated);
                              localStorage.setItem('toustwave_tracks', JSON.stringify(updated));
                              setUrlInput('');
                              setIsImporting(false);
                              showNotification('¡Pista importada con éxito! 🎵');
                              playTrack(newTrack, updated, updated.length - 1);
                            }
                          };

                          // Filter based on search query
                          const filtered = allTracks.filter(track => 
                            track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            track.artist.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          return (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-40">
                              <div>
                                <h1 className="text-5xl font-black text-white text-glow tracking-tighter">Búsqueda y Conexión</h1>
                                <p className="text-gray-400 mt-2">Busca canciones locales o importa enlaces directos de SoundCloud.</p>
                              </div>

                              {/* Search & SoundCloud Link Input */}
                              <div className="flex flex-col gap-6 p-4 md:p-8 glass-panel rounded-[2rem] md:rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5500]/5 rounded-full blur-2xl pointer-events-none"></div>
                                
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase tracking-wider text-[#ff5500] pl-1">Buscar Pistas en el Radar</label>
                                  <div className="relative">
                                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                      type="text" 
                                      placeholder="Introduce título, artista o género..."
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-4.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5500] focus:bg-white/10 transition-all"
                                    />
                                  </div>
                                </div>

                                <div className="h-px bg-white/5 my-2"></div>

                                <form onSubmit={handleImport} className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-purple-400 pl-1 flex items-center gap-1.5">
                                      <Link className="w-4 h-4" /> Importar desde Enlace SoundCloud
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                      <input 
                                        type="text" 
                                        placeholder="ej. https://soundcloud.com/skrillex/rumble"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        disabled={isImporting}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all text-sm"
                                      />
                                      <button 
                                        type="submit" 
                                        disabled={isImporting || !urlInput.trim()}
                                        className="px-8 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-500 text-white font-black uppercase tracking-wider rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 text-sm"
                                      >
                                        {isImporting ? 'Importando...' : 'Importar'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </div>

                              {/* Search Results */}
                              <section>
                                <h2 className="text-3xl font-black mb-6">
                                  {searchQuery.trim() ? `Resultados de Búsqueda (${filtered.length})` : 'Catálogo Disponible'}
                                </h2>

                                {filtered.length === 0 ? (
                                  <div className="text-center py-16 text-gray-500">
                                    No se encontraron pistas para "{searchQuery}".
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filtered.map((track, idx) => {
                                      const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                                      return (
                                        <div key={track.id}
                                          className="flex items-center gap-4 p-4 glass-panel rounded-2xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                          onClick={() => playTrack(track, filtered, idx)}
                                          onContextMenu={(e) => handleContextMenuOpen(e, track)}
                                        >
                                          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                            <img src={track.cover} className="w-full h-full object-cover" alt="cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              {isTrackPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                                            </div>
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-lg truncate transition-colors ${currentTrack?.id === track.id ? 'text-[#ff5500]' : 'group-hover:text-[#ff5500]'}`}>{track.title}</p>
                                            <p className="text-sm text-gray-400 truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigateToArtist(track.artist) }}>{track.artist}</p>
                                          </div>

                                          {currentTrack?.id === track.id && (
                                            <div className="flex items-end gap-[2px] h-4 w-6 mx-2">
                                              <div className="mini-eq-bar"></div>
                                              <div className="mini-eq-bar"></div>
                                              <div className="mini-eq-bar"></div>
                                              <div className="mini-eq-bar"></div>
                                            </div>
                                          )}

                                          <button onClick={(e) => toggleFavorite(e, track.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                                            <Heart className={`w-6 h-6 ${favorites.includes(track.id) ? 'fill-[#ff5500] text-[#ff5500]' : 'text-gray-400 hover:text-white'}`} />
                                          </button>
                                          <button onClick={(e) => handleContextMenuOpen(e, track)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                                            <MoreHorizontal className="w-6 h-6 text-gray-400 hover:text-white" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </section>
                            </div>
                          );
                        };

const renderPerfilView = () => {
  const userSlug = userProfile.profileUrl ? userProfile.profileUrl.split('/').pop().toLowerCase() : '';
  const myTracks = allTracks.filter(t => 
    (t.url && t.url.toLowerCase().includes('/' + userSlug)) || 
    (t.artist && t.artist.toLowerCase() === userProfile.username.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-40">
      <div className="relative h-64 md:h-80 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-r from-orange-600 via-[#ff5500] to-purple-900">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-black/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left z-10 w-[90%] md:w-auto">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff5500] to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-black bg-black overflow-hidden flex items-center justify-center shadow-2xl">
              <img src={userProfile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${userProfile.isDemo ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-green-400 shadow-[0_0_10px_#4ade80]'} animate-pulse`}></span>
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-orange-200">
                {userProfile.isDemo ? 'Perfil Conectado (Modo Demo)' : 'Perfil Conectado (API Activa)'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white text-glow tracking-tighter line-clamp-1">{userProfile.username}</h1>
            <p className="text-sm md:text-base text-white/70 font-medium mt-1">{userProfile.isDemo ? 'Modo simulación de SoundCloud' : 'Conectado vía SoundCloud'}</p>
          </div>
        </div>

        <div className="absolute top-6 right-6 md:top-auto md:bottom-10 md:right-10 flex gap-3">
          <button 
            onClick={() => window.open(userProfile.profileUrl, '_blank')}
            className="px-5 py-2.5 md:px-8 md:py-3.5 bg-white text-black rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.3)] flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> SoundCloud
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Pistas Importadas</p>
          <p className="text-4xl font-black text-white text-glow mt-4">{myTracks.length}</p>
        </div>
        <div className="p-6 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Favoritos</p>
          <p className="text-4xl font-black text-pink-500 text-glow mt-4">{favorites.length}</p>
        </div>
        <div className="p-6 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Estado</p>
          <p className="text-lg font-black text-[#ff5500] text-glow mt-4 uppercase tracking-widest">Premium</p>
        </div>
        <div className="p-6 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Sesión</p>
          <button 
            onClick={() => {
              setUserProfile({ isLoggedIn: false, username: '', profileUrl: '', avatarUrl: '' });
              localStorage.removeItem('toustwave_user');
              localStorage.removeItem('toustwave_tracks');
              setAllTracks(SOUNDCLOUD_TRACKS);
              setQueue(SOUNDCLOUD_TRACKS);
              setCurrentView('descubrir');
              showNotification("Sesión cerrada");
            }}
            className="w-full mt-4 py-2 px-4 bg-red-600/20 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Desconectar
          </button>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-3xl font-black">Mi Música Importada</h2>
        {myTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center glass-panel rounded-3xl p-8 border border-white/5">
            <UploadCloud className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
            <h3 className="text-xl font-black mb-1">No has importado pistas aún</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-6">Importa enlaces directos de tu perfil de SoundCloud desde la pestaña de Búsqueda.</p>
            <button 
              onClick={() => setCurrentView('explorar')} 
              className="px-6 py-3 bg-[#ff5500] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
            >
              Ir a Búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTracks.map((track, idx) => {
              const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
              return (
                <div key={track.id}
                  className="flex items-center gap-4 p-4 glass-panel rounded-2xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                  onClick={() => playTrack(track, myTracks, idx)}
                  onContextMenu={(e) => handleContextMenuOpen(e, track)}
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                    <img src={track.cover} className="w-full h-full object-cover" alt="cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isTrackPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg truncate transition-colors ${currentTrack?.id === track.id ? 'text-[#ff5500]' : 'group-hover:text-[#ff5500]'}`}>{track.title}</p>
                    <p className="text-sm text-gray-400 truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigateToArtist(track.artist) }}>{track.artist}</p>
                  </div>

                  {currentTrack?.id === track.id && (
                    <div className="flex items-end gap-[2px] h-4 w-6 mx-2">
                      <div className="mini-eq-bar"></div>
                      <div className="mini-eq-bar"></div>
                      <div className="mini-eq-bar"></div>
                      <div className="mini-eq-bar"></div>
                    </div>
                  )}

                  <button onClick={(e) => toggleFavorite(e, track.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                    <Heart className={`w-6 h-6 ${favorites.includes(track.id) ? 'fill-[#ff5500] text-[#ff5500]' : 'text-gray-400 hover:text-white'}`} />
                  </button>
                  <button onClick={(e) => handleContextMenuOpen(e, track)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125">
                    <MoreHorizontal className="w-6 h-6 text-gray-400 hover:text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

                            const renderStudio = () => (
                            <div className="animate-in fade-in slide-in-from-bottom-12 duration-500 flex flex-col items-center justify-center h-full pb-40 pt-10 md:pt-20">
                                <div className="w-24 h-24 bg-white/5 border border-[#ff5500]/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,85,0,0.2)]">
                                    <UploadCloud className="w-12 h-12 text-[#ff5500]" />
                                </div>
                                <h1 className="text-5xl font-black mb-4 tracking-tighter">Creator Studio</h1>
                                <p className="text-gray-400 text-xl mb-12 text-center max-w-lg">Sube tus pistas, remixes o podcasts. Conecta con millones de oyentes al instante.</p>

                                <div className="w-full max-w-2xl h-72 border-2 border-dashed border-white/20 rounded-[3rem] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#ff5500] hover:bg-[#ff5500]/5 transition-all duration-300 group shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[#ff5500]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Mic2 className="w-12 h-12 text-gray-500 group-hover:text-[#ff5500] mb-6 transition-colors transform group-hover:-translate-y-2 duration-300" />
                                    <p className="text-2xl font-bold relative z-10">Arrastra tu archivo de audio aquí</p>
                                    <p className="text-sm text-gray-500 mt-2 relative z-10">Soporta MP3, WAV, FLAC hasta 2GB</p>
                                    <button className="mt-8 px-10 py-4 bg-[#ff5500] text-black font-black uppercase tracking-widest rounded-full hover:scale-105 shadow-[0_0_30px_rgba(255,85,0,0.4)] relative z-10 transition-transform">Seleccionar Archivo</button>
                                </div>
                            </div>
                            );

                            return (
                            <div className="flex h-[100dvh] bg-[var(--sc-dark)] text-white font-sans overflow-hidden relative selection:bg-[#ff5500] selection:text-white">
                                <CustomStyles />
                                {scLoadError && (
                                  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-xl p-5 glass-panel-heavy border-l-4 border-l-amber-500 rounded-3xl flex gap-4 items-start shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-300">
                                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-white text-sm">Motor de Audio Bloqueado</h4>
                                      <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                                        Tu bloqueador de anuncios (AdBlock, Brave Shield, etc.) está bloqueando los scripts de SoundCloud. 
                                        Por favor, desactiva el bloqueador o añade **sondtoust.web.app** a la lista de permitidos para que la música pueda sonar.
                                      </p>
                                    </div>
                                    <button 
                                      onClick={() => setScLoadError(false)}
                                      className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {showLoginModal && (
                                  <SoundCloudLoginModal 
                                    onClose={() => setShowLoginModal(false)} 
                                    onLoginSuccess={(userData, userTracks, isDemo = false) => {
                                      const newProfile = {
                                        isLoggedIn: true,
                                        username: userData.username || userData.permalink || 'SoundCloud User',
                                        profileUrl: userData.permalink_url || `https://soundcloud.com/${userData.permalink}`,
                                        avatarUrl: userData.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}`,
                                        isDemo: isDemo
                                      };
                                      setUserProfile(newProfile);
                                      localStorage.setItem('toustwave_user', JSON.stringify(newProfile));

                                      // Map and save the fetched SoundCloud tracks
                                      if (userTracks && userTracks.length > 0) {
                                        const mapped = userTracks.map(t => ({
                                          id: t.id,
                                          title: t.title || 'SoundCloud Track',
                                          artist: t.user ? t.user.username : (userData.username || 'SoundCloud Artist'),
                                          cover: t.artwork_url || userData.avatar_url || 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400&q=80',
                                          url: t.permalink_url,
                                          likes: t.likes_count ? (t.likes_count >= 1000 ? `${(t.likes_count / 1000).toFixed(1)}K` : t.likes_count.toString()) : '0',
                                          plays: t.playback_count ? (t.playback_count >= 1000 ? `${(t.playback_count / 1000).toFixed(1)}K` : t.playback_count.toString()) : '0',
                                          genre: t.genre || 'SoundCloud',
                                          comments: []
                                        }));
                                        
                                        // Update state: prepend user's actual tracks to current catalog
                                        const updatedTracks = [...mapped, ...SOUNDCLOUD_TRACKS];
                                        setAllTracks(updatedTracks);
                                        setQueue(updatedTracks);
                                        localStorage.setItem('toustwave_tracks', JSON.stringify(updatedTracks));
                                      }

                                      showNotification(isDemo ? `¡Conectado como ${newProfile.username}! 🦊 (Modo Demo)` : `¡Conectado como ${userData.username || 'Usuario'}! 🦊`);
                                      setShowLoginModal(false);
                                    }}
                                  />
                                )}
                                <div id="cursor-dot" className="custom-cursor-element" ref={cursorDotRef}></div>
                                <div id="cursor-aura" className="custom-cursor-element" ref={cursorAuraRef}></div>
                                <iframe 
                                    ref={iframeRef} 
                                    width="100%" 
                                    height="166" 
                                    scrolling="no" 
                                    frameBorder="no"
                                    allow="autoplay"
                                    onLoad={() => setScLoaded(true)}
                                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&color=%23ff5500&auto_play=false"
                                    style={{
                                      position: 'absolute',
                                      width: '1px',
                                      height: '1px',
                                      opacity: 0.001,
                                      pointerEvents: 'none',
                                      left: '-9999px',
                                      top: '-9999px'
                                    }}
                                 ></iframe>

                                {/* Dynamic Background */}
                                <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-[3s]">
                                    {currentTrack ? (
                                    <div className="absolute inset-0 bg-cover bg-center opacity-30 scale-150 transition-all duration-[3s]"
                                        style={{ backgroundImage: `url(${currentTrack.cover})`, filter: 'blur(100px) saturate(200%)' }} />
                                    ) : (
                                    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff5500]/15 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[4s]"></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0f0f0f]/80 to-[#0f0f0f]"></div>
                                </div>

                                {/* Global Notifications (Toast) */}
                                {notification && (
                                <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[500] glass-panel-heavy px-6 py-4 rounded-full text-sm font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in border border-white/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5500] shadow-[0_0_15px_#ff5500] animate-pulse"></div>{notification}
                                </div>
                                )}

                                {/* Global Context Menu */}
                                {contextMenu.visible && contextMenu.track && (
                                <div className="fixed z-[600] glass-context-menu p-2 rounded-2xl min-w-[240px] animate-in zoom-in-95 fade-in duration-150 origin-top-left"
                                    style={{ top: Math.min(contextMenu.y, window.innerHeight - 250), left: Math.min(contextMenu.x, window.innerWidth - 240) }}>
                                    <div className="flex items-center gap-3 p-3 border-b border-white/10 mb-2">
                                        <img src={contextMenu.track.cover} className="w-10 h-10 rounded-md shadow-sm" alt="cover" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold truncate">{contextMenu.track.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{contextMenu.track.artist}</p>
                                        </div>
                                    </div>

                                    <button onClick={(e)=> { e.stopPropagation(); playTrack(contextMenu.track, allTracks); setContextMenu({...contextMenu, visible: false}); }}
                                        className="w-full flex items-center gap-3 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all hover:pl-5 text-left">
                                        <Play className="w-4 h-4 text-[#ff5500]" /> Reproducir
                                    </button>
                                    <button onClick={(e)=> { e.stopPropagation(); navigateToArtist(contextMenu.track.artist); setContextMenu({...contextMenu, visible: false}); }}
                                        className="w-full flex items-center gap-3 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all hover:pl-5 text-left">
                                        <User className="w-4 h-4 text-blue-400" /> Ir al Artista
                                    </button>
                                    <button onClick={(e)=> { e.stopPropagation(); showNotification("Añadido a la cola"); setContextMenu({...contextMenu, visible: false}); }}
                                        className="w-full flex items-center gap-3 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all hover:pl-5 text-left">
                                        <ListPlus className="w-4 h-4 text-purple-400" /> Añadir a la cola
                                    </button>
                                    <button onClick={(e)=> { e.stopPropagation(); toggleFavorite(e, contextMenu.track.id); setContextMenu({...contextMenu, visible: false}); }}
                                        className="w-full flex items-center gap-3 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all hover:pl-5 text-left">
                                        <Heart className="w-4 h-4 text-pink-500" /> Guardar
                                    </button>
                                    <div className="h-px bg-white/10 my-1"></div>
                                    <button onClick={(e)=> { e.stopPropagation(); shareTrack(contextMenu.track); }}
                                        className="w-full flex items-center gap-3 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all hover:pl-5 text-left">
                                        <Share className="w-4 h-4 text-green-400" /> Compartir Enlace
                                    </button>
                                </div>
                                )}

                                {/* Sidebar Navigation */}
                                <div className="hidden md:flex w-64 glass-panel flex-col z-40 shrink-0 border-r border-white/5">
                                    <div className="p-8 flex items-center gap-3 group cursor-pointer" onClick={()=> setCurrentView('descubrir')}>
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#ff5500] to-orange-800 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(255,85,0,0.5)] group-hover:scale-110 transition-transform">
                                            <ToustWaveLogo className="w-7 h-7 text-white" />
                                        </div>
                                        <h1 className="text-2xl font-black tracking-tighter"><span className="text-white">Toust</span><span className="text-[#ff5500]">Wave</span></h1>
                                    </div>

                                    <nav className="flex-1 mt-4 space-y-1.5 pb-40 px-4 overflow-y-auto custom-scroll">
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-4">Descubrir</div>
                                        <button onClick={()=> setCurrentView('descubrir')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === 'descubrir' ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <Home className="w-5 h-5" /> <span>Inicio</span>
                                        </button>
                                        <button onClick={()=> setCurrentView('explorar')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === 'explorar' ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <Search className="w-5 h-5" /> <span>Búsqueda</span>
                                        </button>
                                        <button onClick={()=> setCurrentView('radio')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === 'radio' ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <Radio className="w-5 h-5" /> <span>Radio</span>
                                        </button>

                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-10 mb-3 px-4">Biblioteca</div>
                                        <button onClick={()=> setCurrentView('favoritos')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === 'favoritos' ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <Heart className="w-5 h-5" /> <span>Me Gusta</span>
                                        </button>
                                        {userProfile.isLoggedIn && (
                                          <button onClick={()=> setCurrentView('perfil')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === 'perfil' ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                              <User className="w-5 h-5" /> <span>Mi Perfil</span>
                                          </button>
                                        )}

                                        <div className="text-[10px] font-black text-[#ff5500] uppercase tracking-widest mt-10 mb-3 px-4">Para Creadores</div>
                                        <button onClick={()=> setCurrentView('studio')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all border border-dashed ${currentView === 'studio' ? 'border-[#ff5500] text-[#ff5500] bg-[#ff5500]/10' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}>
                                            <UploadCloud className="w-5 h-5" /> <span>Subir Pista</span>
                                        </button>
                                    </nav>

                                    {/* User Profile Card / Connection Button */}
                                    {userProfile.isLoggedIn ? (
                                      <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col gap-4">
                                        <div 
                                          onClick={() => setCurrentView('perfil')}
                                          className="flex items-center gap-3 cursor-pointer group/card hover:bg-white/5 p-2 rounded-xl transition-all"
                                        >
                                          <img src={userProfile.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/30 shadow-inner group-hover/card:border-[#ff5500] group-hover/card:scale-105 transition-all" />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-white truncate group-hover/card:text-[#ff5500] transition-colors">{userProfile.username}</p>
                                            <p className="text-[10px] text-gray-500 font-medium truncate">Conectado</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            setUserProfile({ isLoggedIn: false, username: '', profileUrl: '', avatarUrl: '' });
                                            localStorage.removeItem('toustwave_user');
                                            localStorage.removeItem('toustwave_tracks');
                                            setAllTracks(SOUNDCLOUD_TRACKS);
                                            setQueue(SOUNDCLOUD_TRACKS);
                                            if (currentView === 'perfil') {
                                              setCurrentView('descubrir');
                                            }
                                            showNotification("Sesión cerrada");
                                          }}
                                          className="w-full py-2 bg-white/5 hover:bg-white/10 hover:text-red-400 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                                        >
                                          Cerrar Sesión
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="p-6 border-t border-white/5 bg-black/20">
                                        <button 
                                          onClick={() => setShowLoginModal(true)}
                                          className="w-full py-3 bg-[#ff5500] hover:bg-[#ff5500]/90 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(255,85,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                          Conectar SoundCloud
                                        </button>
                                      </div>
                                    )}
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 relative z-10 overflow-hidden w-full flex flex-col">
                                    {/* Mobile Header */}
                                    <header className="flex md:hidden items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/5 relative z-30 shrink-0">
                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={()=> setCurrentView('descubrir')}>
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#ff5500] to-orange-800 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,85,0,0.5)]">
                                                <ToustWaveLogo className="w-5 h-5 text-white" />
                                            </div>
                                            <h1 className="text-lg font-black tracking-tighter"><span className="text-white">Toust</span><span className="text-[#ff5500]">Wave</span></h1>
                                        </div>
                                        
                                        {/* Profile Avatar or Connect Button */}
                                        {userProfile.isLoggedIn ? (
                                          <img 
                                            src={userProfile.avatarUrl} 
                                            alt="Avatar" 
                                            onClick={() => {
                                              setCurrentView('perfil');
                                            }} 
                                            className="w-8 h-8 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/30 shadow-inner cursor-pointer" 
                                          />
                                        ) : (
                                          <button 
                                            onClick={() => setShowLoginModal(true)}
                                            className="px-4 py-2 bg-[#ff5500] hover:bg-[#ff5500]/90 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_10px_rgba(255,85,0,0.2)]"
                                          >
                                            Conectar
                                          </button>
                                        )}
                                    </header>
                                    <main className="flex-1 overflow-y-auto custom-scroll px-6 md:px-16 pt-12">
                                        <div className="max-w-[1400px] mx-auto min-h-full">
                                            {currentView === 'descubrir' && renderDiscoverView()}
                                            {currentView === 'artist' && selectedArtist && renderArtistProfile()}
                                            {currentView === 'studio' && renderStudio()}
                                            {currentView === 'radio' && renderRadioView()}

                                            {currentView === 'explorar' && renderExplorarView()}
                                            {currentView === 'favoritos' && renderFavoritosView()}
                                            {currentView === 'perfil' && renderPerfilView()}
                                        </div>
                                    </main>
                                </div>

                                {/* Up Next Queue Panel */}
                                <div className={`fixed top-0 right-0 h-[calc(100vh-100px)] w-80 glass-panel-heavy z-[45] transform transition-transform duration-500 border-l border-white/5 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${showQueuePanel ? 'translate-x-0' : 'translate-x-full' }`}>
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                        <h3 className="font-black text-xl flex items-center gap-2">
                                            <List className="w-5 h-5 text-[#ff5500]" /> Cola
                                        </h3>
                                        <button onClick={()=> setShowQueuePanel(false)} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-2">Sonando Ahora</p>
                                            {currentTrack && (
                                            <div className="flex items-center gap-3 p-3 bg-[#ff5500]/10 rounded-2xl border border-[#ff5500]/30 shadow-inner">
                                                <img src={currentTrack.cover} className="w-12 h-12 rounded-xl shadow-md" alt="cover" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-[#ff5500] truncate">{currentTrack.title}</p>
                                                    <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mt-6 pl-2">A continuación</p>
                                            {queue.slice(queueIndex + 1, queueIndex + 15).map((track, i) => (
                                            <div key={i}
                                                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
                                                onClick={()=> playTrack(track, queue, queueIndex + 1 + i)}
                                                onContextMenu={(e) => handleContextMenuOpen(e, track)}>
                                                <img src={track.cover} className="w-10 h-10 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity" alt="cover" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate text-gray-300 group-hover:text-white transition-colors">{track.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Pro EQ Modal */}
                                {showEQPanel && (
                                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:absolute md:inset-auto md:bottom-32 md:right-10 p-4 md:p-0 animate-in fade-in duration-200">
                                    <div className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-sm md:w-auto animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="font-black flex items-center gap-2 text-lg">
                                                <Sliders className="w-5 h-5 text-[#ff5500]" /> Ecualizador Pro
                                            </h4>
                                            <button onClick={()=> setShowEQPanel(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                                                <X className="w-5 h-5 text-gray-400 hover:text-white" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-around md:justify-start md:gap-8 h-48">
                                            {Object.entries(eqLevels).map(([key, val]) => (
                                            <div key={key} className="flex flex-col items-center justify-between h-full group">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{key}</span>
                                                <div className="flex-1 relative flex items-center">
                                                    <input type="range" min="0" max="100" value={val} onChange={(e)=> setEqLevels({...eqLevels, [key]: e.target.value})} className="eq-slider" />
                                                </div>
                                                <span className="text-xs text-[#ff5500] font-mono group-hover:text-white transition-colors">{val}%</span>
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentTrack && !isFullScreenPlayer && (
                                <div className="fixed bottom-[72px] md:bottom-8 left-0 md:left-1/2 transform md:-translate-x-1/2 w-full md:w-[95%] max-w-7xl glass-panel-heavy md:rounded-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.6)] border-t border-white/5 md:border md:border-white/10 z-[100] animate-in slide-in-from-bottom-32 pb-0">
                                    <div className="absolute top-0 left-0 w-full h-[2px] md:hidden bg-white/5">
                                        <div className="h-full bg-[#ff5500]" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 md:p-4 gap-4">

                                        <div className="flex items-center gap-3 md:gap-4 w-[60%] md:w-1/3 min-w-0 pl-2 cursor-pointer"
                                            onClick={()=> setIsFullScreenPlayer(true)}>
                                            <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-2xl group">
                                                <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-white text-sm md:text-base truncate hover:underline">{currentTrack.title}</h3>
                                                <p className="text-gray-400 text-xs truncate hover:text-white transition-colors"
                                                    onClick={(e)=> {e.stopPropagation(); navigateToArtist(currentTrack.artist);}}>{currentTrack.artist}</p>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex flex-col items-center flex-1">
                                            <div className="flex items-center gap-8 mb-2">
                                                <button onClick={playPrev} className="text-gray-400 hover:text-white transition-all hover:scale-125">
                                                    <SkipBack className="w-5 h-5 fill-current" />
                                                </button>
                                                <button onClick={togglePlay} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
                                                    {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
                                                </button>
                                                <button onClick={playNext} className="text-gray-400 hover:text-white transition-all hover:scale-125">
                                                    <SkipForward className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>
                                            <div className="w-full max-w-md flex items-center gap-4 px-4">
                                                <span className="text-[10px] text-gray-400 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                                                <div className="flex-1">
                                                    <InteractiveWaveform trackId={currentTrack.id} progress={progress} isPlaying={isPlaying} onSeek={handleSeek} height="16px" bars={50} />
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-mono w-10">{formatTime(duration)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-5 w-[40%] md:w-1/3 justify-end pr-2 md:pr-4">
                                            {/* Mobile Play/Pause & Next */}
                                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="md:hidden w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all">
                                                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="md:hidden p-2 text-gray-400 hover:text-white active:scale-95 transition-all">
                                                <SkipForward className="w-5 h-5 fill-current" />
                                            </button>
                                            
                                            {/* Desktop Sliders & Queue */}
                                            <button onClick={(e)=> { e.stopPropagation(); setShowEQPanel(!showEQPanel); }} className={`hidden lg:block transition-all hover:scale-110 p-2 rounded-full ${showEQPanel ? 'bg-[#ff5500]/20 text-[#ff5500]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <Sliders className="w-5 h-5" />
                                            </button>
                                            <button onClick={(e)=> { e.stopPropagation(); setShowQueuePanel(!showQueuePanel); }} className={`hidden md:block transition-all hover:scale-110 p-2 rounded-full ${showQueuePanel ? 'bg-[#ff5500]/20 text-[#ff5500]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <List className="w-5 h-5" />
                                            </button>
                                            <div className="hidden md:flex items-center gap-2 group">
                                                <Volume2 className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                                <input type="range" min="0" max="100" value={volume} onChange={(e)=> setVolume(e.target.value)} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer hover:bg-white/40" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {isFullScreenPlayer && currentTrack && (
                                <div className="fixed inset-0 z-[300] bg-black flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                    <ZenVisualizer isPlaying={isPlaying} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-0"></div>

                                    {/* Top Bar */}
                                    <div className="relative z-10 flex items-center justify-between p-6 md:p-10 pt-safe">
                                        <button onClick={()=> setIsFullScreenPlayer(false)} className="bg-white/10 p-3 md:p-4 rounded-full backdrop-blur-xl hover:bg-white/20 border border-white/10 text-white shadow-lg active:scale-95 transition-all">
                                            <ChevronDown className="w-6 h-6 md:w-8 md:h-8" />
                                        </button>
                                        <div className="flex bg-black/40 backdrop-blur-xl rounded-full p-1.5 border border-white/10 shadow-2xl">
                                            <button onClick={()=> setPlayerTab('visualizer')} className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${playerTab === 'visualizer' ? 'bg-[#ff5500] text-black shadow-[0_0_20px_rgba(255,85,0,0.5)]' : 'text-gray-400 hover:text-white'}`}>Audio</button>
                                            <button onClick={()=> setPlayerTab('lyrics')} className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${playerTab === 'lyrics' ? 'bg-[#ff5500] text-black shadow-[0_0_20px_rgba(255,85,0,0.5)]' : 'text-gray-400 hover:text-white'}`}>
                                                <Mic2 className="w-4 h-4 inline-block mr-2" />Letras
                                            </button>
                                        </div>
                                        <button onClick={(e)=> handleContextMenuOpen(e, currentTrack)} className="bg-white/10 p-3 md:p-4 rounded-full backdrop-blur-xl hover:bg-white/20 border border-white/10 transition-all">
                                            <MoreHorizontal className="w-6 h-6 text-white" />
                                        </button>
                                    </div>

                                    <div className="relative z-10 flex-1 flex items-center justify-center max-w-[1400px] mx-auto w-full px-6">
                                        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-24 w-full h-full relative">

                                            {/* Artwork Column */}
                                            <div className={`flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${playerTab==='lyrics' ? 'hidden md:flex md:w-1/3 scale-90 opacity-50' : 'md:w-1/2' }`}>

                                                {/* Vinyl Disc Container */}
                                                <div className="relative w-[65vw] max-w-[300px] md:w-[450px] md:max-w-none aspect-square rounded-full shadow-[0_40px_80px_rgba(0,0,0,0.8)] border-4 border-gray-900 bg-black overflow-hidden flex items-center justify-center shrink-0">
                                                    <div className={`absolute inset-0 vinyl-spin ${isPlaying ? '' : 'paused' }`}>
                                                        <div className="absolute inset-2 border border-gray-800 rounded-full"></div>
                                                        <div className="absolute inset-6 border border-gray-800 rounded-full"></div>
                                                        <div className="absolute inset-10 border border-gray-800 rounded-full"></div>

                                                        <div className="absolute inset-[25%] rounded-full overflow-hidden border-8 border-black">
                                                            <img src={currentTrack.cover} alt="Label" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full border border-gray-700 shadow-inner"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data / Lyrics Column */}
                                            <div className={`w-full flex flex-col justify-center transition-all duration-700 ${playerTab==='lyrics' ? 'md:w-2/3 h-[70vh]' : 'md:w-1/2 max-w-2xl' }`}>

                                                {playerTab === 'visualizer' ? (
                                                <>
                                                    <div className="mb-6 md:mb-12 text-center md:text-left">
                                                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white truncate mb-2 md:mb-4 tracking-tighter text-glow line-clamp-2">{currentTrack.title}</h2>
                                                        <p className="text-xl sm:text-3xl text-[#ff5500] font-medium truncate cursor-pointer hover:underline"
                                                            onClick={()=> {setIsFullScreenPlayer(false); navigateToArtist(currentTrack.artist);}}>{currentTrack.artist}</p>
                                                    </div>

                                                    {/* Big Waveform */}
                                                    <div className="w-full mb-12 hidden md:block">
                                                        <InteractiveWaveform trackId={currentTrack.id} progress={progress} isPlaying={isPlaying} onSeek={handleSeek} height="100px" bars={100} />
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex flex-col gap-4 md:gap-8 w-full">
                                                        <div className="flex items-center gap-6">
                                                            <span className="text-sm font-black text-gray-400 font-mono tracking-widest">{formatTime(currentTime)}</span>
                                                            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
                                                                onClick={(e)=> {
                                                                const bounds = e.currentTarget.getBoundingClientRect();
                                                                handleSeek((e.clientX - bounds.left) / bounds.width);
                                                                }}>
                                                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-[#ff5500] rounded-full shadow-[0_0_20px_rgba(255,85,0,0.8)] transition-all ease-linear"
                                                                    style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                            <span className="text-sm font-black text-gray-400 font-mono tracking-widest">{formatTime(duration)}</span>
                                                        </div>

                                                        <div className="flex items-center justify-center gap-8 sm:gap-12">
                                                            <button onClick={playPrev} className="text-gray-400 hover:text-white transition-all hover:scale-125 active:scale-95">
                                                                <SkipBack className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                                                            </button>
                                                            <button onClick={togglePlay} className="w-20 h-20 sm:w-24 sm:h-24 bg-[#ff5500] rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,85,0,0.5)] playing-pulse">
                                                                {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-black" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black ml-1.5" />}
                                                            </button>
                                                            <button onClick={playNext} className="text-gray-400 hover:text-white transition-all hover:scale-125 active:scale-95">
                                                                <SkipForward className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                                ) : (
                                                /* Karaoke View */
                                                <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto custom-scroll mask-image-y py-[20vh] pr-10 text-center md:text-left relative">
                                                    {MOCK_LYRICS.map((line, i) => {
                                                    const isActive = currentTime >= line.t && currentTime < (MOCK_LYRICS[i+1]?.t || 999); return ( <p key={i}
                                                        className={`text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-[1.2] mb-10 lyric-line ${isActive ? 'active' : '' }`}>
                                                        {line.text}</p>
                                                        )
                                                        })}
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Floating Controls for Lyrics Mode */}
                                    {playerTab === 'lyrics' && (
                                    <div className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-4 sm:gap-8 bg-black/60 backdrop-blur-3xl w-[90%] max-w-md justify-between px-6 py-3 sm:w-auto sm:justify-start sm:px-10 sm:py-4 rounded-full border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-24 z-50">
                                        <button onClick={playPrev} className="text-gray-300 hover:text-white hover:scale-125 active:scale-95 transition-all">
                                            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                                        </button>
                                        <button onClick={togglePlay} className="w-10 h-10 sm:w-14 sm:h-14 bg-[#ff5500] rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,85,0,0.5)]">
                                            {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black ml-0.5 sm:ml-1" />}
                                        </button>
                                        <button onClick={playNext} className="text-gray-300 hover:text-white hover:scale-125 active:scale-95 transition-all">
                                            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                                        </button>
                                        <div className="w-28 sm:w-48 h-1.5 bg-white/20 rounded-full ml-2 sm:ml-4 relative cursor-pointer"
                                            onClick={(e)=> {
                                            const bounds = e.currentTarget.getBoundingClientRect();
                                            handleSeek((e.clientX - bounds.left) / bounds.width);
                                            }}><div className="absolute top-0 left-0 h-full bg-[#ff5500] rounded-full shadow-[0_0_10px_#ff5500]" style={{width: `${progress}%`}}></div>
                                        </div>
                                    </div>
                                    )}

                                </div>
                                )}
                                
                                {/* Mobile Bottom Tab Bar */}
                                <div className="flex md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-black/60 backdrop-blur-2xl border-t border-white/5 items-center justify-around z-[90] pb-safe pt-2 px-2">
                                    <button onClick={()=> setCurrentView('descubrir')} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${currentView === 'descubrir' ? 'text-[#ff5500]' : 'text-gray-400'}`}>
                                        <Home className="w-5 h-5" />
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">Inicio</span>
                                    </button>
                                    <button onClick={()=> setCurrentView('explorar')} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${currentView === 'explorar' ? 'text-[#ff5500]' : 'text-gray-400'}`}>
                                        <Search className="w-5 h-5" />
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">Buscar</span>
                                    </button>
                                    <button onClick={()=> setCurrentView('radio')} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${currentView === 'radio' ? 'text-[#ff5500]' : 'text-gray-400'}`}>
                                        <Radio className="w-5 h-5" />
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">Radio</span>
                                    </button>
                                    <button onClick={()=> setCurrentView('favoritos')} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${currentView === 'favoritos' ? 'text-[#ff5500]' : 'text-gray-400'}`}>
                                        <Heart className="w-5 h-5" />
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">Me Gusta</span>
                                    </button>
                                    <button onClick={()=> setCurrentView('studio')} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${currentView === 'studio' ? 'text-[#ff5500]' : 'text-gray-400'}`}>
                                        <UploadCloud className="w-5 h-5" />
                                        <span className="text-[9px] font-bold tracking-tight mt-0.5">Studio</span>
                                    </button>
                                </div>
                            </div>
                            );
                            }
