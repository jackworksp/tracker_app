// Utility script to list all users from the user_settings table
require('dotenv').config();
const { loadConfig } = require('./aws-config');

const main = async () => {
    let db;

    try {
        // Ensure DATABASE_URL is available (from .env or AWS SSM)
        await loadConfig();

        // Load database module after config is ready
        db = require('./database');

        // Make sure tables exist before querying
        await db.initialize();

        const { rows } = await db.query(`
            SELECT 
                id,
                user_id,
                active_subject_id,
                created_at,
                updated_at
            FROM user_settings
            ORDER BY created_at DESC
        `);

        if (rows.length === 0) {
            console.log('No users found in user_settings.');
            return;
        }

        console.log(`Found ${rows.length} user${rows.length === 1 ? '' : 's'}:`);
        console.table(rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            active_subject_id: row.active_subject_id ?? 'N/A',
            created_at: row.created_at,
            updated_at: row.updated_at
        })));
    } catch (error) {
        console.error('Failed to list users:', error.message);
        process.exitCode = 1;
    } finally {
        if (db?.pool) {
            try {
                await db.pool.end();
            } catch (closeError) {
                console.error('Failed to close database pool:', closeError.message);
            }
        }
    }
};

main();
