# Task 11: Skills Backend API Routes

**Issue**: #4 - Skills Tracking Feature
**ClickUp**: https://app.clickup.com/t/86d1z2736
**Priority**: ✨ Medium (New Feature)
**Estimated Time**: 1-2 days
**Sprint**: Sprint 3 (Week 3)

---

## Objective
Implement RESTful API routes for CRUD operations on skills, including proficiency management and task/session linking.

## Dependencies

- ✅ Task 10 completed (database schema)

## API Endpoints to Implement

### Core CRUD
- `GET /api/skills` - List all user skills with stats
- `GET /api/skills/:id` - Get single skill details
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Proficiency & Linking
- `PUT /api/skills/:id/proficiency` - Update proficiency level
- `POST /api/skills/:id/link-task` - Link skill to task
- `DELETE /api/skills/:id/unlink-task/:taskId` - Unlink from task
- `POST /api/skills/:id/link-session` - Link skill to session

### Analytics
- `GET /api/skills/stats` - Get skill statistics
- `GET /api/skills/recent` - Get recently used skills

## Implementation Steps

### 1. Create Skills Routes File
**File**: `backend/routes/skills.js` (new file)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { SKILL_CATEGORIES, PROFICIENCY_LEVELS } = require('../constants');

router.use(authenticateToken);

// Get all user skills with statistics
router.get('/', async (req, res) => {
    try {
        const { category, proficiency, search } = req.query;

        let query = `
            SELECT s.*,
                   COALESCE(ts.task_count, 0)::integer as linked_tasks,
                   COALESCE(ss.session_count, 0)::integer as linked_sessions,
                   COALESCE(ss.total_hours, 0)::numeric as total_hours_practiced
            FROM skills s
            LEFT JOIN (
                SELECT skill_id, COUNT(*)::integer as task_count
                FROM task_skills
                GROUP BY skill_id
            ) ts ON s.id = ts.skill_id
            LEFT JOIN (
                SELECT skill_id,
                       COUNT(*)::integer as session_count,
                       SUM(hours_contributed)::numeric as total_hours
                FROM session_skills
                GROUP BY skill_id
            ) ss ON s.id = ss.skill_id
            WHERE s.user_id = $1
        `;

        const params = [req.userId];

        if (category) {
            params.push(category);
            query += ` AND s.category = $${params.length}`;
        }

        if (proficiency) {
            params.push(proficiency);
            query += ` AND s.proficiency_level = $${params.length}`;
        }

        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            query += ` AND (LOWER(s.name) LIKE $${params.length} OR LOWER(s.description) LIKE $${params.length})`;
        }

        query += ` ORDER BY s.name ASC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// Get skill statistics
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                COUNT(*)::integer as total_skills,
                COUNT(*) FILTER (WHERE proficiency_level = 'BEGINNER')::integer as beginner,
                COUNT(*) FILTER (WHERE proficiency_level = 'INTERMEDIATE')::integer as intermediate,
                COUNT(*) FILTER (WHERE proficiency_level = 'ADVANCED')::integer as advanced,
                COUNT(*) FILTER (WHERE proficiency_level = 'EXPERT')::integer as expert,
                COUNT(*) FILTER (WHERE category = 'TECHNICAL')::integer as technical,
                COUNT(*) FILTER (WHERE category = 'LANGUAGE')::integer as language,
                COUNT(*) FILTER (WHERE category = 'SOFT_SKILLS')::integer as soft_skills,
                COUNT(*) FILTER (WHERE last_used >= CURRENT_DATE - INTERVAL '30 days')::integer as used_last_month
            FROM skills
            WHERE user_id = $1
        `, [req.userId]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get recently used skills
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await db.query(`
            SELECT s.*, COUNT(ts.task_id)::integer as recent_tasks
            FROM skills s
            LEFT JOIN task_skills ts ON s.id = ts.skill_id
            WHERE s.user_id = $1 AND s.last_used IS NOT NULL
            GROUP BY s.id
            ORDER BY s.last_used DESC
            LIMIT $2
        `, [req.userId, limit]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching recent skills:', err);
        res.status(500).json({ error: 'Failed to fetch recent skills' });
    }
});

// Get single skill
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT s.*,
                   COALESCE(ts.task_count, 0)::integer as linked_tasks,
                   COALESCE(ss.session_count, 0)::integer as linked_sessions
            FROM skills s
            LEFT JOIN (
                SELECT skill_id, COUNT(*)::integer as task_count
                FROM task_skills
                GROUP BY skill_id
            ) ts ON s.id = ts.skill_id
            LEFT JOIN (
                SELECT skill_id, COUNT(*)::integer as session_count
                FROM session_skills
                GROUP BY skill_id
            ) ss ON s.id = ss.skill_id
            WHERE s.id = $1 AND s.user_id = $2
        `, [id, req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Get linked tasks
        const tasks = await db.query(`
            SELECT t.id, t.title, t.status, t.priority
            FROM tasks t
            JOIN task_skills ts ON t.id = ts.task_id
            WHERE ts.skill_id = $1 AND t.user_id = $2
        `, [id, req.userId]);

        res.json({
            ...result.rows[0],
            linked_task_details: tasks.rows
        });
    } catch (err) {
        console.error('Error fetching skill:', err);
        res.status(500).json({ error: 'Failed to fetch skill' });
    }
});

// Create new skill
router.post('/', async (req, res) => {
    try {
        const {
            name, category, proficiency_level,
            description, tags, date_acquired
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Skill name is required' });
        }

        // Validate category
        if (category && !Object.values(SKILL_CATEGORIES).includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Validate proficiency
        if (proficiency_level && !Object.keys(PROFICIENCY_LEVELS).includes(proficiency_level)) {
            return res.status(400).json({ error: 'Invalid proficiency level' });
        }

        const result = await db.query(
            `INSERT INTO skills (
                user_id, name, category, proficiency_level,
                description, tags, date_acquired
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                req.userId,
                name.trim(),
                category || 'TECHNICAL',
                proficiency_level || 'BEGINNER',
                description || null,
                tags || [],
                date_acquired || new Date()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({
                error: 'A skill with this name already exists'
            });
        }
        console.error('Error creating skill:', err);
        res.status(500).json({ error: 'Failed to create skill' });
    }
});

// Update skill
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, category, proficiency_level,
            description, tags, date_acquired, last_used, hours_practiced
        } = req.body;

        const updates = [];
        const values = [id, req.userId];
        let paramCount = 2;

        if (name !== undefined) {
            updates.push(`name = $${++paramCount}`);
            values.push(name.trim());
        }
        if (category !== undefined) {
            updates.push(`category = $${++paramCount}`);
            values.push(category);
        }
        if (proficiency_level !== undefined) {
            updates.push(`proficiency_level = $${++paramCount}`);
            values.push(proficiency_level);
        }
        if (description !== undefined) {
            updates.push(`description = $${++paramCount}`);
            values.push(description);
        }
        if (tags !== undefined) {
            updates.push(`tags = $${++paramCount}`);
            values.push(tags);
        }
        if (date_acquired !== undefined) {
            updates.push(`date_acquired = $${++paramCount}`);
            values.push(date_acquired);
        }
        if (last_used !== undefined) {
            updates.push(`last_used = $${++paramCount}`);
            values.push(last_used);
        }
        if (hours_practiced !== undefined) {
            updates.push(`hours_practiced = $${++paramCount}`);
            values.push(hours_practiced);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const result = await db.query(
            `UPDATE skills SET ${updates.join(', ')}
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating skill:', err);
        res.status(500).json({ error: 'Failed to update skill' });
    }
});

// Update proficiency level
router.put('/:id/proficiency', async (req, res) => {
    try {
        const { id } = req.params;
        const { proficiency_level } = req.body;

        const validLevels = Object.keys(PROFICIENCY_LEVELS);
        if (!validLevels.includes(proficiency_level)) {
            return res.status(400).json({
                error: 'Invalid proficiency level',
                valid_levels: validLevels
            });
        }

        const result = await db.query(
            `UPDATE skills
             SET proficiency_level = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [proficiency_level, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating proficiency:', err);
        res.status(500).json({ error: 'Failed to update proficiency' });
    }
});

// Link skill to task
router.post('/:id/link-task', async (req, res) => {
    try {
        const { id } = req.params;
        const { task_id } = req.body;

        // Verify skill belongs to user
        const skillCheck = await db.query(
            'SELECT id FROM skills WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (skillCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Verify task belongs to user
        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [task_id, req.userId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Create link
        await db.query(
            `INSERT INTO task_skills (task_id, skill_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [task_id, id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error linking skill to task:', err);
        res.status(500).json({ error: 'Failed to link skill' });
    }
});

// Unlink skill from task
router.delete('/:id/unlink-task/:taskId', async (req, res) => {
    try {
        const { id, taskId } = req.params;

        await db.query(
            `DELETE FROM task_skills
             WHERE skill_id = $1 AND task_id = $2`,
            [id, taskId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error unlinking skill:', err);
        res.status(500).json({ error: 'Failed to unlink skill' });
    }
});

// Delete skill
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM skills WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting skill:', err);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});

module.exports = router;
```

### 2. Mount Routes in Server
**File**: `backend/server.js`

```javascript
// Add to imports
const skillsRouter = require('./routes/skills');

// Add to appRouter
appRouter.use('/api/skills', skillsRouter);
```

### 3. Update API Client
**File**: `frontend-web/src/api.js`

```javascript
const api = {
    // ... existing methods ...

    skills: {
        getAll: async (params = {}) => {
            const token = localStorage.getItem('token');
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_URL}/skills${queryString ? '?' + queryString : ''}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch skills');
            return response.json();
        },

        getStats: async () => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },

        getRecent: async (limit = 10) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/recent?limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch recent skills');
            return response.json();
        },

        create: async (data) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create skill');
            }

            return response.json();
        },

        update: async (id, data) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update skill');
            return response.json();
        },

        updateProficiency: async (id, proficiency_level) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/${id}/proficiency`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ proficiency_level })
            });

            if (!response.ok) throw new Error('Failed to update proficiency');
            return response.json();
        },

        linkToTask: async (skillId, taskId) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/${skillId}/link-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ task_id: taskId })
            });

            if (!response.ok) throw new Error('Failed to link skill');
            return response.json();
        },

        unlinkFromTask: async (skillId, taskId) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/${skillId}/unlink-task/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to unlink skill');
            return response.json();
        },

        delete: async (id) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/skills/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete skill');
            return response.json();
        }
    }
};
```

## Testing Checklist

- [ ] Create skill with valid data
- [ ] Reject duplicate skill names per user
- [ ] Get all skills with statistics
- [ ] Filter skills by category
- [ ] Filter skills by proficiency
- [ ] Search skills by name
- [ ] Update skill details
- [ ] Update proficiency level
- [ ] Link skill to task
- [ ] Unlink skill from task
- [ ] Delete skill (cascades to links)
- [ ] Get skill statistics
- [ ] Get recently used skills
- [ ] Proper error handling
- [ ] Authentication required on all routes

## Success Criteria

✅ Full CRUD operations functional
✅ Skill-task linking works
✅ Statistics endpoint accurate
✅ Filtering and search work
✅ Duplicate names prevented per user
✅ Cascading deletes work
✅ API client integrated
✅ Error handling robust

## Files Created/Modified

**New Files:**
- `backend/routes/skills.js`

**Modified:**
- `backend/server.js`
- `frontend-web/src/api.js`

## Next Task

→ [Task 12: Skills Frontend Components](task-12-skills-frontend-components.md)
