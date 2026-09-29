const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./database');

const DEFAULT_PASSWORD = 'admin';

// Middleware de sesión
const sessionMiddleware = session({
    secret: 'nexus-network-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24h
});

// Middleware de protección de rutas
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ ok: false, error: 'Sesión caducada. Por favor, recarga la página e inicia sesión de nuevo.' });
    }
    res.redirect('/login');
}

// Login
async function handleLogin(req, res) {
    const { password } = req.body;
    
    let storedHash = await db.getSetting('password_hash');
    
    // Si no hay contraseña configurada, usar la de defecto
    if (!storedHash) {
        storedHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        await db.setSetting('password_hash', storedHash);
    }
    
    const ok = await bcrypt.compare(password, storedHash);
    
    if (ok) {
        req.session.authenticated = true;
        res.json({ ok: true });
    } else {
        res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
    }
}

// Logout
function handleLogout(req, res) {
    req.session.destroy();
    res.json({ ok: true });
}

// Cambiar contraseña
async function changePassword(req, res) {
    const { current, newPass } = req.body;
    const storedHash = await db.getSetting('password_hash');
    
    if (!storedHash) {
        return res.status(400).json({ ok: false, error: 'No hay contraseña configurada' });
    }
    
    const ok = await bcrypt.compare(current, storedHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Contraseña actual incorrecta' });
    
    const newHash = await bcrypt.hash(newPass, 10);
    await db.setSetting('password_hash', newHash);
    res.json({ ok: true });
}

// Adaptar socket.io para usar sesiones
function wrap(middleware) {
    return (socket, next) => middleware(socket.request, socket.request.res || {}, next);
}

function requireSocketAuth(socket, next) {
    if (socket.request.session && socket.request.session.authenticated) {
        return next();
    }
    next(new Error('Unauthorized'));
}

module.exports = { sessionMiddleware, requireAuth, handleLogin, handleLogout, changePassword, wrap, requireSocketAuth };
