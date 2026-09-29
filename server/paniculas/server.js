import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = 'local-secret-key-for-paniculas-change-in-prod';
const ADMIN_EMAIL = 'tosito@correo.com';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json()); // Add JSON body parsing

// --- BASE DE DATOS SQLITE ---
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) console.error("Error conectando a SQLite", err);
  else console.log("Conectado a SQLite local.");
});

// Inicializar tablas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT,
    isGuest INTEGER,
    avatarSeed TEXT,
    avatarStyle TEXT,
    xp INTEGER,
    level INTEGER,
    preferences TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS lists (
    userId TEXT PRIMARY KEY,
    ids TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    data TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS metadata (
    id TEXT PRIMARY KEY,
    data TEXT
  )`);

  // Auto-seed metadata si está vacía
  db.get("SELECT COUNT(*) as count FROM metadata", [], (err, row) => {
    if (row && row.count === 0) {
      const defaultMeta = { genres: ["Acción", "Ciencia Ficción", "Fantasía", "Terror", "Drama", "Comedia", "Romance", "Documental", "Animación", "Aventura"], categories: ["Aclamadas", "Trending", "Estrenos", "Clásicos", "Infantil", "Independiente"] };
      db.run("INSERT INTO metadata (id, data) VALUES (?, ?)", ['metadata', JSON.stringify(defaultMeta)]);
    }
  });

  // Auto-seed movies si está vacía
  db.get("SELECT COUNT(*) as count FROM movies", [], (err, row) => {
    if (row && row.count === 0) {
      const MOCK_MOVIES = [
        { id: "1", title: "EL AMANECER DEL CÓDIGO", type: "movie", genre: "Ciencia Ficción", year: 2026, rating: "98%", duration: "2h 15m", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&w=1920&q=100", description: "Un programador solitario descubre que la realidad es una simulación en un servidor obsoleto.", isTop10: true, tags: ["Cyberpunk", "Mente"], themeColor: "rgba(16, 185, 129, 0.15)", mood: "Curiosidad", sources: [{ label: 'Servidor Principal', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }, { label: 'Respaldo Ultra', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }] },
        { id: "2", title: "ECO DE PÁNICO", type: "movie", genre: "Terror", year: 2025, rating: "85%", duration: "1h 45m", image: "https://images.unsplash.com/photo-1505635552518-3448ff116af3?ixlib=rb-4.0.3&w=800&q=80", description: "Un grupo explora una mansión donde los ecos de sus propios miedos toman forma física.", isTop10: false, tags: ["Sobrenatural", "Oscuro"], themeColor: "rgba(220, 38, 38, 0.15)", mood: "Miedo", sources: [{ label: 'Servidor 1', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }] },
        { id: "3", title: "RÁPIDOS Y FURIOSOS: CSS", type: "movie", genre: "Acción", year: 2024, rating: "78%", duration: "2h 05m", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&w=800&q=80", description: "Carreras clandestinas de maquetación web. Todo se decide en la última línea de código.", isTop10: true, tags: ["Adrenalina", "Código"], themeColor: "rgba(59, 130, 246, 0.15)", mood: "Adrenalina", sources: [{ label: 'Main Server', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }] },
        { id: "4", title: "AMOR EN LA NUBE", type: "series", genre: "Romance", year: 2023, rating: "80%", duration: "1h 50m", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-4.0.3&w=800&q=80", description: "Dos IAs desarrollan sentimientos mutuos mientras gestionan los servidores de una app de citas.", isTop10: false, tags: ["Emotivo", "IA"], themeColor: "rgba(236, 72, 153, 0.15)", mood: "Emoción", sources: [{ label: 'Cloud Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' }] },
        { id: "5", title: "ODISEA ESTELAR", type: "movie", genre: "Ciencia Ficción", year: 2026, rating: "95%", duration: "2h 40m", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&w=800&q=80", description: "La humanidad busca un nuevo hogar en la galaxia de Andrómeda tras el colapso solar.", isTop10: true, tags: ["Espacio", "Épico"], themeColor: "rgba(139, 92, 246, 0.15)", mood: "Curiosidad", sources: [{ label: 'Deep Space Link', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }] },
        { id: "6", title: "LA SOMBRA", type: "series", genre: "Terror", year: 2022, rating: "69%", duration: "1h 30m", image: "https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?ixlib=rb-4.0.3&w=800&q=80", description: "Nadie sabe qué acecha en el callejón de la Calle 13, pero nadie ha vuelto para contarlo.", isTop10: false, tags: ["Misterio", "Crimen"], themeColor: "rgba(251, 146, 60, 0.1)", mood: "Miedo", sources: [{ label: 'Shadow Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }] }
      ];
      MOCK_MOVIES.forEach(m => {
        db.run("INSERT INTO movies (id, data) VALUES (?, ?)", [m.id, JSON.stringify(m)]);
      });
    }
  });
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    db.get("SELECT * FROM users WHERE id = ?", [decoded.id], (err, user) => {
      if (err || !user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      next();
    });
  });
};

// --- ENDPOINTS DE API ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    } else {
      if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      user.preferences = JSON.parse(user.preferences || '{}');
      delete user.password;
      res.json({ token, user });
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (user) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newId = Date.now().toString();
    const role = email === ADMIN_EMAIL ? 'admin' : 'user';
    const defaultPrefs = JSON.stringify({ atmos: true, ambilight: true });
    const name = email.split('@')[0];
    
    db.run("INSERT INTO users (id, email, password, name, role, isGuest, avatarSeed, avatarStyle, xp, level, preferences) VALUES (?, ?, ?, ?, ?, 0, ?, 'avataaars', 0, 1, ?)", 
      [newId, email, hashedPassword, name, role, newId, defaultPrefs], 
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        const token = jwt.sign({ id: newId, email, role }, JWT_SECRET);
        return res.json({ token, user: { id: newId, email, name, role, isGuest: false, xp: 0, level: 1, avatarSeed: newId, avatarStyle: 'avataaars', preferences: JSON.parse(defaultPrefs) } });
    });
  });
});

app.post('/api/auth/guest', (req, res) => {
  const newId = 'guest_' + Date.now().toString();
  const defaultPrefs = JSON.stringify({ atmos: true, ambilight: true });
  db.run("INSERT INTO users (id, name, role, isGuest, avatarSeed, avatarStyle, xp, level, preferences) VALUES (?, 'Viajero', 'user', 1, ?, 'avataaars', 0, 1, ?)", 
    [newId, newId, defaultPrefs], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      const token = jwt.sign({ id: newId, role: 'user' }, JWT_SECRET);
      res.json({ token, user: { id: newId, name: 'Viajero', role: 'user', isGuest: true, xp: 0, level: 1, avatarSeed: newId, avatarStyle: 'avataaars', preferences: JSON.parse(defaultPrefs) } });
  });
});

app.get('/api/user/me', authenticate, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    user.preferences = JSON.parse(user.preferences || '{}');
    delete user.password;
    res.json(user);
  });
});

app.put('/api/user/me', authenticate, (req, res) => {
  const updates = req.body;
  if (updates.preferences) updates.preferences = JSON.stringify(updates.preferences);
  
  let setQuery = [];
  let values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (['name', 'avatarSeed', 'avatarStyle', 'preferences', 'xp', 'level'].includes(key)) {
      setQuery.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (setQuery.length === 0) return res.json({ success: true });
  values.push(req.user.id);
  
  db.run(`UPDATE users SET ${setQuery.join(', ')} WHERE id = ?`, values, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update' });
    db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
      user.preferences = JSON.parse(user.preferences || '{}');
      delete user.password;
      io.emit('user_updated', user);
      res.json(user);
    });
  });
});

app.get('/api/movies', (req, res) => {
  db.all("SELECT * FROM movies", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const movies = rows.map(r => JSON.parse(r.data));
    res.json(movies);
  });
});

app.get('/api/lists/me', authenticate, (req, res) => {
  db.get("SELECT ids FROM lists WHERE userId = ?", [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(row ? JSON.parse(row.ids) : []);
  });
});

app.post('/api/lists/me', authenticate, (req, res) => {
  const { ids } = req.body;
  db.run("INSERT INTO lists (userId, ids) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET ids = excluded.ids", 
    [req.user.id, JSON.stringify(ids)], 
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
});

app.get('/api/metadata', (req, res) => {
  db.get("SELECT data FROM metadata WHERE id = 'metadata'", [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(row ? JSON.parse(row.data) : {});
  });
});

app.get('/api/stats', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.all("SELECT id, name, email, xp, level, role, isGuest FROM users", [], (err, users) => {
    res.json({ totalUsers: users.length, usersList: users });
  });
});

app.post('/api/movies', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const movie = req.body;
  if (!movie.id) movie.id = Date.now().toString();
  db.run("INSERT INTO movies (id, data) VALUES (?, ?)", [movie.id, JSON.stringify(movie)], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    io.emit('movies_updated');
    res.json(movie);
  });
});

app.put('/api/movies/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const movie = req.body;
  db.run("UPDATE movies SET data = ? WHERE id = ?", [JSON.stringify(movie), req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    io.emit('movies_updated');
    res.json(movie);
  });
});

app.delete('/api/movies/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.run("DELETE FROM movies WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    io.emit('movies_updated');
    res.json({ success: true });
  });
});

app.put('/api/users/:id/role', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { role } = req.body;
  db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, role });
  });
});

app.put('/api/metadata', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const newData = req.body;
  db.get("SELECT data FROM metadata WHERE id = 'metadata'", [], (err, row) => {
    let current = {};
    if (row) current = JSON.parse(row.data);
    const updated = { ...current, ...newData };
    db.run("UPDATE metadata SET data = ? WHERE id = 'metadata'", [JSON.stringify(updated)], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(updated);
    });
  });
});

// --- WATCH PARTIES (SOCKET.IO) ---
const parties = {};

io.on('connection', (socket) => {
  socket.on('join_party', ({ partyId, isHost }) => {
    socket.join(partyId);
    if (isHost && !parties[partyId]) {
      parties[partyId] = { time: 0, isPlaying: true, messages: [{ id: 1, user: 'System', text: '¡Bienvenido a la Watch Party! 🍿', isBot: true }] };
    }
    if (parties[partyId]) {
      socket.emit('party_state', parties[partyId]);
    } else {
      socket.emit('party_error', 'Watch Party no encontrada.');
    }
  });

  socket.on('update_state', ({ partyId, state }) => {
    if (parties[partyId]) {
      parties[partyId] = { ...parties[partyId], ...state };
      socket.to(partyId).emit('party_state', parties[partyId]);
    }
  });

  socket.on('send_message', ({ partyId, message }) => {
    if (parties[partyId]) {
      parties[partyId].messages.push(message);
      io.to(partyId).emit('party_state', parties[partyId]);
    }
  });
});

// --- SUBIDA DE VIDEOS ---
const uploadDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10 GB limit
});

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/videos/${req.file.filename}`;
    res.json({ url });
});

// --- SERVIR FRONTEND ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use('/videos', express.static(uploadDir));
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path === '/upload' || req.path.startsWith('/videos/') || req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.warn("⚠️ La carpeta 'dist' no existe. El frontend no se servirá hasta hacer 'npm run build'.");
}

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API endpoints: http://localhost:${PORT}/api/*`);
});

