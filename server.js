import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(session({ secret: 'sec', resave: false, saveUninitialized: false }));
const auth = (req, res, next) => { if (req.session.authenticated) next(); else res.redirect('/login'); };
const noCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'public', 'login.html')); });
app.post('/api/auth/login', (req, res) => {
  if (req.body.email === 'yeojunseok@gmail.com' && req.body.password === '9dnjf12dlf') {
    req.session.authenticated = true;
    res.json({ success: true, redirect: '/' });
  } else res.status(401).json({ success: false });
});
// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    res.json({ success: true, redirect: '/login' });
  });
});

// Protect the HTML entry point
app.get('/', noCache, auth, (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')); });

// Serve static files (exclude index.html from auto-serving to ensure auth check hits)
app.use(express.static(path.join(__dirname, 'frontend', 'dist'), { index: false }));

// Catch-all for SPA routing
app.get(/.*/, noCache, auth, (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')); });

app.listen(PORT);
