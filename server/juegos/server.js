const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Websocket Events for Virtual Gamepad
io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`Dispositivo unido a la sala del mando: ${roomId}`);
    });
    
    socket.on('gamepad_input', (data) => {
        // Broadcast input to the desktop in the same room
        socket.to(data.roomId).emit('gamepad_input', data);
    });
});

// Endpoint to get Local IP for the QR Code
app.get('/api/ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
            }
        }
    }
    res.json({ ip: localIp });
});

const DB_FILE = path.join(__dirname, 'server_data', 'db', 'users.json');
const SAVES_DIR = path.join(__dirname, 'server_data', 'saves');

// Setup multer for save state uploads
const upload = multer({ dest: path.join(__dirname, 'server_data', 'tmp') });

// Load users DB
function loadUsers() {
    if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    return {};
}

function saveUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// Auth API
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Faltan credenciales" });
    
    const users = loadUsers();
    if (users[username]) return res.status(400).json({ error: "El usuario ya existe" });
    
    users[username] = { password }; // plain text for simplicity in this local context
    saveUsers(users);
    res.json({ message: "Registrado con éxito" });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    
    if (users[username] && users[username].password === password) {
        res.json({ message: "Login exitoso", username });
    } else {
        res.status(401).json({ error: "Credenciales incorrectas" });
    }
});

// Cloud Saves API
app.post('/api/saves/:username/:gameId', upload.single('savefile'), (req, res) => {
    const { username, gameId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const userDir = path.join(SAVES_DIR, username);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    const savePath = path.join(userDir, `${gameId}.sav`);
    fs.renameSync(req.file.path, savePath);

    res.json({ message: "Partida guardada en la nube" });
});

app.get('/api/saves/:username/:gameId', (req, res) => {
    const { username, gameId } = req.params;
    const savePath = path.join(SAVES_DIR, username, `${gameId}.sav`);

    if (fs.existsSync(savePath)) {
        res.download(savePath);
    } else {
        res.status(404).json({ error: "No hay partida guardada" });
    }
});

app.get('/api/user/saves/:username', (req, res) => {
    const { username } = req.params;
    const userDir = path.join(SAVES_DIR, username);
    
    if (!fs.existsSync(userDir)) {
        return res.json({ saves: [] });
    }
    
    const files = fs.readdirSync(userDir);
    const saveIds = files
        .filter(f => f.endsWith('.sav'))
        .map(f => f.replace('.sav', ''));
        
    res.json({ saves: saveIds });
});

// --- Games API (Admin) ---
const GAMES_DB_FILE = path.join(__dirname, 'server_data', 'db', 'games.json');

function loadGames() {
    if (fs.existsSync(GAMES_DB_FILE)) {
        return JSON.parse(fs.readFileSync(GAMES_DB_FILE, 'utf8'));
    }
    return [];
}

function saveGames(games) {
    fs.writeFileSync(GAMES_DB_FILE, JSON.stringify(games, null, 2));
}

app.get('/api/games', (req, res) => {
    res.json(loadGames());
});

// Setup multer for game uploads with dynamic destinations
const gameStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'coverImage') {
            cb(null, path.join(__dirname, 'assets'));
        } else if (file.fieldname === 'romFile') {
            const emulator = req.body.emulator || 'unknown';
            const dir = path.join(__dirname, 'assets', 'roms', emulator);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const uploadGame = multer({ storage: gameStorage });

app.post('/api/admin/games', uploadGame.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'romFile', maxCount: 1 }]), (req, res) => {
    try {
        if (req.body.username !== 'tosito' && req.body.username !== 'admin') {
            return res.status(401).json({ error: "No autorizado. Solo los administradores pueden subir juegos." });
        }
        
        const games = loadGames();
        const newId = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
        
        const romFilename = req.files['romFile'] ? req.files['romFile'][0].originalname : "";
        
        const newGame = {
            id: newId,
            title: req.body.title,
            platform: "retro",
            emulator: req.body.emulator,
            romFile: romFilename, 
            platformName: req.body.platformName,
            year: parseInt(req.body.year) || new Date().getFullYear(),
            image: req.files['coverImage'] ? `assets/${req.files['coverImage'][0].originalname}` : "",
            genre: req.body.genre
        };

        games.push(newGame);
        saveGames(games);
        
        res.json({ message: "Juego añadido con éxito", game: newGame });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al guardar el juego" });
    }
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend de Nexus Arcade corriendo en http://0.0.0.0:${PORT}`);
});
