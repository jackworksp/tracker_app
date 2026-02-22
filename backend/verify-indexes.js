/**
 * verify-indexes.js
 *
 * Database Index Verification Script for Vela Study Tracker
 *
 * This script connects to the Neon PostgreSQL database and verifies that all
 * required indexes from database.js are properly created. It provides:
 *
 * - Color-coded output (✅ green for existing, ❌ red for missing)
 * - Index statistics (size, scan count, tuples read/fetched)
 * - Priority levels (HIGH, MEDIUM, LOW) for missing indexes
 * - SQL statements to create missing indexes
 * - Coverage percentage and summary report
 *
 * Usage:
 *   node backend/verify-indexes.js
 *
 * Prerequisites:
 *   - .env file with DATABASE_URL configured
 *   - pg package installed (npm install pg)
 *
 * Output:
 *   - Lists all tables with their expected and actual indexes
 *   - Shows index usage statistics from pg_stat_user_indexes
 *   - Highlights missing indexes with priority levels
 *   - Provides CREATE INDEX SQL for missing indexes
 *   - Reports overall coverage percentage
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// Define all expected indexes from database.js
const expectedIndexes = {
    'attachment_folders': [
        {
            name: 'idx_attachment_folders_user_id',
            columns: ['user_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_attachment_folders_parent_id',
            columns: ['parent_id'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: 'parent_id IS NOT NULL'
        }
    ],
    'tasks': [
        {
            name: 'idx_tasks_reminder_time',
            columns: ['reminder_time'],
            type: 'btree',
            priority: 'HIGH',
            condition: 'reminder_dismissed = FALSE'
        },
        {
            name: 'idx_tasks_user_attachments',
            columns: ['user_id', 'attachment_url'],
            type: 'btree',
            priority: 'HIGH',
            condition: 'attachment_url IS NOT NULL'
        },
        {
            name: 'idx_tasks_user_url',
            columns: ['user_id', 'url'],
            type: 'btree',
            priority: 'HIGH',
            condition: 'url IS NOT NULL'
        },
        {
            name: 'idx_tasks_folder_id',
            columns: ['folder_id'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: 'folder_id IS NOT NULL'
        },
        {
            name: 'idx_tasks_parent',
            columns: ['parent_task_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: 'parent_task_id IS NOT NULL'
        },
        {
            name: 'idx_tasks_user_toplevel',
            columns: ['user_id', 'parent_task_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: 'parent_task_id IS NULL'
        }
    ],
    'study_sessions': [
        {
            name: 'idx_sessions_url',
            columns: ['url'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: 'url IS NOT NULL'
        },
        {
            name: 'idx_study_sessions_folder_id',
            columns: ['folder_id'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: 'folder_id IS NOT NULL'
        }
    ],
    'attachments': [
        {
            name: 'idx_attachments_folder_id',
            columns: ['folder_id'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: 'folder_id IS NOT NULL'
        }
    ],
    'note_tasks': [
        {
            name: 'idx_note_tasks_task_id',
            columns: ['task_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_note_tasks_note_id',
            columns: ['note_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        }
    ],
    'note_sessions': [
        {
            name: 'idx_note_sessions_session_id',
            columns: ['session_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_note_sessions_note_id',
            columns: ['note_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        }
    ],
    'journal_entries': [
        {
            name: 'idx_journal_entries_goal_id',
            columns: ['goal_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_journal_entries_user_id',
            columns: ['user_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_journal_entries_entry_date',
            columns: ['entry_date'],
            type: 'btree',
            priority: 'MEDIUM',
            condition: null
        }
    ],
    'journal_sessions': [
        {
            name: 'idx_journal_sessions_journal_id',
            columns: ['journal_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        },
        {
            name: 'idx_journal_sessions_session_id',
            columns: ['session_id'],
            type: 'btree',
            priority: 'HIGH',
            condition: null
        }
    ]
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'HIGH': return 'red';
        case 'MEDIUM': return 'yellow';
        case 'LOW': return 'gray';
        default: return 'reset';
    }
}

async function verifyIndexes() {
    let client;
    try {
        client = await pool.connect();
        console.log(colorize('\n🔍 DATABASE INDEX VERIFICATION REPORT', 'bright'));
        console.log(colorize('═'.repeat(80), 'gray'));
        console.log(colorize(`Connected to: ${pool.options.connectionString.split('@')[1]?.split('?')[0] || 'database'}`, 'dim'));
        console.log(colorize(`Timestamp: ${new Date().toISOString()}`, 'dim'));
        console.log(colorize('═'.repeat(80), 'gray'));

        // Query all indexes in the database
        const indexQuery = `
            SELECT
                n.nspname as schemaname,
                t.relname as tablename,
                i.relname as indexname,
                pg_get_indexdef(i.oid) as indexdef
            FROM pg_class i
            JOIN pg_index ix ON i.oid = ix.indexrelid
            JOIN pg_class t ON ix.indrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE n.nspname = 'public'
            AND i.relkind = 'i'
            ORDER BY t.relname, i.relname;
        `;

        const result = await client.query(indexQuery);
        const actualIndexes = {};

        // Group actual indexes by table
        result.rows.forEach(row => {
            if (!actualIndexes[row.tablename]) {
                actualIndexes[row.tablename] = [];
            }
            actualIndexes[row.tablename].push({
                name: row.indexname,
                definition: row.indexdef
            });
        });

        // Get index sizes (if available)
        const sizeQuery = `
            SELECT
                n.nspname as schemaname,
                t.relname as tablename,
                i.relname as indexname,
                pg_size_pretty(pg_relation_size(i.oid)) as size,
                s.idx_scan as scans,
                s.idx_tup_read as tuples_read,
                s.idx_tup_fetch as tuples_fetched
            FROM pg_class i
            JOIN pg_index ix ON i.oid = ix.indexrelid
            JOIN pg_class t ON ix.indrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            LEFT JOIN pg_stat_user_indexes s ON i.relname = s.indexrelname AND t.relname = s.relname
            WHERE n.nspname = 'public'
            AND i.relkind = 'i'
            ORDER BY t.relname, i.relname;
        `;

        const sizeResult = await client.query(sizeQuery);
        const indexStats = {};

        sizeResult.rows.forEach(row => {
            indexStats[row.indexname] = {
                size: row.size,
                scans: row.scans,
                tuples_read: row.tuples_read,
                tuples_fetched: row.tuples_fetched
            };
        });

        // Statistics
        let totalExpected = 0;
        let totalFound = 0;
        let totalMissing = 0;
        let criticalMissing = 0;
        const missingIndexes = [];

        // Check each table
        console.log(colorize('\n📊 INDEX STATUS BY TABLE', 'bright'));
        console.log(colorize('─'.repeat(80), 'gray'));

        const tables = [...new Set([
            ...Object.keys(expectedIndexes),
            ...Object.keys(actualIndexes)
        ])].sort();

        for (const table of tables) {
            const expected = expectedIndexes[table] || [];
            const actual = actualIndexes[table] || [];
            const actualNames = actual.map(idx => idx.name);

            totalExpected += expected.length;

            console.log(colorize(`\n📋 Table: ${table}`, 'cyan'));

            if (expected.length === 0) {
                console.log(colorize('   ℹ No indexes expected', 'dim'));
            }

            // Check each expected index
            for (const expectedIdx of expected) {
                const exists = actualNames.includes(expectedIdx.name);

                if (exists) {
                    totalFound++;
                    const stats = indexStats[expectedIdx.name];
                    const statusIcon = colorize('✅', 'green');
                    const priorityLabel = colorize(expectedIdx.priority.padEnd(6), getPriorityColor(expectedIdx.priority));

                    console.log(`   ${statusIcon} ${expectedIdx.name}`);
                    console.log(colorize(`      Priority: ${priorityLabel}  Type: ${expectedIdx.type}`, 'dim'));
                    console.log(colorize(`      Columns: ${expectedIdx.columns.join(', ')}`, 'dim'));

                    if (expectedIdx.condition) {
                        console.log(colorize(`      Condition: WHERE ${expectedIdx.condition}`, 'dim'));
                    }

                    if (stats) {
                        const usageInfo = `Size: ${stats.size}  |  Scans: ${stats.scans || 0}  |  Tuples: ${stats.tuples_read || 0}`;
                        console.log(colorize(`      ${usageInfo}`, 'gray'));
                    }
                } else {
                    totalMissing++;
                    if (expectedIdx.priority === 'HIGH') {
                        criticalMissing++;
                    }

                    const statusIcon = colorize('❌', 'red');
                    const priorityLabel = colorize(expectedIdx.priority.padEnd(6), getPriorityColor(expectedIdx.priority));

                    console.log(`   ${statusIcon} ${colorize(expectedIdx.name, 'red')} ${colorize('(MISSING)', 'bright')}`);
                    console.log(colorize(`      Priority: ${priorityLabel}  Type: ${expectedIdx.type}`, 'dim'));
                    console.log(colorize(`      Columns: ${expectedIdx.columns.join(', ')}`, 'dim'));

                    if (expectedIdx.condition) {
                        console.log(colorize(`      Condition: WHERE ${expectedIdx.condition}`, 'dim'));
                    }

                    missingIndexes.push({
                        table,
                        ...expectedIdx
                    });
                }
            }

            // Show unexpected indexes (not in expected list)
            const expectedNames = expected.map(idx => idx.name);
            const unexpectedIndexes = actual.filter(idx => {
                // Exclude system-generated indexes
                if (idx.name.endsWith('_pkey')) return false; // Primary keys
                if (idx.name.endsWith('_key')) return false; // Unique constraints
                if (idx.name.startsWith('PK_')) return false; // EF Core primary keys
                if (idx.name.startsWith('IX_')) return false; // EF Core indexes
                if (idx.name.includes('Index')) return false; // EF Core indexes
                if (idx.name.startsWith('ix_')) return false; // Python/SQLAlchemy indexes from other apps
                return !expectedNames.includes(idx.name);
            });

            if (unexpectedIndexes.length > 0) {
                console.log(colorize('\n   📌 Additional custom indexes found:', 'yellow'));
                unexpectedIndexes.forEach(idx => {
                    const stats = indexStats[idx.name];
                    console.log(colorize(`      • ${idx.name}`, 'yellow'));
                    if (stats) {
                        const usageInfo = `Size: ${stats.size}  |  Scans: ${stats.scans || 0}`;
                        console.log(colorize(`        ${usageInfo}`, 'gray'));
                    }
                });
            }
        }

        // Summary
        console.log(colorize('\n\n📈 SUMMARY', 'bright'));
        console.log(colorize('═'.repeat(80), 'gray'));
        console.log(`Total Expected Indexes: ${colorize(totalExpected.toString(), 'cyan')}`);
        console.log(`Indexes Found: ${colorize(totalFound.toString(), 'green')} ${colorize('✅', 'green')}`);
        console.log(`Indexes Missing: ${colorize(totalMissing.toString(), totalMissing > 0 ? 'red' : 'green')} ${totalMissing > 0 ? colorize('❌', 'red') : colorize('✅', 'green')}`);
        console.log(`Critical Missing (HIGH priority): ${colorize(criticalMissing.toString(), criticalMissing > 0 ? 'red' : 'green')}`);

        const coverage = totalExpected > 0 ? ((totalFound / totalExpected) * 100).toFixed(1) : 100;
        const coverageColor = coverage >= 100 ? 'green' : coverage >= 80 ? 'yellow' : 'red';
        console.log(`Coverage: ${colorize(`${coverage}%`, coverageColor)}`);

        // Missing indexes report
        if (missingIndexes.length > 0) {
            console.log(colorize('\n\n⚠️  MISSING INDEXES REPORT', 'bright'));
            console.log(colorize('═'.repeat(80), 'gray'));
            console.log(colorize('The following indexes should be created:', 'yellow'));

            // Group by priority
            const byPriority = {
                HIGH: missingIndexes.filter(idx => idx.priority === 'HIGH'),
                MEDIUM: missingIndexes.filter(idx => idx.priority === 'MEDIUM'),
                LOW: missingIndexes.filter(idx => idx.priority === 'LOW')
            };

            for (const [priority, indexes] of Object.entries(byPriority)) {
                if (indexes.length === 0) continue;

                console.log(colorize(`\n${priority} PRIORITY (${indexes.length})`, getPriorityColor(priority)));
                console.log(colorize('─'.repeat(80), 'gray'));

                indexes.forEach(idx => {
                    console.log(colorize(`\nTable: ${idx.table}`, 'cyan'));
                    console.log(`Index: ${idx.name}`);
                    console.log(`Columns: ${idx.columns.join(', ')}`);
                    if (idx.condition) {
                        console.log(`Condition: WHERE ${idx.condition}`);
                    }

                    // Generate CREATE INDEX SQL
                    const createSQL = generateCreateIndexSQL(idx);
                    console.log(colorize('\nSQL:', 'blue'));
                    console.log(colorize(createSQL, 'dim'));
                });
            }
        }

        // Show most used indexes
        console.log(colorize('\n\n📊 TOP 10 MOST USED INDEXES', 'bright'));
        console.log(colorize('═'.repeat(80), 'gray'));

        const allIndexStats = Object.entries(indexStats)
            .filter(([name, stats]) => {
                // Only show Vela app indexes (exclude system/other app indexes)
                return !name.startsWith('ix_') && !name.startsWith('PK_') && !name.startsWith('IX_') &&
                       !name.endsWith('_key') && stats.scans > 0;
            })
            .sort((a, b) => b[1].scans - a[1].scans)
            .slice(0, 10);

        if (allIndexStats.length > 0) {
            allIndexStats.forEach(([name, stats], index) => {
                const rank = colorize(`${(index + 1).toString().padStart(2)}.`, 'cyan');
                const scans = colorize(stats.scans.toLocaleString().padStart(10), 'green');
                const size = colorize(stats.size.padStart(12), 'dim');
                const tuples = stats.tuples_read ? colorize(stats.tuples_read.toLocaleString().padStart(10), 'yellow') : colorize('0'.padStart(10), 'gray');
                console.log(`${rank} ${name.padEnd(40)} | Scans: ${scans} | Size: ${size} | Tuples: ${tuples}`);
            });
        } else {
            console.log(colorize('   No index usage statistics available yet.', 'dim'));
        }

        // Final status
        console.log(colorize('\n\n' + '═'.repeat(80), 'gray'));
        if (totalMissing === 0) {
            console.log(colorize('✅ ALL INDEXES ARE PRESENT AND ACCOUNTED FOR!', 'green'));
        } else if (criticalMissing > 0) {
            console.log(colorize('❌ CRITICAL: Missing high-priority indexes detected!', 'red'));
            console.log(colorize('   Run database.js initialization to create missing indexes.', 'yellow'));
        } else {
            console.log(colorize('⚠️  WARNING: Some non-critical indexes are missing.', 'yellow'));
            console.log(colorize('   Consider creating them for optimal performance.', 'yellow'));
        }
        console.log(colorize('═'.repeat(80) + '\n', 'gray'));

    } catch (err) {
        console.error(colorize('\n❌ Error verifying indexes:', 'red'), err);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

function generateCreateIndexSQL(index) {
    const conditionClause = index.condition ? ` WHERE ${index.condition}` : '';
    const columns = index.columns.join(', ');
    return `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${columns})${conditionClause};`;
}

// Run verification
verifyIndexes();
