import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Users, Play, Plus, Search, Bell, User, Settings, LogOut, ChevronRight, Star, Clock, Info, X, Maximize, Minimize, Volume2, VolumeX, SkipForward, Radio, Activity, TrendingUp, Zap, Database, BarChart3, Server, Edit3, Check, Mail, Shield, LayoutDashboard, ListVideo, Filter, MoreVertical, UploadCloud, Film, BrainCircuit, Trophy, Target, Clipboard, MessageSquare, Send, Menu, ChevronLeft, Trash2 } from 'lucide-react';
import localLinks from './local_links.json';
import scrapedDataFile from './scraped_data.json';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://' + window.location.hostname + ':3001');

const API_URL = 'http://' + window.location.hostname + ':3001/api';
const appId = 'paniculas-v3';

const ADMIN_EMAIL = 'tositoweb@gmail.com';

// --- SISTEMA DE DISEÑO SONORO (WEB AUDIO API) ---
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
const playUIHover = () => {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.05);
};
const playUIClick = () => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
};

// --- MOCK API DATA ---

const MOCK_MOVIES = [
  { id: "1", title: "EL AMANECER DEL CÓDIGO", type: "movie", genre: "Ciencia Ficción", year: 2026, rating: "98%", duration: "2h 15m", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&w=1920&q=100", description: "Un programador solitario descubre que la realidad es una simulación en un servidor obsoleto.", isTop10: true, tags: ["Cyberpunk", "Mente"], themeColor: "rgba(16, 185, 129, 0.15)", mood: "Curiosidad", sources: [{ label: 'Servidor Principal', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }, { label: 'Respaldo Ultra', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }] },
  { id: "2", title: "ECO DE PÁNICO", type: "movie", genre: "Terror", year: 2025, rating: "85%", duration: "1h 45m", image: "https://images.unsplash.com/photo-1505635552518-3448ff116af3?ixlib=rb-4.0.3&w=800&q=80", description: "Un grupo explora una mansión donde los ecos de sus propios miedos toman forma física.", isTop10: false, tags: ["Sobrenatural", "Oscuro"], themeColor: "rgba(220, 38, 38, 0.15)", mood: "Miedo", sources: [{ label: 'Servidor 1', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }] },
  { id: "3", title: "RÁPIDOS Y FURIOSOS: CSS", type: "movie", genre: "Acción", year: 2024, rating: "78%", duration: "2h 05m", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&w=800&q=80", description: "Carreras clandestinas de maquetación web. Todo se decide en la última línea de código.", isTop10: true, tags: ["Adrenalina", "Código"], themeColor: "rgba(59, 130, 246, 0.15)", mood: "Adrenalina", sources: [{ label: 'Main Server', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }] },
  { id: "4", title: "AMOR EN LA NUBE", type: "series", genre: "Romance", year: 2023, rating: "80%", duration: "1h 50m", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-4.0.3&w=800&q=80", description: "Dos IAs desarrollan sentimientos mutuos mientras gestionan los servidores de una app de citas.", isTop10: false, tags: ["Emotivo", "IA"], themeColor: "rgba(236, 72, 153, 0.15)", mood: "Emoción", sources: [{ label: 'Cloud Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' }] },
  { id: "5", title: "ODISEA ESTELAR", type: "movie", genre: "Ciencia Ficción", year: 2026, rating: "95%", duration: "2h 40m", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&w=800&q=80", description: "La humanidad busca un nuevo hogar en la galaxia de Andrómeda tras el colapso solar.", isTop10: true, tags: ["Espacio", "Épico"], themeColor: "rgba(139, 92, 246, 0.15)", mood: "Curiosidad", sources: [{ label: 'Deep Space Link', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }] },
  { id: "6", title: "LA SOMBRA", type: "series", genre: "Terror", year: 2022, rating: "69%", duration: "1h 30m", image: "https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?ixlib=rb-4.0.3&w=800&q=80", description: "Nadie sabe qué acecha en el callejón de la Calle 13, pero nadie ha vuelto para contarlo.", isTop10: false, tags: ["Misterio", "Crimen"], themeColor: "rgba(251, 146, 60, 0.1)", mood: "Miedo", sources: [{ label: 'Shadow Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }] }
];

const MENU_TABS = ['INICIO', 'SERIES', 'PELÍCULAS', 'NOVEDADES'];
const MOODS = ['Cualquiera', 'Adrenalina', 'Miedo', 'Curiosidad', 'Emoción'];

const AVATARS = [
  // Gratuitos (0 XP)
  { id: 'av1', style: 'avataaars', seed: 'Nolan', name: 'Clásico', xpRequired: 0 },
  { id: 'av_c1', style: 'avataaars', seed: 'Leo', name: 'Clásico Leo', xpRequired: 0 },
  { id: 'av_c2', style: 'avataaars', seed: 'Mia', name: 'Clásico Mia', xpRequired: 0 },
  { id: 'av2', style: 'bottts', seed: 'Odie', name: 'Robot', xpRequired: 0 },
  { id: 'av_f1', style: 'fun-emoji', seed: 'Smile', name: 'Sonrisa', xpRequired: 0 },

  // Principiante (100 - 300 XP)
  { id: 'av3', style: 'micah', seed: 'Mimi', name: 'Minimal', xpRequired: 100 },
  { id: 'av_c3', style: 'avataaars', seed: 'Jack', name: 'Clásico Jack', xpRequired: 100 },
  { id: 'av_f2', style: 'fun-emoji', seed: 'Wink', name: 'Guiño', xpRequired: 100 },
  { id: 'av4', style: 'adventurer', seed: 'Destiny', name: 'Aventurero', xpRequired: 200 },
  { id: 'av_c4', style: 'avataaars', seed: 'Sophie', name: 'Clásico Sophie', xpRequired: 300 },
  { id: 'av_f3', style: 'fun-emoji', seed: 'Cool', name: 'Guay', xpRequired: 300 },

  // Intermedio (500 - 1000 XP)
  { id: 'av5', style: 'lorelei', seed: 'Oliver', name: 'Elegante', xpRequired: 500 },
  { id: 'av_bs1', style: 'big-smile', seed: 'Charlie', name: 'Carcajada', xpRequired: 500 },
  { id: 'av_c5', style: 'avataaars', seed: 'Zoe', name: 'Clásico Zoe', xpRequired: 700 },
  { id: 'av6', style: 'fun-emoji', seed: 'Love', name: 'Enamorado', xpRequired: 1000 },
  { id: 'av_m1', style: 'miniavs', seed: 'Max', name: 'Mini Max', xpRequired: 1000 },

  // Avanzado (1500 - 3000 XP)
  { id: 'av_c6', style: 'avataaars', seed: 'Lucas', name: 'Clásico Lucas', xpRequired: 1500 },
  { id: 'av7', style: 'personas', seed: 'Felix', name: 'Persona', xpRequired: 2000 },
  { id: 'av_f4', style: 'fun-emoji', seed: 'Star', name: 'Estrella', xpRequired: 2000 },
  { id: 'av_c7', style: 'avataaars', seed: 'Emma', name: 'Clásico Emma', xpRequired: 2500 },
  { id: 'av8', style: 'pixel-art', seed: 'Pixel', name: 'Retro', xpRequired: 3000 },
  
  // Élite (4000 - 5000 XP)
  { id: 'av_p1', style: 'open-peeps', seed: 'Peep', name: 'Peep', xpRequired: 4000 },
  { id: 'av_c8', style: 'avataaars', seed: 'King', name: 'Rey Clásico', xpRequired: 5000 },
  { id: 'av_f5', style: 'fun-emoji', seed: 'Fire', name: 'Fuego', xpRequired: 5000 },
];

// --- CUSTOM HOOKS UI ---
function InteractiveElement({ children, className, onClick }) {
  const handleMouseEnter = () => { playUIHover(); };
  const handleClick = (e) => { playUIClick(); if(onClick) onClick(e); };
  return <div className={`interactive ${className}`} onMouseEnter={handleMouseEnter} onClick={handleClick}>{children}</div>;
}

function CustomCursor() {
  const cursorRef = useRef(null); const followerRef = useRef(null); const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const moveCursor = (e) => {
      if (cursorRef.current && followerRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        followerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    const handleMouseOver = (e) => setIsHovering(!!e.target.closest('.interactive, button, a, input, select, .video-control'));
    window.addEventListener('mousemove', moveCursor); window.addEventListener('mouseover', handleMouseOver);
    return () => { window.removeEventListener('mousemove', moveCursor); window.removeEventListener('mouseover', handleMouseOver); };
  }, []);
  return (
    <>
      <div ref={cursorRef} className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference hidden md:block" style={{ transition: 'width 0.2s, height 0.2s', width: isHovering ? '8px' : '12px', height: isHovering ? '8px' : '12px' }} />
      <div ref={followerRef} className={`fixed top-0 left-0 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 border border-white/30 hidden md:block transition-all duration-300 ease-out`} style={{ width: isHovering ? '60px' : '40px', height: isHovering ? '60px' : '40px', backgroundColor: isHovering ? 'rgba(255,255,255,0.05)' : 'transparent' }} />
    </>
  );
}

// --- ICONOS CUSTOM PARA LOGIN ---
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
);
const AppleIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.79 2.12-.04 3.73.91 4.7 2.37-3.95 2.3-3.26 7.42.86 8.91-.94 2.58-2.64 4.31-4.22 5.68M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.38-1.95 4.41-3.74 4.25" /></svg>
);

// --- UTILIDADES ---
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// --- COMPONENTES PRINCIPALES ---
function ImageWithFallback({ src, alt, className, style, onClick }) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    const initials = alt ? alt.substring(0, 2).toUpperCase() : 'P';
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-gray-800 to-black border border-white/10 ${className}`} 
        style={style}
        onClick={onClick}
      >
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
        <span className="text-white/40 font-black text-2xl tracking-widest relative z-10 drop-shadow-md">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={style}
      onClick={onClick}
      onError={() => setHasError(true)}
      onLoad={() => setIsLoaded(true)}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white/5 border border-white/5 animate-pulse group">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full w-[20%] bg-white/5 skew-x-12 translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
      </div>
    </div>
  );
}

function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const res = await axios.post(API_URL + endpoint, { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin(false, res.data.user);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-outfit">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1574267432553-4b4628081524?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Login Background" className="w-full h-full object-cover animate-ken-burns opacity-40" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80"></div>
      </div>
      <div className="film-grain"></div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(229,9,20,0.5)] mb-2">PANI<span className="text-red-600">CULAS</span></h1>
          <p className="text-gray-400 font-light tracking-widest text-sm uppercase">El Futuro del Streaming</p>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-[30px] shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-600/20 rounded-full blur-[50px] pointer-events-none"></div>
          <h2 className="text-2xl font-bold text-white mb-6">{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
              <input type="email" placeholder="Correo electrónico" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all font-inter interactive" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
              <input type="password" placeholder="Contraseña" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all font-inter interactive" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold tracking-widest uppercase text-center shadow-[0_0_20px_rgba(229,9,20,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer mt-4">
              {isRegistering ? 'Registrarse' : 'Acceder'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function InitialLoader({ onComplete, msgPrefix }) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let currentP = 0;
    const timer = setInterval(() => {
      currentP += Math.floor(Math.random() * 10) + 2;
      if (currentP >= 100) { currentP = 100; clearInterval(timer); setIsFading(true); setTimeout(onComplete, 1200); }
      setProgress(currentP);
    }, 80);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100000] bg-black flex flex-col items-center justify-center transition-all duration-[1200ms] ease-in-out ${isFading ? 'opacity-0 scale-[1.5] pointer-events-none filter blur-xl' : 'opacity-100 scale-100'}`}>
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        <svg className="absolute inset-0 w-full h-full animate-[spin-slow_8s_linear_infinite]" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="rgba(229,9,20,0.3)" strokeWidth="1" strokeDasharray="10 5" /></svg>
        <svg className="absolute inset-0 w-full h-full animate-[spin-reverse_12s_linear_infinite]" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="20 10 5 10 30 5" /></svg>
        <div className="font-outfit text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] flex items-baseline">{progress}<span className="text-2xl text-red-600 ml-1">%</span></div>
      </div>
      <h1 className="font-outfit text-4xl font-black tracking-[0.3em] text-white glitch-text mb-6" data-text="PANICULAS">PANI<span className="text-red-600">CULAS</span></h1>
      <div className="h-1 w-64 bg-white/10 rounded-full overflow-hidden mb-4"><div className="h-full bg-red-600 shadow-[0_0_10px_#E50914]" style={{ width: `${progress}%`, transition: 'width 0.1s ease-out' }}></div></div>
      <p className="text-gray-400 font-mono text-xs animate-pulse tracking-widest uppercase">{msgPrefix}... {progress}%</p>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ name: '', isGuest: true, avatarSeed: 'Nolan', avatarStyle: 'avataaars', xp: 0, level: 1, preferences: { atmos: true, ambilight: true } });
  const [myListIds, setMyListIds] = useState([]);
  
  const [isAppReady, setIsAppReady] = useState(false);
  const [globalMovies, setGlobalMovies] = useState([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [joinPartyId, setJoinPartyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [ambientColor, setAmbientColor] = useState('transparent');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState('INICIO');
  const [selectedMood, setSelectedMood] = useState('Cualquiera');
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, serverLoad: 12, uptime: '99.9%', usersList: [] });
  const [appMetadata, setAppMetadata] = useState({ genres: ["Acción", "Ciencia Ficción", "Fantasía", "Terror", "Drama", "Comedia", "Romance", "Documental", "Animación", "Aventura"], categories: ["Aclamadas", "Trending", "Estrenos", "Clásicos", "Infantil", "Independiente"] });

  
  // 1. INIT AUTH & SOCKET
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(API_URL + '/user/me', { headers: { Authorization: `Bearer ${token}` }});
          setUser(res.data);
          setIsLoggedIn(true);
        } catch(e) {
          localStorage.removeItem('token');
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    checkToken();

    socket.on('user_updated', (u) => {
      const t = localStorage.getItem('token');
      if (t && user && u.id === user.id) setUser(u);
    });
    
    return () => {
      socket.off('user_updated');
    };
  }, []);

  // 2. FETCH USER DATA, LISTS & METADATA
  useEffect(() => {
    if (!user) return;
    setUserData(user);
    
    const fetchLists = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(API_URL + '/lists/me', { headers: { Authorization: `Bearer ${token}` }});
        setMyListIds(res.data);
      } catch(e) {}
    };
    fetchLists();

    const fetchMeta = async () => {
      try {
        const res = await axios.get(API_URL + '/metadata');
        setAppMetadata(res.data);
      } catch(e) {}
    };
    fetchMeta();
  }, [user]);

  // 3. MOVIES
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(API_URL + '/movies');
        setGlobalMovies(res.data);
        setIsLoadingMovies(false);
      } catch(e) {
        setIsLoadingMovies(false);
      }
    };
    fetchMovies();

    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(API_URL + '/stats', { headers: { Authorization: `Bearer ${token}` }});
        setAdminStats(prev => ({ 
          ...prev, 
          totalUsers: res.data.totalUsers,
          usersList: res.data.usersList,
          serverLoad: Math.min(100, Math.floor(res.data.totalUsers * 2 + 5))
        }));
      } catch(e) {}
    };
    if (user && user.role === 'admin') fetchStats();

    socket.on('movies_updated', fetchMovies);
    return () => socket.off('movies_updated', fetchMovies);
  }, [user]);

  const handleLogin = (isGuest, data) => {
    playUIClick();
    setUser(data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    playUIClick();
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false); setIsAppReady(false); setShowProfile(false); setShowAdmin(false); setSelectedMovie(null); setActiveTab('INICIO');
  };

  const toggleMyList = async (id) => {
    if (!user) return;
    playUIClick();
    const newList = myListIds.includes(id) ? myListIds.filter(item => item !== id) : [...myListIds, id];
    setMyListIds(newList);
    const token = localStorage.getItem('token');
    try {
      await axios.post(API_URL + '/lists/me', { ids: newList }, { headers: { Authorization: `Bearer ${token}` }});
    } catch(e) {}
  };

  const updatePreferences = async (newPrefs) => {
    if (!user) return;
    playUIClick();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(API_URL + '/user/me', { preferences: newPrefs }, { headers: { Authorization: `Bearer ${token}` }});
      setUserData(res.data);
    } catch(e) {}
  };
useEffect(() => {
    if (!isLoggedIn || showAdmin || selectedMovie) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoggedIn, showAdmin, selectedMovie]);

  const filteredMovies = useMemo(() => {
    let result = globalMovies;
    if (activeTab === 'SERIES') result = result.filter(m => m.type === 'series');
    if (activeTab === 'PELÍCULAS') result = result.filter(m => m.type === 'movie');
    if (activeTab === 'NOVEDADES') result = result.filter(m => m.year >= 2025);
    if (selectedMood !== 'Cualquiera') result = result.filter(m => m.mood === selectedMood);
    if (searchQuery) result = result.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.genre.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [searchQuery, activeTab, selectedMood, globalMovies]);

  const moviesByGenre = useMemo(() => {
    const genres = {};
    filteredMovies.forEach(movie => { if (!genres[movie.genre]) genres[movie.genre] = []; genres[movie.genre].push(movie); });
    return genres;
  }, [filteredMovies]);

  const featuredMovie = filteredMovies.length > 0 ? filteredMovies[0] : (globalMovies[0] || null);

  const handleTabChange = (tab) => {
    setActiveTab(tab); setSearchQuery(''); setSelectedMood('Cualquiera'); setSelectedMovie(null); setJoinPartyId(null); setShowProfile(false); setShowAdmin(false); setIsMobileMenuOpen(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinParty = () => {
    const id = window.prompt('Introduce el ID de la Watch Party (ej. X7B9K2):');
    if (!id) return;
    socket.emit('join_party', { partyId: id.toUpperCase(), isHost: false });
    socket.once('party_error', (err) => alert(err));
    socket.once('party_state', (data) => {
        const movie = globalMovies.find(m => m.id === data.movieId);
        if (movie) {
           setJoinPartyId(id.toUpperCase());
           setSelectedMovie(movie);
        } else {
           alert('La película de esta Watch Party no se encontró en tu catálogo.');
        }
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;600;800;900&family=Inter:wght@300;400;500;600&display=swap');
        :root { --bg-base: #000000; }
        body { background-color: var(--bg-base); color: #ffffff; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        @media (pointer: fine) { body, a, button, input, select { cursor: none !important; } }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        @keyframes ambientPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translate3d(0, 40px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        @keyframes clipReveal { from { opacity: 0; clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%); transform: translate3d(0, 80px, 0); } to { opacity: 1; clip-path: polygon(0 0%, 100% 0%, 100% 100%, 0 100%); transform: translate3d(0, 0, 0); } }
        @keyframes sound { 0% { opacity: 0.35; height: 3px; } 100% { opacity: 1; height: 16px; } }
        @keyframes kenBurns { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.15) translate(-1%, -1%); } }
        .glitch-text { position: relative; display: inline-block; }
        .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; clip-path: inset(0 0 0 0); opacity: 0; }
        .glitch-text::before { left: 3px; text-shadow: -2px 0 red; animation: glitch-anim 2s infinite linear alternate-reverse; }
        .glitch-text::after { left: -3px; text-shadow: -2px 0 cyan; animation: glitch-anim 3s infinite linear alternate-reverse; }
        @keyframes glitch-anim { 0%, 10% { clip-path: inset(10% 0 80% 0); opacity: 1; transform: translate(-2px, 1px); } 15%, 25% { clip-path: inset(80% 0 5% 0); opacity: 1; transform: translate(2px, -1px); } 30%, 40% { clip-path: inset(40% 0 40% 0); opacity: 1; transform: translate(-2px, 2px); } 45%, 100% { clip-path: inset(0 0 0 0); opacity: 0; transform: translate(0); } }
        .film-grain { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9998; opacity: 0.05; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); }
        .glass-nav { background: rgba(10, 10, 10, 0.4); backdrop-filter: saturate(200%) blur(30px); border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
        .glass-card { background: linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.005) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.04); box-shadow: inset 0 0 20px rgba(255,255,255,0.01), 0 20px 40px rgba(0,0,0,0.5); }
        .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .title-gradient { background: linear-gradient(to bottom right, #ffffff 0%, #6b7280 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .animate-fade-up { animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .clip-reveal { animation: clipReveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .audio-bar { animation: sound 0ms -800ms linear infinite alternate; }
        .progress-ring__circle { transition: stroke-dashoffset 0.3s ease-out; transform: rotate(-90deg); transform-origin: 50% 50%; }
        .delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; }
        .bar-chart-container { display: flex; align-items: flex-end; justify-content: space-between; height: 80px; gap: 4px; }
        .bar-col { width: 100%; background: linear-gradient(to top, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.8)); border-radius: 4px 4px 0 0; transition: height 1s ease-out; }
        .terminal-text { font-family: monospace; color: #4ade80; text-shadow: 0 0 5px rgba(74, 222, 128, 0.5); }
        input[type=range].custom-slider { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range].custom-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #ffffff; cursor: pointer; box-shadow: 0 0 10px rgba(255,255,255,0.8); }
        input[type=range].custom-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.2); border-radius: 2px; }
      `}} />

      <CustomCursor />

      {!isLoggedIn ? (
        <LoginView onLogin={handleLogin} />
      ) : (
        <>
          {!isAppReady && <InitialLoader onComplete={() => setIsAppReady(true)} msgPrefix={userData.isGuest ? "Iniciando modo invitado" : "Sincronizando nodos"} />}
          <div className="film-grain"></div>
          
          <div className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-[1500ms] ease-in-out" style={{ background: userData.preferences?.ambilight && !showAdmin && !selectedMovie ? `radial-gradient(circle at 50% 30%, ${ambientColor}, #000000 70%)` : 'transparent' }}></div>

          <div className={`min-h-screen relative transition-opacity duration-1000 delay-300 ${isAppReady ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
            
            {!showAdmin && !selectedMovie && (
              <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ease-out ${isScrolled ? 'glass-nav py-4' : 'bg-transparent py-8'} ${isAppReady ? 'animate-fade-up' : 'opacity-0'}`}>
                <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-12 lg:space-x-16">
                      <InteractiveElement className="flex-shrink-0 group cursor-pointer" onClick={() => handleTabChange('INICIO')}>
                        <h1 className="font-outfit text-2xl md:text-3xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                          PANI<span className="text-red-600 group-hover:text-red-500 transition-colors">CULAS</span>
                        </h1>
                      </InteractiveElement>
                      <div className="hidden md:flex space-x-6 lg:space-x-10">
                        {MENU_TABS.map((item) => (
                          <InteractiveElement key={item} onClick={() => handleTabChange(item)} className={`text-xs font-bold tracking-widest transition-all relative group cursor-pointer ${activeTab === item ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-400 hover:text-white'}`}>
                            {item}<span className={`absolute -bottom-2 left-0 h-[2px] bg-red-600 transition-all duration-300 ${activeTab === item ? 'w-full shadow-[0_0_8px_#E50914]' : 'w-0 group-hover:w-full'}`}></span>
                          </InteractiveElement>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
                      <button onClick={handleJoinParty} className="hidden md:flex items-center text-xs font-bold tracking-widest uppercase bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors border border-white/20">
                        <Users className="w-4 h-4 mr-2" /> Unirse
                      </button>
                      <div className="relative hidden sm:flex items-center group interactive">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-white transition-colors absolute left-3 z-10" />
                        <input type="text" placeholder="Búsqueda..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-10 group-focus-within:w-64 interactive pl-10 pr-4 py-2 bg-transparent focus:bg-white/5 border-b border-transparent focus:border-red-600 text-white placeholder-transparent focus:placeholder-gray-500 focus:outline-none transition-all duration-500 font-outfit text-sm" />
                      </div>
                      <InteractiveElement className="text-gray-400 hover:text-white cursor-pointer"><Bell className="h-5 w-5" /></InteractiveElement>
                      <InteractiveElement className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 p-[2px] hover:border-white/30 transition-colors cursor-pointer" onClick={() => { setShowProfile(true); setSelectedMovie(null); }}>
                        <img src={userData.customAvatarUrl || `https://api.dicebear.com/7.x/${userData.avatarStyle || 'avataaars'}/svg?seed=${userData.avatarSeed}&backgroundColor=transparent`} alt="User" className="w-full h-full rounded-full object-cover" />
                      </InteractiveElement>
                      <InteractiveElement onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white ml-2 cursor-pointer"><Menu className="h-6 w-6" /></InteractiveElement>
                    </div>
                  </div>
                </div>
              </nav>
            )}

            {!showAdmin && !selectedMovie && (
              <div className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl transform transition-transform duration-500 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-end p-6 sm:p-10"><InteractiveElement onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="h-8 w-8" /></InteractiveElement></div>
                <div className="flex flex-col h-full items-center pt-10 space-y-8 font-outfit text-3xl font-black tracking-[0.2em]">
                  <div className="relative w-full max-w-xs mb-4 px-4"><Search className="h-5 w-5 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setIsMobileMenuOpen(false);}} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-red-600 focus:outline-none interactive" /></div>
                  {MENU_TABS.map((item) => <InteractiveElement key={item} onClick={() => handleTabChange(item)} className={`transition-colors relative cursor-pointer ${activeTab === item && !showProfile ? 'text-red-500' : 'text-white'}`}>{item}</InteractiveElement>)}
                  <InteractiveElement onClick={() => { setShowProfile(true); setSelectedMovie(null); setIsMobileMenuOpen(false); }} className="text-gray-400 hover:text-white mt-8 flex items-center space-x-2 transition-colors cursor-pointer"><User className="w-6 h-6" /> <span>PERFIL</span></InteractiveElement>
                </div>
              </div>
            )}

            {showAdmin ? (
              <AdminView onClose={() => setShowAdmin(false)} movies={globalMovies} adminStats={adminStats} appId={appId} userData={userData} appMetadata={appMetadata} />
            ) : showProfile ? (
              <ProfileView 
                onClose={() => setShowProfile(false)} 
                movies={globalMovies.filter(m => myListIds.includes(m.id))} 
                user={user} userData={userData} setUserData={setUserData}
                myListIds={myListIds} toggleMyList={toggleMyList}
                onPlayMovie={setSelectedMovie} 
                onOpenAdmin={() => { setShowProfile(false); setShowAdmin(true); }}
                updatePreferences={updatePreferences}
                onLogout={handleLogout}
                isAdmin={userData.role === 'admin' || user?.email === ADMIN_EMAIL}
                adminStats={adminStats}
              />
            ) : selectedMovie ? (
              <PlayerView 
                movie={{
                  ...selectedMovie,
                  sources: localLinks.movies[selectedMovie.id] || selectedMovie.sources || []
                }} 
                user={user} userData={userData} joinPartyId={joinPartyId}
                onClose={() => { setSelectedMovie(null); setJoinPartyId(null); }}
                isInList={myListIds.includes(selectedMovie.id)} onToggleList={() => toggleMyList(selectedMovie.id)}
                preferences={userData.preferences}
                appId={appId}
              />
            ) : (
              <main className="pb-32">
                {!searchQuery && featuredMovie && (
                  <div className="relative min-h-[100svh] w-full flex items-center justify-start overflow-hidden pt-24 pb-12" onMouseEnter={() => setAmbientColor(featuredMovie.themeColor)} onMouseLeave={() => setAmbientColor('transparent')}>
                    <div className="absolute inset-0 z-0">
                      <ImageWithFallback key={featuredMovie.id} src={featuredMovie.image} alt={featuredMovie.title} className="w-full h-full object-cover scale-110 opacity-30 blur-md animate-fade-up" style={{ transformOrigin: 'center center', animation: 'ambientPulse 20s ease-in-out infinite' }} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-full md:w-[70%] z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent h-full z-10"></div>
                    </div>
                    <div className="relative z-20 px-6 sm:px-10 lg:px-16 max-w-[1600px] mx-auto w-full mt-12 flex items-center justify-between">
                      <div className="max-w-4xl flex-1" key={`info-${featuredMovie.id}`}>
                        <div className={`${isAppReady ? 'animate-fade-up' : 'opacity-0'} flex items-center space-x-4 mb-8`}>
                          <div className="h-10 w-10 bg-red-600 rounded flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">P</div>
                          <span className="text-gray-300 font-bold tracking-[0.3em] text-sm md:text-xs uppercase">{activeTab === 'SERIES' ? 'Serie Original' : 'Vision Original'}</span>
                          <div className="hidden sm:flex items-center ml-auto bg-black/40 border border-white/10 rounded-full px-4 py-2">
                             <BrainCircuit className="w-4 h-4 text-purple-400 mr-2" />
                             <span className="text-xs text-gray-400 mr-3">Estado Neuronal:</span>
                             <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="bg-transparent text-white text-xs font-bold focus:outline-none interactive cursor-pointer">
                                {MOODS.map(m => <option key={m} className="bg-black">{m}</option>)}
                             </select>
                          </div>
                        </div>
                        <h2 className={`${isAppReady ? 'clip-reveal' : 'opacity-0'} font-outfit title-gradient text-5xl sm:text-6xl md:text-7xl xl:text-[6rem] font-black leading-[1.1] tracking-tighter mb-6 uppercase drop-shadow-2xl line-clamp-3`}>{featuredMovie.title}</h2>
                        <div className={`${isAppReady ? 'animate-fade-up delay-100' : 'opacity-0'} flex flex-wrap items-center gap-4 text-sm font-bold text-white/80 mb-8 tracking-wider`}>
                          <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded border border-green-400/20">98% MATCH</span>
                          <span>{featuredMovie.year}</span>
                          <span className="border border-white/20 px-2 py-1 rounded text-xs">Dolby Vision</span>
                          <span>{featuredMovie.duration}</span>
                          {selectedMood !== 'Cualquiera' && <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-xs border border-purple-500/30">Neuronal: {selectedMood}</span>}
                        </div>
                        <p className={`${isAppReady ? 'animate-fade-up delay-200' : 'opacity-0'} text-gray-400 text-base sm:text-lg md:text-xl mb-10 max-w-2xl leading-relaxed font-light line-clamp-4`}>{featuredMovie.description}</p>
                        
                        <div className={`flex flex-wrap items-center gap-6 relative z-20 ${isAppReady ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
                          <InteractiveElement onClick={() => setSelectedMovie(featuredMovie)} className="flex items-center justify-center bg-white text-black px-10 py-5 rounded-full font-black text-lg hover:bg-gray-200 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 cursor-pointer">
                            <Play className="h-6 w-6 mr-3 fill-current" /> REPRODUCIR
                          </InteractiveElement>
                          <InteractiveElement className="flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer">
                            MÁS INFO
                          </InteractiveElement>
                        </div>
                      </div>
                      <div className="hidden lg:block w-[300px] xl:w-[400px] shrink-0 ml-12 animate-fade-up delay-300 relative group z-20">
                         <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                         <ImageWithFallback src={featuredMovie.image} alt={featuredMovie.title} className="relative w-full h-auto object-cover rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={`relative z-30 max-w-[1600px] mx-auto ${searchQuery ? 'pt-40 px-6 sm:px-10' : 'px-6 sm:px-10 lg:px-16 -mt-12 md:-mt-20'}`}>
                  {searchQuery ? (
                    <div className="space-y-8 animate-fade-up">
                      <h3 className="font-outfit text-3xl font-light text-gray-400 tracking-wide">Resultados: <span className="text-white font-bold">{searchQuery}</span></h3>
                      {filteredMovies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-12 gap-x-6">
                          {filteredMovies.map(movie => <TiltCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} onHover={setAmbientColor} isInList={myListIds.includes(movie.id)} onToggleList={() => toggleMyList(movie.id)} />)}
                        </div>
                      ) : (
                        <div className="text-center py-40 glass-card rounded-3xl mt-8">
                          <Search className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                          <p className="text-gray-400 text-2xl font-outfit font-light">El vacío espacial. No hay resultados.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-20 md:space-y-28">
                      {isLoadingMovies ? (
                        <>
                          <div className="mb-8 mt-12 animate-fade-up">
                            <div className="h-8 bg-white/5 w-64 rounded-xl animate-pulse mb-8 border border-white/5"></div>
                            <div className="flex gap-6 overflow-hidden pb-10">
                              {[...Array(6)].map((_, i) => <div key={i} className="w-[60vw] sm:w-[35vw] md:w-[25vw] lg:w-[18vw] flex-shrink-0"><SkeletonCard /></div>)}
                            </div>
                          </div>
                          <div className="mb-8 animate-fade-up delay-100">
                            <div className="h-8 bg-white/5 w-48 rounded-xl animate-pulse mb-8 border border-white/5"></div>
                            <div className="flex gap-6 overflow-hidden pb-10">
                              {[...Array(6)].map((_, i) => <div key={i} className="w-[60vw] sm:w-[35vw] md:w-[25vw] lg:w-[18vw] flex-shrink-0"><SkeletonCard /></div>)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {activeTab === 'INICIO' && selectedMood === 'Cualquiera' && <MovieRow title="Aclamadas por la Crítica" movies={filteredMovies} onSelect={setSelectedMovie} onHover={setAmbientColor} isLarge showNumbers myListIds={myListIds} onToggleList={toggleMyList} />}
                          {activeTab !== 'INICIO' && <MovieRow title={`Explorar ${activeTab}`} movies={filteredMovies} onSelect={setSelectedMovie} onHover={setAmbientColor} isLarge myListIds={myListIds} onToggleList={toggleMyList} />}
                          
                          {selectedMood !== 'Cualquiera' && <MovieRow title={`Selección Neuronal: ${selectedMood}`} movies={filteredMovies} onSelect={setSelectedMovie} onHover={setAmbientColor} isLarge showNumbers myListIds={myListIds} onToggleList={toggleMyList} />}
                          
                          {activeTab === 'INICIO' && selectedMood === 'Cualquiera' && <MovieRow title="Top Tendencias Globales" movies={filteredMovies.slice().reverse()} onSelect={setSelectedMovie} onHover={setAmbientColor} myListIds={myListIds} onToggleList={toggleMyList} />}
                          
                          {Object.entries(moviesByGenre).map(([genre, movies]) => (
                            <MovieRow key={`${activeTab}-${genre}`} title={`${activeTab === 'INICIO' ? 'Descubre:' : 'Más en'} ${genre}`} movies={movies} onSelect={setSelectedMovie} onHover={setAmbientColor} myListIds={myListIds} onToggleList={toggleMyList} />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </main>
            )}
          </div>
        </>
      )}
    </>
  );
}

function CustomVideoPlayer({ sources, title, isWatchParty, partyId, isHost, db, appId, user, userData, onClose }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  
  const currentSource = sources[currentSourceIndex] || sources[0] || { url: '', label: 'Default' };
  
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: '¡Bienvenido a la Watch Party! 🍿', isBot: true },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  let controlsTimeout = useRef(null);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault(); togglePlay(); break;
        case 'f':
          e.preventDefault(); toggleFullscreen(); break;
        case 'm':
          e.preventDefault(); toggleMute(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      setProgress((t / videoRef.current.duration) * 100);
      
      if (isWatchParty && isHost && Math.floor(t) % 2 === 0) {
        socket.emit('update_state', { partyId, state: { time: t } });
      }
    }
  };
  const handleLoadedMetadata = () => { 
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
          videoRef.current.volume = volume;
          videoRef.current.muted = isMuted;
      }
  };

  const togglePlay = () => {
    if (isWatchParty && !isHost) return;
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
      setIsPlaying(!isPlaying);
      
      if (isWatchParty && isHost) {
        socket.emit('update_state', { partyId, state: { isPlaying: !isPlaying } });
      }
    }
  };
  const handleSeek = (e) => {
    if (isWatchParty && !isHost) return;
    const seekTime = (e.target.value / 100) * duration;
    if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
        if (isWatchParty && isHost) socket.emit('update_state', { partyId, state: { time: seekTime } });
    }
    setProgress(e.target.value);
  };
  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0; }
    setIsMuted(val === 0);
  };
  const toggleMute = () => {
    if (videoRef.current) {
       videoRef.current.muted = !isMuted;
       if (isMuted && volume === 0) { setVolume(0.5); videoRef.current.volume = 0.5; }
    }
    setIsMuted(!isMuted);
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  const skipIntro = () => { 
      if (isWatchParty && !isHost) return;
      if (videoRef.current) {
          videoRef.current.currentTime += 85; 
          if (isWatchParty && isHost) socket.emit('update_state', { partyId, state: { time: videoRef.current.currentTime } });
      }
  };

  useEffect(() => {
    if (!isWatchParty || !partyId) return;
    const handleState = (data) => {
        if (data.messages) setMessages(data.messages);
        if (!isHost && videoRef.current) {
          if (data.isPlaying && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else if (!data.isPlaying && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          if (data.time !== undefined && Math.abs(videoRef.current.currentTime - data.time) > 3) {
            videoRef.current.currentTime = data.time;
          }
        }
    };
    socket.on('party_state', handleState);
    if (!isHost) {
      socket.emit('join_party', { partyId, isHost });
    }
    return () => socket.off('party_state', handleState);
  }, [isWatchParty, partyId, isHost]);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !partyId) return;
    const text = chatInput;
    setChatInput('');
    socket.emit('send_message', { partyId, message: { id: Date.now(), user: userData?.name || 'Invitado', text: text, isBot: false } });
  };

  const isExternalEmbed = currentSource.url.includes('http') && !currentSource.url.match(/\.(mp4|webm|ogg|m4v)$/i);
  
  return (
    <div ref={containerRef} className={`fixed inset-0 z-[500] bg-black flex font-inter ${!showControls ? 'cursor-none' : ''}`}>
      
      <div className={`relative flex-1 bg-black flex items-center justify-center transition-all ${isWatchParty ? 'lg:pr-80' : ''}`}>
        {isExternalEmbed ? (
          <iframe 
            src={currentSource.url}
            className="w-full h-full border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            allowFullScreen
            // Sandbox bloquea popups pero permite scripts y ejecución del vídeo
            sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : (
          <video 
            ref={videoRef} autoPlay onClick={isWatchParty && !isHost ? undefined : togglePlay}
            onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            src={currentSource.url}
            className="w-full h-full object-contain"
          />
        )}

        {currentTime > 5 && currentTime < 80 && showControls && (
           <button onClick={skipIntro} className="absolute bottom-32 right-10 md:right-16 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md px-6 py-3 rounded-lg font-bold tracking-widest text-xs uppercase transition-all flex items-center shadow-2xl video-control">
             Saltar Intro <SkipForward className="w-4 h-4 ml-2" />
           </button>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none transition-opacity duration-500 flex flex-col justify-between ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-8 flex justify-between items-center pointer-events-auto">
            <button onClick={onClose} className="flex items-center text-white hover:text-red-500 transition-colors video-control">
               <ChevronLeft className="w-8 h-8 mr-2" /> <span className="font-outfit font-bold tracking-widest uppercase text-sm">Volver</span>
            </button>
            <h3 className="text-white font-outfit font-black tracking-[0.2em] uppercase text-lg hidden md:block drop-shadow-md">{title}</h3>
            <div className="w-8"></div>
          </div>

          <div className="p-8 md:px-12 pointer-events-auto">
             {!isExternalEmbed && (
               <div className="flex items-center gap-4 mb-6 group">
                  <span className="text-white/80 font-mono text-xs">{formatTime(currentTime)}</span>
                  <input 
                    type="range" min="0" max="100" value={progress || 0} onChange={handleSeek}
                    className={`custom-slider video-control ${isWatchParty && !isHost ? 'pointer-events-none' : ''}`}
                    style={{ background: `linear-gradient(to right, #E50914 ${progress}%, rgba(255,255,255,0.2) ${progress}%)` }}
                  />
                  <span className="text-white/80 font-mono text-xs">{formatTime(duration)}</span>
               </div>
             )}
 
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-6 md:gap-8">
                    {!isExternalEmbed && (
                      <>
                        <button onClick={togglePlay} className={`text-white hover:text-red-500 transition-colors video-control ${isWatchParty && !isHost ? 'opacity-50 cursor-not-allowed' : ''}`}>
                           {isPlaying ? <span className="font-black text-2xl font-outfit">II</span> : <Play className="w-8 h-8 fill-current" />}
                        </button>
                        
                        <div className="flex items-center gap-3 group/vol">
                           <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors video-control">
                              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                           </button>
                           <input 
                             type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolume}
                             className="w-0 opacity-0 group-hover/vol:w-20 group-hover/vol:opacity-100 transition-all duration-300 custom-slider video-control"
                             style={{ background: `linear-gradient(to right, #ffffff ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%)` }}
                           />
                        </div>
                      </>
                    )}
 
                    <h3 className="text-white font-outfit font-black tracking-widest uppercase text-sm md:hidden">{title}</h3>
                 </div>
 
                 <div className="flex items-center gap-6">
                    {sources && sources.length > 1 && (
                      <div className="relative">
                         <button onClick={() => setShowSourceSelector(!showSourceSelector)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all text-[10px] font-bold tracking-widest uppercase text-white video-control">
                            <Settings className="w-3 h-3" /> Servidor: {currentSource.label}
                         </button>
                         {showSourceSelector && (
                           <div className="absolute bottom-full left-0 mb-2 w-48 glass-card border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-up">
                              {sources.map((src, idx) => (
                                <button key={idx} onClick={() => { setCurrentSourceIndex(idx); setShowSourceSelector(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${currentSourceIndex === idx ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                                   {src.label}
                                </button>
                              ))}
                           </div>
                         )}
                      </div>
                    )}
 
                    {isWatchParty && (
                      <div className="flex items-center px-4 py-2 bg-red-600/20 border border-red-500/50 rounded-full text-red-400">
                         <Radio className="w-4 h-4 mr-2 animate-pulse" /> <span className="text-[10px] font-bold tracking-widest uppercase">Party: {partyId}</span>
                      </div>
                    )}
                    
                    {!isExternalEmbed && (
                      <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors video-control">
                         {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                      </button>
                    )}
                 </div>
              </div>
          </div>
        </div>
      </div>

      {isWatchParty && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col z-[600]">
           <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-3">
             <div className="flex items-center">
               <MessageSquare className="w-5 h-5 text-blue-400 mr-3" />
               <h3 className="text-white font-outfit font-black tracking-widest uppercase text-sm">Chat en Vivo</h3>
             </div>
             <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => {
                 if (navigator.clipboard && navigator.clipboard.writeText) {
                     navigator.clipboard.writeText(partyId);
                     alert('Código copiado al portapapeles: ' + partyId);
                 } else {
                     prompt('Copia manualmente el código:', partyId);
                 }
             }}>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest block mb-1">CÓDIGO DE LA SALA (CLIC PARA COPIAR)</span>
                <span className="text-blue-400 font-mono text-xl font-black tracking-[0.2em]">{partyId}</span>
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.user === userData?.name ? 'items-end' : 'items-start'}`}>
                   <span className="text-[10px] text-gray-500 font-bold mb-1">{msg.user}</span>
                   <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.isBot ? 'bg-red-600/20 text-red-100 border border-red-500/20' : (msg.user === userData?.name ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none')}`}>
                      {msg.text}
                   </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>

           <form onSubmit={sendChatMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
              <input 
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} 
                placeholder="Comenta algo..." 
                className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 video-control"
              />
              <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors video-control"><Send className="w-4 h-4" /></button>
           </form>
        </div>
      )}
    </div>
  );
}

function PlayerView({ movie, onClose, isInList, onToggleList, preferences, user, userData, db, appId, joinPartyId }) {
  const [bufferState, setBufferState] = useState('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [isWatchParty, setIsWatchParty] = useState(!!joinPartyId);
  const [partyId, setPartyId] = useState(joinPartyId || '');
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState(0);

  useEffect(() => {
    if (joinPartyId) {
      handlePlayClick();
    }
  }, [joinPartyId]);

  const handlePlayClick = () => {
    setBufferState('buffering');
    let currentP = 0;
    const interval = setInterval(() => {
      currentP += Math.floor(Math.random() * 15) + 5; 
      if (currentP >= 100) { currentP = 100; clearInterval(interval); setTimeout(() => setBufferState('playing'), 800); }
      setLoadProgress(currentP);
    }, 200);
  };

  const createWatchParty = () => {
    if (!user) return;
    playUIClick();
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPartyId(newId);
    setIsWatchParty(true);
    socket.emit('join_party', { partyId: newId, isHost: true });
    socket.emit('update_state', { partyId: newId, state: { movieId: movie.id } });
    handlePlayClick();
  };

  if (bufferState === 'playing') {
     const playerSources = movie.type === 'series' && movie.episodes?.length > 0
        ? [{ label: 'Servidor Personal', url: movie.episodes[selectedEpisodeIdx].url }]
        : (movie.sources || []);
     const playerTitle = movie.type === 'series' && movie.episodes?.length > 0
        ? `${movie.title} - S${movie.episodes[selectedEpisodeIdx].season}E${movie.episodes[selectedEpisodeIdx].episode}: ${movie.episodes[selectedEpisodeIdx].title}`
        : movie.title;
        
     return <CustomVideoPlayer sources={playerSources} title={playerTitle} isWatchParty={isWatchParty} partyId={partyId} isHost={!joinPartyId} appId={appId} user={user} userData={userData} onClose={onClose} />;
  }

  const radius = 60; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (loadProgress / 100) * circumference;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-outfit animate-fade-up z-[200]">
      {preferences?.ambilight && <div className="absolute top-0 left-0 w-full h-[50vh] opacity-30 pointer-events-none transition-colors duration-1000" style={{ background: `radial-gradient(ellipse at top, ${movie.themeColor || 'rgba(255,0,0,0.2)'}, transparent 70%)` }}></div>}

      <div className="fixed top-8 left-8 z-50 flex gap-4">
        <InteractiveElement onClick={onClose} className="flex items-center glass-card px-6 py-3 rounded-full text-white hover:bg-white/10 transition-all duration-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] cursor-pointer">
          <ChevronLeft className="h-5 w-5 mr-2" /> <span className="font-bold text-xs tracking-widest uppercase">Volver</span>
        </InteractiveElement>
      </div>

      <div className="relative w-full h-[75vh] md:h-[90vh] bg-[#050505] flex items-center justify-center overflow-hidden border-b border-white/5">
        <ImageWithFallback src={movie.image} alt={movie.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ease-in-out transform-gpu scale-110 filter blur-md opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

        {bufferState === 'buffering' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 backdrop-blur-sm transition-opacity duration-500">
             <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full progress-ring__circle" viewBox="0 0 140 140"><circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" /><circle cx="70" cy="70" r={radius} fill="none" stroke="#E50914" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px #E50914)' }} /></svg>
                <div className="flex flex-col items-center"><span className="font-outfit font-black text-4xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{loadProgress}%</span></div>
             </div>
             <p className="text-white/80 font-mono text-sm tracking-[0.2em] uppercase text-center">Sintetizando flujo...</p>
          </div>
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-8">
              <InteractiveElement onClick={handlePlayClick} className="w-32 h-32 glass-card rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.15)] hover:scale-110 hover:bg-red-600/90 hover:border-red-500 transition-all duration-500 group cursor-pointer">
                <Play className="h-12 w-12 text-white fill-current ml-2 group-hover:drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all" />
              </InteractiveElement>
              <InteractiveElement onClick={createWatchParty} className="glass-card px-8 py-4 rounded-full flex items-center hover:bg-white/10 transition-colors cursor-pointer border border-white/20">
                 <Users className="w-5 h-5 mr-3 text-blue-400" /> <span className="text-white text-xs font-bold tracking-widest uppercase">Crear Watch Party</span>
              </InteractiveElement>
           </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-8 md:py-16 -mt-10 md:-mt-20 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="animate-fade-up delay-200 lg:col-span-8 glass-card p-10 sm:p-14 rounded-[40px] shadow-2xl">
            <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest mb-8">
              <span className="text-black bg-green-400 px-4 py-2 rounded-full">{movie.rating || '98%'} Match</span>
              <span className="text-white border border-white/20 px-4 py-2 rounded-full">{movie.year || '2026'}</span>
              {movie.duration && <span className="text-white border border-white/20 px-4 py-2 rounded-full">{movie.duration}</span>}
              {movie.genre && <span className="text-blue-400 bg-blue-400/10 border border-blue-400/20 px-4 py-2 rounded-full">{movie.genre}</span>}
              {movie.category && <span className="text-purple-400 bg-purple-400/10 border border-purple-400/20 px-4 py-2 rounded-full">{movie.category}</span>}
            </div>
            <h1 className="font-outfit text-5xl sm:text-7xl font-black text-white mb-8 tracking-tighter leading-none">{movie.title}</h1>
            
            {movie.adminRecommendation && (
              <div className="mb-8 p-6 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl flex gap-4 items-start max-w-3xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  <span className="font-black text-black text-lg">P</span>
                </div>
                <div>
                  <h4 className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Recomendación del Administrador</h4>
                  <p className="text-gray-300 italic text-sm md:text-base leading-relaxed">"{movie.adminRecommendation}"</p>
                </div>
              </div>
            )}
            
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed font-light mb-12 font-inter max-w-3xl">{movie.description}</p>
            
            {movie.type === 'series' && movie.episodes?.length > 0 && (
              <div className="mb-12">
                <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm">Episodios</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {movie.episodes.map((ep, idx) => (
                    <InteractiveElement 
                      key={idx} 
                      onClick={() => setSelectedEpisodeIdx(idx)}
                      className={`flex-shrink-0 px-6 py-4 rounded-xl border ${selectedEpisodeIdx === idx ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'} transition-all cursor-pointer`}
                    >
                      <div className="font-bold text-xs uppercase tracking-widest mb-1">T{ep.season} E{ep.episode}</div>
                      <div className="text-sm">{ep.title}</div>
                    </InteractiveElement>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-6">
               <InteractiveElement onClick={onToggleList} className={`flex items-center justify-center h-16 w-16 rounded-full border transition-all group cursor-pointer ${isInList ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white hover:text-black text-white'}`}>
                 {isInList ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
               </InteractiveElement>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ onClose, movies, user, userData, setUserData, myListIds, toggleMyList, onPlayMovie, onOpenAdmin, updatePreferences, onLogout, isAdmin, adminStats }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userData.name);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleAvatarSelect = async (avatar) => {
    if (userData.xp >= avatar.xpRequired && user) {
      const token = localStorage.getItem('token');
      const res = await axios.put(API_URL + '/user/me', { avatarSeed: avatar.seed, avatarStyle: avatar.style, customAvatarUrl: '' }, { headers: { Authorization: `Bearer ${token}` }});
      setUserData(res.data);
      setShowAvatarSelector(false);
    } else {
      // Could play a deny sound here
    }
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleNameSave = async () => {
    if (tempName.trim() && user) {
      const token = localStorage.getItem('token');
      const res = await axios.put(API_URL + '/user/me', { name: tempName }, { headers: { Authorization: `Bearer ${token}` }});
      setUserData(res.data);
      setIsEditingName(false);
    }
  };

  const handlePrefs = (key) => {
    const newPrefs = { ...userData.preferences, [key]: !userData.preferences[key] };
    setUserData({...userData, preferences: newPrefs});
    updatePreferences(newPrefs);
  };

  const xpNeeded = userData.level * 100;
  const xpPercent = (userData.xp / xpNeeded) * 100;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-outfit animate-fade-up z-[150]">
      <div className="absolute top-0 left-0 w-full h-[60vh] opacity-20 pointer-events-none transition-colors duration-1000" style={{ background: 'radial-gradient(ellipse at top, rgba(168,85,247,0.4), transparent 70%)' }}></div>

      <InteractiveElement onClick={onClose} className="fixed top-8 left-8 z-50 flex items-center glass-card px-6 py-3 rounded-full text-white hover:bg-white/10 transition-all duration-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] cursor-pointer">
        <ChevronLeft className="h-5 w-5 mr-2" /> <span className="font-bold text-xs tracking-widest uppercase">Volver</span>
      </InteractiveElement>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-32 pb-20 relative z-30">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-16 animate-fade-up delay-100">
          <div className="relative group interactive cursor-pointer" onClick={() => setShowAvatarSelector(!showAvatarSelector)}>
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-transform group-hover:scale-105">
              <img src={userData.customAvatarUrl || `https://api.dicebear.com/7.x/${userData.avatarStyle || 'avataaars'}/svg?seed=${userData.avatarSeed}&backgroundColor=transparent`} alt="Avatar" className="w-full h-full rounded-full bg-gray-900 object-cover" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1 mt-4 md:mt-8">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              {isEditingName ? (
                <div className="flex items-center bg-white/10 rounded-xl px-4 py-2 border border-white/20">
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNameSave()} className="bg-transparent text-4xl md:text-6xl font-black text-white outline-none w-full max-w-[300px]" autoFocus />
                  <InteractiveElement onClick={handleNameSave} className="ml-4 p-2 bg-green-500 rounded-full text-black hover:bg-green-400 cursor-pointer"><Check className="w-5 h-5" /></InteractiveElement>
                </div>
              ) : (
                <>
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg">{userData.name}</h1>
                  <InteractiveElement onClick={() => setIsEditingName(true)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"><Edit3 className="w-6 h-6" /></InteractiveElement>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-widest uppercase border border-white/20 shadow-lg">
                <Star className="w-3 h-3 inline mr-1 pb-0.5" /> Nivel {userData.level}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-8 animate-fade-up delay-200">
            <div className="glass-card p-8 rounded-[40px] shadow-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8 flex items-center"><Trophy className="w-4 h-4 mr-2 text-yellow-500"/> Progreso Cinéfilo</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>XP Actual</span> <span>{userData.xp} / {xpNeeded}</span></div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_#eab308]" style={{ width: `${xpPercent}%` }}></div></div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-[40px] shadow-xl space-y-2">
               {isAdmin && (
                 <InteractiveElement onClick={onOpenAdmin} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-500/10 transition-colors group border border-blue-500/20 mb-4 cursor-pointer">
                   <div className="flex items-center gap-4 text-blue-400 group-hover:text-blue-500 transition-colors"><LayoutDashboard className="w-5 h-5" /><span className="font-bold text-sm tracking-widest uppercase">Panel Admin</span></div>
                 </InteractiveElement>
               )}
               <InteractiveElement onClick={onLogout} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-500/10 transition-colors group border border-red-500/20 cursor-pointer">
                 <div className="flex items-center gap-4 text-red-400 group-hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /><span className="font-bold text-sm tracking-widest uppercase">Cerrar Sesión</span></div>
               </InteractiveElement>
            </div>
          </div>

          <div className="md:col-span-8 space-y-8 animate-fade-up delay-300">
            {showAvatarSelector && (
              <div className="glass-card p-8 md:p-12 rounded-[40px] shadow-xl border border-white/5 animate-fade-up">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl md:text-2xl font-light text-white tracking-widest">Seleccionar <span className="font-black">Avatar</span></h3>
                   <InteractiveElement onClick={() => setShowAvatarSelector(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-6 h-6"/></InteractiveElement>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {AVATARS.map(av => {
                    const isUnlocked = userData.xp >= av.xpRequired;
                    const isCurrent = userData.avatarSeed === av.seed && userData.avatarStyle === av.style;
                    return (
                      <InteractiveElement key={av.id} onClick={() => isUnlocked && handleAvatarSelect(av)} className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-white/20 border-white' : isUnlocked ? 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer' : 'bg-black/50 border-red-900/30 opacity-60 cursor-not-allowed'}`}>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/50 to-blue-600/50 p-1 mb-3">
                           <img src={`https://api.dicebear.com/7.x/${av.style}/svg?seed=${av.seed}&backgroundColor=transparent`} alt={av.name} className={`w-full h-full rounded-full bg-gray-900 object-cover ${!isUnlocked ? 'grayscale' : ''}`} />
                        </div>
                        <span className="text-sm font-bold text-white mb-1">{av.name}</span>
                        {!isUnlocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl"><div className="bg-red-900/80 px-3 py-1 rounded-full text-xs font-bold flex items-center"><Star className="w-3 h-3 mr-1"/> {av.xpRequired} XP</div></div>}
                        {isUnlocked && av.xpRequired > 0 && <span className="text-[10px] text-yellow-500 font-bold tracking-widest uppercase">{av.xpRequired} XP</span>}
                        {isUnlocked && av.xpRequired === 0 && <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">Gratis</span>}
                      </InteractiveElement>
                    )
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">O usa una foto personalizada</h4>
                  <div className="flex gap-4">
                    <input type="text" placeholder="URL de la imagen (ej: https://...)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 interactive" id="customUrlInput" defaultValue={userData.customAvatarUrl || ''} />
                    <InteractiveElement onClick={async () => {
                      const url = document.getElementById('customUrlInput').value;
                      if (url && user) {
                        const token = localStorage.getItem('token');
                        const res = await axios.put(API_URL + '/user/me', { customAvatarUrl: url }, { headers: { Authorization: `Bearer ${token}` }});
                        setUserData(res.data);
                        setShowAvatarSelector(false);
                      }
                    }} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer">
                      Guardar
                    </InteractiveElement>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card p-8 md:p-12 rounded-[40px] shadow-xl bg-gradient-to-tr from-white/5 to-transparent border border-white/5">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl md:text-3xl font-light text-white tracking-widest">Tu Bóveda de <span className="font-black">Películas</span></h3>
                 <span className="text-gray-500 text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{movies.length} Títulos</span>
              </div>
              
              {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   {movies.map(movie => (
                     <InteractiveElement key={movie.id} onClick={() => onPlayMovie(movie)} className="relative aspect-[2/3] rounded-xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer">
                        <ImageWithFallback src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
                        <button onClick={(e) => { e.stopPropagation(); toggleMyList(movie.id); playUIClick(); }} className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"><X className="w-4 h-4" /></button>
                        <div className="absolute inset-0 p-5 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                           <h4 className="text-white font-black text-sm md:text-lg leading-tight mb-3 drop-shadow-md line-clamp-2">{movie.title}</h4>
                        </div>
                     </InteractiveElement>
                   ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/10"><Film className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 font-light text-xl">Tu bóveda está vacía.</p></div>
              )}
            </div>

            <div className="glass-card p-8 md:p-12 rounded-[40px] shadow-xl border border-white/5">
              <h3 className="text-xl md:text-2xl font-light text-white tracking-widest mb-8">Preferencias <span className="font-black">Espaciales</span></h3>
              <div className="space-y-8">
                <InteractiveElement onClick={() => handlePrefs('atmos')} className="flex items-center justify-between group cursor-pointer">
                   <div>
                     <p className="text-white font-bold tracking-wider mb-1 group-hover:text-red-400 transition-colors">Audio Volumétrico (Atmos)</p>
                     <p className="text-gray-500 text-sm">Activa el motor WebAudio para UI y video.</p>
                   </div>
                   <div className={`w-14 h-7 rounded-full relative transition-all ${userData.preferences?.atmos ? 'bg-green-500 shadow-[0_0_15px_rgba(74,222,128,0.4)]' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userData.preferences?.atmos ? 'right-1' : 'left-1 bg-gray-400'}`}></div>
                   </div>
                </InteractiveElement>
                <div className="h-[1px] w-full bg-white/5"></div>
                <InteractiveElement onClick={() => handlePrefs('ambilight')} className="flex items-center justify-between group cursor-pointer">
                   <div>
                     <p className="text-white font-bold tracking-wider mb-1 group-hover:text-red-400 transition-colors">Ambilight Dinámico</p>
                     <p className="text-gray-500 text-sm">Sincroniza la iluminación del entorno con la película.</p>
                   </div>
                   <div className={`w-14 h-7 rounded-full relative transition-all ${userData.preferences?.ambilight ? 'bg-green-500 shadow-[0_0_15px_rgba(74,222,128,0.4)]' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userData.preferences?.ambilight ? 'right-1' : 'left-1 bg-gray-400'}`}></div>
                   </div>
                </InteractiveElement>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ADMIN VIEW ---
function AdminView({ onClose, movies, adminStats, db, appId, userData, appMetadata }) {
  const [adminTab, setAdminTab] = useState('dashboard');
  const [newGenre, setNewGenre] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  
  const [newMovie, setNewMovie] = useState({ title: '', type: 'movie', year: new Date().getFullYear(), description: '', adminRecommendation: '', image: '', category: 'Aclamadas', sources: [{ label: 'Servidor 1', url: '' }], genre: 'Acción' });
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const addSourceField = () => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const currentSources = target.sources || [];
    setter({ ...target, sources: [...currentSources, { label: `Servidor ${currentSources.length + 1}`, url: '' }] });
  };
  
  const removeSourceField = (idx) => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const currentSources = target.sources || [];
    setter({ ...target, sources: currentSources.filter((_, i) => i !== idx) });
  };

  const updateSourceField = (idx, field, val) => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const newSources = [...(target.sources || [])];
    if (newSources[idx]) {
        newSources[idx] = { ...newSources[idx], [field]: val };
        setter({ ...target, sources: newSources });
    }
  };

  const addEpisode = () => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const currentEpisodes = target.episodes || [];
    const lastSeason = currentEpisodes.length > 0 ? currentEpisodes[currentEpisodes.length - 1].season : 1;
    const lastEpNum = currentEpisodes.length > 0 ? parseInt(currentEpisodes[currentEpisodes.length - 1].episode) || 0 : 0;
    setter({ ...target, episodes: [...currentEpisodes, { season: lastSeason, episode: lastEpNum + 1, title: `Episodio ${lastEpNum + 1}`, url: '' }] });
  };
  const removeEpisode = (idx) => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const currentEpisodes = target.episodes || [];
    setter({ ...target, episodes: currentEpisodes.filter((_, i) => i !== idx) });
  };
  const updateEpisode = (idx, field, val) => {
    const target = editingMovie || newMovie;
    const setter = editingMovie ? setEditingMovie : setNewMovie;
    const currentEpisodes = [...(target.episodes || [])];
    if (currentEpisodes[idx]) {
        currentEpisodes[idx] = { ...currentEpisodes[idx], [field]: val };
        setter({ ...target, episodes: currentEpisodes });
    }
  };


  const filteredAdminMovies = useMemo(() => {
    let result = movies;
    if (adminTab === 'movies') result = result.filter(m => m.type !== 'series');
    if (adminTab === 'series') result = result.filter(m => m.type === 'series');
    return result.filter(m => m.title.toLowerCase().includes(adminSearch.toLowerCase()));
  }, [movies, adminSearch, adminTab]);

  const renderBarChart = () => (
    <div className="bar-chart-container">
      {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
        <div key={i} className="bar-col group relative" style={{ height: `${h}%` }}>
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{h}%</div>
        </div>
      ))}
    </div>
  );

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="fixed inset-0 z-[600] bg-[#050505] flex overflow-hidden font-inter animate-fade-in text-white">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-[700]">
        <h1 className="text-lg font-black tracking-widest text-white">PANI<span className="text-blue-500">ADMIN</span></h1>
        <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><LogOut className="w-5 h-5" /></button>
      </div>

      <aside className="hidden lg:flex w-64 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-6 z-50">
        <div className="mb-12"><h1 className="text-2xl font-black tracking-[0.2em] text-white">PANI<span className="text-blue-500">ADMIN</span></h1><p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Nivel de Acceso: Master</p></div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setAdminTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-widest text-[10px] uppercase group ${adminTab === 'dashboard' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><LayoutDashboard className={`w-5 h-5 ${adminTab === 'dashboard' ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'}`} /> Dashboard</button>
          <button onClick={() => setAdminTab('movies')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-widest text-[10px] uppercase group ${adminTab === 'movies' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><ListVideo className={`w-5 h-5 ${adminTab === 'movies' ? 'text-white' : 'text-purple-500 group-hover:scale-110 transition-transform'}`} /> Películas</button>
          <button onClick={() => setAdminTab('series')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-widest text-[10px] uppercase group ${adminTab === 'series' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><ListVideo className={`w-5 h-5 ${adminTab === 'series' ? 'text-white' : 'text-purple-500 group-hover:scale-110 transition-transform'}`} /> Series</button>
          <button onClick={() => setAdminTab('users')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-widest text-[10px] uppercase group ${adminTab === 'users' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Users className={`w-5 h-5 ${adminTab === 'users' ? 'text-white' : 'text-green-500 group-hover:scale-110 transition-transform'}`} /> Usuarios</button>
          <button onClick={() => setAdminTab('metadata')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-widest text-[10px] uppercase group ${adminTab === 'metadata' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Settings className={`w-5 h-5 ${adminTab === 'metadata' ? 'text-white' : 'text-yellow-500 group-hover:scale-110 transition-transform'}`} /> Catálogo</button>
        </nav>
        <div className="pt-6 border-t border-white/5"><button onClick={onClose} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold tracking-widest text-[10px] uppercase"><LogOut className="w-5 h-5" /> Salir del Panel</button></div>
      </aside>

      <main className="flex-1 lg:ml-0 relative min-h-screen h-screen overflow-y-auto overflow-x-hidden p-6 lg:p-12 pt-24 lg:pt-12">
        <div className="max-w-[1400px] mx-auto">
          {adminTab === 'dashboard' && (
            <div className="animate-fade-up">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Visión General</h2>
                <p className="text-gray-400 tracking-widest text-sm uppercase">Métricas en tiempo real</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group"><div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center"><Users className="w-4 h-4 mr-2 text-blue-500"/> Usuarios</h3><p className="text-4xl font-black text-white">{adminStats.totalUsers}</p><p className="text-green-400 text-xs font-bold mt-2 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> Sincronizado</p></div>
                <div className="glass-card p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden group"><div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center"><Database className="w-4 h-4 mr-2 text-purple-500"/> Catálogo</h3><p className="text-4xl font-black text-white">{movies.length}</p><p className="text-gray-500 text-xs font-bold mt-2">Títulos activos</p></div>
                <div className="glass-card p-6 rounded-3xl border border-red-500/20 relative overflow-hidden group"><div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center"><Activity className="w-4 h-4 mr-2 text-red-500"/> Carga Servidor</h3><p className="text-4xl font-black text-white">{adminStats.serverLoad}%</p><div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden"><div className="h-full bg-red-500 shadow-[0_0_8px_red]" style={{ width: `${adminStats.serverLoad}%` }}></div></div></div>
                <div className="glass-card p-6 rounded-3xl border border-green-500/20 relative overflow-hidden group"><div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center"><Zap className="w-4 h-4 mr-2 text-green-500"/> Uptime</h3><p className="text-4xl font-black text-white">{adminStats.uptime}</p><p className="text-green-400 text-xs font-bold mt-2">Sistema Estable</p></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-white/5"><div className="flex justify-between items-center mb-6"><h3 className="text-white text-lg font-bold tracking-widest uppercase flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-blue-400"/> Tráfico Red</h3><span className="bg-white/10 px-3 py-1 rounded-full text-xs text-gray-400">Hoy</span></div>{renderBarChart()}</div>
                 <div className="glass-card p-6 rounded-3xl border border-white/5 bg-black/50 relative overflow-hidden"><h3 className="text-white text-sm font-bold tracking-widest uppercase flex items-center mb-4"><Server className="w-4 h-4 mr-2 text-gray-400"/> Logs</h3><div className="space-y-2 text-[10px] terminal-text h-40 overflow-hidden"><p>[{new Date().toLocaleTimeString()}] SYS: Sistema inicializado.</p><p>[{new Date().toLocaleTimeString()}] AUTH: Conectado a Firebase.</p><p>[{new Date().toLocaleTimeString()}] DB: {movies.length} títulos sincronizados.</p><p>[{new Date().toLocaleTimeString()}] ADMIN: {userData.name} logueado.</p><p className="text-blue-400">[{new Date().toLocaleTimeString()}] DASH: Actualizando métricas...</p><p className="animate-pulse">_</p></div></div>
              </div>
            </div>
          )}

          {(adminTab === 'movies' || adminTab === 'series') && (
            <div className="animate-fade-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div><h2 className="text-4xl font-black text-white tracking-tighter mb-2">Gestión de {adminTab === 'movies' ? 'Películas' : 'Series'}</h2><p className="text-gray-400 tracking-widest text-sm uppercase">Control de contenidos</p></div>
                <div className="flex gap-4">
                  <button onClick={() => {
                    setNewMovie({ title: '', type: adminTab === 'series' ? 'series' : 'movie', year: new Date().getFullYear(), description: '', adminRecommendation: '', image: '', category: 'Aclamadas', sources: [{ label: 'Servidor 1', url: '' }], episodes: [], genre: 'Acción' });
                    setShowAddModal(true);
                  }} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black tracking-widest uppercase shadow-[0_10px_30px_rgba(59,130,246,0.3)] transition-all transform hover:-translate-y-1"><Plus className="w-5 h-5" /> Añadir Título</button>
                </div>
              </div>

              <div className="glass-card rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-4 bg-white/5">
                   <div className="relative flex-1 max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar por título..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" /></div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-black/20 text-gray-400 text-[10px] uppercase tracking-[0.2em]"><th className="p-6 font-bold min-w-[300px]">Título</th><th className="p-6 font-bold">Estado</th><th className="p-6 font-bold">Tipo</th><th className="p-6 font-bold text-right">Acciones</th></tr></thead>
                      <tbody className="text-sm">
                         {filteredAdminMovies.map((movie) => (
                            <tr key={movie.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                               <td className="p-6 font-bold text-white flex items-center gap-4"><div className="relative w-12 h-16 rounded-md overflow-hidden shadow-lg border border-white/10"><ImageWithFallback src={movie.image} alt="poster" className="w-full h-full object-cover" /></div><div><p className="font-outfit tracking-wide">{movie.title}</p><p className="text-xs text-gray-500 font-normal mt-1">{movie.year} • {movie.genre}</p></div></td>
                               <td className="p-6"><span className="flex items-center text-xs font-bold text-green-400"><div className="w-2 h-2 rounded-full bg-green-400 mr-2 shadow-[0_0_5px_#4ade80]"></div> Activo</span></td>
                               <td className="p-6 text-gray-300"><span className="bg-white/10 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border border-white/5">{movie.type}</span></td>
                               <td className="p-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                   <button onClick={() => setEditingMovie(movie)} className="text-blue-400 hover:text-blue-300 interactive p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Edit3 className="w-4 h-4" /></button>
                                   <button className="text-red-400 hover:text-red-300 interactive p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={async () => {
                                      if(window.confirm(`¿Seguro que quieres eliminar ${movie.title}?`)) {
                                         const token = localStorage.getItem('token');
                                         await axios.delete(API_URL + '/movies/' + movie.id, { headers: { Authorization: `Bearer ${token}` } });
                                      }
                                   }}><X className="w-4 h-4" /></button>
                                 </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'users' && (
            <div className="animate-fade-up">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Comunidad</h2>
                <p className="text-gray-400 tracking-widest text-sm uppercase">Control de rangos y accesos</p>
              </div>
              <div className="glass-card rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-black/20 text-gray-400 text-[10px] uppercase tracking-[0.2em]"><th className="p-6 font-bold min-w-[250px]">Usuario</th><th className="p-6 font-bold">Rango</th><th className="p-6 font-bold text-right">Gestión</th></tr></thead>
                      <tbody className="text-sm">
                         {adminStats.usersList.map((u, idx) => (
                            <tr key={u.id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                               <td className="p-6 font-bold text-white flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.avatarSeed || u.id}&backgroundColor=transparent`} alt="avatar" className="w-full h-full rounded-full bg-gray-900" /></div><span className="font-outfit tracking-wide">{u.name}</span></td>
                               <td className="p-6 text-gray-300"><span className={`bg-white/10 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${u.role === 'admin' ? 'border-blue-500/50 text-blue-400' : 'border-white/5'}`}>{u.role || 'Usuario'}</span></td>
                               <td className="p-6 text-right">
                                 {u.role !== 'admin' && (
                                   <button className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 mr-2" onClick={async () => {
                                      if(window.confirm(`¿Promover a ${u.name} a Administrador?`)) {
                                        const token = localStorage.getItem('token');
                                        await axios.put(API_URL + '/users/' + u.id + '/role', { role: 'admin' }, { headers: { Authorization: `Bearer ${token}` } });
                                      }
                                   }}>Hacer Admin</button>
                                 )}
                                 <button className="text-red-400 hover:text-red-300 interactive p-2 bg-white/5 rounded-lg"><X className="w-4 h-4" /></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'metadata' && (
            <div className="animate-fade-up space-y-8">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Configuración de Catálogo</h2>
                <p className="text-gray-400 tracking-widest text-sm uppercase">Gestiona géneros y categorías del sistema</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GÉNEROS */}
                <div className="glass-card p-8 rounded-[40px] shadow-xl border border-white/5 space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center"><ListVideo className="w-5 h-5 mr-2 text-purple-400"/> Géneros ({appMetadata?.genres?.length || 0})</h3>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Nuevo género..." value={newGenre} onChange={e => setNewGenre(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={async () => {
                      if (!newGenre.trim()) return;
                      const currentGenres = appMetadata?.genres || [];
                      if (currentGenres.includes(newGenre.trim())) return alert('El género ya existe');
                      const updated = [...currentGenres, newGenre.trim()];
                      const token = localStorage.getItem('token');
                                     await axios.put(API_URL + '/metadata', { genres: updated }, { headers: { Authorization: `Bearer ${token}` } });
                      setNewGenre('');
                    }} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">Añadir</button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {(appMetadata?.genres || []).map(g => (
                      <div key={g} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 group">
                        <span>{g}</span>
                        <button onClick={async () => {
                          if (window.confirm(`¿Eliminar género ${g}?`)) {
                            const updated = (appMetadata?.genres || []).filter(item => item !== g);
                            const token = localStorage.getItem('token');
                                     await axios.put(API_URL + '/metadata', { genres: updated }, { headers: { Authorization: `Bearer ${token}` } });
                          }
                        }} className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CATEGORÍAS */}
                <div className="glass-card p-8 rounded-[40px] shadow-xl border border-white/5 space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center"><ListVideo className="w-5 h-5 mr-2 text-blue-400"/> Categorías ({appMetadata?.categories?.length || 0})</h3>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Nueva categoría..." value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={async () => {
                      if (!newCategory.trim()) return;
                      const currentCategories = appMetadata?.categories || [];
                      if (currentCategories.includes(newCategory.trim())) return alert('La categoría ya existe');
                      const updated = [...currentCategories, newCategory.trim()];
                      const token = localStorage.getItem('token');
                                     await axios.put(API_URL + '/metadata', { categories: updated }, { headers: { Authorization: `Bearer ${token}` } });
                      setNewCategory('');
                    }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">Añadir</button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {(appMetadata?.categories || []).map(c => (
                      <div key={c} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 group">
                        <span>{c}</span>
                        <button onClick={async () => {
                          if (window.confirm(`¿Eliminar categoría ${c}?`)) {
                            const updated = (appMetadata?.categories || []).filter(item => item !== c);
                            const token = localStorage.getItem('token');
                                     await axios.put(API_URL + '/metadata', { categories: updated }, { headers: { Authorization: `Bearer ${token}` } });
                          }
                        }} className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL AÑADIR TÍTULO */}
      {showAddModal && (
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-fade-in">
         <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAddModal(false)}></div>
         <div className="glass-card w-full max-w-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative animate-scale-up">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5"><h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Nuevo Título</h2><button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white transition-all"><X className="w-6 h-6"/></button></div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
               <div className="space-y-4">
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Título</label><input type="text" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL Póster</label><input type="text" value={newMovie.image} onChange={e => setNewMovie({...newMovie, image: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Año</label><input type="number" value={newMovie.year} onChange={e => setNewMovie({...newMovie, year: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Género</label><select value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none">{appMetadata?.genres?.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría (Filtro)</label><select value={newMovie.category || ''} onChange={e => setNewMovie({...newMovie, category: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none"><option value="">Ninguna</option>{appMetadata?.categories?.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sinopsis</label><textarea rows="3" value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none resize-none"></textarea></div>
                  <div><label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Recomendación del Admin</label><textarea rows="2" placeholder="¿Por qué la recomiendas?" value={newMovie.adminRecommendation || ''} onChange={e => setNewMovie({...newMovie, adminRecommendation: e.target.value})} className="w-full bg-black/50 border border-green-500/30 rounded-xl py-4 px-4 text-white focus:border-green-500 focus:outline-none resize-none"></textarea></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                    <select value={newMovie.type} onChange={e => setNewMovie({...newMovie, type: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none">
                       <option value="movie">Película</option>
                       <option value="series">Serie</option>
                    </select>
                  </div>
                  
                  {newMovie.type !== 'series' ? (
                  <>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Archivo de Video Local (Opcional)</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 focus:outline-none text-xs" /></div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><label className="block text-xs font-bold text-blue-400 uppercase tracking-widest">Fuentes (Respaldo)</label><button onClick={addSourceField} className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">+ Añadir</button></div>
                      {newMovie.sources?.map((src, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" value={src.label} onChange={e => updateSourceField(idx, 'label', e.target.value)} className="w-1/3 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs" />
                          <input type="text" value={src.url} onChange={e => updateSourceField(idx, 'url', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs" />
                          {newMovie.sources.length > 1 && <button onClick={() => removeSourceField(idx)} className="p-3 text-red-500"><X className="w-4 h-4"/></button>}
                        </div>
                      ))}
                    </div>
                  </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><label className="block text-xs font-bold text-purple-400 uppercase tracking-widest">Episodios</label><button onClick={addEpisode} className="text-[10px] bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">+ Añadir Episodio</button></div>
                      {newMovie.episodes?.map((ep, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/10 relative mt-2">
                          <button onClick={() => removeEpisode(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><X className="w-4 h-4"/></button>
                          <div className="flex gap-2 mr-6">
                            <input type="number" placeholder="Temp" value={ep.season} onChange={e => updateEpisode(idx, 'season', parseInt(e.target.value) || 1)} className="w-16 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" title="Temporada" />
                            <input type="number" placeholder="Ep" value={ep.episode} onChange={e => updateEpisode(idx, 'episode', parseInt(e.target.value) || 1)} className="w-16 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" title="Episodio" />
                            <input type="text" placeholder="Título (ej: Piloto)" value={ep.title} onChange={e => updateEpisode(idx, 'title', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                          </div>
                          <input type="file" accept="video/*" onChange={e => updateEpisode(idx, 'file', e.target.files[0])} className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                          <input type="text" placeholder="O URL directa (opcional)" value={ep.url || ''} onChange={e => updateEpisode(idx, 'url', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-black/40"><button disabled={isUploading} onClick={async () => {
               if (!newMovie.title || (!newMovie.image && !videoFile)) return alert("Completa los datos (título e imagen)");
               setIsUploading(true);
               let finalSources = [...newMovie.sources];
               let finalEpisodes = [...(newMovie.episodes || [])];
               try {
                 if (newMovie.type === 'series') {
                    for (let i = 0; i < finalEpisodes.length; i++) {
                       if (finalEpisodes[i].file) {
                           const formData = new FormData();
                           formData.append('video', finalEpisodes[i].file);
                           const res = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                           if (res.data.url) finalEpisodes[i].url = res.data.url;
                           delete finalEpisodes[i].file;
                       }
                    }
                 } else {
                   if (videoFile) {
                     const formData = new FormData();
                     formData.append('video', videoFile);
                     const res = await axios.post('/upload', formData, {
                       headers: { 'Content-Type': 'multipart/form-data' }
                     });
                     if (res.data.url) {
                       finalSources = [{ label: 'Servidor Personal', url: res.data.url }, ...finalSources.filter(s => s.url)];
                     }
                   }
                 }
                 const id = Date.now().toString();
                 const token = localStorage.getItem('token');
            await axios.post(API_URL + '/movies', { ...newMovie, sources: finalSources, episodes: finalEpisodes, id }, { headers: { Authorization: `Bearer ${token}` } });
                 setShowAddModal(false);
                 setVideoFile(null);
                 setNewMovie({ title: '', type: 'movie', year: new Date().getFullYear(), description: '', adminRecommendation: '', image: '', category: 'Aclamadas', sources: [{ label: 'Servidor 1', url: '' }], episodes: [], genre: 'Acción' });
               } catch (e) {
                 console.error(e);
                 alert('Error al subir el archivo: ' + e.message);
               } finally {
                 setIsUploading(false);
               }
            }} className={`w-full py-4 ${isUploading ? 'bg-gray-600' : 'bg-blue-600'} rounded-xl font-bold uppercase tracking-widest transition-colors`}>{isUploading ? 'Subiendo Video Pesado...' : 'Subir Catálogo'}</button></div>
         </div>
      </div>
      )}

      {/* MODAL EDITAR TÍTULO */}
      {editingMovie && (
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-fade-in">
         <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setEditingMovie(null)}></div>
         <div className="glass-card w-full max-w-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative animate-scale-up">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5"><h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Editar Título</h2><button onClick={() => setEditingMovie(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white transition-all"><X className="w-6 h-6"/></button></div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
               <div className="space-y-4">
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Título</label><input type="text" value={editingMovie.title} onChange={e => setEditingMovie({...editingMovie, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL Póster</label><input type="text" value={editingMovie.image} onChange={e => setEditingMovie({...editingMovie, image: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Año</label><input type="number" value={editingMovie.year} onChange={e => setEditingMovie({...editingMovie, year: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Género</label><select value={editingMovie.genre} onChange={e => setEditingMovie({...editingMovie, genre: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none">{appMetadata?.genres?.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría (Filtro)</label><select value={editingMovie.category || ''} onChange={e => setEditingMovie({...editingMovie, category: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none"><option value="">Ninguna</option>{appMetadata?.categories?.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sinopsis</label><textarea rows="3" value={editingMovie.description} onChange={e => setEditingMovie({...editingMovie, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none resize-none"></textarea></div>
                  <div><label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Recomendación del Admin</label><textarea rows="2" placeholder="¿Por qué la recomiendas?" value={editingMovie.adminRecommendation || ''} onChange={e => setEditingMovie({...editingMovie, adminRecommendation: e.target.value})} className="w-full bg-black/50 border border-green-500/30 rounded-xl py-4 px-4 text-white focus:border-green-500 focus:outline-none resize-none"></textarea></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                    <select value={editingMovie.type || 'movie'} onChange={e => setEditingMovie({...editingMovie, type: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-blue-500 focus:outline-none">
                       <option value="movie">Película</option>
                       <option value="series">Serie</option>
                    </select>
                  </div>
                  
                  {editingMovie.type !== 'series' ? (
                  <>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Archivo de Video Local (Opcional)</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 focus:outline-none text-xs" /></div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><label className="block text-xs font-bold text-blue-400 uppercase tracking-widest">Fuentes (Respaldo)</label><button onClick={addSourceField} className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">+ Añadir</button></div>
                      {(editingMovie.sources || []).map((src, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" value={src.label} onChange={e => updateSourceField(idx, 'label', e.target.value)} className="w-1/3 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs" />
                          <input type="text" value={src.url} onChange={e => updateSourceField(idx, 'url', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs" />
                          {(editingMovie.sources || []).length > 1 && <button onClick={() => removeSourceField(idx)} className="p-3 text-red-500"><X className="w-4 h-4"/></button>}
                        </div>
                      ))}
                    </div>
                  </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><label className="block text-xs font-bold text-purple-400 uppercase tracking-widest">Episodios</label><button onClick={addEpisode} className="text-[10px] bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">+ Añadir Episodio</button></div>
                      {(editingMovie.episodes || []).map((ep, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/10 relative mt-2">
                          <button onClick={() => removeEpisode(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><X className="w-4 h-4"/></button>
                          <div className="flex gap-2 mr-6">
                            <input type="number" placeholder="Temp" value={ep.season} onChange={e => updateEpisode(idx, 'season', parseInt(e.target.value) || 1)} className="w-16 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" title="Temporada" />
                            <input type="number" placeholder="Ep" value={ep.episode} onChange={e => updateEpisode(idx, 'episode', parseInt(e.target.value) || 1)} className="w-16 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" title="Episodio" />
                            <input type="text" placeholder="Título (ej: Piloto)" value={ep.title} onChange={e => updateEpisode(idx, 'title', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                          </div>
                          <input type="file" accept="video/*" onChange={e => updateEpisode(idx, 'file', e.target.files[0])} className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                          <input type="text" placeholder="O URL directa (opcional)" value={ep.url || ''} onChange={e => updateEpisode(idx, 'url', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-black/40">
               <button disabled={isUploading} onClick={async () => {
                  setIsUploading(true);
                  let finalSources = editingMovie.sources || [];
                  let finalEpisodes = editingMovie.episodes || [];
                  try {
                    if (editingMovie.type === 'series') {
                       for (let i = 0; i < finalEpisodes.length; i++) {
                          if (finalEpisodes[i].file) {
                              const formData = new FormData();
                              formData.append('video', finalEpisodes[i].file);
                              const res = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                              if (res.data.url) finalEpisodes[i].url = res.data.url;
                              delete finalEpisodes[i].file;
                          }
                       }
                    } else {
                      if (videoFile) {
                        const formData = new FormData();
                        formData.append('video', videoFile);
                        const res = await axios.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data.url) {
                          finalSources = [{ label: 'Servidor Personal', url: res.data.url }, ...finalSources.filter(s => s.url)];
                        }
                      }
                    }
                    const token = localStorage.getItem('token');
            await axios.put(API_URL + '/movies/' + editingMovie.id, { ...editingMovie, sources: finalSources, episodes: finalEpisodes }, { headers: { Authorization: `Bearer ${token}` } });
                    setEditingMovie(null);
                    setVideoFile(null);
                  } catch (e) {
                    console.error(e);
                    alert('Error al subir el archivo: ' + e.message);
                  } finally {
                    setIsUploading(false);
                  }
               }} className={`w-full py-4 ${isUploading ? 'bg-gray-600' : 'bg-blue-600'} rounded-xl font-bold uppercase tracking-widest transition-colors`}>{isUploading ? 'Subiendo Video Pesado...' : 'Guardar Metadatos'}</button>
            </div>
         </div>
      </div>
      )}
    </div>
  );
}

function MovieRow({ title, movies, onSelect, onHover, isLarge = false, showNumbers = false, myListIds, onToggleList }) {
  const rowRef = useRef(null); const cardsRef = useRef([]); 
  const handleScrollEvent = useCallback(() => {
    if (!rowRef.current) return;
    requestAnimationFrame(() => {
      const cCenter = rowRef.current.getBoundingClientRect().left + rowRef.current.clientWidth / 2;
      cardsRef.current.forEach((c) => {
        if (!c) return;
        const cardCenter = c.getBoundingClientRect().left + c.getBoundingClientRect().width / 2;
        let r = Math.abs(cCenter - cardCenter) / (rowRef.current.clientWidth / 1.2);
        if (r > 1) r = 1;
        const eR = r * r * (3 - 2 * r);
        c.style.transform = `perspective(1200px) rotateY(${eR * 35 * (cCenter > cardCenter ? 1 : -1)}deg) scale(${1 - (eR * 0.2)})`;
        c.style.opacity = 1 - (eR * 0.7);
      });
    });
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (row) { row.addEventListener('scroll', handleScrollEvent); window.addEventListener('resize', handleScrollEvent); setTimeout(handleScrollEvent, 100); }
    return () => { if (row) row.removeEventListener('scroll', handleScrollEvent); window.removeEventListener('resize', handleScrollEvent); };
  }, [handleScrollEvent]);

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-6 relative group/row transition-all duration-[1200ms] z-20">
      <div className="flex items-end justify-between px-2"><h3 className="font-outfit text-2xl sm:text-3xl font-light tracking-wide text-gray-200 flex items-center group-hover/row:text-white transition-colors">{title}</h3></div>
      <div ref={rowRef} className="flex space-x-4 overflow-x-auto overflow-y-visible py-8 hide-scrollbar relative z-20 px-2 snap-x">
        {movies.map((movie, index) => (
          <div key={`${movie.id}-${index}`} ref={(el) => (cardsRef.current[index] = el)} className={`snap-center flex-none relative ${isLarge ? 'w-[280px] sm:w-[360px] md:w-[420px]' : 'w-[180px] sm:w-[220px] md:w-[260px]'}`} style={{ transformOrigin: 'center center', willChange: 'transform, opacity' }}>
            {showNumbers && <div className="absolute -left-8 sm:-left-12 -bottom-4 text-[120px] sm:text-[180px] font-black text-black leading-none z-10 font-outfit" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>{index + 1}</div>}
            <div className={`${showNumbers ? 'ml-10 sm:ml-16' : ''}`}><TiltCard movie={movie} onClick={() => onSelect(movie)} onHover={onHover} isLarge={isLarge} isInList={myListIds.includes(movie.id)} onToggleList={() => onToggleList(movie.id)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TiltCard({ movie, onClick, onHover, isLarge, isInList, onToggleList }) {
  const cardRef = useRef(null); const [t, setT] = useState(''); const [isH, setIsH] = useState(false);
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    setT(`perspective(1000px) rotateX(${-(e.clientY - top) / height * 25 + 12.5}deg) rotateY(${(e.clientX - left) / width * 25 - 12.5}deg) scale3d(1.05, 1.05, 1.05)`);
  }, []);
  return (
    <InteractiveElement onClick={onClick} className="relative aspect-[2/3] rounded-xl overflow-hidden group/card bg-gray-900 border border-white/10 cursor-pointer" style={{ transform: t, transition: isH ? 'none' : 'transform 0.5s ease', transformStyle: 'preserve-3d', zIndex: isH ? 50 : 1 }}>
      <div onMouseEnter={() => { setIsH(true); if(onHover) onHover(movie.themeColor); }} onMouseLeave={() => { setIsH(false); setT(''); if(onHover) onHover('transparent'); }} onMouseMove={handleMouseMove} className="w-full h-full absolute inset-0 z-50"></div>
      <div className="absolute inset-0 rounded-xl transition-shadow duration-300 pointer-events-none" style={{ boxShadow: isH ? `0 30px 60px ${movie.themeColor}` : '' }}><ImageWithFallback src={movie.image} alt={movie.title} className="w-full h-full object-cover" /></div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover/card:opacity-100 pointer-events-none transition-opacity duration-300" style={{ transform: 'translateZ(1px)' }}></div>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-6 pointer-events-none" style={{ transform: 'translateZ(30px)' }}>
        <h4 className="font-outfit font-black text-white text-lg tracking-wide drop-shadow-lg">{movie.title}</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-end space-x-1 h-4 opacity-70">{[...Array(6)].map((_, i) => <div key={i} className="w-1 bg-red-500 rounded-t-sm audio-bar" style={{ animationDelay: `${Math.random() * -1000}ms` }}></div>)}<span className="text-[10px] text-gray-300 ml-2 font-mono uppercase tracking-widest">Preview</span></div>
          <div className="flex items-center space-x-3 pointer-events-auto">
            <button className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]"><Play className="h-5 w-5 fill-current ml-1" /></button>
            <button onClick={(e) => { e.stopPropagation(); onToggleList(); }} className={`h-12 w-12 rounded-full border-2 flex items-center justify-center transition-colors ${isInList ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'bg-black/50 text-white border-gray-500 hover:border-white'}`}>{isInList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</button>
          </div>
        </div>
      </div>
    </InteractiveElement>
  );
}
