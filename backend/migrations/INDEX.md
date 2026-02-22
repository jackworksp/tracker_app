# Migrations Directory Index

Quick navigation guide for all migration files and documentation.

## 📋 Start Here

**New to migrations?** → Start with [`QUICKSTART.md`](./QUICKSTART.md)

**Want full details?** → Read [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md)

**Ready to run?** → Use the commands below ⬇️

## 🚀 Quick Commands

```bash
# Verify current state (before migration)
npm run verify:indexes

# Run the migration
npm run migrate add-missing-indexes.sql

# Verify completion (after migration)
npm run verify:indexes
```

## 📁 File Reference

### Migration Files
| File | Size | Purpose |
|------|------|---------|
| [`add-missing-indexes.sql`](./add-missing-indexes.sql) | 25 KB | Main migration - adds 34 performance indexes |

### Scripts
| File | Purpose | Command |
|------|---------|---------|
| [`run-migration.js`](./run-migration.js) | Execute migrations with safety checks | `npm run migrate <file>` |
| [`verify-indexes.js`](./verify-indexes.js) | Verify indexes exist and show usage stats | `npm run verify:indexes` |

### Documentation
| File | Purpose | Best For |
|------|---------|----------|
| [`QUICKSTART.md`](./QUICKSTART.md) | Quick reference, minimal reading | Experienced developers |
| [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md) | Complete overview with performance data | Understanding the full scope |
| [`README.md`](./README.md) | Detailed guide with best practices | Learning migration patterns |
| [`INDEX.md`](./INDEX.md) | This file - navigation guide | Finding the right document |

## 📊 Migration Details

**Total Indexes**: 34
**Priority Levels**: 4 (P0, P1, P2, P3)
**Tables Affected**: 10
**Migration Time**: 1-120 seconds (depends on data size)
**Downtime**: None
**Reversible**: Yes

## 🎯 Use Cases

### "I want to run the migration now"
1. Read [`QUICKSTART.md`](./QUICKSTART.md)
2. Run `npm run migrate add-missing-indexes.sql`

### "I want to understand what this does"
1. Read [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md)
2. Review the SQL file: [`add-missing-indexes.sql`](./add-missing-indexes.sql)

### "I want to learn about migrations in general"
1. Read [`README.md`](./README.md)
2. Study the migration runner: [`run-migration.js`](./run-migration.js)

### "I want to check if indexes exist"
1. Run `npm run verify:indexes`
2. Check the output for missing indexes

### "I need to troubleshoot issues"
1. Check [`README.md`](./README.md) troubleshooting section
2. Run `npm run verify:indexes` for diagnostics
3. Review migration comments in [`add-missing-indexes.sql`](./add-missing-indexes.sql)

## 📈 Performance Impact

| Priority | Indexes | Expected Improvement |
|----------|---------|---------------------|
| P0 (Critical) | 7 | 50-90% faster |
| P1 (High) | 16 | 30-70% faster |
| P2 (Medium) | 8 | 20-50% faster |
| P3 (Lower) | 4 | 10-30% faster |

## 🔍 Index Breakdown by Table

| Table | Indexes | Priority |
|-------|---------|----------|
| notes | 7 | P1 |
| tasks | 6 | P1 |
| study_sessions | 4 | P0 |
| goals | 4 | P2 |
| attachments | 4 | P3 |
| revision_items | 3 | P2 |
| subjects | 2 | P0 |
| note_folders | 2 | P2 |
| topics | 2 | P1 |
| user_settings | 1 | P0 (UNIQUE) |

## ⚠️ Important Notes

### Before Running
- Backup your database or create a Neon branch
- Test on development environment first
- Review the SQL file for your specific needs

### After Running
- Run `ANALYZE` to update statistics
- Monitor query performance improvements
- Check index usage with `pg_stat_user_indexes`

### Safety
- ✅ Idempotent (safe to run multiple times)
- ✅ Transactional (all or nothing)
- ✅ Non-destructive (only adds indexes)
- ✅ Reversible (rollback script included)

## 🔗 Related Resources

- **Project Guide**: [`../CLAUDE.md`](../CLAUDE.md)
- **Database Schema**: [`../database.js`](../database.js)
- **Backend README**: [`../README.md`](../README.md)

## 📝 Package.json Scripts

Added to `backend/package.json`:

```json
{
  "scripts": {
    "migrate": "node migrations/run-migration.js",
    "verify:indexes": "node migrations/verify-indexes.js"
  }
}
```

## 🆘 Need Help?

1. **Quick answer**: Check [`QUICKSTART.md`](./QUICKSTART.md)
2. **Detailed guide**: Read [`README.md`](./README.md)
3. **Full context**: Review [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md)
4. **SQL details**: Open [`add-missing-indexes.sql`](./add-missing-indexes.sql)
5. **Troubleshooting**: Run `npm run verify:indexes`

## 📅 Migration History

| Date | Migration | Status | Notes |
|------|-----------|--------|-------|
| 2026-02-12 | add-missing-indexes.sql | Ready | 34 indexes, 4 priority levels |

---

**Last Updated**: 2026-02-12
**Maintained By**: Vela Development Team
