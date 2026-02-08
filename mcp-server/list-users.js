import pool from './database.js';

async function listUsers() {
    try {
        console.log('\n=== Vela Users ===');

        const usersResult = await pool.query(
            'SELECT id, user_id, name, created_at FROM user_settings ORDER BY id'
        );

        if (usersResult.rows.length === 0) {
            console.log('No users found in database');
        } else {
            usersResult.rows.forEach(user => {
                console.log(`ID: ${user.id} | Name: ${user.name || 'N/A'} | Email: ${user.user_id} | Created: ${user.created_at.toISOString().split('T')[0]}`);
            });
        }

        console.log('\n💡 Use the ID field as user_id when calling MCP tools');
        console.log('   Example: get_tasks with user_id: 1\n');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listUsers();
