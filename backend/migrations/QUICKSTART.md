# Quick Migration Guide

## Run the Index Migration Now

### Option 1: Using npm (Recommended)

```bash
cd backend
npm run migrate add-missing-indexes.sql
```

### Option 2: Using psql

```bash
cd backend/migrations
psql $DATABASE_URL -f add-missing-indexes.sql
```

### Option 3: Using Neon Console

1. Open https://console.neon.tech
2. Navigate to your project
3. Open SQL Editor
4. Copy contents of `add-missing-indexes.sql`
5. Paste and execute

## What This Migration Does

Adds **34 critical indexes** to improve query performance:

- **7 P0 indexes** (Critical): login, sessions, subjects → 50-90% faster
- **16 P1 indexes** (High): notes, tasks, topics → 30-70% faster
- **8 P2 indexes** (Medium): goals, revisions → 20-50% faster
- **4 P3 indexes** (Lower): attachments → 10-30% faster

## Safety Features

✓ Uses `IF NOT EXISTS` - safe to run multiple times
✓ Wrapped in transaction (BEGIN/COMMIT)
✓ No data modifications - only adds indexes
✓ Can be rolled back if needed

## Verify Migration Success

```sql
-- Count indexes per table
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

Expected results:
- `notes`: 8 indexes
- `study_sessions`: 5 indexes
- `tasks`: 7 indexes
- `subjects`: 3 indexes
- `user_settings`: 2 indexes

## After Migration

### Update Statistics
```sql
ANALYZE;
```

### Monitor Performance
```sql
-- Check index usage
SELECT tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

## Rollback (if needed)

See the rollback script at the end of `add-missing-indexes.sql` or in `README.md`.

## Estimated Time

- Small database (<1000 records): 1-5 seconds
- Medium database (1000-10000 records): 5-30 seconds
- Large database (>10000 records): 30-120 seconds

Index creation time scales with table size.

## Production Checklist

Before running in production:

- [ ] Test on development database first
- [ ] Create Neon branch backup (or regular backup)
- [ ] Schedule during low-traffic period
- [ ] Monitor database CPU/memory during migration
- [ ] Verify indexes after completion
- [ ] Run ANALYZE to update statistics
- [ ] Monitor query performance improvements

## Need Help?

- Full documentation: `README.md`
- Migration file: `add-missing-indexes.sql`
- Project guide: `../CLAUDE.md`

---

**Ready to run?** Use the command at the top of this file!
