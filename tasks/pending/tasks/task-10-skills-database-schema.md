# Task 10: Skills Tracking Database Schema

**Issue**: #4 - Skills Tracking Feature
**ClickUp**: https://app.clickup.com/t/86d1z2736
**Priority**: ✨ Medium (New Feature)
**Estimated Time**: 1 day
**Sprint**: Sprint 3 (Week 3)

---

## Objective
Create database tables for tracking personal skills, proficiency levels, and linking skills to tasks and study sessions.

## Database Tables

### 1. `skills` - Core skills table
### 2. `task_skills` - Link skills to tasks
### 3. `session_skills` - Link skills to study sessions

## Implementation Steps

### 1. Create Migration Script
**File**: `backend/migrations/002_create_skills_tables.sql` (new file)

```sql
-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'TECHNICAL',
    proficiency_level VARCHAR(20) DEFAULT 'BEGINNER',
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    date_acquired DATE,
    last_used DATE,
    hours_practiced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT skills_user_name_unique UNIQUE(user_id, name)
);

-- Task-Skill linking table
CREATE TABLE IF NOT EXISTS task_skills (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, skill_id)
);

-- Session-Skill linking table
CREATE TABLE IF NOT EXISTS session_skills (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    hours_contributed DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, skill_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(user_id, category);
CREATE INDEX IF NOT EXISTS idx_skills_proficiency ON skills(user_id, proficiency_level);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(user_id, name);

CREATE INDEX IF NOT EXISTS idx_task_skills_task_id ON task_skills(task_id);
CREATE INDEX IF NOT EXISTS idx_task_skills_skill_id ON task_skills(skill_id);

CREATE INDEX IF NOT EXISTS idx_session_skills_session_id ON session_skills(session_id);
CREATE INDEX IF NOT EXISTS idx_session_skills_skill_id ON session_skills(skill_id);

-- Partial index for recently used skills
CREATE INDEX IF NOT EXISTS idx_skills_recent
ON skills(user_id, last_used DESC)
WHERE last_used IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE skills IS 'Tracks user skills with proficiency levels';
COMMENT ON COLUMN skills.category IS 'TECHNICAL, LANGUAGE, SOFT_SKILLS, CREATIVE, BUSINESS, OTHER';
COMMENT ON COLUMN skills.proficiency_level IS 'BEGINNER, INTERMEDIATE, ADVANCED, EXPERT';
COMMENT ON TABLE task_skills IS 'Links skills to tasks for tracking skill practice';
COMMENT ON TABLE session_skills IS 'Links skills to study sessions with time tracking';
```

### 2. Add to Database Init
**File**: `backend/database.js`

Add skills tables creation in `initDB()`:

```javascript
async function initDB() {
    const client = await pool.connect();
    try {
        // ... existing table creation ...

        // Create skills tables
        console.log('Creating skills tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS skills (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(50) DEFAULT 'TECHNICAL',
                proficiency_level VARCHAR(20) DEFAULT 'BEGINNER',
                description TEXT,
                tags TEXT[] DEFAULT '{}',
                date_acquired DATE,
                last_used DATE,
                hours_practiced INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT skills_user_name_unique UNIQUE(user_id, name)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS task_skills (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, skill_id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS session_skills (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
                skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                hours_contributed DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(session_id, skill_id)
            )
        `);

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(user_id, category)',
            'CREATE INDEX IF NOT EXISTS idx_skills_proficiency ON skills(user_id, proficiency_level)',
            'CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(user_id, name)',
            'CREATE INDEX IF NOT EXISTS idx_task_skills_task_id ON task_skills(task_id)',
            'CREATE INDEX IF NOT EXISTS idx_task_skills_skill_id ON task_skills(skill_id)',
            'CREATE INDEX IF NOT EXISTS idx_session_skills_session_id ON session_skills(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_session_skills_skill_id ON session_skills(skill_id)',
            'CREATE INDEX IF NOT EXISTS idx_skills_recent ON skills(user_id, last_used DESC) WHERE last_used IS NOT NULL'
        ];

        for (const indexSQL of indexes) {
            await client.query(indexSQL);
        }

        console.log('✅ Skills tables created successfully');

        client.release();
    } catch (err) {
        client.release();
        throw err;
    }
}
```

### 3. Define Skill Constants
**File**: `backend/constants.js` (update)

```javascript
const SKILL_CATEGORIES = {
    TECHNICAL: 'TECHNICAL',           // Programming, tools, software
    LANGUAGE: 'LANGUAGE',             // Spoken/written languages
    SOFT_SKILLS: 'SOFT_SKILLS',       // Communication, leadership
    CREATIVE: 'CREATIVE',             // Design, writing, art
    BUSINESS: 'BUSINESS',             // Marketing, finance, management
    OTHER: 'OTHER'                    // Miscellaneous
};

const PROFICIENCY_LEVELS = {
    BEGINNER: {
        value: 'BEGINNER',
        label: 'Beginner',
        color: '#94a3b8',
        emoji: '🌱',
        description: 'Just starting to learn'
    },
    INTERMEDIATE: {
        value: 'INTERMEDIATE',
        label: 'Intermediate',
        color: '#60a5fa',
        emoji: '🌿',
        description: 'Comfortable with basics'
    },
    ADVANCED: {
        value: 'ADVANCED',
        label: 'Advanced',
        color: '#a78bfa',
        emoji: '🌳',
        description: 'Deep knowledge and experience'
    },
    EXPERT: {
        value: 'EXPERT',
        label: 'Expert',
        color: '#fbbf24',
        emoji: '⭐',
        description: 'Mastery level'
    }
};

module.exports = {
    VAULT_CATEGORIES,
    SKILL_CATEGORIES,
    PROFICIENCY_LEVELS
};
```

### 4. Create Verification Script
**File**: `backend/migrations/verify-skills.js` (new file)

```javascript
const { pool } = require('../database');

async function verifySkillsTables() {
    try {
        console.log('Verifying skills tables...\n');

        // Check tables exist
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('skills', 'task_skills', 'session_skills')
            ORDER BY table_name;
        `);

        console.log('Tables:');
        console.table(tables.rows);

        // Check skills columns
        const skillsColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'skills'
            ORDER BY ordinal_position;
        `);

        console.log('\nSkills table columns:');
        console.table(skillsColumns.rows);

        // Check constraints
        const constraints = await pool.query(`
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name IN ('skills', 'task_skills', 'session_skills')
            ORDER BY tc.table_name, tc.constraint_type;
        `);

        console.log('\nConstraints:');
        console.table(constraints.rows);

        // Check indexes
        const indexes = await pool.query(`
            SELECT
                indexname,
                tablename,
                indexdef
            FROM pg_indexes
            WHERE tablename IN ('skills', 'task_skills', 'session_skills')
            ORDER BY tablename, indexname;
        `);

        console.log('\nIndexes:');
        console.table(indexes.rows);

        // Test insert and query
        console.log('\nTesting CRUD operations...');

        const testUserId = 1; // Assuming user exists

        const insertResult = await pool.query(
            `INSERT INTO skills (user_id, name, category, proficiency_level, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [testUserId, 'Test Skill', 'TECHNICAL', 'BEGINNER', 'Test skill for verification']
        );

        console.log('✅ Insert successful');

        const selectResult = await pool.query(
            'SELECT * FROM skills WHERE user_id = $1',
            [testUserId]
        );

        console.log('✅ Select successful:', selectResult.rowCount, 'rows');

        await pool.query('DELETE FROM skills WHERE name = $1', ['Test Skill']);
        console.log('✅ Delete successful');

        console.log('\n✅ All verifications passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

verifySkillsTables();
```

Run with:
```bash
node backend/migrations/verify-skills.js
```

## Testing Checklist

- [ ] Migration creates all tables without errors
- [ ] Unique constraint on (user_id, name) enforced
- [ ] Foreign keys set up correctly
- [ ] Cascading deletes work (delete user → deletes skills)
- [ ] All indexes created
- [ ] Proficiency level ENUM values accepted
- [ ] Category values accepted
- [ ] Date fields work correctly
- [ ] Default values applied

## Rollback Plan

```sql
-- WARNING: This will delete all skills data
DROP TABLE IF EXISTS session_skills CASCADE;
DROP TABLE IF EXISTS task_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
```

## Success Criteria

✅ All three tables created
✅ Foreign keys and constraints in place
✅ Indexes created for performance
✅ Unique constraint prevents duplicate skill names per user
✅ Verification script passes
✅ No breaking changes to existing tables

## Files Created/Modified

**New Files:**
- `backend/migrations/002_create_skills_tables.sql`
- `backend/migrations/verify-skills.js`

**Modified:**
- `backend/database.js` (add skills table creation)
- `backend/constants.js` (add skill constants)

## Next Task

→ [Task 11: Skills Backend Routes](task-11-skills-backend-routes.md)
