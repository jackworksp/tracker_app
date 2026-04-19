const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const VALID_CATEGORIES = new Set([
    'exam',
    'deadline',
    'birthday',
    'renewal',
    'appointment',
    'milestone',
    'other'
]);
const VALID_RECURRENCES = new Set(['none', 'yearly']);
const DEFAULT_OFFSETS = [7, 1, 0];

function normalizeOffsets(value) {
    if (!Array.isArray(value)) return DEFAULT_OFFSETS;
    const offsets = [...new Set(
        value
            .map((item) => Number.parseInt(item, 10))
            .filter((item) => Number.isInteger(item) && item >= 0 && item <= 365)
    )].sort((a, b) => b - a);
    return offsets.length > 0 ? offsets : DEFAULT_OFFSETS;
}

function normalizeTime(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
        return undefined;
    }
    return value.length === 5 ? `${value}:00` : value;
}

function nextOccurrence(dateValue, recurrence) {
    const date = new Date(`${dateValue.toISOString().slice(0, 10)}T00:00:00Z`);
    if (recurrence !== 'yearly') return date.toISOString().slice(0, 10);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    let candidate = new Date(Date.UTC(today.getUTCFullYear(), month, day));

    // Feb 29 on a non-leap year rolls into March; clamp yearly occurrence to Feb 28.
    if (candidate.getUTCMonth() !== month) {
        candidate = new Date(Date.UTC(today.getUTCFullYear(), month + 1, 0));
    }
    if (candidate < today) {
        candidate = new Date(Date.UTC(today.getUTCFullYear() + 1, month, day));
        if (candidate.getUTCMonth() !== month) {
            candidate = new Date(Date.UTC(today.getUTCFullYear() + 1, month + 1, 0));
        }
    }
    return candidate.toISOString().slice(0, 10);
}

function toApi(row) {
    const eventDate = row.date instanceof Date ? row.date : new Date(row.date);
    const api = {
        ...row,
        date: eventDate.toISOString().slice(0, 10),
        time: row.event_time ?? null,
        next_occurrence: nextOccurrence(eventDate, row.recurrence)
    };
    delete api.event_time;
    return api;
}

async function validateLinkOwnership(userId, taskId, goalId) {
    if (taskId !== null && taskId !== undefined) {
        const task = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );
        if (task.rows.length === 0) return 'Linked task not found';
    }

    if (goalId !== null && goalId !== undefined) {
        const goal = await db.query(
            'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
            [goalId, userId]
        );
        if (goal.rows.length === 0) return 'Linked goal not found';
    }

    return null;
}

router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
             FROM important_dates
             WHERE user_id = $1
             AND (recurrence = 'yearly' OR date >= CURRENT_DATE)`,
            [req.userId]
        );

        const rows = result.rows
            .map(toApi)
            .sort((a, b) => {
                const byDate = a.next_occurrence.localeCompare(b.next_occurrence);
                if (byDate !== 0) return byDate;
                return (a.time || '09:00:00').localeCompare(b.time || '09:00:00');
            });

        res.json(rows);
    } catch (err) {
        console.error('Error fetching important dates:', err);
        res.status(500).json({ error: 'Failed to fetch important dates' });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            date,
            recurrence,
            reminder_offsets_days,
            task_id,
            goal_id
        } = req.body;
        const eventTime = normalizeTime(req.body.time);

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!date || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
            return res.status(400).json({ error: 'Valid date is required' });
        }
        if (eventTime === undefined) {
            return res.status(400).json({ error: 'Invalid time. Use HH:mm or HH:mm:ss' });
        }

        const cleanCategory = VALID_CATEGORIES.has(category) ? category : 'other';
        const cleanRecurrence = VALID_RECURRENCES.has(recurrence) ? recurrence : 'none';
        const cleanTaskId = task_id || null;
        const cleanGoalId = goal_id || null;
        const linkError = await validateLinkOwnership(req.userId, cleanTaskId, cleanGoalId);
        if (linkError) return res.status(400).json({ error: linkError });

        const result = await db.query(
            `INSERT INTO important_dates
             (user_id, title, description, category, date, event_time, recurrence,
              reminder_offsets_days, task_id, goal_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                req.userId,
                title.trim(),
                description && description.trim() ? description.trim() : null,
                cleanCategory,
                date,
                eventTime,
                cleanRecurrence,
                normalizeOffsets(reminder_offsets_days),
                cleanTaskId,
                cleanGoalId
            ]
        );

        res.status(201).json(toApi(result.rows[0]));
    } catch (err) {
        console.error('Error creating important date:', err);
        res.status(500).json({ error: 'Failed to create important date' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db.query(
            'SELECT * FROM important_dates WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Important date not found' });
        }

        const current = toApi(existing.rows[0]);
        const next = {
            title: req.body.title !== undefined ? req.body.title : current.title,
            description: req.body.description !== undefined ? req.body.description : current.description,
            category: req.body.category !== undefined ? req.body.category : current.category,
            date: req.body.date !== undefined ? req.body.date : current.date,
            time: req.body.time !== undefined ? req.body.time : current.time,
            recurrence: req.body.recurrence !== undefined ? req.body.recurrence : current.recurrence,
            reminder_offsets_days: req.body.reminder_offsets_days !== undefined
                ? req.body.reminder_offsets_days
                : current.reminder_offsets_days,
            task_id: req.body.task_id !== undefined ? req.body.task_id : current.task_id,
            goal_id: req.body.goal_id !== undefined ? req.body.goal_id : current.goal_id
        };

        const eventTime = normalizeTime(next.time);
        if (!next.title || !next.title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!next.date || Number.isNaN(Date.parse(`${next.date}T00:00:00Z`))) {
            return res.status(400).json({ error: 'Valid date is required' });
        }
        if (eventTime === undefined) {
            return res.status(400).json({ error: 'Invalid time. Use HH:mm or HH:mm:ss' });
        }

        const cleanCategory = VALID_CATEGORIES.has(next.category) ? next.category : 'other';
        const cleanRecurrence = VALID_RECURRENCES.has(next.recurrence) ? next.recurrence : 'none';
        const cleanTaskId = next.task_id || null;
        const cleanGoalId = next.goal_id || null;
        const linkError = await validateLinkOwnership(req.userId, cleanTaskId, cleanGoalId);
        if (linkError) return res.status(400).json({ error: linkError });

        const result = await db.query(
            `UPDATE important_dates
             SET title = $1,
                 description = $2,
                 category = $3,
                 date = $4,
                 event_time = $5,
                 recurrence = $6,
                 reminder_offsets_days = $7,
                 task_id = $8,
                 goal_id = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND user_id = $11
             RETURNING *`,
            [
                next.title.trim(),
                next.description && next.description.trim() ? next.description.trim() : null,
                cleanCategory,
                next.date,
                eventTime,
                cleanRecurrence,
                normalizeOffsets(next.reminder_offsets_days),
                cleanTaskId,
                cleanGoalId,
                id,
                req.userId
            ]
        );

        res.json(toApi(result.rows[0]));
    } catch (err) {
        console.error('Error updating important date:', err);
        res.status(500).json({ error: 'Failed to update important date' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM important_dates WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Important date not found' });
        }
        res.json({ success: true, id: Number(req.params.id) });
    } catch (err) {
        console.error('Error deleting important date:', err);
        res.status(500).json({ error: 'Failed to delete important date' });
    }
});

module.exports = router;
