// ── SHOP.JS ───────────────────────────────────────────────────────
let produse     = [];
let curProd     = null;
let curQty      = 1;
let fotoFile    = null;

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadProduse();
});

async function loadProduse() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    produse = await apiGetProduse();
    renderShop();
  } catch {
    grid.innerHTML = '<p style="color:var(--mid);grid-column:1/-1;text-align:center">Nu s-au putut încărca produsele. Serverul nu e pornit?</p>';
  }
}

function renderShop() {
  const grid   = document.getElementById('productsGrid');
  const active = produse.filter(p => p.active);
  if (!active.length) {
    grid.innerHTML = '<p style="color:var(--mid);grid-column:1/-1;text-align:center">Produsele se pregătesc — reveniți în curând! 🎁</p>';
    return;
  }
  grid.innerHTML = active.map(p => `
    <div class="card" onclick="openOrder(${p.id})">
      <div class="card-img">
        ${p.imagine
          ? `<img src="${p.imagine}" alt="${p.name}" loading="lazy">`
          : `<span class="emoji-fallback">${p.emoji || '🎁'}</span>`}
        ${p.badge ? `<div class="card-badge">${p.badge}</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc}</div>
        <div class="card-footer">
          <div class="card-price">${p.price} lei <span>/ buc</span></div>
          <button class="add-btn" onclick="event.stopPropagation();openOrder(${p.id})">+</button>
        </div>
      </div>
    </div>`).join('');
}

// ── ORDER MODAL ───────────────────────────────────────────────────
function openOrder(id) {
  curProd = produse.find(p => p.id === id);
  if (!curProd) return;
  curQty = 1; fotoFile = null;
  document.getElementById('orderModal').innerHTML = buildForm();
  document.getElementById('orderOverlay').classList.add('open');
}

function buildForm() {
  const tot = curProd.price;
  return `
    <div class="modal-top">
      <h2>${curProd.emoji || '🎁'} ${curProd.name}</h2>
      <button class="close-btn" onclick="closeOverlay('orderOverlay')">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-price">${curProd.price} lei / buc</div>

      <div class="fg">
        <label>${curProd.optLabel}<span class="req">*</span></label>
        <select class="fs" id="f_opt">${curProd.options.map(o=>`<option>${o}</option>`).join('')}</select>
      </div>

      ${curProd.allowText ? `
      <div class="fg">
        <label>Text / Mesaj personalizare</label>
        <textarea class="ft" id="f_text" placeholder="Ex: Cu drag, pentru mama 💛 — sau lasă gol"></textarea>
      </div>` : ''}

      ${curProd.allowPhoto ? `
      <div class="fg">
        <label>Fotografie pentru personalizare (opțional)</label>
        <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fotoInput').click()">
          <div class="ico">📎</div>
          <p><strong>Click pentru upload</strong><br>PNG, JPG, PDF — max 10MB</p>
        </div>
        <input type="file" id="fotoInput" accept="image/*,.pdf" style="display:none" onchange="handleFoto(event)">
      </div>` : ''}

      <div class="qty-row">
        <label>Cantitate</label>
        <div class="qty">
          <button class="qbtn" onclick="chQty(-1)">−</button>
          <span class="qnum" id="qnum">1</span>
          <button class="qbtn" onclick="chQty(1)">+</button>
        </div>
      </div>

      <hr class="divider">
      <h3 style="font-family:'Fredoka',sans-serif;font-size:1.05rem;margin-bottom:13px">📬 Date de livrare</h3>

      <div class="frow">
        <div class="fg"><label>Nume<span class="req">*</span></label><input class="fi" id="f_name" placeholder="Ion Popescu"></div>
        <div class="fg"><label>Telefon<span class="req">*</span></label><input class="fi" id="f_phone" type="tel" placeholder="07xx xxx xxx"></div>
      </div>
      <div class="fg"><label>Email<span class="req">*</span></label><input class="fi" id="f_email" type="email" placeholder="email@exemplu.ro"></div>
      <div class="fg"><label>Adresă<span class="req">*</span></label><input class="fi" id="f_addr" placeholder="Str. Trandafirilor 5, Bl. A2, Ap. 8"></div>
      <div class="frow">
        <div class="fg"><label>Oraș<span class="req">*</span></label><input class="fi" id="f_city" placeholder="București"></div>
        <div class="fg"><label>Județ<span class="req">*</span></label><input class="fi" id="f_county" placeholder="Ilfov"></div>
      </div>
      <div class="fg"><label>Observații (opțional)</label><textarea class="ft" id="f_notes" placeholder="Detalii extra..." style="min-height:55px"></textarea></div>

      <div class="total-box">
        <div class="tl">Total comandă<small>Transport calculat la confirmare</small></div>
        <div class="ta" id="modalTotal">${tot} lei</div>
      </div>
      <button class="sub-btn" id="submitBtn" onclick="submitOrder()">Trimite comanda 🎉</button>
      <p class="form-note">Vei fi contactat în max 24h pentru confirmare și detalii plată.</p>
    </div>`;
}

function chQty(d) {
  curQty = Math.max(1, Math.min(99, curQty + d));
  document.getElementById('qnum').textContent = curQty;
  document.getElementById('modalTotal').textContent = (curProd.price * curQty) + ' lei';
}

function handleFoto(e) {
  const f = e.target.files[0]; if (!f) return;
  fotoFile = f;
  const z = document.getElementById('uploadZone');
  z.classList.add('done');
  z.innerHTML = `<div class="ico">✅</div><p><strong>${f.name}</strong><br><span style="color:#aaa;font-size:.75rem">Click pentru a schimba</span></p>`;
}

async function submitOrder() {
  const name   = fv('f_name');
  const phone  = fv('f_phone');
  const email  = fv('f_email');
  const addr   = fv('f_addr');
  const city   = fv('f_city');
  const county = fv('f_county');

  if (!name || !phone || !email || !addr || !city || !county) {
    toast('⚠️ Completează toate câmpurile obligatorii!', 'err'); return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) { toast('⚠️ Email invalid!', 'err'); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Se trimite...';

  const data = {
    product: curProd.name, productId: curProd.id,
    option:  document.getElementById('f_opt')?.value || '',
    text:    document.getElementById('f_text')?.value?.trim() || '',
    qty: curQty, total: curProd.price * curQty,
    name, phone, email, addr, city, county,
    notes: document.getElementById('f_notes')?.value?.trim() || ''
  };

  try {
    const res = await apiTrimiteComanda(data, fotoFile);
    if (res.ok) {
      document.getElementById('orderModal').innerHTML = `
        <div class="success">
          <span class="s-icon">🎉</span>
          <h2>Comandă trimisă!</h2>
          <div class="order-code">${res.id}</div>
          <p>Mulțumim, <strong>${name}</strong>!<br>
          Te contactăm la <strong>${phone}</strong> sau <strong>${email}</strong> în max 24h.</p>
          <button class="btn-fire" style="margin-top:24px" onclick="closeOverlay('orderOverlay')">Înapoi la produse</button>
        </div>`;
    } else {
      toast('❌ Eroare la trimitere. Încearcă din nou!', 'err');
      btn.disabled = false; btn.textContent = 'Trimite comanda 🎉';
    }
  } catch {
    toast('❌ Server offline. Încearcă mai târziu!', 'err');
    btn.disabled = false; btn.textContent = 'Trimite comanda 🎉';
  }
}

// ── HELPERS ───────────────────────────────────────────────────────
function fv(id) { return (document.getElementById(id)?.value || '').trim(); }

function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

function scrollShop() {
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
}

function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// Închide modal la click pe overlay
document.getElementById('orderOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeOverlay('orderOverlay');
});
