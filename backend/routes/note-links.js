const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== NOTE-TASK LINKS ====================

// GET all notes linked to a task
router.get('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        // Verify task belongs to user
        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.userId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const result = await db.query(
            `SELECT n.*, nt.created_at as linked_at
             FROM notes n
             INNER JOIN note_tasks nt ON n.id = nt.note_id
             WHERE nt.task_id = $1 AND n.user_id = $2
             ORDER BY nt.created_at DESC`,
            [taskId, req.userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching task notes:', err);
        res.status(500).json({ error: 'Failed to fetch task notes' });
    }
});

// POST link note to task
router.post('/task/:taskId/note/:noteId', async (req, res) => {
    try {
        const { taskId, noteId } = req.params;

        // Verify task belongs to user
        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.userId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Verify note belongs to user
        const noteCheck = await db.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, req.userId]
        );

        if (noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Check if link already exists
        const existingLink = await db.query(
            'SELECT id FROM note_tasks WHERE note_id = $1 AND task_id = $2',
            [noteId, taskId]
        );

        if (existingLink.rows.length > 0) {
            return res.status(409).json({ error: 'Note is already linked to this task' });
        }

        // Create link
        const result = await db.query(
            `INSERT INTO note_tasks (note_id, task_id)
             VALUES ($1, $2)
             RETURNING *`,
            [noteId, taskId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error linking note to task:', err);
        res.status(500).json({ error: 'Failed to link note to task' });
    }
});

// DELETE unlink note from task
router.delete('/task/:taskId/note/:noteId', async (req, res) => {
    try {
        const { taskId, noteId } = req.params;

        // Verify task and note belong to user
        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.userId]
        );

        const noteCheck = await db.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, req.userId]
        );

        if (taskCheck.rows.length === 0 || noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Task or note not found' });
        }

        const result = await db.query(
            'DELETE FROM note_tasks WHERE note_id = $1 AND task_id = $2 RETURNING *',
            [noteId, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }

        res.json({ message: 'Note unlinked from task successfully' });
    } catch (err) {
        console.error('Error unlinking note from task:', err);
        res.status(500).json({ error: 'Failed to unlink note from task' });
    }
});

// ==================== NOTE-SESSION LINKS ====================

// GET all notes linked to a session
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verify session belongs to user (via subject ownership)
        const sessionCheck = await db.query(
            `SELECT id FROM study_sessions WHERE id = $1
             AND subject_id IN (SELECT id FROM subjects WHERE user_id = $2)`,
            [sessionId, req.userId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const result = await db.query(
            `SELECT n.*, ns.created_at as linked_at
             FROM notes n
             INNER JOIN note_sessions ns ON n.id = ns.note_id
             WHERE ns.session_id = $1 AND n.user_id = $2
             ORDER BY ns.created_at DESC`,
            [sessionId, req.userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching session notes:', err);
        res.status(500).json({ error: 'Failed to fetch session notes' });
    }
});

// POST link note to session
router.post('/session/:sessionId/note/:noteId', async (req, res) => {
    try {
        const { sessionId, noteId } = req.params;

        // Verify session belongs to user (via subject ownership)
        const sessionCheck = await db.query(
            `SELECT id FROM study_sessions WHERE id = $1
             AND subject_id IN (SELECT id FROM subjects WHERE user_id = $2)`,
            [sessionId, req.userId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Verify note belongs to user
        const noteCheck = await db.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, req.userId]
        );

        if (noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Check if link already exists
        const existingLink = await db.query(
            'SELECT id FROM note_sessions WHERE note_id = $1 AND session_id = $2',
            [noteId, sessionId]
        );

        if (existingLink.rows.length > 0) {
            return res.status(409).json({ error: 'Note is already linked to this session' });
        }

        // Create link
        const result = await db.query(
            `INSERT INTO note_sessions (note_id, session_id)
             VALUES ($1, $2)
             RETURNING *`,
            [noteId, sessionId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error linking note to session:', err);
        res.status(500).json({ error: 'Failed to link note to session' });
    }
});

// DELETE unlink note from session
router.delete('/session/:sessionId/note/:noteId', async (req, res) => {
    try {
        const { sessionId, noteId } = req.params;

        // Verify session belongs to user (via subject ownership)
        const sessionCheck = await db.query(
            `SELECT id FROM study_sessions WHERE id = $1
             AND subject_id IN (SELECT id FROM subjects WHERE user_id = $2)`,
            [sessionId, req.userId]
        );

        const noteCheck = await db.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, req.userId]
        );

        if (sessionCheck.rows.length === 0 || noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Session or note not found' });
        }

        const result = await db.query(
            'DELETE FROM note_sessions WHERE note_id = $1 AND session_id = $2 RETURNING *',
            [noteId, sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }

        res.json({ message: 'Note unlinked from session successfully' });
    } catch (err) {
        console.error('Error unlinking note from session:', err);
        res.status(500).json({ error: 'Failed to unlink note from session' });
    }
});

// ==================== GET ALL LINKS FOR A NOTE ====================

// GET all tasks and sessions linked to a note
router.get('/note/:noteId', async (req, res) => {
    try {
        const { noteId } = req.params;

        // Verify note belongs to user
        const noteCheck = await db.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, req.userId]
        );

        if (noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Get linked tasks
        const tasks = await db.query(
            `SELECT t.*, nt.created_at as linked_at
             FROM tasks t
             INNER JOIN note_tasks nt ON t.id = nt.task_id
             WHERE nt.note_id = $1
             ORDER BY nt.created_at DESC`,
            [noteId]
        );

        // Get linked sessions (only sessions belonging to user via subject ownership)
        const sessions = await db.query(
            `SELECT s.*, ns.created_at as linked_at
             FROM study_sessions s
             INNER JOIN note_sessions ns ON s.id = ns.session_id
             WHERE ns.note_id = $1
             AND s.subject_id IN (SELECT id FROM subjects WHERE user_id = $2)
             ORDER BY ns.created_at DESC`,
            [noteId, req.userId]
        );

        res.json({
            tasks: tasks.rows,
            sessions: sessions.rows
        });
    } catch (err) {
        console.error('Error fetching note links:', err);
        res.status(500).json({ error: 'Failed to fetch note links' });
    }
});

module.exports = router;
