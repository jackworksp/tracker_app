import pool from '../database.js';
import { getUserId } from '../config.js';

/**
 * Delete a task (and its subtasks)
 * @param {Object} args
 * @param {number} args.task_id - Task ID to delete (required)
 */
export async function deleteTask(args) {
    const { task_id } = args;

    if (!task_id) throw new Error('task_id is required');

    const userId = getUserId();

    // Verify ownership and get task info before deleting
    const ownerCheck = await pool.query(
        'SELECT id, title FROM tasks WHERE id = $1 AND user_id = $2',
        [task_id, userId]
    );
    if (ownerCheck.rows.length === 0) {
        throw new Error(`Task ${task_id} not found or does not belong to you`);
    }

    const taskTitle = ownerCheck.rows[0].title;

    try {
        // Delete subtasks first (relational subtasks with parent_task_id)
        await pool.query('DELETE FROM tasks WHERE parent_task_id = $1', [task_id]);

        // Delete the task itself
        await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [task_id, userId]);

        return {
            success: true,
            message: `Task "${taskTitle}" (id: ${task_id}) deleted successfully`
        };
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error(`Failed to delete task: ${error.message}`);
    }
}

export const deleteTaskSchema = {
    name: 'delete_task',
    description: 'Permanently delete a task and its subtasks. Use this to clean up test tasks or remove tasks that are no longer needed.',
    inputSchema: {
        type: 'object',
        properties: {
            task_id: {
                type: 'number',
                description: 'ID of the task to delete (required)'
            }
        },
        required: ['task_id']
    }
};
