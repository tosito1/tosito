const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert } = require('../db');

router.get('/list', (req, res) => {
  try {
    const alerts = getAlerts(100);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/acknowledge/:id', (req, res) => {
  try {
    acknowledgeAlert(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
