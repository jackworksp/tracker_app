const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/support/report
router.post('/report', async (req, res) => {
    const { title, description, type } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
    }

    const CLICKUP_TOKEN = process.env.CLICKUP_API_TOKEN;
    const CLICKUP_LIST_ID = '901613296977';

    if (!CLICKUP_TOKEN) {
        return res.status(500).json({ error: 'Support not configured' });
    }

    try {
        const tagName = type === 'bug' ? 'bug' : type === 'enhancement' ? 'enchance' : 'feedback';

        const response = await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`, {
            method: 'POST',
            headers: {
                'Authorization': CLICKUP_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: title,
                description: `${description}\n\n---\nSubmitted by user: ${req.userId}`,
                tags: [tagName],
                status: 'Open'
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('ClickUp error:', err);
            return res.status(502).json({ error: 'Failed to submit to ClickUp' });
        }

        const data = await response.json();
        res.json({ success: true, taskId: data.id, taskUrl: data.url });
    } catch (err) {
        console.error('Support report error:', err);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

module.exports = router;
