const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const client = await pool.connect();
        
        console.log('--- USERS ---');
        const users = await client.query('SELECT * FROM users');
        console.table(users.rows);

        console.log('\n--- SUBJECTS ---');
        // Check for any user link?
        const subjects = await client.query('SELECT * FROM subjects');
        console.table(subjects.rows);

        console.log('\n--- TASKS ---');
        const tasks = await client.query('SELECT id, title, type, subject_id, created_at FROM tasks LIMIT 20');
        console.table(tasks.rows);
        
        console.log('\n--- TODOLIST BY USERHANDLE (checking for "4") ---');
        const todo4 = await client.query(`SELECT * FROM todolist_by_userhandle WHERE userhandle = '4'`);
        console.table(todo4.rows);

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
