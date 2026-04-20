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
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'public', 'login.html')); });
app.post('/api/auth/login', (req, res) => {
  if (req.body.email === 'yeojunseok@gmail.com' && req.body.password === '9dnjf12dlf') {
    req.session.authenticated = true;
    res.json({ success: true, redirect: '/' });
  } else res.status(401).json({ success: false });
});
app.use(auth, express.static(path.join(__dirname, 'frontend', 'dist')));
app.get('/', auth, (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')); });
app.get('(.*)', auth, (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')); });
app.listen(PORT);
