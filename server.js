require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
const { getAuthUrl, handleCallback, syncEmails } = require('./gmail');

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
        const result = await syncEmails(db);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Sync failed' });
    }
});

// --- Gmail OAuth2 Routes ---

app.get('/api/gmail/auth', requireAuth, (req, res) => {
    const url = getAuthUrl();
    res.json({ url });
});

app.get('/admin/oauth2/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');
    
    try {
        await handleCallback(code, db);
        res.send('<script>window.opener.location.reload(); window.close();</script>Gmail Connected Successfully! You can close this window.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to connect Gmail: ' + err.message);
    }
});

// --- Serve Frontend ---

// Serve static files from the admin folder
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Fallback for /admin to serve index.html
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Redirect root to /admin
app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`Admin backend running on port ${PORT}`);
});