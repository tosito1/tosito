import { GameAnalyzer } from './analysis.js';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, getDocs, deleteDoc, query, where, limit, arrayUnion, orderBy, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1nq0H-TEep-ncVM-pV7NMiEHSdae94iw",
  authDomain: "tosito-chest.firebaseapp.com",
  databaseURL: "https://tosito-chest-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tosito-chest",
  storageBucket: "tosito-chest.firebasestorage.app",
  messagingSenderId: "645438147659",
  appId: "1:645438147659:web:658dda24a3ee3f401f11ce",
  measurementId: "G-9H38YSKSY4"
};

const appId = "1:645438147659:web:658dda24a3ee3f401f11ce";
let app, auth, db, user, userElo = 1200;
let userStats = { wins: 0, draws: 0, losses: 0 };
let userFriends = [];
let username = "";
let unsubGame = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch(e) {
  console.error("Firebase init failed", e);
}

// ─── ELEMENT CACHE ────────────────────────────────────────────────────────────
const els = {
  video: document.getElementById('videoInput'),
  pipCanvas: document.getElementById('pipCanvas'),
  status: document.getElementById('statusDisplay'),
  newGameBtn: document.getElementById('newGameBtn'),
  cameraToggleBtn: document.getElementById('cameraToggleBtn'),
  pipContainer: document.getElementById('pipContainer'),
  boardWrapper: document.getElementById('board-wrapper'),
  chessboard: document.getElementById('chessboard'),
  hintsLayer: document.getElementById('hints-layer'),
  cursor: document.getElementById('virtual-cursor'),
  pTimer: document.getElementById('player-timer'),
  aiTimer: document.getElementById('ai-timer'),
  pCap: document.getElementById('player-captured'),
  aiCap: document.getElementById('ai-captured'),
  btnHistStart: document.getElementById('btn-hist-start'),
  btnHistPrev: document.getElementById('btn-hist-prev'),
  btnHistNext: document.getElementById('btn-hist-next'),
  btnHistEnd: document.getElementById('btn-hist-end'),
  godModeBtn: document.getElementById('godModeBtn'),
  godModeActions: document.getElementById('godModeActions'),
  hintBtn: document.getElementById('hintBtn'),
  radarBtn: document.getElementById('radarBtn'),
  autoPlayBtn: document.getElementById('autoPlayBtn'),
  oracleText: document.getElementById('oracleText'),
  evalBar: document.getElementById('evalBar'),
  evalFill: document.getElementById('evalFill'),
  evalTextTop: document.getElementById('evalTextTop'),
  evalTextBottom: document.getElementById('evalTextBottom'),
  svgLayer: document.getElementById('svg-layer'),
  muteToggleBtn: document.getElementById('muteToggleBtn'),
  mainMenu: document.getElementById('mainMenu'),
  gameUI: document.getElementById('gameUI'),
  menuTabs: document.querySelectorAll('.menu-tab'),
  menuViews: document.querySelectorAll('.menu-view'),
  startIntroBtn: document.getElementById('startIntroBtn'),
  backToMenuBtn: document.getElementById('backToMenuBtn'),
  openThemeModalBtn: document.getElementById('openThemeModalBtn'),
  themeModal: document.getElementById('themeModal'),
  closeThemeModal: document.getElementById('closeThemeModal'),
  pieceThemesContainer: document.getElementById('pieceThemesContainer'),
  boardThemeBtns: document.querySelectorAll('.board-theme-btn'),
  promotionModal: document.getElementById('promotionModal'),
  promoPieces: document.getElementById('promoPieces'),
  gameOverModal: document.getElementById('gameOverModal'),
  goTitle: document.getElementById('goTitle'),
  goSubtitle: document.getElementById('goSubtitle'),
  goRestartBtn: document.getElementById('goRestartBtn'),
  studyPanel: document.getElementById('studyPanel'),
  studyTitle: document.getElementById('studyTitle'),
  studyDesc: document.getElementById('studyDesc'),
  studyPrevBtn: document.getElementById('studyPrevBtn'),
  studyNextBtn: document.getElementById('studyNextBtn'),
  studyProgress: document.getElementById('studyProgress'),
  studyTypeTag: document.getElementById('studyTypeTag'),
  hudTop: document.getElementById('hudTop'),
  hudBottom: document.getElementById('hudBottom'),
  historyControlsPanel: document.getElementById('historyControlsPanel'),
  startPuzzleBtn: document.getElementById('startPuzzleBtn'),
  liveHistoryPanel: document.getElementById('liveHistoryPanel'),
  moveList: document.getElementById('moveList'),
  startMatchmakingBtn: document.getElementById('startMatchmakingBtn'),
  matchmakingModal: document.getElementById('matchmakingModal'),
  cancelMatchmakingBtn: document.getElementById('cancelMatchmakingBtn'),
  matchmakingStatusText: document.getElementById('matchmakingStatusText'),
  hudTopName: document.getElementById('hudTopName'),
  hudBottomName: document.getElementById('hudBottomName'),
  userEloDisplay: document.getElementById('userEloDisplay'),
  voiceToggleBtn: document.getElementById('voiceToggleBtn'),
  turnDotAi: document.getElementById('turnDotAi'),
  turnDotP: document.getElementById('turnDotP'),
  toggle3D: document.getElementById('toggle3D'),
  arrowContainer: document.getElementById('arrow-container'),
  arrowLayer: document.getElementById('arrow-layer'),
  profileDisplayName: document.getElementById('profileDisplayName'),
  profileAvatarText: document.getElementById('profileAvatarText'),
  profileAvatarImg: document.getElementById('profileAvatarImg'),
  profileUsernameSpan: document.getElementById('profileUsernameSpan'),
  profileUsername: document.getElementById('profileUsername'),
  editUsernameBtn: document.getElementById('editUsernameBtn'),
  editUsernameContainer: document.getElementById('editUsernameContainer'),
  editUsernameInput: document.getElementById('editUsernameInput'),
  saveUsernameBtn: document.getElementById('saveUsernameBtn'),
  cancelUsernameBtn: document.getElementById('cancelUsernameBtn'),
  usernameError: document.getElementById('usernameError'),
  friendError: document.getElementById('friendError'),
  profileElo: document.getElementById('profileElo'),
  profileRankBadge: document.getElementById('profileRankBadge'),
  statWins: document.getElementById('statWins'),
  statDraws: document.getElementById('statDraws'),
  statLosses: document.getElementById('statLosses'),
  friendUidInput: document.getElementById('friendUidInput'),
  addFriendBtn: document.getElementById('addFriendBtn'),
  friendsList: document.getElementById('friendsList'),
  chatPanel: document.getElementById('chatPanel'),
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  openingSearch: document.getElementById('openingSearch'),
  openingsGrid: document.getElementById('openings-grid'),
  goAnalyzeBtn: document.getElementById('goAnalyzeBtn'),
  analysisPanel: document.getElementById('analysisPanel'),
  analysisStatus: document.getElementById('analysisStatus'),
  evalChart: document.getElementById('evalChart'),
  loginModal: document.getElementById('loginModal'),
  loginEmail: document.getElementById('loginEmail'),
  loginPass: document.getElementById('loginPass'),
  loginErrorMsg: document.getElementById('loginErrorMsg'),
  btnLoginEmail: document.getElementById('btnLoginEmail'),
  btnSignupEmail: document.getElementById('btnSignupEmail'),
  btnLoginGoogle: document.getElementById('btnLoginGoogle'),
  btnLoginGuest: document.getElementById('btnLoginGuest'),
  btnLogout: document.getElementById('btnLogout'),
  // New Pro features
  leaderboardList: document.getElementById('leaderboardList'),
  eloHistoryChart: document.getElementById('eloHistoryChart'),
  openingStatsContainer: document.getElementById('openingStatsContainer'),
  dailyChallengeContainer: document.getElementById('dailyChallengeContainer'),
  streamModeToggle: document.getElementById('streamModeToggle'),
  coordinateTrainer: document.getElementById('coordinateTrainer'),
  tacticsStreakEl: document.getElementById('tacticsStreak'),
  settingsBoardFlip: document.getElementById('settingsBoardFlip'),
  settingsAutoQueen: document.getElementById('settingsAutoQueen'),
  settingsShowCoords: document.getElementById('settingsShowCoords'),
  settingsHighlightMoves: document.getElementById('settingsHighlightMoves'),
  settingsSoundVolume: document.getElementById('settingsSoundVolume'),
  resignConfirmModal: document.getElementById('resignConfirmModal'),
  resignConfirmBtn: document.getElementById('resignConfirmBtn'),
  resignCancelBtn: document.getElementById('resignCancelBtn'),
  engineDepthSlider: document.getElementById('engineDepthSlider'),
  engineDepthDisplay: document.getElementById('engineDepthDisplay'),
  multiPvBtn: document.getElementById('multiPvBtn'),
  positionFenInput: document.getElementById('positionFenInput'),
  loadFenBtn: document.getElementById('loadFenBtn'),
  copyFenBtn: document.getElementById('copyFenBtn'),
  openingNameDisplay: document.getElementById('openingNameDisplay'),
  oracleBar: document.getElementById('oracleBar'),
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
async function handleLoginSuccess(u) {
  user = u;
  els.loginModal.style.display = 'none';
  els.mainMenu.style.display = 'flex';
  gsap.fromTo('.menu-sidebar', { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
  gsap.fromTo('.menu-tab', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, delay: 0.2, ease: 'power2.out' });
  gsap.fromTo('.menu-view.active', { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: 0.3, ease: 'power3.out' });
  await loadUserProfile();
  loadFirebaseOpenings();
  loadLeaderboard();
  checkDailyChallenge();
}

function showLoginError(msg) {
  els.loginErrorMsg.textContent = msg;
  els.loginErrorMsg.classList.remove('hidden');
  gsap.fromTo(els.loginErrorMsg, { x: -10 }, { x: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
}

async function initAuth() {
  if (!auth) return;
  els.btnLoginGoogle.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { showLoginError('Error de autenticación con Google'); }
  });
  els.btnLoginEmail.addEventListener('click', async () => {
    const email = els.loginEmail.value; const pass = els.loginPass.value;
    if (!email || !pass) return showLoginError('Introduce correo y contraseña');
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { showLoginError('Correo o contraseña incorrectos'); }
  });
  els.btnSignupEmail.addEventListener('click', async () => {
    const email = els.loginEmail.value; const pass = els.loginPass.value;
    if (!email || !pass) return showLoginError('Introduce correo y contraseña');
    try { await createUserWithEmailAndPassword(auth, email, pass); }
    catch (e) { showLoginError(e.code === 'auth/email-already-in-use' ? 'El correo ya está en uso' : 'Error al registrar (usa 6+ caracteres)'); }
  });
  els.btnLoginGuest.addEventListener('click', async () => {
    try { await signInAnonymously(auth); } catch (e) { showLoginError('Error al entrar como invitado'); }
  });
  els.btnLogout.addEventListener('click', async () => { await signOut(auth); location.reload(); });
  onAuthStateChanged(auth, async (u) => {
    if (u) { handleLoginSuccess(u); }
    else { els.loginModal.style.display = 'flex'; els.mainMenu.style.display = 'none'; }
  });
}
initAuth();

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
async function loadUserProfile() {
  if (!user) return;
  if (user.displayName) els.profileDisplayName.textContent = user.displayName;
  if (user.photoURL) {
    els.profileAvatarImg.src = user.photoURL;
    els.profileAvatarImg.classList.remove('hidden');
    els.profileAvatarText.classList.add('hidden');
  }
  const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
  const snap = await getDoc(profileRef);
  if (snap.exists()) {
    const data = snap.data();
    userElo = data.elo || 1200;
    userStats = data.stats || { wins: 0, draws: 0, losses: 0 };
    userFriends = data.friends || [];
    username = data.username || `Jugador_${Math.floor(Math.random() * 10000)}`;
    if (!data.username) await updateDoc(profileRef, { username }).catch(() => {});
    // Load settings
    if (data.settings) Object.assign(userSettings, data.settings);
  } else {
    username = `Jugador_${Math.floor(Math.random() * 10000)}`;
    await setDoc(profileRef, { elo: 1200, stats: userStats, friends: [], username, eloHistory: [{ elo: 1200, date: Date.now() }], settings: userSettings });
    userElo = 1200;
  }
  els.profileUsername.textContent = username;
  els.userEloDisplay.textContent = `ELO: ${Math.round(userElo)}`;
  updateProfileUI();
  renderOpeningsList();
  applySettings();
}

function getRank(elo) {
  if (elo < 800)  return { name: 'Hierro',    color: 'text-stone-400',  bg: 'bg-stone-900/30', border: 'border-stone-500/50',  icon: '🔩' };
  if (elo < 1000) return { name: 'Bronce',    color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50', icon: '🥉' };
  if (elo < 1200) return { name: 'Plata',     color: 'text-slate-300',  bg: 'bg-slate-700/30',  border: 'border-slate-400/50',  icon: '🥈' };
  if (elo < 1400) return { name: 'Oro',       color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', icon: '🥇' };
  if (elo < 1600) return { name: 'Platino',   color: 'text-teal-400',   bg: 'bg-teal-900/30',   border: 'border-teal-500/50',   icon: '💠' };
  if (elo < 1800) return { name: 'Diamante',  color: 'text-cyan-400',   bg: 'bg-cyan-900/30',   border: 'border-cyan-500/50',   icon: '💎' };
  if (elo < 2000) return { name: 'Maestro',   color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50', icon: '👑' };
  return { name: 'Gran Maestro', color: 'text-amber-300', bg: 'bg-amber-900/30', border: 'border-amber-400/50', icon: '🏆' };
}

function updateProfileUI() {
  if (!user) return;
  const rank = getRank(userElo);
  // Animated counter for ELO
  animateCounter(els.profileElo, parseInt(els.profileElo.textContent || 0), Math.round(userElo), 800);
  els.profileRankBadge.innerHTML = `${rank.icon} ${rank.name}`;
  els.profileRankBadge.className = `rank-badge ${rank.bg} ${rank.color} ${rank.border}`;
  // Animate stat counters
  animateCounter(els.statWins, 0, userStats.wins, 600);
  animateCounter(els.statDraws, 0, userStats.draws, 600);
  animateCounter(els.statLosses, 0, userStats.losses, 600);
  // Win rate
  const total = userStats.wins + userStats.draws + userStats.losses;
  const wr = total > 0 ? Math.round((userStats.wins / total) * 100) : 0;
  const wrEl = document.getElementById('statWinRate');
  if (wrEl) {
    animateCounter(wrEl, 0, wr, 700, '%');
  }
  renderFriendsList();
  renderEloHistoryChart();
}

// Animated number counter
function animateCounter(el, from, to, duration = 600, suffix = '') {
  if (!el) return;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = to + suffix;
  };
  requestAnimationFrame(update);
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const userSettings = {
  autoQueen: false,
  showCoords: true,
  highlightMoves: true,
  soundVolume: 0.7,
  streamMode: false,
  boardFlip: false,
};

function applySettings() {
  if (els.settingsAutoQueen) els.settingsAutoQueen.checked = userSettings.autoQueen;
  if (els.settingsShowCoords) els.settingsShowCoords.checked = userSettings.showCoords;
  if (els.settingsHighlightMoves) els.settingsHighlightMoves.checked = userSettings.highlightMoves;
  if (els.settingsSoundVolume) els.settingsSoundVolume.value = userSettings.soundVolume;
  if (els.streamModeToggle) els.streamModeToggle.checked = userSettings.streamMode;
  if (els.settingsBoardFlip) els.settingsBoardFlip.checked = userSettings.boardFlip;
  document.querySelectorAll('.square-label').forEach(el => {
    el.style.display = userSettings.showCoords ? '' : 'none';
  });
}

function saveSettings() {
  if (!user) return;
  const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
  updateDoc(profileRef, { settings: userSettings }).catch(() => {});
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
async function loadLeaderboard() {
  if (!els.leaderboardList || !db) return;
  try {
    const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'profiles');
    const q = query(profilesRef, orderBy('elo', 'desc'), limit(10));
    const snap = await getDocs(q);
    els.leaderboardList.innerHTML = '';
    let rank = 1;
    let rowIdx = 0;
    snap.forEach(d => {
      const data = d.data();
      const isMe = user && d.id === user.uid;
      const rankInfo = getRank(data.elo || 1200);
      const row = document.createElement('div');
      row.className = `leaderboard-row ${isMe ? 'leaderboard-me' : ''}`;
      row.innerHTML = `
        <span class="leaderboard-rank">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}</span>
        <span class="leaderboard-name">${data.username || 'Anónimo'} ${isMe ? '<span style="font-size:10px;color:#60a5fa">(Tú)</span>' : ''}</span>
        <span class="${rankInfo.color} font-bold text-xs">${rankInfo.icon} ${rankInfo.name}</span>
        <span class="leaderboard-elo">${Math.round(data.elo || 1200)}</span>
      `;
      els.leaderboardList.appendChild(row);
      // Staggered entrance
      gsap.fromTo(row, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.35, delay: rowIdx * 0.07, ease: 'power2.out' });
      rank++; rowIdx++;
    });
  } catch(e) { console.warn('Leaderboard load failed', e); }
}

// ─── ELO HISTORY CHART ────────────────────────────────────────────────────────
let eloChartObj = null;
async function renderEloHistoryChart() {
  if (!els.eloHistoryChart) return;
  try {
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
    const snap = await getDoc(profileRef);
    const data = snap.exists() ? snap.data() : {};
    const history = data.eloHistory || [{ elo: userElo, date: Date.now() }];
    const labels = history.map((_, i) => `P${i+1}`);
    const scores = history.map(h => Math.round(h.elo));
    if (eloChartObj) eloChartObj.destroy();
    const ctx = els.eloHistoryChart.getContext('2d');
    eloChartObj = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'ELO',
          data: scores,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#60a5fa',
          pointRadius: 4,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
        }
      }
    });
  } catch(e) { /* offline */ }
}

// ─── DAILY CHALLENGE ──────────────────────────────────────────────────────────
async function checkDailyChallenge() {
  if (!els.dailyChallengeContainer) return;
  const today = new Date().toISOString().slice(0, 10);
  const stored = localStorage.getItem('dailyChallenge');
  const done = localStorage.getItem('dailyChallengeDate') === today;
  if (done) {
    els.dailyChallengeContainer.innerHTML = `<div class="daily-done">✅ Reto de hoy completado. ¡Vuelve mañana!</div>`;
  }
}

// ─── FRIENDS ──────────────────────────────────────────────────────────────────
function renderFriendsList() {
  els.friendsList.innerHTML = '';
  if (userFriends.length === 0) {
    els.friendsList.innerHTML = '<div class="empty-state">Aún no tienes aliados.<br>¡Añade a un amigo para retarlo!</div>';
    return;
  }
  userFriends.forEach(f => {
    const friendId = typeof f === 'string' ? f : f.uid;
    const friendName = typeof f === 'string' ? f.substring(0, 8) + '...' : f.username;
    const fEl = document.createElement('div');
    fEl.className = 'friend-row';
    fEl.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="friend-avatar">👤<div class="friend-online-dot"></div></div>
        <div class="text-sm font-bold text-slate-200" title="${friendId}">${friendName}</div>
      </div>
      <button class="btn-small btn-primary" onclick="window.challengeFriend('${friendId}')">⚔️ Retar</button>
    `;
    els.friendsList.appendChild(fEl);
  });
}

window.challengeFriend = async function(friendId) {
  playSound('start');
  els.matchmakingModal.style.display = 'flex';
  els.matchmakingStatusText.textContent = "Esperando a tu amigo...";
  const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games');
  const newGameId = crypto.randomUUID();
  state.multiplayer = { gameId: newGameId, myColor: 'w', opponentElo: 1200 };
  await setDoc(doc(gamesRef, newGameId), { hostId: user.uid, hostElo: userElo, guestId: null, guestElo: null, status: 'waiting', fen: 'start', history: [], turn: 'w', lastMoveTime: Date.now(), isPrivate: true, targetFriendId: friendId, chat: [] });
  listenToGame(newGameId);
};

// ─── OPENINGS ─────────────────────────────────────────────────────────────────
let OPENINGS_DATA = [];

async function loadFirebaseOpenings() {
  try {
    const openingsRef = collection(db, 'openings');
    const snapshot = await getDocs(openingsRef);
    if (!snapshot.empty) {
      OPENINGS_DATA = snapshot.docs.map(docSnap => {
        const op = docSnap.data();
        return { id: docSnap.id, name: op.name || docSnap.id, type: 'white', difficulty: 'Intermedio', tag: op.eco || 'ECO', moves: op.moves_san || [], description_global: op.description || '', descriptions: [] };
      });
      renderOpeningsList();
    }
  } catch (error) { console.warn("Error al cargar aperturas:", error); }
}

// ─── PUZZLES ──────────────────────────────────────────────────────────────────
const PUZZLES_DATA = [
  { fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', moves: ['Re8#'], desc: 'Mate del Pasillo', difficulty: 'Fácil' },
  { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', moves: ['Qxf7#'], desc: 'Mate del Pastor', difficulty: 'Fácil' },
  { fen: 'r1b1k2r/pppp1ppp/8/4N3/2B4q/8/PPPP2PP/RNBQK2R w KQkq - 1 8', moves: ['Bxf7+', 'Ke7', 'O-O'], desc: 'Ataque con Enroque', difficulty: 'Intermedio' },
  { fen: '5rk1/pp4pp/4p3/2R3Q1/3n4/2q4r/P1P2PPP/1R4K1 b - - 0 1', moves: ['Qg3+', 'Kh1', 'Rxh2+', 'Kxh2', 'Nf3#'], desc: 'Combinación en 5', difficulty: 'Avanzado' },
  { fen: 'r2qr1k1/ppp2ppp/3b4/3P4/3B4/2QB4/PPP2PPP/R3K2R w KQ - 0 1', moves: ['Bxh7+', 'Kxh7', 'Qh5+', 'Kg8', 'Bg6'], desc: 'Sacrificio griego', difficulty: 'Avanzado' },
  { fen: '4r1k1/pp3ppp/3b4/3p4/3N4/4B3/PPP2PPP/R5K1 w - - 0 1', moves: ['Nf5', 'Bxf5', 'Bxf5'], desc: 'Intercambio táctico', difficulty: 'Intermedio' },
  { fen: '2r2rk1/pp2qppp/2p1p3/8/3P4/2PBQ3/PP3PPP/R4RK1 w - - 0 1', moves: ['Bxh7+', 'Kxh7', 'Qxe6'], desc: 'Destrucción de defensa', difficulty: 'Avanzado' },
  { fen: '6k1/p4ppp/2p5/2b5/1P2N3/8/5PPP/6K1 w - - 0 1', moves: ['Nd6', 'Bxd6', 'b5'], desc: 'Pasada imparable', difficulty: 'Intermedio' },
];

let tacticsStreak = parseInt(localStorage.getItem('tacticsStreak') || '0');
let tacticsTotal = parseInt(localStorage.getItem('tacticsTotal') || '0');

function updateTacticsUI() {
  if (els.tacticsStreakEl) els.tacticsStreakEl.textContent = `🔥 ${tacticsStreak}`;
  const totalEl = document.getElementById('tacticsTotal');
  if (totalEl) totalEl.textContent = tacticsTotal;
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────
const state = {
  game: null, stockfish: null, isEngineCalculating: false,
  boardSize: 800, squareSize: 100, viewIndex: 0,
  gameMode: 'play', studyData: null, studyIndex: 0, currentPuzzle: null, puzzleMoveIndex: 0,
  playerColor: 'w', multiplayer: { gameId: null, opponentElo: 1200 },
  config: { time: 600, difficulty: 10, engineDepth: 12 },
  hasGameStarted: false, isTimeOut: false, isSfxMuted: false, isVoiceMuted: true,
  playerTime: 600, aiTime: 600, timerInterval: null, lastTimerTick: null,
  isCameraActive: false, cameraInstance: null,
  cursorX: 400, cursorY: 400, isPinching: false, lastPinchX: 0, lastPinchY: 0,
  pinchThresholdStart: 0.045, pinchThresholdStop: 0.065,
  framesWithoutPinch: 0, maxFramesToDrop: 5, smoothingFactor: 0.4, movementSensitivity: 1.8,
  isPointerDown: false, pointerActiveTime: 0,
  draggedPieceEl: null, draggedFromSq: null, validDestinations: [], piecesDOM: {},
  isMouseDragging: false, mouseOffsetX: 0, mouseOffsetY: 0,
  godModeActive: false, isHintRequest: false, isAutoPlayRequest: false, isRadarActive: false,
  radarHighlights: [], hintHighlights: [], lastHoverSq: null, threatHighlights: [],
  boardTheme: 'basic', pieceTheme: 'cburnett', pendingPromotion: null,
  lastMoveHighlights: [], checkPulseEl: null, listenersAdded: false,
  is3dTiltEnabled: true, boardScale: 1, arrowStartSq: null, customArrows: [],
  currentOpeningName: '', moveAccuracies: [],
  coordinateTrainingActive: false, coordinateTarget: null, coordinateScore: 0, coordinateTimer: null,
  multiPvLines: [], showMultiPv: false,
};

let analyzer = null;
let evalChartObj = null;

function getPieceUrl(color, type) {
  return `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${state.pieceTheme}/${color}${type.toUpperCase()}.svg`;
}

const pipCtx = els.pipCanvas ? els.pipCanvas.getContext('2d') : null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const synth = window.speechSynthesis;

function speak(text) {
  if (state.isVoiceMuted || !synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES'; utterance.rate = 1.1;
  synth.speak(utterance);
}

function playSound(type, volume = 1.0) {
  if (state.isSfxMuted) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const vol = (userSettings.soundVolume || 0.7) * volume;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  switch (type) {
    case 'move':    osc.type='sine';     osc.frequency.setValueAtTime(300,now); osc.frequency.exponentialRampToValueAtTime(100,now+0.1); gainNode.gain.setValueAtTime(vol*0.5,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.1); osc.start(now); osc.stop(now+0.1); break;
    case 'capture': osc.type='triangle'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(150,now+0.15); gainNode.gain.setValueAtTime(vol*0.6,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.15); osc.start(now); osc.stop(now+0.15); break;
    case 'check':   osc.type='square';   osc.frequency.setValueAtTime(600,now); gainNode.gain.setValueAtTime(vol*0.3,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.4); osc.start(now); osc.stop(now+0.4); break;
    case 'start':   osc.type='sine';     osc.frequency.setValueAtTime(440,now); osc.frequency.linearRampToValueAtTime(880,now+0.3); gainNode.gain.setValueAtTime(0,now); gainNode.gain.linearRampToValueAtTime(vol*0.5,now+0.1); gainNode.gain.linearRampToValueAtTime(0,now+0.4); osc.start(now); osc.stop(now+0.4); break;
    case 'good':    osc.type='sine';     osc.frequency.setValueAtTime(523,now); osc.frequency.linearRampToValueAtTime(659,now+0.15); gainNode.gain.setValueAtTime(vol*0.4,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.3); osc.start(now); osc.stop(now+0.3); break;
    case 'bad':     osc.type='sawtooth'; osc.frequency.setValueAtTime(220,now); osc.frequency.exponentialRampToValueAtTime(110,now+0.2); gainNode.gain.setValueAtTime(vol*0.4,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.2); osc.start(now); osc.stop(now+0.2); break;
    case 'castle':  osc.type='sine';     osc.frequency.setValueAtTime(350,now); osc.frequency.linearRampToValueAtTime(500,now+0.2); gainNode.gain.setValueAtTime(vol*0.5,now); gainNode.gain.exponentialRampToValueAtTime(0.01,now+0.25); osc.start(now); osc.stop(now+0.25); break;
  }
}

// ─── BOARD GEOMETRY ───────────────────────────────────────────────────────────
function resizeBoard() {
  const maxW = window.innerWidth * 0.96;
  const boardScaler = document.querySelector('.board-scaler');
  const availableH = boardScaler ? boardScaler.clientHeight : window.innerHeight;
  const maxH = availableH * 0.85;
  state.boardScale = Math.min(maxW, maxH) / 800;
  updateBoardTransform();
}
window.addEventListener('resize', resizeBoard);

function squareToPixel(sq) {
  const files = ['a','b','c','d','e','f','g','h'];
  const reverse = state.playerColor === 'b';
  const col = files.indexOf(sq[0]); const row = 8 - parseInt(sq[1], 10);
  const visualCol = reverse ? 7 - col : col; const visualRow = reverse ? 7 - row : row;
  return { x: visualCol * 100, y: visualRow * 100 };
}

function pixelToSquare(x, y) {
  const visualCol = Math.floor(x / 100); const visualRow = Math.floor(y / 100);
  if (visualCol < 0 || visualCol > 7 || visualRow < 0 || visualRow > 7) return null;
  const reverse = state.playerColor === 'b';
  const col = reverse ? 7 - visualCol : visualCol; const row = reverse ? 7 - visualRow : visualRow;
  return `${['a','b','c','d','e','f','g','h'][col]}${8 - row}`;
}

function renderHints(squares) {
  els.hintsLayer.innerHTML = '';
  squares.forEach((sq, i) => {
    const pos = squareToPixel(sq);
    const dot = document.createElement('div');
    const isCap = state.game.get(sq);
    dot.className = `hint-dot ${isCap ? 'capture' : ''}`;
    dot.style.left = `${pos.x + 50}px`; dot.style.top = `${pos.y + 50}px`;
    els.hintsLayer.appendChild(dot);
    gsap.fromTo(dot, { scale: 0, xPercent: -50, yPercent: -50 }, { scale: 1, xPercent: -50, yPercent: -50, duration: 0.2, delay: i * 0.02, ease: "back.out(2)" });
  });
}

function updateBoardTransform(xAxis = 0, yAxis = 0) {
  if (state.is3dTiltEnabled) { els.boardWrapper.style.transform = `scale(${state.boardScale}) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`; }
  else { els.boardWrapper.style.transform = `scale(${state.boardScale}) rotateY(0deg) rotateX(0deg)`; }
}
document.addEventListener('mousemove', (e) => {
  if (!state.is3dTiltEnabled || state.isMouseDragging) return;
  updateBoardTransform((window.innerWidth / 2 - e.pageX) / 75, (window.innerHeight / 2 - e.pageY) / 75);
});
if (els.toggle3D) els.toggle3D.addEventListener('change', (e) => { state.is3dTiltEnabled = e.target.checked; updateBoardTransform(); });

// ─── MULTIPLAYER ──────────────────────────────────────────────────────────────
els.startMatchmakingBtn.addEventListener('click', async () => {
  if (!user) return;
  els.matchmakingModal.style.display = 'flex';
  els.matchmakingStatusText.textContent = "Buscando oponentes de tu nivel...";
  const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games');
  let foundGame = null;
  const q = query(gamesRef, where("status", "==", "waiting"), limit(5));
  const snap = await getDocs(q);
  snap.forEach(d => { const g = d.data(); if (g.hostId !== user.uid && !g.isPrivate) { foundGame = { id: d.id, ...g }; } });
  if (foundGame) {
    state.multiplayer = { gameId: foundGame.id, opponentElo: foundGame.hostElo };
    state.playerColor = 'b';
    await updateDoc(doc(gamesRef, foundGame.id), { guestId: user.uid, guestElo: userElo, status: 'playing' });
    listenToGame(foundGame.id);
  } else {
    els.matchmakingStatusText.textContent = "Buscando oponentes activos...";
    setTimeout(() => {
      els.matchmakingModal.style.display = 'none';
      state.multiplayer = { gameId: null, opponentElo: Math.round(userElo + (Math.random() * 40 - 20)) };
      state.playerColor = Math.random() > 0.5 ? 'w' : 'b';
      playSound('start');
      state.gameMode = 'multiplayer';
      state.config.difficulty = Math.max(1, Math.min(20, Math.floor(userElo / 100)));
      gsap.to(els.mainMenu, { opacity: 0, duration: 0.5, onComplete: () => {
        els.mainMenu.style.display = "none"; els.gameUI.style.display = "flex";
        gsap.to(els.gameUI, { opacity: 1, duration: 0.5 });
        initGame();
        if (state.playerColor === 'b') setTimeout(makeEngineMove, Math.floor(Math.random() * 500) + 800);
      }});
    }, 2500);
  }
});

els.cancelMatchmakingBtn.addEventListener('click', async () => {
  els.matchmakingModal.style.display = 'none';
  if (unsubGame) unsubGame();
  if (state.multiplayer.gameId && state.playerColor === 'w') {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId)).catch(() => {});
  }
});

function listenToGame(gameId) {
  if (unsubGame) unsubGame();
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', gameId);
  unsubGame = onSnapshot(gameRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (data.status === 'playing' && state.gameMode !== 'multiplayer') {
      els.matchmakingModal.style.display = 'none';
      state.multiplayer.opponentElo = state.playerColor === 'w' ? data.guestElo : data.hostElo;
      playSound('start');
      state.gameMode = 'multiplayer';
      gsap.to(els.mainMenu, { opacity: 0, duration: 0.5, onComplete: () => { els.mainMenu.style.display = "none"; els.gameUI.style.display = "flex"; gsap.to(els.gameUI, { opacity: 1, duration: 0.5 }); initGame(); }});
    }
    if (state.gameMode === 'multiplayer') {
      if (data.chat && data.chat.length > 0) renderChat(data.chat);
      if (data.status === 'finished' && !state.game.game_over() && data.reason === 'resign') {
        clearInterval(state.timerInterval);
        const iWon = (data.winner === state.playerColor);
        showGameOver(iWon ? "Victoria" : "Derrota", "Por Abandono", iWon ? "jedi" : "sith");
        return;
      }
      if (data.fen !== 'start' && data.fen !== state.game.fen()) {
        if (data.history && data.history.length > 0) { state.game.reset(); data.history.forEach(m => state.game.move(m)); }
        else { state.game.load(data.fen); }
        state.viewIndex = state.game.history().length;
        playSound('move'); syncBoardToDOM(); updateStatus(); updateMoveHistoryUI(); updateCapturedPieces();
      }
    }
  }, (err) => console.error(err));
}

els.chatInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && els.chatInput.value.trim() !== '' && user && state.multiplayer.gameId) {
    const msg = els.chatInput.value.trim(); els.chatInput.value = '';
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId);
    await updateDoc(gameRef, { chat: arrayUnion({ sender: user.uid, text: msg, color: state.playerColor }) }).catch(console.error);
  }
});

function renderChat(chatArray) {
  els.chatMessages.innerHTML = '';
  chatArray.forEach(msg => {
    const isMine = msg.sender === user.uid;
    const div = document.createElement('div');
    div.className = `chat-bubble ${isMine ? 'chat-mine' : 'chat-theirs'}`;
    div.innerHTML = `<b>${isMine ? 'Tú' : 'Rival'}:</b> ${msg.text}`;
    els.chatMessages.appendChild(div);
  });
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function calculateEloUpdate(winner) {
  if (!user || state.gameMode !== 'multiplayer') return;
  const iWon = (winner === 'w' && state.playerColor === 'w') || (winner === 'b' && state.playerColor === 'b');
  const iLost = (winner === 'b' && state.playerColor === 'w') || (winner === 'w' && state.playerColor === 'b');
  const isDraw = winner === 'draw';
  if (iWon) userStats.wins++; else if (iLost) userStats.losses++; else if (isDraw) userStats.draws++;
  let S = 0.5; if (iWon) S = 1; else if (iLost) S = 0;
  const expected = 1 / (1 + Math.pow(10, (state.multiplayer.opponentElo - userElo) / 400));
  const oldElo = userElo; userElo = userElo + 32 * (S - expected); const diff = Math.round(userElo - oldElo);
  const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
  updateDoc(profileRef, { elo: userElo, stats: userStats, eloHistory: arrayUnion({ elo: Math.round(userElo), date: Date.now() }) }).catch(() => {});
  els.userEloDisplay.textContent = `ELO: ${Math.round(userElo)}`; updateProfileUI();
  return { old: oldElo, new: userElo, diff: diff > 0 ? '+' + diff : diff };
}

// ─── OPENINGS LIST ────────────────────────────────────────────────────────────
function renderOpeningsList() {
  if (!els.openingsGrid) return;
  els.openingsGrid.innerHTML = '';
  const searchVal = els.openingSearch ? els.openingSearch.value.toLowerCase() : '';
  const filterBtn = document.querySelector('.opening-filter-btn.active');
  const activeFilter = filterBtn ? filterBtn.dataset.filter : 'all';
  const filtered = OPENINGS_DATA.filter(op => {
    const matchesSearch = op.name.toLowerCase().includes(searchVal) || op.moves.join(' ').toLowerCase().includes(searchVal);
    const matchesTab = activeFilter === 'all' || op.type === activeFilter;
    return matchesSearch && matchesTab;
  });
  if (filtered.length === 0) {
    els.openingsGrid.innerHTML = '<div class="empty-state col-span-2">No se encontraron aperturas.</div>'; return;
  }
  filtered.forEach((op, idx) => {
    const diffColors = { 'Fácil': 'diff-easy', 'Intermedio': 'diff-mid', 'Avanzado': 'diff-hard' };
    const card = document.createElement('div');
    card.className = 'opening-card';
    card.style.animationDelay = `${idx * 0.05}s`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="diff-badge ${diffColors[op.difficulty] || 'diff-mid'}">${op.difficulty}</span>
        <span class="eco-badge">${op.tag}</span>
      </div>
      <h4 class="opening-name">${op.name}</h4>
      <div class="opening-moves">${op.moves.slice(0, 6).join(' ')}${op.moves.length > 6 ? '...' : ''}</div>
      <div class="opening-footer">
        <span class="opening-side">${op.type === 'white' ? '⚪ Blancas' : '⚫ Negras'}</span>
        <button class="btn-small btn-primary">Aprender →</button>
      </div>
    `;
    // 3D tilt effect on hover
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / rect.height) * 8;
      const rotY = (x / rect.width) * 8;
      card.style.transform = `translateY(-8px) scale(1.01) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
    card.querySelector('button').onclick = () => startStudyMode(op);
    els.openingsGrid.appendChild(card);
    // Stagger entrance animation
    gsap.fromTo(card, { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, delay: idx * 0.06, ease: 'power2.out' });
  });
}

// ─── OPENING DETECTION ────────────────────────────────────────────────────────
const KNOWN_OPENINGS = [
  { name: "Apertura Italiana", moves: ["e4","e5","Nf3","Nc6","Bc4"] },
  { name: "Apertura Española", moves: ["e4","e5","Nf3","Nc6","Bb5"] },
  { name: "Defensa Siciliana", moves: ["e4","c5"] },
  { name: "Defensa Francesa", moves: ["e4","e6"] },
  { name: "Apertura Inglesa", moves: ["c4"] },
  { name: "Gambito de Dama", moves: ["d4","d5","c4"] },
  { name: "Defensa Nimzo-India", moves: ["d4","Nf6","c4","e6","Nc3","Bb4"] },
  { name: "Defensa Caro-Kann", moves: ["e4","c6"] },
  { name: "Gambito de Rey", moves: ["e4","e5","f4"] },
  { name: "Apertura de los Cuatro Caballos", moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6"] },
];

function detectOpening() {
  if (!state.game) return;
  const history = state.game.history();
  let bestMatch = '';
  KNOWN_OPENINGS.forEach(op => {
    if (history.length >= op.moves.length) {
      const slice = history.slice(0, op.moves.length);
      if (JSON.stringify(slice) === JSON.stringify(op.moves)) bestMatch = op.name;
    }
  });
  if (bestMatch && bestMatch !== state.currentOpeningName) {
    state.currentOpeningName = bestMatch;
    if (els.openingNameDisplay) {
      els.openingNameDisplay.textContent = bestMatch;
      gsap.fromTo(els.openingNameDisplay, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.4 });
    }
  } else if (!bestMatch && history.length > 8) {
    state.currentOpeningName = '';
    if (els.openingNameDisplay) els.openingNameDisplay.textContent = '';
  }
}

// ─── MENU SETUP ───────────────────────────────────────────────────────────────
function setupMenu() {
  if (els.muteToggleBtn) els.muteToggleBtn.addEventListener('click', () => {
    state.isSfxMuted = !state.isSfxMuted;
    els.muteToggleBtn.innerHTML = state.isSfxMuted ? '🔇 Activar Sonido' : '🔊 Desactivar Sonido';
    if (!state.isSfxMuted) playSound('move');
  });
  if (els.voiceToggleBtn) els.voiceToggleBtn.addEventListener('click', () => {
    state.isVoiceMuted = !state.isVoiceMuted;
    els.voiceToggleBtn.innerHTML = state.isVoiceMuted ? '🗣️ Activar Narrador' : '🗣️ Desactivar Narrador';
    if (!state.isVoiceMuted) speak("Narrador activado");
  });

  // Username edit
  if (els.editUsernameBtn) els.editUsernameBtn.addEventListener('click', () => {
    els.profileUsernameSpan.classList.add('hidden');
    els.editUsernameContainer.classList.remove('hidden');
    els.editUsernameContainer.classList.add('flex');
    els.editUsernameInput.value = username;
    els.usernameError.classList.add('hidden');
  });
  if (els.cancelUsernameBtn) els.cancelUsernameBtn.addEventListener('click', () => {
    els.editUsernameContainer.classList.add('hidden');
    els.editUsernameContainer.classList.remove('flex');
    els.profileUsernameSpan.classList.remove('hidden');
  });
  if (els.saveUsernameBtn) els.saveUsernameBtn.addEventListener('click', async () => {
    const newName = els.editUsernameInput.value.trim();
    if (!newName || newName === username) { els.cancelUsernameBtn.click(); return; }
    if (newName.length < 3 || newName.length > 15) { els.usernameError.textContent = "Debe tener entre 3 y 15 caracteres."; els.usernameError.classList.remove('hidden'); return; }
    els.saveUsernameBtn.textContent = "..."; els.saveUsernameBtn.disabled = true;
    try {
      const profilesSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'));
      let isTaken = false;
      profilesSnap.forEach(d => { if (d.data().username === newName) isTaken = true; });
      if (isTaken) { els.usernameError.textContent = "Ese nombre ya está en uso."; els.usernameError.classList.remove('hidden'); }
      else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), { username: newName });
        username = newName; els.profileUsername.textContent = username; els.cancelUsernameBtn.click();
      }
    } catch (e) { els.usernameError.textContent = "Error de conexión."; els.usernameError.classList.remove('hidden'); }
    els.saveUsernameBtn.textContent = "Guardar"; els.saveUsernameBtn.disabled = false;
  });

  // Add friend
  if (els.addFriendBtn) els.addFriendBtn.addEventListener('click', async () => {
    const fName = els.friendUidInput.value.trim();
    if (!fName || fName === username) return;
    const alreadyFriend = userFriends.some(f => (typeof f === 'string' ? f === fName : f.username === fName));
    if (alreadyFriend) { els.friendError.textContent = "Este usuario ya está en tu lista."; els.friendError.classList.remove('hidden'); return; }
    els.addFriendBtn.textContent = "..."; els.addFriendBtn.disabled = true; els.friendError.classList.add('hidden');
    try {
      const profilesSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'));
      let foundFriend = null;
      profilesSnap.forEach(d => { const data = d.data(); if (data.username === fName) foundFriend = { uid: d.id, username: data.username }; });
      if (foundFriend) {
        userFriends.push(foundFriend); els.friendUidInput.value = ''; renderFriendsList();
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), { friends: userFriends }).catch(() => {});
      } else { els.friendError.textContent = "No se encontró ese usuario."; els.friendError.classList.remove('hidden'); }
    } catch (e) { els.friendError.textContent = "Error de red."; els.friendError.classList.remove('hidden'); }
    els.addFriendBtn.textContent = "Añadir"; els.addFriendBtn.disabled = false;
  });

  // Menu tabs
  const menuContent = document.querySelector('.menu-content');
  els.menuTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      els.menuTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const currentView = document.querySelector('.menu-view.active');
      const targetView = document.getElementById(tab.dataset.target);
      if (!targetView) return;
      if (currentView) {
        gsap.to(currentView, { opacity: 0, y: -15, scale: 0.98, duration: 0.18, onComplete: () => {
          currentView.classList.remove('active');
          targetView.classList.add('active');
          gsap.fromTo(targetView, { opacity: 0, y: 15, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" });
          if (menuContent) menuContent.scrollTop = 0;
          // Lazy-load data for specific views
          if (tab.dataset.target === 'view-leaderboard') loadLeaderboard();
          if (tab.dataset.target === 'view-profile') { updateProfileUI(); renderEloHistoryChart(); }
        }});
      } else { targetView.classList.add('active'); }
      playSound('move');
    });
  });

  // Openings search & filter
  if (els.openingSearch) els.openingSearch.addEventListener('input', renderOpeningsList);
  document.querySelectorAll('.opening-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.opening-filter-btn').forEach(b => { b.classList.remove('active'); });
      btn.classList.add('active');
      playSound('move'); renderOpeningsList();
    });
  });

  // Color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('color-btn-selected'));
      btn.classList.add('color-btn-selected');
      document.getElementById('introColor').value = btn.dataset.color;
      playSound('move');
    });
  });

  // Start game button
  if (els.startIntroBtn) els.startIntroBtn.addEventListener('click', () => {
    playSound('start');
    state.gameMode = 'play';
    state.config.time = parseInt(document.getElementById("introTimeControl").value, 10);
    state.config.difficulty = parseInt(document.getElementById("introDifficulty").value, 10);
    state.config.engineDepth = parseInt(els.engineDepthSlider ? els.engineDepthSlider.value : '12');
    let colorVal = document.getElementById("introColor").value;
    if (colorVal === 'random') colorVal = Math.random() > 0.5 ? 'w' : 'b';
    state.playerColor = colorVal;
    gsap.to(els.mainMenu, { opacity: 0, duration: 0.5, onComplete: () => {
      els.mainMenu.style.display = "none"; els.gameUI.style.display = "flex";
      gsap.to(els.gameUI, { opacity: 1, duration: 0.5 });
      initGame();
      if (state.playerColor === 'b') { updateStatus("La IA está pensando..."); setTimeout(makeEngineMove, Math.floor(Math.random() * 500) + 800); }
    }});
  });

  // Back to menu
  if (els.backToMenuBtn) els.backToMenuBtn.addEventListener('click', () => {
    if (state.stockfish) { state.stockfish.terminate(); state.stockfish = null; }
    if (unsubGame) unsubGame(); clearInterval(state.timerInterval);
    gsap.to(els.gameUI, { opacity: 0, duration: 0.5, onComplete: () => {
      els.gameUI.style.display = "none"; els.mainMenu.style.display = "flex";
      gsap.to(els.mainMenu, { opacity: 1, duration: 0.5 });
    }});
  });

  // New game / resign
  if (els.newGameBtn) els.newGameBtn.addEventListener('click', async () => {
    if (state.gameMode === 'multiplayer' && state.multiplayer.gameId && !state.game.game_over()) {
      // Show resign confirm
      if (els.resignConfirmModal) els.resignConfirmModal.style.display = 'flex';
      else doResign();
    } else if (state.gameMode === 'multiplayer' && !state.multiplayer.gameId) {
      els.backToMenuBtn.click();
    } else { startNewGame(); }
  });
  if (els.resignConfirmBtn) els.resignConfirmBtn.addEventListener('click', doResign);
  if (els.resignCancelBtn) els.resignCancelBtn.addEventListener('click', () => { if (els.resignConfirmModal) els.resignConfirmModal.style.display = 'none'; });

  // Puzzle
  if (els.startPuzzleBtn) els.startPuzzleBtn.addEventListener('click', startRandomPuzzle);

  // Theme selection
  if (els.boardThemeBtns) els.boardThemeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.boardThemeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); state.boardTheme = btn.dataset.board;
      document.body.setAttribute('data-board', state.boardTheme); playSound('move');
    });
  });

  // Piece sets
  const pieceSets = ['cburnett', 'alpha', 'merida', 'california', 'staunty', 'tatiana'];
  if (els.pieceThemesContainer) {
    pieceSets.forEach(set => {
      const card = document.createElement('div');
      card.className = `theme-card piece-theme-btn ${set === state.pieceTheme ? 'active' : ''}`;
      card.dataset.set = set;
      card.innerHTML = `<div class="theme-preview-piece" style="background-image:url('https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${set}/wN.svg')"></div><div class="piece-theme-label">${set}</div>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('.piece-theme-btn').forEach(b => b.classList.remove('active'));
        card.classList.add('active'); state.pieceTheme = set; updateAllPiecesGraphics(); playSound('move');
      });
      els.pieceThemesContainer.appendChild(card);
    });
  }

  if (els.openThemeModalBtn) els.openThemeModalBtn.addEventListener('click', () => {
    els.themeModal.style.display = 'flex';
    gsap.fromTo(els.themeModal.children[0], { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
  });
  if (els.closeThemeModal) els.closeThemeModal.addEventListener('click', () => { els.themeModal.style.display = 'none'; });

  // Study navigation
  if (els.studyNextBtn) els.studyNextBtn.addEventListener('click', () => {
    if (state.gameMode === 'puzzle') { startRandomPuzzle(); return; }
    if (state.studyIndex < state.studyData.moves.length) {
      const moveObj = state.game.move(state.studyData.moves[state.studyIndex]);
      if (moveObj) { finishMoveVisuals(moveObj); state.viewIndex = state.game.history().length; syncBoardToDOM(); state.studyIndex++; updateStudyUI(); }
    }
  });
  if (els.studyPrevBtn) els.studyPrevBtn.addEventListener('click', () => {
    if (state.gameMode === 'puzzle' || state.studyIndex <= 0) return;
    state.game.undo(); state.viewIndex = state.game.history().length; syncBoardToDOM(); state.studyIndex--; updateStudyUI();
  });

  // Engine depth slider
  if (els.engineDepthSlider) {
    els.engineDepthSlider.addEventListener('input', () => {
      state.config.engineDepth = parseInt(els.engineDepthSlider.value);
      if (els.engineDepthDisplay) els.engineDepthDisplay.textContent = state.config.engineDepth;
    });
  }

  // Multi-PV toggle
  if (els.multiPvBtn) els.multiPvBtn.addEventListener('click', () => {
    state.showMultiPv = !state.showMultiPv;
    els.multiPvBtn.classList.toggle('active', state.showMultiPv);
    els.multiPvBtn.textContent = state.showMultiPv ? '🔍 Multi-PV: ON' : '🔍 Multi-PV';
  });

  // FEN tools
  if (els.loadFenBtn) els.loadFenBtn.addEventListener('click', () => {
    const fen = els.positionFenInput ? els.positionFenInput.value.trim() : '';
    if (!fen || !state.game) return;
    try {
      state.game.load(fen);
      state.viewIndex = state.game.history().length;
      syncBoardToDOM(); updateStatus(); updateMoveHistoryUI();
      updateHistoryButtons(); playSound('start');
    } catch(e) { alert('FEN inválido'); }
  });
  if (els.copyFenBtn) els.copyFenBtn.addEventListener('click', () => {
    if (!state.game) return;
    navigator.clipboard.writeText(state.game.fen()).then(() => {
      els.copyFenBtn.textContent = '✅ Copiado';
      setTimeout(() => { els.copyFenBtn.textContent = '📋 Copiar FEN'; }, 1500);
    });
  });

  // Settings toggles
  if (els.settingsAutoQueen) els.settingsAutoQueen.addEventListener('change', e => { userSettings.autoQueen = e.target.checked; saveSettings(); });
  if (els.settingsShowCoords) els.settingsShowCoords.addEventListener('change', e => { userSettings.showCoords = e.target.checked; applySettings(); saveSettings(); });
  if (els.settingsHighlightMoves) els.settingsHighlightMoves.addEventListener('change', e => { userSettings.highlightMoves = e.target.checked; saveSettings(); });
  if (els.settingsSoundVolume) els.settingsSoundVolume.addEventListener('input', e => { userSettings.soundVolume = parseFloat(e.target.value); saveSettings(); });
  if (els.streamModeToggle) els.streamModeToggle.addEventListener('change', e => { userSettings.streamMode = e.target.checked; document.body.classList.toggle('stream-mode', e.target.checked); saveSettings(); });
  if (els.settingsBoardFlip) els.settingsBoardFlip.addEventListener('change', e => {
    userSettings.boardFlip = e.target.checked;
    if (state.game && state.hasGameStarted) { state.playerColor = e.target.checked ? (state.playerColor === 'w' ? 'b' : 'w') : state.playerColor; syncBoardToDOM(); }
    saveSettings();
  });

  // History navigation
  if (els.btnHistStart) els.btnHistStart.addEventListener('click', () => viewHistory(0));
  if (els.btnHistPrev) els.btnHistPrev.addEventListener('click', () => viewHistory(state.viewIndex - 1));
  if (els.btnHistNext) els.btnHistNext.addEventListener('click', () => viewHistory(state.viewIndex + 1));
  if (els.btnHistEnd) els.btnHistEnd.addEventListener('click', () => viewHistory(state.game.history().length));

  // Oracle / God Mode — toggles the oracle bar visibility
  if (els.godModeBtn) els.godModeBtn.addEventListener('click', () => {
    state.godModeActive = !state.godModeActive;
    els.godModeBtn.classList.toggle('active', state.godModeActive);
    const oracleBar = document.getElementById('oracleBar');
    if (oracleBar) {
      if (state.godModeActive) {
        oracleBar.style.display = 'block';
        gsap.fromTo(oracleBar, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
        askOracle();
      } else {
        gsap.to(oracleBar, { opacity: 0, y: -10, duration: 0.2, onComplete: () => { oracleBar.style.display = 'none'; } });
        clearGodHighlights();
        // Reset all tool btn states
        document.getElementById('radarBtn')?.classList.remove('active-radar');
        document.getElementById('autoPlayBtn')?.classList.remove('active-autoplay');
        document.getElementById('hintBtn')?.classList.remove('active-hint');
        state.isRadarActive = false;
        clearRadarHighlights();
      }
    }
  });
  // Radar toggle
  if (els.radarBtn) els.radarBtn.addEventListener('click', () => {
    state.isRadarActive = !state.isRadarActive;
    els.radarBtn.classList.toggle('active-radar', state.isRadarActive);
    if (state.isRadarActive) showRadarHighlights(); else clearRadarHighlights();
  });
  // AutoPlay — one-shot (not a persistent toggle, just fires)
  if (els.autoPlayBtn) els.autoPlayBtn.addEventListener('click', () => {
    const btn = els.autoPlayBtn;
    btn.classList.add('active-autoplay');
    state.isAutoPlayRequest = true;
    makeEngineMove();
    setTimeout(() => btn.classList.remove('active-autoplay'), 1500);
  });
  // Hint — one-shot
  if (els.hintBtn) els.hintBtn.addEventListener('click', () => {
    const btn = els.hintBtn;
    btn.classList.add('active-hint');
    state.isHintRequest = true;
    askStockfish(state.config.difficulty);
    setTimeout(() => btn.classList.remove('active-hint'), 1500);
  });

  // Camera
  if (els.cameraToggleBtn) els.cameraToggleBtn.addEventListener('click', toggleCamera);

  // goRestartBtn
  if (els.goRestartBtn) els.goRestartBtn.addEventListener('click', startNewGame);

  // Coordinate trainer
  const coordTrainBtn = document.getElementById('startCoordTrainBtn');
  if (coordTrainBtn) coordTrainBtn.addEventListener('click', startCoordinateTraining);

  updateTacticsUI();

  // ─── TOOLS PANEL CLICK-TOGGLE ───────────────────────────────────
  const toolsTrigger = document.getElementById('toolsTrigger');
  const toolsPanel = document.getElementById('toolsPanel');
  const toolsArrow = document.getElementById('toolsArrow');
  if (toolsTrigger && toolsPanel) {
    toolsTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = toolsPanel.style.display !== 'none';
      if (isOpen) {
        gsap.to(toolsPanel, { opacity: 0, y: -8, duration: 0.15, onComplete: () => { toolsPanel.style.display = 'none'; } });
        toolsArrow?.classList.remove('open');
      } else {
        toolsPanel.style.display = 'flex';
        toolsPanel.style.opacity = '0';
        gsap.to(toolsPanel, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
        toolsArrow?.classList.add('open');
      }
    });
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!toolsTrigger.contains(e.target) && !toolsPanel.contains(e.target)) {
        if (toolsPanel.style.display !== 'none') {
          gsap.to(toolsPanel, { opacity: 0, y: -8, duration: 0.15, onComplete: () => { toolsPanel.style.display = 'none'; } });
          toolsArrow?.classList.remove('open');
        }
      }
    });
    // Prevent panel from closing when clicking inside it
    toolsPanel.addEventListener('click', (e) => e.stopPropagation());
  }
}

async function doResign() {
  if (els.resignConfirmModal) els.resignConfirmModal.style.display = 'none';
  if (state.gameMode === 'multiplayer' && state.multiplayer.gameId) {
    const winner = state.playerColor === 'w' ? 'b' : 'w';
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId), { status: 'finished', winner, reason: 'resign' }).catch(() => {});
  } else { startNewGame(); }
}

// ─── PIECE GRAPHICS ───────────────────────────────────────────────────────────
function updateAllPiecesGraphics() {
  for (const sq in state.piecesDOM) {
    const el = state.piecesDOM[sq];
    el.style.backgroundImage = `url(${getPieceUrl(el.dataset.pid.charAt(0), el.dataset.pid.charAt(1))})`;
  }
  updateCapturedPieces();
}

// ─── STUDY MODE ───────────────────────────────────────────────────────────────
function startStudyMode(openingData) {
  playSound('start'); state.gameMode = 'study'; state.studyData = openingData; state.studyIndex = 0;
  gsap.to(els.mainMenu, { opacity: 0, duration: 0.5, onComplete: () => {
    els.mainMenu.style.display = "none"; els.gameUI.style.display = "flex"; gsap.to(els.gameUI, { opacity: 1, duration: 0.5 });
    els.studyPanel.style.display = 'block'; els.liveHistoryPanel.style.display = 'none'; els.chatPanel.style.display = 'none';
    els.pTimer.style.display = 'none'; els.aiTimer.style.display = 'none'; els.godModeBtn.style.display = 'none';
    els.evalBar.style.display = 'none'; els.historyControlsPanel.style.display = 'none';
    els.backToMenuBtn.style.display = 'inline-flex'; els.newGameBtn.style.display = 'none';
    els.studyTypeTag.textContent = openingData.type === 'white' ? 'Apertura (Blancas)' : 'Defensa (Negras)';
    els.studyTypeTag.className = `study-type-tag ${openingData.type === 'white' ? 'study-white' : 'study-black'}`;
    els.studyTitle.textContent = openingData.name;
    initGame(); updateStudyUI();
  }});
}

function updateStudyUI() {
  els.studyDesc.innerHTML = (state.studyData.descriptions && state.studyData.descriptions.length > state.studyIndex)
    ? state.studyData.descriptions[state.studyIndex]
    : (state.studyData.description_global ? `<b>${state.studyData.name}</b><br><br>${state.studyData.description_global}` : "<b>Jugada teórica.</b>");
  els.studyProgress.textContent = `Paso ${state.studyIndex} / ${state.studyData.moves.length}`;
  els.studyPrevBtn.disabled = state.studyIndex === 0;
  els.studyNextBtn.disabled = state.studyIndex === state.studyData.moves.length;
  els.studyNextBtn.textContent = state.studyIndex === state.studyData.moves.length ? "✅ Finalizado" : "Siguiente →";
}

// ─── COORDINATE TRAINING ──────────────────────────────────────────────────────
function startCoordinateTraining() {
  state.coordinateTrainingActive = true;
  state.coordinateScore = 0;
  const container = document.getElementById('coordinateDisplay');
  if (container) container.style.display = 'block';
  nextCoordinateTarget();
}

function nextCoordinateTarget() {
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['1','2','3','4','5','6','7','8'];
  state.coordinateTarget = files[Math.floor(Math.random()*8)] + ranks[Math.floor(Math.random()*8)];
  const display = document.getElementById('coordinateTarget');
  if (display) {
    display.textContent = state.coordinateTarget.toUpperCase();
    gsap.fromTo(display, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
  }
  // Auto-fail after 5 seconds
  if (state.coordinateTimer) clearTimeout(state.coordinateTimer);
  state.coordinateTimer = setTimeout(() => {
    if (state.coordinateTrainingActive) { playSound('bad'); nextCoordinateTarget(); }
  }, 5000);
}

function handleCoordinateClick(sq) {
  if (!state.coordinateTrainingActive || !state.coordinateTarget) return;
  if (sq === state.coordinateTarget) {
    state.coordinateScore++;
    playSound('good');
    const el = document.getElementById('coordinateScore');
    if (el) el.textContent = state.coordinateScore;
    clearTimeout(state.coordinateTimer);
    nextCoordinateTarget();
  } else {
    playSound('bad');
    gsap.to(els.chessboard, { x: -5, duration: 0.05, yoyo: true, repeat: 5 });
  }
}

// ─── TIMERS ───────────────────────────────────────────────────────────────────
function updateTimers() {
  if (state.game.game_over() || state.isTimeOut) return;
  const now = Date.now(); const delta = (now - state.lastTimerTick) / 1000; state.lastTimerTick = now;
  const amIWhite = state.playerColor === 'w'; const isWhiteTurn = state.game.turn() === 'w';
  if ((amIWhite && isWhiteTurn) || (!amIWhite && !isWhiteTurn)) { state.playerTime -= delta; els.pTimer.classList.add('active'); els.aiTimer.classList.remove('active'); }
  else { state.aiTime -= delta; els.aiTimer.classList.add('active'); els.pTimer.classList.remove('active'); }
  if (state.playerTime <= 0) { state.playerTime = 0; state.isTimeOut = true; updateStatus("¡Tiempo agotado! Has perdido."); speak("Tiempo agotado."); clearInterval(state.timerInterval); }
  if (state.aiTime <= 0) { state.aiTime = 0; state.isTimeOut = true; updateStatus("¡Tiempo agotado! Has ganado."); speak("El rival se quedó sin tiempo."); clearInterval(state.timerInterval); }
  updateTimerDisplays();
}

function formatTime(s) { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; }
function updateTimerDisplays() {
  els.pTimer.textContent = formatTime(state.playerTime);
  els.aiTimer.textContent = formatTime(state.aiTime);
  // Danger highlight when < 30s
  if (state.playerTime < 30 && state.playerTime > 0) {
    els.pTimer.classList.add('danger');
  } else {
    els.pTimer.classList.remove('danger');
  }
  if (state.aiTime < 30 && state.aiTime > 0) {
    els.aiTimer.classList.add('danger');
  } else {
    els.aiTimer.classList.remove('danger');
  }
}

// ─── CAPTURED PIECES ──────────────────────────────────────────────────────────
function updateCapturedPieces() {
  const history = state.game.history({ verbose: true });
  let pCap = [], aiCap = [];
  const pieceVals = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9 };
  let pScore = 0, aiScore = 0;
  const amIWhite = state.playerColor === 'w';
  history.forEach(move => {
    if (move.captured) {
      if (move.color === 'w') { if (amIWhite) { pCap.push(move.captured); pScore += pieceVals[move.captured]; } else { aiCap.push(move.captured); aiScore += pieceVals[move.captured]; } }
      else { if (amIWhite) { aiCap.push(move.captured); aiScore += pieceVals[move.captured]; } else { pCap.push(move.captured); pScore += pieceVals[move.captured]; } }
    }
  });
  els.pCap.innerHTML = ''; els.aiCap.innerHTML = '';
  pCap.sort((a, b) => pieceVals[a] - pieceVals[b]).forEach(p => { const div = document.createElement('div'); div.className = 'captured-piece'; div.style.backgroundImage = `url(${getPieceUrl(amIWhite ? 'b' : 'w', p)})`; els.pCap.appendChild(div); });
  aiCap.sort((a, b) => pieceVals[a] - pieceVals[b]).forEach(p => { const div = document.createElement('div'); div.className = 'captured-piece'; div.style.backgroundImage = `url(${getPieceUrl(amIWhite ? 'w' : 'b', p)})`; els.aiCap.appendChild(div); });
  if (pScore > aiScore) els.pCap.innerHTML += `<span class="advantage-score">+${pScore - aiScore}</span>`;
  if (aiScore > pScore) els.aiCap.innerHTML += `<span class="advantage-score">+${aiScore - pScore}</span>`;
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
function viewHistory(index) {
  if (index < 0 || index > state.game.history().length) return;
  state.viewIndex = index; syncBoardToDOM(); updateHistoryButtons(); updateMoveHistoryUI();
  const isHistMode = state.viewIndex < state.game.history().length;
  els.chessboard.style.borderColor = isHistMode ? '#d946ef' : 'rgba(255,255,255,0.05)';
  els.chessboard.style.boxShadow = isHistMode ? '0 0 30px rgba(217,70,239,0.4)' : '0 35px 60px -15px rgba(0,0,0,0.8)';
  if (isHistMode) updateStatus("📜 MODO HISTORIAL (Solo lectura)"); else updateStatus();
  
  clearGodHighlights();
  if (els.analysisPanel.style.display === 'flex' && state.analysisData && state.analysisData[index]) {
      const data = state.analysisData[index];
      
      // Draw actual move played arrow
      if (data.fromSquare && data.toSquare) {
          const markerId = getMarkerForColor(data.color);
          showPlayedMoveArrow(data.fromSquare, data.toSquare, data.color, markerId);
      }
      
      if (data.bestmove && (data.label === 'Grave Error' || data.label === 'Error' || data.label === 'Imprecisión')) {
          showBestMoveArrow(data.bestmove);
      }
      if (data.toSquare && data.icon) {
          const pos = squareToPixel(data.toSquare);
          const iconEl = document.createElement('div');
          iconEl.className = 'move-classification-icon';
          iconEl.innerHTML = data.icon;
          iconEl.style.backgroundColor = data.color;
          iconEl.style.left = (pos.x + 75) + 'px';
          iconEl.style.top = (pos.y - 5) + 'px';
          els.chessboard.appendChild(iconEl);
      }
  }
  
  // Continuously update Oracle if active during review
  if (state.godModeActive) askOracle();
}

function updateHistoryButtons() {
  const len = state.game.history().length;
  els.btnHistStart.disabled = state.viewIndex === 0; els.btnHistPrev.disabled = state.viewIndex === 0;
  els.btnHistNext.disabled = state.viewIndex === len; els.btnHistEnd.disabled = state.viewIndex === len;
}

function updateMoveHistoryUI() {
  if (!els.moveList) return;
  els.moveList.innerHTML = '';
  const history = state.game.history();
  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement('div');
    row.className = 'history-row';
    const num = document.createElement('span'); num.className = 'move-num'; num.textContent = `${Math.floor(i / 2) + 1}.`;
    const w = document.createElement('span'); w.className = `move-san ${state.viewIndex === i + 1 ? 'active-move' : ''}`;
    w.textContent = history[i]; w.onclick = () => viewHistory(i + 1);
    const b = document.createElement('span'); b.className = `move-san ${state.viewIndex === i + 2 ? 'active-move' : ''}`;
    if (history[i + 1]) { b.textContent = history[i + 1]; b.onclick = () => viewHistory(i + 2); }
    row.appendChild(num); row.appendChild(w); row.appendChild(b);
    els.moveList.appendChild(row);
  }
  els.moveList.scrollTop = els.moveList.scrollHeight;
}

// ─── GAME OVER ────────────────────────────────────────────────────────────────
function showGameOver(title, subtitle, winnerClass) {
  els.goTitle.textContent = title; els.goSubtitle.textContent = subtitle;
  els.goTitle.className = `go-title ${winnerClass}`; els.gameOverModal.style.display = 'flex';
  gsap.fromTo(els.gameOverModal, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  gsap.fromTo(els.goTitle, { scale: 0.5, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)", delay: 0.2 });
  gsap.fromTo(els.goSubtitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.4 });
  gsap.fromTo(els.goRestartBtn, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)", delay: 0.6 });
  if (els.goAnalyzeBtn) {
    els.goAnalyzeBtn.onclick = startAnalysis;
    gsap.fromTo(els.goAnalyzeBtn, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)", delay: 0.7 });
  }
  // Particle burst
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    p.style.left = '50%'; p.style.top = '50%';
    els.gameOverModal.appendChild(p);
    gsap.to(p, { x: (Math.random()-0.5)*400, y: (Math.random()-0.5)*400, opacity: 0, scale: Math.random()*2+0.5, duration: Math.random()*1.5+0.5, ease: 'power2.out', onComplete: () => p.remove() });
  }
}

// ─── STATUS UPDATE ────────────────────────────────────────────────────────────
function updateStatus(forcedMsg = null) {
  if (forcedMsg) { els.status.textContent = forcedMsg; els.status.className = "status-warning"; return; }
  if (state.viewIndex < state.game.history().length) {
    els.status.textContent = "📜 MODO HISTORIAL (Solo lectura)"; 
    els.status.className = "status-warning"; 
    return;
  }
  const amIWhite = state.playerColor === 'w'; const isWhiteTurn = state.game.turn() === 'w';
  let c = isWhiteTurn ? (amIWhite ? 'Tú (⚪)' : 'Rival (⚪)') : (amIWhite ? 'Rival (⚫)' : 'Tú (⚫)');
  if (state.gameMode !== 'study') {
    if ((amIWhite && isWhiteTurn) || (!amIWhite && !isWhiteTurn)) { els.turnDotP.classList.remove('hidden'); els.turnDotAi.classList.add('hidden'); }
    else { els.turnDotAi.classList.remove('hidden'); els.turnDotP.classList.add('hidden'); }
  }
  
  const isAnalyzing = els.analysisPanel && els.analysisPanel.style.display === 'flex';
  
  if (state.game.in_checkmate() || state.isTimeOut) {
    if (isAnalyzing) return; // Don't show game over modal if analyzing
    let winner = state.game.turn() === 'w' ? 'b' : 'w';
    if (state.isTimeOut) winner = state.playerTime <= 0 ? (amIWhite ? 'b' : 'w') : (amIWhite ? 'w' : 'b');
    const iWon = (winner === 'w' && amIWhite) || (winner === 'b' && !amIWhite);
    const titleText = iWon ? '🎉 Victoria' : '😞 Derrota';
    const subText = state.isTimeOut ? 'Tiempo Agotado' : 'Jaque Mate';
    const winnerClass = iWon ? 'jedi' : 'sith';
    els.status.textContent = `Fin de la partida.`;
    els.status.className = iWon ? "status-win" : "status-loss";
    els.turnDotAi.classList.add('hidden'); els.turnDotP.classList.add('hidden');
    let eloMsg = "";
    if (state.gameMode === 'multiplayer' && state.multiplayer.gameId) {
      const eloData = calculateEloUpdate(winner);
      if (eloData) eloMsg = ` (ELO ${eloData.diff > 0 ? '+' : ''}${eloData.diff})`;
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId), { status: 'finished', winner: user.uid }).catch(() => {});
    }
    showGameOver(titleText, subText + eloMsg, winnerClass); playSound('check');
    if (state.game.in_checkmate()) speak(`Jaque Mate. ${iWon ? 'Has ganado.' : 'Has perdido.'}`);
  } else if (state.game.in_draw() || state.game.in_stalemate()) {
    if (isAnalyzing) return; // Don't show game over modal if analyzing
    els.status.textContent = 'Empate.'; els.status.className = "status-draw";
    els.turnDotAi.classList.add('hidden'); els.turnDotP.classList.add('hidden');
    if (state.gameMode === 'multiplayer' && state.multiplayer.gameId) {
      calculateEloUpdate('draw');
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId), { status: 'finished', winner: 'draw' }).catch(() => {});
    }
    showGameOver("Tablas", state.game.in_stalemate() ? "Rey Ahogado" : "Insuficiencia Material", "jedi");
    speak("Tablas. Empate.");
  } else {
    els.status.textContent = `Turno: ${c}`;
    els.status.className = state.game.in_check() ? "status-check animate-pulse" : "status-normal";
    if (state.game.in_check()) {
      els.status.textContent += ' ⚠️ ¡Jaque!';
      playSound('check');
      const kingSq = state.game.board().flat().find(p => p && p.type === 'k' && p.color === state.game.turn());
      if (kingSq) {
        for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) {
          if (state.game.board()[r][col] === kingSq) {
            const pos = squareToPixel(['a','b','c','d','e','f','g','h'][col] + (8 - r));
            const p = document.createElement('div'); p.className = 'check-pulse'; p.style.left = pos.x + 'px'; p.style.top = pos.y + 'px';
            els.chessboard.insertBefore(p, els.hintsLayer); state.checkPulseEl = p;
          }
        }
      }
    }
  }
}

function startNewGame() {
  els.gameOverModal.style.display = 'none';
  els.gameOverModal.querySelectorAll('.particle').forEach(p => p.remove());
  if (state.gameMode === 'puzzle') { startRandomPuzzle(); return; }
  if (state.gameMode === 'multiplayer') { els.backToMenuBtn.click(); return; }
  initGame(); speak("Partida reiniciada");
}

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
async function startAnalysis() {
  els.gameOverModal.style.display = 'none';
  els.liveHistoryPanel.style.display = 'none';
  els.analysisPanel.style.display = 'flex';
  els.analysisStatus.innerHTML = '<div class="analysis-spinner"></div> Analizando... 0%';
  
  let loadingOverlay = document.getElementById('analysisLoadingOverlay');
  if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'analysisLoadingOverlay';
      loadingOverlay.className = 'glass-panel';
      loadingOverlay.style.cssText = 'position:absolute; inset:0; z-index:99; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); border-radius:12px; pointer-events:none;';
      loadingOverlay.innerHTML = '<div class="analysis-spinner" style="width:40px;height:40px;border-width:4px;"></div><div id="overlayLoadingText" style="margin-top:20px;font-weight:bold;font-size:18px;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.5)">Analizando partida... 0%</div>';
      els.chessboard.appendChild(loadingOverlay);
  } else {
      els.chessboard.appendChild(loadingOverlay); // ensure it's on top
      loadingOverlay.style.display = 'flex';
  }
  
  // Jump to beginning immediately
  viewHistory(0);

  if (!analyzer) {
    const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
    let workerUrl = stockfishUrl;
    try {
      const response = await fetch(stockfishUrl);
      const text = await response.text();
      workerUrl = URL.createObjectURL(new Blob([text], { type: 'application/javascript' }));
    } catch (e) { console.warn("Blob worker fallback", e); }
    analyzer = new GameAnalyzer(workerUrl, state.config.engineDepth);
  }
  const tempGame = new Chess();
  const history = state.game.history();
  const fens = [tempGame.fen()];
  for (const move of history) { tempGame.move(move); fens.push(tempGame.fen()); }
  const evaluations = await analyzer.analyzeGame(fens, (current, total) => {
    const pct = Math.round((current / total) * 100);
    els.analysisStatus.innerHTML = `<div class="analysis-spinner"></div> Analizando... ${pct}%`;
    const overlayText = document.getElementById('overlayLoadingText');
    if (overlayText) overlayText.textContent = `Analizando partida... ${pct}%`;
  });
  
  if (loadingOverlay) loadingOverlay.style.display = 'none';
  els.analysisStatus.textContent = '✅ Completado';
  renderAnalysisChart(evaluations, history);
  // Accuracy calculation
  state.analysisData = computeAccuracy(evaluations, history);
  // Re-trigger viewHistory for the end of the game so the arrows appear
  viewHistory(history.length);
}

function computeAccuracy(evaluations, history) {
  if (!evaluations || evaluations.length < 2) return [];
  let whiteBrilliant = 0, blackBrilliant = 0, whiteBlunders = 0, blackBlunders = 0;
  const analysisData = [];
  
  const tempGame = new Chess();
  const verboseHistory = [];
  for (const m of history) {
      verboseHistory.push(tempGame.move(m));
  }
  
  const reviewListEl = document.getElementById('reviewMoveList');
  if (reviewListEl) reviewListEl.innerHTML = '';

  for (let i = 1; i < evaluations.length; i++) {
    if (!evaluations[i] || !evaluations[i-1]) continue;
    
    let prevScore = evaluations[i-1].score;
    let currScore = evaluations[i].score;
    if (evaluations[i-1].isMate) prevScore = prevScore > 0 ? 10000 : -10000;
    if (evaluations[i].isMate) currScore = currScore > 0 ? 10000 : -10000;

    const delta = (currScore - prevScore) / 100;
    const isWhite = (i % 2) !== 0; // i=1 is white's first move
    
    // Normalize delta so positive means good for the player who just moved
    const moveDelta = isWhite ? delta : -delta;
    
    // Determine classification
    let classification = { label: 'Buena', color: '#10b981', icon: '✔️' };
    if (moveDelta >= 0.5) {
        classification = { label: 'Brillante', color: '#2dd4bf', icon: '!!' };
        if (isWhite) whiteBrilliant++; else blackBrilliant++;
    } else if (moveDelta < -2.0) {
        classification = { label: 'Grave Error', color: '#ef4444', icon: '??' };
        if (isWhite) whiteBlunders++; else blackBlunders++;
    } else if (moveDelta < -0.8) {
        classification = { label: 'Error', color: '#f97316', icon: '?' };
    } else if (moveDelta < -0.2) {
        classification = { label: 'Imprecisión', color: '#eab308', icon: '?!' };
    }

    const moveObj = verboseHistory[i-1];
    analysisData[i] = { 
        label: classification.label, 
        bestmove: evaluations[i-1].bestmove, 
        fromSquare: moveObj ? moveObj.from : null,
        toSquare: moveObj ? moveObj.to : null,
        icon: classification.icon,
        color: classification.color
    };

    if (reviewListEl) {
       const moveDiv = document.createElement('div');
       moveDiv.className = 'review-move-item';
       moveDiv.innerHTML = `
           <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <span style="color:#94a3b8;font-size:10px;margin-right:8px;">${Math.ceil(i/2)}${isWhite ? '.' : '...'}</span>
                  <span style="font-weight:bold;color:#e2e8f0;font-size:13px">${history[i-1]}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:10px;font-weight:bold;color:${classification.color}">${classification.label}</span>
                  <div style="background:${classification.color}; color:#fff; font-size:12px; font-weight:900; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; flex-shrink:0; text-shadow:0 1px 2px rgba(0,0,0,0.5);">
                      ${classification.icon}
                  </div>
              </div>
           </div>
       `;
       moveDiv.onclick = () => viewHistory(i);
       reviewListEl.appendChild(moveDiv);
    }
  }

  const summaryEl = document.getElementById('analysisSummary');
  if (summaryEl) {
    const amIWhite = state.playerColor === 'w';
    const myBrilliant = amIWhite ? whiteBrilliant : blackBrilliant;
    const myBlunders = amIWhite ? whiteBlunders : blackBlunders;
    summaryEl.innerHTML = `<span style="color:#2dd4bf">✨ Brillantes: ${myBrilliant}</span> &nbsp;·&nbsp; <span style="color:#ef4444">❌ Graves Errores: ${myBlunders}</span>`;
  }
  return analysisData;
}

function getMarkerForColor(color) {
    if (color === '#2dd4bf') return 'arrowTeal';
    if (color === '#10b981') return 'arrowGreen';
    if (color === '#eab308') return 'arrowYellow';
    if (color === '#f97316') return 'arrowOrange';
    if (color === '#ef4444') return 'arrowRed';
    return 'customArrowhead';
}

function showPlayedMoveArrow(from, to, color, markerId) {
  const fPos = squareToPixel(from); const tPos = squareToPixel(to);
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  arrow.setAttribute('x1', fPos.x + 50); arrow.setAttribute('y1', fPos.y + 50);
  arrow.setAttribute('x2', tPos.x + 50); arrow.setAttribute('y2', tPos.y + 50);
  arrow.setAttribute('stroke', color || '#94a3b8'); 
  arrow.setAttribute('stroke-width', '10');
  arrow.setAttribute('stroke-linecap', 'round');
  if (markerId) arrow.setAttribute('marker-end', `url(#${markerId})`);
  arrow.setAttribute('opacity', '0.6'); 
  arrow.classList.add('hint-arrow-el');
  els.svgLayer.appendChild(arrow);
  gsap.fromTo(arrow, { strokeDasharray: 500, strokeDashoffset: 500 }, { strokeDashoffset: 0, duration: 0.3 });
}

function showBestMoveArrow(moveStr) {
  const from = moveStr.substring(0, 2); const to = moveStr.substring(2, 4);
  const fPos = squareToPixel(from); const tPos = squareToPixel(to);
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  arrow.setAttribute('x1', fPos.x + 50); arrow.setAttribute('y1', fPos.y + 50);
  arrow.setAttribute('x2', tPos.x + 50); arrow.setAttribute('y2', tPos.y + 50);
  arrow.setAttribute('stroke', '#10b981'); arrow.setAttribute('stroke-width', '10');
  arrow.setAttribute('stroke-linecap', 'round'); arrow.setAttribute('marker-end', 'url(#arrowGreen)');
  arrow.setAttribute('opacity', '0.8'); arrow.classList.add('hint-arrow-el');
  els.svgLayer.appendChild(arrow);
  gsap.fromTo(arrow, { strokeDasharray: 500, strokeDashoffset: 500 }, { strokeDashoffset: 0, duration: 0.5 });
}

function renderAnalysisChart(evaluations, history) {
  const labels = ['Inicio'];
  history.forEach((m, i) => labels.push(`M${i+1}: ${m}`));
  const dataScores = evaluations.map(ev => ev ? Math.max(-1000, Math.min(1000, ev.score)) / 100 : 0);
  const positiveData = dataScores.map(v => v >= 0 ? v : 0);
  const negativeData = dataScores.map(v => v < 0 ? v : 0);
  const pointColors = dataScores.map((score, i) => {
    if (i === 0) return '#ffffff';
    const delta = score - dataScores[i - 1];
    const isWhiteTurn = (i % 2) !== 0;
    if ((isWhiteTurn && delta < -1.5) || (!isWhiteTurn && delta > 1.5)) return '#ef4444';
    if ((isWhiteTurn && delta > 1.5) || (!isWhiteTurn && delta < -1.5)) return '#10b981';
    return '#3b82f6';
  });
  const pointRadii = pointColors.map(c => c === '#3b82f6' ? 2 : 6);
  if (evalChartObj) evalChartObj.destroy();
  const ctx = els.evalChart.getContext('2d');
  evalChartObj = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Ventaja ⚪', data: positiveData, borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)', fill: true, tension: 0.4, pointBackgroundColor: pointColors, pointRadius: pointRadii, pointHoverRadius: 8 },
        { label: 'Ventaja ⚫', data: negativeData, borderColor: '#555555', backgroundColor: 'rgba(51,51,51,0.35)', fill: true, tension: 0.4, pointBackgroundColor: pointColors, pointRadius: pointRadii, pointHoverRadius: 8 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { min: -10, max: 10, grid: { color: 'rgba(255,255,255,0.07)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { display: false } }
      },
      plugins: {
        legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } },
        tooltip: { callbacks: { label: ctx => { const v = dataScores[ctx.dataIndex]; return v > 0 ? `+${v.toFixed(1)} Blancas` : `${v.toFixed(1)} Negras`; } } }
      },
      onClick: (e, activeEls) => { if (activeEls.length > 0) viewHistory(activeEls[0].index); }
    }
  });
}

// ─── GAME INIT ────────────────────────────────────────────────────────────────
function initGame() {
  state.game = new Chess();
  state.viewIndex = 0; state.hasGameStarted = true; state.isTimeOut = false;
  state.pendingPromotion = null; state.customArrows = []; state.currentOpeningName = '';
  state.moveAccuracies = [];
  clearInterval(state.timerInterval);
  state.playerTime = state.config.time; state.aiTime = state.config.time;
  updateTimerDisplays();
  // Reset evals
  if (els.evalBar) els.evalBar.style.opacity = '1'; if (els.evalFill) els.evalFill.style.height = '50%';
  if (els.evalTextTop) els.evalTextTop.textContent = ''; if (els.evalTextBottom) els.evalTextBottom.textContent = '0.0';
  // HUD
  const isMulti = state.gameMode === 'multiplayer';
  const aiName = isMulti ? `Rival (ELO ${Math.round(state.multiplayer.opponentElo)})` : `Stockfish D${state.config.difficulty}`;
  els.hudTopName.textContent = state.playerColor === 'w' ? aiName : (user ? username : 'Tú');
  els.hudBottomName.textContent = state.playerColor === 'w' ? (user ? username : 'Tú') : aiName;
  // Panels
  if (state.gameMode !== 'study') {
    els.studyPanel.style.display = 'none';
    if (state.gameMode === 'multiplayer') { els.liveHistoryPanel.style.display = 'flex'; gsap.fromTo(els.liveHistoryPanel, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.3 }); els.chatPanel.style.display = 'flex'; gsap.fromTo(els.chatPanel, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.5 }); }
    else { els.liveHistoryPanel.style.display = 'flex'; gsap.fromTo(els.liveHistoryPanel, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.3 }); els.chatPanel.style.display = 'none'; }
    els.pTimer.style.display = 'block'; els.aiTimer.style.display = 'block';
    els.godModeBtn.style.display = 'inline-flex'; els.historyControlsPanel.style.display = 'flex';
    els.backToMenuBtn.style.display = 'inline-flex'; els.newGameBtn.style.display = 'inline-flex'; els.newGameBtn.textContent = 'Rendirse';
    if (els.analysisPanel) els.analysisPanel.style.display = 'none';
  }
  els.gameOverModal.style.display = 'none'; els.promotionModal.style.display = 'none';
  // Hide oracle bar on new game
  if (els.oracleBar) els.oracleBar.style.display = 'none';
  state.godModeActive = false;
  els.godModeBtn.classList.remove('active');
  // Reset oracle tool btn states
  document.getElementById('radarBtn')?.classList.remove('active-radar');
  document.getElementById('autoPlayBtn')?.classList.remove('active-autoplay');
  document.getElementById('hintBtn')?.classList.remove('active-hint');
  state.isRadarActive = false;
  els.moveList.innerHTML = '';
  updateHistoryButtons();
  // Init stockfish
  initStockfish();
  // Build board
  buildBoard();
  syncBoardToDOM();
  updateStatus();
  setupBoardListeners();
  resizeBoard();
  // Timer
  state.lastTimerTick = Date.now();
  if (state.gameMode !== 'study' && state.gameMode !== 'puzzle') {
    state.timerInterval = setInterval(updateTimers, 100);
  }
  // Update FEN input
  if (els.positionFenInput) els.positionFenInput.value = state.game.fen();
}

// ─── STOCKFISH ────────────────────────────────────────────────────────────────
async function initStockfish() {
  if (state.stockfish) { state.stockfish.terminate(); state.stockfish = null; }
  if (state.oracleStockfish) { state.oracleStockfish.terminate(); state.oracleStockfish = null; }
  try {
    const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
    let workerUrl = stockfishUrl;
    try {
      const response = await fetch(stockfishUrl);
      const text = await response.text();
      workerUrl = URL.createObjectURL(new Blob([text], { type: 'application/javascript' }));
    } catch (e) { console.warn("Blob worker fallback failed", e); }
    
    // Main Engine (AI & Hints)
    state.stockfish = new Worker(workerUrl);
    state.stockfish.addEventListener('message', handleStockfishMessage);
    state.stockfish.postMessage('uci');
    state.stockfish.postMessage('isready');
    state.stockfish.postMessage('setoption name Hash value 32');
    
    // Oracle Engine (Continuous Eval & God Mode)
    state.oracleStockfish = new Worker(workerUrl);
    state.oracleStockfish.addEventListener('message', handleOracleMessage);
    state.oracleStockfish.postMessage('uci');
    state.oracleStockfish.postMessage('isready');
    state.oracleStockfish.postMessage('setoption name Hash value 16');
  } catch (e) { console.error('Stockfish init failed:', e); }
}

function handleStockfishMessage(event) {
  const msg = event.data;
  if (msg.startsWith('info depth') && msg.includes('score')) {
    const cpMatch = msg.match(/score cp (-?\d+)/); const mateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/pv (.+)/);
    let score = 0;
    if (cpMatch) score = parseInt(cpMatch[1]);
    else if (mateMatch) { const m = parseInt(mateMatch[1]); score = m > 0 ? 10000 - m : -10000 - m; }
    const isWhiteTurn = state.game.turn() === 'w';
    const evalScore = isWhiteTurn ? score / 100 : -score / 100;
    updateEvalBar(evalScore);
    if (pvMatch && state.showMultiPv) displayMultiPvLine(pvMatch[1], score);
  }
  if (msg.startsWith('bestmove')) {
    state.isEngineCalculating = false;
    const parts = msg.split(' ');
    const bestMove = parts[1];
    if (bestMove && bestMove !== '(none)') {
      if (state.isHintRequest) { showHintArrow(bestMove); state.isHintRequest = false; return; }
      
      // AutoPlay or Study shouldn't auto-move (or it's broken, so we just return)
      if (state.isAutoPlayRequest || state.gameMode === 'study') { 
         state.isAutoPlayRequest = false; 
         if (state.gameMode === 'study') return;
      }
      
      const from = bestMove.substring(0, 2); const to = bestMove.substring(2, 4);
      const promo = bestMove.length === 5 ? bestMove[4] : undefined;
      setTimeout(() => {
        const moveObj = state.game.move({ from, to, promotion: promo || 'q' });
        if (moveObj) {
          state.viewIndex = state.game.history().length;
          finishMoveVisuals(moveObj);
          syncBoardToDOM();
          updateAfterMove(moveObj, false);
        }
      }, Math.random() * 300 + 200);
    }
  }
}

function handleOracleMessage(event) {
  const msg = event.data;
  if (msg.startsWith('info depth') && msg.includes('score')) {
    const cpMatch = msg.match(/score cp (-?\d+)/); const mateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/pv (.+)/);
    let score = 0;
    if (cpMatch) score = parseInt(cpMatch[1]);
    else if (mateMatch) { const m = parseInt(mateMatch[1]); score = m > 0 ? 10000 - m : -10000 - m; }
    const isWhiteTurn = state.game.turn() === 'w';
    const evalScore = isWhiteTurn ? score / 100 : -score / 100;
    updateEvalBar(evalScore);
    if (pvMatch && state.showMultiPv) displayMultiPvLine(pvMatch[1], score);
  }
  if (msg.startsWith('bestmove')) {
    const parts = msg.split(' ');
    const bestMove = parts[1];
    if (bestMove && bestMove !== '(none)') {
      if (state.godModeActive) { displayOracleMove(bestMove); }
    }
  }
}

function displayMultiPvLine(pvStr, score) {
  const pvEl = document.getElementById('multiPvDisplay');
  if (!pvEl) return;
  const moves = pvStr.split(' ').slice(0, 5).join(' ');
  pvEl.innerHTML = `<span style="color:#60a5fa;font-size:10px">PV: ${moves} <span style="color:#94a3b8">(${(score/100).toFixed(2)})</span></span>`;
}

async function askStockfish(depth) {
  let attempts = 0;
  while (!state.stockfish && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  if (!state.stockfish || state.game.game_over() || state.isEngineCalculating) return;
  state.isEngineCalculating = true;
  const skillMap = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12, 8: 14, 9: 16, 10: 17, 11: 17, 12: 18, 13: 18, 14: 19, 15: 19, 16: 19, 17: 20, 18: 20, 19: 20, 20: 20 };
  state.stockfish.postMessage(`setoption name Skill Level value ${skillMap[depth] || 10}`);
  state.stockfish.postMessage(`position fen ${state.game.fen()}`);
  const thinkTime = Math.max(100, depth * 50 + Math.random() * 200);
  state.stockfish.postMessage(`go movetime ${thinkTime} depth ${state.config.engineDepth}`);
}

function makeEngineMove() {
  if (state.gameMode === 'multiplayer') return;
  if (state.game.game_over() || state.isTimeOut) return;
  askStockfish(state.config.difficulty);
}

async function askOracle() {
  let attempts = 0;
  while (!state.oracleStockfish && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  if (!state.oracleStockfish) return;
  
  const tempGame = new Chess();
  const history = state.game.history();
  for (let i = 0; i < state.viewIndex; i++) {
      tempGame.move(history[i]);
  }
  const viewFen = tempGame.fen();

  state.oracleStockfish.postMessage('setoption name Skill Level value 20');
  state.oracleStockfish.postMessage(`position fen ${viewFen}`);
  state.oracleStockfish.postMessage(`go depth ${state.config.engineDepth}`);
}

function showHintArrow(moveStr) {
  const from = moveStr.substring(0, 2); const to = moveStr.substring(2, 4);
  document.querySelectorAll('.hint-arrow-el.oracle-hint').forEach(el => el.remove());
  
  const fPos = squareToPixel(from); const tPos = squareToPixel(to);
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  arrow.setAttribute('x1', fPos.x + 50); arrow.setAttribute('y1', fPos.y + 50);
  arrow.setAttribute('x2', tPos.x + 50); arrow.setAttribute('y2', tPos.y + 50);
  arrow.setAttribute('stroke', '#d946ef'); arrow.setAttribute('stroke-width', '8');
  arrow.setAttribute('stroke-linecap', 'round'); arrow.setAttribute('marker-end', 'url(#arrowMagenta)');
  arrow.setAttribute('opacity', '0.8'); 
  arrow.classList.add('hint-arrow-el', 'oracle-hint');
  els.svgLayer.appendChild(arrow);
  gsap.fromTo(arrow, { opacity: 0 }, { opacity: 0.8, duration: 0.3 });
  setTimeout(() => { gsap.to(arrow, { opacity: 0, duration: 0.5, onComplete: () => arrow.remove() }); }, 3000);
}

function displayOracleMove(bestMove) {
  const from = bestMove.substring(0, 2); const to = bestMove.substring(2, 4);
  const piece = state.game.get(from);
  const pieceName = piece ? { 'p':'Peón','n':'Caballo','b':'Alfil','r':'Torre','q':'Dama','k':'Rey' }[piece.type] : '';
  els.oracleText.textContent = `⚡ ${pieceName}: ${from.toUpperCase()} → ${to.toUpperCase()}`;
  showHintArrow(bestMove);
}

function updateEvalBar(score) {
  const clampedScore = Math.max(-10, Math.min(10, score));
  const whitePercent = (clampedScore + 10) / 20 * 100;
  if (els.evalFill) els.evalFill.style.height = `${100 - whitePercent}%`;
  if (els.evalTextTop) els.evalTextTop.textContent = score < 0 ? Math.abs(score).toFixed(1) : '';
  if (els.evalTextBottom) els.evalTextBottom.textContent = score >= 0 ? score.toFixed(1) : '';
}

// ─── BOARD BUILD ──────────────────────────────────────────────────────────────
function buildBoard() {
  els.chessboard.innerHTML = '';
  els.chessboard.appendChild(els.hintsLayer);
  els.chessboard.appendChild(els.svgLayer);
  if (els.arrowLayer) els.chessboard.appendChild(els.arrowLayer);
  if (els.cursor) els.chessboard.appendChild(els.cursor);
  const files = ['a','b','c','d','e','f','g','h'];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = document.createElement('div');
      const isLight = (row + col) % 2 === 0;
      sq.className = `square ${isLight ? 'light' : 'dark'}`;
      sq.style.left = `${col * 100}px`; sq.style.top = `${row * 100}px`;
      sq.dataset.sq = `${files[col]}${8 - row}`;
      // Coordinate labels
      if (userSettings.showCoords) {
        if (col === 0) { const rl = document.createElement('div'); rl.className = 'square-label'; rl.style.cssText = 'top:2px;left:4px;'; rl.textContent = 8 - row; sq.appendChild(rl); }
        if (row === 7) { const fl = document.createElement('div'); fl.className = 'square-label'; fl.style.cssText = 'bottom:2px;right:4px;'; fl.textContent = files[col]; sq.appendChild(fl); }
      }
      els.chessboard.insertBefore(sq, els.hintsLayer);
    }
  }
  if (els.promotionModal) els.chessboard.appendChild(els.promotionModal);
  if (els.gameOverModal) els.chessboard.appendChild(els.gameOverModal);
}

// ─── BOARD SYNC ───────────────────────────────────────────────────────────────
function syncBoardToDOM() {
  const files = ['a','b','c','d','e','f','g','h'];
  // Remove all existing pieces
  document.querySelectorAll('.piece').forEach(p => p.remove());
  state.piecesDOM = {};
  // Clear highlights
  document.querySelectorAll('.highlight, .check-pulse').forEach(h => h.remove());
  state.checkPulseEl = null;
  clearGodHighlights();
  // Re-draw last move highlights
  if (state.lastMoveHighlights.length && userSettings.highlightMoves) {
    state.lastMoveHighlights.forEach(sq => {
      const pos = squareToPixel(sq);
      const hl = document.createElement('div'); hl.className = 'highlight'; hl.style.left = pos.x + 'px'; hl.style.top = pos.y + 'px';
      els.chessboard.insertBefore(hl, els.hintsLayer);
    });
  }
  // Place pieces at viewIndex
  const tempGame = new Chess();
  const history = state.game.history().slice(0, state.viewIndex);
  history.forEach(move => tempGame.move(move));
  const board = tempGame.board();
  board.forEach((rowArr, r) => {
    rowArr.forEach((piece, c) => {
      if (!piece) return;
      const sq = `${files[c]}${8 - r}`;
      const reverse = state.playerColor === 'b';
      const visualCol = reverse ? 7 - c : c; const visualRow = reverse ? 7 - r : r;
      const pieceEl = document.createElement('div');
      pieceEl.className = 'piece';
      pieceEl.style.left = `${visualCol * 100}px`; pieceEl.style.top = `${visualRow * 100}px`;
      pieceEl.style.backgroundImage = `url(${getPieceUrl(piece.color, piece.type)})`;
      pieceEl.dataset.sq = sq; pieceEl.dataset.pid = `${piece.color}${piece.type}`;
      els.chessboard.insertBefore(pieceEl, els.hintsLayer);
      state.piecesDOM[sq] = pieceEl;
    });
  });
  updateMoveHistoryUI();
  updateHistoryButtons();
  updateCapturedPieces();
  updateStatus();
  detectOpening();
  if (els.positionFenInput) els.positionFenInput.value = state.game.fen();
  renderPremoveHighlights();
}

function renderPremoveHighlights() {
  document.querySelectorAll('.premove-highlight').forEach(el => el.remove());
  if (!state.premove || state.viewIndex < state.game.history().length) return;
  [state.premove.from, state.premove.to].forEach(sq => {
      const pos = squareToPixel(sq);
      const hl = document.createElement('div');
      hl.className = 'premove-highlight';
      hl.style.left = pos.x + 'px'; hl.style.top = pos.y + 'px';
      els.chessboard.insertBefore(hl, els.hintsLayer);
  });
}

// ─── MOVE VISUALS ─────────────────────────────────────────────────────────────
function finishMoveVisuals(moveObj) {
  state.lastMoveHighlights = [moveObj.from, moveObj.to];
  // Detect move quality for animation
  const isCastle = moveObj.flags.includes('k') || moveObj.flags.includes('q');
  if (isCastle) playSound('castle');
  else if (moveObj.captured) playSound('capture');
  else playSound('move');
  // Brilliant/Blunder flash
  const pos = squareToPixel(moveObj.to);
  if (moveObj.san.includes('??')) { const el = document.createElement('div'); el.className = 'blunder-move'; el.textContent = '??'; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; els.chessboard.appendChild(el); gsap.to(el, { y: -40, opacity: 0, duration: 1.5, onComplete: () => el.remove() }); }
}

// ─── BOARD EVENT LISTENERS ────────────────────────────────────────────────────
function setupBoardListeners() {
  if (state.listenersAdded) return;
  state.listenersAdded = true;
  els.chessboard.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  // Right-click arrows and premove cancellation
  els.chessboard.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (state.premove) {
        state.premove = null;
        syncBoardToDOM();
        return;
    }
    const rect = els.chessboard.getBoundingClientRect();
    const scaleX = 800 / rect.width; const scaleY = 800 / rect.height;
    const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
    const sq = pixelToSquare(x, y);
    if (!sq) return;
    if (!state.arrowStartSq) { state.arrowStartSq = sq; }
    else { if (state.arrowStartSq !== sq) { drawCustomArrow(state.arrowStartSq, sq); } state.arrowStartSq = null; }
  });
  // Clear arrows on left-click on board empty
  els.chessboard.addEventListener('click', e => {
    if (e.button !== 0) return;
    state.arrowStartSq = null;
  });
}

function onPointerDown(e) {
  if (e.button !== 0) return;
  const rect = els.chessboard.getBoundingClientRect();
  const scaleX = 800 / rect.width; const scaleY = 800 / rect.height;
  const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
  const sq = pixelToSquare(x, y);
  if (!sq) return;
  // Coordinate training
  if (state.coordinateTrainingActive) { handleCoordinateClick(sq); return; }
  
  // History mode: no moves
  if (state.viewIndex < state.game.history().length) return;
  
  // Cancel premove if clicked
  if (state.premove) {
      state.premove = null;
      syncBoardToDOM();
  }
  // Clear custom arrows on piece drag
  clearCustomArrows();
  const piece = state.game.get(sq);
  if (piece && piece.color === state.playerColor) {
    state.draggedFromSq = sq;
    state.draggedPieceEl = state.piecesDOM[sq];
    state.isMouseDragging = true;
    const pos = squareToPixel(sq);
    state.mouseOffsetX = x - pos.x - 50; state.mouseOffsetY = y - pos.y - 50;
    if (state.draggedPieceEl) { state.draggedPieceEl.style.zIndex = '50'; state.draggedPieceEl.style.transition = 'none'; }
    // Show valid moves if setting enabled
    if (userSettings.highlightMoves) {
      const moves = state.game.moves({ square: sq, verbose: true });
      state.validDestinations = moves.map(m => m.to);
      renderHints(state.validDestinations);
    }
    e.preventDefault();
  }
}

function onPointerMove(e) {
  if (!state.isMouseDragging || !state.draggedPieceEl) return;
  const rect = els.chessboard.getBoundingClientRect();
  const scaleX = 800 / rect.width; const scaleY = 800 / rect.height;
  const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
  state.draggedPieceEl.style.left = `${x - state.mouseOffsetX - 50}px`;
  state.draggedPieceEl.style.top = `${y - state.mouseOffsetY - 50}px`;
}

function onPointerUp(e) {
  if (!state.isMouseDragging) return;
  state.isMouseDragging = false;
  const rect = els.chessboard.getBoundingClientRect();
  const scaleX = 800 / rect.width; const scaleY = 800 / rect.height;
  const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
  const toSq = pixelToSquare(x, y);
  if (state.draggedPieceEl) { state.draggedPieceEl.style.zIndex = ''; state.draggedPieceEl.style.transition = ''; }
  els.hintsLayer.innerHTML = '';
  if (!toSq || toSq === state.draggedFromSq) { syncBoardToDOM(); state.draggedFromSq = null; state.draggedPieceEl = null; return; }
  attemptMove(state.draggedFromSq, toSq);
  state.draggedFromSq = null; state.draggedPieceEl = null;
}

function attemptMove(from, to) {
  if (!from || !to) return;
  
  // History mode check
  if (state.viewIndex < state.game.history().length) return;
  
  const piece = state.game.get(from);
  if (!piece || piece.color !== state.playerColor) return;
  
  // Premove logic: if it's not player's turn, store premove
  if (state.game.turn() !== state.playerColor) {
      state.premove = { from, to };
      syncBoardToDOM();
      return;
  }
  // Promotion check
  if (piece.type === 'p' && ((state.playerColor === 'w' && to[1] === '8') || (state.playerColor === 'b' && to[1] === '1'))) {
    if (userSettings.autoQueen) { doMove(from, to, 'q'); }
    else { showPromotionModal(from, to); }
    return;
  }
  doMove(from, to);
}

function doMove(from, to, promotion) {
  const moveObj = state.game.move({ from, to, promotion: promotion || 'q' });
  if (!moveObj) { syncBoardToDOM(); return; }
  state.viewIndex = state.game.history().length;
  finishMoveVisuals(moveObj);
  syncBoardToDOM();
  updateAfterMove(moveObj, true);
}

function updateAfterMove(moveObj, isPlayerMove) {
  updateMoveHistoryUI(); updateHistoryButtons(); updateCapturedPieces();
  updateStatus(); detectOpening();
  if (els.positionFenInput) els.positionFenInput.value = state.game.fen();
  
  // Premove execution
  if (state.game.game_over()) {
      state.premove = null;
  } else if (state.game.turn() === state.playerColor && state.premove) {
      const pm = state.premove;
      state.premove = null;
      setTimeout(() => attemptMove(pm.from, pm.to), 50);
  }
  if (state.game.game_over() || state.isTimeOut) return;
  // Puzzle check
  if (state.gameMode === 'puzzle' && isPlayerMove) {
    handlePuzzleMove(moveObj.san);
    return;
  }
  // Multiplayer: push to Firestore
  if (state.gameMode === 'multiplayer' && state.multiplayer.gameId && isPlayerMove) {
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'multiplayer_games', state.multiplayer.gameId);
    updateDoc(gameRef, { fen: state.game.fen(), history: state.game.history(), turn: state.game.turn(), lastMoveTime: Date.now() }).catch(console.error);
    return;
  }
  // AI response
  if (isPlayerMove && state.gameMode !== 'study') setTimeout(makeEngineMove, Math.floor(Math.random() * 300) + 200);
  // Update Oracle continuously
  if (state.godModeActive) askOracle();
}

function showPromotionModal(from, to) {
  state.pendingPromotion = { from, to };
  els.promotionModal.style.display = 'flex';
  els.promoPieces.innerHTML = '';
  ['q', 'r', 'b', 'n'].forEach(piece => {
    const div = document.createElement('div');
    div.className = 'promo-piece';
    div.style.backgroundImage = `url(${getPieceUrl(state.playerColor, piece)})`;
    div.onclick = () => { els.promotionModal.style.display = 'none'; doMove(from, to, piece); };
    els.promoPieces.appendChild(div);
    gsap.fromTo(div, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' });
  });
}

// ─── PUZZLE ───────────────────────────────────────────────────────────────────
function startRandomPuzzle() {
  const puzzle = PUZZLES_DATA[Math.floor(Math.random() * PUZZLES_DATA.length)];
  state.currentPuzzle = puzzle; state.puzzleMoveIndex = 0;
  state.gameMode = 'puzzle';
  gsap.to(els.mainMenu, { opacity: 0, duration: 0.5, onComplete: () => {
    els.mainMenu.style.display = "none"; els.gameUI.style.display = "flex"; gsap.to(els.gameUI, { opacity: 1, duration: 0.5 });
    els.studyPanel.style.display = 'block'; els.liveHistoryPanel.style.display = 'none';
    els.chatPanel.style.display = 'none'; els.pTimer.style.display = 'none'; els.aiTimer.style.display = 'none';
    els.godModeBtn.style.display = 'none'; els.evalBar.style.display = 'none';
    els.historyControlsPanel.style.display = 'none'; els.backToMenuBtn.style.display = 'inline-flex'; els.newGameBtn.style.display = 'none';
    els.studyTypeTag.textContent = `⚔️ ${puzzle.difficulty}`;
    els.studyTypeTag.className = `study-type-tag ${puzzle.difficulty === 'Fácil' ? 'study-white' : puzzle.difficulty === 'Avanzado' ? 'study-black' : ''}`;
    els.studyTitle.textContent = puzzle.desc;
    els.studyDesc.innerHTML = `Encuentra la jugada ganadora para las ${puzzle.fen.includes(' w ') ? '⚪ Blancas' : '⚫ Negras'}.`;
    els.studyProgress.textContent = `Jugada 1 / ${puzzle.moves.length}`;
    els.studyNextBtn.style.display = 'none'; els.studyPrevBtn.style.display = 'none';
    state.game = new Chess(puzzle.fen);
    state.playerColor = puzzle.fen.includes(' w ') ? 'w' : 'b';
    state.hasGameStarted = true; state.viewIndex = 0; state.lastMoveHighlights = [];
    buildBoard(); syncBoardToDOM(); setupBoardListeners(); resizeBoard();
    updateStatus(`⚔️ Reto: ${puzzle.desc}. Racha: 🔥${tacticsStreak}`);
  }});
}

function handlePuzzleMove(san) {
  const expected = state.currentPuzzle.moves[state.puzzleMoveIndex];
  if (san === expected) {
    state.puzzleMoveIndex++;
    playSound('good');
    if (state.puzzleMoveIndex >= state.currentPuzzle.moves.length) {
      tacticsStreak++; tacticsTotal++;
      localStorage.setItem('tacticsStreak', tacticsStreak);
      localStorage.setItem('tacticsTotal', tacticsTotal);
      updateTacticsUI();
      els.studyDesc.innerHTML = `<span style="color:#10b981;font-weight:bold">✅ ¡Correcto! Racha: 🔥${tacticsStreak}</span>`;
      els.studyNextBtn.style.display = 'inline-flex'; els.studyNextBtn.textContent = '→ Siguiente Reto';
      speak("¡Correcto! Excelente jugada.");
      // Brilliant animation
      const pos = squareToPixel(state.currentPuzzle.moves[state.puzzleMoveIndex - 1].substring(2, 4));
      const el = document.createElement('div'); el.className = 'brilliant-move'; el.textContent = '✨';
      el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
      els.chessboard.appendChild(el); gsap.to(el, { y: -50, opacity: 0, duration: 1.5, onComplete: () => el.remove() });
    } else {
      // Play opponent's response
      setTimeout(() => {
        const response = state.currentPuzzle.moves[state.puzzleMoveIndex];
        const moveObj = state.game.move(response);
        if (moveObj) { finishMoveVisuals(moveObj); state.viewIndex = state.game.history().length; syncBoardToDOM(); }
        state.puzzleMoveIndex++;
        els.studyProgress.textContent = `Jugada ${state.puzzleMoveIndex + 1} / ${state.currentPuzzle.moves.length}`;
      }, 600);
    }
  } else {
    tacticsStreak = 0;
    localStorage.setItem('tacticsStreak', '0');
    updateTacticsUI();
    playSound('bad');
    state.game.undo(); state.viewIndex = state.game.history().length; syncBoardToDOM();
    els.studyDesc.innerHTML = `<span style="color:#ef4444;font-weight:bold">❌ Incorrecto. Inténtalo de nuevo.</span>`;
    gsap.to(els.chessboard, { x: -8, duration: 0.07, yoyo: true, repeat: 5 });
    speak("Incorrecto. Intenta otra jugada.");
  }
}

// ─── GOD MODE HIGHLIGHTS ──────────────────────────────────────────────────────
function clearGodHighlights() {
  document.querySelectorAll('.god-hint-from, .god-hint-to, .radar-danger, .hint-arrow-el, .move-classification-icon').forEach(el => el.remove());
  state.hintHighlights = []; state.radarHighlights = [];
}
function clearRadarHighlights() { document.querySelectorAll('.radar-danger').forEach(el => el.remove()); }

function showRadarHighlights() {
  clearRadarHighlights();
  const myColor = state.playerColor;
  const board = state.game.board();
  const files = ['a','b','c','d','e','f','g','h'];
  board.forEach((rowArr, r) => {
    rowArr.forEach((piece, c) => {
      if (!piece || piece.color !== myColor) return;
      const sq = `${files[c]}${8 - r}`;
      // Check if this piece is attacked
      const opponentGame = new Chess(state.game.fen());
      const moves = state.game.moves({ verbose: true });
      const isDefended = moves.some(m => m.to === sq && m.color !== myColor);
      const tempFen = state.game.fen().replace(/ [wb] /, myColor === 'w' ? ' b ' : ' w ');
      try {
        const tempGame = new Chess(tempFen);
        const attackingMoves = tempGame.moves({ verbose: true });
        const isAttacked = attackingMoves.some(m => m.to === sq && m.flags.includes('c'));
        if (isAttacked) {
          const pos = squareToPixel(sq);
          const el = document.createElement('div'); el.className = 'radar-danger'; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
          els.chessboard.insertBefore(el, els.hintsLayer);
        }
      } catch(e) {}
    });
  });
}

function drawCustomArrow(from, to) {
  if (!els.arrowLayer) return;
  const fPos = squareToPixel(from); const tPos = squareToPixel(to);
  const arrowId = `arrow_${from}_${to}`;
  // Remove if exists (toggle)
  const existing = document.getElementById(arrowId);
  if (existing) { existing.remove(); state.customArrows = state.customArrows.filter(a => a !== arrowId); return; }
  // Draw SVG arrow
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.id = arrowId;
  line.setAttribute('x1', fPos.x + 50); line.setAttribute('y1', fPos.y + 50);
  line.setAttribute('x2', tPos.x + 50); line.setAttribute('y2', tPos.y + 50);
  line.setAttribute('stroke', '#f97316'); line.setAttribute('stroke-width', '10');
  line.setAttribute('stroke-linecap', 'round'); line.setAttribute('marker-end', 'url(#customArrowhead)');
  line.setAttribute('opacity', '0.75');
  els.arrowLayer.appendChild(line);
  state.customArrows.push(arrowId);
}

function clearCustomArrows() {
  state.customArrows.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  state.customArrows = [];
}

// ─── CAMERA / MEDIAPIPE ───────────────────────────────────────────────────────
async function toggleCamera() {
  if (state.isCameraActive) {
    state.isCameraActive = false;
    if (els.pipContainer) els.pipContainer.style.display = 'none';
    if (els.cursor) els.cursor.style.display = 'none';
    if (state.cameraInstance) state.cameraInstance.stop();
    return;
  }
  if (typeof Hands === 'undefined') { alert('MediaPipe no disponible'); return; }
  state.isCameraActive = true;
  if (els.pipContainer) els.pipContainer.style.display = 'block';
  if (els.cursor) els.cursor.style.display = 'block';
  const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.5 });
  hands.onResults(onHandResults);
  state.cameraInstance = new Camera(els.video, {
    onFrame: async () => { if (state.isCameraActive) await hands.send({ image: els.video }); },
    width: 320, height: 240
  });
  state.cameraInstance.start();
}

function onHandResults(results) {
  if (!pipCtx) return;
  pipCtx.clearRect(0, 0, 320, 240);
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(pipCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(pipCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
    const ix = landmarks[8]; const tx = landmarks[4];
    const rawX = (1 - ix.x) * 800; const rawY = ix.y * 800;
    state.cursorX += (rawX - state.cursorX) * state.smoothingFactor;
    state.cursorY += (rawY - state.cursorY) * state.smoothingFactor;
    if (els.cursor) { els.cursor.style.left = state.cursorX + 'px'; els.cursor.style.top = state.cursorY + 'px'; }
    const pinchDist = Math.hypot(ix.x - tx.x, ix.y - tx.y);
    if (pinchDist < state.pinchThresholdStart && !state.isPinching) {
      state.isPinching = true;
      if (els.cursor) els.cursor.classList.add('pinching');
      const sq = pixelToSquare(state.cursorX, state.cursorY);
      if (sq) { state.draggedFromSq = sq; state.isPointerDown = true; }
    }
    if (pinchDist > state.pinchThresholdStop && state.isPinching) {
      state.isPinching = false;
      if (els.cursor) els.cursor.classList.remove('pinching');
      if (state.draggedFromSq) { const toSq = pixelToSquare(state.cursorX, state.cursorY); if (toSq) attemptMove(state.draggedFromSq, toSq); state.draggedFromSq = null; }
      state.isPointerDown = false;
    }
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', setupMenu);
