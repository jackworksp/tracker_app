const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const GEMINI_MODEL = 'gemini-2.5-flash';

async function searchYouTubeOne(query) {
    const ytsr = (await import('ytsr')).default;
    const results = await ytsr(query, { limit: 3 });
    const video = results.items.find(i => i.type === 'video');
    if (!video) return null;
    return {
        id: video.id,
        title: video.title,
        url: video.url,
        thumbnail: video.bestThumbnail?.url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        duration: video.duration,
        author: video.author?.name || '',
    };
}

// POST /api/youtube/search
// Ask Gemini to suggest specific video titles, then find each on YouTube
router.post('/search', async (req, res) => {
    try {
        const prompt = (req.body && req.body.prompt) ? String(req.body.prompt).trim() : '';
        if (!prompt) return res.status(400).json({ error: 'prompt is required' });
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        // Ask Gemini to suggest specific YouTube video titles relevant to this topic
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `Based on this message, suggest 2-4 specific YouTube video titles or search queries that would be most helpful and relevant to watch. Reply ONLY with a JSON array of strings, nothing else. Example: ["title one", "title two"]\n\nMessage: ${prompt.slice(0, 600)}` }]
                }],
                generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
            }),
        });

        if (!geminiRes.ok) return res.status(500).json({ error: 'Failed to get video suggestions from Gemini' });

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        // Parse JSON array from Gemini's reply
        let suggestions = [];
        try {
            const match = rawText.match(/\[[\s\S]*?\]/);
            if (match) suggestions = JSON.parse(match[0]);
        } catch {}

        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            return res.json({ videos: [], query: prompt });
        }

        // Search YouTube for each suggested title, take top result
        const videos = [];
        for (const suggestion of suggestions.slice(0, 5)) {
            try {
                const video = await searchYouTubeOne(String(suggestion));
                if (video) videos.push(video);
            } catch { /* skip failed individual searches */ }
        }

        return res.json({ videos, query: suggestions.join(' · '), suggestions });
    } catch (error) {
        console.error('YouTube search error:', error);
        return res.status(500).json({ error: `YouTube search failed: ${error.message}` });
    }
});

module.exports = router;
