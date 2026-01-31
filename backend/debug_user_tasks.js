const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const client = await pool.connect();
        
        const email = 'gbnathworkspace@gmail.com';
        console.log(`Looking for user with email: ${email}`);

        // Try 'users' table
        let userResult = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);
        
        if (userResult.rows.length === 0) {
            console.log('User not found in users table. Checking schema of users table...');
             const userCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
             console.log('Users columns:', userCols.rows.map(r => r.column_name));
             
             // Try fetching any user to see structure
             const anyUser = await client.query('SELECT * FROM users LIMIT 1');
             if(anyUser.rows.length > 0) console.log('Sample user:', anyUser.rows[0]);
             
             console.log('Checking user_profiles...');
             const userProfileCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'`);
             console.log('user_profiles columns:', userProfileCols.rows.map(r => r.column_name));

             process.exit(0);
        }

        const user = userResult.rows[0];
        console.log('Found user:', user);
        
        const userId = user.id; // 4
        console.log(`User ID: ${userId}`);

        // Find tables with user_id
        console.log('Searching for tables with user_id column...');
        const tablesWithUserId = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name = 'user_id' OR column_name = 'userid'
        `);
        console.log('Tables with user_id:', tablesWithUserId.rows.map(r => `${r.table_name}.${r.column_name}`));

        // Check properties of user to find handle
        let handle = user.email; // Default to email
        
        console.log('Checking user_profiles...');
        const userProfile = await client.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]);
        if (userProfile.rows.length > 0) {
            console.log('User Profile:', userProfile.rows[0]);
            // Assume handle is in profile? Or username?
            // Let's check columns of user_profiles to be sure
             const profileCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'`);
             console.log('user_profiles columns:', profileCols.rows.map(r => r.column_name));
             
             // If there is a handle/username column use it
             // For now, let's just proceed with email and see
        } else {
            console.log('No user profile found.');
        }

        // Check todolist_by_userhandle with correct column 'userhandle'
        console.log(`Checking todolist_by_userhandle for handle: ${handle}`);
        const todoList = await client.query(`SELECT * FROM todolist_by_userhandle WHERE userhandle = $1`, [handle]);
        console.log(`Found ${todoList.rows.length} entries in todolist_by_userhandle.`);
        
        if (todoList.rows.length > 0) {
             const taskIds = todoList.rows.map(r => r.todo_id); // Assuming todo_id maps to tasks.id
             console.log('Task IDs:', taskIds);
             
             // Query tasks table
             const tasks = await client.query(`SELECT * FROM tasks WHERE id = ANY($1::int[])`, [taskIds]);
             console.log(`Found ${tasks.rows.length} tasks matching IDs.`);
             console.table(tasks.rows);
        } else {
             // Maybe handle is something else?
             // Try querying todolist_by_userhandle to see unique handles
             const handles = await client.query('SELECT DISTINCT userhandle FROM todolist_by_userhandle LIMIT 10');
             console.log('Sample handles in todolist_by_userhandle:', handles.rows.map(r => r.userhandle));
        }

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
