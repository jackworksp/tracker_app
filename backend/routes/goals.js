const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all goals for current user
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT g.*, COALESCE(SUM(s.time_spent), 0) as total_minutes
             FROM goals g
             LEFT JOIN study_sessions s ON g.id = s.goal_id
             WHERE g.user_id = $1
             GROUP BY g.id
             ORDER BY g.created_at DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching goals:', err);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create a new goal
router.post('/', async (req, res) => {
    try {
        const { title, description, category, status, target_date, image_url, target_hours } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const validCategories = ['CAREER', 'HEALTH', 'FINANCE', 'EDUCATION', 'PERSONAL'];
        const validStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

        const goalCategory = validCategories.includes(category) ? category : 'PERSONAL';
        const goalStatus = validStatuses.includes(status) ? status : 'PLANNING';
        const goalTargetHours = target_hours ? parseInt(target_hours) : 100;

        // Convert empty string to null for DATE column
        const goalTargetDate = target_date && target_date.trim() !== '' ? target_date : null;
        const goalDescription = description && description.trim() !== '' ? description : null;
        const goalImageUrl = image_url && image_url.trim() !== '' ? image_url : null;

        const result = await db.query(
            `INSERT INTO goals (user_id, title, description, category, status, target_date, image_url, target_hours)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.userId, title, goalDescription, goalCategory, goalStatus, goalTargetDate, goalImageUrl, goalTargetHours]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating goal:', err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update goal
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, status, target_date, image_url, target_hours } = req.body;

        let query = 'UPDATE goals SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramCount = 1;

        if (title !== undefined) {
            query += `, title = $${paramCount}`;
            params.push(title);
            paramCount++;
        }
        if (description !== undefined) {
            query += `, description = $${paramCount}`;
            // Convert empty string to null
            params.push(description && description.trim() !== '' ? description : null);
            paramCount++;
        }
        if (category !== undefined) {
            query += `, category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        if (status !== undefined) {
            query += `, status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (target_date !== undefined) {
            query += `, target_date = $${paramCount}`;
            // Convert empty string to null for DATE column
            params.push(target_date && target_date.trim() !== '' ? target_date : null);
            paramCount++;
        }
        if (image_url !== undefined) {
            query += `, image_url = $${paramCount}`;
            // Convert empty string to null
            params.push(image_url && image_url.trim() !== '' ? image_url : null);
            paramCount++;
        }
        if (target_hours !== undefined) {
            query += `, target_hours = $${paramCount}`;
            params.push(parseInt(target_hours));
            paramCount++;
        }

        query += ` WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
        params.push(id, req.userId);

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete goal
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting goal:', err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
