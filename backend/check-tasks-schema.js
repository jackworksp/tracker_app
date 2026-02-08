const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTasksSchema() {
    try {
        // Get all columns in the tasks table
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'tasks'
            ORDER BY ordinal_position;
        `);

        console.log('\n=== TASKS TABLE SCHEMA ===\n');
        console.log('Columns found:', result.rows.length);
        console.log('\nColumn Details:\n');

        result.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
            console.log(`  Nullable: ${col.is_nullable}`);
            if (col.column_default) {
                console.log(`  Default: ${col.column_default}`);
            }
            console.log('');
        });

        // Check for user_id specifically
        const hasUserId = result.rows.some(col => col.column_name === 'user_id');
        const hasStatus = result.rows.some(col => col.column_name === 'status');

        console.log('\n=== KEY COLUMN CHECKS ===');
        console.log(`user_id column exists: ${hasUserId ? '✅ YES' : '❌ NO'}`);
        console.log(`status column exists: ${hasStatus ? '✅ YES' : '❌ NO'}`);

    } catch (error) {
        console.error('Error checking schema:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

checkTasksSchema();
