# Task 08: Vault Backend API Routes

**Issue**: #3 - Personal Details Storage (Secure Vault)
**ClickUp**: https://app.clickup.com/t/86d1uwmu2
**Priority**: 🔒 High (Security)
**Estimated Time**: 1-2 days
**Sprint**: Sprint 2 (Week 2)

---

## Objective
Implement backend API routes for creating, retrieving, and managing encrypted vault items (secure notes).

## Dependencies

- ✅ Task 06 completed (database schema)
- ✅ Task 07 completed (encryption utilities)

## Implementation Steps

### 1. Update Notes Routes
**File**: `backend/routes/notes.js`

Add encryption support to existing note endpoints:

```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt, validatePassword } = require('../utils/encryption');

router.use(authenticateToken);

// Create encrypted note
router.post('/', async (req, res) => {
    try {
        const {
            title, content, tags, folder_id, subject_id,
            is_encrypted, vault_password, category
        } = req.body;

        let finalContent = content;
        let encryptionMetadata = null;

        // Encrypt if requested
        if (is_encrypted) {
            if (!vault_password) {
                return res.status(400).json({
                    error: 'Vault password required for encrypted notes'
                });
            }

            // Validate password strength
            const validation = validatePassword(vault_password);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Weak password',
                    details: validation.errors
                });
            }

            const encrypted = encrypt(content, vault_password);
            finalContent = encrypted.ciphertext;
            encryptionMetadata = encrypted.metadata;
        }

        const result = await db.query(
            `INSERT INTO notes (
                user_id, folder_id, subject_id, title, content,
                tags, is_encrypted, encryption_metadata, category
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                req.userId,
                folder_id || null,
                subject_id || null,
                title,
                finalContent,
                tags || [],
                is_encrypted || false,
                encryptionMetadata ? JSON.stringify(encryptionMetadata) : null,
                category || null
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Get note with decryption
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { vault_password } = req.query;

        const result = await db.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = result.rows[0];

        // Decrypt if encrypted
        if (note.is_encrypted) {
            if (!vault_password) {
                // Return metadata only, no content
                return res.json({
                    ...note,
                    content: null,
                    requiresPassword: true
                });
            }

            try {
                note.content = decrypt(
                    note.content,
                    note.encryption_metadata,
                    vault_password
                );
            } catch (err) {
                return res.status(401).json({
                    error: 'Invalid vault password'
                });
            }
        }

        res.json(note);
    } catch (err) {
        console.error('Error fetching note:', err);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
});

// Update encrypted note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, content, tags, folder_id, subject_id,
            vault_password, category, is_pinned
        } = req.body;

        // Get existing note
        const existing = await db.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = existing.rows[0];
        let finalContent = content;
        let encryptionMetadata = note.encryption_metadata;

        // Re-encrypt if content changed
        if (note.is_encrypted && content && content !== note.content) {
            if (!vault_password) {
                return res.status(400).json({
                    error: 'Vault password required to update encrypted note'
                });
            }

            const encrypted = encrypt(content, vault_password);
            finalContent = encrypted.ciphertext;
            encryptionMetadata = encrypted.metadata;
        }

        const updates = [];
        const values = [id, req.userId];
        let paramCount = 2;

        if (title !== undefined) {
            updates.push(`title = $${++paramCount}`);
            values.push(title);
        }
        if (finalContent !== undefined) {
            updates.push(`content = $${++paramCount}`);
            values.push(finalContent);
        }
        if (encryptionMetadata !== note.encryption_metadata) {
            updates.push(`encryption_metadata = $${++paramCount}`);
            values.push(JSON.stringify(encryptionMetadata));
        }
        if (tags !== undefined) {
            updates.push(`tags = $${++paramCount}`);
            values.push(tags);
        }
        if (category !== undefined) {
            updates.push(`category = $${++paramCount}`);
            values.push(category);
        }
        if (is_pinned !== undefined) {
            updates.push(`is_pinned = $${++paramCount}`);
            values.push(is_pinned);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const result = await db.query(
            `UPDATE notes SET ${updates.join(', ')}
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            values
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating note:', err);
        res.status(500).json({ error: 'Failed to update note' });
    }
});
```

### 2. Add Vault-Specific Routes

```javascript
// Get all vault items (encrypted notes)
router.get('/vault/all', async (req, res) => {
    try {
        const { category } = req.query;

        let query = `
            SELECT id, title, category, tags, is_pinned, created_at, updated_at
            FROM notes
            WHERE user_id = $1 AND is_encrypted = TRUE
        `;
        const params = [req.userId];

        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }

        query += ` ORDER BY is_pinned DESC, updated_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching vault items:', err);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});

// Get vault statistics
router.get('/vault/stats', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                COUNT(*)::integer as total,
                COUNT(*) FILTER (WHERE category = 'BANKING')::integer as banking,
                COUNT(*) FILTER (WHERE category = 'DOCUMENTS')::integer as documents,
                COUNT(*) FILTER (WHERE category = 'CREDENTIALS')::integer as credentials,
                COUNT(*) FILTER (WHERE category = 'MEDICAL')::integer as medical,
                COUNT(*) FILTER (WHERE is_pinned = TRUE)::integer as pinned
             FROM notes
             WHERE user_id = $1 AND is_encrypted = TRUE`,
            [req.userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching vault stats:', err);
        res.status(500).json({ error: 'Failed to fetch vault statistics' });
    }
});

// Verify vault password (test decrypt)
router.post('/vault/verify-password', async (req, res) => {
    try {
        const { note_id, vault_password } = req.body;

        if (!note_id || !vault_password) {
            return res.status(400).json({
                error: 'Note ID and password required'
            });
        }

        const result = await db.query(
            'SELECT content, encryption_metadata FROM notes WHERE id = $1 AND user_id = $2 AND is_encrypted = TRUE',
            [note_id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Encrypted note not found' });
        }

        const note = result.rows[0];

        try {
            decrypt(note.content, note.encryption_metadata, vault_password);
            res.json({ valid: true });
        } catch (err) {
            res.status(401).json({ valid: false, error: 'Invalid password' });
        }
    } catch (err) {
        console.error('Error verifying password:', err);
        res.status(500).json({ error: 'Failed to verify password' });
    }
});

module.exports = router;
```

### 3. Update API Client
**File**: `frontend-web/src/api.js`

Add vault methods:

```javascript
const api = {
    // ... existing methods ...

    vault: {
        getAll: async (category = null) => {
            const token = localStorage.getItem('token');
            const url = category
                ? `${API_URL}/notes/vault/all?category=${category}`
                : `${API_URL}/notes/vault/all`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch vault items');
            return response.json();
        },

        getStats: async () => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/notes/vault/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch vault stats');
            return response.json();
        },

        createItem: async (data, vaultPassword) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    is_encrypted: true,
                    vault_password: vaultPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create vault item');
            }

            return response.json();
        },

        getItem: async (id, vaultPassword) => {
            const token = localStorage.getItem('token');
            const url = `${API_URL}/notes/${id}?vault_password=${encodeURIComponent(vaultPassword)}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch vault item');
            }

            return response.json();
        },

        verifyPassword: async (noteId, vaultPassword) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/notes/vault/verify-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    note_id: noteId,
                    vault_password: vaultPassword
                })
            });

            const result = await response.json();
            return result.valid;
        }
    }
};
```

## Testing Checklist

- [ ] Create encrypted note with valid password
- [ ] Reject creation with weak password
- [ ] Get encrypted note without password (content hidden)
- [ ] Get encrypted note with correct password (decrypted)
- [ ] Get encrypted note with wrong password (rejected)
- [ ] Update encrypted note requires password
- [ ] List vault items (metadata only, no content)
- [ ] Filter vault items by category
- [ ] Vault statistics calculation correct
- [ ] Password verification endpoint works
- [ ] Proper error messages (no sensitive data leaks)

## Security Checklist

- [ ] No plaintext passwords logged
- [ ] No encryption metadata exposed unnecessarily
- [ ] Authentication required on all routes
- [ ] User can only access their own vault items
- [ ] Error messages don't leak information
- [ ] Password validation enforced

## Success Criteria

✅ Create, read, update encrypted notes via API
✅ Password required for decryption
✅ Wrong password rejected
✅ Vault filtering and stats work
✅ No sensitive data leaks in errors
✅ All security checks pass

## Files Modified

- `backend/routes/notes.js`
- `frontend-web/src/api.js`

## Next Task

→ [Task 09: Vault Frontend Components](task-09-vault-frontend-components.md)
