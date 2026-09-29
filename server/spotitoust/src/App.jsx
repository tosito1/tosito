import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
Search, Home, Compass, Library,
Play, Pause, SkipBack, SkipForward, Volume, Volume1, Volume2, VolumeX,
Heart, X, AlertCircle, Maximize2,
ArrowLeft, Tv, ChevronDown, ChevronLeft, ChevronRight, ListMusic, ListPlus, MoreHorizontal, Plus, Music, Menu, Sparkles, Clock, Shuffle, User, Download, CheckCircle, Loader
} from 'lucide-react';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';
import { trackSignal, getRecommendationSeeds } from './utils/DiscoveryEngine';
import { advancedSearch } from './utils/SearchEngine';

const SpotifyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-1.007-.336.074-.67-.142-.744-.48-.074-.336.142-.67.48-.744 3.856-.88 7.15-.506 9.81 1.127.295.18.387.565.207.86zm1.224-2.724c-.226.367-.707.487-1.074.26-2.722-1.674-6.87-2.158-10.082-1.182-.413.125-.85-.107-.978-.52-.128-.413.107-.85.52-.978 3.67-1.112 8.236-.57 11.353 1.348.367.227.488.708.261 1.072zm.105-2.836C14.364 8.78 8.423 8.58 4.982 9.625c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.965-1.202 10.522-.97 14.615 1.46.48.28.64.9.36 1.38-.28.48-.9.64-1.38.36z" />
  </svg>
);

const GoogleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);
const SpotisLogo = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 512 512" fill="none">
    <rect width="512" height="512" rx="140" fill="#0A0A0A"/>
    <circle cx="256" cy="256" r="220" fill="url(#miniBgGlow)" opacity="0.2"/>
    <g transform="translate(116, 116)">
      <path d="M 40,80 A 100,100 0 0,1 240,80" stroke="url(#miniSpotifyGreen)" strokeWidth="28" strokeLinecap="round"/>
      <path d="M 240,80 C 240,160 40,120 40,200" stroke="url(#miniSpotifyGreen)" strokeWidth="28" strokeLinecap="round"/>
      <path d="M 40,200 A 100,100 0 0,0 240,200" stroke="url(#miniSpotifyGreen)" strokeWidth="28" strokeLinecap="round"/>
      <circle cx="140" cy="140" r="16" fill="#FFFFFF"/>
    </g>
    <defs>
      <linearGradient id="miniSpotifyGreen" x1="0" y1="0" x2="280" y2="280" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1DB954"/>
        <stop offset="100%" stopColor="#10B981"/>
      </linearGradient>
      <radialGradient id="miniBgGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1DB954"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
    </defs>
  </svg>
);

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DEFAULT_SPOTIFY_CLIENT_ID = "f765145a6b544913bb3cb8dda552ccf7";
const DEFAULT_SPOTIFY_CLIENT_SECRET = "d3388c3790154b1f8b943f025e8dd13b";

const saveSpotifySettingsToFirebase = async () => {};

const PremiumScrollRow = ({ children }) => {
  const rowRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftBtn(scrollLeft > 10);
    setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const amount = direction === 'left' ? -380 : 380;
    rowRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkScroll = () => {
      if (rowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setShowLeftBtn(scrollLeft > 10);
        setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  return (
    <div className="relative group/scroll w-full">
      {/* Left Fade Overlay */}
      <div className={`absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showLeftBtn ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Right Fade Overlay */}
      <div className={`absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showRightBtn ? 'opacity-100' : 'opacity-0'}`} />

      {/* Left Floating Navigation Button */}
      <button 
        onClick={() => scroll('left')}
        className={`absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-90 opacity-0 group-hover/scroll:opacity-100 ${showLeftBtn ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Right Floating Navigation Button */}
      <button 
        onClick={() => scroll('right')}
        className={`absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-90 opacity-0 group-hover/scroll:opacity-100 ${showRightBtn ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Horizontal Scroll Area */}
      <div 
        ref={rowRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-5 md:gap-7 pb-4 premium-horizontal-scroll snap-x scrollbar-none scroll-smooth select-none w-full"
      >
        {children}
      </div>
    </div>
  );
};

const CustomStyles = () => (
<style dangerouslySetInnerHTML={{__html: ` /* Solo aplicar cursor personalizado en dispositivos con ratón (Desktop) */
    @media (pointer: fine) { * { cursor: none !important; } .custom-cursor-element { display: block; } } /* Ocultar
    cursor personalizado en móviles/pantallas táctiles */ @media (pointer: coarse) { .custom-cursor-element { display:
    none !important; } } @keyframes eq { 0% { height: 4px; } 50% { height: 16px; } 100% { height: 4px; } } .eq-bar {
    width: 3px; background-color: #1db954; border-radius: 2px; animation: eq 1s ease-in-out infinite; }
    .eq-bar:nth-child(1) { animation-delay: 0.0s; } .eq-bar:nth-child(2) { animation-delay: 0.2s; } .eq-bar:nth-child(3)
    { animation-delay: 0.4s; } .eq-bar:nth-child(4) { animation-delay: 0.1s; } /* Efectos Glassmorphism adaptados */
    .glass-panel { background: rgba(20, 20, 20, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05); } .glass-panel-heavy { background: rgba(5, 5, 5, 0.75);
    backdrop-filter: blur(40px) saturate(150%); -webkit-backdrop-filter: blur(40px) saturate(150%); border-top: 1px
    solid rgba(255, 255, 255, 0.1); } .glass-dropdown { background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.9); } .text-glow { text-shadow: 0 0
    30px rgba(255,255,255,0.4); } .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; } .custom-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15); border-radius: 10px; } input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px
    rgba(255,255,255,0.5); } .lyric-line { transition: all 0.5s ease-out; filter: blur(2px); opacity: 0.3; transform:
    scale(0.95) translateY(10px); } .lyric-line.active { filter: blur(0px); opacity: 1; transform: scale(1.05)
    translateY(0); color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.5); } @keyframes spin-slow { from { transform:
    rotate(0deg); } to { transform: rotate(360deg); } } .vinyl-spin { animation: spin-slow 12s linear infinite; }
    .vinyl-spin.paused { animation-play-state: paused; } /* Custom Cursor Styles */ #cursor-dot { width: 8px; height:
    8px; background-color: white; border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none; z-index:
    9999; mix-blend-mode: difference; transform: translate(-50%, -50%); } #cursor-aura { width: 40px; height: 40px;
    border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none;
    z-index: 9998; transform: translate(-50%, -50%); transition: width 0.2s, height 0.2s, background-color 0.2s; }
    body:active #cursor-aura { width: 30px; height: 30px; background-color: rgba(255,255,255,0.1); } /* Prevenir
    selección de texto en botones para sensación de app */ .no-select { -webkit-user-select: none; user-select: none;
    -webkit-touch-callout: none; } 
    @keyframes pan8D { 0% { transform: translateX(-15px) rotateY(-10deg); } 50% { transform: translateX(15px) rotateY(10deg); } 100% { transform: translateX(-15px) rotateY(-10deg); } }
    .mode-8d { animation: pan8D 8s ease-in-out infinite; perspective: 1000px; }
    @keyframes flyUp { 0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; } 100% { transform: translateY(-80vh) scale(1.5) rotate(20deg); opacity: 0; } }
    .animate-fly-up { animation: flyUp 3s ease-out forwards; }
    `}} />
);

const NavItemDesktop = ({ icon: Icon, label, active, onClick }) => (
<button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group
    relative overflow-hidden rounded-2xl mx-2 no-select ${active ? 'text-white bg-white/10'
    : 'text-gray-400 hover:text-white hover:bg-white/5' }`} style={{ width: 'calc(100% - 16px)' }}>
    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full bg-gradient-to-b from-[#1db954]
        to-emerald-400 transition-all origin-left ${active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0' }`}>
    </div>
    <Icon className={`w-5 h-5 relative z-10 transition-all ${active ? 'text-[#1db954] scale-110'
        : 'group-hover:scale-110' }`} />
    <span className="font-bold text-sm tracking-wide relative z-10">{label}</span>
</button>
);

const NavItemMobile = ({ icon: Icon, label, active, onClick }) => (
<button onClick={onClick} className="flex flex-col items-center justify-center gap-1 flex-1 p-2 no-select">
    <Icon className={`w-6 h-6 transition-all duration-300 ${active ? 'text-[#1db954] scale-110 mb-1' : 'text-gray-400'
        }`} />
    <span className={`text-[10px] font-bold transition-all duration-300 ${active ? 'text-white opacity-100'
        : 'text-gray-500 opacity-0 h-0 overflow-hidden' }`}>{label}</span>
</button>
);

const MiniVisualizer = () => (
<div className="flex items-end gap-[2px] h-3">
    <div className="eq-bar"></div>
    <div className="eq-bar"></div>
    <div className="eq-bar"></div>
</div>
);

class YouTubeAudioBridge {
  constructor() {
    this._listeners = {
      timeupdate: [],
      ended: []
    };
    this._volume = 0.5;
    this._currentTime = 0;
    this._duration = 0;
    this._src = "";
    this.isPlaying = false;
    this.useFallback = false;
    this.is8DMode = false;
    
    // Fallback standard Audio object
    this.fallbackAudio = new Audio();
    this.fallbackAudio.crossOrigin = "anonymous";
    this.fallbackAudio.volume = this._volume;
    
    // Wire fallback events to our bridge listeners
    this.fallbackAudio.addEventListener('timeupdate', () => {
      if (this.useFallback) {
        this._currentTime = this.fallbackAudio.currentTime;
        this._duration = this.fallbackAudio.duration || 0;
        this._listeners.timeupdate.forEach(cb => cb());
      }
    });
    
    this.fallbackAudio.addEventListener('ended', () => {
      if (this.useFallback) {
        this.isPlaying = false;
        this._listeners.ended.forEach(cb => cb());
      }
    });
    
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // Create widescreen container for YT player (fits in bottom right corner above control bar)
    let container = document.getElementById('yt-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-player-container';
      container.className = 'glass-panel';
      container.style.position = 'fixed';
      container.style.bottom = '100px';
      container.style.right = '24px';
      container.style.width = '240px';
      container.style.height = '160px';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      container.style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
      container.style.zIndex = '9999';
      container.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      container.style.transform = 'scale(0.001)';
      container.style.opacity = '0.001';
      container.style.background = '#000';
      
      const dragBar = document.createElement('div');
      dragBar.style.width = '100%';
      dragBar.style.height = '24px';
      dragBar.style.background = 'rgba(0, 0, 0, 0.7)';
      dragBar.style.display = 'flex';
      dragBar.style.alignItems = 'center';
      dragBar.style.justifyContent = 'space-between';
      dragBar.style.padding = '0 8px';
      dragBar.style.fontSize = '9px';
      dragBar.style.fontWeight = 'bold';
      dragBar.style.color = '#1db954';
      dragBar.style.userSelect = 'none';
      dragBar.innerText = 'SPOTIS MUSIC VIDEO';
      
      const closeBtn = document.createElement('button');
      closeBtn.innerText = '✕';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.color = '#fff';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.onclick = () => {
        container.style.transform = 'scale(0.001)';
        container.style.opacity = '0.001';
        window.showMiniVideo = false;
      };
      
      dragBar.appendChild(closeBtn);
      container.appendChild(dragBar);
      
      const placeholder = document.createElement('div');
      placeholder.id = 'yt-player-iframe-placeholder';
      placeholder.style.width = '100%';
      placeholder.style.height = 'calc(100% - 24px)';
      container.appendChild(placeholder);
      
      document.body.appendChild(container);
    }
    
    // Toggle Window Action
    window.toggleSpotisVideo = () => {
      const c = document.getElementById('yt-player-container');
      if (c) {
        const isHidden = c.style.transform === 'scale(0.001)';
        if (isHidden) {
          c.style.transform = 'scale(1)';
          c.style.opacity = '1';
          window.showMiniVideo = true;
        } else {
          c.style.transform = 'scale(0.001)';
          c.style.opacity = '0.001';
          window.showMiniVideo = false;
        }
      }
    };
    
    this._initPlayer();
  }
  
  _initPlayer() {
    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYT);
        
        let playerDiv = document.getElementById('yt-player-iframe-placeholder');
        if (!playerDiv) {
          playerDiv = document.createElement('div');
          playerDiv.id = 'yt-player-iframe-placeholder';
          document.getElementById('yt-player-container').appendChild(playerDiv);
        }
        
        this.player = new window.YT.Player('yt-player-iframe-placeholder', {
          height: '100%',
          width: '100%',
          videoId: '',
          playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'rel': 0,
            'autoplay': 1
          },
          events: {
            onReady: (event) => {
              this.player.setVolume(this._volume * 100);
              this.player.unMute();
            },
            onStateChange: (event) => {
              if (this.useFallback) return;
              if (event.data === window.YT.PlayerState.ENDED) {
                this.isPlaying = false;
                this._listeners.ended.forEach(cb => cb());
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                this._duration = this.player.getDuration() || 0;
                this.player.unMute();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                this.isPlaying = false;
              }
            }
          }
        });
        
        setInterval(() => {
          if (!this.useFallback && this.player && typeof this.player.getCurrentTime === 'function' && this.isPlaying) {
            this._currentTime = this.player.getCurrentTime();
            this._duration = this.player.getDuration() || 0;
            this._listeners.timeupdate.forEach(cb => cb());
          }
        }, 250);
      }
    }, 100);
  }
  
  async play() {
    this.isPlaying = true;
    if (this.useFallback) {
      if (this.initWebAudio) this.initWebAudio();
      await this.fallbackAudio.play().catch(e => console.warn(e));
    } else if (this.player && typeof this.player.playVideo === 'function') {
      this.player.unMute();
      this.player.playVideo();
    }
  }
  
  pause() {
    this.isPlaying = false;
    if (this.useFallback) {
      this.fallbackAudio.pause();
    } else if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }
  
  get volume() {
    return this._volume;
  }
  
  set volume(val) {
    this._volume = val;
    this.fallbackAudio.volume = val;
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(val * 100);
    }
  }
  
  get currentTime() {
    if (this.useFallback) {
      return this.fallbackAudio.currentTime;
    }
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      return this.player.getCurrentTime();
    }
    return this._currentTime;
  }
  
  set currentTime(val) {
    this._currentTime = val;
    if (this.useFallback) {
      this.fallbackAudio.currentTime = val;
    } else if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(val, true);
    }
  }
  
  get duration() {
    if (this.useFallback) {
      return this.fallbackAudio.duration || 0;
    }
    if (this.player && typeof this.player.getDuration === 'function') {
      const dur = this.player.getDuration();
      return dur > 0 ? dur : this._duration;
    }
    return this._duration;
  }
  
  set src(val) {
    this._src = val;
    if (!val) return;
    
    if (val.startsWith('http') && !val.includes('youtube.com') && !val.includes('youtu.be')) {
      this.useFallback = true;
      if (this.player && typeof this.player.stopVideo === 'function') {
        this.player.stopVideo();
      }
      this.fallbackAudio.src = val;
      if (this.isPlaying) {
        this.fallbackAudio.play().catch(e => console.warn(e));
      }
    } else {
      this.useFallback = false;
      this.fallbackAudio.pause();
      
      let videoId = val;
      if (val.includes('youtube.com') || val.includes('youtu.be')) {
        const match = val.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^&#\s?]+)/);
        if (match) videoId = match[1];
      }
      
      this._videoId = videoId;
      this._currentTime = 0;
      
      const loadIt = () => {
        if (this.player && typeof this.player.loadVideoById === 'function') {
          this.player.loadVideoById({ videoId: this._videoId });
          this.player.unMute();
          if (this.isPlaying) {
            this.player.playVideo();
          }
        } else {
          setTimeout(loadIt, 100);
        }
      };
      loadIt();
    }
  }
  
  get src() {
    return this._src;
  }
  
  initWebAudio() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.audioCtx.createMediaElementSource(this.fallbackAudio);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.panner = this.audioCtx.createStereoPanner();
        
        // Default route: source -> analyser -> destination
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch(e) { console.warn("Web Audio API not supported", e); }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  getAudioData() {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  set8DMode(enable) {
    this.is8DMode = enable;
    if (this.useFallback) {
      this.initWebAudio();
      if (enable && this.audioCtx && this.panner) {
        // Reroute through panner
        this.analyser.disconnect();
        this.analyser.connect(this.panner);
        this.panner.connect(this.audioCtx.destination);
        
        let t = 0;
        clearInterval(this.panInterval);
        this.panInterval = setInterval(() => {
          t += 0.05;
          this.panner.pan.value = Math.sin(t);
        }, 50);
      } else if (this.audioCtx) {
        clearInterval(this.panInterval);
        if (this.panner) this.panner.pan.value = 0;
        // Revert route to normal
        try {
            this.analyser.disconnect();
            this.panner.disconnect();
            this.analyser.connect(this.audioCtx.destination);
        } catch(e) {}
      }
    }
  }

  addEventListener(event, cb) {
    if (this._listeners[event]) {
      this._listeners[event].push(cb);
    }
  }
  
  removeEventListener(event, cb) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(x => x !== cb);
    }
  }
}

const FullScreenVisualizer = ({ isPlaying, audioRef }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for(let i=0; i<120; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          baseRadius: Math.random() * 3 + 1,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          colorHue: Math.random() * 60 + 120
        });
      }
    };
    init();
    
    const animate = () => {
      let audioData = null;
      let bassAvg = 0;
      let midAvg = 0;
      
      if (audioRef?.current && typeof audioRef.current.getAudioData === 'function') {
        audioData = audioRef.current.getAudioData();
        if (audioData) {
            // Calculate bass (lower frequencies)
            let bassSum = 0;
            for(let i=0; i<10; i++) bassSum += audioData[i];
            bassAvg = bassSum / 10;
            
            // Calculate mids
            let midSum = 0;
            for(let i=10; i<60; i++) midSum += audioData[i];
            midAvg = midSum / 50;
        }
      }

      ctx.fillStyle = `rgba(0,0,0,${bassAvg > 200 ? 0.05 : 0.15})`; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const bounceIntensity = bassAvg / 255; // 0 to 1
      
      // Draw Particles
      particles.forEach(p => {
        if(isPlaying) {
          const speedMulti = 1 + bounceIntensity * 5;
          p.x += p.vx * speedMulti;
          p.y += p.vy * speedMulti;
          p.radius = p.baseRadius + (bounceIntensity * 8);
        } else {
          p.x += p.vx * 0.2;
          p.y += p.vy * 0.2;
          p.radius = p.baseRadius;
        }
        
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        // Color shifts based on mid frequencies
        ctx.fillStyle = `hsl(${p.colorHue + (midAvg / 2)}, 100%, ${isPlaying ? 60 + bounceIntensity*20 : 50}%)`;
        ctx.fill();
      });
      
      // Draw Waveform if audio data exists
      if (audioData && isPlaying) {
          ctx.beginPath();
          const sliceWidth = canvas.width * 1.0 / (audioData.length / 2); // Use half the bins
          let x = 0;
          
          for(let i = 0; i < audioData.length / 2; i++) {
              const v = audioData[i] / 255.0;
              const y = canvas.height - (v * canvas.height / 3) - 20; // Bottom wave
              
              if(i === 0) {
                  ctx.moveTo(x, y);
              } else {
                  // Smooth curve
                  const xc = (x + (x + sliceWidth)) / 2;
                  const yc = y;
                  ctx.quadraticCurveTo(x, y, xc, yc);
              }
              x += sliceWidth;
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          
          // Gradient fill for wave
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 300);
          gradient.addColorStop(0, `rgba(29, 185, 84, 0.8)`);
          gradient.addColorStop(1, `rgba(29, 185, 84, 0.0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    const handleResize = () => init();
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, audioRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-80 mix-blend-screen"></canvas>;
};


// ==========================================
// SPOTIFY PKCE OAUTH & FIRESTORE TOKEN ENGINES
// ==========================================
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const hash = CryptoJS.SHA256(codeVerifier);
  const base64 = CryptoJS.enc.Base64.stringify(hash);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const saveTokensToFirebase = async () => {};

const fetchTokensFromFirebase = async () => { return null; };

const refreshAccessToken = async (clientId, refreshToken, clientSecret) => {
  try {
    const params = {
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    if (clientSecret) {
      params.client_secret = clientSecret;
    }
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params)
    });
    
    if (!res.ok) throw new Error("Refresh token exchange failed: " + res.statusText);
    
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("spotify_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
        await saveTokensToFirebase(clientId, data.refresh_token, "default");
      }
      return data.access_token;
    }
  } catch (err) {
    console.warn("Silent background Spotify token refresh failed:", err);
  }
  return null;
};


export default function App() {
const [gsapLoaded, setGsapLoaded] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [spotifyClientId, setSpotifyClientId] = useState(localStorage.getItem("spotify_client_id") || DEFAULT_SPOTIFY_CLIENT_ID);
  const [spotifyClientSecret, setSpotifyClientSecret] = useState(localStorage.getItem("spotify_client_secret") || DEFAULT_SPOTIFY_CLIENT_SECRET);
  
  const spotifyFetch = async (url, options = {}) => {
    let token = spotifyToken || localStorage.getItem("spotify_access_token");
    if (!token) {
      throw new Error("No Spotify token available");
    }
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    let res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      console.log("Spotify token expired (401), attempting silent refresh...");
      const clientId = localStorage.getItem("spotify_client_id") || DEFAULT_SPOTIFY_CLIENT_ID;
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const clientSecret = localStorage.getItem("spotify_client_secret") || "";
      if (refreshToken) {
        const newToken = await refreshAccessToken(clientId, refreshToken, clientSecret);
        if (newToken) {
          setSpotifyToken(newToken);
          const retryHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          };
          res = await fetch(url, { ...options, headers: retryHeaders });
        }
      }
    }
    return res;
  };
  const [oauthModalTab, setOauthModalTab] = useState("oauth");
  const [showAdvancedOauth, setShowAdvancedOauth] = useState(false);
  const [partyRoomId, setPartyRoomId] = useState(null);
  const [isPartyHost, setIsPartyHost] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partyJoinInput, setPartyJoinInput] = useState('');
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  const partyUnsubRef = useRef(null);
  const partyHostLastSentRef = useRef(0);
  const trackCompletedRef = useRef(false);

const [currentView, setCurrentView] = useState('descubrir');
const [notification, setNotification] = useState(null);
const [showQueue, setShowQueue] = useState(false);

const [isPlaying, setIsPlaying] = useState(false);
const [isShuffle, setIsShuffle] = useState(false);
const [isResolvingAudio, setIsResolvingAudio] = useState(false);
const [currentTrack, setCurrentTrack] = useState(null);
const [progress, setProgress] = useState(0);
const [volume, setVolume] = useState(50);
const audioRef = useRef(null);
const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false);
const [fullScreenTab, setFullScreenTab] = useState('audio'); // 'audio', 'letras', 'visual'
const [is8DMode, setIs8DMode] = useState(false);
const [queue, setQueue] = useState([]);
const [queueIndex, setQueueIndex] = useState(0);
const [playlists, setPlaylists] = useState(() => {
  try {
    const local = localStorage.getItem("spotis_playlists");
    return local ? JSON.parse(local) : [{ id: 1, name: 'Mix Verano', tracks: [] }];
  } catch (e) {
    return [{ id: 1, name: 'Mix Verano', tracks: [] }];
  }
});
const [favorites, setFavorites] = useState(() => {
  try {
    const local = localStorage.getItem("spotis_favorites");
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
});

const [searchQuery, setSearchQuery] = useState('');
const [searchSuggestions, setSearchSuggestions] = useState([]);
const [searchResults, setSearchResults] = useState({ tracks: [], artists: [], albums: [], playlists: [] });
const [searchActiveTab, setSearchActiveTab] = useState('all');
const [isSearching, setIsSearching] = useState(false);
const [discoverTracks, setDiscoverTracks] = useState([]);
const [latinTracks, setLatinTracks] = useState([]);
const [chillTracks, setChillTracks] = useState([]);
const [workoutTracks, setWorkoutTracks] = useState([]);
const [activeHeroIndex, setActiveHeroIndex] = useState(0);

const [personalizedRecs, setPersonalizedRecs] = useState([]);
const [genreTracks, setGenreTracks] = useState([]);
const [localHistory, setLocalHistory] = useState([]);
const [topLocalArtist, setTopLocalArtist] = useState("");
const [topLocalArtistTracks, setTopLocalArtistTracks] = useState([]);
const [localPlaylistHistory, setLocalPlaylistHistory] = useState([]);
const [activeGenrePill, setActiveGenrePill] = useState('Lofi Chill');
const [userGenres, setUserGenres] = useState(['Lofi Chill', 'Reggaeton Hits', 'Indie Rock']);
const [showGenreModal, setShowGenreModal] = useState(false);

const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, track: null });

const sortPlaylistsByHistory = (pls) => {
    return [...pls].sort((a, b) => {
        const iA = localPlaylistHistory.findIndex(h => h.id === a.id);
        const iB = localPlaylistHistory.findIndex(h => h.id === b.id);
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return 0;
    });
};
const viewRef = useRef(null);
const heroRef = useRef(null);
const cursorDotRef = useRef(null);
const cursorAuraRef = useRef(null);

// Spotify Integration State (Simplified Direct Access Token flow)
const [spotifyProfile, setSpotifyProfile] = useState(null);
const [spotifyToken, setSpotifyToken] = useState(localStorage.getItem("spotify_access_token") || null);
const [showTokenModal, setShowTokenModal] = useState(false);
const [tempToken, setTempToken] = useState("");
const [spotifyTopTracks, setSpotifyTopTracks] = useState(null);
const [loadingTopTracks, setLoadingTopTracks] = useState(false);
const [createdPlaylistId, setCreatedPlaylistId] = useState(localStorage.getItem("spotify_created_playlist_id") || null);
const [creatingPlaylist, setCreatingPlaylist] = useState(false);
const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
const [syncingPlaylists, setSyncingPlaylists] = useState(false);
const [spotifyScopeWarning, setSpotifyScopeWarning] = useState(false);
const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);
const [newPlaylistName, setNewPlaylistName] = useState("");
const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
const [selectedLocalPlaylist, setSelectedLocalPlaylist] = useState(null);
const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState(null);

  const [customUser, setCustomUser] = useState(null);
  const [downloadedTracks, setDownloadedTracks] = useState(new Set());
  const [downloadingTracks, setDownloadingTracks] = useState(new Set());

  // Init localforage downloaded tracks
  useEffect(() => {
    localforage.keys().then(keys => {
      const trackIds = keys.filter(k => k.startsWith('track_')).map(k => k.replace('track_', ''));
      setDownloadedTracks(new Set(trackIds));
    }).catch(e => console.error("Error loading localforage keys:", e));
  }, []);

  const downloadTrack = async (e, track) => {
    e.stopPropagation();
    if (downloadedTracks.has(track.id)) return; // already downloaded
    
    setDownloadingTracks(prev => new Set(prev).add(track.id));
    showNotification(`Descargando "${track.title}"...`);
    
    try {
      const freeStreamUrl = await resolveFreeAudioStream(track.title, track.artist);
      const response = await fetch(freeStreamUrl);
      if (!response.ok) throw new Error("Failed to fetch audio blob");
      const blob = await response.blob();
      
      await localforage.setItem(`track_${track.id}`, blob);
      
      setDownloadedTracks(prev => {
        const next = new Set(prev);
        next.add(track.id);
        return next;
      });
      showNotification(`"${track.title}" guardada para modo offline`);
    } catch (err) {
      console.error("Error downloading track:", err);
      showNotification(`Error al descargar "${track.title}"`);
    } finally {
      setDownloadingTracks(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };
  const [authCheckingSession, setAuthCheckingSession] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandaloneApp(!!checkStandalone);

    // Spotify Auto-Login & Redirect Callback Exchange Engine
    const initSpotifySession = async () => {
      // A. Check if redirected back with authorization code
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      // Load Firestore central config and sync/populate defaults if missing
      const fbCreds = await fetchTokensFromFirebase();
      let clientId = localStorage.getItem("spotify_client_id") || fbCreds?.clientId || DEFAULT_SPOTIFY_CLIENT_ID;
      let clientSecret = localStorage.getItem("spotify_client_secret") || fbCreds?.clientSecret || DEFAULT_SPOTIFY_CLIENT_SECRET;

      if (!fbCreds || !fbCreds.clientId || !fbCreds.clientSecret) {
        await saveSpotifySettingsToFirebase(DEFAULT_SPOTIFY_CLIENT_ID, DEFAULT_SPOTIFY_CLIENT_SECRET);
      }

      if (!localStorage.getItem("spotify_client_id")) {
        localStorage.setItem("spotify_client_id", clientId);
        setSpotifyClientId(clientId);
      }
      if (!localStorage.getItem("spotify_client_secret")) {
        localStorage.setItem("spotify_client_secret", clientSecret);
        setSpotifyClientSecret(clientSecret);
      }
      
      if (code) {
        // Clean URL search parameters immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        
        const codeVerifier = localStorage.getItem("spotify_code_verifier");
        const redirectUri = window.location.origin + '/';
        
        showNotification("Sincronizando con Spotify...");
        
        try {
          const bodyParams = {
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri
          };
          if (codeVerifier) {
            bodyParams.code_verifier = codeVerifier;
          }
          if (clientSecret) {
            bodyParams.client_secret = clientSecret;
          }
          
          const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(bodyParams)
          });
          
          if (!res.ok) throw new Error("Auth code exchange failed: " + res.statusText);
          
          const data = await res.json();
          if (data.access_token) {
            localStorage.setItem("spotify_access_token", data.access_token);
            setSpotifyToken(data.access_token);
            
            const profile = await fetchSpotifyProfile(data.access_token);
            setSpotifyProfile(profile);
            
            if (data.refresh_token) {
              localStorage.setItem("spotify_refresh_token", data.refresh_token);
              await saveTokensToFirebase(clientId, data.refresh_token, profile.id);
            }
            
            showNotification(`¡Conectado como ${profile.display_name}!`);
            fetchSpotifyTopTracks(data.access_token);
            fetchSpotifyPlaylists(data.access_token, profile.id);
          }
        } catch (err) {
          console.error("Authentication callback exchange error:", err);
          if (err.message && err.message.includes("not registered in the developer dashboard")) {
            showNotification("Error: Usuario no registrado en Spotify Developer Console");
            alert("⚠️ Error de Spotify Developer Console:\n\nTu cuenta de Spotify aún no está registrada en el panel de desarrolladores de tu aplicación.\n\nPara solucionarlo:\n1. Ve a developer.spotify.com/dashboard\n2. Abre tu app y ve a 'Settings' -> 'Users and Access'\n3. Añade el correo electrónico asociado a tu cuenta de Spotify.");
          } else {
            showNotification(`Error de autenticación: ${err.message || "desconocido"}`);
          }
        }
        return;
      }
      
      // B. Standard Auto-Login from Firestore/LocalStorage
      let token = localStorage.getItem("spotify_access_token");
      let refreshToken = localStorage.getItem("spotify_refresh_token");
      
      if (clientId && refreshToken) {
        const freshToken = await refreshAccessToken(clientId, refreshToken, clientSecret);
        if (freshToken) {
          try {
            setSpotifyToken(freshToken);
            const profile = await fetchSpotifyProfile(freshToken);
            setSpotifyProfile(profile);
            fetchSpotifyTopTracks(freshToken);
            fetchSpotifyPlaylists(freshToken, profile.id);
          } catch (e) {
            console.error("Auto login profile load failed:", e);
          }
        }
      }
    };
    
    initSpotifySession();

    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
      setIsStandaloneApp(true);
      showNotification("¡Spotis instalada como app nativa!");
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User Choice:", outcome);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // --- CUSTOM AUTHENTICATION & SYNC LOGIC ---
  useEffect(() => {
    const activeUser = JSON.parse(localStorage.getItem("spotis_active_user"));
    if (activeUser) {
      setCustomUser(activeUser);
      loadOfflineData(activeUser.id);
    } else {
      loadOfflineData(null);
    }
    setAuthCheckingSession(false);
  }, []);

  // Save favorites & playlists to localStorage when changed
  useEffect(() => {
    if (!customUser) return;
    localStorage.setItem(`spotis_${customUser.id}_favorites`, JSON.stringify(favorites));
  }, [favorites, customUser]);

  useEffect(() => {
    if (!customUser) return;
    localStorage.setItem(`spotis_${customUser.id}_playlists`, JSON.stringify(playlists));
  }, [playlists, customUser]);

  const loadOfflineData = (uid = null) => {
    try {
      const prefix = uid ? `${uid}_` : '';
      const localFavs = JSON.parse(localStorage.getItem(`spotis_${prefix}favorites`)) || [];
      const localPls = JSON.parse(localStorage.getItem(`spotis_${prefix}playlists`)) || [{ id: 1, name: 'Mix Verano', tracks: [] }];
      setFavorites(localFavs);
      setPlaylists(localPls);
    } catch (e) {
      console.error("Error loading offline data:", e);
    }
  };;

  const loadUserDataFromFirestore = async () => {};

  const handleSignUp = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  if (!authEmail || !authPassword || !authName) {
    showNotification("Rellena todos los campos");
    return;
  }
  setAuthLoading(true);
  try {
    const users = JSON.parse(localStorage.getItem("spotis_users")) || [];
    if (users.find(u => u.email === authEmail.trim())) {
      showNotification("El usuario ya existe");
      setAuthLoading(false);
      return;
    }
    const newUser = {
      id: "local_" + Date.now().toString(),
      email: authEmail.trim(),
      password: authPassword,
      displayName: authName.trim(),
      avatar: null
    };
    users.push(newUser);
    localStorage.setItem("spotis_users", JSON.stringify(users));
    
    localStorage.setItem("spotis_active_user", JSON.stringify(newUser));
    setCustomUser(newUser);
    loadOfflineData(newUser.id);
    
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    showNotification("¡Cuenta creada correctamente!");
  } catch (err) {
    showNotification("Error interno");
  } finally {
    setAuthLoading(false);
  }
};

  const handleSignIn = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  if (!authEmail || !authPassword) {
    showNotification("Rellena todos los campos");
    return;
  }
  setAuthLoading(true);
  try {
    const users = JSON.parse(localStorage.getItem("spotis_users")) || [];
    const user = users.find(u => u.email === authEmail.trim() && u.password === authPassword);
    if (!user) {
      showNotification("Credenciales incorrectas");
      setAuthLoading(false);
      return;
    }
    
    localStorage.setItem("spotis_active_user", JSON.stringify(user));
    setCustomUser(user);
    loadOfflineData(user.id);
    
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    showNotification("¡Sesión iniciada!");
  } catch (err) {
    showNotification("Error interno");
  } finally {
    setAuthLoading(false);
  }
};

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      showNotification(`¡Bienvenido, ${user.displayName || user.email}!`);
    } catch (err) {
      console.error("Error Google sign in:", err);
      let errMsg = "Error al iniciar sesión con Google";
      if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Inicio de sesión cancelado";
      } else if (err.message) {
        errMsg = err.message;
      }
      showNotification(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("spotis_active_user");
      setCustomUser(null);
      loadOfflineData(null);
      showNotification("Sesión cerrada");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // --- PARTY MODE LOGIC ---
  const createPartyRoom = async () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, "PartyRooms", roomId), {
        hostId: "host-" + Date.now(),
        currentTrack: currentTrack || null,
        isPlaying: isPlaying,
        currentTime: audioRef.current ? audioRef.current.currentTime : 0,
        lastEmoji: null,
        updatedAt: Date.now()
      });
      setPartyRoomId(roomId);
      setIsPartyHost(true);
      setShowPartyModal(false);
      showNotification(`Sala creada: ${roomId}. ¡Compártelo!`);
      listenToPartyRoom(roomId, true);
    } catch(e) {
      console.error(e);
      showNotification("Error al crear la sala.");
    }
  };

  const joinPartyRoom = async (roomId) => {
    if (!roomId) return;
    try {
      const roomStr = roomId.toUpperCase();
      const snap = await getDoc(doc(db, "PartyRooms", roomStr));
      if (snap.exists()) {
        setPartyRoomId(roomStr);
        setIsPartyHost(false);
        setShowPartyModal(false);
        showNotification(`Unido a la sala: ${roomStr}`);
        listenToPartyRoom(roomStr, false);
      } else {
        showNotification("La sala no existe.");
      }
    } catch(e) {
      console.error(e);
    }
  };

  const leavePartyRoom = () => {
    if (partyUnsubRef.current) partyUnsubRef.current();
    if (isPartyHost && partyRoomId) {
       deleteDoc(doc(db, "PartyRooms", partyRoomId)).catch(e=>console.log(e));
    }
    setPartyRoomId(null);
    setIsPartyHost(false);
    showNotification("Has abandonado la sala.");
  };

  const listenToPartyRoom = (roomId, isHost) => {
    if (partyUnsubRef.current) partyUnsubRef.current();
    partyUnsubRef.current = onSnapshot(doc(db, "PartyRooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.lastEmoji && data.lastEmoji.time > partyHostLastSentRef.current) {
           partyHostLastSentRef.current = data.lastEmoji.time;
           spawnFlyingEmoji(data.lastEmoji.emoji);
        }

        if (!isHost) {
          if (data.currentTrack) {
             setCurrentTrack(prev => {
                if (!prev || prev.id !== data.currentTrack.id) return data.currentTrack;
                return prev;
             });
          }
          if (data.isPlaying !== undefined) {
             setIsPlaying(prev => {
                 if (prev !== data.isPlaying) {
                     if (audioRef.current) {
                         data.isPlaying ? audioRef.current.play() : audioRef.current.pause();
                     }
                     return data.isPlaying;
                 }
                 return prev;
             });
          }
          if (audioRef.current && data.currentTime !== undefined && Math.abs(audioRef.current.currentTime - data.currentTime) > 3) {
             audioRef.current.currentTime = data.currentTime;
          }
        }
      } else {
        leavePartyRoom();
        showNotification("La sala ha sido cerrada por el anfitrión.");
      }
    });
  };

  const sendReaction = async (emoji) => {
    spawnFlyingEmoji(emoji);
    if (partyRoomId) {
      const now = Date.now();
      if (now - partyHostLastSentRef.current > 1000) { // Max 1 per second to save writes
          partyHostLastSentRef.current = now;
          try {
              await updateDoc(doc(db, "PartyRooms", partyRoomId), {
                 lastEmoji: { emoji, time: now }
              });
          } catch(e) {}
      }
    }
  };

  const spawnFlyingEmoji = (emoji) => {
    const id = Date.now() + Math.random();
    setFlyingEmojis(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  // Sync host state
  useEffect(() => {
    if (isPartyHost && partyRoomId) {
       updateDoc(doc(db, "PartyRooms", partyRoomId), {
         currentTrack: currentTrack,
         isPlaying: isPlaying,
         currentTime: audioRef.current ? audioRef.current.currentTime : 0,
         updatedAt: Date.now()
       }).catch(e=>console.log(e));
    }
  }, [currentTrack, isPlaying, isPartyHost, partyRoomId]);
  // --- END PARTY MODE ---

const fetchSpotifyProfile = async (token) => {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!result.ok) {
    let errMsg = `HTTP Error ${result.status}`;
    try {
      const text = await result.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.error && parsed.error.message) {
            errMsg = parsed.error.message;
          }
        } catch (_) {
          errMsg = text;
        }
      }
    } catch (_) {}
    throw new Error(errMsg);
  }
  return await result.json();
};

const fetchSpotifyPlaylists = async (token, userId) => {
  setSyncingPlaylists(true);
  try {
    const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.items) {
      // Create the synthetic Liked Songs playlist
      const likedSongsPlaylist = {
        id: 'liked-songs',
        name: 'Canciones que te gustan',
        description: 'Tus canciones favoritas de Spotify',
        isSpotify: true,
        isLikedSongs: true,
        images: [{ url: 'https://images.unsplash.com/photo-1513829096900-fe0386e892c2?q=80&w=300' }],
        tracks: { total: 0 },
        uri: 'spotify:liked-songs',
        external_urls: { spotify: 'https://open.spotify.com/collection/tracks' }
      };

      try {
        const likedTracksRes = await fetch("https://api.spotify.com/v1/me/tracks?limit=1", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (likedTracksRes.ok) {
          const likedTracksData = await likedTracksRes.json();
          if (likedTracksData.total !== undefined) {
            likedSongsPlaylist.tracks.total = likedTracksData.total;
          }
          setSpotifyScopeWarning(false);
        } else if (likedTracksRes.status === 403) {
          setSpotifyScopeWarning(true);
        }
      } catch (e) {
        console.warn("Failed to fetch liked tracks total:", e);
      }

      const mergedPlaylists = [likedSongsPlaylist, ...data.items];
      setSpotifyPlaylists(mergedPlaylists);
      const activeUserId = userId || (spotifyProfile && spotifyProfile.id);
      if (activeUserId) {
        savePlaylistsToFirebase(mergedPlaylists, activeUserId);
      }
    }
  } catch (err) {
    console.error("Error fetching Spotify playlists:", err);
  } finally {
    setSyncingPlaylists(false);
  }
};

const trackPlaylistLocalHistory = (pl) => {
  try {
    const historyJson = localStorage.getItem('spotis_playlist_history');
    let history = historyJson ? JSON.parse(historyJson) : [];
    history = history.filter(p => p.id !== pl.id);
    history.unshift({
      id: pl.id,
      name: pl.name,
      cover: pl.cover || pl.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
      isSpotify: !!pl.isSpotify,
      tracks: pl.tracks ? pl.tracks.slice(0, 15) : []
    });
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('spotis_playlist_history', JSON.stringify(history));
    window.dispatchEvent(new Event('spotis_playlist_history_updated'));
  } catch (e) {
    console.error("Error saving local playlist history", e);
  }
};

const fetchSpotifyPlaylistTracks = async (playlistId, playlistName, playlistDesc) => {
  if (!spotifyToken) return;
  setLoadingPlaylistTracks(true);
  try {
    const url = playlistId === 'liked-songs'
      ? 'https://api.spotify.com/v1/me/tracks?limit=50'
      : `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`
      }
    });
    if (!res.ok) {
      if (res.status === 403) {
        setSpotifyScopeWarning(true);
        showNotification("Falta el permiso de favoritos. Reconecta tu cuenta de Spotify.");
        throw new Error("Permiso denegado por Spotify (403). Por favor, reconéctate.");
      }
      throw new Error("No se pudieron cargar las canciones de la playlist");
    }
    const data = await res.json();
    console.log("Spotify API items response:", data);
    console.log("First item from API:", data.items?.[0]);
    
    // Map Spotify tracks to our app track format
    const mappedTracks = (data.items || [])
      .map(item => {
        const track = item && (item.track || item.item);
        if (!track) return null;
        return {
          id: track.id,
          title: track.name,
          artist: track.artists ? track.artists.map(a => a.name).join(', ') : '',
          cover: track.album?.images?.[0]?.url || track.album?.images?.[2]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
          preview: track.preview_url || null
        };
      })
      .filter(Boolean);

    console.log("Mapped tracks count:", mappedTracks.length);
    console.log("Mapped tracks sample:", mappedTracks.slice(0, 3));

    const newPl = {
      id: playlistId,
      name: playlistName,
      description: playlistDesc || "Lista de reproducción de Spotify",
      isSpotify: true,
      tracks: mappedTracks
    };
    setSelectedLocalPlaylist(newPl);
    trackPlaylistLocalHistory(newPl);
  } catch (err) {
    console.error("Error fetching Spotify playlist tracks:", err);
    showNotification("Error al cargar canciones de la playlist");
  } finally {
    setLoadingPlaylistTracks(false);
  }
};

const selectPlaylist = (pl, isSpotify = false) => {
  if (isSpotify) {
    setCreatedPlaylistId(pl.id);
    fetchSpotifyPlaylistTracks(pl.id, pl.name, pl.description);
    showNotification(`Cargando "${pl.name}" de Spotify...`);
  } else {
    setSelectedLocalPlaylist(pl);
    trackPlaylistLocalHistory(pl);
  }
  
  // Scroll to track list smoothly on compact/mobile screens
  setTimeout(() => {
    const el = document.getElementById("selected-playlist-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 150);
};

const savePlaylistsToFirebase = async () => {};

const handleCreatePlaylist = async (name, description) => {
  const cleanName = name.trim();
  if (!cleanName) {
    showNotification("Introduce un nombre para la lista");
    return;
  }
  
  const newLocalPlaylist = {
    id: `local_${Date.now()}`,
    name: cleanName,
    description: description || "Creada desde Spotitoust",
    tracks: [],
    isLocalOnly: true
  };
  
  setPlaylists([...playlists, newLocalPlaylist]);
  showNotification(`Lista "${cleanName}" creada localmente`);
  
  if (customUser) {
    try {
      await setDoc(doc(db, "users", customUser.id, "playlists", newLocalPlaylist.id), newLocalPlaylist);
    } catch (err) {
      console.error("Error creating playlist in Firestore:", err);
    }
  }
  
  if (spotifyToken && spotifyProfile) {
    try {
      const res = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: cleanName,
          description: description || "Creada desde Spotitoust",
          public: false
        })
      });
      const data = await res.json();
      if (data.id) {
        showNotification(`¡Lista "${cleanName}" sincronizada con Spotify!`);
        fetchSpotifyPlaylists(spotifyToken, spotifyProfile.id);
      }
    } catch (err) {
      console.error("Error creating playlist in Spotify:", err);
    }
  }
  
  setShowNewPlaylistModal(false);
  setNewPlaylistName("");
  setNewPlaylistDesc("");
};

const addTrackToPlaylist = async (track, playlistId, isSpotifyPlaylist = false) => {
  if (isSpotifyPlaylist) {
    if (!spotifyToken) {
      showNotification("Por favor, conecta tu cuenta de Spotify");
      return;
    }
    showNotification("Añadiendo canción a tu Spotify...");
    try {
      let trackUri = track.uri;
      if (!trackUri) {
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(track.title + ' ' + track.artist)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        });
        const searchData = await searchRes.json();
        if (searchData.tracks?.items?.[0]) {
          trackUri = searchData.tracks.items[0].uri;
        }
      }
      
      if (!trackUri) {
        showNotification("No se encontró esta canción en Spotify");
        return;
      }
      
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items?uris=${trackUri}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const addData = await addRes.json();
      if (addData.error) {
        showNotification(`Error: ${addData.error.message}`);
      } else {
        showNotification("Canción añadida a tu playlist de Spotify");
        fetchSpotifyPlaylists(spotifyToken);
        trackSignal('ADD_PLAYLIST', track);
      }
    } catch (err) {
      console.error(err);
      showNotification("Error de red al añadir canción");
    }
  } else {
    let updatedPl = null;
    const newPlaylists = playlists.map(pl => {
      if (pl.id === playlistId) {
        if (pl.tracks.find(t => t.id === track.id)) {
          showNotification("La canción ya está en esta lista");
          return pl;
        }
        showNotification(`Añadida a la lista local "${pl.name}"`);
        trackSignal('ADD_PLAYLIST', track);
        updatedPl = { ...pl, tracks: [...pl.tracks, track] };
        return updatedPl;
      }
      return pl;
    });
    setPlaylists(newPlaylists);

    if (customUser && updatedPl) {
      try {
        await setDoc(doc(db, "users", customUser.id, "playlists", playlistId.toString()), updatedPl);
      } catch (err) {
        console.error("Error updating playlist tracks in Firestore:", err);
      }
    }
  }
};

const saveSpotifyUserToFirebase = async () => {};

const saveUserGenresToFirebase = async () => {};

const loadUserGenresFromFirebase = async () => {};

const fetchSpotifyTopTracks = async (token) => {
  setLoadingTopTracks(true);
  try {
    const res = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.error) {
      console.error("Error fetching top tracks:", data.error);
      setSpotifyTopTracks([]);
      if (data.error.status === 403) {
        showNotification("Permisos insuficientes. Asegúrate de incluir 'user-top-read' en tu token.");
      }
    } else if (data.items) {
      setSpotifyTopTracks(data.items);
    } else {
      setSpotifyTopTracks([]);
    }
  } catch (err) {
    console.error(err);
    setSpotifyTopTracks([]);
  } finally {
    setLoadingTopTracks(false);
  }
};

const createSpotifyPlaylist = async () => {
  if (!spotifyToken || !spotifyTopTracks || spotifyTopTracks.length === 0) return;
  setCreatingPlaylist(true);
  showNotification("Creando lista de reproducción en tu Spotify...");
  try {
    // 1. Crear playlist vacía
    const createRes = await fetch("https://api.spotify.com/v1/me/playlists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "My top tracks playlist",
        description: "Mis 5 canciones más escuchadas guardadas desde Spotitoust",
        public: false
      })
    });
    
    const playlist = await createRes.json();
    if (playlist.error) {
      showNotification(`Error: ${playlist.error.message}`);
      setCreatingPlaylist(false);
      return;
    }

    // 2. Obtener las URIs de los top tracks
    const trackUris = spotifyTopTracks.map(track => track.uri);

    // 3. Añadir tracks a la playlist
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/items?uris=${trackUris.join(',')}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${spotifyToken}`
      }
    });

    const addData = await addRes.json();
    if (addData.error) {
      showNotification(`Error al añadir canciones: ${addData.error.message}`);
    } else {
      localStorage.setItem("spotify_created_playlist_id", playlist.id);
      setCreatedPlaylistId(playlist.id);
      showNotification("¡Lista 'My top tracks playlist' creada con éxito!");
    }
  } catch (err) {
    console.error(err);
    showNotification("Error de red al crear la playlist");
  } finally {
    setCreatingPlaylist(false);
  }
};

const logoutSpotify = () => {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_created_playlist_id");
  setSpotifyToken(null);
  setSpotifyProfile(null);
  setSpotifyTopTracks(null);
  setSpotifyPlaylists([]);
  setCreatedPlaylistId(null);
  if (currentView === 'spotify') setCurrentView('descubrir');
  showNotification("Sesión de Spotify cerrada");
};

const handleSpotifyConnect = () => {
  setTempToken("");
  setShowTokenModal(true);
}

const handleSpotifyOAuthLogin = async (clientIdInput, clientSecretInput) => {
  const cleanId = (clientIdInput || "").trim();
  const cleanSecret = (clientSecretInput || "").trim();
  if (!cleanId) {
    showNotification("Introduce tu Spotify Client ID");
    return;
  }
  
  localStorage.setItem("spotify_client_id", cleanId);
  setSpotifyClientId(cleanId);
  
  if (cleanSecret) {
    localStorage.setItem("spotify_client_secret", cleanSecret);
    setSpotifyClientSecret(cleanSecret);
  } else {
    localStorage.removeItem("spotify_client_secret");
    setSpotifyClientSecret("");
  }
  
  const verifier = generateCodeVerifier();
  localStorage.setItem("spotify_code_verifier", verifier);
  
  const challenge = await generateCodeChallenge(verifier);
  const redirectUri = window.location.origin + '/';
  
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read'
  ].join(' ');
  
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: cleanId,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri
  }).toString();
  
  showNotification("Redirigiendo a Spotify...");
  window.location.href = authUrl.toString();
};;

const handleTokenSubmit = async (token) => {
  const cleanToken = token.trim();
  if (!cleanToken) {
    showNotification("Introduce un token válido");
    return;
  }

  showNotification("Verificando token...");
  try {
    const profile = await fetchSpotifyProfile(cleanToken);
    if (profile.error) {
      showNotification(`Error: ${profile.error.message || "Token inválido"}`);
    } else {
      localStorage.setItem("spotify_access_token", cleanToken);
      setSpotifyToken(cleanToken);
      setSpotifyProfile(profile);
      setShowTokenModal(false);
      showNotification(`¡Sincronizado con éxito como ${profile.display_name}!`);
      fetchSpotifyTopTracks(cleanToken);
      saveSpotifyUserToFirebase(profile);
      fetchSpotifyPlaylists(cleanToken, profile.id);
      loadUserGenresFromFirebase(profile.id);
    }
  } catch (err) {
    console.error(err);
    showNotification("No se pudo conectar con la API de Spotify");
  }
};

useEffect(() => {
// Inject PWA and Mobile meta tags dynamically (Removed, now managed in index.html)


audioRef.current = new YouTubeAudioBridge();
audioRef.current.volume = 0.5;

const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
script.onload = () => setGsapLoaded(true);
document.body.appendChild(script);

const loadInitialMusicCollections = async () => {
  try {
    const globalHits = await fetchAppleMusicTracks('top hits global', 25);
    if (globalHits && globalHits.length > 0) setDiscoverTracks(globalHits);

    const latinHits = await fetchAppleMusicTracks('top hits latino', 15);
    if (latinHits && latinHits.length > 0) setLatinTracks(latinHits);

    const chillHits = await fetchAppleMusicTracks('lofi chill vibes', 15);
    if (chillHits && chillHits.length > 0) setChillTracks(chillHits);

    const workoutHits = await fetchAppleMusicTracks('workout running dance', 15);
    if (workoutHits && workoutHits.length > 0) setWorkoutTracks(workoutHits);

    const initialGenreTracks = await fetchAppleMusicTracks('Lofi Chill', 15);
    if (initialGenreTracks) setGenreTracks(initialGenreTracks);
  } catch (err) {
    console.error("Error loading initial discover music collections:", err);
  }
};
loadInitialMusicCollections();

// Cargar perfil si ya existe un token en localStorage
const savedToken = localStorage.getItem("spotify_access_token");
if (savedToken) {
  fetchSpotifyProfile(savedToken).then(profile => {
    if (profile.error) {
      localStorage.removeItem("spotify_access_token");
      setSpotifyToken(null);
      setSpotifyProfile(null);
    } else {
      setSpotifyProfile(profile);
      fetchSpotifyTopTracks(savedToken);
      saveSpotifyUserToFirebase(profile);
      fetchSpotifyPlaylists(savedToken, profile.id);
      loadUserGenresFromFirebase(profile.id);
    }
  }).catch(() => {
    localStorage.removeItem("spotify_access_token");
    setSpotifyToken(null);
    setSpotifyProfile(null);
  });
}

return () => {
document.body.removeChild(script);
if(audioRef.current) audioRef.current.pause();
};
}, []);

useEffect(() => {
  if (currentView !== 'descubrir' || discoverTracks.length < 3) return;
  const timer = setInterval(() => {
    setActiveHeroIndex(prev => (prev + 1) % 3);
  }, 6000);
  return () => clearInterval(timer);
}, [currentView, discoverTracks]);

useEffect(() => {
  const fetchHybridRecommendations = async () => {
    const seeds = getRecommendationSeeds();
    
    // A. If they have Spotify, try to query Spotify's recommendation engine
    if (spotifyToken) {
      const validSpotifyTracks = seeds.seed_tracks.filter(id => typeof id === 'string' && id.length > 15 && !id.match(/^\d+$/)).slice(0, 3);
      
      let endpoint = "https://api.spotify.com/v1/recommendations?limit=15";
      let hasSeeds = false;

      // 1. Matriz Local (Fase A) - Content Based
      if (validSpotifyTracks.length > 0) {
        endpoint += `&seed_tracks=${validSpotifyTracks.join(',')}`;
        hasSeeds = true;
      } 
      // 2. Cold Start (Fase B) - Colaborativo
      else if (spotifyTopTracks && spotifyTopTracks.length > 0) {
        const topUris = spotifyTopTracks.slice(0, 3).map(t => t.id);
        endpoint += `&seed_tracks=${topUris.join(',')}`;
        hasSeeds = true;
      }

      if (hasSeeds) {
        try {
          const res = await spotifyFetch(endpoint);
          if (res.ok && res.status !== 204) {
            const text = await res.text();
            if (text) {
              const data = JSON.parse(text);
              if (data.tracks) {
                const mapped = data.tracks.map(track => ({
                  id: track.id,
                  title: track.name,
                  artist: track.artists ? track.artists.map(a => a.name).join(', ') : '',
                  cover: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
                  preview: track.preview_url || null
                })).filter(t => t.preview);
                
                setPersonalizedRecs(mapped);
                return;
              }
            }
          }
        } catch (err) {
          console.error("Error fetching Spotify recommendations:", err);
        }
      }
    }
    
    // B. Fallback / Non-Spotify users: Query Apple Music search based on seed artist
    const topArtistFallback = seeds.seed_artists && seeds.seed_artists.length > 0 ? seeds.seed_artists[0] : 'top hits global';
    try {
      const fallbackTracks = await fetchAppleMusicTracks(topArtistFallback, 15);
      if (fallbackTracks) {
        setPersonalizedRecs(fallbackTracks);
      }
    } catch (err) {
      console.error("Error fetching Apple Music recommendations:", err);
    }
  };

  fetchHybridRecommendations();
}, [spotifyToken, spotifyTopTracks, customUser]);

useEffect(() => {
  const loadLocalHistory = async () => {
    try {
      const historyJson = localStorage.getItem('spotis_play_history');
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setLocalHistory(history);
        
        if (history.length > 0) {
          const artistCounts = {};
          history.forEach(t => {
            if (t.artist) {
              artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
            }
          });
          const topArtist = Object.keys(artistCounts).reduce((a, b) => artistCounts[a] > artistCounts[b] ? a : b, null);
          
          if (topArtist) {
            setTopLocalArtist(topArtist);
            const recs = await fetchAppleMusicTracks(topArtist, 15);
            if (recs && recs.length > 0) {
              setTopLocalArtistTracks(recs);
            }
          }
        }
      }

      const playlistHistoryJson = localStorage.getItem('spotis_playlist_history');
      if (playlistHistoryJson) {
        setLocalPlaylistHistory(JSON.parse(playlistHistoryJson));
      }
    } catch (e) {
      console.error("Error loading local history", e);
    }
  };

  loadLocalHistory();

  const handleHistoryUpdate = () => loadLocalHistory();
  window.addEventListener('spotis_history_updated', handleHistoryUpdate);
  window.addEventListener('spotis_playlist_history_updated', handleHistoryUpdate);
  return () => {
      window.removeEventListener('spotis_history_updated', handleHistoryUpdate);
      window.removeEventListener('spotis_playlist_history_updated', handleHistoryUpdate);
  };
}, []);

useEffect(() => {
// Solo inicia cursores si el dispositivo no es táctil (aprox)
if (!gsapLoaded || !window.gsap || window.matchMedia("(pointer: coarse)").matches) return;

let xToDot = window.gsap.quickTo(cursorDotRef.current, "x", {duration: 0.1, ease: "power3"});
let yToDot = window.gsap.quickTo(cursorDotRef.current, "y", {duration: 0.1, ease: "power3"});
let xToAura = window.gsap.quickTo(cursorAuraRef.current, "x", {duration: 0.5, ease: "elastic.out(1, 0.5)"});
let yToAura = window.gsap.quickTo(cursorAuraRef.current, "y", {duration: 0.5, ease: "elastic.out(1, 0.5)"});

const moveCursor = (e) => { xToDot(e.clientX); yToDot(e.clientY); xToAura(e.clientX); yToAura(e.clientY); };
window.addEventListener("mousemove", moveCursor);
return () => window.removeEventListener("mousemove", moveCursor);
}, [gsapLoaded]);

useEffect(() => {
if (!gsapLoaded || !window.gsap || !viewRef.current) return;
const children = viewRef.current.children;
if (!children || children.length === 0) return;
window.gsap.fromTo(children,
{ y: 40, opacity: 0, rotationX: -5 },
{ y: 0, opacity: 1, rotationX: 0, duration: 0.6, stagger: 0.05, ease: "power3.out", clearProps: "all" }
);
}, [currentView, gsapLoaded, searchResults, discoverTracks]);

useEffect(() => {
  if (currentView === 'spotify' && spotifyToken && !spotifyTopTracks && !loadingTopTracks) {
    fetchSpotifyTopTracks(spotifyToken);
  }
}, [currentView, spotifyToken, spotifyTopTracks, loadingTopTracks]);

const handleHeroMouseMove = (e) => {
if (!heroRef.current || !gsapLoaded || window.matchMedia("(pointer: coarse)").matches) return;
const { left, top, width, height } = heroRef.current.getBoundingClientRect();
const x = (e.clientX - left) / width - 0.5;
const y = (e.clientY - top) / height - 0.5;
window.gsap.to(heroRef.current, { rotationY: x * 15, rotationX: -y * 15, transformPerspective: 1000, ease: "power2.out",
duration: 0.5 });
};
const handleHeroMouseLeave = () => {
if (!heroRef.current || !gsapLoaded || window.matchMedia("(pointer: coarse)").matches) return;
window.gsap.to(heroRef.current, { rotationY: 0, rotationX: 0, ease: "elastic.out(1, 0.3)", duration: 1 });
};

const showNotification = (msg) => {
setNotification(msg);
setTimeout(() => setNotification(null), 3000);
};

const fetchAppleMusicTracks = async (query, limit = 20) => {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`);
    const data = await res.json();
    return data.results.map(track => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      cover: track.artworkUrl100.replace('100x100', '600x600'),
      preview: track.previewUrl,
      album: track.collectionName
    })).filter(t => t.preview);
  } catch (e) {
    console.error(`Error loading collection ${query}:`, e);
    return [];
  }
};

const fetchSpotifyAlbumTracks = async (albumId, albumName, albumCover) => {
  if (!spotifyToken) return;
  setLoadingPlaylistTracks(true);
  try {
    const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    });
    if (!res.ok) throw new Error("No se pudieron cargar las canciones del álbum");
    const data = await res.json();
    const mappedTracks = (data.items || []).map(track => {
      if (!track) return null;
      return {
        id: track.id,
        title: track.name,
        artist: track.artists ? track.artists.map(a => a.name).join(', ') : '',
        cover: albumCover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
        preview: track.preview_url || null
      };
    }).filter(Boolean);

    const newPl = {
      id: `spotify-album-${albumId}`,
      name: albumName,
      description: `Álbum de Spotify`,
      isSpotify: true,
      tracks: mappedTracks
    };
    setSelectedLocalPlaylist(newPl);
    trackPlaylistLocalHistory(newPl);
    
    setTimeout(() => {
      const el = document.getElementById("selected-playlist-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  } catch (err) {
    console.error("Error loading Spotify album:", err);
    showNotification("Error al cargar canciones del álbum");
  } finally {
    setLoadingPlaylistTracks(false);
  }
};

const fetchITunesAlbumTracks = async (albumId, albumName, albumCover) => {
  setLoadingPlaylistTracks(true);
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`);
    if (!res.ok) throw new Error("No se pudieron cargar las canciones del álbum");
    const data = await res.json();
    const tracks = data.results.slice(1).map(track => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      cover: albumCover || track.artworkUrl100?.replace('100x100', '600x600'),
      preview: track.previewUrl,
      album: track.collectionName
    })).filter(t => t.preview);

    const newPl = {
      id: `itunes-album-${albumId}`,
      name: albumName,
      description: "Álbum de Apple Music",
      isSpotify: false,
      tracks: tracks
    };
    setSelectedLocalPlaylist(newPl);
    trackPlaylistLocalHistory(newPl);

    setTimeout(() => {
      const el = document.getElementById("selected-playlist-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  } catch (err) {
    console.error("Error loading iTunes album:", err);
    showNotification("Error al cargar canciones del álbum");
  } finally {
    setLoadingPlaylistTracks(false);
  }
};

const fetchAppleMusic = async (query) => {
  if (!query) return;
  setIsSearching(true);
  try {
    // Check if query is a Spotify Link/URI to directly resolve it
    if (spotifyToken) {
      const playlistReg = /(?:spotify:playlist:|spotify\.com\/playlist\/)([a-zA-Z0-9]{22})/;
      const albumReg = /(?:spotify:album:|spotify\.com\/album\/)([a-zA-Z0-9]{22})/;
      const trackReg = /(?:spotify:track:|spotify\.com\/track\/)([a-zA-Z0-9]{22})/;
      const artistReg = /(?:spotify:artist:|spotify\.com\/artist\/)([a-zA-Z0-9]{22})/;

      let match;
      if ((match = query.match(playlistReg))) {
        const pId = match[1];
        const res = await spotifyFetch(`https://api.spotify.com/v1/playlists/${pId}`);
        if (res.ok) {
          const p = await res.json();
          const foundPlaylist = {
            id: p.id,
            name: p.name,
            cover: p.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
            owner: p.owner?.display_name,
            tracksCount: p.tracks?.total,
            isSpotify: true
          };
          setSearchResults({
            tracks: [],
            artists: [],
            albums: [],
            playlists: [foundPlaylist]
          });
          setSearchActiveTab('playlists');
          setIsSearching(false);
          selectPlaylist(foundPlaylist, true);
          showNotification(`Playlist cargada: ${p.name}`);
          return;
        }
      } else if ((match = query.match(albumReg))) {
        const alId = match[1];
        const res = await spotifyFetch(`https://api.spotify.com/v1/albums/${alId}`);
        if (res.ok) {
          const al = await res.json();
          const foundAlbum = {
            id: al.id,
            name: al.name,
            artist: al.artists?.map(a => a.name).join(', ') || '',
            cover: al.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
            isSpotify: true
          };
          setSearchResults({
            tracks: [],
            artists: [],
            albums: [foundAlbum],
            playlists: []
          });
          setSearchActiveTab('albums');
          setIsSearching(false);
          fetchSpotifyAlbumTracks(al.id, al.name, foundAlbum.cover);
          showNotification(`Álbum cargado: ${al.name}`);
          return;
        }
      } else if ((match = query.match(trackReg))) {
        const trId = match[1];
        const res = await spotifyFetch(`https://api.spotify.com/v1/tracks/${trId}`);
        if (res.ok) {
          const t = await res.json();
          const foundTrack = {
            id: t.id,
            title: t.name,
            artist: t.artists?.map(a => a.name).join(', ') || '',
            cover: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
            preview: t.preview_url || null,
            album: t.album?.name,
            isSpotify: true
          };
          setSearchResults({
            tracks: [foundTrack],
            artists: [],
            albums: [],
            playlists: []
          });
          setSearchActiveTab('tracks');
          setIsSearching(false);
          playTrack(foundTrack, [foundTrack], 0);
          showNotification(`Canción cargada: ${t.name}`);
          return;
        }
      } else if ((match = query.match(artistReg))) {
        const arId = match[1];
        const res = await spotifyFetch(`https://api.spotify.com/v1/artists/${arId}`);
        if (res.ok) {
          const a = await res.json();
          const foundArtist = {
            id: a.id,
            name: a.name,
            cover: a.images?.[0]?.url || "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300",
            genres: a.genres || [],
            followers: a.followers?.total,
            isSpotify: true
          };
          setSearchResults({
            tracks: [],
            artists: [foundArtist],
            albums: [],
            playlists: []
          });
          setSearchActiveTab('artists');
          setIsSearching(false);
          setSearchQuery(a.name);
          return;
        }
      }
    }

    // If it's the discover view loading initial global tracks
    if (query.includes('top hits global') && !spotifyToken) {
      const formatted = await fetchAppleMusicTracks(query, 40);
      setSearchResults({ tracks: formatted, artists: [], albums: [], playlists: [] });
      setDiscoverTracks(formatted);
      setIsSearching(false);
      return;
    }

    if (spotifyToken) {
      const res = await spotifyFetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const tracks = (data.tracks?.items || []).map(t => ({
          id: t.id,
          title: t.name,
          artist: t.artists?.map(a => a.name).join(', ') || '',
          cover: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
          preview: t.preview_url || null,
          album: t.album?.name,
          isSpotify: true
        }));

        const artists = (data.artists?.items || []).map(a => ({
          id: a.id,
          name: a.name,
          cover: a.images?.[0]?.url || "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300",
          genres: a.genres || [],
          followers: a.followers?.total,
          isSpotify: true
        }));

        const albums = (data.albums?.items || []).map(al => ({
          id: al.id,
          name: al.name,
          artist: al.artists?.map(a => a.name).join(', ') || '',
          cover: al.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
          releaseDate: al.release_date,
          isSpotify: true
        }));

        const sPlaylists = (data.playlists?.items || []).map(p => ({
          id: p.id,
          name: p.name,
          cover: p.images?.[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
          owner: p.owner?.display_name,
          tracksCount: p.tracks?.total,
          isSpotify: true
        }));

        setSearchResults({ tracks, artists, albums, playlists: sPlaylists });
        if (query.includes('top hits global')) setDiscoverTracks(tracks);
        setIsSearching(false);
        return;
      }
    }

    // Fallback parallel queries to iTunes
    const [tracksRes, artistsRes, albumsRes] = await Promise.all([
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=musicArtist&limit=15`),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=15`)
    ]);

    const tracksData = tracksRes.ok ? await tracksRes.json() : { results: [] };
    const artistsData = artistsRes.ok ? await artistsRes.json() : { results: [] };
    const albumsData = albumsRes.ok ? await albumsRes.json() : { results: [] };

    const tracks = (tracksData.results || []).map(t => ({
      id: t.trackId,
      title: t.trackName,
      artist: t.artistName,
      cover: t.artworkUrl100?.replace('100x100', '600x600'),
      preview: t.previewUrl,
      album: t.collectionName,
      isSpotify: false
    })).filter(t => t.preview);

    const artists = (artistsData.results || []).map(a => ({
      id: a.artistId,
      name: a.artistName,
      cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300",
      genres: a.primaryGenreName ? [a.primaryGenreName] : [],
      isSpotify: false
    }));

    const albums = (albumsData.results || []).map(al => ({
      id: al.collectionId,
      name: al.collectionName,
      artist: al.artistName,
      cover: al.artworkUrl100?.replace('100x100', '600x600'),
      releaseDate: al.releaseDate,
      isSpotify: false
    }));

    // Find matching local playlists
    const localPlaylists = playlists.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
    ).map(p => ({
      id: p.id,
      name: p.name,
      cover: p.cover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
      owner: "Tú",
      tracksCount: p.tracks?.length || 0,
      isLocal: true,
      isSpotify: false
    }));

    setSearchResults({ tracks, artists, albums, playlists: localPlaylists });
    if (query.includes('top hits global')) setDiscoverTracks(tracks);
    setIsSearching(false);
  } catch (e) {
    console.error("Error API:", e);
    setIsSearching(false);
  }
};

useEffect(() => {
  // Local Instant Search Engine (Zero-Latency)
  if (searchQuery.length >= 2) {
    const dataset = [...favorites, ...localHistory, ...playlists.flatMap(p => p.tracks)];
    const uniqueMap = new Map();
    dataset.forEach(t => { if(t && t.id) uniqueMap.set(t.id, t); });
    setSearchSuggestions(advancedSearch(searchQuery, Array.from(uniqueMap.values()), 5));
  } else {
    setSearchSuggestions([]);
  }

  // Global Remote Search (Debounced)
  const delay = setTimeout(() => {
    if (searchQuery.length > 2) fetchAppleMusic(searchQuery);
    else setSearchResults({ tracks: [], artists: [], albums: [], playlists: [] });
  }, 600);
  
  return () => clearTimeout(delay);
}, [searchQuery, favorites, localHistory, playlists]);

const resolveFreeAudioStream = async (title, artist) => {
  const query = encodeURIComponent(`${artist} - ${title}`);
  
  // High reliability primary and fallback Invidious instances
  let instances = [
    "https://inv.thepixora.com",
    "https://yewtu.be",
    "https://invidious.io.lol",
    "https://vid.priv.au",
    "https://invidious.lunar.icu"
  ];
  
  // Try to fetch dynamic list from official API to self-heal
  try {
    const res = await fetch("https://api.invidious.io/instances.json?sort_by=type,users");
    if (res.ok) {
      const list = await res.json();
      if (list && Array.isArray(list)) {
        const fetched = list
          .filter(item => item[1] && item[1].type === 'https' && item[1].api === true && !item[1].uri.includes('.onion'))
          .map(item => item[1].uri);
        if (fetched.length > 0) {
          instances = [...new Set([...instances, ...fetched])];
        }
      }
    }
  } catch (e) {
    console.warn("Failed to fetch dynamic Invidious instances list, using static list:", e);
  }
  
  let fallbackVideoId = null;
  
  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/api/v1/search?q=${query}&type=video`;
      const res = await fetch(searchUrl);
      if (!res.ok) continue;
      const results = await res.json();
      if (results && Array.isArray(results) && results.length > 0) {
        const first = results[0];
        if (first.videoId) {
          console.log(`Resolved videoId "${first.videoId}" from instance "${instance}"`);
          fallbackVideoId = first.videoId;
          
          // Try to get direct audio stream URL with local=true
          try {
            const videoUrl = `${instance}/api/v1/videos/${first.videoId}?local=true`;
            const videoRes = await fetch(videoUrl);
            if (videoRes.ok) {
              const data = await videoRes.json();
              if (data && data.adaptiveFormats) {
                const audioFormats = data.adaptiveFormats.filter(f => f.type && f.type.startsWith('audio/'));
                if (audioFormats.length > 0) {
                  // Sort by quality/bitrate descending
                  audioFormats.sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
                  let audioUrl = audioFormats[0].url;
                  if (audioUrl) {
                    if (audioUrl.startsWith('//')) {
                      audioUrl = 'https:' + audioUrl;
                    } else if (audioUrl.startsWith('/')) {
                      audioUrl = instance.replace(/\/$/, '') + audioUrl;
                    }
                    console.log(`Resolved direct audio URL on instance "${instance}":`, audioUrl);
                    return audioUrl;
                  }
                }
              }
            }
          } catch (audioErr) {
            console.warn(`Failed to resolve direct audio on instance ${instance}:`, audioErr);
          }
        }
      }
    } catch (err) {
      console.warn(`Search failed on instance ${instance}:`, err);
    }
  }
  
  if (fallbackVideoId) {
    console.log(`No direct audio URL resolved. Falling back to videoId: ${fallbackVideoId}`);
    return fallbackVideoId;
  }
  
  throw new Error("No se pudo encontrar el tema");
};


const playTrack = async (track, newQueue = null, index = 0) => {
  if (!track) return;
  trackCompletedRef.current = false;

  // Guardar en historial local
  try {
    const historyJson = localStorage.getItem('spotis_play_history');
    let history = historyJson ? JSON.parse(historyJson) : [];
    history = history.filter(t => t.id !== track.id);
    history.unshift({
      id: track.id,
      title: track.title,
      artist: track.artist,
      cover: track.cover
    });
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('spotis_play_history', JSON.stringify(history));
    window.dispatchEvent(new Event('spotis_history_updated'));
  } catch (e) {
    console.error("Error saving local history", e);
  }

  if (newQueue) { setQueue(newQueue); setQueueIndex(index); }
  setCurrentTrack(track);
  setIsResolvingAudio(true);
  showNotification(`Buscando stream libre para "${track.title}"...`);

  try {
    // Check if downloaded in localforage
    const cachedBlob = await localforage.getItem(`track_${track.id}`);
    if (cachedBlob) {
      const objectUrl = URL.createObjectURL(cachedBlob);
      audioRef.current.src = objectUrl;
      await audioRef.current.play();
      setIsPlaying(true);
      showNotification("Reproduciendo archivo local (Offline)");
      setIsResolvingAudio(false);
      return;
    }

    const freeStreamUrl = await resolveFreeAudioStream(track.title, track.artist);
    audioRef.current.src = freeStreamUrl;
    await audioRef.current.play();
    setIsPlaying(true);
  } catch (e) {
    console.error("Free stream resolver failed, using preview fallback:", e);
    if (track.preview) {
      try {
        audioRef.current.src = track.preview;
        await audioRef.current.play();
        setIsPlaying(true);
        showNotification("Reproduciendo demo (fallback)");
      } catch (fallbackErr) {
        console.error("Fallback playback failed:", fallbackErr);
        showNotification("Error al reproducir pista");
      }
    } else {
      showNotification("Pista no disponible en streaming");
    }
  } finally {
    setIsResolvingAudio(false);
  }
};

const togglePlay = (e) => {
if(e) e.stopPropagation();
if (!currentTrack) return;
if (isPlaying) audioRef.current.pause();
else audioRef.current.play();
setIsPlaying(!isPlaying);
};

const playNext = useCallback((e) => {
    if(e) e.stopPropagation();
    // Fast skip detection
    if (audioRef.current && audioRef.current.currentTime > 0 && audioRef.current.currentTime < 30 && currentTrack) {
        trackSignal('SKIP_FAST', currentTrack);
    }
    if (queue.length > 0) {
        if (isShuffle) {
            const nextIndex = Math.floor(Math.random() * queue.length);
            playTrack(queue[nextIndex], queue, nextIndex);
        } else if (queueIndex < queue.length - 1) {
            playTrack(queue[queueIndex + 1], queue, queueIndex + 1);
        } else {
            setIsPlaying(false);
        }
    }
}, [queue, queueIndex, isShuffle]);

const playPrev = useCallback((e) => {
    if(e) e.stopPropagation();
    if (audioRef.current.currentTime > 3) audioRef.current.currentTime = 0;
    else if (queue.length > 0) {
        if (isShuffle) {
            const prevIndex = Math.floor(Math.random() * queue.length);
            playTrack(queue[prevIndex], queue, prevIndex);
        } else if (queueIndex > 0) {
            playTrack(queue[queueIndex - 1], queue, queueIndex - 1);
        }
    }
}, [queue, queueIndex, isShuffle]);

    useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => { 
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setProgress(pct); 
            if (pct > 90 && !trackCompletedRef.current && currentTrack) {
                trackCompletedRef.current = true;
                trackSignal('COMPLETE_TRACK', currentTrack);
            }
        }
    };
    const handleEnded = () => { setIsPlaying(false); setProgress(0); playNext(); };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => { audio.removeEventListener('timeupdate', updateProgress); audio.removeEventListener('ended',
    handleEnded); };
    }, [playNext]);

    useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                album: currentTrack.album || 'Spotitoust',
                artwork: [
                    { src: currentTrack.cover || 'https://via.placeholder.com/150', sizes: '96x96', type: 'image/png' },
                    { src: currentTrack.cover || 'https://via.placeholder.com/300', sizes: '128x128', type: 'image/png' },
                    { src: currentTrack.cover || 'https://via.placeholder.com/300', sizes: '192x192', type: 'image/png' },
                    { src: currentTrack.cover || 'https://via.placeholder.com/300', sizes: '256x256', type: 'image/png' },
                    { src: currentTrack.cover || 'https://via.placeholder.com/300', sizes: '384x384', type: 'image/png' },
                    { src: currentTrack.cover || 'https://via.placeholder.com/600', sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    }, [currentTrack]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    const playNextRef = useRef(playNext);
    const playPrevRef = useRef(playPrev);
    
    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

    useEffect(() => {
        playPrevRef.current = playPrev;
    }, [playPrev]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.setActionHandler('play', () => {
                    if (audioRef.current) {
                        audioRef.current.play();
                        setIsPlaying(true);
                    }
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    if (audioRef.current) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                    }
                });
                navigator.mediaSession.setActionHandler('previoustrack', () => {
                    if (playPrevRef.current) playPrevRef.current();
                });
                navigator.mediaSession.setActionHandler('nexttrack', () => {
                    if (playNextRef.current) playNextRef.current();
                });
            } catch (e) {
                console.warn("Media Session API action handlers error", e);
            }
        }
    }, []);

    const handleContextMenu = (e, track) => {
    e.preventDefault(); e.stopPropagation();
    // En móvil mostramos el menú abajo, en desktop en la posición del cursor
    const isMobile = window.innerWidth < 768; setContextMenu({ visible: true, x: isMobile ? 0 : e.clientX, y: isMobile ?
        window.innerHeight - 300 : e.clientY, track, isMobile }); }; useEffect(()=> {
        const closeMenu = () => setContextMenu({ ...contextMenu, visible: false });
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
        }, [contextMenu]);

        const toggleFavorite = async (track, e) => {
        if(e) e.stopPropagation();
        const isFav = favorites.find(t => t.id === track.id);
        if (isFav) {
          setFavorites(favorites.filter(t => t.id !== track.id));
          showNotification("Eliminado de Favoritos");
          if (customUser) {
            try {
              await deleteDoc(doc(db, "users", customUser.id, "favorites", track.id));
            } catch (err) {
              console.error("Error deleting favorite from Firestore:", err);
            }
          }
        } else {
          setFavorites([track, ...favorites]);
          showNotification("Guardado en Favoritos");
          trackSignal('FAVORITE', track);
          if (customUser) {
            try {
              await setDoc(doc(db, "users", customUser.id, "favorites", track.id), track);
            } catch (err) {
              console.error("Error saving favorite to Firestore:", err);
            }
          }
        }
        };

        const addToQueue = (track) => {
        if (!queue.find(t => t.id === track.id)) {
        setQueue([...queue, track]);
        showNotification("Añadido a la cola");
        }
        };

        const DesktopSidebar = () => (
        <div className="hidden md:flex w-64 glass-panel flex-col z-40 shrink-0 relative border-r border-white/5">
            <div className="p-8 flex items-center gap-3 group cursor-pointer no-select">
                <div
                    className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(29,185,84,0.3)] transition-transform duration-300 group-hover:scale-105">
                    <SpotisLogo className="w-full h-full" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white">Spotis</h1>
            </div>
            <nav className="flex-1 space-y-2 pb-6 overflow-y-auto custom-scroll">
                <div className="px-8 mb-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Navegar</div>
                <NavItemDesktop icon={Home} label="Descubrir" active={currentView==='descubrir' } onClick={()=>
                    setCurrentView('descubrir')} />

                        <div
                            className="px-8 mt-12 mb-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                            Tu Colección</div>
                        <NavItemDesktop icon={Heart} label="Favoritos" active={currentView==='favoritos' } onClick={()=>
                            setCurrentView('favoritos')} />
                            <NavItemDesktop icon={ListMusic} label="Playlists" active={currentView==='playlists' }
                                onClick={()=> setCurrentView('playlists')} />
            </nav>
            <div className="p-4 border-t border-white/5 bg-black/20">
                {spotifyProfile ? (
                    <div 
                        onClick={() => setCurrentView('spotify')}
                        className={`flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer no-select group/profile
                        ${currentView === 'spotify' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover/profile:border-[#1db954]/50 transition-colors">
                            {spotifyProfile.images && spotifyProfile.images[0] ? (
                                <img src={spotifyProfile.images[0].url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-black text-sm">
                                    {spotifyProfile.display_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1db954] rounded-full border-2 border-[#050505] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-white truncate leading-none mb-1 group-hover/profile:text-[#1db954] transition-colors">
                                {spotifyProfile.display_name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium truncate capitalize">
                                Spotify {spotifyProfile.product}
                            </p>
                        </div>
                    </div>
                ) : spotifyToken ? (
                    <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 animate-pulse">
                        <div className="relative w-10 h-10 rounded-full bg-white/10 shrink-0 flex items-center justify-center border border-white/5">
                            <SpotifyIcon className="w-5 h-5 text-gray-500 fill-current" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-3 bg-white/10 rounded-full w-2/3"></div>
                            <div className="h-2.5 bg-white/10 rounded-full w-1/2"></div>
                        </div>
                    </div>
                ) : customUser ? (
                    <div 
                        onClick={() => setCurrentView('perfil')}
                        className={`flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer no-select group/profile
                        ${currentView === 'perfil' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-800 flex items-center justify-center text-black font-black text-sm shadow-md shrink-0 border border-white/10 group-hover/profile:border-[#1db954]/50 transition-colors">
                            {customUser.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-white truncate leading-none mb-1 group-hover/profile:text-[#1db954] transition-colors">
                                {customUser.displayName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium truncate capitalize">
                                Cuenta Spotis
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <button 
                            onClick={handleSpotifyConnect}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1db954] text-black font-black text-xs rounded-xl hover:scale-102 active:scale-98 transition-all shadow-[0_0_20px_rgba(29,185,84,0.1)] no-select"
                        >
                            <SpotifyIcon className="w-3.5 h-3.5 text-black fill-current" />
                            Conectar Spotify
                        </button>
                        <button 
                            onClick={() => { setAuthMode("signin"); setShowAuthModal(true); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/10 hover:scale-102 active:scale-98 transition-all no-select"
                        >
                            Crear cuenta / Entrar
                        </button>
                    </div>
                )}
            </div>
        </div>
        );

        const MobileBottomNav = () => (
        <div
            className="md:hidden fixed bottom-0 left-0 w-full h-[80px] bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around pb-safe">
            <NavItemMobile icon={Home} label="Inicio" active={currentView==='descubrir' } onClick={()=>
                setCurrentView('descubrir')} />
            <NavItemMobile icon={ListMusic} label="Listas" active={currentView==='playlists' } onClick={()=>
                setCurrentView('playlists')} />
            <NavItemMobile icon={Heart} label="Favoritos" active={currentView==='favoritos' } onClick={()=>
                setCurrentView('favoritos')} />

            {spotifyProfile ? (
                <button 
                    onClick={() => setCurrentView('spotify')}
                    className="flex flex-col items-center justify-center gap-1 flex-1 p-2 no-select"
                >
                    <div className={`w-7 h-7 rounded-full overflow-hidden border transition-all shrink-0
                        ${currentView === 'spotify' ? 'border-[#1db954] scale-110 mb-1' : 'border-gray-500'}`}>
                        {spotifyProfile.images && spotifyProfile.images[0] ? (
                            <img src={spotifyProfile.images[0].url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-black text-xs">
                                {spotifyProfile.display_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold transition-all duration-300 ${currentView==='spotify' ? 'text-white opacity-100' : 'text-gray-500 opacity-0 h-0 overflow-hidden'}`}>
                        Perfil
                    </span>
                </button>
            ) : spotifyToken ? (
                <button 
                    disabled
                    className="flex flex-col items-center justify-center gap-1 flex-1 p-2 no-select opacity-50 animate-pulse"
                >
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <div className="w-3.5 h-3.5 border border-t-transparent border-[#1db954] rounded-full animate-spin"></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">Perfil</span>
                </button>
            ) : customUser ? (
                <button 
                    onClick={() => setCurrentView('perfil')}
                    className="flex flex-col items-center justify-center gap-1 flex-1 p-2 no-select"
                >
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-800 flex items-center justify-center text-black font-black text-xs border transition-all shrink-0
                        ${currentView === 'perfil' ? 'border-[#1db954] scale-110 mb-1' : 'border-gray-500'}`}>
                        {customUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-bold transition-all duration-300 ${currentView==='perfil' ? 'text-white opacity-100' : 'text-gray-500 opacity-0 h-0 overflow-hidden'}`}>
                        Perfil
                    </span>
                </button>
            ) : (
                <button 
                    onClick={() => { setAuthMode("signin"); setShowAuthModal(true); }}
                    className="flex flex-col items-center justify-center gap-1 flex-1 p-2 no-select"
                >
                    <User className={`w-6 h-6 transition-all shrink-0 ${currentView === 'perfil' ? 'text-[#1db954]' : 'text-gray-400'}`} />
                    <span className="text-[10px] font-bold text-gray-500">Entrar</span>
                </button>
            )}
        </div>
        );

        const TrackList = ({ tracks, contextQueue, startIndex = 0 }) => (
        <div className="space-y-1 md:space-y-2">
            {tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
            <div key={`${track.id}-${idx}`} onClick={()=> playTrack(track, contextQueue, idx)}
                onContextMenu={(e) => handleContextMenu(e, track)}
                className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-2xl transition-all duration-300 group
                cursor-pointer border border-transparent active:bg-white/10
                ${isCurrent ? 'bg-white/10 shadow-sm' : 'md:hover:bg-white/5'}`}
                >
                <div className="w-5 hidden md:block text-center text-xs font-medium text-gray-500 group-hover:hidden">
                    {isCurrent ?
                    <MiniVisualizer /> : (startIndex + idx + 1)}
                </div>
                <div className="w-5 hidden md:group-hover:flex items-center justify-center text-white">
                    {isCurrent && isPlaying ?
                    <Pause className="w-4 h-4" /> :
                    <Play className="w-4 h-4" />}
                </div>

                <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden shrink-0 shadow-md
                    ${isCurrent ? 'scale-105' : '' }`}>
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                    {isCurrent && <div
                        className="absolute inset-0 bg-black/40 flex md:hidden items-center justify-center">
                        <MiniVisualizer />
                    </div>}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm md:text-base truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'
                        }`}>{track.title}</p>
                    <p className="text-xs md:text-sm text-gray-400 truncate">{track.artist}</p>
                </div>

                <div className="flex items-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {downloadedTracks.has(track.id) ? (
                        <div className="p-3 text-[#1db954]" title="Descargado">
                            <CheckCircle className="w-5 h-5 fill-[#1db954] text-black" />
                        </div>
                    ) : downloadingTracks.has(track.id) ? (
                        <div className="p-3 text-[#1db954]">
                            <Loader className="w-5 h-5 animate-spin" />
                        </div>
                    ) : (
                        <button onClick={(e) => downloadTrack(e, track)} className="p-3 text-gray-400 hover:text-white" title="Descargar">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={(e)=> handleContextMenu(e, track)} className="p-3 text-gray-400 hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>
            );
            })}
        </div>
        );
        
        if (authCheckingSession) {
            return (
                <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#050505] relative selection:bg-[#1db954] selection:text-black">
                    <CustomStyles />
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#1db954]/5 rounded-full blur-[80px]"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-6 select-none">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-20 h-20 rounded-full border-2 border-[#1db954]/20 border-t-[#1db954] animate-spin"></div>
                            <SpotisLogo className="w-12 h-12 relative" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5 mt-2">
                            <span className="text-sm font-black text-white uppercase tracking-[0.25em] text-glow leading-none">Spotis</span>
                            <span className="text-[10px] font-bold text-gray-500 tracking-[0.1em]">Cargando tu sesión...</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (!customUser && !spotifyToken) {
            return (
                <div className="flex h-[100dvh] w-full bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-[#1db954] selection:text-black items-center justify-center p-4">
                    <CustomStyles />
                    <div id="cursor-dot" className="custom-cursor-element" ref={cursorDotRef}></div>
                    <div id="cursor-aura" className="custom-cursor-element" ref={cursorAuraRef}></div>

                    {/* Background Ambient */}
                    <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-[2s]">
                        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#1db954]/5 rounded-full blur-[100px] mix-blend-screen"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-emerald-800/5 rounded-full blur-[120px] mix-blend-screen"></div>
                        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
                    </div>

                    {notification && (
                        <div className="fixed top-safe pt-4 left-1/2 transform -translate-x-1/2 z-[200] bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-2 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
                            <div className="w-2 h-2 rounded-full bg-[#1db954] shadow-[0_0_10px_#1db954]"></div>
                            {notification}
                        </div>
                    )}

                    <div className="relative z-10 w-[95%] max-w-md animate-in zoom-in-95 duration-300">
                        {/* Brand Header */}
                        <div className="flex flex-col items-center gap-2 mb-8 select-none">
                            <SpotisLogo className="w-14 h-14" />
                            <div className="flex flex-col items-center gap-1 mt-1">
                                <span className="text-xl font-black text-white uppercase tracking-[0.25em] text-glow leading-none">Spotis</span>
                                <span className="text-[10px] font-bold text-gray-500 tracking-[0.1em]">Escucha a tu manera</span>
                            </div>
                        </div>

                        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <h3 className="text-2xl font-black mb-1 tracking-tighter text-glow flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-[#1db954]" />
                                {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">
                                {authMode === 'signin' ? 'Entra en tu cuenta de Spotis para acceder a tu música.' : 'Regístrate para guardar tus canciones, listas y personalizar tu feed.'}
                            </p>

                            {/* Navigation Tabs */}
                            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                <button
                                    onClick={() => setAuthMode("signin")}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${authMode === 'signin' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => setAuthMode("signup")}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${authMode === 'signup' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Registrarse
                                </button>
                            </div>

                            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                                {authMode === 'signup' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Nombre</label>
                                        <input
                                            type="text"
                                            placeholder="Tu nombre completo"
                                            value={authName}
                                            onChange={(e) => setAuthName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="usuario@correo.com"
                                        value={authEmail}
                                        onChange={(e) => setAuthEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full py-4 px-4 mt-4 rounded-2xl bg-[#1db954] hover:bg-[#1db954]/90 disabled:opacity-50 text-black font-black transition-all text-sm shadow-[0_4px_20px_rgba(29,185,84,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {authLoading ? 'Procesando...' : (authMode === 'signin' ? 'Entrar' : 'Registrarse')}
                                </button>
                            </form>

                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-bold uppercase tracking-wider">o</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSpotifyConnect}
                                className="w-full py-4 px-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 text-white font-black transition-all text-sm hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                            >
                                <SpotifyIcon className="w-5 h-5 text-[#1db954] fill-current animate-pulse" />
                                Iniciar Sesión con Spotify
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
        <div
            className="flex h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-[#1db954] selection:text-black">
            <CustomStyles />
            <div id="cursor-dot" className="custom-cursor-element" ref={cursorDotRef}></div>
            <div id="cursor-aura" className="custom-cursor-element" ref={cursorAuraRef}></div>

            {/* Background Ambient */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-[2s]">
                {currentTrack ? (
                <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-125 blur-[80px]"
                        style={{ backgroundImage: `url(${currentTrack.cover})` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]">
                    </div>
                </>
                ) : (
                <div
                    className="absolute top-0 left-0 w-full h-1/2 bg-[#1db954]/5 rounded-full blur-[100px] mix-blend-screen">
                </div>
                )}
                <div
                    className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay">
                </div>
            </div>

            {notification && (
            <div
                className="fixed top-safe pt-4 left-1/2 transform -translate-x-1/2 z-[200] bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-2 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
                <div className="w-2 h-2 rounded-full bg-[#1db954] shadow-[0_0_10px_#1db954]"></div>
                {notification}
            </div>
            )}

            {/* Responsive Context Menu */}
            {contextMenu.visible && contextMenu.track && (
            <>
                <div className="fixed inset-0 z-[290] bg-black/40 md:bg-transparent" onClick={()=>
                    setContextMenu({...contextMenu, visible: false})}></div>
                <div className={`fixed z-[300] glass-dropdown ${contextMenu.isMobile
                    ? 'bottom-0 left-0 w-full rounded-t-3xl pb-10 pt-4' : 'rounded-2xl min-w-[220px]' } animate-in
                    ${contextMenu.isMobile ? 'slide-in-from-bottom' : 'fade-in zoom-in-95' } duration-200`}
                    style={contextMenu.isMobile ? {} : { top: Math.min(contextMenu.y, window.innerHeight - 200), left:
                    Math.min(contextMenu.x, window.innerWidth - 220) }}>
                    {contextMenu.isMobile && <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>}
                    <div className="flex items-center gap-4 px-6 md:p-3 border-b border-white/10 mb-2 pb-4 md:pb-2">
                        <img src={contextMenu.track.cover} className="w-12 h-12 md:w-10 md:h-10 rounded-md"
                            alt="cover" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm md:text-base font-bold truncate">{contextMenu.track.title}</p>
                            <p className="text-xs text-gray-400 truncate">{contextMenu.track.artist}</p>
                        </div>
                    </div>
                    <div className="px-2">
                        <button onClick={()=> { playTrack(contextMenu.track, [contextMenu.track]);
                            setContextMenu({...contextMenu, visible: false}); }} className="w-full text-left px-4 py-4 md:py-3 text-sm md:hover:bg-white/10 rounded-xl flex items-center gap-4 transition-all">
                            <Play className="w-5 h-5 md:w-4 md:h-4 text-[#1db954]" /> Reproducir ahora
                        </button>
                        <button onClick={()=> { addToQueue(contextMenu.track); setContextMenu({...contextMenu, visible:
                            false}); }} className="w-full text-left px-4 py-4 md:py-3 text-sm md:hover:bg-white/10
                            rounded-xl flex items-center gap-4 transition-all">
                            <ListPlus className="w-5 h-5 md:w-4 md:h-4 text-blue-400" /> Añadir a la cola
                        </button>
                        <button onClick={()=> { setTrackToAddToPlaylist(contextMenu.track); setShowAddToPlaylistModal(true); setContextMenu({...contextMenu, visible: false}); }} className="w-full text-left px-4 py-4 md:py-3 text-sm md:hover:bg-white/10
                            rounded-xl flex items-center gap-4 transition-all">
                            <ListMusic className="w-5 h-5 md:w-4 md:h-4 text-emerald-400" /> Añadir a Playlist
                        </button>
                        <button onClick={()=> { toggleFavorite(contextMenu.track); setContextMenu({...contextMenu,
                            visible: false}); }} className="w-full text-left px-4 py-4 md:py-3 text-sm
                            md:hover:bg-white/10 rounded-xl flex items-center gap-4 transition-all">
                            <Heart className={`w-5 h-5 md:w-4 md:h-4 ${favorites.find(t=>
                                t.id===contextMenu.track.id)?'fill-pink-500 text-pink-500':'text-pink-500'}`} />
                                {favorites.find(t=>t.id===contextMenu.track.id) ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
                        </button>
                    </div>
                </div>
            </>
            )}

            <DesktopSidebar />

            <div className="flex-1 flex flex-col relative z-10 overflow-hidden w-full">

                <main
                    className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll px-4 md:px-10 pt-12 md:pt-20 pb-[160px] md:pb-40"
                    id="main-scroll">
                    <div ref={viewRef} className="max-w-[1400px] mx-auto min-h-full">

                        {/* VIEW: DESCUBRIR */}
                        {currentView === 'descubrir' && discoverTracks.length > 0 && (
                        <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            {/* Personalized Greeting & Status Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none text-glow flex items-center gap-3">
                                        <Sparkles className="w-8 h-8 text-[#1db954] animate-pulse" />
                                        {(() => {
                                            const hour = new Date().getHours();
                                            if (hour < 12) return "Buenos días";
                                            if (hour < 19) return "Buenas tardes";
                                            return "Buenas noches";
                                        })()}
                                    </h1>
                                    <p className="text-xs md:text-sm text-gray-400 font-medium mt-1">
                                        Bienvenido a tu panel de descubrimiento musical personalizado.
                                    </p>
                                </div>
                                <div className="self-start sm:self-auto shrink-0 flex items-center gap-3">
                                    {showInstallBtn && (
                                        <button 
                                            onClick={triggerInstall}
                                            className="flex items-center gap-2 bg-[#1db954]/20 border border-[#1db954]/30 hover:border-[#1db954] hover:bg-[#1db954]/30 text-[#1db954] px-4 py-2 rounded-2xl backdrop-blur-xl transition-all font-bold text-xs shadow-[0_0_15px_rgba(29,185,84,0.15)] hover:shadow-[0_0_20px_rgba(29,185,84,0.3)] animate-pulse"
                                            title="Instalar Spotis en tu dispositivo"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Instalar App</span>
                                        </button>
                                    )}
                                    {spotifyProfile ? (
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/5 pl-3 pr-4 py-2 rounded-2xl backdrop-blur-xl transition-all hover:bg-white/10">
                                            {spotifyProfile.images?.[0]?.url ? (
                                                <img src={spotifyProfile.images[0].url} className="w-6 h-6 rounded-full object-cover border border-[#1db954]/40" alt="avatar" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-black text-xs">
                                                    {spotifyProfile.display_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-gray-300">Conectado como <strong className="text-white">{spotifyProfile.display_name}</strong></span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleSpotifyConnect}
                                            className="bg-[#1db954]/10 border border-[#1db954]/25 hover:bg-[#1db954]/20 text-[#1db954] font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(29,185,84,0.1)] active:scale-95"
                                        >
                                            <SpotifyIcon className="w-4 h-4 text-[#1db954]" />
                                            Sincronizar Spotify
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Unified Premium Search Bar */}
                            <div className="relative w-full max-w-5xl mx-auto my-8 group z-50">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#1db954]/20 via-[#1ed760]/10 to-transparent rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 md:w-8 md:h-8 group-focus-within:text-[#1db954] transition-colors z-10" />
                                <input 
                                    type="text" 
                                    placeholder="Busca canciones, artistas, álbumes o pega un enlace de Spotify..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="relative w-full bg-black/40 backdrop-blur-2xl border border-white/10 focus:border-[#1db954]/50 hover:bg-white/5 text-white rounded-full py-5 pl-16 pr-6 md:py-6 md:pl-20 md:pr-8 text-lg md:text-2xl font-bold outline-none shadow-2xl transition-all"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95"
                                    >
                                        <X className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                )}

                                {/* Auto-Complete Dropdown / Search Engine Pro */}
                                {searchSuggestions.length > 0 && searchQuery.length >= 2 && (
                                    <div className="absolute top-full mt-4 w-full bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-300">
                                        <div className="p-3">
                                            <p className="px-4 py-2 text-[10px] font-black text-[#1db954] uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> Búsqueda Rápida Local
                                            </p>
                                            {searchSuggestions.map((track, idx) => (
                                                <div 
                                                    key={`sug-${track.id}-${idx}`}
                                                    onClick={() => {
                                                        playTrack(track, searchSuggestions, idx);
                                                        setSearchQuery('');
                                                    }}
                                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 cursor-pointer transition-all active:scale-95 group border border-transparent hover:border-white/5"
                                                >
                                                    <img src={track.cover} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" alt={track.title} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-base font-bold text-white truncate group-hover:text-[#1db954] transition-colors">{track.title}</h4>
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1db954] group-hover:text-black transition-colors shadow-lg">
                                                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>


                            {searchQuery === '' ? (
                            <>
                            {/* Preferred Genres Slider Bar */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#1db954]" />
                                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Tus Estilos Favoritos</h2>
                                    </div>
                                    <button 
                                        onClick={() => setShowGenreModal(true)}
                                        className="text-xs font-bold text-[#1db954] hover:text-white bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/20 px-3.5 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Editar Gustos
                                    </button>
                                </div>
                                <div className="flex overflow-x-auto gap-3 pb-2 custom-scroll scrollbar-thin">
                                    {userGenres.map((genre) => {
                                        const isActive = activeGenrePill === genre;
                                        return (
                                            <button 
                                                key={`pill-${genre}`}
                                                onClick={async () => {
                                                    setActiveGenrePill(genre);
                                                    const tracks = await fetchAppleMusicTracks(genre, 15);
                                                    if (tracks && tracks.length > 0) setGenreTracks(tracks);
                                                }}
                                                className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 active:scale-95 border
                                                    ${isActive 
                                                        ? 'bg-[#1db954] text-black border-[#1db954] shadow-[0_0_15px_rgba(29,185,84,0.35)] scale-105' 
                                                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                {genre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Ultra-Premium Hero Carousel Slider */}
                            {discoverTracks.length >= 3 && (
                                <section ref={heroRef} onMouseMove={handleHeroMouseMove} onMouseLeave={handleHeroMouseLeave}
                                    className="relative w-full h-[340px] md:h-[480px] rounded-3xl md:rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl border border-white/10"
                                    onClick={() => playTrack(discoverTracks[activeHeroIndex], discoverTracks, activeHeroIndex)}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* Carousel Background Cover with Crossfade Transition */}
                                    {discoverTracks.slice(0, 3).map((track, i) => (
                                        <div 
                                            key={`hero-bg-${track.id}`}
                                            className={`absolute inset-[-10%] bg-cover bg-center transition-all duration-1000 ease-in-out ${activeHeroIndex === i ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'}`}
                                            style={{ 
                                                backgroundImage: `url(${track.cover})`,
                                                transform: 'translateZ(-50px)' 
                                            }}
                                        />
                                    ))}

                                    {/* Dark Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-20" style={{ transform: 'translateZ(0)' }}></div>

                                    {/* Top Metadata Badge */}
                                    <div className="absolute top-6 right-6 md:top-10 md:right-10 bg-black/55 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 z-30"
                                        style={{ transform: 'translateZ(30px)' }}>
                                        <span className="w-2 h-2 rounded-full bg-[#1db954] shadow-[0_0_10px_#1db954] animate-pulse"></span>
                                        <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">Tendencia Mundial #{activeHeroIndex + 1}</span>
                                    </div>

                                    {/* Hero Info and Controls Container */}
                                    <div className="absolute bottom-6 left-6 right-6 md:bottom-14 md:left-14 md:right-14 flex items-end justify-between z-30"
                                        style={{ transform: 'translateZ(60px)' }}>
                                        <div className="max-w-[75%] md:max-w-3xl space-y-1 md:space-y-3">
                                            <span className="text-xs font-bold text-[#1db954] uppercase tracking-widest font-mono">Top Hit</span>
                                            <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-glow tracking-tighter leading-none line-clamp-2">
                                                {discoverTracks[activeHeroIndex]?.title}
                                            </h2>
                                            <p className="text-base md:text-2xl text-gray-300 font-medium truncate">
                                                {discoverTracks[activeHeroIndex]?.artist}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 md:gap-5">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveHeroIndex(prev => (prev - 1 + 3) % 3);
                                                }}
                                                className="w-10 h-10 md:w-14 md:h-14 bg-black/40 hover:bg-white/10 hover:text-white rounded-full flex items-center justify-center text-gray-300 border border-white/10 transition-all shrink-0 active:scale-90"
                                            >
                                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                            <button 
                                                className="w-14 h-14 md:w-24 md:h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white md:hover:scale-105 md:hover:bg-[#1db954] md:hover:text-black transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                            >
                                                {isPlaying && currentTrack?.id === discoverTracks[activeHeroIndex]?.id ?
                                                    <Pause className="w-6 h-6 md:w-10 md:h-10 fill-current" /> :
                                                    <Play className="w-6 h-6 md:w-10 md:h-10 ml-1 md:ml-2 fill-current" />
                                                }
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveHeroIndex(prev => (prev + 1) % 3);
                                                }}
                                                className="w-10 h-10 md:w-14 md:h-14 bg-black/40 hover:bg-white/10 hover:text-white rounded-full flex items-center justify-center text-gray-300 border border-white/10 transition-all shrink-0 active:scale-90"
                                            >
                                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual dots indicators */}
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-30">
                                        {[0, 1, 2].map((dotIndex) => (
                                            <button 
                                                key={`dot-${dotIndex}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveHeroIndex(dotIndex);
                                                }}
                                                className={`h-2 rounded-full transition-all duration-300 ${activeHeroIndex === dotIndex ? 'w-6 bg-[#1db954]' : 'w-2 bg-white/30'}`}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Local History: Tus escuchas recientes */}
                            {localHistory.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow flex items-center gap-2">
                                            <Clock className="w-6 h-6 text-[#1db954]" />
                                            Tus escuchas recientes
                                        </h2>
                                    </div>
                                    <PremiumScrollRow>
                                        {localHistory.map((track, i) => (
                                            <div 
                                                key={`history-${track.id}-${i}`}
                                                onClick={() => playTrack(track, localHistory, i)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Local Recommendations: Porque escuchas a [Artist] */}
                            {topLocalArtistTracks.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-[#1db954] animate-pulse" />
                                            Porque escuchas a {topLocalArtist}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium">
                                            Recomendaciones basadas en tu dispositivo.
                                        </p>
                                    </div>
                                    <PremiumScrollRow>
                                        {topLocalArtistTracks.map((track, i) => (
                                            <div 
                                                key={`local-rec-${track.id}-${i}`}
                                                onClick={() => playTrack(track, topLocalArtistTracks, i)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Local Playlist Cached Tracks */}
                            {localPlaylistHistory.map((pl, plIdx) => {
                                if (!pl.tracks || pl.tracks.length === 0) return null;
                                return (
                                <section key={`pl-cache-${pl.id}-${plIdx}`} className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow flex items-center gap-2">
                                            <ListMusic className="w-6 h-6 text-[#1db954]" />
                                            De tu playlist: {pl.name}
                                        </h2>
                                    </div>
                                    <PremiumScrollRow>
                                        {pl.tracks.map((track, i) => (
                                            <div 
                                                key={`pl-track-${track.id}-${i}`}
                                                onClick={() => playTrack(track, pl.tracks, i)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                                );
                            })}

                            {/* Quick Play Grid (Aterrizaje Rápido) */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#1db954]" />
                                    <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow">
                                        Escucha Rápida
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {discoverTracks.slice(3, 9).map((track, idx) => {
                                        const isCurrent = currentTrack?.id === track.id;
                                        return (
                                            <div 
                                                key={`quick-${track.id}-${idx}`}
                                                onClick={() => playTrack(track, discoverTracks.slice(3, 9), idx)}
                                                className="glass-panel p-2.5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all duration-300 border border-white/5 active:scale-95 cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <img src={track.cover} alt="Cover" className="w-14 h-14 rounded-xl object-cover shadow-md shrink-0" />
                                                    <div className="min-w-0">
                                                        <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                                                            {track.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                                                    </div>
                                                </div>
                                                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#1db954] hover:text-black flex items-center justify-center border border-white/10 group-hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                                                    {isCurrent && isPlaying ? (
                                                        <Pause className="w-4 h-4 fill-current" />
                                                    ) : (
                                                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Personalized Recommendations based on Spotify Artists */}
                            {spotifyProfile && personalizedRecs.length > 0 && (
                                <section className="space-y-6 animate-in fade-in duration-700">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-[#1db954] animate-pulse" />
                                            Recomendado para ti
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium">
                                            Porque escuchas mucho a <strong className="text-white">{spotifyTopTracks?.[0]?.artists?.[0]?.name || "tus artistas favoritos"}</strong> en Spotify.
                                        </p>
                                    </div>
                                    <PremiumScrollRow>
                                        {personalizedRecs.map((track, i) => (
                                            <div 
                                                key={`rec-${track.id}-${i}`}
                                                onClick={() => playTrack(track, personalizedRecs, i)}
                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Dynamic Chosen Genre Mix */}
                            {genreTracks.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow">
                                            Mix de {activeGenrePill}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium">
                                            Una lista de reproducción interactiva basada en tu estilo seleccionado.
                                        </p>
                                    </div>
                                    <PremiumScrollRow>
                                        {genreTracks.map((track, i) => (
                                            <div 
                                                key={`genre-track-${track.id}-${i}`}
                                                onClick={() => playTrack(track, genreTracks, i)}
                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Horizontal Slider: Éxitos Latino */}
                            {latinTracks.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow">Éxitos Latino</h2>
                                    <PremiumScrollRow>
                                        {latinTracks.map((track, i) => (
                                            <div 
                                                key={`latin-${track.id}-${i}`}
                                                onClick={() => playTrack(track, latinTracks, i)}
                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Horizontal Slider: Relax & Chill Vibes */}
                            {chillTracks.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow">Relax & Chill Vibes</h2>
                                    <PremiumScrollRow>
                                        {chillTracks.map((track, i) => (
                                            <div 
                                                key={`chill-${track.id}-${i}`}
                                                onClick={() => playTrack(track, chillTracks, i)}
                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent w-[170px] md:w-[200px] shrink-0 snap-start"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </PremiumScrollRow>
                                </section>
                            )}

                            {/* Workout Energy Grid */}
                            {workoutTracks.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow">Workout Energy</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                        {workoutTracks.slice(0, 10).map((track, i) => (
                                            <div 
                                                key={`workout-${track.id}-${i}`}
                                                onClick={() => playTrack(track, workoutTracks, i)}
                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                className="glass-panel p-4 rounded-[2rem] active:scale-95 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent"
                                            >
                                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                                            {isPlaying && currentTrack?.id === track.id ?
                                                                <Pause className="w-5 h-5 fill-current" /> :
                                                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white truncate text-sm md:text-base group-hover:text-[#1db954] transition-all">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                                    {/* Browse All Genres Section (moved from Explorar) */}
                                    <section className="space-y-6 pt-8 pb-12">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-glow">Navegar por géneros</h2>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                            {['Pop', 'Hip Hop', 'Rock', 'Electrónica', 'Jazz', 'Indie', 'Reggaeton', 'Metal'].map((genre, i) => (
                                                <div key={`browse-${genre}`} onClick={()=> setSearchQuery(genre)}
                                                    className="aspect-square rounded-2xl md:rounded-[2rem] p-4 md:p-6 cursor-pointer overflow-hidden relative shadow-lg border border-white/10 hover:border-white/30 active:scale-95 hover:scale-[1.02] transition-all group"
                                                    style={{ background: `linear-gradient(135deg, hsl(${i * 45}, 80%, 40%), hsl(${i * 45 + 30}, 80%, 20%))` }}
                                                >
                                                    <h3 className="text-xl md:text-3xl font-black text-white z-10 relative drop-shadow-md group-hover:scale-105 transition-transform">{genre}</h3>
                                                    <ListMusic className="absolute -right-4 -bottom-4 w-24 h-24 md:w-36 md:h-36 text-white/30 transform rotate-[20deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                            </>
                            ) : (
                                <div className="mt-4 animate-in fade-in duration-500">
                                    {isSearching ? (
                                        <div className="flex justify-center py-20">
                                            <div className="w-12 h-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (searchResults.tracks.length > 0 || searchResults.artists.length > 0 || searchResults.albums.length > 0 || searchResults.playlists.length > 0) ? (
                                        <div className="space-y-8">
                                            {/* Search Pills */}
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                                                {[
                                                    { id: 'all', label: 'Todo' },
                                                    { id: 'tracks', label: 'Canciones' },
                                                    { id: 'artists', label: 'Artistas' },
                                                    { id: 'albums', label: 'Álbumes' },
                                                    { id: 'playlists', label: 'Playlists' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setSearchActiveTab(tab.id)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                                            searchActiveTab === tab.id
                                                                ? 'bg-white text-black border-white'
                                                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {searchActiveTab === 'all' && (
                                                <>
                                                    <div className="flex flex-col lg:flex-row gap-8 md:gap-16">
                                                        {/* Best Match */}
                                                        {searchResults.tracks.length > 0 && (
                                                            <div className="w-full lg:w-2/5">
                                                                <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-8 text-white/90">Mejor resultado</h2>
                                                                <div onClick={()=> playTrack(searchResults.tracks[0], searchResults.tracks, 0)}
                                                                    className="glass-panel p-6 md:p-10 rounded-3xl relative overflow-hidden hover:bg-white/10 active:scale-95 transition-all border border-white/10 cursor-pointer group">
                                                                    <img src={searchResults.tracks[0].cover} alt="cover"
                                                                        className="w-24 h-24 md:w-40 md:h-40 rounded-full mb-6 md:mb-10 shadow-2xl object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                    <h3 className="text-3xl md:text-5xl font-black mb-2 line-clamp-2">{searchResults.tracks[0].title}</h3>
                                                                    <p className="text-lg md:text-2xl text-gray-400 mb-6">{searchResults.tracks[0].artist}</p>
                                                                    <div className="absolute bottom-6 right-6 w-12 h-12 md:w-16 md:h-16 bg-[#1db954] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.4)] group-hover:scale-110 transition-transform">
                                                                        {isPlaying && currentTrack?.id === searchResults.tracks[0].id ?
                                                                            <Pause className="w-6 h-6 md:w-8 md:h-8" /> :
                                                                            <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Songs */}
                                                        {searchResults.tracks.length > 0 && (
                                                            <div className="flex-1">
                                                                <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-8 text-white/90">Canciones</h2>
                                                                <TrackList tracks={searchResults.tracks.slice(1, 6)} contextQueue={searchResults.tracks} startIndex={1} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Artists Section */}
                                                    {searchResults.artists.length > 0 && (
                                                        <div>
                                                            <h2 className="text-2xl font-black mb-4 text-white/90">Artistas</h2>
                                                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
                                                                {searchResults.artists.map(artist => (
                                                                    <div 
                                                                        key={artist.id} 
                                                                        onClick={() => { setSearchQuery(artist.name); setSearchActiveTab('all'); }}
                                                                        className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center w-36 shrink-0 hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
                                                                    >
                                                                        <img src={artist.cover} alt={artist.name} className="w-24 h-24 rounded-full object-cover shadow-md mb-3" />
                                                                        <p className="font-bold text-white text-sm truncate w-full">{artist.name}</p>
                                                                        <p className="text-xs text-gray-400 mt-1">Artista</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Albums Section */}
                                                    {searchResults.albums.length > 0 && (
                                                        <div>
                                                            <h2 className="text-2xl font-black mb-4 text-white/90">Álbumes</h2>
                                                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
                                                                {searchResults.albums.map(album => (
                                                                    <div 
                                                                        key={album.id} 
                                                                        onClick={() => {
                                                                            if (album.isSpotify) {
                                                                                fetchSpotifyAlbumTracks(album.id, album.name, album.cover);
                                                                            } else {
                                                                                fetchITunesAlbumTracks(album.id, album.name, album.cover);
                                                                            }
                                                                        }}
                                                                        className="glass-panel p-4 rounded-2xl flex flex-col w-36 shrink-0 hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
                                                                    >
                                                                        <img src={album.cover} alt={album.name} className="w-28 h-28 rounded-xl object-cover shadow-md mb-3" />
                                                                        <p className="font-bold text-white text-sm truncate w-full">{album.name}</p>
                                                                        <p className="text-xs text-gray-400 mt-1 truncate w-full">{album.artist}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Playlists Section */}
                                                    {searchResults.playlists.length > 0 && (
                                                        <div>
                                                            <h2 className="text-2xl font-black mb-4 text-white/90">Playlists</h2>
                                                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
                                                                {searchResults.playlists.map(pl => (
                                                                    <div 
                                                                        key={pl.id} 
                                                                        onClick={() => {
                                                                            if (pl.isLocal) {
                                                                                selectPlaylist(pl, false);
                                                                            } else {
                                                                                selectPlaylist(pl, true);
                                                                            }
                                                                        }}
                                                                        className="glass-panel p-4 rounded-2xl flex flex-col w-36 shrink-0 hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
                                                                    >
                                                                        <img src={pl.cover} alt={pl.name} className="w-28 h-28 rounded-xl object-cover shadow-md mb-3" />
                                                                        <p className="font-bold text-white text-sm truncate w-full">{pl.name}</p>
                                                                        <p className="text-xs text-gray-400 mt-1 truncate w-full">De {pl.owner || 'Spotify'}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {searchActiveTab === 'tracks' && (
                                                <div className="space-y-4">
                                                    <h2 className="text-2xl md:text-3xl font-black text-white/90">Canciones</h2>
                                                    <TrackList tracks={searchResults.tracks} contextQueue={searchResults.tracks} startIndex={0} />
                                                </div>
                                            )}

                                            {searchActiveTab === 'artists' && (
                                                <div className="space-y-6">
                                                    <h2 className="text-2xl md:text-3xl font-black text-white/90">Artistas</h2>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {searchResults.artists.map(artist => (
                                                            <div 
                                                                key={artist.id} 
                                                                onClick={() => { setSearchQuery(artist.name); setSearchActiveTab('all'); }}
                                                                className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5 group"
                                                            >
                                                                <img src={artist.cover} alt={artist.name} className="w-32 h-32 rounded-full object-cover shadow-lg mb-4 group-hover:scale-105 transition-transform" />
                                                                <p className="font-bold text-white text-base truncate w-full">{artist.name}</p>
                                                                <p className="text-xs text-gray-400 mt-1">Artista</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {searchActiveTab === 'albums' && (
                                                <div className="space-y-6">
                                                    <h2 className="text-2xl md:text-3xl font-black text-white/90">Álbumes</h2>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {searchResults.albums.map(album => (
                                                            <div 
                                                                key={album.id} 
                                                                onClick={() => {
                                                                    if (album.isSpotify) {
                                                                        fetchSpotifyAlbumTracks(album.id, album.name, album.cover);
                                                                    } else {
                                                                        fetchITunesAlbumTracks(album.id, album.name, album.cover);
                                                                    }
                                                                }}
                                                                className="glass-panel p-4 rounded-3xl flex flex-col hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5 group"
                                                            >
                                                                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg mb-4 bg-white/5">
                                                                    <img src={album.cover} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                </div>
                                                                <p className="font-bold text-white text-base truncate w-full">{album.name}</p>
                                                                <p className="text-xs text-gray-400 mt-1 truncate w-full">{album.artist}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {searchActiveTab === 'playlists' && (
                                                <div className="space-y-6">
                                                    <h2 className="text-2xl md:text-3xl font-black text-white/90">Playlists</h2>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {searchResults.playlists.map(pl => (
                                                            <div 
                                                                key={pl.id} 
                                                                onClick={() => {
                                                                    if (pl.isLocal) {
                                                                        selectPlaylist(pl, false);
                                                                    } else {
                                                                        selectPlaylist(pl, true);
                                                                    }
                                                                }}
                                                                className="glass-panel p-4 rounded-3xl flex flex-col hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5 group"
                                                            >
                                                                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg mb-4 bg-white/5">
                                                                    <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                </div>
                                                                <p className="font-bold text-white text-base truncate w-full">{pl.name}</p>
                                                                <p className="text-xs text-gray-400 mt-1 truncate w-full">De {pl.owner || 'Spotify'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-gray-500">
                                            <p className="text-xl">No se encontraron resultados para "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* GENRE PREFERENCES MODAL */}
                            {showGenreModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg animate-in fade-in duration-300">
                                    <div className="glass-panel-heavy p-6 md:p-8 rounded-[2.5rem] w-full max-w-xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-6 h-6 text-[#1db954] animate-pulse" />
                                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">Personaliza tu Experiencia</h3>
                                            </div>
                                            <button 
                                                onClick={() => setShowGenreModal(false)}
                                                className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-all active:scale-90"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <p className="text-xs md:text-sm text-gray-400 mb-6 leading-relaxed">
                                            Selecciona tus estilos favoritos para personalizar las recomendaciones en tu panel de control. Tus preferencias se guardarán en Firestore.
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scroll mb-8">
                                            {[
                                                'Lofi Chill', 'Reggaeton Hits', 'Pop Latino', 'Synthwave', 
                                                'Indie Rock', 'Electronic', 'Jazz Vibe', 'Heavy Metal', 
                                                'Classical Vibe', 'Hip Hop'
                                            ].map((genre) => {
                                                const isSelected = userGenres.includes(genre);
                                                return (
                                                    <button 
                                                        key={`select-${genre}`}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                if (userGenres.length <= 1) {
                                                                    showNotification("Debes seleccionar al menos un estilo");
                                                                    return;
                                                                }
                                                                setUserGenres(userGenres.filter(g => g !== genre));
                                                            } else {
                                                                setUserGenres([...userGenres, genre]);
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all duration-300 active:scale-95
                                                            ${isSelected 
                                                                ? 'bg-[#1db954]/10 text-[#1db954] border-[#1db954] shadow-[0_0_15px_rgba(29,185,84,0.08)]' 
                                                                : 'bg-white/5 text-gray-300 border-white/5 hover:border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <span>{genre}</span>
                                                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse"></span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={async () => {
                                                    // Guardar en Firebase si hay perfil
                                                    const activeId = spotifyProfile?.id || 'local_user';
                                                    await saveUserGenresToFirebase(activeId, userGenres);
                                                    
                                                    // Aplicar el primer género de la lista
                                                    if (userGenres[0]) {
                                                        setActiveGenrePill(userGenres[0]);
                                                        const tracks = await fetchAppleMusicTracks(userGenres[0], 15);
                                                        if (tracks && tracks.length > 0) setGenreTracks(tracks);
                                                    }
                                                    
                                                    showNotification("¡Gustos guardados y aplicados con éxito!");
                                                    setShowGenreModal(false);
                                                }}
                                                className="flex-1 bg-[#1db954] hover:bg-[#1ed760] text-black font-black text-sm py-3.5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center"
                                            >
                                                Guardar y Aplicar
                                            </button>
                                            <button 
                                                onClick={() => setShowGenreModal(false)}
                                                className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold text-sm py-3.5 rounded-2xl border border-white/5 active:scale-95 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        )}



                        {/* VIEW: FAVORITOS */}
                        {currentView === 'favoritos' && (
                        <div>
                            <div
                                className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-10 md:mb-16 mt-4 md:mt-8">
                                <div
                                    className="w-32 h-32 md:w-56 md:h-56 rounded-2xl md:rounded-[3rem] bg-gradient-to-br from-indigo-500 to-pink-600 flex items-center justify-center shadow-2xl shrink-0">
                                    <Heart className="w-16 h-16 md:w-24 md:h-24 text-white fill-white shadow-2xl" />
                                </div>
                                <div>
                                    <h1 className="text-5xl md:text-8xl font-black text-white mb-2 tracking-tighter">
                                        Favoritos</h1>
                                    <p className="text-lg md:text-2xl text-gray-300">{favorites.length} canciones</p>
                                </div>
                            </div>
                            {favorites.length > 0 ? (
                            <div className="glass-panel rounded-3xl p-4 md:p-8">
                                <TrackList tracks={favorites} contextQueue={favorites} />
                            </div>
                            ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p>Aún no hay favoritos.</p>
                            </div>
                            )}
                        </div>
                        )}

                        {/* VIEW: SPOTIFY PROFILE */}
                        {currentView === 'spotify' && spotifyProfile && (
                        <div>
                            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-10 md:mb-16 mt-4 md:mt-8 animate-in slide-in-from-top-10 duration-500">
                                <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(29,185,84,0.3)] shrink-0 border-2 border-[#1db954]/50 group">
                                    {spotifyProfile.images && spotifyProfile.images[0] ? (
                                        <img src={spotifyProfile.images[0].url} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-black text-6xl">
                                            {spotifyProfile.display_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-[#1db954]/10 border border-[#1db954]/30 rounded-full px-4 py-1.5 inline-flex items-center gap-2 text-[#1db954] text-xs font-black uppercase tracking-widest leading-none">
                                        <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse"></span>
                                        Spotify {spotifyProfile.product}
                                    </div>
                                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none text-glow">
                                        {spotifyProfile.display_name}
                                    </h1>
                                    <p className="text-sm md:text-base text-gray-400 font-medium">
                                        {spotifyProfile.followers?.total || 0} seguidores • {spotifyProfile.country}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in slide-in-from-bottom-10 duration-500">
                                {/* Left Side: Account Details + Top 5 Spotify Tracks */}
                                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                                    
                                    {/* PWA App Install Box */}
                                    <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 space-y-4 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#1db954]/5 to-transparent pointer-events-none" />
                                        <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow border-b border-white/5 pb-4 flex items-center gap-2.5">
                                            <Tv className="w-6 h-6 text-[#1db954]" />
                                            Spotis para Escritorio y Móvil
                                        </h2>
                                        <p className="text-sm text-gray-400">
                                            Descarga Spotis en tu ordenador o smartphone para disfrutar de una experiencia nativa sin barras de navegador, con carga de red ultrarrápida y atajos de teclado.
                                        </p>
                                        
                                        {isStandaloneApp ? (
                                            <div className="flex items-center gap-2.5 text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/20 px-4 py-3 rounded-2xl text-xs font-bold w-fit">
                                                <Sparkles className="w-4 h-4 text-[#1db954]" />
                                                <span>✓ ¡Spotis está instalada como aplicación nativa!</span>
                                            </div>
                                        ) : showInstallBtn ? (
                                            <div className="space-y-4 pt-2">
                                                <button 
                                                    onClick={triggerInstall}
                                                    className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1db954]/90 text-black px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-[0_4px_15px_rgba(29,185,84,0.3)] hover:scale-105 active:scale-95"
                                                >
                                                    <Plus className="w-4 h-4 text-black" />
                                                    <span>Descargar Spotis App</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 space-y-1.5 bg-white/5 p-4 rounded-2xl">
                                                <h4 className="font-bold text-white text-xs">Instrucciones de Instalación:</h4>
                                                <p>• <strong>Chrome / Edge (PC/Android)</strong>: Haz clic en el icono de instalación ⊕ en la barra de direcciones superior.</p>
                                                <p>• <strong>Safari (iOS/iPhone)</strong>: Pulsa el botón "Compartir" ⎋ y selecciona "Añadir a la pantalla de inicio".</p>
                                            </div>
                                        )}
                                    </div>

{/* Account Details Box */}
                                    <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
                                        <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow border-b border-white/5 pb-4">
                                            Detalles de la Cuenta
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID de Usuario</p>
                                                <p className="font-mono text-white select-all bg-white/5 px-3 py-2 rounded-xl border border-white/5 inline-block">
                                                    {spotifyProfile.id}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo Electrónico</p>
                                                <p className="text-white bg-white/5 px-3 py-2 rounded-xl border border-white/5 inline-block">
                                                    {spotifyProfile.email || 'No proporcionado'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spotify URI</p>
                                                <a 
                                                    href={spotifyProfile.uri} 
                                                    className="text-[#1db954] hover:underline font-mono bg-[#1db954]/5 px-3 py-2 rounded-xl border border-[#1db954]/10 inline-flex items-center gap-1.5"
                                                >
                                                    <Music className="w-3.5 h-3.5" />
                                                    {spotifyProfile.uri}
                                                </a>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enlace del Perfil</p>
                                                <a 
                                                    href={spotifyProfile.external_urls?.spotify} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-blue-400 hover:underline font-mono bg-blue-500/5 px-3 py-2 rounded-xl border border-blue-500/10 inline-flex items-center gap-1.5"
                                                >
                                                    <span>🔗 Open Profile</span>
                                                </a>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-white/5">
                                            <button 
                                                onClick={logoutSpotify}
                                                className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/25 hover:text-white font-bold text-sm transition-all"
                                            >
                                                Cerrar Sesión de Spotify
                                            </button>
                                        </div>
                                    </div>

                                    {/* Spotify Top Tracks Section */}
                                    <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow">
                                                    Mis 5 mejores canciones
                                                </h2>
                                                <p className="text-xs text-gray-400">Tus temas más escuchados en Spotify a largo plazo</p>
                                            </div>
                                            
                                            {spotifyTopTracks && spotifyTopTracks.length > 0 && (
                                                <button
                                                    onClick={createSpotifyPlaylist}
                                                    disabled={creatingPlaylist}
                                                    className="px-4 py-2.5 bg-[#1db954] text-black font-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all text-xs rounded-xl shadow-[0_0_15px_rgba(29,185,84,0.3)] flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                                                >
                                                    {creatingPlaylist ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <ListPlus className="w-3.5 h-3.5" />
                                                    )}
                                                    {creatingPlaylist ? "Guardando..." : "Guardar en Playlist"}
                                                </button>
                                            )}
                                        </div>

                                        {loadingTopTracks ? (
                                            <div className="flex justify-center py-10">
                                                <div className="w-8 h-8 border-3 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : spotifyTopTracks && spotifyTopTracks.length > 0 ? (
                                            <div className="space-y-3">
                                                {spotifyTopTracks.map((track, i) => (
                                                    <div 
                                                        key={track.id} 
                                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                                                    >
                                                        <span className="font-mono text-sm font-bold text-gray-500 w-4 text-center">
                                                            {i + 1}
                                                        </span>
                                                        <img 
                                                            src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url} 
                                                            alt={track.name} 
                                                            className="w-12 h-12 rounded-xl object-cover shadow-md"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-white truncate text-sm">
                                                                {track.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                                {track.artists.map(a => a.name).join(', ')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                                                                {Math.floor(track.duration_ms / 60000)}:
                                                                {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setSearchQuery(track.name);
                                                                    setCurrentView('explorar');
                                                                    showNotification(`Buscando "${track.name}" en Spotitoust...`);
                                                                }}
                                                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#1db954]/20 hover:text-[#1db954] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                                title="Buscar en Spotitoust"
                                                            >
                                                                <Search className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-sm text-gray-500">
                                                No se pudieron obtener tus canciones favoritas. Asegúrate de incluir el permiso <code className="text-white bg-white/10 px-1 py-0.5 rounded">user-top-read</code> al obtener tu token.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Sync Box + Embed Player */}
                                <div className="space-y-6 md:space-y-8">
                                    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col justify-between text-center relative overflow-hidden border border-[#1db954]/10 bg-gradient-to-b from-[#1db954]/5 to-transparent">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#1db954]/5 rounded-full blur-xl pointer-events-none"></div>
                                        <div>
                                            <div className="w-16 h-16 bg-[#1db954]/10 border border-[#1db954]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#1db954] shadow-[0_0_30px_rgba(29,185,84,0.2)]">
                                                <Music className="w-8 h-8 fill-current" />
                                            </div>
                                            <h3 className="text-lg md:text-xl font-black mb-2 tracking-tighter">Sincronización Activa</h3>
                                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                                Tu perfil de Spotify está sincronizado de manera segura mediante Token de Acceso directo a la API de Spotify.
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase py-2 bg-white/5 rounded-xl border border-white/5">
                                            Spotitoust • Connected
                                        </div>
                                    </div>

                                    {/* Spotify Iframe Embed Player */}
                                    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col border border-white/5 bg-gradient-to-b from-white/5 to-transparent min-h-[460px]">
                                        <h3 className="text-lg md:text-xl font-black mb-1 tracking-tighter text-glow">Escucha aquí mismo</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed mb-6">
                                            {createdPlaylistId 
                                                ? "Disfruta de tu lista de éxitos generada directamente desde Spotitoust." 
                                                : "Escucha una lista de reproducción recomendada o genera la tuya propia."}
                                        </p>
                                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/20 flex-1 min-h-[360px] relative">
                                            <iframe
                                                title="Spotify Embed Player"
                                                src={`https://open.spotify.com/embed/playlist/${createdPlaylistId || '6UbajjzazMj71I3olG30j6'}?utm_source=generator&theme=0`}
                                                width="100%"
                                                height="100%"
                                                className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* VIEW: CUSTOM USER PROFILE */}
                        {currentView === 'perfil' && customUser && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-10 md:mb-16 mt-4 md:mt-8">
                                <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full overflow-hidden bg-gradient-to-tr from-[#1db954] to-emerald-800 flex items-center justify-center text-black font-black text-6xl shadow-[0_20px_50px_rgba(29,185,84,0.3)] shrink-0 border-2 border-[#1db954]/50 group">
                                    {customUser.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest leading-none">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Cuenta Spotis
                                    </div>
                                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none text-glow">
                                        {customUser.displayName}
                                    </h1>
                                    <p className="text-sm md:text-base text-gray-400 font-medium">
                                        {customUser.email}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Account settings / stats */}
                                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
                                    <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow border-b border-white/5 pb-4">
                                        Tu Biblioteca Spotis
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Favoritos</p>
                                            <p className="text-3xl font-black text-white mt-2">{favorites.length}</p>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mis Listas</p>
                                            <p className="text-3xl font-black text-white mt-2">
                                                {playlists.filter(p => p.isLocalOnly || p.id !== 1 || p.tracks.length > 0).length}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button 
                                            onClick={() => { handleSignOut(); setCurrentView('descubrir'); }}
                                            className="w-full py-4 px-4 rounded-2xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 hover:text-red-400 font-black transition-all text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            Cerrar Sesión de la Cuenta
                                        </button>
                                    </div>
                                </div>

                                {/* Integration Management */}
                                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
                                    <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow border-b border-white/5 pb-4">
                                        Vinculación con Spotify
                                    </h2>
                                    {spotifyProfile ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 bg-[#1db954]/5 border border-[#1db954]/20 p-5 rounded-2xl">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-black text-xl shrink-0">
                                                    {spotifyProfile.images?.[0]?.url ? (
                                                        <img src={spotifyProfile.images[0].url} alt="Spotify Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        spotifyProfile.display_name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm leading-tight">{spotifyProfile.display_name}</p>
                                                    <p className="text-xs text-[#1db954] font-medium mt-0.5">Servicio enlazado y activo</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleSpotifyDisconnect}
                                                className="w-full py-4 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all text-sm hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                Desvincular Cuenta de Spotify
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                Vincula tu cuenta de Spotify para acceder a tu historial de reproducción, cargar tus playlists existentes y desbloquear las recomendaciones oficiales basadas en tus artistas de Spotify.
                                            </p>
                                            <button 
                                                onClick={handleSpotifyConnect}
                                                className="w-full py-4 px-4 rounded-2xl bg-[#1db954] hover:bg-[#1db954]/90 text-black font-black transition-all text-sm shadow-[0_4px_20px_rgba(29,185,84,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <SpotifyIcon className="w-4.5 h-4.5 text-black fill-current" />
                                                Vincular Cuenta de Spotify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* VIEW: PLAYLISTS */}
                        {currentView === 'playlists' && (
                            <div className="space-y-10 md:space-y-12 animate-in fade-in duration-500">
                                {!selectedLocalPlaylist ? (
                                    <>
                                        {/* Header Section */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-white/5 pb-8 mt-4">
                                            <div>
                                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none text-glow mb-2">
                                                    Mis Playlists
                                                </h1>
                                                <p className="text-sm text-gray-400 font-medium">
                                                    Administra y sincroniza todas tus listas de reproducción localmente y en la nube
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowNewPlaylistModal(true)}
                                                className="px-6 py-3.5 bg-gradient-to-r from-[#1db954] to-emerald-500 text-black font-black hover:scale-105 active:scale-95 transition-all text-sm rounded-2xl shadow-[0_0_20px_rgba(29,185,84,0.4)] flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
                                            >
                                                <Plus className="w-4 h-4 text-black stroke-[3px]" /> Nueva Playlist
                                            </button>
                                        </div>

                                        {/* Playlists Grid */}
                                        <div className="space-y-10">
                                            {/* Spotify Playlists (Synced) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-[#1db954]/10 border border-[#1db954]/25 p-2 rounded-xl text-[#1db954]">
                                                        <Music className="w-5 h-5 fill-current" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow">
                                                            Sincronizadas con Spotify
                                                        </h2>
                                                        <p className="text-xs text-gray-400">Tus playlists reales importadas de tu cuenta de Spotify</p>
                                                    </div>
                                                </div>

                                                {/* Spotify playlists grid content */}
                                                {spotifyProfile && spotifyScopeWarning && (
                                                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs md:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                                                        <div className="flex items-center gap-2.5">
                                                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                                                            <span>Falta el permiso para leer tus Canciones que te gustan. Por favor, vuelve a conectar tu cuenta de Spotify pulsando el botón para autorizar el acceso.</span>
                                                        </div>
                                                        <button 
                                                            onClick={handleSpotifyConnect}
                                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-xs whitespace-nowrap self-end sm:self-auto cursor-pointer"
                                                        >
                                                            Autorizar Permiso
                                                        </button>
                                                    </div>
                                                )}
                                                {!spotifyProfile ? (
                                                    <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-md border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                                                        <p className="text-sm text-gray-400">Conecta tu cuenta de Spotify para sincronizar tus listas de reproducción en vivo.</p>
                                                        <button 
                                                            onClick={handleSpotifyConnect}
                                                            className="flex items-center justify-center gap-2 py-3 px-6 bg-[#1db954] text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(29,185,84,0.2)] mx-auto cursor-pointer"
                                                        >
                                                            <SpotifyIcon className="w-4 h-4 text-black fill-current" />
                                                            Conectar Spotify
                                                        </button>
                                                    </div>
                                                ) : syncingPlaylists ? (
                                                    <div className="flex items-center gap-3 py-10 pl-4">
                                                        <div className="w-6 h-6 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-sm text-gray-400">Obteniendo listas de Spotify...</span>
                                                    </div>
                                                ) : spotifyPlaylists.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        {sortPlaylistsByHistory(spotifyPlaylists).map((pl, i) => (
                                                            <div 
                                                                key={pl.id} 
                                                                onClick={() => selectPlaylist(pl, true)}
                                                                className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 active:scale-95 transition-all duration-300 border border-white/5 cursor-pointer group"
                                                            >
                                                                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0 bg-white/5 flex items-center justify-center relative">
                                                                    {pl.images?.[0]?.url ? (
                                                                        <img src={pl.images[0].url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                    ) : (
                                                                        <div className="text-[#1db954] font-black text-2xl bg-[#1db954]/10 w-full h-full flex items-center justify-center">
                                                                            {pl.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                                        <Play className="w-6 h-6 text-white fill-white shrink-0" />
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-bold text-white truncate text-sm leading-snug group-hover:text-[#1db954] transition-all">
                                                                        {pl.name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                                                        {pl.tracks?.total || pl.items?.total || 0} canciones
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 pl-4">No se encontraron playlists de Spotify.</p>
                                                )}
                                            </div>

                                            {/* Local Playlists */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-500/10 border border-blue-500/25 p-2 rounded-xl text-blue-400">
                                                        <ListMusic className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl md:text-2xl font-black tracking-tighter text-glow">
                                                            Listas Locales (Spotis)
                                                        </h2>
                                                        <p className="text-xs text-gray-400">Colecciones personalizadas guardadas en este dispositivo</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {sortPlaylistsByHistory(playlists).map((pl, i) => (
                                                        <div 
                                                            key={pl.id} 
                                                            onClick={() => selectPlaylist(pl, false)}
                                                            className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 active:scale-95 transition-all duration-300 border border-white/5 cursor-pointer group"
                                                        >
                                                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0 bg-gradient-to-br from-blue-500 to-indigo-800 flex items-center justify-center relative">
                                                                {pl.tracks?.[0]?.cover ? (
                                                                    <img src={pl.tracks[0].cover} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                ) : (
                                                                    <ListMusic className="w-8 h-8 text-white/50" />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                                    <Play className="w-6 h-6 text-white fill-white shrink-0" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-bold text-white truncate text-sm leading-snug group-hover:text-blue-400 transition-all">
                                                                    {pl.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                                    {pl.tracks?.length || 0} canciones
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* FULL PLAYLIST DETAIL VIEW */
                                    (() => {
                                        const livePlaylist = selectedLocalPlaylist.isSpotify
                                            ? selectedLocalPlaylist
                                            : playlists.find(p => p.id === selectedLocalPlaylist.id) || selectedLocalPlaylist;
                                        
                                        return (
                                            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                                                {/* Back Button */}
                                                <button 
                                                    onClick={() => setSelectedLocalPlaylist(null)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/10 rounded-full text-white text-xs font-bold transition-all duration-300 backdrop-blur-md self-start group cursor-pointer"
                                                >
                                                    <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" /> 
                                                    Volver a mis listas
                                                </button>

                                                {loadingPlaylistTracks ? (
                                                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                                                        <div className="w-12 h-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                                                        <p className="text-sm text-gray-400 font-bold tracking-wider uppercase animate-pulse">Cargando canciones...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Playlist Header Card */}
                                                        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8 shadow-2xl">
                                                            {/* Color Wash Ambient Glow */}
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-[#1db954]/10 pointer-events-none blur-3xl rounded-3xl" />
                                                            
                                                            {/* Playlist Big Cover Image */}
                                                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-800 shrink-0 flex items-center justify-center border border-white/10 group relative">
                                                                {livePlaylist.tracks?.[0]?.cover || livePlaylist.cover ? (
                                                                    <img src={livePlaylist.tracks?.[0]?.cover || livePlaylist.cover} alt="Cover" className="w-full h-full object-cover shadow-2xl" />
                                                                ) : (
                                                                    <ListMusic className="w-24 h-24 text-white/20" />
                                                                )}
                                                            </div>

                                                            {/* Playlist Metadata Info */}
                                                            <div className="flex-1 text-center md:text-left space-y-3 z-10">
                                                                <div className="flex items-center justify-center md:justify-start gap-2">
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/5">
                                                                        Playlist
                                                                    </span>
                                                                    {livePlaylist.isSpotify && (
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[#1db954]/20 text-[#1db954] px-2.5 py-1 rounded-full border border-[#1db954]/10 flex items-center gap-1.5">
                                                                            <SpotifyIcon className="w-3 h-3 fill-current" /> Spotify
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight text-glow">
                                                                    {livePlaylist.name}
                                                                </h2>
                                                                <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-2xl">
                                                                    {livePlaylist.description || (livePlaylist.isSpotify ? "Colección sincronizada de Spotify" : "Colección de música local de Spotis")}
                                                                </p>
                                                                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-semibold pt-2">
                                                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                                    <span>{livePlaylist.tracks?.length || 0} canciones</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions & Tracklist Section */}
                                                        <div className="space-y-6">
                                                            {/* Big Play button row */}
                                                            {livePlaylist.tracks && livePlaylist.tracks.length > 0 && (
                                                                <div className="flex items-center gap-4">
                                                                    <button 
                                                                        onClick={() => playTrack(livePlaylist.tracks[0], livePlaylist.tracks, 0)}
                                                                        className="w-16 h-16 bg-[#1db954] hover:bg-[#1ed760] active:scale-95 text-black rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(29,185,84,0.4)] transition-all hover:scale-105 duration-300 cursor-pointer group"
                                                                        title="Reproducir"
                                                                    >
                                                                        <Play className="w-7 h-7 text-black fill-black ml-1 group-hover:scale-110 transition-transform" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setIsShuffle(true);
                                                                            const idx = Math.floor(Math.random() * livePlaylist.tracks.length);
                                                                            playTrack(livePlaylist.tracks[idx], livePlaylist.tracks, idx);
                                                                        }}
                                                                        className="w-14 h-14 bg-white/10 hover:bg-white/20 active:scale-95 text-[#1db954] rounded-full flex items-center justify-center border border-white/10 shadow-lg transition-all hover:scale-105 duration-300 cursor-pointer"
                                                                        title="Reproducción aleatoria"
                                                                    >
                                                                        <Shuffle className="w-6 h-6 text-[#1db954]" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Track list Table/Grid */}
                                                            {livePlaylist.tracks && livePlaylist.tracks.length > 0 ? (
                                                                <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
                                                                    {/* Table Header */}
                                                                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest no-select">
                                                                        <div className="col-span-1 text-center">#</div>
                                                                        <div className="col-span-6">Título / Artista</div>
                                                                        <div className="col-span-4">Álbum</div>
                                                                        <div className="col-span-1 text-right pr-2">Acciones</div>
                                                                    </div>

                                                                    {/* Table Body */}
                                                                    <div className="divide-y divide-white/5">
                                                                        {livePlaylist.tracks.map((track, i) => (
                                                                            <div 
                                                                                key={`${track.id}-${i}`}
                                                                                onClick={() => playTrack(track, livePlaylist.tracks, i)}
                                                                                className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center px-6 py-3.5 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                                                            >
                                                                                {/* Index / Hover Play Icon */}
                                                                                <div className="col-span-1 hidden sm:flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-transparent relative">
                                                                                    <span>{i + 1}</span>
                                                                                    <Play className="w-4 h-4 text-[#1db954] fill-current absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>

                                                                                {/* Cover & Title / Artist */}
                                                                                <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                                                                                    <img src={track.cover} alt="Cover" className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300" />
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <h4 className="font-bold text-white truncate text-sm leading-snug group-hover:text-[#1db954] transition-all">
                                                                                            {track.title}
                                                                                        </h4>
                                                                                        <p className="text-xs text-gray-400 mt-1 truncate">
                                                                                            {track.artist}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Album or Type */}
                                                                                <div className="col-span-4 hidden sm:block text-xs font-semibold text-gray-400 truncate">
                                                                                    {livePlaylist.isSpotify ? "Álbum de Spotify" : "Colección Spotis"}
                                                                                </div>

                                                                                {/* Actions column */}
                                                                                <div className="col-span-1 hidden sm:flex items-center justify-end pr-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                                                                    <button 
                                                                                        onClick={() => playTrack(track, livePlaylist.tracks, i)}
                                                                                        className="p-2 bg-white/5 hover:bg-[#1db954]/10 rounded-full text-gray-400 hover:text-[#1db954] hover:scale-105 active:scale-95 transition-all"
                                                                                    >
                                                                                        <Play className="w-4 h-4 fill-current" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="glass-panel p-16 rounded-3xl text-center space-y-4 border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                                                                    <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                                                        <ListMusic className="w-8 h-8" />
                                                                    </div>
                                                                    <div className="max-w-md mx-auto space-y-2">
                                                                        <h3 className="text-lg font-black text-white">Esta lista está vacía</h3>
                                                                        <p className="text-sm text-gray-400 leading-relaxed">
                                                                            Añade canciones a esta lista haciendo clic derecho o manteniendo pulsada cualquier canción en la aplicación y seleccionando esta lista de reproducción.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <div className={`hidden md:flex fixed right-0 top-0 bottom-24 w-96 glass-panel-heavy z-40 transform
                transition-transform duration-500 border-l border-white/10 flex-col ${showQueue ? 'translate-x-0'
                : 'translate-x-full' }`}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-black text-xl">Cola de Reproducción</h3>
                    <button onClick={()=> setShowQueue(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll p-4">
                    <TrackList tracks={queue.slice(queueIndex + 1, queueIndex + 20)} contextQueue={queue}
                        startIndex={queueIndex} />
                </div>
            </div>

            <MobileBottomNav />

            {currentTrack && !isFullScreenPlayer && (
            <div
                className="fixed bottom-[80px] md:bottom-8 left-0 md:left-1/2 transform md:-translate-x-1/2 w-full md:w-[92%] max-w-6xl bg-[#080808]/75 backdrop-blur-3xl border-t md:border border-white/10 p-2 md:p-4 md:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.7)] md:shadow-[0_24px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-1 md:gap-8 z-50 animate-in slide-in-from-bottom-12 transition-all duration-500 overflow-hidden"
            >
                {/* Dynamic Ambient Background Glow from Cover */}
                <div 
                    className="absolute inset-0 -z-10 opacity-20 blur-[40px] pointer-events-none scale-150 transition-all duration-700"
                    style={{ backgroundImage: `url(${currentTrack.cover})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                />

                {/* Progress Bar top edge (Mobile only) */}
                <div className="absolute top-0 left-0 w-full h-[2.5px] md:hidden bg-white/10">
                    <div className="h-full bg-[#1db954] shadow-[0_0_8px_#1db954] transition-all" style={{ width: `${progress}%` }}></div>
                </div>

                {/* 1. Track Info (Left Column on Desktop, Main Row on Mobile) */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pl-1 w-full md:w-auto">
                    <div 
                        onClick={() => setIsFullScreenPlayer(true)}
                        className="relative w-11 h-11 md:w-14 md:h-14 shrink-0 rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.4)] group/cover cursor-pointer"
                    >
                        <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover transform group-hover/cover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                            <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setIsFullScreenPlayer(true)}>
                        <h4 className="font-bold text-white text-sm md:text-base truncate hover:text-[#1db954] transition-colors">
                            {currentTrack.title}
                        </h4>
                        <p className="text-gray-400 text-xs md:text-sm truncate mt-0.5">{currentTrack.artist}</p>
                    </div>
                    
                    {/* Mobile Controls Right side (hidden on desktop) */}
                    <div className="flex md:hidden items-center gap-1.5 sm:gap-2 pr-1 shrink-0">
                        {/* Shuffle Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
                            className={`p-1.5 transition-all active:scale-75 ${isShuffle ? 'text-[#1db954]' : 'text-gray-400'}`}
                            title={isShuffle ? "Desactivar modo aleatorio" : "Activar modo aleatorio"}
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>

                        {/* Previous Button */}
                        <button 
                            onClick={playPrev} 
                            className="text-gray-400 p-1.5 active:scale-75 transition-all"
                            title="Anterior"
                        >
                            <SkipBack className="w-4.5 h-4.5 fill-current" />
                        </button>

                        {/* Play/Pause Button */}
                        <button 
                            onClick={togglePlay}
                            className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black active:scale-90 transition-transform shadow-md"
                        >
                            {isResolvingAudio ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <Pause className="w-4 h-4 fill-black" />
                            ) : (
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                            )}
                        </button>

                        {/* Next Button */}
                        <button 
                            onClick={playNext} 
                            className="text-gray-400 p-1.5 active:scale-75 transition-all"
                            title="Siguiente"
                        >
                            <SkipForward className="w-4.5 h-4.5 fill-current" />
                        </button>

                        {/* Favorite Heart Button */}
                        <button 
                            onClick={(e) => toggleFavorite(currentTrack, e)} 
                            className="text-gray-400 p-1.5 hover:scale-115 active:scale-95 transition-all"
                        >
                            <Heart className={`w-4.5 h-4.5 transition-colors ${favorites.find(t => t.id === currentTrack.id) ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* 2. Center Column (Desktop Only: Playback Controls & Progress Bar) */}
                <div className="hidden md:flex flex-col items-center gap-2 flex-1 w-full md:max-w-2xl">
                    {/* Controls Row */}
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
                            className={`hover:scale-110 active:scale-90 transition-all ${isShuffle ? 'text-[#1db954]' : 'text-gray-400 hover:text-white'}`}
                            title={isShuffle ? "Desactivar modo aleatorio" : "Activar modo aleatorio"}
                        >
                            <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button 
                            onClick={playPrev} 
                            className="text-gray-400 hover:text-white hover:scale-110 active:scale-90 transition-all"
                            title="Anterior"
                        >
                            <SkipBack className="w-5 h-5 fill-current" />
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 md:w-11 md:h-11 bg-white hover:bg-emerald-400 text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(29,185,84,0.3)]"
                            title={isPlaying ? "Pausar" : "Reproducir"}
                        >
                            {isResolvingAudio ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <Pause className="w-5 h-5 fill-black" />
                            ) : (
                                <Play className="w-5 h-5 fill-black ml-0.5" />
                            )}
                        </button>
                        <button 
                            onClick={playNext} 
                            className="text-gray-400 hover:text-white hover:scale-110 active:scale-90 transition-all"
                            title="Siguiente"
                        >
                            <SkipForward className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    {/* Progress Slider Row */}
                    <div className="flex items-center gap-3 w-full pl-2 pr-2">
                        <span className="text-[10px] text-gray-400 font-mono w-8 text-right select-none">
                            {formatTime(audioRef.current?.currentTime)}
                        </span>
                        
                        <div 
                            className="flex-1 h-1.5 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative group/slider transition-all py-2 flex items-center"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (audioRef.current && audioRef.current.duration) {
                                    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
                                }
                            }}
                        >
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-[#1db954] rounded-full group-hover/slider:bg-emerald-400 transition-colors" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div 
                                className="absolute w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none -translate-x-1/2"
                                style={{ left: `${progress}%` }}
                            />
                        </div>

                        <span className="text-[10px] text-gray-400 font-mono w-8 text-left select-none">
                            {formatTime(audioRef.current?.duration)}
                        </span>
                    </div>
                </div>

                {/* 3. Right Column (Desktop Only: Volume & Extras) */}
                <div className="hidden md:flex items-center justify-end gap-5 flex-1 min-w-0 pr-1 w-1/4">
                    {/* Heart Favorite Button */}
                    <button 
                        onClick={(e) => toggleFavorite(currentTrack, e)} 
                        className="text-gray-400 hover:text-white hover:scale-110 active:scale-95 transition-all"
                        title="Favorito"
                    >
                        <Heart className={`w-5 h-5 transition-colors ${favorites.find(t => t.id === currentTrack.id) ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                    </button>

                                        {/* Tv/Video Toggle Button */}
                    <button 
                        onClick={() => window.toggleSpotisVideo && window.toggleSpotisVideo()} 
                        className="p-2 rounded-xl text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95 duration-300"
                        title="Ver Video Musical"
                    >
                        <Tv className="w-5 h-5" />
                    </button>

                    {/* Queue Button */}
                    <button 
                        onClick={() => setShowQueue(!showQueue)} 
                        className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${showQueue ? 'text-[#1db954] bg-[#1db954]/10' : 'text-gray-400 hover:text-white'}`}
                        title="Cola de reproducción"
                    >
                        <ListMusic className="w-5 h-5" />
                    </button>
                    
                    {/* Volume Controller */}
                    <div className="flex items-center gap-3 group/volume relative">
                        {/* Tooltip percentage indicator */}
                        <div className="absolute -top-9 left-[75px] transform -translate-x-1/2 bg-[#1db954] text-black font-black text-[9px] px-2 py-0.5 rounded-md opacity-0 group-hover/volume:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_4px_10px_rgba(29,185,84,0.4)] z-50">
                            {volume}%
                        </div>
                    
                        <button 
                            onClick={() => {
                                if (audioRef.current) {
                                    const newVol = volume > 0 ? 0 : 80;
                                    setVolume(newVol);
                                    audioRef.current.volume = newVol / 100;
                                }
                            }}
                            className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
                        >
                            {(() => {
                                if (volume === 0) return <VolumeX className="w-5 h-5 text-emerald-500/80" />;
                                if (volume < 30) return <Volume className="w-5 h-5" />;
                                if (volume < 70) return <Volume1 className="w-5 h-5" />;
                                return <Volume2 className="w-5 h-5 text-[#1db954]" />;
                            })()}
                        </button>
                        <div 
                            className="w-14 group-hover/volume:w-28 h-1 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative py-2 flex items-center transition-all duration-300 ease-out"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (audioRef.current) {
                                    const vol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                    setVolume(Math.round(vol * 100));
                                    audioRef.current.volume = vol;
                                }
                            }}
                        >
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-white rounded-full group-hover/volume:bg-[#1db954] group-hover/volume:shadow-[0_0_8px_#1db954] transition-colors" 
                                    style={{ width: `${volume}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full Screen lyrics button */}
                    <button 
                        onClick={() => setIsFullScreenPlayer(true)} 
                        className="text-gray-400 hover:text-white p-2 hover:scale-110 transition-all"
                        title="Pantalla completa / Letras"
                    >
                        <Maximize2 className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>
            )}

            {isFullScreenPlayer && currentTrack && (
            <div
                className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
                <div className="absolute inset-0 bg-cover bg-center opacity-60 scale-110 blur-[80px]" style={{
                    backgroundImage: `url(${currentTrack.cover})`, saturate: '150%' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-10 pt-safe w-full">
                    {/* Top Row on Mobile: Back Button & Actions */}
                    <div className="flex items-center justify-between w-full md:w-auto md:contents">
                        {/* Back Button */}
                        <button onClick={()=> setIsFullScreenPlayer(false)} className="p-3 bg-white/10 rounded-full backdrop-blur-xl border border-white/10">
                            <ChevronDown className="w-5 h-5 md:w-8 md:h-8 text-white" />
                        </button>

                        {/* Right Action Controls (duplicated in mobile flow but styled carefully) */}
                        <div className="flex md:hidden items-center gap-2">
                            <button 
                                onClick={() => setShowPartyModal(true)}
                                className={`p-2.5 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-1.5 transition-all ${partyRoomId ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/10 text-white'}`}
                                title="Party Mode"
                            >
                                <span className="text-sm">🎉</span>
                            </button>
                            <button 
                                onClick={() => {
                                    const newMode = !is8DMode;
                                    setIs8DMode(newMode);
                                    if (audioRef.current) audioRef.current.set8DMode(newMode);
                                    showNotification(newMode ? "🎧 Modo 8D Activado" : "Modo 8D Desactivado");
                                }}
                                className={`p-2.5 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-1.5 transition-all ${is8DMode ? 'bg-[#1db954]/20 text-[#1db954] border-[#1db954]/30' : 'bg-white/10 text-white'}`}
                                title="Modo 8D"
                            >
                                <Sparkles className="w-4 h-4 text-white" />
                            </button>
                            <button className="p-2.5 bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
                                onClick={(e)=> handleContextMenu(e, currentTrack)}>
                                <MoreHorizontal className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Tab Switcher - Centered on all viewports */}
                    <div className="flex bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10 z-50">
                        <button onClick={()=> setFullScreenTab('audio')} className={`px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${fullScreenTab === 'audio' ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Audio</button>
                        <button onClick={()=> setFullScreenTab('letras')} className={`px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${fullScreenTab === 'letras' ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Letras</button>
                        <button onClick={()=> setFullScreenTab('visual')} className={`px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${fullScreenTab === 'visual' ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Visual</button>
                    </div>

                    {/* Actions Panel - Desktop Only */}
                    <div className="hidden md:flex items-center gap-2">
                        <button 
                            onClick={() => setShowPartyModal(true)}
                            className={`p-3 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-2 transition-all ${partyRoomId ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/10 text-white'}`}
                        >
                            <span className="text-xs font-bold hidden md:inline">Party</span>
                            <span className="text-lg">🎉</span>
                        </button>
                        <button 
                            onClick={() => {
                                const newMode = !is8DMode;
                                setIs8DMode(newMode);
                                if (audioRef.current) audioRef.current.set8DMode(newMode);
                                showNotification(newMode ? "🎧 Modo 8D Activado" : "Modo 8D Desactivado");
                            }}
                            className={`p-3 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-2 transition-all ${is8DMode ? 'bg-[#1db954]/20 text-[#1db954] border-[#1db954]/30' : 'bg-white/10 text-white'}`}
                        >
                            <span className="text-xs font-bold hidden md:inline">8D</span>
                            <Sparkles className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
                            onClick={(e)=> handleContextMenu(e, currentTrack)}>
                            <MoreHorizontal className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-10 w-full max-w-7xl mx-auto gap-6 md:gap-24 overflow-y-auto">
                    {fullScreenTab === 'visual' && <FullScreenVisualizer isPlaying={isPlaying} audioRef={audioRef} />}

                    {fullScreenTab === 'audio' ? (
                    <>
                        {/* Artwork Area */}
                        <div className="w-full max-w-[280px] xs:max-w-[320px] md:max-w-md aspect-square relative mt-2 md:mt-0">
                            <div
                                className="absolute inset-0 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 md:border-4 border-gray-900 bg-black overflow-hidden flex items-center justify-center relative">
                                <div className={`absolute inset-0 vinyl-spin ${isPlaying ? '' : 'paused' }`}>
                                    <div className="absolute inset-2 border border-gray-800 rounded-full"></div>
                                    <div className="absolute inset-6 border border-gray-800 rounded-full"></div>
                                    <div className="absolute inset-10 border border-gray-800 rounded-full"></div>
                                    <div
                                        className={`absolute inset-[25%] rounded-full overflow-hidden border-[6px] border-black ${is8DMode ? 'mode-8d' : ''}`}>
                                        <img src={currentTrack.cover} alt="Label"
                                            className="w-full h-full object-cover" />
                                    </div>
                                    <div
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 md:w-4 h-3 md:h-4 bg-gray-900 rounded-full border border-gray-700 shadow-inner z-10">
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Area */}
                        <div
                            className="w-full md:flex-1 flex flex-col md:items-start text-center md:text-left mt-4 md:mt-0">
                            <div className="flex items-center justify-between w-full mb-2">
                                <div className="min-w-0 flex-1 text-left md:text-left">
                                    <h2 className="text-2xl md:text-6xl font-black text-white truncate text-glow">
                                        {currentTrack.title}</h2>
                                    <p className="text-base md:text-3xl text-gray-300 font-medium truncate mt-1">
                                        {currentTrack.artist}</p>
                                </div>
                                <button onClick={(e)=> toggleFavorite(currentTrack, e)} className="p-3 ml-4">
                                    <Heart className={`w-7 h-7 md:w-8 md:h-8 ${favorites.find(t=>t.id===currentTrack.id) ?
                                        'fill-[#1db954] text-[#1db954]' : 'text-gray-400'}`} />
                                </button>
                            </div>

                            <div className="w-full mt-4 md:mt-12">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400 font-mono w-10 text-left">
                                        {audioRef.current?.currentTime
                                            ? formatTime(audioRef.current.currentTime)
                                            : '0:00'}
                                    </span>
                                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden relative cursor-pointer"
                                        onClick={(e)=> { const b=e.currentTarget.getBoundingClientRect();
                                        if(audioRef.current) audioRef.current.currentTime =
                                        ((e.clientX-b.left)/b.width)*audioRef.current.duration; }}>
                                        <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all ease-linear"
                                            style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono w-10 text-right">
                                        {audioRef.current?.duration
                                            ? formatTime(audioRef.current.duration)
                                            : '0:30'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-8 md:gap-12 mt-6 md:mt-10">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
                                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center ${isShuffle ? 'text-[#1db954]' : 'text-gray-400 hover:text-white'} transition-all`}
                                    >
                                        <Shuffle className="w-6 h-6 md:w-8 md:h-8" />
                                    </button>
                                    <button onClick={playPrev} className="text-gray-300">
                                        <SkipBack className="w-8 h-8 md:w-12 md:h-12 fill-current" />
                                    </button>
                                    <button onClick={togglePlay}
                                        className="w-18 h-18 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 transition-transform">
                                        {isPlaying ?
                                        <Pause className="w-8 h-8 md:w-12 md:h-12 fill-black" /> :
                                        <Play className="w-8 h-8 md:w-12 md:h-12 fill-black ml-1.5" />}
                                    </button>
                                    <button onClick={playNext} className="text-gray-300">
                                        <SkipForward className="w-8 h-8 md:w-12 md:h-12 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                    ) : fullScreenTab === 'letras' ? (
                    <div
                        className="w-full flex-1 flex flex-col relative mask-image-y custom-scroll overflow-y-auto pb-20">
                        <div className="my-auto space-y-8 md:space-y-10 py-20 text-center md:text-left">
                            {[{t: 0, text: "🎵 (Intro)"}, {t: 5, text: "Escuchando en modo PWA."}, {t: 10, text: "Siente el ritmo."}, {t: 15, text: "Responsive y fluido."}, {t: 20, text: "Spotis Music."}].map((line, i) => {
                            const isActive = audioRef.current?.currentTime >= line.t && audioRef.current?.currentTime <
                                (line.t + 5); return <p key={i} className={`text-3xl md:text-6xl font-black
                                tracking-tighter leading-tight lyric-line ${isActive ? 'active' : '' }`}>{line.text}</p>
                                })}
                        </div>
                        {/* Mobile Lyrics Bottom Controls */}
                        <div
                            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-6 bg-black/60 backdrop-blur-3xl px-8 py-4 rounded-full border border-white/10 w-[90%] md:w-auto">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
                                className={`flex items-center justify-center ${isShuffle ? 'text-[#1db954]' : 'text-gray-400 hover:text-white'} transition-all`}
                            >
                                <Shuffle className="w-5 h-5" />
                            </button>
                            <button onClick={playPrev} className="text-white">
                                <SkipBack className="w-6 h-6 fill-current" />
                            </button>
                            <button onClick={togglePlay}
                                className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black">
                                {isPlaying ?
                                <Pause className="w-6 h-6 fill-black" /> :
                                <Play className="w-6 h-6 fill-black ml-1" />}
                            </button>
                            <button onClick={playNext} className="text-white">
                                <SkipForward className="w-6 h-6 fill-current" />
                            </button>
                        </div>
                    </div>
                    ) : null}
                </div>
            </div>
            )}

            {/* Spotify Direct Access Token Modal */}
            {/* Spotify Auth & Setup Premium Modal */}
            {showTokenModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel-heavy p-8 rounded-3xl w-[95%] max-w-xl border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowTokenModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h3 className="text-2xl font-black mb-1 tracking-tighter text-glow flex items-center gap-2">
                            <SpotifyIcon className="w-7 h-7 text-[#1db954]" />
                            Conectar Cuenta de Spotify
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Sincroniza tus listas, favoritos e información musical de Spotify de forma segura.
                        </p>

                        {/* Navigation Tabs */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 mb-6">
                            <button
                                onClick={() => setOauthModalTab("oauth")}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${oauthModalTab === 'oauth' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                Conexión Permanente 🚀 (1-Clic)
                            </button>
                            <button
                                onClick={() => setOauthModalTab("token")}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${oauthModalTab === 'token' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                Token Rápido ⚡ (Manual)
                            </button>
                        </div>

                        {oauthModalTab === 'oauth' ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="space-y-3 text-xs text-gray-400 bg-white/5 p-4 rounded-2xl border border-white/5 leading-relaxed">
                                    <p className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                                        <Sparkles className="w-4 h-4 text-[#1db954]" />
                                        Conexión 1-Clic Permanente
                                    </p>
                                    <p className="text-[11px] text-gray-300">
                                        Conéctate de forma rápida y segura. Esto sincronizará tus playlists personales, canciones favoritas y estados de reproducción de Spotify en tiempo real.
                                    </p>
                                </div>

                                {spotifyClientId ? (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => handleSpotifyOAuthLogin(spotifyClientId, spotifyClientSecret)}
                                            className="w-full py-4 px-4 rounded-2xl bg-[#1db954] hover:bg-[#1db954]/90 text-black font-black transition-all text-sm shadow-[0_4px_20px_rgba(29,185,84,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            Iniciar Sesión con Spotify 🚀
                                        </button>
                                        
                                        <div className="text-center pt-2">
                                            <button 
                                                onClick={() => setShowAdvancedOauth(!showAdvancedOauth)}
                                                className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors focus:outline-none"
                                            >
                                                {showAdvancedOauth ? "▲ Ocultar Configuración Avanzada" : "▼ Configuración Avanzada (Desarrollador)"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 text-xs text-yellow-400/90 bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 leading-relaxed">
                                        <p className="font-bold flex items-center gap-1.5">
                                            ⚠️ Client ID no configurado
                                        </p>
                                        <p className="text-[11px]">
                                            El administrador aún no ha configurado el Client ID central en Firestore. Abre la pestaña de Configuración Avanzada abajo para ingresar tu propio Client ID y conectarte.
                                        </p>
                                    </div>
                                )}

                                {(showAdvancedOauth || !spotifyClientId) && (
                                    <div className="space-y-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-3 text-[10px] text-gray-400 bg-white/5 p-4 rounded-xl leading-relaxed border border-white/5">
                                            <p className="font-bold text-white mb-1">Para usar tu propio Client ID de Spotify:</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>Crea una App en la <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-[#1db954] hover:underline font-bold">Consola de Spotify Developers</a>.</li>
                                                <li>En **Redirect URIs**, añade: <strong className="text-white select-all">https://spotitoust.web.app/</strong> o <strong className="text-white select-all">http://localhost:5173/</strong></li>
                                                <li>Pega el **Client ID** y el **Client Secret** de tu App abajo.</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Spotify Client ID Personal</label>
                                            <input
                                                type="text"
                                                placeholder="Pega tu Client ID de Spotify (32 caracteres)"
                                                value={spotifyClientId}
                                                onChange={(e) => setSpotifyClientId(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 text-white rounded-xl py-3 px-4 outline-none font-mono text-xs tracking-wide transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Spotify Client Secret Personal</label>
                                            <input
                                                type="password"
                                                placeholder="Pega tu Client Secret de Spotify (32 caracteres)"
                                                value={spotifyClientSecret}
                                                onChange={(e) => setSpotifyClientSecret(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 text-white rounded-xl py-3 px-4 outline-none font-mono text-xs tracking-wide transition-all"
                                            />
                                        </div>

                                                              
                                            <button
                                                onClick={() => handleSpotifyOAuthLogin(spotifyClientId, spotifyClientSecret)}
                                                className="w-full py-3 px-4 rounded-xl bg-[#1db954] hover:bg-[#1db954]/90 text-black font-black transition-all text-xs shadow-[0_4px_15px_rgba(29,185,84,0.3)]"
                                            >
                                                Conectar con Credenciales Personales 🚀
                                            </button>
 
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setShowTokenModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-xs"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <p className="text-xs text-gray-400 leading-relaxed pl-1">
                                    Si no quieres crear una App en el portal de desarrolladores, puedes sincronizarte pegando un access token rápido de pruebas. Expira cada 1 hora.
                                </p>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Spotify Access Token Temporal</label>
                                    <textarea
                                        placeholder="Pega tu Access Token de pruebas (Ej: BQ...)"
                                        value={tempToken}
                                        onChange={(e) => setTempToken(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 text-white rounded-xl py-3 px-4 outline-none font-mono text-[11px] tracking-wide transition-all resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setShowTokenModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleTokenSubmit(tempToken)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-[#1db954] hover:bg-[#1db954]/90 text-black font-black transition-all text-xs shadow-[0_4px_15px_rgba(29,185,84,0.3)] hover:scale-105 active:scale-95"
                                    >
                                        Guardar Token Temporal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* Create Playlist Modal */}
            {showNewPlaylistModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel-heavy p-8 rounded-3xl w-[90%] max-w-md border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowNewPlaylistModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-black mb-2 tracking-tighter text-glow">Crear Nueva Playlist</h3>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Crea una nueva lista de reproducción. Si tu cuenta de Spotify está conectada, se sincronizará automáticamente.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Nombre de la Playlist</label>
                                <input
                                    type="text"
                                    placeholder="Mi súper lista..."
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 text-white rounded-xl py-3 px-4 outline-none font-sans text-sm tracking-wide transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Descripción</label>
                                <textarea
                                    placeholder="Descripción corta..."
                                    value={newPlaylistDesc}
                                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 text-white rounded-xl py-3 px-4 outline-none font-sans text-sm tracking-wide transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowNewPlaylistModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleCreatePlaylist(newPlaylistName, newPlaylistDesc)}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#1db954] text-black font-black hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_0_20px_rgba(29,185,84,0.4)]"
                            >
                                Crear Playlist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add to Playlist Modal */}
            {showAddToPlaylistModal && trackToAddToPlaylist && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel-heavy p-8 rounded-3xl w-[90%] max-w-md border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowAddToPlaylistModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black mb-1 tracking-tighter text-glow">Añadir a Playlist</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-6">
                            Selecciona una lista de reproducción para añadir "{trackToAddToPlaylist.title}"
                        </p>
                        
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-1">
                            {/* Local Playlists */}
                            {sortPlaylistsByHistory(playlists).map(pl => (
                                <button 
                                    key={pl.id}
                                    onClick={() => {
                                        addTrackToPlaylist(trackToAddToPlaylist, pl.id, false);
                                        setShowAddToPlaylistModal(false);
                                    }}
                                    className="w-full flex items-center justify-between p-3.5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-2xl text-left transition-all text-sm group"
                                >
                                    <span className="font-bold text-white group-hover:text-[#1db954] transition-colors">{pl.name}</span>
                                    <span className="text-[10px] text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Local</span>
                                </button>
                            ))}
                            
                            {/* Spotify Playlists */}
                            {spotifyProfile && sortPlaylistsByHistory(spotifyPlaylists).map(pl => (
                                <button 
                                    key={pl.id}
                                    onClick={() => {
                                        addTrackToPlaylist(trackToAddToPlaylist, pl.id, true);
                                        setShowAddToPlaylistModal(false);
                                    }}
                                    className="w-full flex items-center justify-between p-3.5 bg-[#1db954]/5 border border-[#1db954]/10 hover:bg-[#1db954]/15 hover:border-[#1db954]/30 rounded-2xl text-left transition-all text-sm group"
                                >
                                    <span className="font-bold text-white group-hover:text-[#1db954] transition-colors truncate max-w-[70%]">{pl.name}</span>
                                    <span className="text-[10px] text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Spotify</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Party Mode Modal */}
            {showPartyModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel-heavy p-8 rounded-3xl w-[90%] max-w-md border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center">
                        <button onClick={() => setShowPartyModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-3xl font-black mb-2 text-glow flex items-center justify-center gap-2">
                            🎉 Party Mode
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Escucha sincronizado con tus amigos en tiempo real.
                        </p>
                        
                        {partyRoomId ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Tu Código de Sala</p>
                                    <h1 className="text-4xl font-mono font-black text-[#1db954] tracking-widest">{partyRoomId}</h1>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={leavePartyRoom} className="flex-1 py-3 px-4 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 font-black transition-all text-sm">
                                        Salir de la Sala
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <button onClick={createPartyRoom} className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white font-black transition-all text-sm shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                                    Crear Nueva Sala
                                </button>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-white/10"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-500 uppercase">o únete a una</span>
                                    <div className="flex-grow border-t border-white/10"></div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Código (Ej. X7B9K)"
                                        value={partyJoinInput}
                                        onChange={(e) => setPartyJoinInput(e.target.value.toUpperCase())}
                                        className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/50 text-white rounded-xl py-3 px-4 outline-none font-mono text-center text-lg tracking-widest transition-all"
                                        maxLength={6}
                                    />
                                    <button onClick={() => joinPartyRoom(partyJoinInput)} className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black transition-all text-sm">
                                        Unirse
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Flying Emojis Layer */}
            <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
                {flyingEmojis.map(e => (
                    <div 
                        key={e.id} 
                        className="absolute text-5xl animate-fly-up"
                        style={{ left: `${e.x}%`, bottom: '-50px' }}
                    >
                        {e.emoji}
                    </div>
                ))}
            </div>

            {/* Party Reactions Bar (Only visible if in room) */}
            {partyRoomId && isFullScreenPlayer && (
                <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50 animate-in slide-in-from-right duration-500">
                    {['🔥', '💖', '🤯', '🎶'].map(emoji => (
                        <button 
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); sendReaction(emoji); }}
                            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-2xl hover:scale-125 hover:bg-white/20 transition-all active:scale-90 shadow-lg"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
        );
        }