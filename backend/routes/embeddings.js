const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upsertEmbedding } = require('../services/embeddings');
const db = require('../database');

router.use(authenticateToken);

/**
 * POST /api/embeddings/sync
 * Full sync: embeds all the user's notes, tasks, study_sessions, and goals.
 * Call this once after enabling RAG, or to re-sync everything.
 */
router.post('/sync', async (req, res) => {
    const userId = req.userId;
    const results = { notes: 0, tasks: 0, sessions: 0, goals: 0, errors: 0 };

    try {
        // Notes
        const notes = await db.query(
            `SELECT id, title, content FROM notes WHERE user_id = $1 AND content IS NOT NULL`,
            [userId]
        );
        for (const note of notes.rows) {
            try {
                const text = [note.title, note.content].filter(Boolean).join('\n').trim();
                if (text.length >= 5) {
                    await upsertEmbedding(userId, 'notes', note.id, text);
                    results.notes++;
                }
            } catch { results.errors++; }
        }

        // Tasks
        const tasks = await db.query(
            `SELECT id, title, content FROM tasks WHERE user_id = $1`,
            [userId]
        );
        for (const task of tasks.rows) {
            try {
                const text = [task.title, task.content].filter(Boolean).join('\n').trim();
                if (text.length >= 5) {
                    await upsertEmbedding(userId, 'tasks', task.id, text);
                    results.tasks++;
                }
            } catch { results.errors++; }
        }

        // Study sessions
        const sessions = await db.query(
            `SELECT id, topics_covered, notes, activity FROM study_sessions WHERE user_id = $1`,
            [userId]
        );
        for (const s of sessions.rows) {
            try {
                const text = [s.activity, s.topics_covered, s.notes].filter(Boolean).join('\n').trim();
                if (text.length >= 5) {
                    await upsertEmbedding(userId, 'study_sessions', s.id, text);
                    results.sessions++;
                }
            } catch { results.errors++; }
        }

        // Goals
        const goals = await db.query(
            `SELECT id, title, description FROM goals WHERE user_id = $1`,
            [userId]
        );
        for (const goal of goals.rows) {
            try {
                const text = [goal.title, goal.description].filter(Boolean).join('\n').trim();
                if (text.length >= 5) {
                    await upsertEmbedding(userId, 'goals', goal.id, text);
                    results.goals++;
                }
            } catch { results.errors++; }
        }

        res.json({ success: true, embedded: results });
    } catch (error) {
        console.error('Embeddings sync error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

/**
 * POST /api/embeddings/sync-one
 * Re-embeds a single item after create/update.
 * Body: { sourceTable: 'notes'|'tasks'|'study_sessions'|'goals', sourceId: number }
 */
router.post('/sync-one', async (req, res) => {
    const userId = req.userId;
    const { sourceTable, sourceId } = req.body;

    const allowed = ['notes', 'tasks', 'study_sessions', 'goals'];
    if (!allowed.includes(sourceTable) || !Number.isInteger(Number(sourceId))) {
        return res.status(400).json({ error: 'Invalid sourceTable or sourceId' });
    }

    try {
        let text = '';

        if (sourceTable === 'notes') {
            const r = await db.query(`SELECT title, content FROM notes WHERE id = $1 AND user_id = $2`, [sourceId, userId]);
            if (r.rows.length) text = [r.rows[0].title, r.rows[0].content].filter(Boolean).join('\n');
        } else if (sourceTable === 'tasks') {
            const r = await db.query(`SELECT title, content FROM tasks WHERE id = $1 AND user_id = $2`, [sourceId, userId]);
            if (r.rows.length) text = [r.rows[0].title, r.rows[0].content].filter(Boolean).join('\n');
        } else if (sourceTable === 'study_sessions') {
            const r = await db.query(`SELECT activity, topics_covered, notes FROM study_sessions WHERE id = $1 AND user_id = $2`, [sourceId, userId]);
            if (r.rows.length) text = [r.rows[0].activity, r.rows[0].topics_covered, r.rows[0].notes].filter(Boolean).join('\n');
        } else if (sourceTable === 'goals') {
            const r = await db.query(`SELECT title, description FROM goals WHERE id = $1 AND user_id = $2`, [sourceId, userId]);
            if (r.rows.length) text = [r.rows[0].title, r.rows[0].description].filter(Boolean).join('\n');
        }

        if (!text.trim()) return res.json({ success: true, skipped: true });

        await upsertEmbedding(userId, sourceTable, Number(sourceId), text.trim());
        res.json({ success: true });
    } catch (error) {
        console.error('Embeddings sync-one error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

module.exports = router;
