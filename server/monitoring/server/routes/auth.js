const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Read password with fallbacks:
// 1. Local override in monitoring_app
// 2. Nexus password file
// 3. Default "tosito13"
function getPassword() {
  const localPwd = path.join(__dirname, '../../password');
  const nexusPwd = '/home/tosito/nexus/backend/password';
  
  if (fs.existsSync(localPwd)) {
    return fs.readFileSync(localPwd, 'utf8').trim();
  }
  if (fs.existsSync(nexusPwd)) {
    return fs.readFileSync(nexusPwd, 'utf8').trim();
  }
  return 'tosito13';
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === getPassword()) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.post('/change-password', (req, res) => {
  // Only authenticated users can change the password
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body;
  
  if (currentPassword !== getPassword()) {
    return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña es demasiado corta' });
  }

  try {
    const localPwdPath = path.join(__dirname, '../../password');
    fs.writeFileSync(localPwdPath, newPassword.trim(), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Error interno al guardar la contraseña' });
  }
});

router.get('/status', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
