require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const userEmail = process.argv[2] || 'gbnathworkspace@gmail.com';

async function listUserSessions() {
    try {
        console.log(`Finding user with email: ${userEmail}...`);
        
        // 1. Get User ID
        const userRes = await pool.query('SELECT id, user_id FROM user_settings WHERE user_id = $1', [userEmail]);
        
        if (userRes.rows.length === 0) {
            console.error(`❌ User not found: ${userEmail}`);
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`✅ Found User ID: ${userId}`);

        // 2. Get Sessions for this user (via subjects)
        const query = `
            SELECT 
                ss.id,
                ss.date,
                ss.activity,
                ss.time_spent,
                s.name as subject_name,
                ss.created_at
            FROM study_sessions ss
            JOIN subjects s ON ss.subject_id = s.id
            WHERE s.user_id = $1
            ORDER BY ss.date DESC, ss.created_at DESC
        `;

        const res = await pool.query(query, [userId]);
        
        console.log(`\n=== SESSIONS FOR ${userEmail} ===`);
        console.log(`Total sessions: ${res.rows.length}\n`);
        
        if (res.rows.length > 0) {
            console.table(res.rows.map(row => ({
                ID: row.id,
                Subject: row.subject_name,
                Activity: row.activity,
                Time: `${row.time_spent}m`,
                Date: new Date(row.date).toLocaleDateString(),
                Created: new Date(row.created_at).toLocaleString()
            })));
        } else {
            console.log("No sessions found for this user.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

listUserSessions();
