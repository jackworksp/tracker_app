require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verifyTables() {
    try {
        const client = await pool.connect();
        console.log('Connected to DB');
        
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('Tables found:', res.rows.map(r => r.table_name));
        
        // Also check row counts to see if data exists
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
            console.log(`${row.table_name}: ${countRes.rows[0].count} rows`);
        }
        
        client.release();
    } catch (err) {
        console.error('Error verifying tables:', err);
    } finally {
        await pool.end();
    }
}

verifyTables();
