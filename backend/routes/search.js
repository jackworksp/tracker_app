const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/search?q=term&type=all|task|session|task_session
router.get('/', async (req, res) => {
    try {
        const { q = '', type = 'all' } = req.query;

        if (!q.trim()) {
            return res.json({ results: [], query: q });
        }

        const searchPattern = `%${q.trim()}%`;
        const userId = req.userId;
        const results = [];

        if (type === 'all' || type === 'task' || type === 'task_session') {
            const tasks = await db.query(`
                SELECT
                    t.id,
                    'task' as type,
                    t.title,
                    t.title as name,
                    t.description,
                    t.created_at,
                    t.updated_at,
                    t.subject_id,
                    t.completed,
                    t.priority,
                    t.due_date,
                    t.type as task_type,
                    t.attachment_url,
                    t.url,
                    t.rating,
                    t.goal_id,
                    t.parent_task_id,
                    t.folder_id,
                    s.name as subject_name
                FROM tasks t
                LEFT JOIN subjects s ON t.subject_id = s.id
                WHERE t.user_id = $1
                    AND t.parent_task_id IS NULL
                    AND (t.title ILIKE $2 OR t.description ILIKE $2)
                ORDER BY t.created_at DESC
                LIMIT 25
            `, [userId, searchPattern]);
            results.push(...tasks.rows);
        }

        if (type === 'all' || type === 'session' || type === 'task_session') {
            const sessions = await db.query(`
                SELECT
                    ss.id,
                    'session' as type,
                    ss.activity,
                    ss.activity as name,
                    ss.notes,
                    ss.notes as description,
                    ss.date,
                    ss.date as created_at,
                    ss.subject_id,
                    ss.time_spent,
                    ss.type as session_type,
                    ss.revision_count,
                    ss.url,
                    ss.goal_id,
                    ss.folder_id,
                    s.name as subject_name
                FROM study_sessions ss
                LEFT JOIN subjects s ON ss.subject_id = s.id
                WHERE ss.user_id = $1
                    AND (ss.activity ILIKE $2 OR ss.notes ILIKE $2)
                ORDER BY ss.date DESC
                LIMIT 25
            `, [userId, searchPattern]);
            results.push(...sessions.rows);
        }

        // Sort unified results by created_at descending
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ results, query: q });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
