import pool from '../database.js';
import { getUserId } from '../config.js';

/**
 * Update an existing task
 * @param {Object} args
 * @param {number} args.task_id - Task ID to update (required)
 * @param {string} [args.title] - New title
 * @param {string} [args.content] - New content/description
 * @param {string} [args.status] - New status (TODO, IN_PROGRESS, DONE)
 * @param {boolean} [args.completed] - Mark as completed/uncompleted
 * @param {number} [args.rating] - Priority rating (1-5)
 * @param {number} [args.goal_id] - Link to a goal (null to unlink)
 * @param {number} [args.subject_id] - Link to a subject
 * @param {string[]} [args.tags] - Replace tags array
 * @param {string} [args.url] - Update URL
 */
export async function updateTask(args) {
    const { task_id, title, content, status, completed, rating, goal_id, subject_id, tags, url } = args;

    if (!task_id) throw new Error('task_id is required');

    const userId = getUserId();

    // Verify ownership
    const ownerCheck = await pool.query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [task_id, userId]
    );
    if (ownerCheck.rows.length === 0) {
        throw new Error(`Task ${task_id} not found or does not belong to you`);
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (status && !validStatuses.includes(status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
    }
    if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new Error('rating must be between 1 and 5');
    }

    // Build dynamic SET clause
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) { setClauses.push(`title = $${paramIndex++}`); params.push(title.trim()); }
    if (content !== undefined) { setClauses.push(`content = $${paramIndex++}`); params.push(content); }
    if (status !== undefined) { setClauses.push(`status = $${paramIndex++}`); params.push(status); }
    if (completed !== undefined) { setClauses.push(`completed = $${paramIndex++}`); params.push(completed); }
    if (rating !== undefined) { setClauses.push(`rating = $${paramIndex++}`); params.push(rating); }
    if (goal_id !== undefined) { setClauses.push(`goal_id = $${paramIndex++}`); params.push(goal_id || null); }
    if (subject_id !== undefined) { setClauses.push(`subject_id = $${paramIndex++}`); params.push(subject_id || null); }
    if (tags !== undefined) { setClauses.push(`tags = $${paramIndex++}`); params.push(tags); }
    if (url !== undefined) { setClauses.push(`url = $${paramIndex++}`); params.push(url); }

    if (setClauses.length === 0) throw new Error('No fields provided to update');

    setClauses.push(`updated_at = NOW()`);
    params.push(task_id, userId);

    const updateQuery = `
        UPDATE tasks
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
        RETURNING id, title, content, status, completed, rating, goal_id, subject_id, tags, url, updated_at
    `;

    try {
        const result = await pool.query(updateQuery, params);
        return {
            success: true,
            message: 'Task updated successfully',
            task: result.rows[0]
        };
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error(`Failed to update task: ${error.message}`);
    }
}

export const updateTaskSchema = {
    name: 'update_task',
    description: 'Update an existing task. Can change status, mark as completed, update title/content, change priority rating, link/unlink goals, or update tags.',
    inputSchema: {
        type: 'object',
        properties: {
            task_id: {
                type: 'number',
                description: 'ID of the task to update (required)'
            },
            title: {
                type: 'string',
                description: 'New task title'
            },
            content: {
                type: 'string',
                description: 'New task content/description'
            },
            status: {
                type: 'string',
                enum: ['TODO', 'IN_PROGRESS', 'DONE'],
                description: 'New task status'
            },
            completed: {
                type: 'boolean',
                description: 'Mark task as completed (true) or incomplete (false)'
            },
            rating: {
                type: 'number',
                minimum: 1,
                maximum: 5,
                description: 'Task priority rating (1-5, where 5 is highest)'
            },
            goal_id: {
                type: 'number',
                description: 'Link task to a goal by ID. Pass null to unlink from goal.'
            },
            subject_id: {
                type: 'number',
                description: 'Link task to a subject by ID'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Replace the tags array'
            },
            url: {
                type: 'string',
                description: 'Update the associated URL'
            }
        },
        required: ['task_id']
    }
};
