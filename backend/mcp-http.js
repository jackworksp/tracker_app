/**
 * MCP HTTP/SSE Server - mounts inside the Express backend
 * Accessible at /vela/mcp/sse (GET) and /vela/mcp/messages (POST)
 * Auth: x-api-key header or Authorization: Bearer <key>
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Tool Implementations ───────────────────────────────────────────────────

async function getTasksTool(pool, userId, args) {
    const { status, subject_id, created_after, created_before, updated_after, updated_before, include_subtasks = true, limit = 50 } = args;

    const params = [userId];
    let p = 2;
    const where = ['t.user_id = $1', 't.parent_task_id IS NULL'];

    if (status)          { where.push(`t.status = $${p++}`);                          params.push(status); }
    if (subject_id)      { where.push(`t.subject_id = $${p++}`);                      params.push(subject_id); }
    if (updated_after)   { where.push(`t.updated_at >= $${p++}::date`);               params.push(updated_after); }
    if (updated_before)  { where.push(`t.updated_at < ($${p++}::date + interval '1 day')`); params.push(updated_before); }
    if (created_after)   { where.push(`t.created_at >= $${p++}::date`);               params.push(created_after); }
    if (created_before)  { where.push(`t.created_at < ($${p++}::date + interval '1 day')`); params.push(created_before); }

    params.push(limit);
    const tasks = (await pool.query(`
        SELECT t.id, t.user_id, t.title, t.content, t.status, t.subject_id, t.type,
               t.url, t.attachment_url, t.completed, t.tags, t.rating, t.goal_id,
               t.parent_task_id, t.subtasks, t.resources, t.reminder_time,
               t.created_at, t.updated_at,
               s.name as subject_name, s.color as subject_color
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id AND s.user_id = t.user_id
        WHERE ${where.join(' AND ')}
        ORDER BY CASE WHEN t.status='IN_PROGRESS' THEN 1 WHEN t.status='TODO' THEN 2 ELSE 3 END,
                 t.rating DESC NULLS LAST, t.created_at DESC
        LIMIT $${p}
    `, params)).rows;

    if (include_subtasks && tasks.length > 0) {
        const ids = tasks.map(t => t.id);
        const subs = (await pool.query(
            `SELECT id, parent_task_id, title, content, status, completed, type, created_at, updated_at
             FROM tasks WHERE parent_task_id = ANY($1) ORDER BY created_at ASC`, [ids]
        )).rows;
        const byParent = {};
        subs.forEach(s => { (byParent[s.parent_task_id] = byParent[s.parent_task_id] || []).push(s); });
        tasks.forEach(t => { t.all_subtasks = [...(t.subtasks || []), ...(byParent[t.id] || [])]; });
    }

    return { success: true, count: tasks.length, tasks };
}

async function getSessionsTool(pool, userId, args) {
    const { subject_id, goal_id, start_date, end_date, limit = 50 } = args;

    const params = [userId];
    let p = 2;
    const where = [`ss.subject_id IN (SELECT id FROM subjects WHERE user_id = $1)`];

    if (subject_id) { where.push(`ss.subject_id = $${p++}`); params.push(subject_id); }
    if (goal_id)    { where.push(`ss.goal_id = $${p++}`);    params.push(goal_id); }
    if (start_date) { where.push(`ss.date >= $${p++}`);      params.push(start_date); }
    if (end_date)   { where.push(`ss.date <= $${p++}`);      params.push(end_date); }

    params.push(limit);
    const sessions = (await pool.query(`
        SELECT ss.id, ss.subject_id, ss.goal_id, ss.date, ss.day, ss.activity,
               ss.time_spent, ss.topics_covered, ss.notes, ss.revision_count,
               ss.type, ss.url, ss.created_at,
               s.name as subject_name, s.color as subject_color, s.icon as subject_icon,
               g.title as goal_title
        FROM study_sessions ss
        LEFT JOIN subjects s ON ss.subject_id = s.id
        LEFT JOIN goals g ON ss.goal_id = g.id
        WHERE ${where.join(' AND ')}
        ORDER BY ss.date DESC, ss.created_at DESC
        LIMIT $${p}
    `, params)).rows;

    const total = sessions.reduce((s, r) => s + (r.time_spent || 0), 0);
    return {
        success: true, count: sessions.length, sessions,
        statistics: { total_sessions: sessions.length, total_time_spent_minutes: total, total_time_spent_hours: (total / 60).toFixed(2) }
    };
}

async function addTaskTool(pool, userId, args) {
    const { title, content, status = 'TODO', subject_id, type = 'TASK', url, attachment_url, tags, goal_id, rating, subtasks, resources, parent_task_id } = args;
    if (!title?.trim()) throw new Error('title is required');

    const result = await pool.query(`
        INSERT INTO tasks (user_id, title, content, status, subject_id, type, url, attachment_url, tags, goal_id, rating, subtasks, resources, parent_task_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *
    `, [userId, title.trim(), content || null, status, subject_id || null, type, url || null, attachment_url || null,
        tags || [], goal_id || null, rating || null, JSON.stringify(subtasks || []), JSON.stringify(resources || []), parent_task_id || null]);

    return { success: true, message: 'Task created successfully', task: result.rows[0] };
}

async function addSubtaskTool(pool, userId, args) {
    const { task_id, title, description, completed = false } = args;
    if (!task_id) throw new Error('task_id is required');
    if (!title?.trim()) throw new Error('title is required');

    const parent = await pool.query('SELECT id, type FROM tasks WHERE id = $1 AND user_id = $2', [task_id, userId]);
    if (!parent.rows.length) throw new Error(`Task ${task_id} not found`);
    if (parent.rows[0].type !== 'EXPLORATORY') throw new Error('Parent task must be of type EXPLORATORY');

    const result = await pool.query(`
        INSERT INTO tasks (user_id, title, content, parent_task_id, type, status, completed)
        VALUES ($1, $2, $3, $4, 'TASK', 'TODO', $5) RETURNING *
    `, [userId, title.trim(), description || null, task_id, completed]);

    return { success: true, message: 'Subtask created successfully', subtask: result.rows[0] };
}

async function getGoalsTool(pool, userId, args) {
    const { status, category } = args;
    const params = [userId];
    let p = 2;
    const where = ['g.user_id = $1'];
    if (status)   { where.push(`g.status = $${p++}`);   params.push(status); }
    if (category) { where.push(`g.category = $${p++}`); params.push(category); }

    const goals = (await pool.query(`
        SELECT g.id, g.title, g.description, g.category, g.status, g.target_date,
               g.image_url, g.created_at, g.updated_at,
               COUNT(DISTINCT t.id) AS total_tasks,
               SUM(CASE WHEN t.completed THEN 1 ELSE 0 END) AS completed_tasks,
               COUNT(DISTINCT ss.id) AS total_sessions,
               COALESCE(SUM(ss.time_spent), 0) AS total_minutes_studied
        FROM goals g
        LEFT JOIN tasks t ON t.goal_id = g.id
        LEFT JOIN study_sessions ss ON ss.goal_id = g.id
        WHERE ${where.join(' AND ')}
        GROUP BY g.id ORDER BY g.created_at DESC
    `, params)).rows.map(g => ({
        ...g,
        total_tasks: parseInt(g.total_tasks) || 0,
        completed_tasks: parseInt(g.completed_tasks) || 0,
        pending_tasks: (parseInt(g.total_tasks) || 0) - (parseInt(g.completed_tasks) || 0),
        total_sessions: parseInt(g.total_sessions) || 0,
        total_hours_studied: ((parseInt(g.total_minutes_studied) || 0) / 60).toFixed(2),
        task_completion_pct: (parseInt(g.total_tasks) || 0) > 0
            ? Math.round((parseInt(g.completed_tasks) / parseInt(g.total_tasks)) * 100) : 0
    }));

    return { success: true, count: goals.length, goals };
}

async function updateTaskTool(pool, userId, args) {
    const { task_id, title, content, status, completed, rating, goal_id, subject_id, tags, url } = args;
    if (!task_id) throw new Error('task_id is required');

    const check = await pool.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [task_id, userId]);
    if (!check.rows.length) throw new Error(`Task ${task_id} not found or does not belong to you`);

    const setClauses = [];
    const params = [];
    let p = 1;

    if (title !== undefined)      { setClauses.push(`title = $${p++}`);      params.push(title.trim()); }
    if (content !== undefined)    { setClauses.push(`content = $${p++}`);    params.push(content); }
    if (status !== undefined)     { setClauses.push(`status = $${p++}`);     params.push(status); }
    if (completed !== undefined)  { setClauses.push(`completed = $${p++}`);  params.push(completed); }
    if (rating !== undefined)     { setClauses.push(`rating = $${p++}`);     params.push(rating); }
    if (goal_id !== undefined)    { setClauses.push(`goal_id = $${p++}`);    params.push(goal_id || null); }
    if (subject_id !== undefined) { setClauses.push(`subject_id = $${p++}`); params.push(subject_id || null); }
    if (tags !== undefined)       { setClauses.push(`tags = $${p++}`);       params.push(tags); }
    if (url !== undefined)        { setClauses.push(`url = $${p++}`);        params.push(url); }

    if (!setClauses.length) throw new Error('No fields provided to update');
    setClauses.push('updated_at = NOW()');
    params.push(task_id, userId);

    const result = await pool.query(
        `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${p++} AND user_id = $${p} RETURNING *`,
        params
    );
    return { success: true, message: 'Task updated successfully', task: result.rows[0] };
}

async function deleteTaskTool(pool, userId, args) {
    const { task_id } = args;
    if (!task_id) throw new Error('task_id is required');

    const check = await pool.query('SELECT id, title FROM tasks WHERE id = $1 AND user_id = $2', [task_id, userId]);
    if (!check.rows.length) throw new Error(`Task ${task_id} not found or does not belong to you`);

    const title = check.rows[0].title;
    await pool.query('DELETE FROM tasks WHERE parent_task_id = $1', [task_id]);
    await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [task_id, userId]);
    return { success: true, message: `Task "${title}" deleted successfully` };
}

async function addSessionTool(pool, userId, args) {
    const { activity, time_spent, subject_id, date, type = 'STUDY', notes, topics_covered, url, goal_id, revision_count = 0 } = args;
    if (!activity?.trim()) throw new Error('activity is required');
    if (time_spent === undefined) throw new Error('time_spent (minutes) is required');

    if (subject_id) {
        const check = await pool.query('SELECT id FROM subjects WHERE id = $1 AND user_id = $2', [subject_id, userId]);
        if (!check.rows.length) throw new Error(`Subject ${subject_id} not found`);
    }

    const sessionDate = date ? new Date(date) : new Date();
    const result = await pool.query(`
        INSERT INTO study_sessions (subject_id, goal_id, date, day, activity, time_spent, topics_covered, notes, revision_count, type, url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [subject_id || null, goal_id || null, sessionDate.toISOString().split('T')[0],
        DAYS[sessionDate.getDay()], activity.trim(), time_spent,
        topics_covered || '', notes || '', revision_count, type, url || null]);

    return { success: true, message: `Session "${activity}" logged (${time_spent} min)`, session: result.rows[0] };
}

async function getSubjectsTool(pool, userId) {
    const subjects = (await pool.query(`
        SELECT s.id, s.name, s.color, s.icon, s.created_at,
               COUNT(DISTINCT t.id) AS total_tasks,
               SUM(CASE WHEN t.completed THEN 1 ELSE 0 END) AS completed_tasks,
               COUNT(DISTINCT ss.id) AS total_sessions,
               COALESCE(SUM(ss.time_spent), 0) AS total_minutes_studied
        FROM subjects s
        LEFT JOIN tasks t ON t.subject_id = s.id
        LEFT JOIN study_sessions ss ON ss.subject_id = s.id
        WHERE s.user_id = $1
        GROUP BY s.id ORDER BY s.name ASC
    `, [userId])).rows.map(s => ({
        ...s,
        total_tasks: parseInt(s.total_tasks) || 0,
        completed_tasks: parseInt(s.completed_tasks) || 0,
        total_sessions: parseInt(s.total_sessions) || 0,
        total_hours_studied: ((parseInt(s.total_minutes_studied) || 0) / 60).toFixed(2)
    }));

    return { success: true, count: subjects.length, subjects };
}

// ─── Tool Schemas ────────────────────────────────────────────────────────────

const TOOL_SCHEMAS = [
    {
        name: 'get_tasks',
        description: 'Retrieve tasks with optional filtering. Returns top-level tasks with subtasks.',
        inputSchema: { type: 'object', properties: {
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
            subject_id: { type: 'number' },
            created_after: { type: 'string', description: 'ISO date YYYY-MM-DD' },
            created_before: { type: 'string' },
            include_subtasks: { type: 'boolean', default: true },
            limit: { type: 'number', default: 50 }
        }}
    },
    {
        name: 'get_sessions',
        description: 'Retrieve study sessions with statistics.',
        inputSchema: { type: 'object', properties: {
            subject_id: { type: 'number' },
            goal_id: { type: 'number' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            limit: { type: 'number', default: 50 }
        }}
    },
    {
        name: 'add_task',
        description: 'Create a new task.',
        inputSchema: { type: 'object', required: ['title'], properties: {
            title: { type: 'string' }, content: { type: 'string' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
            subject_id: { type: 'number' }, type: { type: 'string', enum: ['TASK', 'EXPLORATORY'], default: 'TASK' },
            url: { type: 'string' }, goal_id: { type: 'number' }, rating: { type: 'number', minimum: 1, maximum: 5 },
            tags: { type: 'array', items: { type: 'string' } }
        }}
    },
    {
        name: 'add_subtask',
        description: 'Add a subtask to an EXPLORATORY task.',
        inputSchema: { type: 'object', required: ['task_id', 'title'], properties: {
            task_id: { type: 'number' }, title: { type: 'string' },
            description: { type: 'string' }, completed: { type: 'boolean', default: false }
        }}
    },
    {
        name: 'get_goals',
        description: 'Retrieve goals with task completion stats and study time.',
        inputSchema: { type: 'object', properties: {
            status: { type: 'string' }, category: { type: 'string' }
        }}
    },
    {
        name: 'update_task',
        description: 'Update a task — status, completion, title, rating, goal link, etc.',
        inputSchema: { type: 'object', required: ['task_id'], properties: {
            task_id: { type: 'number' }, title: { type: 'string' }, content: { type: 'string' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
            completed: { type: 'boolean' }, rating: { type: 'number', minimum: 1, maximum: 5 },
            goal_id: { type: 'number' }, subject_id: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } }, url: { type: 'string' }
        }}
    },
    {
        name: 'delete_task',
        description: 'Permanently delete a task and its subtasks.',
        inputSchema: { type: 'object', required: ['task_id'], properties: {
            task_id: { type: 'number' }
        }}
    },
    {
        name: 'add_session',
        description: 'Log a study session.',
        inputSchema: { type: 'object', required: ['activity', 'time_spent'], properties: {
            activity: { type: 'string' }, time_spent: { type: 'number' },
            subject_id: { type: 'number' }, date: { type: 'string' },
            type: { type: 'string', enum: ['STUDY', 'WATCH', 'READ', 'PRACTICE', 'NOTES', 'LISTEN'], default: 'STUDY' },
            notes: { type: 'string' }, topics_covered: { type: 'string' },
            url: { type: 'string' }, goal_id: { type: 'number' }
        }}
    },
    {
        name: 'get_subjects',
        description: 'Retrieve all subjects with task counts and study hours.',
        inputSchema: { type: 'object', properties: {} }
    }
];

// ─── MCP Router Setup ────────────────────────────────────────────────────────

async function setupMcpRouter(pool) {
    const express = require('express');
    const router = express.Router();

    // Dynamic import of ESM MCP SDK into CJS backend
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

    // Try to import StreamableHTTP transport (MCP SDK 1.1+, used by Claude.ai)
    let StreamableHTTPServerTransport = null;
    try {
        const mod = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
        StreamableHTTPServerTransport = mod.StreamableHTTPServerTransport;
    } catch (_) { /* older SDK, fall back to SSE only */ }

    // Active sessions: sessionId → { transport, server }
    const sessions = new Map();

    // Auth middleware — accepts JWT tokens (from OAuth) or mcp_api_key
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    async function authenticate(req, res, next) {
        const token = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim()
                   || req.headers['x-api-key']
                   || req.query.api_key;
        if (!token) {
            // MCP spec (2025-03-26) requires resource_metadata parameter so clients
            // know where to discover OAuth endpoints
            res.set('WWW-Authenticate', 'Bearer resource_metadata="https://seiyul.in/.well-known/oauth-protected-resource/vela/mcp/sse"');
            return res.status(401).json({ error: 'Authentication required.' });
        }

        // Try JWT first (issued by OAuth flow or app login)
        // Pass ignoreExpiration:false but do NOT validate audience here —
        // the resource server accepts tokens for its own URL.
        try {
            const decoded = jwt.verify(token, JWT_SECRET, { complete: false, ignoreExpiration: false });
            if (decoded && decoded.userId) {
                console.log(`MCP auth OK (JWT): userId=${decoded.userId} iss=${decoded.iss} aud=${decoded.aud}`);
                req.userId = decoded.userId;
                return next();
            }
            console.log('MCP auth: JWT decoded but no userId claim', decoded);
        } catch (jwtErr) {
            console.log(`MCP auth: JWT verify failed — ${jwtErr.message}`);
        }

        // Fallback: mcp_api_key lookup
        try {
            const result = await pool.query('SELECT id FROM user_settings WHERE mcp_api_key = $1', [token]);
            if (!result.rows.length) {
                console.log('MCP auth: invalid token (not JWT, not mcp_api_key)');
                return res.status(401).json({ error: 'Invalid token or API key' });
            }
            req.userId = result.rows[0].id;
            console.log(`MCP auth OK (api-key): userId=${req.userId}`);
            next();
        } catch (err) {
            res.status(500).json({ error: 'Auth check failed' });
        }
    }

    // MCP Server factory — one instance per SSE connection
    function createMcpServer(userId) {
        const server = new Server(
            { name: 'vela-study-tracker', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );

        server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_SCHEMAS }));

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'get_tasks':    result = await getTasksTool(pool, userId, args || {}); break;
                    case 'get_sessions': result = await getSessionsTool(pool, userId, args || {}); break;
                    case 'add_task':     result = await addTaskTool(pool, userId, args || {}); break;
                    case 'add_subtask':  result = await addSubtaskTool(pool, userId, args || {}); break;
                    case 'get_goals':    result = await getGoalsTool(pool, userId, args || {}); break;
                    case 'update_task':  result = await updateTaskTool(pool, userId, args || {}); break;
                    case 'delete_task':  result = await deleteTaskTool(pool, userId, args || {}); break;
                    case 'add_session':  result = await addSessionTool(pool, userId, args || {}); break;
                    case 'get_subjects': result = await getSubjectsTool(pool, userId); break;
                    default: throw new Error(`Unknown tool: ${name}`);
                }
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            } catch (err) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
                    isError: true
                };
            }
        });

        return server;
    }

    // POST /vela/mcp/sse — Streamable HTTP transport (modern MCP, used by Claude.ai)
    // Use express.json() so req.body is already a parsed JS object (not a Buffer).
    // The SDK's handleRequest(req, res, parsedBody) uses parsedBody directly as rawMessage,
    // so passing a Buffer would break JSON-RPC message processing.
    router.post('/sse', authenticate, express.json(), async (req, res) => {
        if (!StreamableHTTPServerTransport) {
            return res.status(404).json({ error: 'Streamable HTTP not supported by this SDK version' });
        }
        try {
            const { randomUUID } = require('crypto');
            const mcpServer = createMcpServer(req.userId);
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    sessions.set(sessionId, { transport, server: mcpServer });
                }
            });

            // Use onclose callback (not EventEmitter .on()) — StreamableHTTPServerTransport
            // does not extend EventEmitter
            transport.onclose = () => {
                if (transport.sessionId) sessions.delete(transport.sessionId);
            };

            await mcpServer.connect(transport);
            // Pass req.body (parsed JSON object) as parsedBody — avoids re-reading consumed stream
            await transport.handleRequest(req, res, req.body);
        } catch (err) {
            console.error('MCP StreamableHTTP error:', err);
            if (!res.headersSent) res.status(500).json({ error: err.message });
        }
    });

    // DELETE /vela/mcp/sse — close Streamable HTTP session
    router.delete('/sse', authenticate, async (req, res) => {
        const sessionId = req.headers['mcp-session-id'];
        if (sessionId && sessions.has(sessionId)) {
            const { transport } = sessions.get(sessionId);
            sessions.delete(sessionId);
            try { await transport.close(); } catch (_) {}
        }
        res.status(200).end();
    });

    // GET /vela/mcp/sse — Streamable HTTP SSE channel (or legacy SSE fallback)
    // If Mcp-Session-Id is present, delegate to the existing Streamable HTTP transport.
    // Otherwise, fall back to the legacy SSEServerTransport for older clients.
    router.get('/sse', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'];
        if (sessionId) {
            // Streamable HTTP: pipe SSE events for an existing session
            const session = sessions.get(sessionId);
            if (!session) {
                console.log(`MCP GET /sse: session ${sessionId} not found`);
                return res.status(404).json({ error: `Session ${sessionId} not found` });
            }
            try {
                console.log(`MCP StreamableHTTP GET: session ${sessionId}`);
                await session.transport.handleRequest(req, res);
            } catch (err) {
                console.error('MCP StreamableHTTP GET error:', err);
                if (!res.headersSent) res.status(500).json({ error: err.message });
            }
            return;
        }

        // No session ID — legacy SSE: authenticate and create new connection
        authenticate(req, res, async () => {
            try {
                const transport = new SSEServerTransport('/vela/mcp/messages', res);
                const server = createMcpServer(req.userId);
                sessions.set(transport.sessionId, { transport, server });

                req.on('close', () => {
                    sessions.delete(transport.sessionId);
                    console.log(`MCP legacy SSE session ${transport.sessionId} closed`);
                });

                console.log(`MCP legacy SSE session ${transport.sessionId} opened for user ${req.userId}`);
                await server.connect(transport);
            } catch (err) {
                console.error('MCP SSE error:', err);
                if (!res.headersSent) res.status(500).json({ error: err.message });
            }
        });
    });

    // POST /vela/mcp/messages — receive client messages
    router.post('/messages', express.raw({ type: '*/*' }), async (req, res) => {
        const sessionId = req.query.sessionId;
        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: `Session ${sessionId} not found` });
        try {
            await session.transport.handlePostMessage(req, res);
        } catch (err) {
            console.error('MCP message error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // Health check
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', sessions: sessions.size, tools: TOOL_SCHEMAS.length });
    });

    console.log('✅ MCP HTTP server ready at /vela/mcp/sse');
    return router;
}

module.exports = { setupMcpRouter };
