const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── STATIC: uploads accesibile public ────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── STATIC: servim frontend-ul din rădăcina proiectului ──────────
app.use(express.static(path.join(__dirname, '..')));

// ── DATE (JSON simplu, fără bază de date externă) ─────────────────
// Produse și comenzi salvate în data/ ca fișiere JSON
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const PRODUSE_FILE  = path.join(DATA_DIR, 'produse.json');
const COMENZI_FILE  = path.join(DATA_DIR, 'comenzi.json');

// Inițializare fișiere dacă nu există
if (!fs.existsSync(PRODUSE_FILE)) {
  fs.writeFileSync(PRODUSE_FILE, JSON.stringify(defaultProduse(), null, 2));
}
if (!fs.existsSync(COMENZI_FILE)) {
  fs.writeFileSync(COMENZI_FILE, JSON.stringify([], null, 2));
}

function defaultProduse() {
  return [
    { id: 1, emoji: '🖼️', imagine: '', name: 'Tablou Personalizat', desc: 'Tablou imprimat cu poza ta, în ramă elegantă.', price: 79, badge: '⭐ Best seller', options: ['A4 (21×30 cm)', 'A3 (30×42 cm)'], optLabel: 'Dimensiune', allowText: true, allowPhoto: true, active: true },
    { id: 2, emoji: '☕', imagine: '', name: 'Cană Personalizată', desc: 'Cană ceramică 330ml cu textul și poza ta.', price: 45, badge: '🔥 Top vânzări', options: ['Albă', 'Neagră', 'Roz', 'Bej'], optLabel: 'Culoare', allowText: true, allowPhoto: true, active: true },
    { id: 3, emoji: '💌', imagine: '', name: 'Felicitare Artizanală', desc: 'Felicitare handmade cu mesajul tău scris caligrafic.', price: 25, badge: null, options: ['Ziua de naștere', 'Aniversare', 'Mulțumesc', 'Altă ocazie'], optLabel: 'Ocazie', allowText: true, allowPhoto: false, active: true },
    { id: 4, emoji: '🛋️', imagine: '', name: 'Pernuță Personalizată', desc: 'Pernuță decorativă 40×40 cu print custom.', price: 95, badge: '✨ Nou', options: ['40×40 cm', '50×50 cm'], optLabel: 'Dimensiune', allowText: true, allowPhoto: true, active: true },
    { id: 5, emoji: '📱', imagine: '', name: 'Husă Telefon Custom', desc: 'Husă rezistentă cu design 100% personalizat.', price: 55, badge: null, options: ['iPhone', 'Samsung', 'Xiaomi', 'Alt model'], optLabel: 'Model telefon', allowText: true, allowPhoto: true, active: true },
    { id: 6, emoji: '🎁', imagine: '', name: 'Set Cadou Surpriză', desc: '3 articole personalizate + ambalaj cadou premium.', price: 149, badge: '💝 Popular', options: ['Tematic roz', 'Tematic neutru', 'Tematic albastru'], optLabel: 'Tema ambalaj', allowText: true, allowPhoto: true, active: true }
  ];
}

// ── HELPERS ───────────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── ROUTES ────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/produse', require('./routes/produse'));
app.use('/api/comenzi', require('./routes/comenzi'));

// Exportăm funcțiile helper pentru routes
app.locals.readJSON   = readJSON;
app.locals.writeJSON  = writeJSON;
app.locals.PRODUSE_FILE = PRODUSE_FILE;
app.locals.COMENZI_FILE = COMENZI_FILE;

// ── SPA fallback ──────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── START ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 BUBi & COJi server pornit!`);
  console.log(`   Shop:  http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin.html\n`);
});
