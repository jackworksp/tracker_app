import pool from '../database.js';

/**
 * Get tasks with optional filtering
 * @param {Object} args - Filter arguments
 * @param {number} [args.user_id] - User ID to filter tasks
 * @param {string} [args.status] - Filter by status (TODO, IN_PROGRESS, DONE)
 * @param {number} [args.subject_id] - Filter by subject
 * @param {boolean} [args.include_subtasks] - Include relational subtasks
 * @param {number} [args.limit=50] - Maximum number of tasks to return
 */
export async function getTasks(args) {
    const {
        user_id,
        status,
        subject_id,
        include_subtasks = true,
        limit = 50
    } = args;

    try {
        // Build main tasks query
        let queryParams = [];
        let paramIndex = 1;
        let whereConditions = [];

        if (user_id) {
            whereConditions.push(`t.user_id = $${paramIndex}`);
            queryParams.push(user_id);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`t.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (subject_id) {
            whereConditions.push(`t.subject_id = $${paramIndex}`);
            queryParams.push(subject_id);
            paramIndex++;
        }

        // Only fetch top-level tasks (not subtasks) unless specifically requested
        whereConditions.push(`t.parent_task_id IS NULL`);

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Add limit
        queryParams.push(limit);
        const limitParam = `$${paramIndex}`;

        const tasksQuery = `
            SELECT
                t.id,
                t.user_id,
                t.title,
                t.content,
                t.status,
                t.subject_id,
                t.type,
                t.url,
                t.attachment_url,
                t.completed,
                t.tags,
                t.rating,
                t.goal_id,
                t.parent_task_id,
                t.subtasks,
                t.resources,
                t.reminder_time,
                t.created_at,
                t.updated_at,
                s.name as subject_name,
                s.color as subject_color
            FROM tasks t
            LEFT JOIN subjects s ON t.subject_id = s.id AND s.user_id = t.user_id
            ${whereClause}
            ORDER BY
                CASE
                    WHEN t.status = 'IN_PROGRESS' THEN 1
                    WHEN t.status = 'TODO' THEN 2
                    WHEN t.status = 'DONE' THEN 3
                    ELSE 4
                END,
                t.rating DESC NULLS LAST,
                t.created_at DESC
            LIMIT ${limitParam}
        `;

        const tasksResult = await pool.query(tasksQuery, queryParams);
        const tasks = tasksResult.rows;

        // If include_subtasks is true, fetch relational subtasks (tasks with parent_task_id)
        if (include_subtasks && tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);

            if (taskIds.length > 0) {
                const subtasksQuery = `
                    SELECT
                        t.id,
                        t.parent_task_id,
                        t.title,
                        t.content,
                        t.status,
                        t.completed,
                        t.type,
                        t.created_at,
                        t.updated_at
                    FROM tasks t
                    WHERE t.parent_task_id = ANY($1)
                    ORDER BY t.created_at ASC
                `;

                const subtasksResult = await pool.query(subtasksQuery, [taskIds]);
                const subtasksByTaskId = {};

                subtasksResult.rows.forEach(subtask => {
                    if (!subtasksByTaskId[subtask.parent_task_id]) {
                        subtasksByTaskId[subtask.parent_task_id] = [];
                    }
                    subtasksByTaskId[subtask.parent_task_id].push(subtask);
                });

                // Attach relational subtasks to their parent tasks
                tasks.forEach(task => {
                    // Combine JSONB subtasks with relational subtasks
                    const jsonbSubtasks = task.subtasks || [];
                    const relationalSubtasks = subtasksByTaskId[task.id] || [];
                    task.all_subtasks = [...jsonbSubtasks, ...relationalSubtasks];
                });
            }
        }

        return {
            success: true,
            count: tasks.length,
            tasks: tasks,
            filters_applied: {
                user_id,
                status,
                subject_id,
                include_subtasks
            }
        };

    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
}

export const getTasksSchema = {
    name: "get_tasks",
    description: "Retrieve tasks with optional filtering by status, subject, and user. Returns task details including relational subtasks and JSONB subtasks. Only returns top-level tasks by default (parent_task_id IS NULL).",
    inputSchema: {
        type: "object",
        properties: {
            user_id: {
                type: "number",
                description: "Filter tasks by user ID"
            },
            status: {
                type: "string",
                enum: ["TODO", "IN_PROGRESS", "DONE"],
                description: "Filter by task status (TODO=pending, IN_PROGRESS=active, DONE=completed)"
            },
            subject_id: {
                type: "number",
                description: "Filter tasks by subject ID"
            },
            include_subtasks: {
                type: "boolean",
                description: "Include relational subtasks (tasks with parent_task_id) and JSONB subtasks (default: true)",
                default: true
            },
            limit: {
                type: "number",
                description: "Maximum number of tasks to return (default: 50)",
                default: 50
            }
        }
    }
};
