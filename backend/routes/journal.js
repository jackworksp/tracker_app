const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all journal entries for a goal
router.get('/goal/:goalId', async (req, res) => {
    try {
        const userId = req.userId;
        const { goalId } = req.params;

        const result = await db.query(
            `SELECT je.*,
                    COUNT(DISTINCT js.session_id) as linked_sessions_count,
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', ss.id,
                            'date', ss.date,
                            'duration', ss.time_spent,
                            'activity', ss.activity
                        )
                    ) FILTER (WHERE ss.id IS NOT NULL) as linked_sessions
             FROM journal_entries je
             LEFT JOIN journal_sessions js ON je.id = js.journal_id
             LEFT JOIN study_sessions ss ON js.session_id = ss.id
             WHERE je.user_id = $1 AND je.goal_id = $2
             GROUP BY je.id
             ORDER BY je.entry_date DESC, je.created_at DESC`,
            [userId, goalId]
        );

        res.json({ entries: result.rows });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

// Get a single journal entry
router.get('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const result = await db.query(
            `SELECT je.*,
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', ss.id,
                            'date', ss.date,
                            'duration', ss.time_spent,
                            'activity', ss.activity
                        )
                    ) FILTER (WHERE ss.id IS NOT NULL) as linked_sessions
             FROM journal_entries je
             LEFT JOIN journal_sessions js ON je.id = js.journal_id
             LEFT JOIN study_sessions ss ON js.session_id = ss.id
             WHERE je.id = $1 AND je.user_id = $2
             GROUP BY je.id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching journal entry:', error);
        res.status(500).json({ error: 'Failed to fetch journal entry' });
    }
});

// Create a new journal entry
router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { goal_id, entry_date, mood, thoughts, link_sessions, session_ids } = req.body;

        if (!goal_id) {
            return res.status(400).json({ error: 'Goal ID is required' });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Insert journal entry
            const result = await client.query(
                `INSERT INTO journal_entries
                 (user_id, goal_id, entry_date, mood, thoughts, link_sessions)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [userId, goal_id, entry_date || new Date(), mood, thoughts, link_sessions || false]
            );

            const journalEntry = result.rows[0];

            // If linking sessions, add them to junction table
            if (link_sessions && session_ids && session_ids.length > 0) {
                for (const sessionId of session_ids) {
                    await client.query(
                        `INSERT INTO journal_sessions (journal_id, session_id)
                         VALUES ($1, $2)
                         ON CONFLICT (journal_id, session_id) DO NOTHING`,
                        [journalEntry.id, sessionId]
                    );
                }
            }

            await client.query('COMMIT');

            // Fetch the complete entry with linked sessions
            const completeEntry = await db.query(
                `SELECT je.*,
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id', ss.id,
                                'date', ss.date,
                                'duration', ss.time_spent,
                                'activity', ss.activity
                            )
                        ) FILTER (WHERE ss.id IS NOT NULL) as linked_sessions
                 FROM journal_entries je
                 LEFT JOIN journal_sessions js ON je.id = js.journal_id
                 LEFT JOIN study_sessions ss ON js.session_id = ss.id
                 WHERE je.id = $1
                 GROUP BY je.id`,
                [journalEntry.id]
            );

            res.status(201).json(completeEntry.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating journal entry:', error);
        res.status(500).json({ error: 'Failed to create journal entry' });
    }
});

// Update a journal entry
router.put('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { entry_date, mood, thoughts, link_sessions, session_ids } = req.body;

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Update journal entry
            const result = await client.query(
                `UPDATE journal_entries
                 SET entry_date = COALESCE($1, entry_date),
                     mood = COALESCE($2, mood),
                     thoughts = COALESCE($3, thoughts),
                     link_sessions = COALESCE($4, link_sessions),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5 AND user_id = $6
                 RETURNING *`,
                [entry_date, mood, thoughts, link_sessions, id, userId]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Journal entry not found' });
            }

            // If session_ids provided, update linked sessions
            if (session_ids !== undefined) {
                // Remove existing links
                await client.query(
                    'DELETE FROM journal_sessions WHERE journal_id = $1',
                    [id]
                );

                // Add new links
                if (session_ids.length > 0) {
                    for (const sessionId of session_ids) {
                        await client.query(
                            `INSERT INTO journal_sessions (journal_id, session_id)
                             VALUES ($1, $2)
                             ON CONFLICT (journal_id, session_id) DO NOTHING`,
                            [id, sessionId]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            // Fetch the complete entry with linked sessions
            const completeEntry = await db.query(
                `SELECT je.*,
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id', ss.id,
                                'date', ss.date,
                                'duration', ss.time_spent,
                                'activity', ss.activity
                            )
                        ) FILTER (WHERE ss.id IS NOT NULL) as linked_sessions
                 FROM journal_entries je
                 LEFT JOIN journal_sessions js ON je.id = js.journal_id
                 LEFT JOIN study_sessions ss ON js.session_id = ss.id
                 WHERE je.id = $1
                 GROUP BY je.id`,
                [id]
            );

            res.json(completeEntry.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating journal entry:', error);
        res.status(500).json({ error: 'Failed to update journal entry' });
    }
});

// Delete a journal entry
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting journal entry:', error);
        res.status(500).json({ error: 'Failed to delete journal entry' });
    }
});

// Get stats for a journal entry (study time, tasks completed)
router.get('/:id/stats', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // First verify the journal entry belongs to the user
        const entryCheck = await db.query(
            'SELECT goal_id, entry_date FROM journal_entries WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (entryCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        const { goal_id, entry_date } = entryCheck.rows[0];
        const entryDateObj = new Date(entry_date);
        const weekStart = new Date(entryDateObj);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

        // Get study time for the week
        const studyTimeResult = await db.query(
            `SELECT COALESCE(SUM(time_spent), 0) as total_minutes
             FROM study_sessions
             WHERE user_id = $1
             AND goal_id = $2
             AND date >= $3 AND date <= $4`,
            [userId, goal_id, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
        );

        // Get tasks completed
        const tasksResult = await db.query(
            `SELECT COUNT(*) as completed_count
             FROM tasks
             WHERE user_id = $1
             AND goal_id = $2
             AND (status = 'DONE' OR completed = true)`,
            [userId, goal_id]
        );

        res.json({
            study_hours: Math.round((studyTimeResult.rows[0].total_minutes || 0) / 60 * 10) / 10,
            study_minutes: studyTimeResult.rows[0].total_minutes || 0,
            tasks_completed: parseInt(tasksResult.rows[0].completed_count) || 0,
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error fetching journal stats:', error);
        res.status(500).json({ error: 'Failed to fetch journal stats' });
    }
});

module.exports = router;
