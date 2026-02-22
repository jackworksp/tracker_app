# Task 06: Vault Database Schema & Migration

**Issue**: #3 - Personal Details Storage (Secure Vault)
**ClickUp**: https://app.clickup.com/t/86d1uwmu2
**Priority**: 🔒 High (Security)
**Estimated Time**: 1 day
**Sprint**: Sprint 2 (Week 2)

---

## Objective
Add database columns to `notes` table to support encrypted note storage for sensitive personal information.

## Implementation Approach
Extend existing `notes` table with encryption support rather than creating separate vault table (faster, reuses UI).

## Implementation Steps

### 1. Create Migration Script
**File**: `backend/migrations/001_add_encryption_to_notes.sql` (new file)

```sql
-- Add encryption support to notes table
DO $$
BEGIN
    -- Add is_encrypted flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notes' AND column_name='is_encrypted'
    ) THEN
        ALTER TABLE notes ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add encryption metadata (salt, IV, authTag)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notes' AND column_name='encryption_metadata'
    ) THEN
        ALTER TABLE notes ADD COLUMN encryption_metadata JSONB;
    END IF;

    -- Add category for organization (BANKING, DOCUMENTS, CREDENTIALS, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notes' AND column_name='category'
    ) THEN
        ALTER TABLE notes ADD COLUMN category VARCHAR(50);
    END IF;

    -- Add is_pinned for important vault items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notes' AND column_name='is_pinned'
    ) THEN
        ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add partial index for encrypted notes (performance)
CREATE INDEX IF NOT EXISTS idx_notes_encrypted
ON notes(user_id, is_encrypted)
WHERE is_encrypted = TRUE;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_notes_category
ON notes(user_id, category)
WHERE category IS NOT NULL;

-- Add index for pinned items
CREATE INDEX IF NOT EXISTS idx_notes_pinned
ON notes(user_id, is_pinned)
WHERE is_pinned = TRUE;
```

### 2. Update Database Init Function
**File**: `backend/database.js`

Add migration execution to existing `initDB()` function:

```javascript
async function initDB() {
    const client = await pool.connect();
    try {
        // ... existing table creation code ...

        // Run encryption migration
        console.log('Adding encryption support to notes table...');
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='is_encrypted'
                ) THEN
                    ALTER TABLE notes ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='encryption_metadata'
                ) THEN
                    ALTER TABLE notes ADD COLUMN encryption_metadata JSONB;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='category'
                ) THEN
                    ALTER TABLE notes ADD COLUMN category VARCHAR(50);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='notes' AND column_name='is_pinned'
                ) THEN
                    ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);

        // Add indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_encrypted
            ON notes(user_id, is_encrypted)
            WHERE is_encrypted = TRUE;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_category
            ON notes(user_id, category)
            WHERE category IS NOT NULL;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_pinned
            ON notes(user_id, is_pinned)
            WHERE is_pinned = TRUE;
        `);

        console.log('✅ Encryption columns added successfully');

        client.release();
    } catch (err) {
        client.release();
        throw err;
    }
}
```

### 3. Define Vault Categories
**File**: `backend/constants.js` (new file)

```javascript
const VAULT_CATEGORIES = {
    BANKING: 'BANKING',           // Bank accounts, routing numbers
    DOCUMENTS: 'DOCUMENTS',       // Passport, SSN, ID numbers
    CREDENTIALS: 'CREDENTIALS',   // Passwords, API keys
    MEDICAL: 'MEDICAL',           // Health records, insurance
    LEGAL: 'LEGAL',               // Contracts, legal documents
    PERSONAL: 'PERSONAL',         // Other sensitive info
};

module.exports = { VAULT_CATEGORIES };
```

### 4. Verify Migration
**File**: `backend/migrations/verify-encryption.js` (new file)

Create verification script:

```javascript
const { pool } = require('../database');

async function verifyEncryptionColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'notes'
            AND column_name IN ('is_encrypted', 'encryption_metadata', 'category', 'is_pinned')
            ORDER BY column_name;
        `);

        console.log('Encryption columns in notes table:');
        console.table(result.rows);

        // Check indexes
        const indexes = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'notes'
            AND indexname LIKE '%encrypted%' OR indexname LIKE '%category%' OR indexname LIKE '%pinned%';
        `);

        console.log('\nEncryption-related indexes:');
        console.table(indexes.rows);

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyEncryptionColumns();
```

Run with:
```bash
node backend/migrations/verify-encryption.js
```

## Testing Checklist

- [ ] Migration runs without errors on fresh database
- [ ] Migration is idempotent (can run multiple times)
- [ ] Columns created with correct data types
- [ ] Indexes created successfully
- [ ] Existing notes data preserved (if any)
- [ ] No performance degradation on notes queries
- [ ] Verification script confirms schema changes

## Rollback Plan

If migration needs to be rolled back:

```sql
-- Remove encryption columns (WARNING: loses encrypted data)
ALTER TABLE notes DROP COLUMN IF EXISTS is_encrypted;
ALTER TABLE notes DROP COLUMN IF EXISTS encryption_metadata;
ALTER TABLE notes DROP COLUMN IF EXISTS category;
ALTER TABLE notes DROP COLUMN IF EXISTS is_pinned;

-- Remove indexes
DROP INDEX IF EXISTS idx_notes_encrypted;
DROP INDEX IF EXISTS idx_notes_category;
DROP INDEX IF EXISTS idx_notes_pinned;
```

## Success Criteria

✅ Migration adds all required columns
✅ Indexes created for performance
✅ Existing notes data intact
✅ Migration is idempotent
✅ Verification script passes
✅ No breaking changes to existing note functionality

## Files Created/Modified

**New Files:**
- `backend/migrations/001_add_encryption_to_notes.sql`
- `backend/migrations/verify-encryption.js`
- `backend/constants.js`

**Modified:**
- `backend/database.js` (add migration execution)

## Next Task

→ [Task 07: Vault Encryption Utilities](task-07-vault-encryption.md)
