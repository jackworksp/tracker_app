// Quick script to list users
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listUsers() {
    try {
        const result = await pool.query('SELECT * FROM user_settings ORDER BY created_at DESC');
        console.log('\n=== ALL USERS ===');
        console.log(`Total users: ${result.rows.length}\n`);
        
        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.user_id}`);
            console.log(`   Settings ID: ${user.id}`);
            console.log(`   Active Subject: ${user.active_subject_id || 'None'}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('');
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

listUsers();
