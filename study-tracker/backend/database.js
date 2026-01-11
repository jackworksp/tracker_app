const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Connected to Neon PostgreSQL at:', res.rows[0].now);
    }
});

// Initialize database tables
const initDB = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Subjects table - NEW!
        await client.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(50) DEFAULT '#3b82f6',
                icon VARCHAR(50) DEFAULT '📚',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Topics table - now linked to subject
        await client.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Study sessions table - now linked to subject
        await client.query(`
            CREATE TABLE IF NOT EXISTS study_sessions (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                day VARCHAR(20) NOT NULL,
                activity TEXT NOT NULL,
                time_spent INTEGER,
                topics_covered TEXT,
                notes TEXT,
                revision_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add revision_count column if it doesn't exist (migration)
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='study_sessions' AND column_name='revision_count'
                ) THEN 
                    ALTER TABLE study_sessions ADD COLUMN revision_count INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);

        // Revision items table - now linked to subject
        await client.query(`
            CREATE TABLE IF NOT EXISTS revision_items (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                revision_count INTEGER DEFAULT 0,
                last_revised DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User settings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) DEFAULT 'default',
                active_subject_id INTEGER REFERENCES subjects(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default user if not exists
        const userExists = await client.query(
            'SELECT id FROM user_settings WHERE user_id = $1',
            ['default']
        );
        
        if (userExists.rows.length === 0) {
            await client.query(
                'INSERT INTO user_settings (user_id) VALUES ($1)',
                ['default']
            );
        }

        await client.query('COMMIT');
        console.log('✅ Database tables initialized successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error initializing database:', err);
    } finally {
        client.release();
    }
};

// Initialize database function
const initialize = async () => {
    await initDB();
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    initialize,
    pool // Export the raw pool if needed elsewhere
};
