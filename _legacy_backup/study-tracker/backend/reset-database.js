const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Dropping all tables...');
        
        await client.query('DROP TABLE IF EXISTS revision_items CASCADE');
        await client.query('DROP TABLE IF EXISTS study_sessions CASCADE');
        await client.query('DROP TABLE IF EXISTS topics CASCADE');
        await client.query('DROP TABLE IF EXISTS user_settings CASCADE');
        await client.query('DROP TABLE IF EXISTS subjects CASCADE');
        
        console.log('✅ All tables dropped');
        console.log('🔨 Creating new tables with multi-subject support...');
        
        // Subjects table
        await client.query(`
            CREATE TABLE subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(50) DEFAULT '#3b82f6',
                icon VARCHAR(50) DEFAULT '📚',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Topics table
        await client.query(`
            CREATE TABLE topics (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Study sessions table
        await client.query(`
            CREATE TABLE study_sessions (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                day VARCHAR(20) NOT NULL,
                activity TEXT NOT NULL,
                time_spent INTEGER,
                topics_covered TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Revision items table
        await client.query(`
            CREATE TABLE revision_items (
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
            CREATE TABLE user_settings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) DEFAULT 'default',
                active_subject_id INTEGER REFERENCES subjects(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ All tables created successfully');
        console.log('📊 Database is ready for multi-subject tracking!');
        
    } catch (err) {
        console.error('❌ Error resetting database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
