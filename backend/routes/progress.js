const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all progress data (Global)
router.get('/all', async (req, res) => {
    try {
        const sessions = await db.query('SELECT * FROM study_sessions ORDER BY date DESC');
        // For global view, we might not need topics/revisions mix, or we fetch all.
        // Let's fetch all relevant global data.
        const topics = await db.query('SELECT * FROM topics ORDER BY id');
        const revisionItems = await db.query('SELECT * FROM revision_items ORDER BY created_at DESC');

        res.json({
            topics: topics.rows,
            sessions: sessions.rows,
            revisionItems: revisionItems.rows
        });
    } catch (err) {
        console.error('Error fetching global progress:', err);
        res.status(500).json({ error: 'Failed to fetch global progress data' });
    }
});

// GET all progress data for a subject
router.get('/:subject_id', async (req, res) => {
    try {
        const { subject_id } = req.params;

        const topics = await db.query('SELECT * FROM topics WHERE subject_id = $1 ORDER BY id', [subject_id]);
        const sessions = await db.query('SELECT * FROM study_sessions WHERE subject_id = $1 ORDER BY date DESC', [subject_id]);
        const revisionItems = await db.query('SELECT * FROM revision_items WHERE subject_id = $1 ORDER BY created_at DESC', [subject_id]);

        res.json({
            topics: topics.rows,
            sessions: sessions.rows,
            revisionItems: revisionItems.rows
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
        const { subject_id, date, day, activity, time_spent, topics_covered, notes, type, url } = req.body;

        // subject_id is now optional
        
        const sessionType = type || 'STUDY';

        const result = await db.query(
            `INSERT INTO study_sessions (subject_id, date, day, activity, time_spent, topics_covered, notes, type, url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [subject_id || null, date, day, activity, time_spent, topics_covered, notes, sessionType, url]
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
        const { activity, time_spent, topics_covered, notes, type, url } = req.body;

        const result = await db.query(
            `UPDATE study_sessions 
             SET activity = $1, time_spent = $2, topics_covered = $3, notes = $4, type = $5, url = $6
             WHERE id = $7 RETURNING *`,
            [activity, time_spent, topics_covered, notes, type || 'STUDY', url, id]
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
