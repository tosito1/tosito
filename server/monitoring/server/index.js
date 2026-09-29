const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const si = require('systeminformation');
const session = require('express-session');
const { insertMetric, insertAlert } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── Session Setup ────────────────────────────
const sessionMiddleware = session({
  secret: 'nexus_monitoring_super_secret_key_123!@#',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
});

app.use(sessionMiddleware);
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────
const authRoutes = require('./routes/auth');
const systemRoutes = require('./routes/system');
const pm2Routes = require('./routes/pm2');
const nginxRoutes = require('./routes/nginx');
const alertRoutes = require('./routes/alerts');

app.use('/api/auth', authRoutes);

// Auth protection middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.use('/api/system', requireAuth, systemRoutes);
app.use('/api/pm2', requireAuth, pm2Routes);
app.use('/api/nginx', requireAuth, nginxRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    next();
  }
});

// ─── Alert Thresholds ─────────────────────────
const ALERT_THRESHOLDS = { cpu: 85, mem: 90, temp: 80 };
const alertCooldown = {};
const COOLDOWN_MS = 5 * 60 * 1000;

function checkAlerts(stats, io) {
  const now = Date.now();
  const checks = [
    { key: 'cpu', value: stats.cpu?.load, threshold: ALERT_THRESHOLDS.cpu, message: `CPU usage is critically high` },
    { key: 'temp', value: stats.temp, threshold: ALERT_THRESHOLDS.temp, message: `CPU temperature is critically high` },
    { key: 'mem', value: stats.mem ? (stats.mem.active / stats.mem.total) * 100 : null, threshold: ALERT_THRESHOLDS.mem, message: 'Memory usage is critically high' }
  ];

  for (const check of checks) {
    if (check.value == null) continue;
    if (check.value > check.threshold) {
      const lastTime = alertCooldown[check.key] || 0;
      if (now - lastTime > COOLDOWN_MS) {
        alertCooldown[check.key] = now;
        const alertData = { type: check.key, message: `${check.message}: ${check.value.toFixed(1)}${check.key === 'temp' ? '°C' : '%'}`, value: check.value };
        insertAlert(alertData.type, alertData.message, alertData.value);
        // Only emit to authenticated sockets
        io.to('authenticated').emit('alert', alertData);
      }
    }
  }
}

// ─── WebSocket: Share session with Socket.io ──
io.engine.use(sessionMiddleware);

io.on('connection', (socket) => {
  const session = socket.request.session;
  
  if (session && session.authenticated) {
    socket.join('authenticated');
    console.log('Authenticated client connected:', socket.id);
  } else {
    console.log('Unauthenticated client connected (no metrics will be sent):', socket.id);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global metrics loop (only emit to 'authenticated' room)
setInterval(async () => {
  // If no authenticated clients are connected, skip heavy fetching
  const authClients = io.sockets.adapter.rooms.get('authenticated');
  if (!authClients || authClients.size === 0) return;

  try {
    const [cpu, mem, network, temp, fs, procs, time] = await Promise.all([
      si.currentLoad(), si.mem(), si.networkStats(), si.cpuTemperature(), si.fsStats(), si.processes(), si.time()
    ]);

    const topProcesses = procs.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 8)
      .map(p => ({ name: p.name, pid: p.pid, cpu: p.cpu, mem: p.mem, user: p.user }));

    const stats = {
      cpu: { load: cpu.currentLoad, cores: cpu.cpus.map(c => parseFloat(c.load.toFixed(1))) },
      mem: { total: mem.total, free: mem.free, used: mem.used, active: mem.active },
      network: network[0] ? { rx_sec: network[0].rx_sec, tx_sec: network[0].tx_sec, iface: network[0].iface } : null,
      temp: temp.main || null,
      disk: fs ? { rx_sec: fs.rx_sec, wx_sec: fs.wx_sec } : null,
      processes: topProcesses,
      uptime: time.uptime
    };

    insertMetric(stats);
    io.to('authenticated').emit('system_stats', stats);
    checkAlerts(stats, io);

  } catch (err) {
    console.error('Error fetching system stats:', err.message);
  }
}, 2000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Monitoring backend listening on port ${PORT}`);
});
