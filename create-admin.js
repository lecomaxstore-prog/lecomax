require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'password123';

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lecomax_admin'
    });

    const hash = await bcrypt.hash(password, 10);
    
    try {
        await db.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
        console.log(`Admin user '${username}' created successfully.`);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log(`User '${username}' already exists.`);
        } else {
            console.error(err);
        }
    }
    
    await db.end();
}

createAdmin();