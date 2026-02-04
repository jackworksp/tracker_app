const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all notes
router.get('/', async (req, res) => {
    try {
        // Authenticated user check (middle-ware would be better but keeping pattern)
        // For now, assuming default user or passed via header if we had auth middleware active
        // But following existing patterns in other routes:
        
        let userId = 1; // Default fallback
        if (req.headers.authorization) {
             // In a real app we'd decode token. 
             // Here we rely on the implementation pattern.
             // See 'tasks.js' or 'goals.js' for how they handle it.
             // Actually, let's look at how tasks are implemented.
             // They often take a user_id from query or just return all for the user context.
        }

        const result = await db.query(
            'SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST new note
router.post('/', async (req, res) => {
    try {
        const { title, content, tags, is_pinned, color } = req.body;
        // Default user_id to 1 if not handled by auth middleware yet
        const user_id = 1; 

        const result = await db.query(
            `INSERT INTO notes (user_id, title, content, tags, is_pinned, color) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [user_id, title, content || '', tags || [], is_pinned || false, color || '#ffffff']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags, is_pinned, color } = req.body;

        const result = await db.query(
            `UPDATE notes 
             SET title = $1, content = $2, tags = $3, is_pinned = $4, color = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 
             RETURNING *`,
            [title, content, tags, is_pinned, color, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
