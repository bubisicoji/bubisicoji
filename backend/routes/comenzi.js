const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authMiddleware } = require('./auth');
const router  = express.Router();

// ── MULTER pentru pozele uploadate de clienți ─────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'comenzi');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `comanda_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf/;
    const ok = allowed.test(file.mimetype) || file.mimetype === 'application/pdf';
    cb(null, ok);
  }
});

// ── POST comandă nouă (public) ────────────────────────────────────
router.post('/', upload.single('foto'), (req, res) => {
  const comenzi = req.app.locals.readJSON(req.app.locals.COMENZI_FILE);

  const data = JSON.parse(req.body.data);
  const comanda = {
    ...data,
    id:     'CMD-' + Date.now().toString(36).toUpperCase(),
    date:   new Date().toLocaleString('ro-RO'),
    status: 'new',
    foto:   req.file ? `/uploads/comenzi/${req.file.filename}` : '',
    fotoOriginal: req.file ? req.file.originalname : ''
  };

  comenzi.unshift(comanda);
  req.app.locals.writeJSON(req.app.locals.COMENZI_FILE, comenzi);
  res.json({ ok: true, id: comanda.id });
});

// ── GET toate comenzile (admin) ───────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const comenzi = req.app.locals.readJSON(req.app.locals.COMENZI_FILE);
  res.json(comenzi);
});

// ── PUT update status (admin) ─────────────────────────────────────
router.put('/:id/status', authMiddleware, (req, res) => {
  const comenzi = req.app.locals.readJSON(req.app.locals.COMENZI_FILE);
  const c = comenzi.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ ok: false });
  c.status = req.body.status;
  req.app.locals.writeJSON(req.app.locals.COMENZI_FILE, comenzi);
  res.json({ ok: true });
});

// ── DELETE comandă (admin) ────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  let comenzi = req.app.locals.readJSON(req.app.locals.COMENZI_FILE);
  const c = comenzi.find(x => x.id === req.params.id);

  // Șterge și poza clientului de pe disk
  if (c && c.foto) {
    const p = path.join(__dirname, '..', c.foto);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  comenzi = comenzi.filter(x => x.id !== req.params.id);
  req.app.locals.writeJSON(req.app.locals.COMENZI_FILE, comenzi);
  res.json({ ok: true });
});

module.exports = router;
