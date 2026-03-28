const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const VALID_FREQUENCIES = ['DAILY', 'WEEKLY'];
const VALID_CATEGORIES = ['GENERAL', 'HEALTH', 'LEARNING', 'PRODUCTIVITY', 'MINDFULNESS'];

router.use(authenticateToken);

function normalizeDescription(description) {
    if (description === undefined) return undefined;
    if (typeof description !== 'string') return description;
    return description.trim() === '' ? null : description.trim();
}

function computeStreak(completionDates) {
    if (!completionDates.length) return 0;

    const completionSet = new Set(completionDates);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let streak = 0;
    const cursor = new Date(today);

    while (completionSet.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
}

async function ensureRoutineOwnership(routineId, userId) {
    const result = await db.query(
        'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
        [routineId, userId]
    );
    return result.rows.length > 0;
}

router.get('/', async (req, res) => {
    try {
        const routinesResult = await db.query(
            `SELECT r.*,
                    EXISTS (
                        SELECT 1
                        FROM routine_completions rc
                        WHERE rc.routine_id = r.id
                          AND rc.completed_date = CURRENT_DATE
                    ) AS is_completed_today
             FROM routines r
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [req.userId]
        );

        const routines = routinesResult.rows;
        if (routines.length === 0) {
            return res.json([]);
        }

        const routineIds = routines.map((routine) => routine.id);
        const completionsResult = await db.query(
            `SELECT routine_id, completed_date
             FROM routine_completions
             WHERE user_id = $1
               AND routine_id = ANY($2::int[])
               AND completed_date >= CURRENT_DATE - INTERVAL '60 days'
             ORDER BY completed_date DESC`,
            [req.userId, routineIds]
        );

        const completionMap = new Map();
        for (const row of completionsResult.rows) {
            const entries = completionMap.get(row.routine_id) ?? [];
            entries.push(row.completed_date.toISOString().slice(0, 10));
            completionMap.set(row.routine_id, entries);
        }

        const enriched = routines.map((routine) => ({
            ...routine,
            streak: computeStreak(completionMap.get(routine.id) ?? []),
            is_completed_today: routine.is_completed_today,
        }));

        res.json(enriched);
    } catch (err) {
        console.error('Error fetching routines:', err);
        res.status(500).json({ error: 'Failed to fetch routines' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, frequency, category, color, active } = req.body;

        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }

        if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const result = await db.query(
            `INSERT INTO routines (user_id, title, description, frequency, category, color, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                req.userId,
                title.trim(),
                normalizeDescription(description) ?? null,
                frequency ?? 'DAILY',
                category ?? 'GENERAL',
                typeof color === 'string' && color.trim() !== '' ? color.trim() : 'blue',
                active ?? true,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating routine:', err);
        res.status(500).json({ error: 'Failed to create routine' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, frequency, category, color, active } = req.body;

        if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }

        if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        let query = 'UPDATE routines SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramCount = 1;

        if (title !== undefined) {
            query += `, title = $${paramCount++}`;
            params.push(title.trim());
        }
        if (description !== undefined) {
            query += `, description = $${paramCount++}`;
            params.push(normalizeDescription(description));
        }
        if (frequency !== undefined) {
            query += `, frequency = $${paramCount++}`;
            params.push(frequency);
        }
        if (category !== undefined) {
            query += `, category = $${paramCount++}`;
            params.push(category);
        }
        if (color !== undefined) {
            query += `, color = $${paramCount++}`;
            params.push(typeof color === 'string' && color.trim() !== '' ? color.trim() : 'blue');
        }
        if (active !== undefined) {
            query += `, active = $${paramCount++}`;
            params.push(Boolean(active));
        }

        query += ` WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
        params.push(id, req.userId);

        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating routine:', err);
        res.status(500).json({ error: 'Failed to update routine' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM routines WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        res.json({ success: true, id: Number(id) });
    } catch (err) {
        console.error('Error deleting routine:', err);
        res.status(500).json({ error: 'Failed to delete routine' });
    }
});

router.post('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const ownsRoutine = await ensureRoutineOwnership(id, req.userId);
        if (!ownsRoutine) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        await db.query(
            `INSERT INTO routine_completions (routine_id, user_id, completed_date)
             VALUES ($1, $2, CURRENT_DATE)
             ON CONFLICT (routine_id, completed_date) DO NOTHING`,
            [id, req.userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error completing routine:', err);
        res.status(500).json({ error: 'Failed to complete routine' });
    }
});

router.delete('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const ownsRoutine = await ensureRoutineOwnership(id, req.userId);
        if (!ownsRoutine) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        await db.query(
            `DELETE FROM routine_completions
             WHERE routine_id = $1
               AND user_id = $2
               AND completed_date = CURRENT_DATE`,
            [id, req.userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error uncompleting routine:', err);
        res.status(500).json({ error: 'Failed to uncomplete routine' });
    }
});

module.exports = router;
