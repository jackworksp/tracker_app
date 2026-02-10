require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock DB interface
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const db = {
    query: (text, params) => pool.query(text, params)
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

async function testAuth() {
    try {
        console.log('--- Testing Auth Flow ---');
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'Test User';

        console.log(`1. Creating user: ${email}`);
        
        // SIMULATE SIGNUP
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed successfully');

        const result = await db.query(
            `INSERT INTO user_settings (user_id, name, password_hash, created_at, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, user_id, name, active_subject_id, profile_photo_url, created_at`,
            [email, name, passwordHash] // Matches args in auth.js
        );
        const user = result.rows[0];
        console.log('✅ User created:', user.id);

        // SIMULATE LOGIN
        console.log('2. Attempting Login...');
        const loginResult = await db.query(
            'SELECT id, user_id, name, password_hash, active_subject_id, profile_photo_url FROM user_settings WHERE user_id = $1',
            [email]
        );
        
        if (loginResult.rows.length === 0) throw new Error('User not found during login lookup');
        const loginUser = loginResult.rows[0];
        
        console.log('User found. Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, loginUser.password_hash);
        console.log(`Password valid: ${isPasswordValid}`);

        if (!isPasswordValid) throw new Error('Password mismatch');

        const token = generateToken(loginUser.id);
        console.log('Token generated successfully');

        await db.query(
            'UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [loginUser.id]
        );
        console.log('✅ Login simulation successful!');

        // Cleanup
        await db.query('DELETE FROM user_settings WHERE id = $1', [user.id]);
        console.log('Test user cleaned up.');

    } catch (err) {
        console.error('❌ Auth Simulation Failed:', err);
    } finally {
        await pool.end();
    }
}

testAuth();
