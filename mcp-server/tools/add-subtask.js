import pool from '../database.js';

/**
 * Add a subtask to an exploratory task
 * @param {Object} args - Subtask details
 * @param {number} args.task_id - Parent task ID (must be exploratory type)
 * @param {string} args.title - Subtask title (required)
 * @param {string} [args.description] - Subtask description
 * @param {boolean} [args.completed] - Whether the subtask is completed (default: false)
 */
export async function addSubtask(args) {
    const {
        task_id,
        title,
        description,
        completed = false
    } = args;

    // Validation
    if (!task_id) {
        throw new Error('task_id is required');
    }

    if (!title || title.trim() === '') {
        throw new Error('title is required and cannot be empty');
    }

    try {
        // First, verify the parent task exists and is of type 'exploratory'
        const taskCheckQuery = `
            SELECT id, task_type, title as task_title
            FROM tasks
            WHERE id = $1
        `;
        const taskCheckResult = await pool.query(taskCheckQuery, [task_id]);

        if (taskCheckResult.rows.length === 0) {
            throw new Error(`Task with id ${task_id} not found`);
        }

        const parentTask = taskCheckResult.rows[0];
        if (parentTask.task_type !== 'exploratory') {
            throw new Error(
                `Cannot add subtask: Task "${parentTask.task_title}" (id: ${task_id}) is not an exploratory task. ` +
                `Only exploratory tasks can have subtasks.`
            );
        }

        // Insert the subtask
        const insertQuery = `
            INSERT INTO task_subtasks (
                task_id,
                title,
                description,
                completed
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                task_id,
                title,
                description,
                completed,
                created_at
        `;

        const values = [
            task_id,
            title.trim(),
            description || null,
            completed
        ];

        const result = await pool.query(insertQuery, values);
        const newSubtask = result.rows[0];

        // Fetch updated subtask count for the parent task
        const countQuery = `
            SELECT
                COUNT(*) as total_subtasks,
                COUNT(*) FILTER (WHERE completed = true) as completed_subtasks
            FROM task_subtasks
            WHERE task_id = $1
        `;
        const countResult = await pool.query(countQuery, [task_id]);
        const stats = countResult.rows[0];

        return {
            success: true,
            message: 'Subtask added successfully',
            subtask: newSubtask,
            parent_task: {
                id: parentTask.id,
                title: parentTask.task_title,
                total_subtasks: parseInt(stats.total_subtasks),
                completed_subtasks: parseInt(stats.completed_subtasks)
            }
        };

    } catch (error) {
        console.error('Error adding subtask:', error);

        // Handle specific database errors
        if (error.code === '23503') { // Foreign key violation
            throw new Error('Invalid task_id: task does not exist');
        }

        throw new Error(`Failed to add subtask: ${error.message}`);
    }
}

export const addSubtaskSchema = {
    name: "add_subtask",
    description: "Add a subtask to an exploratory task. The parent task must be of type 'exploratory'. Returns the created subtask with updated parent task statistics.",
    inputSchema: {
        type: "object",
        properties: {
            task_id: {
                type: "number",
                description: "ID of the parent exploratory task (required)"
            },
            title: {
                type: "string",
                description: "Subtask title/name (required)"
            },
            description: {
                type: "string",
                description: "Detailed subtask description"
            },
            completed: {
                type: "boolean",
                description: "Whether the subtask is completed (default: false)",
                default: false
            }
        },
        required: ["task_id", "title"]
    }
};
