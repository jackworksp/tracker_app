# Database Migrations

This directory contains SQL migration files for the Vela application database.

## Overview

Migrations are used to apply schema changes, add indexes, and modify the database structure in a controlled, repeatable manner. All migration files are written in pure SQL and can be run manually or automated.

## Migration Files

### `add-missing-indexes.sql`

**Created**: 2026-02-12
**Purpose**: Add critical performance indexes identified through database analysis
**Status**: Ready to apply
**Indexes Added**: 34 total indexes across 8 tables

**Priority Breakdown**:
- **P0 (Critical)**: 7 indexes - user_settings, study_sessions, subjects
- **P1 (High)**: 16 indexes - notes, topics, tasks
- **P2 (Medium)**: 8 indexes - goals, revision_items, note_folders
- **P3 (Lower)**: 4 indexes - attachments

**Expected Impact**:
- 50-90% performance improvement on critical queries (login, session creation)
- 30-70% performance improvement on common queries (notes, tasks)
- 20-50% performance improvement on moderate queries (goals, revisions)
- 10-30% performance improvement on occasional queries (attachments)

## How to Run Migrations

### Option 1: Using psql (Recommended)

```bash
# From the backend/migrations directory
psql $DATABASE_URL -f add-missing-indexes.sql
```

### Option 2: Using node-postgres

```javascript
const fs = require('fs');
const path = require('path');
const pool = require('../database');

async function runMigration(filename) {
    const sql = fs.readFileSync(path.join(__dirname, filename), 'utf8');
    try {
        await pool.query(sql);
        console.log(`✓ Migration ${filename} completed successfully`);
    } catch (error) {
        console.error(`✗ Migration ${filename} failed:`, error);
        throw error;
    }
}

// Run migration
runMigration('add-missing-indexes.sql');
```

### Option 3: Copy-paste into Neon Console

1. Open the Neon Console SQL Editor
2. Select your database
3. Copy the entire contents of the migration file
4. Paste and execute

## Pre-Migration Checklist

Before running any migration:

- [ ] **Backup database** (or take a Neon branch snapshot)
- [ ] **Review SQL file** for correctness
- [ ] **Test on development** database first
- [ ] **Schedule during low-traffic** period (if in production)
- [ ] **Monitor database** performance during migration
- [ ] **Verify completion** using verification queries

## Post-Migration Verification

After running `add-missing-indexes.sql`, verify all indexes were created:

```sql
-- Check all indexes on tables
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Count indexes per table
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC;
```

Expected index counts after migration:
- `notes`: 8 indexes (including GIN on tags)
- `study_sessions`: 5 indexes
- `tasks`: 7 indexes
- `subjects`: 3 indexes
- `goals`: 5 indexes
- `revision_items`: 4 indexes
- `note_folders`: 3 indexes
- `attachments`: 5 indexes
- `user_settings`: 2 indexes (including unique on user_id)
- `topics`: 3 indexes

## Performance Monitoring

Monitor index usage after migration:

```sql
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Identify unused indexes (after sufficient time)
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
ORDER BY tablename, indexname;
```

## Rollback Procedures

If you need to rollback the `add-missing-indexes.sql` migration:

```sql
-- Rollback script (drop all indexes created by migration)
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_study_sessions_subject_id;
DROP INDEX IF EXISTS idx_study_sessions_goal_id;
DROP INDEX IF EXISTS idx_study_sessions_date;
DROP INDEX IF EXISTS idx_study_sessions_subject_date;
DROP INDEX IF EXISTS idx_subjects_user_id;
DROP INDEX IF EXISTS idx_subjects_user_created;
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_folder_id;
DROP INDEX IF EXISTS idx_notes_subject_id;
DROP INDEX IF EXISTS idx_notes_is_pinned;
DROP INDEX IF EXISTS idx_notes_updated_at;
DROP INDEX IF EXISTS idx_notes_user_pinned_updated;
DROP INDEX IF EXISTS idx_notes_tags_gin;
DROP INDEX IF EXISTS idx_topics_subject_id;
DROP INDEX IF EXISTS idx_topics_subject_completed;
DROP INDEX IF EXISTS idx_tasks_goal_id;
DROP INDEX IF EXISTS idx_tasks_subject_id;
DROP INDEX IF EXISTS idx_tasks_user_status;
DROP INDEX IF EXISTS idx_tasks_user_completed;
DROP INDEX IF EXISTS idx_tasks_created_at;
DROP INDEX IF EXISTS idx_tasks_subject_user;
DROP INDEX IF EXISTS idx_goals_user_id;
DROP INDEX IF EXISTS idx_goals_user_created;
DROP INDEX IF EXISTS idx_goals_status;
DROP INDEX IF EXISTS idx_goals_category;
DROP INDEX IF EXISTS idx_revision_items_subject_id;
DROP INDEX IF EXISTS idx_revision_items_created_at_desc;
DROP INDEX IF EXISTS idx_revision_items_subject_created;
DROP INDEX IF EXISTS idx_note_folders_user_id;
DROP INDEX IF EXISTS idx_note_folders_parent_id;
DROP INDEX IF EXISTS idx_attachments_user_id;
DROP INDEX IF EXISTS idx_attachments_subject_id;
DROP INDEX IF EXISTS idx_attachments_created_at_desc;
DROP INDEX IF EXISTS idx_attachments_user_created;
```

## Best Practices

1. **Always use transactions** (BEGIN/COMMIT) for complex migrations
2. **Use IF NOT EXISTS** to make migrations idempotent
3. **Add detailed comments** explaining each change
4. **Test thoroughly** on development before production
5. **Monitor performance** before and after migration
6. **Document rollback** procedures for each migration
7. **Version control** all migration files in git
8. **Schedule carefully** - some index creations may lock tables

## Migration Naming Convention

Format: `{action}-{description}.sql`

Examples:
- `add-missing-indexes.sql`
- `create-notifications-table.sql`
- `alter-tasks-add-priority.sql`
- `drop-unused-columns.sql`

## Index Maintenance

After adding indexes, PostgreSQL automatically maintains them. However, consider:

### Update Statistics
```sql
-- Update statistics after migration
ANALYZE;

-- Update statistics for specific table
ANALYZE notes;
```

### Monitor Index Bloat
```sql
-- Check index size and potential bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Rebuild Indexes (if needed)
```sql
-- Rebuild specific index
REINDEX INDEX idx_notes_tags_gin;

-- Rebuild all indexes on a table
REINDEX TABLE notes;
```

## Neon-Specific Considerations

When using Neon PostgreSQL:

1. **Branching**: Create a branch before running migrations in production
2. **Autoscaling**: Indexes may affect compute scaling behavior
3. **Storage**: Monitor storage usage after adding indexes
4. **Billing**: More indexes = more storage = potential cost increase

## Resources

- [PostgreSQL Indexes Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Neon Branching](https://neon.tech/docs/introduction/branching)
- [Index Types in PostgreSQL](https://www.postgresql.org/docs/current/indexes-types.html)
- [GIN Indexes for Arrays](https://www.postgresql.org/docs/current/gin-intro.html)

## Support

If you encounter issues:

1. Check PostgreSQL logs for errors
2. Verify database connection and permissions
3. Review migration SQL for syntax errors
4. Consult Neon console for additional diagnostics
5. Reference project CLAUDE.md for architecture details

---

**Last Updated**: 2026-02-12
**Maintained By**: Vela Development Team
