const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function listTasks() {
    try {
        const result = await pool.query(`
            SELECT 
                t.id, 
                t.title, 
                t.type, 
                t.completed, 
                t.subject_id,
                t.created_at,
                s.name as subject_name
            FROM tasks t
            LEFT JOIN subjects s ON t.subject_id = s.id
            ORDER BY t.created_at DESC
            LIMIT 20
        `);

        console.log('\n=== ALL TASKS ===');
        console.log(`Total tasks: ${result.rows.length}\n`);

        if (result.rows.length === 0) {
            console.log('No tasks found in database.\n');
        } else {
            result.rows.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title}`);
                console.log(`   Type: ${task.type}`);
                console.log(`   Subject: ${task.subject_name || 'None'}`);
                console.log(`   Completed: ${task.completed ? 'Yes' : 'No'}`);
                console.log(`   Created: ${task.created_at}`);
                console.log('');
            });
        }

        await pool.end();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        process.exit(1);
    }
}

listTasks();
