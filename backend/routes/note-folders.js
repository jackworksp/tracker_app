const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET all folders for the authenticated user
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM note_folders WHERE user_id = $1 ORDER BY name ASC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching folders:', err);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// GET a specific folder
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM note_folders WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching folder:', err);
        res.status(500).json({ error: 'Failed to fetch folder' });
    }
});

// POST create new folder
router.post('/', async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Check if parent folder exists and belongs to user (if parent_id is provided)
        if (parent_id) {
            const parentCheck = await db.query(
                'SELECT id FROM note_folders WHERE id = $1 AND user_id = $2',
                [parent_id, req.userId]
            );

            if (parentCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Parent folder not found' });
            }
        }

        const result = await db.query(
            `INSERT INTO note_folders (user_id, name, parent_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.userId, name.trim(), parent_id || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT update folder name
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const result = await db.query(
            `UPDATE note_folders
             SET name = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [name.trim(), id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating folder:', err);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE folder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if folder has notes
        const notesCheck = await db.query(
            'SELECT COUNT(*) as count FROM notes WHERE folder_id = $1',
            [id]
        );

        const noteCount = parseInt(notesCheck.rows[0].count);

        // Check if folder has subfolders
        const subfoldersCheck = await db.query(
            'SELECT COUNT(*) as count FROM note_folders WHERE parent_id = $1',
            [id]
        );

        const subfolderCount = parseInt(subfoldersCheck.rows[0].count);

        if (noteCount > 0 || subfolderCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete folder that contains notes or subfolders',
                noteCount,
                subfolderCount
            });
        }

        const result = await db.query(
            'DELETE FROM note_folders WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json({ message: 'Folder deleted successfully' });
    } catch (err) {
        console.error('Error deleting folder:', err);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

module.exports = router;
