// Creates and cleans up an isolated test user for each test suite.
// Uses the real signup endpoint so auth logic is fully exercised.
const request = require('supertest');
const app = require('./app');
const db = require('../../database');

async function createTestUser() {
    const email = `vela_test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
    const res = await request(app)
        .post('/vela/api/auth/signup')
        .send({ name: 'Vela Test User', email, password: 'testpass123' });

    if (res.status !== 201) {
        throw new Error(`Failed to create test user: ${JSON.stringify(res.body)}`);
    }

    return { email, token: res.body.token, userId: res.body.user.id };
}

async function deleteTestUser(email) {
    // Cascading deletes handle tasks, goals, sessions, etc.
    await db.query('DELETE FROM user_settings WHERE user_id = $1', [email]);
}

module.exports = { createTestUser, deleteTestUser };
