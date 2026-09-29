const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const si = require('systeminformation');
const { getHistory } = require('../db');

// Get history metrics for a given timeframe (default 1h)
router.get('/history', (req, res) => {
  const hours = parseFloat(req.query.hours) || 1;
  try {
    const data = getHistory(hours);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get disk usage and hardware details
router.get('/disk', async (req, res) => {
  try {
    const [fsSize, diskLayout, blockDevices] = await Promise.all([
      si.fsSize(),
      si.diskLayout(),
      si.blockDevices()
    ]);
    
    // Filter out snap and loops for fsSize
    const partitions = fsSize.filter(d => d.mount && !d.mount.startsWith('/snap') && d.type !== 'squashfs');
    
    res.json({
      partitions,
      diskLayout,
      blockDevices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get network connections and ports
router.get('/ports', async (req, res) => {
  try {
    const connections = await si.networkConnections();
    
    // Filter and format connections
    const formatted = connections
      .filter(c => c.localPort && !isNaN(c.localPort))
      .map(c => ({
        protocol: c.protocol,
        localAddress: c.localAddress,
        localPort: c.localPort,
        peerAddress: c.peerAddress,
        peerPort: c.peerPort,
        state: c.state,
        process: c.process || '-',
        pid: c.pid || '-'
      }))
      // Filter out duplicate identical listens
      .filter((v, i, a) => a.findIndex(t => (t.localPort === v.localPort && t.state === v.state && t.protocol === v.protocol)) === i);
      
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan directory for largest files/folders
router.post('/scan', (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: 'Ruta no proporcionada' });
  
  // Safe command to get top 15 largest items in directory (depth 1)
  const cmd = `du -ah -d 1 "${path}" 2>/dev/null | sort -hr | head -n 15`;
  
  exec(cmd, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Error al escanear el directorio' });
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    const results = lines.map(line => {
      const parts = line.split('\t');
      return {
        size: parts[0].trim(),
        name: parts[1] ? parts[1].trim() : 'Desconocido'
      };
    });
    
    res.json(results);
  });
});

// Calculate storage size for each PM2 application
router.get('/apps-storage', (req, res) => {
  exec('pm2 jlist', (err, stdout) => {
    if (err) return res.status(500).json({ error: 'No se pudo obtener la lista de PM2' });
    try {
      const apps = JSON.parse(stdout);
      const paths = new Set();
      
      apps.forEach(app => {
        if (app.pm2_env && app.pm2_env.pm_cwd) {
          // Normalize path: if it ends in /server or /backend, maybe get parent? 
          // Better to just get the exact cwd to be accurate.
          paths.add(app.pm2_env.pm_cwd);
        }
      });
      
      const uniquePaths = Array.from(paths);
      if (uniquePaths.length === 0) return res.json([]);
      
      const cmd = uniquePaths.map(p => `du -sh "${p}" 2>/dev/null`).join(' ; ');
      exec(cmd, (duErr, duStdout) => {
        if (duErr && !duStdout) return res.status(500).json({ error: 'Error al calcular tamaños' });
        
        const lines = duStdout.trim().split('\n').filter(Boolean);
        const results = lines.map(line => {
          const parts = line.split('\t');
          const pPath = parts[1] ? parts[1].trim() : '';
          // Find which apps are using this path
          const appsInPath = apps.filter(a => a.pm2_env && a.pm2_env.pm_cwd === pPath).map(a => a.name);
          return {
            size: parts[0].trim(),
            path: pPath,
            apps: appsInPath
          };
        });
        
        res.json(results);
      });
      
    } catch (e) {
      res.status(500).json({ error: 'Error procesando datos de PM2' });
    }
  });
});

module.exports = router;
