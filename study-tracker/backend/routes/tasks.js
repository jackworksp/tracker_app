const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all tasks (Global view)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM tasks ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get all tasks for a subject
router.get('/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const result = await db.query(
            'SELECT * FROM tasks WHERE subject_id = $1 ORDER BY created_at DESC',
            [subjectId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a new task
router.post('/', async (req, res) => {
    try {
        const { subject_id, type, title, url, content } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const validTypes = ['TASK', 'WATCH', 'READ', 'NOTE'];
        const taskType = validTypes.includes(type) ? type : 'TASK';

        const result = await db.query(
            `INSERT INTO tasks (subject_id, type, title, url, content, tags) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [subject_id || null, taskType, title, url, content, req.body.tags || []]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task (completion or content)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed, title, url, content } = req.body;

        let query = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramCount = 1;

        if (completed !== undefined) {
            query += `, completed = $${paramCount}`;
            params.push(completed);
            paramCount++;
        }
        if (title !== undefined) {
            query += `, title = $${paramCount}`;
            params.push(title);
            paramCount++;
        }
        if (url !== undefined) {
            query += `, url = $${paramCount}`;
            params.push(url);
            paramCount++;
        }
        if (content !== undefined) {
            query += `, content = $${paramCount}`;
            params.push(content);
            paramCount++;
        }
        if (req.body.tags !== undefined) {
            query += `, tags = $${paramCount}`;
            params.push(req.body.tags);
            paramCount++;
        }
        if (req.body.rating !== undefined) {
            query += `, rating = $${paramCount}`;
            params.push(req.body.rating);
            paramCount++;
        }

        query += ` WHERE id = $${paramCount} RETURNING *`;
        params.push(id);

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
