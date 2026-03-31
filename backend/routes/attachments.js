const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

function buildAttachmentsBaseCte() {
    return `
        WITH standalone_attachments AS (
            SELECT
                'attachment-' || a.id::text as id,
                'url' as type,
                'standalone' as source,
                a.id as source_id,
                a.title,
                a.url,
                NULL::jsonb as note_data,
                a.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                a.folder_id,
                af.name as folder_name,
                a.created_at,
                jsonb_build_object(
                    'platform', a.platform,
                    'attachment_type', a.type
                ) as metadata
            FROM attachments a
            LEFT JOIN subjects s ON a.subject_id = s.id
            LEFT JOIN attachment_folders af ON a.folder_id = af.id
            WHERE a.user_id = $1
        ),
        task_attachment_urls AS (
            SELECT
                'task-' || t.id::text as id,
                'url' as type,
                'task' as source,
                t.id as source_id,
                COALESCE(NULLIF(TRIM(t.attachment_url_title), ''), t.title) as title,
                t.attachment_url as url,
                NULL::jsonb as note_data,
                t.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                t.folder_id,
                af.name as folder_name,
                t.created_at,
                jsonb_build_object(
                    'completed', t.completed,
                    'rating', t.rating,
                    'task_type', t.type,
                    'goal_id', t.goal_id,
                    'attachment_title', t.attachment_url_title
                ) as metadata
            FROM tasks t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN attachment_folders af ON t.folder_id = af.id
            WHERE t.user_id = $1
              AND t.attachment_url IS NOT NULL
              AND t.attachment_url != ''
        ),
        task_content_urls AS (
            SELECT
                'task-url-' || t.id::text as id,
                'url' as type,
                'task' as source,
                t.id as source_id,
                COALESCE(NULLIF(TRIM(t.url_title), ''), t.title) as title,
                t.url,
                NULL::jsonb as note_data,
                t.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                t.folder_id,
                af.name as folder_name,
                t.created_at,
                jsonb_build_object(
                    'completed', t.completed,
                    'rating', t.rating,
                    'task_type', t.type,
                    'goal_id', t.goal_id,
                    'attachment_title', t.url_title
                ) as metadata
            FROM tasks t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN attachment_folders af ON t.folder_id = af.id
            WHERE t.user_id = $1
              AND t.url IS NOT NULL
              AND t.url != ''
              AND t.type IN ('WATCH', 'READ')
        ),
        session_urls AS (
            SELECT
                'session-' || ss.id::text as id,
                'url' as type,
                'session' as source,
                ss.id as source_id,
                COALESCE(NULLIF(TRIM(ss.url_title), ''), ss.activity) as title,
                ss.url,
                NULL::jsonb as note_data,
                ss.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                ss.folder_id,
                af.name as folder_name,
                ss.date as created_at,
                jsonb_build_object(
                    'time_spent', ss.time_spent,
                    'revision_count', ss.revision_count,
                    'session_type', ss.type,
                    'goal_id', ss.goal_id,
                    'attachment_title', ss.url_title
                ) as metadata
            FROM study_sessions ss
            INNER JOIN subjects s ON ss.subject_id = s.id AND s.user_id = $1
            LEFT JOIN attachment_folders af ON ss.folder_id = af.id
            WHERE ss.url IS NOT NULL AND ss.url != ''
        ),
        task_note_links AS (
            SELECT
                'note-task-' || nt.id::text as id,
                'note' as type,
                'task' as source,
                t.id as source_id,
                t.title,
                NULL as url,
                jsonb_build_object(
                    'id', n.id,
                    'title', n.title,
                    'content', SUBSTRING(n.content, 1, 200),
                    'tags', n.tags
                ) as note_data,
                t.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                t.folder_id,
                af.name as folder_name,
                nt.created_at,
                jsonb_build_object(
                    'completed', t.completed,
                    'task_type', t.type,
                    'note_id', n.id
                ) as metadata
            FROM note_tasks nt
            INNER JOIN tasks t ON nt.task_id = t.id
            INNER JOIN notes n ON nt.note_id = n.id
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN attachment_folders af ON t.folder_id = af.id
            WHERE t.user_id = $1 AND n.user_id = $1
        ),
        session_note_links AS (
            SELECT
                'note-session-' || ns.id::text as id,
                'note' as type,
                'session' as source,
                ss.id as source_id,
                ss.activity as title,
                NULL as url,
                jsonb_build_object(
                    'id', n.id,
                    'title', n.title,
                    'content', SUBSTRING(n.content, 1, 200),
                    'tags', n.tags
                ) as note_data,
                ss.subject_id,
                COALESCE(s.name, 'No Subject') as subject_name,
                ss.folder_id,
                af.name as folder_name,
                ns.created_at,
                jsonb_build_object(
                    'time_spent', ss.time_spent,
                    'session_type', ss.type,
                    'note_id', n.id
                ) as metadata
            FROM note_sessions ns
            INNER JOIN study_sessions ss ON ns.session_id = ss.id
            INNER JOIN notes n ON ns.note_id = n.id
            INNER JOIN subjects s ON ss.subject_id = s.id AND s.user_id = $1
            LEFT JOIN attachment_folders af ON ss.folder_id = af.id
            WHERE n.user_id = $1
        ),
        all_attachments AS (
            SELECT * FROM standalone_attachments
            UNION ALL SELECT * FROM task_attachment_urls
            UNION ALL SELECT * FROM task_content_urls
            UNION ALL SELECT * FROM session_urls
            UNION ALL SELECT * FROM task_note_links
            UNION ALL SELECT * FROM session_note_links
        )
    `;
}

function buildAttachmentsFilterClause({
    subjectParam,
    typeParam,
    sourceParam,
    searchParam,
    folderParam,
    platformParam,
    fileTypeParam
}) {
    return `
        WHERE ($${subjectParam}::INTEGER IS NULL OR subject_id = $${subjectParam})
          AND ($${typeParam}::TEXT IS NULL OR type = $${typeParam})
          AND ($${sourceParam}::TEXT IS NULL OR source = $${sourceParam})
          AND (
            $${searchParam}::TEXT IS NULL OR
            title ILIKE '%' || $${searchParam} || '%' OR
            url ILIKE '%' || $${searchParam} || '%' OR
            (note_data->>'title') ILIKE '%' || $${searchParam} || '%' OR
            (note_data->>'content') ILIKE '%' || $${searchParam} || '%'
          )
          AND ($${folderParam}::INTEGER IS NULL OR folder_id = $${folderParam})
          AND (
            $${platformParam}::TEXT IS NULL OR
            (metadata->>'platform') = $${platformParam} OR
            url ILIKE '%' || $${platformParam} || '%'
          )
          AND (
            $${fileTypeParam}::TEXT IS NULL OR
            ($${fileTypeParam} = 'pdf' AND url ILIKE '%.pdf%') OR
            ($${fileTypeParam} = 'image' AND url ~* '\\.(jpg|jpeg|png|gif|webp)(\\?|$)') OR
            ($${fileTypeParam} = 'link' AND type = 'url' AND url NOT ILIKE '%.pdf%' AND url !~* '\\.(jpg|jpeg|png|gif|webp)(\\?|$)')
          )
    `;
}

// GET all attachments (aggregated from tasks and sessions)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
        const offset = (page - 1) * limit;

        // Optional filters
        const subjectId = req.query.subject_id ? parseInt(req.query.subject_id) : null;
        const type = req.query.type; // 'url' or 'note'
        const source = req.query.source; // 'task' or 'session'
        const search = req.query.search;
        const folderId = req.query.folder_id ? parseInt(req.query.folder_id) : null;
        const platformFilter = req.query.platform;
        const fileTypeFilter = req.query.file_type; 

        const baseCte = buildAttachmentsBaseCte();
        const filters = buildAttachmentsFilterClause({
            subjectParam: 2,
            typeParam: 3,
            sourceParam: 4,
            searchParam: 5,
            folderParam: 8,
            platformParam: 9,
            fileTypeParam: 10
        });

        const query = `
            ${baseCte}
            SELECT * FROM all_attachments
            ${filters}
            ORDER BY created_at DESC
            LIMIT $6 OFFSET $7
        `;

        const params = [req.userId, subjectId, type, source, search, limit, offset, folderId, platformFilter, fileTypeFilter];
        const result = await db.query(query, params);

        // Get total count for pagination
        const countQuery = `
            ${baseCte}
            SELECT COUNT(*) FROM all_attachments
            ${buildAttachmentsFilterClause({
                subjectParam: 2,
                typeParam: 3,
                sourceParam: 4,
                searchParam: 5,
                folderParam: 6,
                platformParam: 7,
                fileTypeParam: 8
            })}
        `;

        const countResult = await db.query(countQuery, [req.userId, subjectId, type, source, search, folderId, platformFilter, fileTypeFilter]);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            },
            metadata: {
                filters: {
                    subject_id: subjectId,
                    type,
                    source,
                    search,
                    folder_id: folderId,
                    platform: platformFilter,
                    file_type: fileTypeFilter
                }
            }
        });
    } catch (err) {
        console.error('Error fetching attachments:', err);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// POST create a new standalone attachment
router.post('/', async (req, res) => {
    try {
        const { title, url, subject_id, platform } = req.body;

        // Validate required fields
        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        // Detect platform if not provided
        let detectedPlatform = platform;
        if (!detectedPlatform) {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                detectedPlatform = 'youtube';
            } else if (url.includes('instagram.com')) {
                detectedPlatform = 'instagram';
            } else if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                detectedPlatform = 'google-drive';
            } else {
                detectedPlatform = 'link';
            }
        }

        const query = `
            INSERT INTO attachments (user_id, subject_id, title, url, type, platform, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;

        const values = [
            req.userId,
            subject_id || null,
            title,
            url,
            'link',
            detectedPlatform
        ];

        const result = await db.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Attachment created successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating attachment:', err);
        res.status(500).json({ error: 'Failed to create attachment' });
    }
});

// DELETE a standalone attachment
router.delete('/:id', async (req, res) => {
    try {
        const attachmentId = req.params.id;

        // Parse attachment ID to determine the type
        const idParts = attachmentId.split('-');

        if (idParts[0] === 'attachment') {
            // Standalone attachment - delete from attachments table
            const numericId = parseInt(idParts[1]);
            const query = `
                DELETE FROM attachments
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `;
            const result = await db.query(query, [numericId, req.userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Attachment not found' });
            }

            return res.json({
                success: true,
                message: 'Attachment deleted successfully'
            });
        } else {
            // Legacy delete handling for task/session attachments
            // This is handled by setting attachment_url to null or deleting the task/session
            return res.status(400).json({
                error: 'Cannot delete attachments from tasks or sessions. Please edit the source.'
            });
        }
    } catch (err) {
        console.error('Error deleting attachment:', err);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

// PUT move attachment to folder
router.put('/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { folder_id } = req.body;
        const userId = req.userId;

        // Validate folder if provided
        if (folder_id !== null && folder_id !== undefined) {
            const folderCheck = await db.query(
                'SELECT id FROM attachment_folders WHERE id = $1 AND user_id = $2',
                [folder_id, userId]
            );
            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        // Parse composite ID and route to correct table
        if (id.startsWith('attachment-')) {
            const attachmentId = parseInt(id.replace('attachment-', ''));
            await db.query(
                'UPDATE attachments SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [folder_id, attachmentId, userId]
            );
        } else if (id.startsWith('task-url-')) {
            const taskId = parseInt(id.replace('task-url-', ''));
            await db.query(
                'UPDATE tasks SET folder_id = $1 WHERE id = $2 AND user_id = $3',
                [folder_id, taskId, userId]
            );
        } else if (id.startsWith('task-')) {
            const taskId = parseInt(id.replace('task-', ''));
            await db.query(
                'UPDATE tasks SET folder_id = $1 WHERE id = $2 AND user_id = $3',
                [folder_id, taskId, userId]
            );
        } else if (id.startsWith('session-')) {
            const sessionId = parseInt(id.replace('session-', ''));
            await db.query(
                `UPDATE study_sessions SET folder_id = $1
                 WHERE id = $2 AND subject_id IN (SELECT id FROM subjects WHERE user_id = $3)`,
                [folder_id, sessionId, userId]
            );
        } else if (id.startsWith('note-task-') || id.startsWith('note-session-')) {
            return res.status(400).json({ error: 'Note links cannot be moved to folders directly. Move the parent task or session instead.' });
        } else {
            return res.status(400).json({ error: 'Invalid attachment ID format' });
        }

        res.json({ message: 'Attachment moved successfully' });
    } catch (err) {
        console.error('Error moving attachment:', err);
        res.status(500).json({ error: 'Failed to move attachment' });
    }
});

// PUT move standalone attachment to subject
router.put('/:id/subject', async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_id } = req.body;
        const userId = req.userId;

        const idMatch = id.match(/^attachment-(\d+)$/);
        if (!idMatch) {
            return res.status(400).json({
                error: 'Only standalone attachments can be moved to a subject'
            });
        }
        const attachmentId = parseInt(idMatch[1], 10);

        const normalizedSubjectId = subject_id === null ? null : Number(subject_id);
        if (subject_id !== null && !Number.isInteger(normalizedSubjectId)) {
            return res.status(400).json({ error: 'subject_id must be an integer or null' });
        }

        if (normalizedSubjectId !== null) {
            const subjectCheck = await db.query(
                'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
                [normalizedSubjectId, userId]
            );
            if (subjectCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }
        }

        const result = await db.query(
            `UPDATE attachments
             SET subject_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [normalizedSubjectId, attachmentId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        res.json({ data: result.rows[0] });
    } catch (err) {
        console.error('Error moving attachment to subject:', err);
        res.status(500).json({ error: 'Failed to move attachment to subject' });
    }
});

// PUT rename an attachment title
router.put('/:id/rename', async (req, res) => {
    try {
        const { id } = req.params;
        const rawTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const userId = req.userId;

        if (!rawTitle) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (rawTitle.length > 500) {
            return res.status(400).json({ error: 'Title must be 500 characters or fewer' });
        }

        let result;

        if (id.startsWith('attachment-')) {
            const attachmentId = parseInt(id.replace('attachment-', ''), 10);
            result = await db.query(
                `UPDATE attachments
                 SET title = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND user_id = $3
                 RETURNING id, title`,
                [rawTitle, attachmentId, userId]
            );
        } else if (id.startsWith('task-url-')) {
            const taskId = parseInt(id.replace('task-url-', ''), 10);
            result = await db.query(
                `UPDATE tasks
                 SET url_title = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND user_id = $3
                   AND url IS NOT NULL AND url != ''
                 RETURNING id, url_title as title`,
                [rawTitle, taskId, userId]
            );
        } else if (id.startsWith('task-')) {
            const taskId = parseInt(id.replace('task-', ''), 10);
            result = await db.query(
                `UPDATE tasks
                 SET attachment_url_title = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND user_id = $3
                   AND attachment_url IS NOT NULL AND attachment_url != ''
                 RETURNING id, attachment_url_title as title`,
                [rawTitle, taskId, userId]
            );
        } else if (id.startsWith('session-')) {
            const sessionId = parseInt(id.replace('session-', ''), 10);
            result = await db.query(
                `UPDATE study_sessions
                 SET url_title = $1
                 WHERE id = $2
                   AND url IS NOT NULL AND url != ''
                   AND subject_id IN (SELECT id FROM subjects WHERE user_id = $3)
                 RETURNING id, url_title as title`,
                [rawTitle, sessionId, userId]
            );
        } else if (id.startsWith('note-task-') || id.startsWith('note-session-')) {
            return res.status(400).json({ error: 'Note links cannot be renamed.' });
        } else {
            return res.status(400).json({ error: 'Invalid attachment ID format' });
        }

        if (!result || result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        res.json({
            success: true,
            data: {
                id,
                title: result.rows[0].title
            }
        });
    } catch (err) {
        console.error('Error renaming attachment:', err);
        res.status(500).json({ error: 'Failed to rename attachment' });
    }
});

// POST bulk move attachments
router.post('/bulk-move', async (req, res) => {
    try {
        const { attachment_ids, folder_id } = req.body;
        const userId = req.userId;

        if (!Array.isArray(attachment_ids) || attachment_ids.length === 0) {
            return res.status(400).json({ error: 'attachment_ids must be a non-empty array' });
        }

        // Validate folder if provided
        if (folder_id !== null && folder_id !== undefined) {
            const folderCheck = await db.query(
                'SELECT id FROM attachment_folders WHERE id = $1 AND user_id = $2',
                [folder_id, userId]
            );
            if (folderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (const id of attachment_ids) {
            try {
                // Parse composite ID and route to correct table (same logic as single move)
                if (id.startsWith('attachment-')) {
                    const attachmentId = parseInt(id.replace('attachment-', ''));
                    await db.query(
                        'UPDATE attachments SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                        [folder_id, attachmentId, userId]
                    );
                    successCount++;
                } else if (id.startsWith('task-url-')) {
                    const taskId = parseInt(id.replace('task-url-', ''));
                    await db.query(
                        'UPDATE tasks SET folder_id = $1 WHERE id = $2 AND user_id = $3',
                        [folder_id, taskId, userId]
                    );
                    successCount++;
                } else if (id.startsWith('task-')) {
                    const taskId = parseInt(id.replace('task-', ''));
                    await db.query(
                        'UPDATE tasks SET folder_id = $1 WHERE id = $2 AND user_id = $3',
                        [folder_id, taskId, userId]
                    );
                    successCount++;
                } else if (id.startsWith('session-')) {
                    const sessionId = parseInt(id.replace('session-', ''));
                    await db.query(
                        `UPDATE study_sessions SET folder_id = $1
                         WHERE id = $2 AND subject_id IN (SELECT id FROM subjects WHERE user_id = $3)`,
                        [folder_id, sessionId, userId]
                    );
                    successCount++;
                } else if (id.startsWith('note-task-') || id.startsWith('note-session-')) {
                    failedCount++;
                    errors.push({ id, error: 'Note links cannot be moved to folders' });
                } else {
                    failedCount++;
                    errors.push({ id, error: 'Invalid attachment ID format' });
                }
            } catch (error) {
                failedCount++;
                errors.push({ id, error: error.message });
            }
        }

        res.json({
            message: 'Bulk move completed',
            successCount,
            failedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Error bulk moving attachments:', err);
        res.status(500).json({ error: 'Failed to bulk move attachments' });
    }
});

module.exports = router;
