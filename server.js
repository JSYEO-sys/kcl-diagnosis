import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials
const ADMIN_EMAIL = 'yeojunseok@gmail.com';
const ADMIN_PASSWORD = '9dnjf12dlf';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'kcl-diagnosis-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
          next();
    } else {
          res.redirect('/login');
    }
};

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
          return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'login.html'));
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          req.session.authenticated = true;
          res.json({ success: true, redirect: '/' });
    } else {
          res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, redirect: '/login' });
});

app.use(requireAuth, express.static(path.join(__dirname, 'frontend', 'dist')));

app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.get('/*:path*, requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log('KCL Diagnosis Secure Server listening');
});
