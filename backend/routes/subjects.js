const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all subjects with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
        const offset = (page - 1) * limit;

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
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM subjects');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// GET single subject with all data (with optional pagination for nested data)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 200); // Higher limit for single subject view
        const offset = (page - 1) * limit;

        const subject = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
        if (subject.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Get topics, sessions, and revision items with pagination
        const topics = await db.query('SELECT * FROM topics WHERE subject_id = $1 ORDER BY id LIMIT $2 OFFSET $3', [id, limit, offset]);
        const sessions = await db.query('SELECT * FROM study_sessions WHERE subject_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3', [id, limit, offset]);
        const revisionItems = await db.query('SELECT * FROM revision_items WHERE subject_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [id, limit, offset]);

        // Get counts for pagination
        const topicsCount = await db.query('SELECT COUNT(*) FROM topics WHERE subject_id = $1', [id]);
        const sessionsCount = await db.query('SELECT COUNT(*) FROM study_sessions WHERE subject_id = $1', [id]);
        const revisionItemsCount = await db.query('SELECT COUNT(*) FROM revision_items WHERE subject_id = $1', [id]);

        const topicsTotal = parseInt(topicsCount.rows[0].count);
        const sessionsTotal = parseInt(sessionsCount.rows[0].count);
        const revisionItemsTotal = parseInt(revisionItemsCount.rows[0].count);

        res.json({
            subject: subject.rows[0],
            topics: topics.rows,
            sessions: sessions.rows,
            revisionItems: revisionItems.rows,
            pagination: {
                page,
                limit,
                topicsTotal,
                topicsTotalPages: Math.ceil(topicsTotal / limit),
                sessionsTotal,
                sessionsTotalPages: Math.ceil(sessionsTotal / limit),
                revisionItemsTotal,
                revisionItemsTotalPages: Math.ceil(revisionItemsTotal / limit),
                hasNextPage: page < Math.max(
                    Math.ceil(topicsTotal / limit),
                    Math.ceil(sessionsTotal / limit),
                    Math.ceil(revisionItemsTotal / limit)
                ),
                hasPrevPage: page > 1
            }
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
