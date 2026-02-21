require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Import Routes (load only if they exist)
let apiRoutes = null;
let gmailRoutes = null;
const apiRoutePath = path.join(__dirname, 'routes', 'api.js');
const gmailRoutePath = path.join(__dirname, 'routes', 'gmail.js');

if (fs.existsSync(apiRoutePath)) {
    apiRoutes = require('./routes/api');
} else {
    console.warn('[WARN] routes/api.js not found. /api routes from module are disabled.');
}

if (fs.existsSync(gmailRoutePath)) {
    gmailRoutes = require('./routes/gmail');
} else {
    console.warn('[WARN] routes/gmail.js not found. /api/gmail routes from module are disabled.');
}

let getAuthUrl, handleCallback, syncEmails;
let GMAIL_ENABLED = true;
try {
  ({ getAuthUrl, handleCallback, syncEmails } = require('./config/gmail'));
} catch (e) {
  GMAIL_ENABLED = false;
  console.warn('[WARN] config/gmail.js not found or failed to load. Gmail OAuth routes will be disabled.');
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false
  }
});

let authConfig = null;

async function resolveAuthConfig() {
    if (authConfig) return authConfig;

    const [tables] = await pool.execute(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name IN ('admins', 'users')
        ORDER BY FIELD(table_name, 'admins', 'users')
        LIMIT 1
    `);

    if (!tables.length) {
        throw new Error('No admins/users table found');
    }

    const tableName = tables[0].table_name;
    const [columns] = await pool.execute(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
    `, [tableName]);

    const columnNames = new Set(columns.map((column) => column.column_name));
    const identityColumn = columnNames.has('email') ? 'email' : (columnNames.has('username') ? 'username' : null);
    const passwordColumn = columnNames.has('password_hash') ? 'password_hash' : (columnNames.has('password') ? 'password' : null);
    const hasRole = columnNames.has('role');

    if (!identityColumn || !passwordColumn) {
        throw new Error(`Table ${tableName} must contain email/username and password_hash/password columns`);
    }

    authConfig = {
        tableName,
        identityColumn,
        passwordColumn,
        hasRole
    };

    return authConfig;
}

async function ensureAdminUser() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.log('Admin ensure skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing');
        return;
    }

    const config = await resolveAuthConfig();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const [rows] = await pool.execute(
        `SELECT id FROM ${config.tableName} WHERE ${config.identityColumn} = ? LIMIT 1`,
        [ADMIN_EMAIL]
    );

    if (!rows.length) {
        if (config.hasRole) {
            await pool.execute(
                `INSERT INTO ${config.tableName} (${config.identityColumn}, ${config.passwordColumn}, role) VALUES (?, ?, 'admin')`,
                [ADMIN_EMAIL, passwordHash]
            );
        } else {
            await pool.execute(
                `INSERT INTO ${config.tableName} (${config.identityColumn}, ${config.passwordColumn}) VALUES (?, ?)`,
                [ADMIN_EMAIL, passwordHash]
            );
        }
    } else {
        if (config.hasRole) {
            await pool.execute(
                `UPDATE ${config.tableName} SET ${config.passwordColumn} = ?, role = 'admin' WHERE ${config.identityColumn} = ?`,
                [passwordHash, ADMIN_EMAIL]
            );
        } else {
            await pool.execute(
                `UPDATE ${config.tableName} SET ${config.passwordColumn} = ? WHERE ${config.identityColumn} = ?`,
                [passwordHash, ADMIN_EMAIL]
            );
        }
    }

    console.log('Admin ensured');
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

app.post('/api/login', async (req, res) => {
    const input = (req.body.username || req.body.email || '').trim();
    const password = req.body.password || '';

    if (!input || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        const config = await resolveAuthConfig();
        const shouldUseEmail = input.includes('@') && config.identityColumn === 'email';
        const lookupColumn = shouldUseEmail ? 'email' : config.identityColumn;

        const [rows] = await pool.execute(
            `SELECT id, ${config.passwordColumn} AS password_hash FROM ${config.tableName} WHERE ${lookupColumn} = ? LIMIT 1`,
            [input]
        );

        if (!rows.length) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password_hash || '');
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
        return res.json({ success: true });
    } catch (error) {
        console.error('Login failed:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// --- API Routes ---
if (apiRoutes) {
    app.use('/api', apiRoutes(pool, requireAuth, GMAIL_ENABLED, syncEmails));
}

if (gmailRoutes) {
    app.use('/api/gmail', gmailRoutes(pool, requireAuth, GMAIL_ENABLED, getAuthUrl, handleCallback));
}

// --- Gmail OAuth2 Callback Route ---
app.get('/admin/oauth2/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');
    
    try {
        if (!GMAIL_ENABLED) throw new Error('Gmail integration disabled.');
        await handleCallback(code, pool);
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
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Fallback for main website (optional, for SPA routing if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
    try {
        await ensureAdminUser();
    } catch (error) {
        console.error('Admin ensure step failed:', error.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`GMAIL_ENABLED: ${GMAIL_ENABLED}`);
    });
}

startServer();
