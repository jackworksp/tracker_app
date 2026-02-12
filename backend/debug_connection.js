const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { loadConfig } = require('./aws-config');

const testConnection = async () => {
    try {
        await loadConfig();
        console.log('Environment loaded.');
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL is missing!');
            process.exit(1);
        }
        console.log('Connecting to DB...');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const client = await pool.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0].now);
        client.release();
        await pool.end();
        console.log('✅ Connection closed.');
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
};

testConnection();
