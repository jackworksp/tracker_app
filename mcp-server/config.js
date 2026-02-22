import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error('FATAL: API_KEY is not set in mcp-server/.env');
    console.error('Generate one in the Vela app: Profile → MCP Integration → Generate Key');
    process.exit(1);
}

// Resolve user_id from API key at startup
let RESOLVED_USER_ID = null;

export async function resolveUser() {
    const result = await pool.query(
        'SELECT id FROM user_settings WHERE mcp_api_key = $1',
        [API_KEY]
    );

    if (result.rows.length === 0) {
        console.error('FATAL: API_KEY is invalid or does not match any user.');
        console.error('Regenerate your key in the Vela app: Profile → MCP Integration → Generate Key');
        process.exit(1);
    }

    RESOLVED_USER_ID = result.rows[0].id;
    console.error(`MCP Server: Authenticated as user ID ${RESOLVED_USER_ID}`);
}

export function getUserId() {
    if (!RESOLVED_USER_ID) {
        throw new Error('User not resolved yet. Call resolveUser() first.');
    }
    return RESOLVED_USER_ID;
}
