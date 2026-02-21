require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');

// Import Routes
const apiRoutes = require('./routes/api');
const gmailRoutes = require('./routes/gmail');

let getAuthUrl, handleCallback, syncEmails;
let GMAIL_ENABLED = true;
try {
  ({ getAuthUrl, handleCallback, syncEmails } = require('./config/gmail'));
} catch (e) {
  GMAIL_ENABLED = false;
  console.warn('[WARN] config/gmail.js not found or failed to load. Gmail OAuth routes will be disabled.');
}

const app = express();
const PORT = process.env.PORT || 10000;
const DEFAULT_ADMIN_EMAIL = 'admin@lecomax.com';
const DEFAULT_ADMIN_PASSWORD = 'lecomax1970';

// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lecomax_admin',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function ensureDefaultAdmin() {
    const [rows] = await db.execute('SELECT id FROM admins WHERE username = ? LIMIT 1', [DEFAULT_ADMIN_EMAIL]);
    if (rows.length > 0) {
        return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await db.execute(
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
        [DEFAULT_ADMIN_EMAIL, passwordHash]
    );
    console.log('Default admin created: admin@lecomax.com');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // Trust Render's reverse proxy for secure cookies

app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (req.session.adminId) return next();
    res.status(401).json({ error: 'Unauthorized' });
};

// --- API Routes ---
app.use('/api', apiRoutes(db, requireAuth, GMAIL_ENABLED, syncEmails));
app.use('/api/gmail', gmailRoutes(db, requireAuth, GMAIL_ENABLED, getAuthUrl, handleCallback));

// --- Gmail OAuth2 Callback Route ---
app.get('/admin/oauth2/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');
    
    try {
        if (!GMAIL_ENABLED) throw new Error('Gmail integration disabled.');
        await handleCallback(code, db);
        res.send('<script>window.opener.location.reload(); window.close();</script>Gmail Connected Successfully! You can close this window.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to connect Gmail: ' + err.message);
    }
});

// --- Serve Static Files ---

// 1. Serve the main website from /public
app.use(express.static(path.join(__dirname, 'public')));

// 2. Serve admin panel from /admin
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 3. Add a fallback so that /admin loads admin/index.html
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Fallback for main website (optional, for SPA routing if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
    try {
        await ensureDefaultAdmin();
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`GMAIL_ENABLED: ${GMAIL_ENABLED}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
