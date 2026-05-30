// ── ADMIN.JS ──────────────────────────────────────────────────────
let comenzi       = [];
let produse       = [];
let curFilter     = 'all';
let curTab        = 'orders';
let editingId     = null;
let galerieFiles  = [];
let galerieExistenta = [];

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('bc_token');
  if (token) tryAutoLogin(token);
});

async function tryAutoLogin(token) {
  // Verifică dacă tokenul e valid cerând comenzile
  try {
    const r = await fetch('/api/comenzi', { headers: { 'Authorization': `Bearer ${token}` } });
    if (r.ok) showDash();
  } catch { /* token invalid, rămâne pe login */ }
}

// ── LOGIN ─────────────────────────────────────────────────────────
async function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) { toast('Completează user și parolă!', 'err'); return; }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Se verifică...';

  try {
    const res = await apiLogin(user, pass);
    if (res.ok) {
      localStorage.setItem('bc_token', res.token);
      showDash();
    } else {
      toast('❌ ' + res.message, 'err');
      btn.disabled = false; btn.textContent = 'Intră';
    }
  } catch {
    toast('❌ Nu pot conecta la server!', 'err');
    btn.disabled = false; btn.textContent = 'Intră';
  }
}

document.addEventListener('keyup', e => {
  if (e.key === 'Enter' && document.getElementById('loginPass') === document.activeElement) doLogin();
});

function doLogout() {
  localStorage.removeItem('bc_token');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashScreen').style.display  = 'none';
  document.getElementById('loginPass').value = '';
}

// ── DASHBOARD ─────────────────────────────────────────────────────
async function showDash() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashScreen').style.display  = 'block';
  await loadAll();
}

async function loadAll() {
  await Promise.all([loadComenzi(), loadProduse()]);
  renderStats();
  renderOrders();
}

async function loadComenzi() {
  try { comenzi = await apiGetComenzi(); } catch { comenzi = []; }
}

async function loadProduse() {
  try { produse = await apiGetProduse(); } catch { produse = []; }
}

// ── STATS ─────────────────────────────────────────────────────────
function renderStats() {
  const today = new Date().toLocaleDateString('ro-RO');
  const nw  = comenzi.filter(o => o.status === 'new').length;
  const pr  = comenzi.filter(o => o.status === 'processing').length;
  const dn  = comenzi.filter(o => o.status === 'done').length;
  const td  = comenzi.filter(o => o.date && o.date.startsWith(today)).length;

  document.getElementById('statTotal').textContent       = comenzi.length;
  document.getElementById('statNew').textContent         = nw;
  document.getElementById('statProcessing').textContent  = pr;
  document.getElementById('statDone').textContent        = dn;
  document.getElementById('adminSub').textContent        = `${td} comenzi azi · ${comenzi.length} total`;
}

// ── TABS ──────────────────────────────────────────────────────────
function switchTab(t) {
  curTab = t;
  document.querySelectorAll('.atab').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  document.getElementById('tabOrders').style.display   = t === 'orders'   ? 'block' : 'none';
  document.getElementById('tabProducts').style.display = t === 'products' ? 'block' : 'none';
  if (t === 'products') renderPM();
}

// ── ORDERS ────────────────────────────────────────────────────────
function filterOrders(f, btn) {
  curFilter = f;
  document.querySelectorAll('.fbtn').forEach(x => x.classList.remove('active'));
  btn?.classList.add('active');
  renderOrders();
}

function renderOrders() {
  const list     = document.getElementById('ordersList');
  const filtered = curFilter === 'all' ? comenzi : comenzi.filter(o => o.status === curFilter);

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><div class="empty-ico">📭</div><p>Nicio comandă în această categorie.</p></div>`;
    return;
  }

  const labels = { new: '🆕 Nouă', processing: '⚙️ Procesare', done: '✅ Finalizată' };

  list.innerHTML = filtered.map(o => `
    <div class="oc ${o.status}">
      <div class="oc-top">
        <div>
          <div class="oc-id">${o.id}</div>
          <div class="oc-product">${o.product} × ${o.qty} — <span style="color:var(--fire)">${o.total} lei</span></div>
        </div>
        <div style="text-align:right">
          <span class="sbadge ${o.status}">${labels[o.status] || o.status}</span>
          <div class="oc-date">${o.date}</div>
        </div>
      </div>

      <div class="oc-grid">
        <div class="oc-field"><label>Nume</label><p>${o.name}</p></div>
        <div class="oc-field"><label>Telefon</label><p><a href="tel:${o.phone}">${o.phone}</a></p></div>
        <div class="oc-field"><label>Email</label><p><a href="mailto:${o.email}">${o.email}</a></p></div>
        <div class="oc-field"><label>Adresă</label><p>${o.addr}, ${o.city}, ${o.county}</p></div>
      </div>

      ${o.option || o.text || o.foto || o.notes ? `
      <div class="oc-note">
        ${o.option ? `<b>Opțiune:</b> ${o.option}<br>` : ''}
        ${o.text   ? `<b>Text:</b> "${o.text}"<br>` : ''}
        ${o.foto   ? `<b>📎 Fișier client:</b> <a href="${o.foto}" download="${o.fotoOriginal || 'foto'}" target="_blank" class="download-link">⬇️ Descarcă ${o.fotoOriginal || 'poza'}</a><br>` : ''}
        ${o.notes  ? `<b>Obs:</b> ${o.notes}` : ''}
      </div>` : ''}

      <div class="oc-actions">
        ${o.status !== 'processing' && o.status !== 'done'
          ? `<button class="abtn abtn-p" onclick="updStatus('${o.id}','processing')">⚙️ Procesare</button>` : ''}
        ${o.status !== 'done'
          ? `<button class="abtn abtn-d" onclick="updStatus('${o.id}','done')">✅ Finalizat</button>` : ''}
        <button class="abtn abtn-x" onclick="delOrder('${o.id}')">🗑️ Șterge</button>
      </div>
    </div>`).join('');
}

async function updStatus(id, status) {
  await apiUpdateStatus(id, status);
  await loadComenzi(); renderStats(); renderOrders();
  toast('✅ Status actualizat!', 'ok');
}

async function delOrder(id) {
  if (!confirm('Ștergi comanda ' + id + '?')) return;
  await apiDeleteComanda(id);
  await loadComenzi(); renderStats(); renderOrders();
  toast('🗑️ Comandă ștearsă', 'ok');
}

// ── PRODUCT MANAGER ───────────────────────────────────────────────
function renderPM() {
  const g = document.getElementById('pmGrid');
  if (!produse.length) {
    g.innerHTML = `<div class="empty"><div class="empty-ico">📦</div><p>Nu ai produse. Adaugă primul!</p></div>`;
    return;
  }
  g.innerHTML = produse.map(p => `
    <div class="pm-card">
      <div class="pm-img" style="${!p.active ? 'opacity:.45;filter:grayscale(1)' : ''}">
        ${p.imagine
          ? `<img src="${p.imagine}" alt="${p.name}" style="width:100%;height:120px;object-fit:cover;border-radius:10px">`
          : `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:3rem">${p.emoji || '🎁'}</div>`}
      </div>
      <div class="pm-name">${p.name}</div>
      <div class="pm-price">${p.price} lei</div>
      <div style="font-size:.72rem;color:${p.active ? 'var(--green)' : '#aaa'};font-weight:700;margin-top:2px">${p.active ? '✅ Activ' : '⛔ Ascuns'}</div>
      <div class="pm-actions">
        <button class="pm-edit" onclick="openPF(${p.id})">✏️ Editează</button>
        <button class="pm-del"  onclick="delProd(${p.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function openPF(id) {
  editingId        = id || null;
  galerieFiles     = [];
  galerieExistenta = ep && ep.galerie ? [...ep.galerie] : (ep && ep.imagine ? [ep.imagine] : []);
  const ep    = id ? produse.find(p => p.id === id) : null;

  document.getElementById('pfModal').innerHTML = `
    <div class="pf-top">
      <h2>${ep ? '✏️ Editează produs' : '➕ Produs nou'}</h2>
      <button class="close-btn" onclick="closePF()">✕</button>
    </div>
    <div class="pf-body">
      <div class="fg">
        <label>Galerie imagini produs (poți selecta mai multe)</label>
        <div class="upload-zone" id="pfImgZone" onclick="document.getElementById('pfImgInput').click()">
          <div class="ico">🖼️</div>
          <p><strong>Click pentru upload</strong><br>Selectează una sau mai multe poze — JPG, PNG, WEBP</p>
        </div>
        <input type="file" id="pfImgInput" accept="image/*" multiple style="display:none" onchange="handleProdImg(event)">
        <div id="galeriePreview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>
      </div>

      <div class="frow">
        <div class="fg"><label>Emoji (backup) 🎁</label><input class="fi" id="pf_emoji" value="${ep ? ep.emoji : '🎁'}" style="font-size:1.4rem;text-align:center"></div>
        <div class="fg"><label>Preț (lei)<span class="req">*</span></label><input class="fi" id="pf_price" type="number" value="${ep ? ep.price : ''}" placeholder="99"></div>
      </div>
      <div class="fg"><label>Nume produs<span class="req">*</span></label><input class="fi" id="pf_name" value="${ep ? ep.name : ''}" placeholder="Ex: Cană Personalizată"></div>
      <div class="fg"><label>Descriere<span class="req">*</span></label><textarea class="ft" id="pf_desc" placeholder="Scurtă descriere...">${ep ? ep.desc : ''}</textarea></div>
      <div class="fg"><label>Badge (opțional)</label><input class="fi" id="pf_badge" value="${ep && ep.badge ? ep.badge : ''}" placeholder="Ex: 🔥 Best seller"></div>
      <div class="fg"><label>Eticheta opțiunii<span class="req">*</span></label><input class="fi" id="pf_optlabel" value="${ep ? ep.optLabel : 'Dimensiune'}" placeholder="Ex: Culoare"></div>
      <div class="fg"><label>Opțiuni (separate prin virgulă)<span class="req">*</span></label><input class="fi" id="pf_opts" value="${ep ? ep.options.join(', ') : ''}" placeholder="Roșu, Albastru, Verde"></div>

      <div class="toggle-row"><label>Permite text personalizare</label><button class="toggle ${ep && ep.allowText ? 'on' : ''}" id="tog_text" onclick="togBtn('tog_text')"></button></div>
      <div class="toggle-row"><label>Permite upload foto client</label><button class="toggle ${ep && ep.allowPhoto ? 'on' : ''}" id="tog_photo" onclick="togBtn('tog_photo')"></button></div>
      <div class="toggle-row"><label>Produs activ (vizibil în shop)</label><button class="toggle ${!ep || ep.active ? 'on' : ''}" id="tog_active" onclick="togBtn('tog_active')"></button></div>

      <div style="margin-top:20px">
        <button class="sub-btn" onclick="saveProd()">${ep ? 'Salvează modificările' : 'Adaugă produsul'} 🎉</button>
      </div>
    </div>`;

  document.getElementById('pfOverlay').classList.add('open');
  setTimeout(renderGaleriePreview, 50);
}

function handleProdImg(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  galerieFiles = [...galerieFiles, ...files];
  renderGaleriePreview();
}

function renderGaleriePreview() {
  const preview = document.getElementById('galeriePreview');
  if (!preview) return;
  const all = [
    ...galerieExistenta.map((url, i) => ({ type: 'existing', url, i })),
    ...galerieFiles.map((f, i) => ({ type: 'new', url: URL.createObjectURL(f), i }))
  ];
  if (!all.length) { preview.innerHTML = ''; return; }
  preview.innerHTML = all.map(item => `
    <div style="position:relative;display:inline-block">
      <img src="${item.url}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:2px solid #333">
      <button onclick="removePoza('${item.type}',${item.i})" style="position:absolute;top:-6px;right:-6px;background:var(--fire);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>`).join('');
}

function removePoza(type, idx) {
  if (type === 'existing') galerieExistenta.splice(idx, 1);
  else galerieFiles.splice(idx, 1);
  renderGaleriePreview();
}

function togBtn(id) { document.getElementById(id).classList.toggle('on'); }

async function saveProd() {
  const name     = fv2('pf_name');
  const price    = parseFloat(fv2('pf_price'));
  const desc     = fv2('pf_desc');
  const optLabel = fv2('pf_optlabel');
  const optsRaw  = fv2('pf_opts');

  if (!name || !price || !desc || !optLabel || !optsRaw) {
    toast('⚠️ Completează câmpurile obligatorii!', 'err'); return;
  }

  const data = {
    name, price, desc, optLabel,
    options:    optsRaw.split(',').map(s => s.trim()).filter(Boolean),
    emoji:      fv2('pf_emoji') || '🎁',
    badge:      fv2('pf_badge') || null,
    allowText:  document.getElementById('tog_text').classList.contains('on'),
    allowPhoto: document.getElementById('tog_photo').classList.contains('on'),
    active:     document.getElementById('tog_active').classList.contains('on')
  };

  try {
    data.galerieExistenta = galerieExistenta;
    const res = await apiSaveProdus(data, galerieFiles, editingId);
    if (res.ok) {
      await loadProduse(); renderPM();
      closePF();
      toast(editingId ? '✅ Produs actualizat!' : '✅ Produs adăugat!', 'ok');
      editingId = null;
    }
  } catch { toast('❌ Eroare la salvare!', 'err'); }
}

async function delProd(id) {
  if (!confirm('Ștergi produsul?')) return;
  await apiDeleteProdus(id);
  await loadProduse(); renderPM();
  toast('🗑️ Produs șters', 'ok');
}

function closePF() { document.getElementById('pfOverlay').classList.remove('open'); }

// ── HELPERS ───────────────────────────────────────────────────────
function fv2(id) { return (document.getElementById(id)?.value || '').trim(); }

function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

document.getElementById('pfOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closePF();
});
