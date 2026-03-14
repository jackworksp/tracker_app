const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const SYSTEM_PROMPT = 'You are Vela AI, a helpful study assistant built into the Vela learning management system. Help users with their studies, answer questions, explain concepts, and assist with tasks. Be concise and clear.';

const YOUTUBE_SYSTEM_PROMPT = `You are Vela AI. Answer the user's question concisely. At the very end of your response, on a new line, add a line in EXACTLY this format (no extra text, just the JSON array):
VELA_VIDEOS: ["search query 1", "search query 2", "search query 3"]
Choose 2-4 specific YouTube search queries for videos that are most relevant to your answer.`;

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

// POST /api/ask  — streaming chat via Gemini REST API
// When mode=youtube: Gemini includes VELA_VIDEOS tag, we parse + search YouTube, send as final SSE event
router.post('/', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const { messages, mode } = req.body;
    const isYouTubeMode = mode === 'youtube';
    const systemPrompt = isYouTubeMode ? YOUTUBE_SYSTEM_PROMPT : SYSTEM_PROMPT;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array is required' });
    }

    const baseContents = messages
        .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content.slice(0, 20000) }],
        }));

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood.' }] },
        ...baseContents,
    ];

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: { maxOutputTokens: 4096 },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
            return res.end();
        }

        const reader = geminiRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        fullText += text;
                        // Stream all text (we'll strip VELA_VIDEOS on the frontend)
                        res.write(`data: ${JSON.stringify({ text })}\n\n`);
                    }
                } catch (_) {}
            }
        }

        // In YouTube mode: parse VELA_VIDEOS from full response, search YouTube, send as event
        if (isYouTubeMode) {
            const match = fullText.match(/VELA_VIDEOS:\s*(\[[\s\S]*?\])/);
            if (match) {
                try {
                    const suggestions = JSON.parse(match[1]);
                    const videos = [];
                    for (const q of suggestions.slice(0, 4)) {
                        try {
                            const v = await searchYouTubeOne(String(q));
                            if (v) videos.push(v);
                        } catch {}
                    }
                    if (videos.length > 0) {
                        res.write(`data: ${JSON.stringify({ videos })}\n\n`);
                    }
                } catch {}
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Ask route error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get response' })}\n\n`);
        res.end();
    }
});

module.exports = router;
