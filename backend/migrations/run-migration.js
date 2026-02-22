#!/usr/bin/env node

/**
 * Migration Runner Script
 *
 * This script runs SQL migration files against the database.
 *
 * Usage:
 *   node run-migration.js <migration-file.sql>
 *   npm run migrate <migration-file.sql>
 *
 * Example:
 *   node run-migration.js add-missing-indexes.sql
 */

const fs = require('fs');
const path = require('path');
const pool = require('../database');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, colors.green);
}

function logError(message) {
    log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
    log(`⚠ ${message}`, colors.yellow);
}

async function runMigration(filename) {
    const startTime = Date.now();

    log('\n' + '='.repeat(70), colors.bright);
    log('DATABASE MIGRATION RUNNER', colors.bright);
    log('='.repeat(70), colors.bright);

    logInfo(`Migration file: ${filename}`);
    logInfo(`Database: ${pool.options?.database || 'default'}`);
    logInfo(`Started at: ${new Date().toISOString()}\n`);

    // Validate file exists
    const migrationPath = path.join(__dirname, filename);
    if (!fs.existsSync(migrationPath)) {
        logError(`Migration file not found: ${filename}`);
        logInfo(`Looking in: ${__dirname}`);
        process.exit(1);
    }

    // Read migration file
    logInfo('Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const sqlLines = sql.split('\n').length;
    logSuccess(`Loaded ${sqlLines} lines of SQL`);

    // Confirm before running
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_CONFIRMATION) {
        logWarning('PRODUCTION DATABASE DETECTED!');
        logWarning('This migration will modify the production database.');
        logWarning('Press Ctrl+C to cancel, or set SKIP_CONFIRMATION=1 to bypass this check.\n');

        // Wait 5 seconds for user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Execute migration
    logInfo('Executing migration...\n');

    const client = await pool.connect();
    try {
        await client.query(sql);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('\n' + '='.repeat(70), colors.bright);
        logSuccess('MIGRATION COMPLETED SUCCESSFULLY');
        log('='.repeat(70), colors.bright);
        logInfo(`Duration: ${duration} seconds`);
        logInfo(`Finished at: ${new Date().toISOString()}\n`);

        // Post-migration verification
        logInfo('Running post-migration verification...');
        const indexCountResult = await client.query(`
            SELECT tablename, COUNT(*) as index_count
            FROM pg_indexes
            WHERE schemaname = 'public'
            GROUP BY tablename
            ORDER BY index_count DESC
        `);

        log('\nIndex counts by table:', colors.bright);
        indexCountResult.rows.forEach(row => {
            log(`  ${row.tablename}: ${row.index_count} indexes`);
        });

        log('\nNext steps:', colors.bright);
        log('  1. Verify indexes were created correctly');
        log('  2. Run ANALYZE to update statistics');
        log('  3. Monitor query performance');
        log('  4. Check index usage with pg_stat_user_indexes\n');

        logSuccess('All done!');

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('\n' + '='.repeat(70), colors.bright);
        logError('MIGRATION FAILED');
        log('='.repeat(70), colors.bright);
        logInfo(`Duration: ${duration} seconds`);
        logInfo(`Failed at: ${new Date().toISOString()}\n`);

        logError(`Error: ${error.message}`);

        if (error.position) {
            logInfo(`Error position in SQL: character ${error.position}`);
        }

        if (error.detail) {
            logInfo(`Detail: ${error.detail}`);
        }

        if (error.hint) {
            logInfo(`Hint: ${error.hint}`);
        }

        log('\nTroubleshooting tips:', colors.bright);
        log('  1. Check the SQL syntax in the migration file');
        log('  2. Verify database connection and permissions');
        log('  3. Check if indexes/tables already exist');
        log('  4. Review PostgreSQL logs for more details\n');

        process.exit(1);

    } finally {
        client.release();
        await pool.end();
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        logError('No migration file specified');
        log('\nUsage:', colors.bright);
        log('  node run-migration.js <migration-file.sql>');
        log('\nExample:', colors.bright);
        log('  node run-migration.js add-missing-indexes.sql\n');
        process.exit(1);
    }

    const migrationFile = args[0];

    runMigration(migrationFile).catch(error => {
        logError(`Unexpected error: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
}

module.exports = { runMigration };
