const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all subjects
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, 
                   COUNT(DISTINCT t.id) as topic_count,
                   COUNT(DISTINCT CASE WHEN t.completed = true THEN t.id END) as completed_count,
                   COUNT(DISTINCT ss.id) as session_count
            FROM subjects s
            LEFT JOIN topics t ON s.id = t.subject_id
            LEFT JOIN study_sessions ss ON s.id = ss.subject_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// GET single subject with all data
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
        if (subject.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const topics = await db.query('SELECT * FROM topics WHERE subject_id = $1 ORDER BY id', [id]);
        const sessions = await db.query('SELECT * FROM study_sessions WHERE subject_id = $1 ORDER BY date DESC', [id]);
        const revisionItems = await db.query('SELECT * FROM revision_items WHERE subject_id = $1 ORDER BY created_at DESC', [id]);

        res.json({
            subject: subject.rows[0],
            topics: topics.rows,
            sessions: sessions.rows,
            revisionItems: revisionItems.rows
        });
    } catch (err) {
        console.error('Error fetching subject:', err);
        res.status(500).json({ error: 'Failed to fetch subject data' });
    }
});

// CREATE new subject
router.post('/', async (req, res) => {
    try {
        const { name, description, color, icon } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Subject name is required' });
        }

        const result = await db.query(
            `INSERT INTO subjects (name, description, color, icon)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description || '', color || '#3b82f6', icon || '📚']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Subject name already exists' });
        }
        console.error('Error creating subject:', err);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

// UPDATE subject
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon } = req.body;

        const result = await db.query(
            `UPDATE subjects 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 color = COALESCE($3, color),
                 icon = COALESCE($4, icon),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 RETURNING *`,
            [name, description, color, icon, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating subject:', err);
        res.status(500).json({ error: 'Failed to update subject' });
    }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subject has data
        const topics = await db.query('SELECT COUNT(*) FROM topics WHERE subject_id = $1', [id]);
        const sessions = await db.query('SELECT COUNT(*) FROM study_sessions WHERE subject_id = $1', [id]);
        
        const hasData = parseInt(topics.rows[0].count) > 0 || parseInt(sessions.rows[0].count) > 0;

        const result = await db.query(
            'DELETE FROM subjects WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({ 
            message: 'Subject deleted successfully',
            hadData: hasData
        });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

module.exports = router;
