const express = require('express');
const router = express.Router();
const pm2 = require('pm2');

const connectPM2 = () => new Promise((resolve, reject) => {
  pm2.connect((err) => {
    if (err) reject(err);
    else resolve();
  });
});

// List all PM2 processes
router.get('/list', async (req, res) => {
  try {
    await connectPM2();
    pm2.list((err, list) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: err.message });
      const apps = list.map(app => ({
        id: app.pm_id,
        name: app.name,
        pid: app.pid,
        status: app.pm2_env.status,
        cpu: app.monit.cpu,
        memory: app.monit.memory,
        uptime: app.pm2_env.pm_uptime,
        restarts: app.pm2_env.restart_time,
        script: app.pm2_env.pm_exec_path,
        cwd: app.pm2_env.pm_cwd
      }));
      res.json(apps);
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not connect to PM2', details: err.message });
  }
});

// Action on PM2 process (start/stop/restart/reload/delete)
router.post('/action', async (req, res) => {
  const { action, id } = req.body;
  if (!['start', 'stop', 'restart', 'reload', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  try {
    await connectPM2();
    pm2[action](id, (err) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: `${action} on ${id} executed` });
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not connect to PM2', details: err.message });
  }
});

// Stream PM2 logs for a specific app
router.get('/logs/:name', async (req, res) => {
  const { exec } = require('child_process');
  const lines = req.query.lines || 100;
  exec(`pm2 logs ${req.params.name} --lines ${lines} --nostream --raw 2>&1`, (err, stdout) => {
    res.json({ logs: stdout || '' });
  });
});

module.exports = router;
