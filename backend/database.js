const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

        // User settings table (create first since other tables reference it)
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) DEFAULT 'default',
                active_subject_id INTEGER,
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

        // P0 Index: Unique index on user_id for fast user lookups and authentication
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)
        `);

        // Subjects table - NEW!
        await client.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(50) DEFAULT '#3b82f6',
                icon VARCHAR(50) DEFAULT 'BookOpen',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // P0 Indexes for subjects - Added after user_id migration below
        // These improve performance for listing user's subjects and sorting by creation date

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

        // P1 Indexes for topics - Improve lookups by subject and completion filtering
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_topics_subject_completed ON topics(subject_id, completed)
        `);

        // Note folders table
        await client.query(`
            CREATE TABLE IF NOT EXISTS note_folders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                parent_id INTEGER REFERENCES note_folders(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // P2 Indexes for note_folders - Improve hierarchical folder queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_folders_user_id ON note_folders(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_folders_parent_id ON note_folders(parent_id) WHERE parent_id IS NOT NULL
        `);

        // Attachment folders table (hierarchical organization for attachments)
        await client.query(`
            CREATE TABLE IF NOT EXISTS attachment_folders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                parent_id INTEGER REFERENCES attachment_folders(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for attachment_folders
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachment_folders_user_id ON attachment_folders(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachment_folders_parent_id ON attachment_folders(parent_id) WHERE parent_id IS NOT NULL
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

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='study_sessions' AND column_name='url_title'
                ) THEN
                    ALTER TABLE study_sessions ADD COLUMN url_title VARCHAR(500);
                END IF;

                -- Add folder_id column for attachment organization
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='study_sessions' AND column_name='folder_id'
                ) THEN
                    ALTER TABLE study_sessions ADD COLUMN folder_id INTEGER REFERENCES attachment_folders(id) ON DELETE SET NULL;
                END IF;

                -- Migration: Allow NULL subject_id for orphan sessions
                ALTER TABLE study_sessions ALTER COLUMN subject_id DROP NOT NULL;

                -- Add goal_id column to link sessions to goals
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='study_sessions' AND column_name='goal_id'
                ) THEN
                    ALTER TABLE study_sessions ADD COLUMN goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // P0 Indexes for study_sessions - Critical for timeline, calendar, and session queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id ON study_sessions(subject_id) WHERE subject_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_study_sessions_goal_id ON study_sessions(goal_id) WHERE goal_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date)
        `);
        // Composite index for efficient subject-based timeline queries sorted by date
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_date ON study_sessions(subject_id, date) WHERE subject_id IS NOT NULL
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

        // P2 Indexes for revision_items - Improve revision tracking and sorting
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_revision_items_subject_id ON revision_items(subject_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_revision_items_created_at ON revision_items(created_at)
        `);
        // Composite index for subject-based revision queries sorted by date
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_revision_items_subject_created ON revision_items(subject_id, created_at)
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

                -- Add goal_id column to link tasks to goals
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='goal_id'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL;
                END IF;

                -- Add attachment_url column for file attachments (Excel, PDF, etc.)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='attachment_url'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN attachment_url TEXT;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='attachment_url_title'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN attachment_url_title VARCHAR(500);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='url_title'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN url_title VARCHAR(500);
                END IF;

                -- Add folder_id column for attachment organization
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='folder_id'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN folder_id INTEGER REFERENCES attachment_folders(id) ON DELETE SET NULL;
                END IF;

                -- EXPLORATORY TASKS MIGRATION
                -- Add status column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='status'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN status VARCHAR(20) DEFAULT 'TODO';
                    -- Migrate existing completion status
                    UPDATE tasks SET status = 'DONE' WHERE completed = TRUE;
                    UPDATE tasks SET status = 'TODO' WHERE completed = FALSE;
                END IF;

                -- Add subtasks column (JSON)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='subtasks'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN subtasks JSONB DEFAULT '[]';
                END IF;

                -- Add resources column (JSON)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='resources'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN resources JSONB DEFAULT '[]';
                END IF;

                -- Add parent_task_id column for hierarchical tasks
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='parent_task_id'
                ) THEN
                    ALTER TABLE tasks
                    ADD COLUMN parent_task_id INTEGER
                    REFERENCES tasks(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        // Create index for efficient reminder queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_reminder_time
            ON tasks(reminder_time)
            WHERE reminder_dismissed = FALSE;
        `);

        // Create indexes for efficient attachment queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_attachments
            ON tasks(user_id, attachment_url)
            WHERE attachment_url IS NOT NULL;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_url
            ON tasks(user_id, url)
            WHERE url IS NOT NULL;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_folder_id
            ON tasks(folder_id)
            WHERE folder_id IS NOT NULL;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_sessions_url
            ON study_sessions(url)
            WHERE url IS NOT NULL;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_study_sessions_folder_id
            ON study_sessions(folder_id)
            WHERE folder_id IS NOT NULL;
        `);

        // Create index for efficient parent-child task queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_parent
            ON tasks(parent_task_id)
            WHERE parent_task_id IS NOT NULL;
        `);

        // Create composite index for user + top-level tasks
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_toplevel
            ON tasks(user_id, parent_task_id)
            WHERE parent_task_id IS NULL;
        `);

        // P1 Indexes for tasks - Improve task filtering, sorting, and goal-based queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id) WHERE goal_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id) WHERE subject_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)
        `);
        // Composite indexes for common task filtering patterns
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_subject_status ON tasks(subject_id, status) WHERE subject_id IS NOT NULL
        `);

        // Add active_subject_id foreign key after subjects table is created
        await client.query(`
            DO $$
            BEGIN
                -- Add foreign key constraint if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'user_settings_active_subject_id_fkey'
                    AND table_name = 'user_settings'
                ) THEN
                    ALTER TABLE user_settings
                    ADD CONSTRAINT user_settings_active_subject_id_fkey
                    FOREIGN KEY (active_subject_id) REFERENCES subjects(id);
                END IF;
                -- Add subject_id column to notes table to link notes to subjects
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='subject_id'
                ) THEN
                    ALTER TABLE notes ADD COLUMN subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Migration: Add authentication columns to user_settings
        await client.query(`
            DO $$
            BEGIN
                -- Add password_hash column for authentication
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='user_settings' AND column_name='password_hash'
                ) THEN
                    ALTER TABLE user_settings ADD COLUMN password_hash TEXT;
                END IF;

                -- Add name column for user profile
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='user_settings' AND column_name='name'
                ) THEN
                    ALTER TABLE user_settings ADD COLUMN name VARCHAR(255);
                END IF;

                -- Add profile_photo_url column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='user_settings' AND column_name='profile_photo_url'
                ) THEN
                    ALTER TABLE user_settings ADD COLUMN profile_photo_url TEXT;
                END IF;
            END $$;
        `);

        // Migration: Add user_id to subjects table
        await client.query(`
            DO $$
            DECLARE
                default_user_id INTEGER;
            BEGIN
                -- Get the default user's ID
                SELECT id INTO default_user_id FROM user_settings WHERE user_id = 'default' LIMIT 1;

                -- Add user_id column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='subjects' AND column_name='user_id'
                ) THEN
                    -- Add column as nullable first
                    ALTER TABLE subjects ADD COLUMN user_id INTEGER REFERENCES user_settings(id) ON DELETE CASCADE;

                    -- Set existing subjects to default user
                    IF default_user_id IS NOT NULL THEN
                        UPDATE subjects SET user_id = default_user_id WHERE user_id IS NULL;
                    END IF;
                END IF;

                -- Remove UNIQUE constraint from name if it exists (since names can be duplicated across users)
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'subjects_name_key'
                    AND table_name = 'subjects'
                ) THEN
                    ALTER TABLE subjects DROP CONSTRAINT subjects_name_key;
                END IF;

                -- Add composite unique constraint on (user_id, name) if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'subjects_user_id_name_key'
                    AND table_name = 'subjects'
                ) THEN
                    ALTER TABLE subjects ADD CONSTRAINT subjects_user_id_name_key UNIQUE (user_id, name);
                END IF;
            END $$;
        `);

        // P0 Indexes for subjects - Essential for listing and sorting user's subjects
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id)
        `);
        // Composite index for user's subjects sorted by creation date (most common query pattern)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_subjects_user_created ON subjects(user_id, created_at)
        `);

        // Migration: Add user_id to tasks table
        await client.query(`
            DO $$
            DECLARE
                default_user_id INTEGER;
            BEGIN
                -- Get the default user's ID
                SELECT id INTO default_user_id FROM user_settings WHERE user_id = 'default' LIMIT 1;

                -- Add user_id column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='user_id'
                ) THEN
                    -- Add column as nullable first
                    ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES user_settings(id) ON DELETE CASCADE;

                    -- Set existing tasks to default user
                    IF default_user_id IS NOT NULL THEN
                        UPDATE tasks SET user_id = default_user_id WHERE user_id IS NULL;
                    END IF;
                END IF;
            END $$;
        `);

        // Goals table
        await client.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(50) DEFAULT 'PERSONAL',
                status VARCHAR(50) DEFAULT 'PLANNING',
                target_date DATE,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Add target_hours column to goals
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='goals' AND column_name='target_hours'
                ) THEN
                    ALTER TABLE goals ADD COLUMN target_hours INTEGER DEFAULT 100;
                END IF;
            END $$;
        `);

        // P2 Indexes for goals - Improve goal listing, filtering, and sorting
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category)
        `);
        // Composite indexes for common goal filtering patterns
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_user_category ON goals(user_id, category)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals(user_id, created_at)
        `);

        // Routines table
        await client.query(`
            CREATE TABLE IF NOT EXISTS routines (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                frequency VARCHAR(20) DEFAULT 'DAILY',
                category VARCHAR(50) DEFAULT 'GENERAL',
                color VARCHAR(20) DEFAULT 'blue',
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_routines_user_active ON routines(user_id, active)
        `);

        // Routine completions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS routine_completions (
                id SERIAL PRIMARY KEY,
                routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(routine_id, completed_date)
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_routine_completions_routine ON routine_completions(routine_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions(user_id, completed_date)
        `);



        // Notes table
        await client.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                folder_id INTEGER REFERENCES note_folders(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                tags TEXT[] DEFAULT '{}',
                is_pinned BOOLEAN DEFAULT FALSE,
                color VARCHAR(50) DEFAULT '#ffffff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Add folder_id to existing notes table
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='folder_id'
                ) THEN
                    ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES note_folders(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // P1 Indexes for notes - Critical for notes page performance (masonry grid, search, filtering)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id) WHERE folder_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id) WHERE subject_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)
        `);
        // Composite index for common notes queries (user's pinned notes sorted by update time)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_user_pinned_updated ON notes(user_id, is_pinned, updated_at)
        `);
        // GIN index for fast tag-based searches
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags)
        `);

        // Standalone attachments table (files/links not tied to tasks or sessions)
        await client.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
                title VARCHAR(500) NOT NULL,
                url TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'link',
                platform VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Add folder_id to attachments table
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='attachments' AND column_name='folder_id'
                ) THEN
                    ALTER TABLE attachments ADD COLUMN folder_id INTEGER REFERENCES attachment_folders(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Create index for attachments folder_id
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_folder_id ON attachments(folder_id) WHERE folder_id IS NOT NULL
        `);

        // P3 Indexes for attachments - Improve attachment listing and filtering
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_subject_id ON attachments(subject_id) WHERE subject_id IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at)
        `);
        // Composite indexes for common attachment filtering patterns
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_user_created ON attachments(user_id, created_at)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attachments_subject_created ON attachments(subject_id, created_at) WHERE subject_id IS NOT NULL
        `);

        // Subscribed YouTube feed channels
        await client.query(`
            CREATE TABLE IF NOT EXISTS feeds_channels (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                channel_id VARCHAR(64) NOT NULL,
                channel_name VARCHAR(255),
                channel_thumbnail VARCHAR(512),
                added_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, channel_id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_feeds_channels_user_id ON feeds_channels(user_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_feeds_channels_added_at ON feeds_channels(added_at)
        `);

        // Cached feed videos merged from subscribed channels
        await client.query(`
            CREATE TABLE IF NOT EXISTS feeds_cache (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                channel_id VARCHAR(64) NOT NULL,
                video_id VARCHAR(64) NOT NULL,
                title TEXT,
                thumbnail VARCHAR(512),
                published_at TIMESTAMPTZ,
                video_url VARCHAR(512),
                UNIQUE(user_id, video_id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_feeds_cache_user_published ON feeds_cache(user_id, published_at DESC)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_feeds_cache_channel_id ON feeds_cache(channel_id)
        `);

        // RSS feeds: user-subscribed RSS/Atom feed sources
        await client.query(`
            CREATE TABLE IF NOT EXISTS rss_feeds (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                feed_url    TEXT NOT NULL,
                title       VARCHAR(255),
                site_url    TEXT,
                favicon_url TEXT,
                added_at    TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, feed_url)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rss_feeds_user_id ON rss_feeds(user_id)
        `);

        // RSS articles: cached articles from subscribed feeds
        await client.query(`
            CREATE TABLE IF NOT EXISTS rss_articles (
                id              SERIAL PRIMARY KEY,
                user_id         INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                feed_id         INTEGER NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
                article_guid    TEXT NOT NULL,
                title           TEXT,
                article_url     TEXT,
                summary         TEXT,
                published_at    TIMESTAMPTZ,
                is_read         BOOLEAN NOT NULL DEFAULT FALSE,
                UNIQUE(user_id, article_guid)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rss_articles_user_published ON rss_articles(user_id, published_at DESC)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rss_articles_feed_id ON rss_articles(feed_id)
        `);

        // Note-Task linking table (notes as attachments to tasks)
        await client.query(`
            CREATE TABLE IF NOT EXISTS note_tasks (
                id SERIAL PRIMARY KEY,
                note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(note_id, task_id)
            )
        `);

        // Create indexes for note_tasks join queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_tasks_task_id ON note_tasks(task_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_tasks_note_id ON note_tasks(note_id)
        `);

        // Note-Session linking table (notes as attachments to sessions)
        await client.query(`
            CREATE TABLE IF NOT EXISTS note_sessions (
                id SERIAL PRIMARY KEY,
                note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(note_id, session_id)
            )
        `);

        // Create indexes for note_sessions join queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_sessions_session_id ON note_sessions(session_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_note_sessions_note_id ON note_sessions(note_id)
        `);

        // Journal entries table for goal reflections
        await client.query(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
                mood VARCHAR(50),
                thoughts TEXT,
                link_sessions BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for journal entries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_journal_entries_goal_id ON journal_entries(goal_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date)
        `);

        // Journal-Session linking table (for linked study sessions)
        await client.query(`
            CREATE TABLE IF NOT EXISTS journal_sessions (
                id SERIAL PRIMARY KEY,
                journal_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
                session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(journal_id, session_id)
            )
        `);

        // Create indexes for journal_sessions join queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_journal_sessions_journal_id ON journal_sessions(journal_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_journal_sessions_session_id ON journal_sessions(session_id)
        `);

        // Migration: Add mcp_api_key to user_settings for MCP server authentication
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='user_settings' AND column_name='mcp_api_key'
                ) THEN
                    ALTER TABLE user_settings ADD COLUMN mcp_api_key VARCHAR(64) UNIQUE;
                END IF;
            END $$;
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_user_settings_mcp_api_key ON user_settings(mcp_api_key) WHERE mcp_api_key IS NOT NULL
        `);

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
