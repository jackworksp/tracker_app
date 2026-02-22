#!/usr/bin/env node

/**
 * Index Verification Script
 *
 * This script checks which indexes exist and provides a report on missing indexes.
 * Run this before and after migration to verify completion.
 *
 * Usage:
 *   node verify-indexes.js
 *   npm run verify:indexes
 */

const pool = require('../database');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Expected indexes from migration
const EXPECTED_INDEXES = {
    user_settings: [
        'idx_user_settings_user_id'
    ],
    study_sessions: [
        'idx_study_sessions_subject_id',
        'idx_study_sessions_goal_id',
        'idx_study_sessions_date',
        'idx_study_sessions_subject_date'
    ],
    subjects: [
        'idx_subjects_user_id',
        'idx_subjects_user_created'
    ],
    notes: [
        'idx_notes_user_id',
        'idx_notes_folder_id',
        'idx_notes_subject_id',
        'idx_notes_is_pinned',
        'idx_notes_updated_at',
        'idx_notes_user_pinned_updated',
        'idx_notes_tags_gin'
    ],
    topics: [
        'idx_topics_subject_id',
        'idx_topics_subject_completed'
    ],
    tasks: [
        'idx_tasks_goal_id',
        'idx_tasks_subject_id',
        'idx_tasks_user_status',
        'idx_tasks_user_completed',
        'idx_tasks_created_at',
        'idx_tasks_subject_user'
    ],
    goals: [
        'idx_goals_user_id',
        'idx_goals_user_created',
        'idx_goals_status',
        'idx_goals_category'
    ],
    revision_items: [
        'idx_revision_items_subject_id',
        'idx_revision_items_created_at_desc',
        'idx_revision_items_subject_created'
    ],
    note_folders: [
        'idx_note_folders_user_id',
        'idx_note_folders_parent_id'
    ],
    attachments: [
        'idx_attachments_user_id',
        'idx_attachments_subject_id',
        'idx_attachments_created_at_desc',
        'idx_attachments_user_created'
    ]
};

async function verifyIndexes() {
    log('\n' + '='.repeat(70), colors.bright);
    log('INDEX VERIFICATION REPORT', colors.bright);
    log('='.repeat(70), colors.bright);
    log(`Generated at: ${new Date().toISOString()}\n`, colors.cyan);

    const client = await pool.connect();
    try {
        // Get all current indexes
        const result = await client.query(`
            SELECT
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);

        // Organize indexes by table
        const currentIndexes = {};
        result.rows.forEach(row => {
            if (!currentIndexes[row.tablename]) {
                currentIndexes[row.tablename] = [];
            }
            currentIndexes[row.tablename].push(row.indexname);
        });

        // Check each table
        let totalExpected = 0;
        let totalFound = 0;
        let totalMissing = 0;

        for (const [tableName, expectedIndexList] of Object.entries(EXPECTED_INDEXES)) {
            const tableIndexes = currentIndexes[tableName] || [];
            const foundIndexes = [];
            const missingIndexes = [];

            expectedIndexList.forEach(indexName => {
                totalExpected++;
                if (tableIndexes.includes(indexName)) {
                    foundIndexes.push(indexName);
                    totalFound++;
                } else {
                    missingIndexes.push(indexName);
                    totalMissing++;
                }
            });

            // Report for this table
            const tableStatus = missingIndexes.length === 0 ? '✓' : '✗';
            const statusColor = missingIndexes.length === 0 ? colors.green : colors.red;

            log(`${tableStatus} ${tableName}`, statusColor);
            log(`  Expected: ${expectedIndexList.length} | Found: ${foundIndexes.length} | Missing: ${missingIndexes.length}`);

            if (missingIndexes.length > 0) {
                log(`  Missing indexes:`, colors.yellow);
                missingIndexes.forEach(idx => {
                    log(`    - ${idx}`, colors.yellow);
                });
            }

            // Show actual indexes (including ones not in expected list)
            const extraIndexes = tableIndexes.filter(idx =>
                !expectedIndexList.includes(idx) &&
                !idx.startsWith(tableName + '_pkey') // Exclude primary keys
            );

            if (extraIndexes.length > 0) {
                log(`  Additional indexes:`, colors.cyan);
                extraIndexes.forEach(idx => {
                    log(`    + ${idx}`, colors.cyan);
                });
            }

            log(''); // Empty line between tables
        }

        // Summary
        log('='.repeat(70), colors.bright);
        log('SUMMARY', colors.bright);
        log('='.repeat(70), colors.bright);

        const completionRate = ((totalFound / totalExpected) * 100).toFixed(1);
        log(`Total Expected Indexes: ${totalExpected}`);
        log(`Indexes Found: ${totalFound}`, totalMissing === 0 ? colors.green : colors.yellow);
        log(`Indexes Missing: ${totalMissing}`, totalMissing === 0 ? colors.green : colors.red);
        log(`Completion Rate: ${completionRate}%`, totalMissing === 0 ? colors.green : colors.yellow);

        if (totalMissing === 0) {
            log('\n✓ All expected indexes are present!', colors.green);
            log('\nNext steps:', colors.bright);
            log('  1. Run ANALYZE to update statistics');
            log('  2. Monitor query performance');
            log('  3. Check index usage with pg_stat_user_indexes\n');
        } else {
            log('\n✗ Some indexes are missing!', colors.red);
            log('\nTo add missing indexes:', colors.bright);
            log('  npm run migrate add-missing-indexes.sql\n');
        }

        // Index usage statistics (if any indexes exist)
        if (totalFound > 0) {
            log('='.repeat(70), colors.bright);
            log('INDEX USAGE STATISTICS (Top 10)', colors.bright);
            log('='.repeat(70), colors.bright);

            const usageResult = await client.query(`
                SELECT
                    tablename,
                    indexname,
                    idx_scan as scans,
                    idx_tup_read as tuples_read,
                    idx_tup_fetch as tuples_fetched,
                    pg_size_pretty(pg_relation_size(indexrelid)) as size
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                ORDER BY idx_scan DESC
                LIMIT 10
            `);

            if (usageResult.rows.length > 0) {
                log('');
                usageResult.rows.forEach((row, i) => {
                    log(`${i + 1}. ${row.tablename}.${row.indexname}`);
                    log(`   Scans: ${row.scans} | Tuples Read: ${row.tuples_read} | Size: ${row.size}`);
                });
            } else {
                log('\nNo usage statistics available yet.', colors.yellow);
            }
            log('');
        }

    } catch (error) {
        log('\n✗ Error during verification:', colors.red);
        log(error.message, colors.red);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Main execution
if (require.main === module) {
    verifyIndexes().catch(error => {
        log(`\n✗ Unexpected error: ${error.message}`, colors.red);
        console.error(error);
        process.exit(1);
    });
}

module.exports = { verifyIndexes };
