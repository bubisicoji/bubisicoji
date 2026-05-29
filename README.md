# 🎁 BUBi & COJi — Cadouri La Fix

Platformă de comenzi personalizate.

---

## 📁 Structura proiectului

```
bubisicoji/
├── index.html          ← Shop-ul public
├── admin.html          ← Panou admin
├── css/style.css       ← Toate stilurile
├── js/
│   ├── api.js          ← Calls către backend
│   ├── shop.js         ← Logica shop
│   └── admin.js        ← Logica admin
├── images/
│   └── logo.jpg        ← 👈 PUNE LOGOUL TĂU AICI!
└── backend/
    ├── server.js       ← Server Node.js/Express
    ├── routes/
    │   ├── auth.js
    │   ├── produse.js
    │   └── comenzi.js
    ├── uploads/        ← Pozele uploadate (auto-create)
    ├── data/           ← JSON cu produse și comenzi (auto-create)
    ├── .env.example    ← Template pentru variabile
    └── package.json
```

---

## 🚀 Setup local (prima dată)

### 1. Instalează Node.js
Descarcă de la https://nodejs.org → alege versiunea **LTS**

### 2. Deschide proiectul în VS Code
```
File → Open Folder → selectează folderul bubisicoji
```

### 3. Instalează dependențele backend
Deschide terminalul în VS Code (Ctrl + `) și rulează:
```bash
cd backend
npm install
```

### 4. Creează fișierul .env
```bash
# În folderul backend/
cp .env.example .env
```
Editează `.env` și schimbă parola:
```
ADMIN_USER=bubi
ADMIN_PASS=parola_ta_secreta
JWT_SECRET=ceva_lung_si_random_123abc!
```

### 5. Pune logoul
Copiază `WhatsApp_Image_2026-05-28_at_13_18_19.jpeg` în folderul `images/` și redenumește-l `logo.jpg`

### 6. Pornește serverul
```bash
# Din folderul backend/
npm run dev
```

Vei vedea:
```
🚀 BUBi & COJi server pornit!
   Shop:  http://localhost:3001
   Admin: http://localhost:3001/admin.html
```

### 7. Deschide în browser
- **Shop:** http://localhost:3001
- **Admin:** http://localhost:3001/admin.html

---

## 🔐 Date admin implicite
- **User:** bubi
- **Parolă:** bubi2024

⚠️ **Schimbă-le în `.env` înainte să pui site-ul live!**

---

## 📦 Comenzi utile

```bash
npm run dev    # Pornit cu auto-reload (pentru development)
npm start      # Pornit normal (pentru producție)
```

---

## 🌐 Deploy pe Render.com (gratuit)

1. Urci codul pe GitHub
2. Mergi pe render.com → New Web Service
3. Conectezi repo-ul
4. Root directory: `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Adaugi variabilele din `.env` în Environment

---

## ✨ Features

- ✅ Shop cu produse din baza de date
- ✅ Upload poze la produse (admin)
- ✅ Comandă cu upload foto client
- ✅ Download foto client din admin
- ✅ Panou admin cu user + parolă (JWT)
- ✅ CRUD produse din browser (fără cod)
- ✅ Status comenzi (Nouă / Procesare / Finalizată)
- ✅ Logo ca header de site
