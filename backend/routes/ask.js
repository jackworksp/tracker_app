const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { searchSimilar } = require('../services/embeddings');
const db = require('../database');

router.use(authenticateToken);

const SYSTEM_PROMPT = 'You are Vela AI, a helpful study assistant built into the Vela learning management system. Help users with their studies, answer questions, explain concepts, and assist with tasks. If relevant study data is provided below, use it and do not claim you lack access. Be concise and clear.';

const YOUTUBE_SYSTEM_PROMPT = `You are Vela AI. Answer the user's question concisely. At the very end of your response, on a new line, add a line in EXACTLY this format (no extra text, just the JSON array):
VELA_VIDEOS: ["search query 1", "search query 2", "search query 3"]
Choose 2-4 specific YouTube search queries for videos that are most relevant to your answer.`;

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ROUTER_MODEL = 'gemini-2.5-flash';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_ASK_MODEL = 'openai/gpt-oss-20b';
const ALLOWED_ASK_MODELS = new Set([
    DEFAULT_ASK_MODEL,
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
]);

function resolveAskModel(requestedModel) {
    const model = typeof requestedModel === 'string' && requestedModel.trim()
        ? requestedModel.trim()
        : DEFAULT_ASK_MODEL;
    if (!ALLOWED_ASK_MODELS.has(model)) return null;
    return model;
}

function toDateRange(routerResult) {
    const now = new Date();
    const formatLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    if (!routerResult || !routerResult.date || routerResult.date === 'today') {
        const start = new Date(now);
        const end = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end, label: formatLocalDate(start) };
    }
    if (routerResult.date === 'yesterday') {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end, label: formatLocalDate(start) };
    }
    if (routerResult.date === 'this_week') {
        const start = new Date(now);
        const day = start.getDay();
        const diff = (day + 6) % 7;
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end, label: `${formatLocalDate(start)} to ${formatLocalDate(end)}` };
    }
    if (routerResult.date === 'explicit' && routerResult.start_date && routerResult.end_date) {
        const start = new Date(routerResult.start_date);
        const end = new Date(routerResult.end_date);
        return { start, end, label: `${routerResult.start_date} to ${routerResult.end_date}` };
    }
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: formatLocalDate(start) };
}

function formatTaskLine(task) {
    const status = task.status || (task.completed ? 'DONE' : 'TODO');
    let reminder = '';
    if (task.reminder_time) {
        const d = new Date(task.reminder_time);
        const dateStr = d.toISOString().slice(0, 10);
        const timeStr = d.toISOString().slice(11, 16);
        reminder = ` (reminder: ${dateStr} ${timeStr})`;
    }
    const type = task.type ? ` [${task.type}]` : '';
    return `- [${status}] ${task.title}${type}${reminder}`;
}

function formatAttachmentLine(item) {
    const type = item.type ? ` (${item.type})` : '';
    const source = item.source ? ` [${item.source}]` : '';
    return `- ${item.title}${type}${source}`;
}

function formatVideoLine(item) {
    const source = item.source ? ` [${item.source}]` : '';
    return `- ${item.title}${source}`;
}

async function plannerIntent(latestUserMessage) {
    if (!latestUserMessage || !process.env.GROQ_API_KEY) {
        return { resources: [] };
    }

    const plannerSystemPrompt = [
        'You are a data planner for a study assistant app.',
        'Given the user question, decide what data to fetch from the database.',
        '',
        'Available resources:',
        '- "tasks": study tasks. Filters: completed (bool), status (TODO/IN_PROGRESS/DONE), type (TASK/WATCH/READ/PRACTICE/NOTES/LISTEN), date (today/yesterday/this_week/explicit/all). If explicit, also include start_date and end_date in YYYY-MM-DD.',
        '- "attachments": saved links and files. Filters: date (today/yesterday/this_week/explicit/all).',
        '- "videos": YouTube/watch-type resources. Filters: date (today/yesterday/this_week/explicit/all).',
        '',
        'Return JSON only in this shape:',
        '{ "resources": [ { "type": "tasks", "filters": { "completed": true, "date": "all" } } ] }',
        '',
        'Rules:',
        '- If no specific data is needed (e.g. a general knowledge question), return { "resources": [] }',
        '- Only set filters that are explicitly implied by the user question. Omit all others.',
        '- For "completed tasks" or "done tasks" questions: set completed=true, date="all"',
        '- For "pending/todo tasks": set completed=false, date="today" (or as specified)',
        '- If the user asks about tasks generally (no completion context): omit completed filter',
    ].join('\n');

    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: plannerSystemPrompt },
                { role: 'user', content: latestUserMessage }
            ],
            temperature: 0,
            max_tokens: 512,
            response_format: { type: 'json_object' }
        })
    });

    if (!res.ok) return { resources: [] };

    const data = await res.json();
    const text = (data?.choices?.[0]?.message?.content || '').trim();
    try {
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.resources)) return { resources: [] };
        return parsed;
    } catch {
        return { resources: [] };
    }
}

async function fetchTasksWithFilters(userId, filters = {}) {
    const { completed, status, type: taskType, date, start_date, end_date } = filters;

    let dateRange = null;
    if (date && date !== 'all') {
        const pseudo = date === 'explicit' ? { date, start_date, end_date } : { date };
        dateRange = toDateRange(pseudo);
    }

    const conditions = ['user_id = $1', 'parent_task_id IS NULL'];
    const params = [userId];

    const addParam = (val) => { params.push(val); return `$${params.length}`; };

    if (typeof completed === 'boolean') {
        conditions.push(`completed = ${addParam(completed)}`);
    }
    if (status) {
        conditions.push(`status = ${addParam(status)}`);
    }
    if (taskType) {
        conditions.push(`type = ${addParam(taskType)}`);
    }

    if (dateRange) {
        if (typeof completed !== 'boolean' || completed === false) {
            conditions.push(`reminder_time IS NOT NULL`);
            conditions.push(`reminder_time >= ${addParam(dateRange.start)}`);
            conditions.push(`reminder_time <= ${addParam(dateRange.end)}`);
        } else {
            conditions.push(`updated_at >= ${addParam(dateRange.start)}`);
            conditions.push(`updated_at <= ${addParam(dateRange.end)}`);
        }
    }

    const whereClause = conditions.join(' AND ');
    const result = await db.query(
        `SELECT id, title, type, status, completed, reminder_time
         FROM tasks
         WHERE ${whereClause}
         ORDER BY CASE WHEN completed THEN updated_at ELSE reminder_time END ASC NULLS LAST
         LIMIT 50`,
        params
    );

    if (result.rows.length > 0) return { rows: result.rows, hasToday: !!dateRange };

    if (typeof completed !== 'boolean' && !status && !taskType) {
        const fallback = await db.query(
            `SELECT id, title, type, status, completed, reminder_time
             FROM tasks
             WHERE user_id = $1 AND parent_task_id IS NULL AND completed = FALSE
             ORDER BY updated_at DESC
             LIMIT 10`,
            [userId]
        );
        return { rows: fallback.rows, hasToday: false };
    }

    return { rows: [], hasToday: false };
}

async function fetchAttachmentsInRange(userId, start, end) {
    const result = await db.query(
        `SELECT title, type, 'attachment'::text as source
         FROM attachments
         WHERE user_id = $1
           AND created_at >= $2
           AND created_at <= $3
         UNION ALL
         SELECT COALESCE(NULLIF(TRIM(t.attachment_url_title), ''), t.title) as title, 'link'::text as type, 'task'::text as source
         FROM tasks t
         WHERE t.user_id = $1
           AND t.attachment_url IS NOT NULL AND t.attachment_url != ''
           AND t.created_at >= $2 AND t.created_at <= $3
         UNION ALL
         SELECT COALESCE(NULLIF(TRIM(t.url_title), ''), t.title) as title, 'link'::text as type, 'task'::text as source
         FROM tasks t
         WHERE t.user_id = $1
           AND t.url IS NOT NULL AND t.url != ''
           AND t.created_at >= $2 AND t.created_at <= $3
         UNION ALL
         SELECT COALESCE(NULLIF(TRIM(ss.url_title), ''), ss.activity) as title, 'link'::text as type, 'session'::text as source
         FROM study_sessions ss
         WHERE ss.url IS NOT NULL AND ss.url != ''
           AND ss.subject_id IN (SELECT id FROM subjects WHERE user_id = $1)
           AND ss.date >= $2 AND ss.date <= $3`,
        [userId, start, end]
    );
    return result.rows;
}

async function fetchVideosInRange(userId, start, end) {
    const result = await db.query(
        `SELECT title, source FROM (
            SELECT a.title, 'attachment'::text as source
            FROM attachments a
            WHERE a.user_id = $1
              AND a.created_at >= $2 AND a.created_at <= $3
              AND (a.platform = 'youtube' OR a.url ILIKE '%youtube.com%' OR a.url ILIKE '%youtu.be%')
            UNION ALL
            SELECT COALESCE(NULLIF(TRIM(t.url_title), ''), t.title) as title, 'task'::text as source
            FROM tasks t
            WHERE t.user_id = $1
              AND t.created_at >= $2 AND t.created_at <= $3
              AND t.type = 'WATCH'
        ) v
        ORDER BY title ASC`,
        [userId, start, end]
    );
    return result.rows;
}

function buildDataBlock(label, sections) {
    const lines = [`--- Data for ${label} (server date) ---`];
    for (const section of sections) {
        if (!section || !section.items) continue;
        lines.push(`${section.title}:`);
        if (section.items.length === 0) {
            lines.push('- None');
        } else {
            lines.push(...section.items);
        }
    }
    lines.push('--- End data ---');
    return `\n\n${lines.join('\n')}`;
}

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

// POST /api/ask — streaming chat via Groq chat completions.
// When mode=youtube: Groq includes VELA_VIDEOS tag, we parse + search YouTube, then send a final SSE event.
router.post('/', async (req, res) => {
    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    try {
        const { messages, mode, model: requestedModel } = req.body;
        const isYouTubeMode = mode === 'youtube';
        const systemPrompt = isYouTubeMode ? YOUTUBE_SYSTEM_PROMPT : SYSTEM_PROMPT;
        const model = resolveAskModel(requestedModel);

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }
        if (!model) {
            return res.status(400).json({ error: 'Unsupported ask model requested' });
        }

        const baseMessages = messages
            .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
            .map(m => ({
                role: m.role,
                content: m.content.slice(0, 20000),
            }));

        const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';
        let dataBlock = '';
        try {
            if (!isYouTubeMode) {
                const plan = await plannerIntent(latestUserMessage);
                const sections = [];
                let label = 'your data';

                for (const spec of (plan.resources || [])) {
                    const filters = spec.filters || {};

                    if (spec.type === 'tasks') {
                        const tasks = await fetchTasksWithFilters(req.userId, filters);
                        const taskLines = tasks.rows.map(formatTaskLine);
                        const sectionTitle = tasks.hasToday ? 'Tasks' : 'Tasks (no date-matched reminders, showing filtered results)';
                        sections.push({ title: sectionTitle, items: taskLines });
                        if (tasks.rows.length > 0 || filters.date) {
                            const dr = filters.date && filters.date !== 'all'
                                ? toDateRange(filters)
                                : null;
                            label = dr ? dr.label : 'all time';
                        }
                    } else if (spec.type === 'attachments') {
                        const dr = toDateRange(filters);
                        label = dr.label;
                        const attachments = await fetchAttachmentsInRange(req.userId, dr.start, dr.end);
                        sections.push({ title: 'Attachments', items: attachments.map(formatAttachmentLine) });
                    } else if (spec.type === 'videos') {
                        const dr = toDateRange(filters);
                        label = dr.label;
                        const videos = await fetchVideosInRange(req.userId, dr.start, dr.end);
                        sections.push({ title: 'Videos', items: videos.map(formatVideoLine) });
                    }
                }

                if (sections.length > 0) {
                    dataBlock = buildDataBlock(label, sections);
                }
            }
        } catch (e) {
            console.error('Planner stage failed (non-fatal):', e.message);
        }

        const userQuery = messages.filter(m => m.role === 'user').at(-1)?.content || '';
        let ragContext = '';
        let sources = [];
        try {
            const chunks = await searchSimilar(req.userId, userQuery, 8);
            if (chunks.length > 0) {
                sources = chunks.map(c => ({
                    type: c.source_table,
                    id: c.source_id,
                    text: c.chunk_text.slice(0, 150),
                    similarity: parseFloat(c.similarity).toFixed(2),
                }));
                ragContext = '\n\n--- Relevant content from your Vela study data ---\n' +
                    chunks.map((c, i) =>
                        `[${i + 1}] (${c.source_table.replace('_', ' ')}) ${c.chunk_text}`
                    ).join('\n\n') +
                    '\n--- End of study data ---\n\nUse the above content to ground your answer where relevant. If it is not relevant, ignore it.';
            }
        } catch (e) {
            console.error('RAG retrieval failed (non-fatal):', e.message);
        }

        const activeSystemPrompt = systemPrompt + (dataBlock || '') + ragContext;
        const groqMessages = [
            { role: 'system', content: activeSystemPrompt },
            ...baseMessages,
        ];

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {
            const groqRes = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: groqMessages,
                    stream: true,
                    temperature: 0.2,
                    max_tokens: 4096,
                }),
            });

            if (!groqRes.ok) {
                const errText = await groqRes.text();
                res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
                return res.end();
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';

            for await (const chunk of groqRes.body) {
                buffer += decoder.decode(chunk, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (!data || data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed?.choices?.[0]?.delta?.content;
                        const text = typeof delta === 'string'
                            ? delta
                            : Array.isArray(delta)
                                ? delta.map(part => (typeof part?.text === 'string' ? part.text : '')).join('')
                                : '';
                        if (text) {
                            fullText += text;
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch (_) {}
                }
            }

            if (isYouTubeMode) {
                const match = fullText.match(/VELA_VIDEOS:\s*(\[[\s\S]*?\])/);
                if (match) {
                    try {
                        const suggestions = JSON.parse(match[1]);
                        const videos = [];
                        const seen = new Set();
                        for (const q of suggestions.slice(0, 4)) {
                            try {
                                const v = await searchYouTubeOne(String(q));
                                if (v && !seen.has(v.id)) {
                                    seen.add(v.id);
                                    videos.push(v);
                                }
                            } catch {}
                        }
                        if (videos.length > 0) {
                            res.write(`data: ${JSON.stringify({ videos })}\n\n`);
                        }
                    } catch {}
                }
            }

            if (sources.length > 0) {
                res.write(`data: ${JSON.stringify({ sources })}\n\n`);
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('Ask route error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get response' })}\n\n`);
            res.end();
        }
    } catch (error) {
        console.error('Ask route preflight error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message || 'Failed to connect to AI' });
        }
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to connect to AI' })}\n\n`);
        res.end();
    }
});

module.exports = router;
