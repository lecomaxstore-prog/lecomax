const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI // e.g., https://lecomax.com/admin/oauth2/callback
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
}

async function handleCallback(code, db) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save to DB (overwrite existing)
    await db.execute('TRUNCATE TABLE gmail_tokens');
    await db.execute(
        'INSERT INTO gmail_tokens (access_token, refresh_token, expiry_date) VALUES (?, ?, ?)',
        [tokens.access_token, tokens.refresh_token || null, tokens.expiry_date || null]
    );
}

async function getValidClient(db) {
    const [rows] = await db.execute('SELECT * FROM gmail_tokens LIMIT 1');
    if (rows.length === 0) throw new Error('Gmail not connected');

    const tokenData = rows[0];
    oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date
    });

    // Handle token refresh automatically by googleapis
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await db.execute('UPDATE gmail_tokens SET access_token = ?, refresh_token = ?, expiry_date = ?', 
                [tokens.access_token, tokens.refresh_token, tokens.expiry_date]);
        } else {
            await db.execute('UPDATE gmail_tokens SET access_token = ?, expiry_date = ?', 
                [tokens.access_token, tokens.expiry_date]);
        }
    });

    return oauth2Client;
}

async function syncEmails(db) {
    const client = await getValidClient(db);
    const gmail = google.gmail({ version: 'v1', auth: client });

    // Search query for orders
    const query = 'subject:("New Order" OR "Order Confirmation" OR "طلب جديد")';
    
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50 // Adjust as needed
    });

    const messages = res.data.messages || [];
    let newOrdersCount = 0;

    for (const msg of messages) {
        // Check if already processed
        const [existing] = await db.execute('SELECT id FROM orders WHERE message_id = ?', [msg.id]);
        if (existing.length > 0) continue;

        // Fetch full email
        const email = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
        });

        const parsed = parseEmail(email.data);
        
        // Insert Order
        const orderId = parsed.orderId || `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        await db.execute(
            `INSERT INTO orders (id, message_id, customer_name, phone, city, address, total, payment_method, order_date, raw_email) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderId, 
                msg.id, 
                parsed.customerName, 
                parsed.phone, 
                parsed.city, 
                parsed.address, 
                parsed.total, 
                parsed.paymentMethod, 
                parsed.date, 
                parsed.rawBody
            ]
        );
        newOrdersCount++;
    }

    // Log sync
    await db.execute('INSERT INTO sync_logs (emails_processed, new_orders) VALUES (?, ?)', [messages.length, newOrdersCount]);

    return { success: true, processed: messages.length, newOrders: newOrdersCount };
}

// Basic Regex Parser (Adjust regex based on your actual email templates)
function parseEmail(emailData) {
    let body = '';
    
    // Extract body from payload parts
    if (emailData.payload.parts) {
        const part = emailData.payload.parts.find(p => p.mimeType === 'text/plain') || emailData.payload.parts[0];
        if (part && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
    } else if (emailData.payload.body && emailData.payload.body.data) {
        body = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
    }

    // Extract Date from headers
    const dateHeader = emailData.payload.headers.find(h => h.name === 'Date');
    const orderDate = dateHeader ? new Date(dateHeader.value) : new Date();

    // Regex extractors (Fallback to 'Unknown' if not found)
    const extract = (regex) => {
        const match = body.match(regex);
        return match ? match[1].trim() : null;
    };

    return {
        orderId: extract(/Order ID:\s*#?([A-Z0-9-]+)/i),
        customerName: extract(/Name:\s*(.+)/i) || 'Unknown',
        phone: extract(/Phone:\s*(.+)/i) || 'Unknown',
        city: extract(/City:\s*(.+)/i) || 'Unknown',
        address: extract(/Address:\s*(.+)/i) || 'Unknown',
        total: parseFloat(extract(/Total:\s*(?:MAD|\$)?\s*([\d,.]+)/i)?.replace(/,/g, '') || 0),
        paymentMethod: extract(/Payment Method:\s*(.+)/i) || 'Cash on Delivery',
        date: orderDate,
        rawBody: body
    };
}

module.exports = { getAuthUrl, handleCallback, syncEmails };