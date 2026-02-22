import pool from '../database.js';
import { getUserId } from '../config.js';

/**
 * Get goals with task and session statistics
 * @param {Object} args - Filter arguments
 * @param {string} [args.status] - Filter by goal status
 * @param {string} [args.category] - Filter by category
 */
export async function getGoals(args) {
    const { status, category } = args;

    try {
        let queryParams = [getUserId()];
        let paramIndex = 2;
        let whereConditions = ['g.user_id = $1'];

        if (status) {
            whereConditions.push(`g.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (category) {
            whereConditions.push(`g.category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const goalsQuery = `
            SELECT
                g.id,
                g.title,
                g.description,
                g.category,
                g.status,
                g.target_date,
                g.image_url,
                g.created_at,
                g.updated_at,
                COUNT(DISTINCT t.id) AS total_tasks,
                SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END) AS completed_tasks,
                COUNT(DISTINCT ss.id) AS total_sessions,
                COALESCE(SUM(ss.time_spent), 0) AS total_minutes_studied
            FROM goals g
            LEFT JOIN tasks t ON t.goal_id = g.id
            LEFT JOIN study_sessions ss ON ss.goal_id = g.id
            ${whereClause}
            GROUP BY g.id, g.title, g.description, g.category, g.status, g.target_date, g.image_url, g.created_at, g.updated_at
            ORDER BY g.created_at DESC
        `;

        const result = await pool.query(goalsQuery, queryParams);
        const goals = result.rows.map(g => ({
            ...g,
            total_tasks: parseInt(g.total_tasks) || 0,
            completed_tasks: parseInt(g.completed_tasks) || 0,
            pending_tasks: (parseInt(g.total_tasks) || 0) - (parseInt(g.completed_tasks) || 0),
            total_sessions: parseInt(g.total_sessions) || 0,
            total_minutes_studied: parseInt(g.total_minutes_studied) || 0,
            total_hours_studied: ((parseInt(g.total_minutes_studied) || 0) / 60).toFixed(2),
            task_completion_pct: (parseInt(g.total_tasks) || 0) > 0
                ? Math.round((parseInt(g.completed_tasks) / parseInt(g.total_tasks)) * 100)
                : 0
        }));

        return {
            success: true,
            count: goals.length,
            goals,
            filters_applied: { status, category }
        };

    } catch (error) {
        console.error('Error fetching goals:', error);
        throw new Error(`Failed to fetch goals: ${error.message}`);
    }
}

export const getGoalsSchema = {
    name: 'get_goals',
    description: 'Retrieve goals with task completion stats and study time. Returns each goal with total/completed tasks, sessions logged, and hours studied.',
    inputSchema: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                description: 'Filter by goal status (e.g. PLANNING, ACTIVE, COMPLETED, ON_HOLD)'
            },
            category: {
                type: 'string',
                description: 'Filter by category (e.g. PERSONAL, CAREER, EDUCATION, HEALTH)'
            }
        }
    }
};
