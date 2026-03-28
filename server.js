const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure data dir exists before requiring db or session store
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const SQLiteStore = require('connect-sqlite3')(session);
require('./db'); // initialize DB

const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const catalogRoutes   = require('./routes/catalog');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: dataDir }),
  secret: process.env.SESSION_SECRET || 'avtr-super-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog',   catalogRoutes);

// ── App-level logo (global, not per business) ──────────────────────────────
const appLogoStorage = multer.diskStorage({
  destination: path.join(__dirname, 'data/uploads'),
  filename: (req, file, cb) => cb(null, 'app-logo' + path.extname(file.originalname).toLowerCase())
});
const appLogoUpload = multer({ storage: appLogoStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const auth = require('./middleware/auth');

app.get('/api/settings/app-logo', (req, res) => {
  const exts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
  for (const ext of exts) {
    if (fs.existsSync(path.join(__dirname, 'data/uploads', `app-logo${ext}`))) {
      return res.json({ logo: `/uploads/app-logo${ext}` });
    }
  }
  res.json({ logo: null });
});

app.put('/api/settings/app-logo', auth, appLogoUpload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ logo: `/uploads/${req.file.filename}` });
});
// ────────────────────────────────────────────────────────────────────────────

// Serve uploaded logos/images
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// Serve React app (built by npm run build)
const distPath = path.join(__dirname, 'client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'AVTR Invoice API running. Frontend not built yet.' });
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 AVTR Invoice running on http://localhost:${PORT}`);
  console.log(`   Default password: avtr2024 (change in Settings after first login)\n`);
});
