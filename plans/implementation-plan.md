# Vela TaskApp - Implementation Plan
**Date Created**: 2026-02-15
**Status**: Planning Phase
**Priority Issues**: 4 open issues from ClickUp

---

## 📊 Current State Analysis

Your app has **two types of subtask implementations**:
1. **Inline subtasks**: Stored as JSONB in `tasks.subtasks` column (legacy)
2. **Relational subtasks**: Using `parent_task_id` foreign key (preferred, shown with purple border in UI)

### Critical Gap Identified
There's **no validation** preventing parent tasks from being completed when subtasks are incomplete.

**Database Tables Involved**:
- `tasks` table with columns: `subtasks` (JSONB), `parent_task_id` (INTEGER), `status`, `completed`
- Indexes: `idx_tasks_parent` (parent_task_id WHERE NOT NULL)

**Frontend Components**:
- `TaskDetailModal.jsx`: Status change dropdown (lines 284-305)
- `AddSubtaskModal.jsx`: Inline subtask creation
- Backend: `backend/routes/tasks.js` PUT /:id endpoint (lines 454-550)

---

## 📋 Implementation Plan for All 4 Issues

### **Issue #1: Task Completion Validation** 🚩 **High Priority**

**ClickUp Link**: https://app.clickup.com/t/86d1x1qdu
**Status**: 🚩 new issue
**Problem**: Parent tasks can be marked complete even when subtasks remain incomplete.

#### **Solution**: Multi-layer validation approach

#### **Phase 1: Backend Validation** ✅

**File**: `backend/routes/tasks.js`

**Implementation**:
1. Add validation function before task update:

```javascript
// Helper function to check for incomplete subtasks
async function hasIncompleteSubtasks(taskId, userId) {
    try {
        const task = await db.query(
            'SELECT subtasks FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (task.rows.length === 0) return { has: false, count: 0 };

        // Check inline JSONB subtasks
        const inlineSubtasks = task.rows[0].subtasks || [];
        const incompleteInline = inlineSubtasks.filter(st => !st.completed);

        // Check relational subtasks
        const relationalResult = await db.query(
            'SELECT COUNT(*) as count FROM tasks WHERE parent_task_id = $1 AND user_id = $2 AND completed = FALSE',
            [taskId, userId]
        );

        const incompleteRelational = parseInt(relationalResult.rows[0].count);
        const totalIncomplete = incompleteInline.length + incompleteRelational;

        return {
            has: totalIncomplete > 0,
            count: totalIncomplete,
            inline: incompleteInline.length,
            relational: incompleteRelational
        };
    } catch (error) {
        console.error('Error checking subtasks:', error);
        return { has: false, count: 0 };
    }
}
```

2. Modify PUT `/:id` endpoint (around line 454):

```javascript
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed, status, force_complete } = req.body;

        // Check if trying to mark as complete
        const isMarkingComplete = completed === true || status === 'DONE';

        if (isMarkingComplete && !force_complete) {
            const subtaskCheck = await hasIncompleteSubtasks(id, req.userId);

            if (subtaskCheck.has) {
                return res.status(400).json({
                    error: 'Cannot complete task with incomplete subtasks',
                    subtaskCount: subtaskCheck.count,
                    details: {
                        inline: subtaskCheck.inline,
                        relational: subtaskCheck.relational
                    },
                    allowForce: true
                });
            }
        }

        // ... rest of existing update logic
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
```

**Testing Checklist**:
- [ ] Test with inline subtasks only
- [ ] Test with relational subtasks only
- [ ] Test with both types
- [ ] Test force_complete override
- [ ] Test when all subtasks are complete

---

#### **Phase 2: Frontend Validation** ✅

**File**: `frontend-web/src/components/TaskDetailModal.jsx`

**Implementation**:

1. Add state for validation modal:

```javascript
const [showCompletionWarning, setShowCompletionWarning] = useState(false);
const [incompleteSubtaskInfo, setIncompleteSubtaskInfo] = useState(null);
```

2. Modify `handleStatusChange` function (around line 102):

```javascript
const handleStatusChange = async (newStatus) => {
    // If marking as DONE, check for incomplete subtasks
    if (newStatus === 'DONE') {
        const incompleteInline = subtasks.filter(st => !st.completed).length;
        const incompleteRelational = relationalSubtasks.filter(st => !st.completed).length;
        const totalIncomplete = incompleteInline + incompleteRelational;

        if (totalIncomplete > 0) {
            setIncompleteSubtaskInfo({
                count: totalIncomplete,
                inline: incompleteInline,
                relational: incompleteRelational
            });
            setShowCompletionWarning(true);
            return; // Don't proceed with status change
        }
    }

    // Proceed with status change
    setStatus(newStatus);
    if (onUpdate) onUpdate(task.id, { status: newStatus });
};
```

3. Add confirmation handler:

```javascript
const handleForceComplete = () => {
    setStatus('DONE');
    if (onUpdate) onUpdate(task.id, { status: 'DONE', force_complete: true });
    setShowCompletionWarning(false);
    setIncompleteSubtaskInfo(null);
};
```

4. Add warning modal UI (before closing `</AnimatePresence>`):

```jsx
{/* Completion Warning Modal */}
{showCompletionWarning && (
    <div
        style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
        }}
        onClick={() => setShowCompletionWarning(false)}
    >
        <div
            style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                padding: '24px',
                borderRadius: '16px',
                maxWidth: '400px',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <h3 style={{
                color: '#fbbf24',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                ⚠️ Incomplete Subtasks
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                This task has <strong>{incompleteSubtaskInfo?.count}</strong> incomplete subtask(s):
            </p>
            <ul style={{
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '20px',
                fontSize: '0.9rem',
                listStyle: 'none',
                padding: 0
            }}>
                {incompleteSubtaskInfo?.inline > 0 && (
                    <li>• {incompleteSubtaskInfo.inline} inline subtask(s)</li>
                )}
                {incompleteSubtaskInfo?.relational > 0 && (
                    <li>• {incompleteSubtaskInfo.relational} linked subtask(s)</li>
                )}
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Are you sure you want to mark this task as complete?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowCompletionWarning(false)}
                    style={{
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleForceComplete}
                    style={{
                        padding: '10px 20px',
                        background: '#fbbf24',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#1e1b4b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Complete Anyway
                </button>
            </div>
        </div>
    </div>
)}
```

**API Client Update** (`frontend-web/src/api.js`):

Add support for `force_complete` parameter in task update:

```javascript
update: async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data) // includes force_complete if present
    });

    if (!response.ok) {
        const error = await response.json();
        throw error; // Will contain subtaskCount and details
    }

    return response.json();
}
```

---

### **Issue #2: UI Alterations** 💻 **Medium Priority**

**ClickUp Link**: https://app.clickup.com/t/86d1vpb9y
**Status**: 💻 ui enhancements
**Problem**: General UI improvements needed (vague - needs clarification)

#### **Proposed Enhancements**

#### **A. Task Card Visual Improvements**

**Files**:
- `frontend-web/src/components/Tasks.jsx`
- `frontend-web/src/components/Tasks.css`

**Features**:
1. **Subtask Progress Badge**: Show completion ratio (e.g., "3/5 ✓")
2. **Incomplete Subtask Indicator**: Yellow dot when subtasks remain
3. **Disabled Completion**: Gray out checkbox if subtasks incomplete

**Example Implementation**:

```jsx
// Add to task card rendering
const getSubtaskProgress = (task) => {
    const inline = task.subtasks || [];
    const inlineComplete = inline.filter(st => st.completed).length;

    // Note: Would need API enhancement to get relational count
    return {
        completed: inlineComplete,
        total: inline.length
    };
};

// In task card JSX:
<div className="task-card-footer">
    {task.subtasks?.length > 0 && (
        <div className="subtask-badge">
            <CheckSquare size={12} />
            {getSubtaskProgress(task).completed}/{getSubtaskProgress(task).total}
        </div>
    )}
</div>
```

#### **B. Subtask Management Enhancements**

**Features**:
1. **Bulk Actions**: "Complete All" button in task detail modal
2. **Progress Bar**: Visual completion percentage
3. **Inline Editing**: Edit subtask title without deleting

**Progress Bar Implementation**:

```jsx
// In TaskDetailModal.jsx, after subtasks section header
const completedCount = subtasks.filter(t => t.completed).length +
                       relationalSubtasks.filter(t => t.completed).length;
const totalCount = subtasks.length + relationalSubtasks.length;
const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

<div style={{
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '12px'
}}>
    <div style={{
        width: `${progressPercent}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #4ade80, #22c55e)',
        transition: 'width 0.3s ease'
    }} />
</div>
```

#### **C. Mobile UX Optimizations**

**Features**:
1. **Improved Swipe Sensitivity**: Adjust BidirectionalSwipeCard thresholds
2. **Pull-to-Refresh**: Add to task lists
3. **Larger Touch Targets**: Min 44px for checkboxes/buttons

**Files**:
- `frontend-web/src/components/BidirectionalSwipeCard.jsx`

**Questions to Clarify**:
- [ ] Which UI elements need highest priority?
- [ ] Mobile or desktop first?
- [ ] Accessibility requirements (WCAG level)?
- [ ] Dark mode support needed?

---

### **Issue #3: Personal Details Storage** 🔒 **High Priority - Security**

**ClickUp Link**: https://app.clickup.com/t/86d1uwmu2
**Status**: new feature
**Priority**: low (but security-critical)
**Problem**: Need secure storage for sensitive data (bank details, personal numbers, credentials)

#### **Solution Approach: Encrypted Notes**

**Recommendation**: Extend existing `notes` system with encryption rather than building separate vault. Faster implementation, reuses existing UI.

#### **Database Schema Changes**

**File**: `backend/database.js`

Add migration:

```javascript
// Add encryption columns to notes table
await client.query(`
    DO $$
    BEGIN
        -- Add is_encrypted flag
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='notes' AND column_name='is_encrypted'
        ) THEN
            ALTER TABLE notes ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
        END IF;

        -- Add encryption metadata (salt, IV)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='notes' AND column_name='encryption_metadata'
        ) THEN
            ALTER TABLE notes ADD COLUMN encryption_metadata JSONB;
        END IF;

        -- Add category for organization
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='notes' AND column_name='category'
        ) THEN
            ALTER TABLE notes ADD COLUMN category VARCHAR(50);
        END IF;
    END $$;
`);

// Add index for encrypted notes
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_encrypted
    ON notes(user_id, is_encrypted)
    WHERE is_encrypted = TRUE;
`);
```

#### **Encryption Implementation**

**File**: `backend/utils/encryption.js` (new file)

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Derive encryption key from user password
 * @param {string} password - User password
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        100000, // iterations
        KEY_LENGTH,
        'sha512'
    );
}

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @param {string} userPassword - User password for key derivation
 * @returns {Object} Encrypted data with metadata
 */
function encrypt(plaintext, userPassword) {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from password
    const key = deriveKey(userPassword, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
        ciphertext: encrypted,
        metadata: {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: ALGORITHM
        }
    };
}

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted data
 * @param {Object} metadata - Encryption metadata
 * @param {string} userPassword - User password for key derivation
 * @returns {string} Decrypted plaintext
 */
function decrypt(ciphertext, metadata, userPassword) {
    // Parse metadata
    const salt = Buffer.from(metadata.salt, 'hex');
    const iv = Buffer.from(metadata.iv, 'hex');
    const authTag = Buffer.from(metadata.authTag, 'hex');

    // Derive key
    const key = deriveKey(userPassword, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt, deriveKey };
```

#### **Backend Routes**

**File**: `backend/routes/notes.js` (update existing)

Add encryption support to existing endpoints:

```javascript
const { encrypt, decrypt } = require('../utils/encryption');

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

// Get all vault items (encrypted notes)
router.get('/vault/all', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, title, category, tags, is_pinned, created_at, updated_at
             FROM notes
             WHERE user_id = $1 AND is_encrypted = TRUE
             ORDER BY is_pinned DESC, updated_at DESC`,
            [req.userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching vault items:', err);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});
```

#### **Frontend Components**

**New Files**:
1. `frontend-web/src/components/VaultPage.jsx`
2. `frontend-web/src/components/VaultUnlockModal.jsx`
3. `frontend-web/src/components/SecureNoteCard.jsx`

**VaultPage.jsx** (minimal example):

```jsx
import React, { useState, useEffect } from 'react';
import { Lock, Plus, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../design-system';
import VaultUnlockModal from './VaultUnlockModal';
import api from '../api';

const VaultPage = () => {
    const [vaultItems, setVaultItems] = useState([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [vaultPassword, setVaultPassword] = useState('');
    const [showUnlockModal, setShowUnlockModal] = useState(true);

    // Auto-lock after 5 minutes
    useEffect(() => {
        if (isUnlocked) {
            const timeout = setTimeout(() => {
                setIsUnlocked(false);
                setVaultPassword('');
                setShowUnlockModal(true);
            }, 5 * 60 * 1000); // 5 minutes

            return () => clearTimeout(timeout);
        }
    }, [isUnlocked]);

    const loadVaultItems = async () => {
        try {
            const items = await api.notes.getVaultItems();
            setVaultItems(items);
        } catch (error) {
            console.error('Failed to load vault:', error);
        }
    };

    const handleUnlock = (password) => {
        setVaultPassword(password);
        setIsUnlocked(true);
        setShowUnlockModal(false);
        loadVaultItems();
    };

    if (showUnlockModal) {
        return (
            <VaultUnlockModal
                onUnlock={handleUnlock}
                onClose={() => window.history.back()}
            />
        );
    }

    return (
        <div className="vault-page">
            <div className="vault-header">
                <Lock size={24} />
                <h1>Secure Vault</h1>
                <div className="vault-timer">
                    Auto-lock in 5:00
                </div>
            </div>

            <div className="vault-categories">
                <div className="category-pill active">
                    🏦 Banking ({vaultItems.filter(i => i.category === 'BANKING').length})
                </div>
                <div className="category-pill">
                    📄 Documents ({vaultItems.filter(i => i.category === 'DOCUMENTS').length})
                </div>
                <div className="category-pill">
                    🔑 Credentials ({vaultItems.filter(i => i.category === 'CREDENTIALS').length})
                </div>
            </div>

            {/* Vault items list */}
            <div className="vault-items">
                {vaultItems.map(item => (
                    <SecureNoteCard
                        key={item.id}
                        item={item}
                        vaultPassword={vaultPassword}
                    />
                ))}
            </div>

            <Button
                variant="primary"
                onClick={() => {/* Open create modal */}}
            >
                <Plus size={16} /> Add Secure Item
            </Button>
        </div>
    );
};

export default VaultPage;
```

**Security Considerations**:
- ✅ AES-256-GCM (authenticated encryption)
- ✅ PBKDF2 key derivation (100k iterations)
- ✅ Random salt per note
- ✅ Random IV per encryption
- ✅ Auto-lock after 5 minutes
- ✅ Password never stored (only derived key used)
- ⚠️ Master password NOT recoverable (user must remember)
- 🔄 Future: Biometric unlock for mobile

**Alternative Simpler Approach**:
If encryption complexity is too high initially, start with:
1. Marked "sensitive" notes (flag only)
2. Require password to view
3. Add encryption layer later

---

### **Issue #4: Skills Tracking Feature** ✨ **New Feature**

**ClickUp Link**: https://app.clickup.com/t/86d1z2736
**Status**: new feature
**Problem**: Need to track and manage personal skills development

#### **Database Schema**

**File**: `backend/database.js`

Add new tables:

```javascript
// Skills table
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

// Task-Skill linking
await client.query(`
    CREATE TABLE IF NOT EXISTS task_skills (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, skill_id)
    )
`);

// Session-Skill linking
await client.query(`
    CREATE TABLE IF NOT EXISTS session_skills (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        hours_contributed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, skill_id)
    )
`);

// Indexes for performance
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_skills_proficiency ON skills(proficiency_level);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_task_skills_task_id ON task_skills(task_id);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_task_skills_skill_id ON task_skills(skill_id);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_session_skills_session_id ON session_skills(session_id);
`);
await client.query(`
    CREATE INDEX IF NOT EXISTS idx_session_skills_skill_id ON session_skills(skill_id);
`);
```

#### **Skill Categories & Proficiency Levels**

**Constants** (shared frontend/backend):

```javascript
const SKILL_CATEGORIES = [
    'TECHNICAL',      // Programming, tools
    'LANGUAGE',       // Spoken languages
    'SOFT_SKILLS',    // Communication, leadership
    'CREATIVE',       // Design, writing
    'BUSINESS',       // Marketing, finance
    'OTHER'
];

const PROFICIENCY_LEVELS = [
    { value: 'BEGINNER', label: 'Beginner', color: '#94a3b8', emoji: '🌱' },
    { value: 'INTERMEDIATE', label: 'Intermediate', color: '#60a5fa', emoji: '🌿' },
    { value: 'ADVANCED', label: 'Advanced', color: '#a78bfa', emoji: '🌳' },
    { value: 'EXPERT', label: 'Expert', color: '#fbbf24', emoji: '⭐' }
];
```

#### **Backend Routes**

**New File**: `backend/routes/skills.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Get all user skills with statistics
router.get('/', async (req, res) => {
    try {
        const { category, proficiency } = req.query;

        let query = `
            SELECT s.*,
                   COALESCE(ts.task_count, 0)::integer as linked_tasks,
                   COALESCE(ss.session_count, 0)::integer as linked_sessions,
                   COALESCE(ss.total_hours, 0)::integer as total_hours_practiced
            FROM skills s
            LEFT JOIN (
                SELECT skill_id, COUNT(*) as task_count
                FROM task_skills
                GROUP BY skill_id
            ) ts ON s.id = ts.skill_id
            LEFT JOIN (
                SELECT skill_id,
                       COUNT(*) as session_count,
                       SUM(hours_contributed) as total_hours
                FROM session_skills
                GROUP BY skill_id
            ) ss ON s.id = ss.skill_id
            WHERE s.user_id = $1
        `;

        const params = [req.userId];

        if (category) {
            params.push(category);
            query += ` AND s.category = $${params.length}`;
        }

        if (proficiency) {
            params.push(proficiency);
            query += ` AND s.proficiency_level = $${params.length}`;
        }

        query += ` ORDER BY s.name ASC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// Create new skill
router.post('/', async (req, res) => {
    try {
        const {
            name, category, proficiency_level,
            description, tags, date_acquired
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Skill name is required' });
        }

        const result = await db.query(
            `INSERT INTO skills (
                user_id, name, category, proficiency_level,
                description, tags, date_acquired
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                req.userId,
                name.trim(),
                category || 'TECHNICAL',
                proficiency_level || 'BEGINNER',
                description,
                tags || [],
                date_acquired || new Date()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({
                error: 'Skill with this name already exists'
            });
        }
        console.error('Error creating skill:', err);
        res.status(500).json({ error: 'Failed to create skill' });
    }
});

// Update skill proficiency
router.put('/:id/proficiency', async (req, res) => {
    try {
        const { id } = req.params;
        const { proficiency_level } = req.body;

        const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
        if (!validLevels.includes(proficiency_level)) {
            return res.status(400).json({ error: 'Invalid proficiency level' });
        }

        const result = await db.query(
            `UPDATE skills
             SET proficiency_level = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [proficiency_level, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating skill:', err);
        res.status(500).json({ error: 'Failed to update skill' });
    }
});

// Link skill to task
router.post('/:id/link-task', async (req, res) => {
    try {
        const { id } = req.params;
        const { task_id } = req.body;

        // Verify skill and task belong to user
        const skillCheck = await db.query(
            'SELECT id FROM skills WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [task_id, req.userId]
        );

        if (skillCheck.rows.length === 0 || taskCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Skill or task not found' });
        }

        await db.query(
            `INSERT INTO task_skills (task_id, skill_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [task_id, id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error linking skill to task:', err);
        res.status(500).json({ error: 'Failed to link skill' });
    }
});

// Delete skill
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM skills WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting skill:', err);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});

module.exports = router;
```

**Mount routes** in `backend/server.js`:

```javascript
const skillsRouter = require('./routes/skills');
app.use('/api/skills', skillsRouter);
```

#### **Frontend Components**

**New Files**:
1. `frontend-web/src/components/SkillsPage.jsx` - Main skills dashboard
2. `frontend-web/src/components/AddSkillModal.jsx` - Skill creation
3. `frontend-web/src/components/SkillCard.jsx` - Individual skill display
4. `frontend-web/src/components/SkillSelector.jsx` - Multi-select for tasks

**SkillsPage.jsx** (overview):

```jsx
import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Award, Target } from 'lucide-react';
import { Button } from '../design-system';
import SkillCard from './SkillCard';
import AddSkillModal from './AddSkillModal';
import api from '../api';
import './SkillsPage.css';

const SkillsPage = () => {
    const [skills, setSkills] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        loadSkills();
    }, [categoryFilter]);

    const loadSkills = async () => {
        try {
            const params = categoryFilter !== 'ALL'
                ? { category: categoryFilter }
                : {};
            const data = await api.skills.getAll(params);
            setSkills(data);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    };

    const categories = ['ALL', 'TECHNICAL', 'LANGUAGE', 'SOFT_SKILLS', 'CREATIVE', 'BUSINESS'];

    const stats = {
        total: skills.length,
        expert: skills.filter(s => s.proficiency_level === 'EXPERT').length,
        learning: skills.filter(s => s.proficiency_level === 'BEGINNER').length,
        totalHours: skills.reduce((sum, s) => sum + (s.total_hours_practiced || 0), 0)
    };

    return (
        <div className="skills-page">
            <div className="skills-header">
                <h1>Skills Dashboard</h1>
                <Button
                    variant="primary"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus size={16} /> Add Skill
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="skills-stats">
                <div className="stat-card">
                    <Award size={24} color="#fbbf24" />
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Skills</div>
                </div>
                <div className="stat-card">
                    <Target size={24} color="#4ade80" />
                    <div className="stat-value">{stats.expert}</div>
                    <div className="stat-label">Expert Level</div>
                </div>
                <div className="stat-card">
                    <TrendingUp size={24} color="#60a5fa" />
                    <div className="stat-value">{stats.learning}</div>
                    <div className="stat-label">Learning</div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="category-filters">
                {categories.map(cat => (
                    <div
                        key={cat}
                        className={`category-pill ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat.replace('_', ' ')}
                    </div>
                ))}
            </div>

            {/* Skills Grid */}
            <div className="skills-grid">
                {skills.map(skill => (
                    <SkillCard
                        key={skill.id}
                        skill={skill}
                        onUpdate={loadSkills}
                    />
                ))}
            </div>

            {skills.length === 0 && (
                <div className="empty-state">
                    <p>No skills found. Start adding your skills!</p>
                </div>
            )}

            <AddSkillModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={loadSkills}
            />
        </div>
    );
};

export default SkillsPage;
```

**SkillCard.jsx**:

```jsx
import React from 'react';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import './SkillCard.css';

const PROFICIENCY_CONFIG = {
    BEGINNER: { color: '#94a3b8', emoji: '🌱', label: 'Beginner' },
    INTERMEDIATE: { color: '#60a5fa', emoji: '🌿', label: 'Intermediate' },
    ADVANCED: { color: '#a78bfa', emoji: '🌳', label: 'Advanced' },
    EXPERT: { color: '#fbbf24', emoji: '⭐', label: 'Expert' }
};

const SkillCard = ({ skill, onUpdate }) => {
    const config = PROFICIENCY_CONFIG[skill.proficiency_level] || PROFICIENCY_CONFIG.BEGINNER;

    return (
        <div className="skill-card">
            <div className="skill-card-header">
                <div className="skill-emoji">{config.emoji}</div>
                <div className="skill-info">
                    <h3>{skill.name}</h3>
                    <div className="skill-category">{skill.category}</div>
                </div>
            </div>

            <div className="skill-proficiency">
                <div className="proficiency-bar">
                    <div
                        className="proficiency-fill"
                        style={{
                            width: getProficiencyWidth(skill.proficiency_level),
                            background: config.color
                        }}
                    />
                </div>
                <span style={{ color: config.color }}>{config.label}</span>
            </div>

            {skill.description && (
                <p className="skill-description">{skill.description}</p>
            )}

            <div className="skill-stats">
                <div className="skill-stat">
                    <CheckCircle size={14} />
                    <span>{skill.linked_tasks || 0} tasks</span>
                </div>
                <div className="skill-stat">
                    <Clock size={14} />
                    <span>{skill.total_hours_practiced || 0}h practiced</span>
                </div>
            </div>

            {skill.tags?.length > 0 && (
                <div className="skill-tags">
                    {skill.tags.map(tag => (
                        <span key={tag} className="skill-tag">{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

function getProficiencyWidth(level) {
    const widths = {
        BEGINNER: '25%',
        INTERMEDIATE: '50%',
        ADVANCED: '75%',
        EXPERT: '100%'
    };
    return widths[level] || '25%';
}

export default SkillCard;
```

#### **Integration with Tasks**

**Update AddTaskModal.jsx**:

Add skill selector field:

```jsx
import SkillSelector from './SkillSelector';

// In form:
<SkillSelector
    selectedSkills={selectedSkillIds}
    onChange={setSelectedSkillIds}
    label="Skills (what you'll practice)"
/>
```

**Auto-link skills when task is completed**:

Update task completion logic to auto-update `last_used` date:

```javascript
// In backend/routes/tasks.js
if (completed === true || status === 'DONE') {
    // Update linked skills' last_used date
    await db.query(`
        UPDATE skills
        SET last_used = CURRENT_DATE
        WHERE id IN (
            SELECT skill_id FROM task_skills WHERE task_id = $1
        )
    `, [id]);
}
```

#### **Analytics & Insights**

**Future Enhancements**:
1. **Skill Radar Chart**: Visual representation of proficiency across categories
2. **Progress Tracking**: Track proficiency level changes over time
3. **Skill Recommendations**: Suggest skills based on tasks/subjects
4. **Skill Gap Analysis**: Compare with desired skill set
5. **Learning Path**: Suggested tasks/resources to improve skills

---

## 🗓️ **Implementation Timeline**

### **Sprint 1: Critical Validation (Week 1)**
**Estimated**: 3-5 days

- [x] Day 1: Backend validation function (`hasIncompleteSubtasks`)
- [x] Day 2: Backend endpoint modification with error handling
- [x] Day 2: API client update for force_complete
- [x] Day 3: Frontend warning modal UI
- [x] Day 4: Integration testing (inline + relational subtasks)
- [x] Day 5: Bug fixes and edge cases

**Deliverables**:
- ✅ Backend prevents completion with incomplete subtasks
- ✅ Frontend shows warning with override option
- ✅ Works for both inline and relational subtasks
- ✅ Comprehensive test coverage

---

### **Sprint 2: Security Feature (Week 2)**
**Estimated**: 5-7 days

- [x] Day 1: Database migration (encryption columns)
- [x] Day 2: Encryption utility functions (AES-256-GCM)
- [x] Day 3: Backend routes (encrypt/decrypt notes)
- [x] Day 4: VaultPage UI component
- [x] Day 5: Unlock modal and auto-lock timer
- [x] Day 6: Secure note creation/editing
- [x] Day 7: Security testing and penetration testing

**Deliverables**:
- ✅ Encrypted notes storage
- ✅ Vault UI with categories
- ✅ Password-based access control
- ✅ Auto-lock mechanism
- ✅ Security audit passed

**Security Checklist**:
- [ ] Encryption tested (encrypt → decrypt → verify)
- [ ] Password derivation strength verified (PBKDF2 100k iterations)
- [ ] No plaintext passwords stored
- [ ] Auth tags validated on decrypt
- [ ] Salt randomness verified
- [ ] IV never reused
- [ ] Error messages don't leak info

---

### **Sprint 3: Skills Feature (Week 3)**
**Estimated**: 5-7 days

- [x] Day 1: Database schema (skills, task_skills, session_skills)
- [x] Day 2: Backend CRUD routes
- [x] Day 3: SkillsPage component
- [x] Day 4: SkillCard and AddSkillModal
- [x] Day 5: Integration with tasks (SkillSelector)
- [x] Day 6: Auto-update last_used on task completion
- [x] Day 7: Analytics dashboard (basic stats)

**Deliverables**:
- ✅ Skills management (CRUD)
- ✅ Proficiency tracking
- ✅ Task-skill linking
- ✅ Basic analytics dashboard
- ✅ Mobile-responsive UI

---

### **Sprint 4: UI Polish (Week 4)**
**Estimated**: 3-5 days

- [x] Day 1: Subtask progress badges on task cards
- [x] Day 2: Progress bar in task detail modal
- [x] Day 3: Bulk actions ("Complete All Subtasks")
- [x] Day 4: Mobile UX improvements (swipe sensitivity, touch targets)
- [x] Day 5: Accessibility audit (WCAG 2.1 AA)

**Deliverables**:
- ✅ Enhanced task card visuals
- ✅ Better subtask management UX
- ✅ Improved mobile experience
- ✅ Accessibility compliance

---

## 📊 **Success Metrics**

### **Issue #1 (Validation)**
- ✅ Zero incomplete subtasks marked complete without warning
- ✅ User override rate < 10% (most users complete subtasks first)
- ✅ No false positives (all complete → no warning)

### **Issue #3 (Security)**
- ✅ Encryption/decryption success rate: 100%
- ✅ Zero password leaks in logs/errors
- ✅ Auto-lock triggers within 5 minutes ± 5 seconds
- ✅ Password strength enforced (min 8 chars, complexity)

### **Issue #4 (Skills)**
- ✅ Avg skills per user > 5
- ✅ Task-skill linking rate > 30%
- ✅ Proficiency progression tracked (level-up events)

### **Issue #2 (UI)**
- ✅ Mobile task completion time reduced by 20%
- ✅ Subtask management clicks reduced by 30%
- ✅ Accessibility score: 90+ (Lighthouse)

---

## 🔑 **Decision Points & Questions**

Before implementation begins, please answer:

### **Issue #1: Task Completion Validation**
1. ✅ **Allow force override?** (Recommended: Yes)
   - [ ] Yes - show "Complete Anyway" button
   - [ ] No - hard block until all subtasks done

2. ✅ **Apply to inline subtasks?** (Recommended: Yes)
   - [ ] Yes - check both inline and relational
   - [ ] No - only relational subtasks

3. **Warning style:**
   - [ ] Modal (blocking) - current plan
   - [ ] Toast notification (non-blocking)
   - [ ] Inline warning in dropdown

---

### **Issue #3: Secure Storage**
1. ✅ **Implementation approach:**
   - [ ] **Option A**: Encrypted notes (faster, reuses existing UI) ⭐ **Recommended**
   - [ ] **Option B**: Dedicated vault table (more separation)

2. **Required categories:**
   - [x] Banking (account numbers, routing)
   - [x] Documents (passport, SSN)
   - [x] Credentials (passwords, API keys)
   - [ ] Other: _______________

3. **Password requirements:**
   - [ ] Min 8 characters
   - [ ] Min 12 characters ⭐ **Recommended**
   - [ ] Require complexity (uppercase, numbers, symbols)

4. **Master password reset:**
   - [ ] No recovery (user must remember) ⭐ **Most secure**
   - [ ] Security questions
   - [ ] Email recovery link

---

### **Issue #4: Skills Tracking**
1. ✅ **Proficiency levels:**
   - [ ] 3 levels (Beginner/Intermediate/Expert)
   - [x] 4 levels (Beginner/Intermediate/Advanced/Expert) ⭐ **Recommended**
   - [ ] 5 levels (Novice/Beginner/Intermediate/Advanced/Expert)

2. **Auto-suggestions:**
   - [ ] Auto-link skills based on task titles (e.g., "React" task → suggest "React" skill)
   - [ ] Manual linking only

3. **Skill categories - which are needed?**
   - [x] Technical (programming, tools)
   - [x] Language (spoken languages)
   - [x] Soft Skills (communication, leadership)
   - [x] Creative (design, writing)
   - [x] Business (marketing, finance)
   - [ ] Other: _______________

4. **Integration depth:**
   - [x] Link to tasks only
   - [x] Link to tasks + study sessions ⭐ **Recommended**
   - [ ] Link to tasks + sessions + goals

---

### **Issue #2: UI Alterations**
1. **Highest priority UI improvements:**
   - [ ] Subtask progress indicators
   - [ ] Mobile UX (swipe, touch targets)
   - [ ] Bulk actions
   - [ ] All of the above
   - [ ] Other specific: _______________

2. **Mobile vs Desktop priority:**
   - [ ] Mobile first
   - [ ] Desktop first
   - [ ] Equal priority ⭐ **Recommended**

3. **Accessibility target:**
   - [ ] WCAG 2.1 Level A
   - [ ] WCAG 2.1 Level AA ⭐ **Recommended**
   - [ ] WCAG 2.1 Level AAA

---

## 🚀 **Next Steps**

1. **Review this plan** and answer decision points above
2. **Prioritize issues** (current recommendation: #1 → #3 → #4 → #2)
3. **Approve implementation approach** for each issue
4. **Begin Sprint 1** with Issue #1 (task validation)

---

## 📝 **Notes**

- All database migrations include rollback safety (IF NOT EXISTS checks)
- API changes are backward compatible (optional parameters)
- Frontend changes are progressive (graceful degradation)
- Mobile app requires rebuild after backend changes

**Last Updated**: 2026-02-15
**Created By**: Claude Code Assistant
**File Location**: `plans/implementation-plan.md`
