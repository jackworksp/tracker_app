import pool from '../database.js';

/**
 * Add a new task
 * @param {Object} args - Task details
 * @param {number} args.user_id - User ID (required)
 * @param {string} args.title - Task title (required)
 * @param {string} [args.content] - Task content/description
 * @param {string} [args.status] - Task status (default: 'TODO')
 * @param {number} [args.subject_id] - Associated subject ID
 * @param {string} [args.type] - Task type: 'TASK' or 'EXPLORATORY' (default: 'TASK')
 * @param {string} [args.url] - Associated URL/content link
 * @param {string} [args.attachment_url] - Attachment URL
 * @param {Array} [args.tags] - Task tags
 * @param {number} [args.goal_id] - Associated goal ID
 * @param {number} [args.rating] - Task rating/priority (1-5)
 * @param {Array} [args.subtasks] - JSONB subtasks array
 * @param {Array} [args.resources] - JSONB resources array
 * @param {number} [args.parent_task_id] - Parent task ID for creating sub-tasks
 */
export async function addTask(args) {
    const {
        user_id,
        title,
        content,
        status = 'TODO',
        subject_id,
        type = 'TASK',
        url,
        attachment_url,
        tags,
        goal_id,
        rating,
        subtasks,
        resources,
        parent_task_id
    } = args;

    // Validation
    if (!user_id) {
        throw new Error('user_id is required');
    }

    if (!title || title.trim() === '') {
        throw new Error('title is required and cannot be empty');
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (status && !validStatuses.includes(status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const validTypes = ['TASK', 'EXPLORATORY'];
    if (type && !validTypes.includes(type)) {
        throw new Error(`type must be one of: ${validTypes.join(', ')}`);
    }

    if (rating && (rating < 1 || rating > 5)) {
        throw new Error('rating must be between 1 and 5');
    }

    try {
        const insertQuery = `
            INSERT INTO tasks (
                user_id,
                title,
                content,
                status,
                subject_id,
                type,
                url,
                attachment_url,
                tags,
                goal_id,
                rating,
                subtasks,
                resources,
                parent_task_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING
                id,
                user_id,
                title,
                content,
                status,
                subject_id,
                type,
                url,
                attachment_url,
                tags,
                goal_id,
                rating,
                subtasks,
                resources,
                parent_task_id,
                completed,
                created_at,
                updated_at
        `;

        const values = [
            user_id,
            title.trim(),
            content || null,
            status,
            subject_id || null,
            type,
            url || null,
            attachment_url || null,
            tags || [],
            goal_id || null,
            rating || null,
            JSON.stringify(subtasks || []),
            JSON.stringify(resources || []),
            parent_task_id || null
        ];

        const result = await pool.query(insertQuery, values);
        const newTask = result.rows[0];

        // If subject_id is provided, fetch subject details
        if (newTask.subject_id) {
            const subjectQuery = `
                SELECT id, name, color
                FROM subjects
                WHERE id = $1
            `;
            const subjectResult = await pool.query(subjectQuery, [newTask.subject_id]);
            if (subjectResult.rows.length > 0) {
                newTask.subject_name = subjectResult.rows[0].name;
                newTask.subject_color = subjectResult.rows[0].color;
            }
        }

        // If goal_id is provided, fetch goal details
        if (newTask.goal_id) {
            const goalQuery = `
                SELECT id, title
                FROM goals
                WHERE id = $1
            `;
            const goalResult = await pool.query(goalQuery, [newTask.goal_id]);
            if (goalResult.rows.length > 0) {
                newTask.goal_title = goalResult.rows[0].title;
            }
        }

        return {
            success: true,
            message: 'Task created successfully',
            task: newTask
        };

    } catch (error) {
        console.error('Error adding task:', error);

        // Handle specific database errors
        if (error.code === '23503') { // Foreign key violation
            if (error.constraint === 'tasks_user_id_fkey') {
                throw new Error('Invalid user_id: user does not exist');
            }
            if (error.constraint === 'tasks_subject_id_fkey') {
                throw new Error('Invalid subject_id: subject does not exist');
            }
            if (error.constraint === 'tasks_goal_id_fkey') {
                throw new Error('Invalid goal_id: goal does not exist');
            }
            if (error.constraint === 'tasks_parent_task_id_fkey') {
                throw new Error('Invalid parent_task_id: parent task does not exist');
            }
        }

        throw new Error(`Failed to add task: ${error.message}`);
    }
}

export const addTaskSchema = {
    name: "add_task",
    description: "Create a new task with optional subject assignment, tags, goals, and ratings. Supports both TASK and EXPLORATORY task types. Use type='EXPLORATORY' for tasks that will have subtasks.",
    inputSchema: {
        type: "object",
        properties: {
            user_id: {
                type: "number",
                description: "User ID who owns the task (required)"
            },
            title: {
                type: "string",
                description: "Task title/name (required)"
            },
            content: {
                type: "string",
                description: "Detailed task content/description"
            },
            status: {
                type: "string",
                enum: ["TODO", "IN_PROGRESS", "DONE"],
                description: "Task status (default: TODO)",
                default: "TODO"
            },
            subject_id: {
                type: "number",
                description: "ID of the subject this task belongs to"
            },
            type: {
                type: "string",
                enum: ["TASK", "EXPLORATORY"],
                description: "Task type: TASK for regular tasks, EXPLORATORY for tasks with subtasks (default: TASK)",
                default: "TASK"
            },
            url: {
                type: "string",
                description: "Associated URL or content link"
            },
            attachment_url: {
                type: "string",
                description: "URL of attached file or resource"
            },
            tags: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Array of tags for categorizing the task"
            },
            goal_id: {
                type: "number",
                description: "ID of the goal this task contributes to"
            },
            rating: {
                type: "number",
                description: "Task rating/priority (1-5, where 5 is highest priority)",
                minimum: 1,
                maximum: 5
            },
            subtasks: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        completed: { type: "boolean" }
                    }
                },
                description: "Array of inline subtasks (JSONB format). For exploratory tasks, consider using the add_subtask tool instead for relational subtasks."
            },
            resources: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        type: { type: "string" }
                    }
                },
                description: "Array of learning resources (JSONB format) associated with this task"
            },
            parent_task_id: {
                type: "number",
                description: "ID of the parent task if this is a sub-task"
            }
        },
        required: ["user_id", "title"]
    }
};
