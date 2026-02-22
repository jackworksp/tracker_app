import pool from '../database.js';
import { getUserId } from '../config.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Log a study session
 * @param {Object} args
 * @param {string} args.activity - Session activity/title (required)
 * @param {number} args.time_spent - Time spent in minutes (required)
 * @param {number} [args.subject_id] - Subject ID
 * @param {string} [args.date] - Session date (ISO: YYYY-MM-DD, defaults to today)
 * @param {string} [args.type] - Session type (STUDY, WATCH, READ, PRACTICE, NOTES, LISTEN)
 * @param {string} [args.notes] - Session notes
 * @param {string} [args.topics_covered] - Topics covered
 * @param {string} [args.url] - Related URL
 * @param {number} [args.goal_id] - Link to a goal
 * @param {number} [args.revision_count] - Number of revisions
 */
export async function addSession(args) {
    const {
        activity,
        time_spent,
        subject_id,
        date,
        type = 'STUDY',
        notes,
        topics_covered,
        url,
        goal_id,
        revision_count = 0
    } = args;

    if (!activity || activity.trim() === '') throw new Error('activity is required');
    if (time_spent === undefined || time_spent === null) throw new Error('time_spent (in minutes) is required');
    if (time_spent < 0) throw new Error('time_spent cannot be negative');

    const validTypes = ['STUDY', 'WATCH', 'READ', 'PRACTICE', 'NOTES', 'LISTEN', 'TASK'];
    if (type && !validTypes.includes(type)) {
        throw new Error(`type must be one of: ${validTypes.join(', ')}`);
    }

    // Resolve date — default to today
    const sessionDate = date ? new Date(date) : new Date();
    const dayName = DAYS[sessionDate.getDay()];

    // If subject_id provided, verify it belongs to the user
    const userId = getUserId();
    if (subject_id) {
        const subjectCheck = await pool.query(
            'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
            [subject_id, userId]
        );
        if (subjectCheck.rows.length === 0) {
            throw new Error(`Subject ${subject_id} not found or does not belong to you`);
        }
    }

    try {
        const insertQuery = `
            INSERT INTO study_sessions (
                subject_id,
                goal_id,
                date,
                day,
                activity,
                time_spent,
                topics_covered,
                notes,
                revision_count,
                type,
                url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING
                id, subject_id, goal_id, date, day, activity,
                time_spent, topics_covered, notes, revision_count, type, url, created_at
        `;

        const values = [
            subject_id || null,
            goal_id || null,
            sessionDate.toISOString().split('T')[0],
            dayName,
            activity.trim(),
            time_spent,
            topics_covered || '',
            notes || '',
            revision_count,
            type,
            url || null
        ];

        const result = await pool.query(insertQuery, values);
        const session = result.rows[0];

        // Enrich with subject/goal names
        if (session.subject_id) {
            const subjectResult = await pool.query(
                'SELECT name, color, icon FROM subjects WHERE id = $1',
                [session.subject_id]
            );
            if (subjectResult.rows.length > 0) {
                Object.assign(session, {
                    subject_name: subjectResult.rows[0].name,
                    subject_color: subjectResult.rows[0].color,
                    subject_icon: subjectResult.rows[0].icon
                });
            }
        }

        if (session.goal_id) {
            const goalResult = await pool.query(
                'SELECT title FROM goals WHERE id = $1',
                [session.goal_id]
            );
            if (goalResult.rows.length > 0) {
                session.goal_title = goalResult.rows[0].title;
            }
        }

        return {
            success: true,
            message: `Session "${activity}" logged (${time_spent} min)`,
            session
        };
    } catch (error) {
        console.error('Error adding session:', error);
        throw new Error(`Failed to add session: ${error.message}`);
    }
}

export const addSessionSchema = {
    name: 'add_session',
    description: 'Log a study session with activity, time spent, and optional subject/goal linking. Use this to record study time, watched videos, reading, practice sessions, etc.',
    inputSchema: {
        type: 'object',
        properties: {
            activity: {
                type: 'string',
                description: 'Name/title of the activity (required)'
            },
            time_spent: {
                type: 'number',
                description: 'Time spent in minutes (required)'
            },
            subject_id: {
                type: 'number',
                description: 'ID of the subject this session belongs to'
            },
            date: {
                type: 'string',
                description: 'Session date in ISO format (YYYY-MM-DD). Defaults to today.'
            },
            type: {
                type: 'string',
                enum: ['STUDY', 'WATCH', 'READ', 'PRACTICE', 'NOTES', 'LISTEN', 'TASK'],
                description: 'Session type (default: STUDY)',
                default: 'STUDY'
            },
            notes: {
                type: 'string',
                description: 'Session notes or summary'
            },
            topics_covered: {
                type: 'string',
                description: 'Topics covered during this session'
            },
            url: {
                type: 'string',
                description: 'Related URL (video, article, resource)'
            },
            goal_id: {
                type: 'number',
                description: 'Link this session to a goal'
            },
            revision_count: {
                type: 'number',
                description: 'Number of revisions done (default: 0)',
                default: 0
            }
        },
        required: ['activity', 'time_spent']
    }
};
