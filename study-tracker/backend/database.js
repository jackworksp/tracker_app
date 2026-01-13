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

                -- Migration: Add type and url columns
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='study_sessions' AND column_name='type'
                ) THEN 
                    ALTER TABLE study_sessions ADD COLUMN type VARCHAR(20) DEFAULT 'STUDY';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='study_sessions' AND column_name='url'
                ) THEN 
                    ALTER TABLE study_sessions ADD COLUMN url TEXT;
                END IF;

                -- Migration: Allow NULL subject_id for orphan sessions
                ALTER TABLE study_sessions ALTER COLUMN subject_id DROP NOT NULL;
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

        // Tasks table
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                type VARCHAR(20) DEFAULT 'TASK',
                title VARCHAR(255) NOT NULL,
                url TEXT,
                content TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Allow NULL subject_id for orphan tasks
        await client.query(`
            ALTER TABLE tasks ALTER COLUMN subject_id DROP NOT NULL;
        `);

        // Migration: Add tags and rating columns to tasks
        await client.query(`
            DO $$ 
            BEGIN 
                -- Add tags column (Array of text)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='tags'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
                END IF;

                -- Add rating column (Integer 1-5)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='rating'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN rating INTEGER;
                END IF;

                -- Add reminder columns
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='reminder_time'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN reminder_time TIMESTAMP;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='alert_type'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN alert_type VARCHAR(20) DEFAULT 'basic';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='reminder_snoozed_until'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN reminder_snoozed_until TIMESTAMP;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='tasks' AND column_name='reminder_dismissed'
                ) THEN 
                    ALTER TABLE tasks ADD COLUMN reminder_dismissed BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);

        // Create index for efficient reminder queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_reminder_time 
            ON tasks(reminder_time) 
            WHERE reminder_dismissed = FALSE;
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
