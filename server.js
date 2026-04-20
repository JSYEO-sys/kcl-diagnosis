import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded Credentials as requested
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'yeojunseok@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '9dnjf12dlf';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'paperclip-kcl-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' 
  }
}));

// Authentication Middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    // Redirect to login if not authenticated
    res.redirect('/login');
  }
};

// Login Route (Serves the separate login.html)
app.get('/login', (req, res) => {
  if (req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'frontend', 'public', 'login.html'));
});

// Authentication API endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true, redirect: '/' });
  } else {
    res.status(401).json({ success: false, message: '안티그레비티 관리자 계정이 아닙니다. 접근이 거부되었습니다.' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, redirect: '/login' });
});

// Protect the entire dist/ built app folder via auth middleware
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Serve the actual app (intercepted by auth)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Fallback for SPA routing if needed
app.get('*'/ requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KCL Diagnosis Secure Server listening on port ${PORT}`);
});
