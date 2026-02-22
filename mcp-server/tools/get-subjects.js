import pool from '../database.js';
import { getUserId } from '../config.js';

/**
 * Get all subjects for the user
 */
export async function getSubjects(args) {
    try {
        const result = await pool.query(`
            SELECT
                s.id,
                s.name,
                s.color,
                s.icon,
                s.created_at,
                COUNT(DISTINCT t.id) AS total_tasks,
                SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END) AS completed_tasks,
                COUNT(DISTINCT ss.id) AS total_sessions,
                COALESCE(SUM(ss.time_spent), 0) AS total_minutes_studied
            FROM subjects s
            LEFT JOIN tasks t ON t.subject_id = s.id
            LEFT JOIN study_sessions ss ON ss.subject_id = s.id
            WHERE s.user_id = $1
            GROUP BY s.id, s.name, s.color, s.icon, s.created_at
            ORDER BY s.name ASC
        `, [getUserId()]);

        const subjects = result.rows.map(s => ({
            ...s,
            total_tasks: parseInt(s.total_tasks) || 0,
            completed_tasks: parseInt(s.completed_tasks) || 0,
            total_sessions: parseInt(s.total_sessions) || 0,
            total_minutes_studied: parseInt(s.total_minutes_studied) || 0,
            total_hours_studied: ((parseInt(s.total_minutes_studied) || 0) / 60).toFixed(2)
        }));

        return {
            success: true,
            count: subjects.length,
            subjects
        };
    } catch (error) {
        console.error('Error fetching subjects:', error);
        throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
}

export const getSubjectsSchema = {
    name: 'get_subjects',
    description: 'Retrieve all subjects/courses for the user, with task counts and total study time per subject.',
    inputSchema: {
        type: 'object',
        properties: {}
    }
};
