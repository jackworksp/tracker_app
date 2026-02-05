const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all progress data (Global) with pagination
router.get('/all', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
        const offset = (page - 1) * limit;

        // Filters
        const source = req.query.source; // 'youtube', 'instagram'
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const goalId = req.query.goal_id;

        // Build Session Query
        let sessionQuery = 'SELECT * FROM study_sessions WHERE 1=1';
        const sessionParams = [];
        
        if (source === 'youtube') {
            sessionQuery += ` AND (url ILIKE '%youtube%' OR url ILIKE '%youtu.be%')`;
        } else if (source === 'instagram') {
            sessionQuery += ` AND (url ILIKE '%instagram%' OR activity ILIKE '%instagram%')`;
        }
        
        if (startDate) {
            sessionParams.push(startDate);
            sessionQuery += ` AND date >= $${sessionParams.length}`;
        }
        if (endDate) {
            sessionParams.push(endDate);
            sessionQuery += ` AND date <= $${sessionParams.length}`;
        }
         if (goalId) {
            sessionParams.push(goalId);
            sessionQuery += ` AND goal_id = $${sessionParams.length}`;
        }
        
        // Add limit/offset to params
        sessionParams.push(limit, offset);
        sessionQuery += ` ORDER BY date DESC LIMIT $${sessionParams.length - 1} OFFSET $${sessionParams.length}`;

        const sessions = await db.query(sessionQuery, sessionParams);
        const topics = await db.query('SELECT * FROM topics ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
        const revisionItems = await db.query('SELECT * FROM revision_items ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);

        // Get counts for pagination
        const sessionsCount = await db.query('SELECT COUNT(*) FROM study_sessions');
        const topicsCount = await db.query('SELECT COUNT(*) FROM topics');
        const revisionItemsCount = await db.query('SELECT COUNT(*) FROM revision_items');

        const sessionsTotal = parseInt(sessionsCount.rows[0].count);
        const topicsTotal = parseInt(topicsCount.rows[0].count);
        const revisionItemsTotal = parseInt(revisionItemsCount.rows[0].count);

        res.json({
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
        console.error('Error fetching global progress:', err);
        res.status(500).json({ error: 'Failed to fetch global progress data' });
    }
});

// GET all progress data for a subject with pagination
router.get('/:subject_id', async (req, res) => {
    try {
        const { subject_id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
        const offset = (page - 1) * limit;

        // Filters
        const source = req.query.source; // 'youtube', 'instagram'
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const goalId = req.query.goal_id;

        // Build Session Query
        let sessionQuery = 'SELECT * FROM study_sessions WHERE subject_id = $1';
        const sessionParams = [subject_id];
        
        if (source === 'youtube') {
            sessionQuery += ` AND (url ILIKE '%youtube%' OR url ILIKE '%youtu.be%')`;
        } else if (source === 'instagram') {
            sessionQuery += ` AND (url ILIKE '%instagram%' OR activity ILIKE '%instagram%')`;
        }
        
        if (startDate) {
            sessionParams.push(startDate);
            sessionQuery += ` AND date >= $${sessionParams.length}`;
        }
        if (endDate) {
            sessionParams.push(endDate);
            sessionQuery += ` AND date <= $${sessionParams.length}`;
        }
         if (goalId) {
            sessionParams.push(goalId);
            sessionQuery += ` AND goal_id = $${sessionParams.length}`;
        }
        
        // Add limit/offset to params
        sessionParams.push(limit, offset);
        sessionQuery += ` ORDER BY date DESC LIMIT $${sessionParams.length - 1} OFFSET $${sessionParams.length}`;

        const sessions = await db.query(sessionQuery, sessionParams);

        const topics = await db.query('SELECT * FROM topics WHERE subject_id = $1 ORDER BY id LIMIT $2 OFFSET $3', [subject_id, limit, offset]);
        const revisionItems = await db.query('SELECT * FROM revision_items WHERE subject_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [subject_id, limit, offset]);

        // Get counts for pagination
        const topicsCount = await db.query('SELECT COUNT(*) FROM topics WHERE subject_id = $1', [subject_id]);
        const sessionsCount = await db.query('SELECT COUNT(*) FROM study_sessions WHERE subject_id = $1', [subject_id]);
        const revisionItemsCount = await db.query('SELECT COUNT(*) FROM revision_items WHERE subject_id = $1', [subject_id]);

        const topicsTotal = parseInt(topicsCount.rows[0].count);
        const sessionsTotal = parseInt(sessionsCount.rows[0].count);
        const revisionItemsTotal = parseInt(revisionItemsCount.rows[0].count);

        res.json({
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
        console.error('Error fetching progress:', err);
        res.status(500).json({ error: 'Failed to fetch progress data' });
    }
});

// UPDATE topic completion status
router.put('/topics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        const result = await db.query(
            'UPDATE topics SET completed = $1 WHERE id = $2 RETURNING *',
            [completed, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating topic:', err);
        res.status(500).json({ error: 'Failed to update topic' });
    }
});

// CREATE new study session
router.post('/sessions', async (req, res) => {
    try {
        const { subject_id, date, day, activity, time_spent, topics_covered, notes, type, url, goal_id } = req.body;

        // subject_id is now optional

        const sessionType = type || 'STUDY';

        const result = await db.query(
            `INSERT INTO study_sessions (subject_id, date, day, activity, time_spent, topics_covered, notes, type, url, goal_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [subject_id || null, date, day, activity, time_spent, topics_covered, notes, sessionType, url, goal_id || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({ error: 'Failed to create study session' });
    }
});

// UPDATE study session
router.put('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { activity, time_spent, topics_covered, notes, type, url, goal_id } = req.body;

        const result = await db.query(
            `UPDATE study_sessions
             SET activity = $1, time_spent = $2, topics_covered = $3, notes = $4, type = $5, url = $6, goal_id = $7
             WHERE id = $8 RETURNING *`,
            [activity, time_spent, topics_covered, notes, type || 'STUDY', url, goal_id !== undefined ? goal_id : null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating session:', err);
        res.status(500).json({ error: 'Failed to update study session' });
    }
});

// DELETE study session
router.delete('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM study_sessions WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (err) {
        console.error('Error deleting session:', err);
        res.status(500).json({ error: 'Failed to delete study session' });
    }
});

// INCREMENT revision count for a session
router.post('/sessions/:id/revise', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `UPDATE study_sessions 
             SET revision_count = COALESCE(revision_count, 0) + 1
             WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error incrementing revision count:', err);
        res.status(500).json({ error: 'Failed to increment revision count' });
    }
});

// CREATE new revision item
router.post('/revisions', async (req, res) => {
    try {
        const { subject_id, title, category } = req.body;

        if (!subject_id) {
            return res.status(400).json({ error: 'subject_id is required' });
        }

        const result = await db.query(
            `INSERT INTO revision_items (subject_id, title, category)
             VALUES ($1, $2, $3) RETURNING *`,
            [subject_id, title, category]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating revision item:', err);
        res.status(500).json({ error: 'Failed to create revision item' });
    }
});

// UPDATE revision item (mark as revised)
router.put('/revisions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `UPDATE revision_items 
             SET revision_count = revision_count + 1,
                 last_revised = CURRENT_DATE
             WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Revision item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating revision:', err);
        res.status(500).json({ error: 'Failed to update revision item' });
    }
});

// DELETE revision item
router.delete('/revisions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM revision_items WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Revision item not found' });
        }

        res.json({ message: 'Revision item deleted successfully' });
    } catch (err) {
        console.error('Error deleting revision:', err);
        res.status(500).json({ error: 'Failed to delete revision item' });
    }
});

// CREATE new topic
router.post('/topics', async (req, res) => {
    try {
        const { subject_id, name, category, completed } = req.body;

        if (!subject_id || !name) {
            return res.status(400).json({ error: 'subject_id and name are required' });
        }

        const result = await db.query(
            `INSERT INTO topics (subject_id, name, category, completed)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [subject_id, name, category || 'General', completed || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating topic:', err);
        res.status(500).json({ error: 'Failed to create topic' });
    }
});

// SEED initial AWS topics for a subject
router.post('/seed/:subject_id', async (req, res) => {
    try {
        const { subject_id } = req.params;
        const topics = [
            { name: 'DynamoDB', completed: false, category: 'Database' },
            { name: 'Lambda', completed: false, category: 'Compute' },
            { name: 'S3', completed: false, category: 'Storage' },
            { name: 'API Gateway', completed: false, category: 'Networking' },
            { name: 'CloudFormation', completed: false, category: 'Infrastructure' },
            { name: 'IAM', completed: false, category: 'Security' },
            { name: 'CloudWatch', completed: false, category: 'Monitoring' },
            { name: 'EC2', completed: false, category: 'Compute' },
            { name: 'VPC', completed: false, category: 'Networking' },
            { name: 'SNS/SQS', completed: false, category: 'Messaging' },
            { name: 'Kinesis', completed: false, category: 'Streaming' },
            { name: 'CodeDeploy', completed: false, category: 'CI/CD' },
            { name: 'Elastic Beanstalk', completed: false, category: 'Deployment' },
            { name: 'ECS/Fargate', completed: false, category: 'Containers' },
            { name: 'ElastiCache', completed: false, category: 'Database' }
        ];

        // Check if topics already exist for this subject
        const existing = await db.query('SELECT COUNT(*) FROM topics WHERE subject_id = $1', [subject_id]);
        if (parseInt(existing.rows[0].count) > 0) {
            return res.json({ message: 'Topics already seeded for this subject' });
        }

        // Insert topics
        for (const topic of topics) {
            await db.query(
                'INSERT INTO topics (subject_id, name, completed, category) VALUES ($1, $2, $3, $4)',
                [subject_id, topic.name, topic.completed, topic.category]
            );
        }

        res.json({ message: 'Topics seeded successfully', count: topics.length });
    } catch (err) {
        console.error('Error seeding topics:', err);
        res.status(500).json({ error: 'Failed to seed topics' });
    }
});

module.exports = router;
