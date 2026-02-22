import pool from '../database.js';
import { getUserId } from '../config.js';

/**
 * Get study sessions with optional filtering
 * @param {Object} args - Filter arguments
 * @param {number} [args.subject_id] - Filter by subject
 * @param {number} [args.goal_id] - Filter by goal
 * @param {string} [args.start_date] - Filter sessions from this date (ISO format)
 * @param {string} [args.end_date] - Filter sessions until this date (ISO format)
 * @param {number} [args.limit=50] - Maximum number of sessions to return
 */
export async function getSessions(args) {
    const {
        subject_id,
        goal_id,
        start_date,
        end_date,
        limit = 50
    } = args;

    try {
        let queryParams = [];
        let paramIndex = 1;
        let whereConditions = [];

        // Always lock to the configured user via subjects ownership
        whereConditions.push(`ss.subject_id IN (SELECT id FROM subjects WHERE user_id = $${paramIndex})`);
        queryParams.push(getUserId());
        paramIndex++;

        if (subject_id) {
            whereConditions.push(`ss.subject_id = $${paramIndex}`);
            queryParams.push(subject_id);
            paramIndex++;
        }

        if (goal_id) {
            whereConditions.push(`ss.goal_id = $${paramIndex}`);
            queryParams.push(goal_id);
            paramIndex++;
        }

        if (start_date) {
            whereConditions.push(`ss.date >= $${paramIndex}`);
            queryParams.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereConditions.push(`ss.date <= $${paramIndex}`);
            queryParams.push(end_date);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Add limit
        queryParams.push(limit);
        const limitParam = `$${paramIndex}`;

        const sessionsQuery = `
            SELECT
                ss.id,
                ss.subject_id,
                ss.goal_id,
                ss.date,
                ss.day,
                ss.activity,
                ss.time_spent,
                ss.topics_covered,
                ss.notes,
                ss.revision_count,
                ss.type,
                ss.url,
                ss.created_at,
                s.name as subject_name,
                s.color as subject_color,
                s.icon as subject_icon,
                g.title as goal_title
            FROM study_sessions ss
            LEFT JOIN subjects s ON ss.subject_id = s.id
            LEFT JOIN goals g ON ss.goal_id = g.id
            ${whereClause}
            ORDER BY ss.date DESC, ss.created_at DESC
            LIMIT ${limitParam}
        `;

        const result = await pool.query(sessionsQuery, queryParams);
        const sessions = result.rows;

        // Calculate total duration for the filtered sessions (using time_spent)
        const totalDuration = sessions.reduce((sum, session) => {
            return sum + (session.time_spent || 0);
        }, 0);

        // Calculate statistics
        const stats = {
            total_sessions: sessions.length,
            total_time_spent_minutes: totalDuration,
            total_time_spent_hours: (totalDuration / 60).toFixed(2),
            average_session_duration: sessions.length > 0
                ? (totalDuration / sessions.length).toFixed(2)
                : 0
        };

        // Group by subject if no subject filter applied
        let by_subject = null;
        if (!subject_id && sessions.length > 0) {
            by_subject = {};
            sessions.forEach(session => {
                const subjectKey = session.subject_id || 'no_subject';
                if (!by_subject[subjectKey]) {
                    by_subject[subjectKey] = {
                        subject_id: session.subject_id,
                        subject_name: session.subject_name,
                        subject_color: session.subject_color,
                        subject_icon: session.subject_icon,
                        session_count: 0,
                        total_time_spent_minutes: 0
                    };
                }
                by_subject[subjectKey].session_count++;
                by_subject[subjectKey].total_time_spent_minutes += session.time_spent || 0;
            });
        }

        return {
            success: true,
            count: sessions.length,
            sessions: sessions,
            statistics: stats,
            by_subject: by_subject,
            filters_applied: {
                subject_id,
                goal_id,
                start_date,
                end_date
            }
        };

    } catch (error) {
        console.error('Error fetching study sessions:', error);
        throw new Error(`Failed to fetch study sessions: ${error.message}`);
    }
}

export const getSessionsSchema = {
    name: "get_sessions",
    description: "Retrieve study sessions with optional filtering by subject, goal, and date range. Returns session details with statistics including total time spent and breakdowns by subject. Sessions contain information like date, day, activity, topics_covered, notes, and can be linked to subjects and goals.",
    inputSchema: {
        type: "object",
        properties: {
            subject_id: {
                type: "number",
                description: "Filter sessions by subject ID"
            },
            goal_id: {
                type: "number",
                description: "Filter sessions by goal ID"
            },
            start_date: {
                type: "string",
                description: "Filter sessions from this date (ISO format: YYYY-MM-DD)"
            },
            end_date: {
                type: "string",
                description: "Filter sessions until this date (ISO format: YYYY-MM-DD)"
            },
            limit: {
                type: "number",
                description: "Maximum number of sessions to return (default: 50)",
                default: 50
            }
        }
    }
};
