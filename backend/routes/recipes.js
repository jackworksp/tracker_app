const express = require('express');
const router = express.Router();
const db = require('../database');

// PUBLIC routes — no auth middleware. Anyone can read or write.

// GET /api/recipes — list with pagination + filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;
        const category = req.query.category;
        const q = req.query.q;

        let where = 'WHERE 1=1';
        const params = [];

        if (category && category !== 'All') {
            params.push(category);
            where += ` AND category = $${params.length}`;
        }
        if (q) {
            params.push(`%${q}%`);
            where += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length} OR ingredients ILIKE $${params.length})`;
        }

        const listSql = `SELECT * FROM recipes ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const countSql = `SELECT COUNT(*) FROM recipes ${where}`;

        const [listResult, countResult] = await Promise.all([
            db.query(listSql, [...params, limit, offset]),
            db.query(countSql, params),
        ]);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit) || 1;

        res.json({
            data: listResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error('Error listing recipes:', err);
        res.status(500).json({ error: 'Failed to list recipes' });
    }
});

// GET /api/recipes/categories — distinct categories present in DB
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT category, COUNT(*)::int AS count FROM recipes WHERE category IS NOT NULL AND category <> '' GROUP BY category ORDER BY count DESC`
        );
        res.json({ data: result.rows });
    } catch (err) {
        console.error('Error listing categories:', err);
        res.status(500).json({ error: 'Failed to list categories' });
    }
});

// GET /api/recipes/:id — single recipe
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM recipes WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
        res.json({ data: result.rows[0] });
    } catch (err) {
        console.error('Error fetching recipe:', err);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// POST /api/recipes — create
router.post('/', async (req, res) => {
    try {
        const {
            title,
            category,
            source_type,
            source_url,
            thumbnail_url,
            description,
            ingredients,
            steps,
            cook_time_minutes,
            servings,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().slice(0, 64);

        const result = await db.query(
            `INSERT INTO recipes (title, category, source_type, source_url, thumbnail_url, description, ingredients, steps, cook_time_minutes, servings, created_by_ip)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                title.trim(),
                category || null,
                source_type || null,
                source_url || null,
                thumbnail_url || null,
                description || null,
                ingredients || null,
                steps || null,
                cook_time_minutes || null,
                servings || null,
                ip,
            ]
        );
        res.status(201).json({ data: result.rows[0] });
    } catch (err) {
        console.error('Error creating recipe:', err);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});

// PUT /api/recipes/:id — update
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const allowed = [
            'title', 'category', 'source_type', 'source_url', 'thumbnail_url',
            'description', 'ingredients', 'steps', 'cook_time_minutes', 'servings'
        ];
        const sets = [];
        const params = [];
        for (const field of allowed) {
            if (field in req.body) {
                params.push(req.body[field]);
                sets.push(`${field} = $${params.length}`);
            }
        }
        if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const result = await db.query(
            `UPDATE recipes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
            params
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
        res.json({ data: result.rows[0] });
    } catch (err) {
        console.error('Error updating recipe:', err);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM recipes WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting recipe:', err);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

module.exports = router;
