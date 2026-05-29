const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authMiddleware } = require('./auth');
const router  = express.Router();

// ── MULTER config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'produse');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `prod_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    cb(null, allowed.test(file.mimetype));
  }
});

// ── GET toate produsele (public) ──────────────────────────────────
router.get('/', (req, res) => {
  const produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  res.json(produse);
});

// ── POST produs nou (admin) ───────────────────────────────────────
router.post('/', authMiddleware, upload.single('imagine'), (req, res) => {
  const produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const data    = JSON.parse(req.body.data);

  const nou = {
    ...data,
    id: Date.now(),
    imagine: req.file ? `/uploads/produse/${req.file.filename}` : '',
    active: true
  };
  produse.push(nou);
  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true, produs: nou });
});

// ── PUT editează produs (admin) ───────────────────────────────────
router.put('/:id', authMiddleware, upload.single('imagine'), (req, res) => {
  const produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const idx     = produse.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'Produs negăsit' });

  const data = JSON.parse(req.body.data);

  // Șterge poza veche dacă s-a uploadat una nouă
  if (req.file && produse[idx].imagine) {
    const old = path.join(__dirname, '..', produse[idx].imagine);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  produse[idx] = {
    ...produse[idx],
    ...data,
    id: produse[idx].id,
    imagine: req.file ? `/uploads/produse/${req.file.filename}` : produse[idx].imagine
  };

  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true, produs: produse[idx] });
});

// ── DELETE produs (admin) ─────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  let produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const prod  = produse.find(p => p.id == req.params.id);
  if (!prod) return res.status(404).json({ ok: false });

  // Șterge imaginea de pe disk
  if (prod.imagine) {
    const imgPath = path.join(__dirname, '..', prod.imagine);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  produse = produse.filter(p => p.id != req.params.id);
  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true });
});

module.exports = router;
