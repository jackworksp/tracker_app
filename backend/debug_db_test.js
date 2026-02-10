require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testDB() {
    try {
        console.log('Testing Database Connection...');
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connected:', res.rows[0].now);

        console.log('Checking user_settings schema...');
        const schema = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_settings'
        `);
        console.log('Columns:', schema.rows.map(r => r.column_name).join(', '));

        const email = 'gbnathworkspace@gmail.com';
        console.log(`Checking for user: ${email}`);
        const user = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [email]);
        
        if (user.rows.length === 0) {
            console.log('❌ User not found!');
            // Check if ANY user exists
            const allUsers = await pool.query('SELECT * FROM user_settings LIMIT 5');
            console.log('Existing users:', allUsers.rows);
        } else {
            console.log('✅ User found:', user.rows[0]);
        }

    } catch (err) {
        console.error('❌ DB Error:', err);
    } finally {
        await pool.end();
    }
}

testDB();
