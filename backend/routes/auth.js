const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { user, pass } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || 'bubi';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'bubi2024';
  const SECRET     = process.env.JWT_SECRET || 'secret_dev';

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const token = jwt.sign({ user, role: 'admin' }, SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false, message: 'User sau parolă greșită!' });
});

// Middleware verificare token — folosit în celelalte routes
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ ok: false, message: 'Token lipsă' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev');
    next();
  } catch {
    return res.status(403).json({ ok: false, message: 'Token invalid sau expirat' });
  }
}

router.authMiddleware = authMiddleware;
module.exports = router;
