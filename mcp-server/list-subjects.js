import pool from './database.js';

async function listSubjects() {
    try {
        const result = await pool.query(`
            SELECT id, name, color, user_id
            FROM subjects
            ORDER BY user_id, name
        `);

        console.log('\n=== Vela Subjects ===\n');

        if (result.rows.length === 0) {
            console.log('No subjects found');
        } else {
            let currentUserId = null;
            result.rows.forEach(subject => {
                if (currentUserId !== subject.user_id) {
                    console.log(`\nUser ID ${subject.user_id}:`);
                    currentUserId = subject.user_id;
                }
                console.log(`  ID: ${subject.id} | ${subject.name} (${subject.color})`);
            });
        }

        console.log('\n💡 Use these subject IDs when creating/filtering tasks\n');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listSubjects();
