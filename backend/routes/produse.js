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
    const name = `prod_${Date.now()}_${Math.random().toString(36).slice(2,7)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
router.post('/', authMiddleware, upload.array('galerie'), (req, res) => {
  const produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const data    = JSON.parse(req.body.data);
  const poze    = req.files ? req.files.map(f => `/uploads/produse/${f.filename}`) : [];

  const nou = {
    ...data,
    id:      Date.now(),
    galerie: poze,
    imagine: poze[0] || '',
    active:  true
  };
  produse.push(nou);
  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true, produs: nou });
});

// ── PUT editează produs (admin) ───────────────────────────────────
router.put('/:id', authMiddleware, upload.array('galerie'), (req, res) => {
  const produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const idx     = produse.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'Produs negăsit' });

  const data    = JSON.parse(req.body.data);
  const noiFisiere = req.files ? req.files.map(f => `/uploads/produse/${f.filename}`) : [];

  // Dacă s-au uploadat poze noi, le adăugăm la galerie
  // Dacă data.galerie vine cu poze existente păstrate, le combinăm
  const galerieExistenta = data.galerieExistenta || [];
  const galerieFinala    = [...galerieExistenta, ...noiFisiere];

  // Șterge pozele eliminate
  const galerieVeche = produse[idx].galerie || [];
  galerieVeche.forEach(poza => {
    if (!galerieExistenta.includes(poza)) {
      const p = path.join(__dirname, '..', poza);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  produse[idx] = {
    ...produse[idx],
    ...data,
    id:      produse[idx].id,
    galerie: galerieFinala,
    imagine: galerieFinala[0] || produse[idx].imagine
  };
  delete produse[idx].galerieExistenta;

  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true, produs: produse[idx] });
});

// ── DELETE produs (admin) ─────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  let produse = req.app.locals.readJSON(req.app.locals.PRODUSE_FILE);
  const prod  = produse.find(p => p.id == req.params.id);
  if (!prod) return res.status(404).json({ ok: false });

  // Șterge toată galeria de pe disk
  const galerie = prod.galerie || (prod.imagine ? [prod.imagine] : []);
  galerie.forEach(poza => {
    const p = path.join(__dirname, '..', poza);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  produse = produse.filter(p => p.id != req.params.id);
  req.app.locals.writeJSON(req.app.locals.PRODUSE_FILE, produse);
  res.json({ ok: true });
});

module.exports = router;
