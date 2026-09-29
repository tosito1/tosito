const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// Get Nginx status
router.get('/status', (req, res) => {
  exec('nginx -v', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ status: 'offline', details: error.message });
    }
    // nginx prints version to stderr
    res.json({ status: 'online', version: stderr.trim() });
  });
});

// Reload Nginx
router.post('/reload', (req, res) => {
  exec('nginx -s reload', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Nginx reloaded successfully' });
  });
});

module.exports = router;
