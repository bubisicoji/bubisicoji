// ── API.JS ─ toate request-urile către backend ────────────────────
const API = 'http://localhost:3001/api';

// ── AUTH ──────────────────────────────────────────────────────────
async function apiLogin(user, pass) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass })
  });
  return r.json();
}

// ── PRODUSE ───────────────────────────────────────────────────────
async function apiGetProduse() {
  const r = await fetch(`${API}/produse`);
  return r.json();
}

async function apiSaveProdus(data, galerieFiles, id = null) {
  const token = localStorage.getItem('bc_token');
  const fd = new FormData();
  fd.append('data', JSON.stringify(data));
  if (galerieFiles && galerieFiles.length > 0) {
    galerieFiles.forEach(f => fd.append('galerie', f));
  }

  const url    = id ? `${API}/produse/${id}` : `${API}/produse`;
  const method = id ? 'PUT' : 'POST';

  const r = await fetch(url, {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
    body: fd
  });
  return r.json();
}

async function apiDeleteProdus(id) {
  const token = localStorage.getItem('bc_token');
  const r = await fetch(`${API}/produse/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return r.json();
}

// ── COMENZI ───────────────────────────────────────────────────────
async function apiTrimiteComanda(data, fotoFile) {
  const fd = new FormData();
  fd.append('data', JSON.stringify(data));
  if (fotoFile) fd.append('foto', fotoFile);

  const r = await fetch(`${API}/comenzi`, { method: 'POST', body: fd });
  return r.json();
}

async function apiGetComenzi() {
  const token = localStorage.getItem('bc_token');
  const r = await fetch(`${API}/comenzi`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return r.json();
}

async function apiUpdateStatus(id, status) {
  const token = localStorage.getItem('bc_token');
  const r = await fetch(`${API}/comenzi/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  return r.json();
}

async function apiDeleteComanda(id) {
  const token = localStorage.getItem('bc_token');
  const r = await fetch(`${API}/comenzi/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return r.json();
}
