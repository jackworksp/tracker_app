const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { upsertEmbedding } = require('../services/embeddings');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET all notes (with optional folder filtering)
// GET all notes (with optional folder and subject filtering)
router.get('/', async (req, res) => {
    try {
        const { folder_id, subject_id } = req.query;

        let query = 'SELECT * FROM notes WHERE user_id = $1';
        let params = [req.userId];
        let paramCount = 1;

        // Folder filtering
        if (folder_id === 'null' || folder_id === 'undefined') {
            query += ' AND folder_id IS NULL';
        } else if (folder_id) {
            paramCount++;
            query += ` AND folder_id = $${paramCount}`;
            params.push(folder_id);
        }

        // Subject filtering
        if (subject_id && subject_id !== 'null' && subject_id !== 'undefined') {
            paramCount++;
            query += ` AND subject_id = $${paramCount}`;
            params.push(subject_id);
        }

        query += ' ORDER BY is_pinned DESC, updated_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// POST new note
router.post('/', async (req, res) => {
    try {
        const { title, content, tags, is_pinned, color, folder_id, subject_id } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Note title is required' });
        }

        // Verify folder exists and belongs to user if folder_id is provided
        if (folder_id) {
            const folderCheck = await db.query(
                'SELECT id FROM note_folders WHERE id = $1 AND user_id = $2',
                [folder_id, req.userId]
            );

            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        const result = await db.query(
            `INSERT INTO notes (user_id, folder_id, subject_id, title, content, tags, is_pinned, color)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.userId, folder_id || null, subject_id || null, title.trim(), content || '', tags || [], is_pinned || false, color || '#ffffff']
        );
        const note = result.rows[0];
        // Auto-embed for RAG (fire-and-forget)
        const embedText = [note.title, note.content].filter(Boolean).join('\n').trim();
        if (embedText.length >= 5) upsertEmbedding(req.userId, 'notes', note.id, embedText).catch(console.error);
        res.status(201).json(note);
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT update note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags, is_pinned, color, folder_id, subject_id } = req.body;

        // Verify folder exists and belongs to user if folder_id is provided
        if (folder_id !== undefined && folder_id !== null) {
            const folderCheck = await db.query(
                'SELECT id FROM note_folders WHERE id = $1 AND user_id = $2',
                [folder_id, req.userId]
            );

            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        const result = await db.query(
            `UPDATE notes
             SET title = $1, content = $2, tags = $3, is_pinned = $4, color = $5, folder_id = $6, subject_id = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND user_id = $9
             RETURNING *`,
            [title, content, tags, is_pinned, color, folder_id || null, subject_id || null, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        const updated = result.rows[0];
        // Auto-embed for RAG (fire-and-forget)
        const embedText = [updated.title, updated.content].filter(Boolean).join('\n').trim();
        if (embedText.length >= 5) upsertEmbedding(req.userId, 'notes', updated.id, embedText).catch(console.error);
        res.json(updated);
    } catch (err) {
        console.error('Error updating note:', err);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully' });
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// POST move note to folder
router.post('/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { folder_id } = req.body;

        // Verify folder exists and belongs to user if folder_id is provided
        if (folder_id !== null && folder_id !== undefined) {
            const folderCheck = await db.query(
                'SELECT id FROM note_folders WHERE id = $1 AND user_id = $2',
                [folder_id, req.userId]
            );

            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        const result = await db.query(
            `UPDATE notes
             SET folder_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [folder_id || null, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error moving note:', err);
        res.status(500).json({ error: 'Failed to move note' });
    }
});

// POST copy note (optionally to a folder)
router.post('/:id/copy', async (req, res) => {
    try {
        const { id } = req.params;
        const { folder_id } = req.body;

        // Get the original note
        const originalNote = await db.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (originalNote.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = originalNote.rows[0];

        // Verify folder exists and belongs to user if folder_id is provided
        if (folder_id !== null && folder_id !== undefined) {
            const folderCheck = await db.query(
                'SELECT id FROM note_folders WHERE id = $1 AND user_id = $2',
                [folder_id, req.userId]
            );

            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        // Create copy with " (Copy)" suffix
        const result = await db.query(
            `INSERT INTO notes (user_id, folder_id, subject_id, title, content, tags, is_pinned, color)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                req.userId,
                folder_id !== undefined ? (folder_id || null) : note.folder_id,
                note.subject_id,
                `${note.title} (Copy)`,
                note.content,
                note.tags,
                false, // Don't pin the copy by default
                note.color
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error copying note:', err);
        res.status(500).json({ error: 'Failed to copy note' });
    }
});

module.exports = router;
