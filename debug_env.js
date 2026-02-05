const path = require('path');
const fs = require('fs');

console.log('--- Environment Debug ---');
console.log('CWD:', process.cwd());
console.log('Backend .env exists:', fs.existsSync(path.join(process.cwd(), 'backend', '.env')));
console.log('Root .env exists:', fs.existsSync(path.join(process.cwd(), '.env')));

console.log('\n--- Dotenv Load Test (Default) ---');
require('dotenv').config();
console.log('DATABASE_URL (Default):', process.env.DATABASE_URL ? 'Loaded' : 'UNDEFINED');

console.log('\n--- Dotenv Load Test (Explicit Path) ---');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
console.log('DATABASE_URL (Explicit):', process.env.DATABASE_URL || 'UNDEFINED');
