require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
let getAuthUrl, handleCallback, syncEmails;
let GMAIL_ENABLED = true;
try {
  ({ getAuthUrl, handleCallback, syncEmails } = require('./gmail'));
} catch (e) {
  GMAIL_ENABLED = false;
  console.warn('[WARN] gmail.js not found or failed to load. Gmail OAuth routes will be disabled.');
}

const app = express();
const PORT = process.env.PORT || 10000;

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

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        
        req.session.adminId = admin.id;
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get Stats (KPIs)
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        // Last 30 days daily stats
        const [dailyStats] = await db.execute(`
            SELECT 
                DATE(order_date) as date, 
                COUNT(*) as orders, 
                SUM(total) as revenue 
            FROM orders 
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(order_date)
            ORDER BY date ASC
        `);

        // Check if Gmail is connected
        const [tokens] = await db.execute('SELECT id FROM gmail_tokens LIMIT 1');
        const isGmailConnected = tokens.length > 0;

        res.json({
            dailyStats,
            isGmailConnected
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Latest Orders
app.get('/api/orders', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.execute('SELECT * FROM orders ORDER BY order_date DESC LIMIT 50');
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Sync Gmail
app.post('/api/sync', requireAuth, async (req, res) => {
    try {
        if (!GMAIL_ENABLED) throw new Error('Gmail integration disabled.');
        const result = await syncEmails(db);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Sync failed' });
    }
});

// --- Gmail OAuth2 Routes ---
if (!GMAIL_ENABLED) {
  app.get('/api/gmail/auth', requireAuth, (req, res) => {
    res.status(501).json({ error: 'Gmail integration disabled: gmail.js not deployed.' });
  });
  app.get('/admin/oauth2/callback', (req, res) => {
    res.status(501).send('Gmail integration disabled: gmail.js not deployed.');
  });
}

app.get('/api/gmail/auth', requireAuth, (req, res) => {
    if (!GMAIL_ENABLED) return res.status(501).json({ error: 'Gmail integration disabled.' });
    const url = getAuthUrl();
    res.json({ url });
});

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

// --- Serve Frontend ---

// Resolve directories whether server.js is at repo root or inside /server
const candidateAdminDirs = [
  path.join(__dirname, 'admin'),
  path.join(__dirname, '..', 'admin'),
];
const ADMIN_DIR = candidateAdminDirs.find(d => fs.existsSync(d)) || candidateAdminDirs[0];

const candidatePublicDirs = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  __dirname,                 // allow serving static HTML/CSS at repo root
  path.join(__dirname, '..'), // allow serving static HTML/CSS at repo root when server.js is in /server
];
const PUBLIC_DIR = candidatePublicDirs.find(d => fs.existsSync(d)) || candidatePublicDirs[0];

// Serve static files for your main site (HTML/CSS/JS)
app.use(express.static(PUBLIC_DIR));

// Admin UI under /admin
app.use('/admin', express.static(ADMIN_DIR));

// Default route
app.get('/', (req, res) => {
  // If you have index.html in repo root/public, express.static will handle it.
  // Otherwise redirect to admin.
  const indexCandidates = [
    path.join(PUBLIC_DIR, 'index.html'),
    path.join(PUBLIC_DIR, 'lecomax.com', 'index.html'),
  ];
  const indexFile = indexCandidates.find(f => fs.existsSync(f));
  if (indexFile) return res.sendFile(indexFile);
  return res.redirect('/admin');
});

// Fallback for /admin to serve its index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`PUBLIC_DIR: ${PUBLIC_DIR}`);
  console.log(`ADMIN_DIR: ${ADMIN_DIR}`);
  console.log(`GMAIL_ENABLED: ${GMAIL_ENABLED}`);
});
