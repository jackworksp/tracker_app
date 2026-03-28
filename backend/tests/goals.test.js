// Goals endpoint returns a FLAT ARRAY — no envelope.
// This is an intentional exception to the standard list pattern.
// Flutter's goals_repository must use `response.data as List`, not `response.data['data'] as List`.
const request = require('supertest');
const app = require('./helpers/app');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let token;
let testEmail;

beforeAll(async () => {
    const user = await createTestUser();
    token = user.token;
    testEmail = user.email;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
});

describe('GET /vela/api/goals — flat array (no envelope)', () => {
    test('returns a flat array, NOT an envelope', async () => {
        const res = await request(app)
            .get('/vela/api/goals')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        // Flat array — NOT { data: [], pagination: {} }
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).not.toHaveProperty('data');
        expect(res.body).not.toHaveProperty('pagination');
    });

    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/goals');
        expect(res.status).toBe(401);
    });
});

describe('POST /vela/api/goals', () => {
    test('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/vela/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'EDUCATION' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('creates a goal and returns the goal object', async () => {
        const res = await request(app)
            .post('/vela/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Goal', category: 'EDUCATION', status: 'PLANNING' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('title', 'Test Goal');
        expect(res.body).toHaveProperty('category', 'EDUCATION');
    });

    test('silently coerces invalid category to PERSONAL (no 400)', async () => {
        // Goals route silently defaults invalid enums rather than rejecting them.
        // This test documents that behaviour so it does not surprise Flutter/MCP clients.
        const res = await request(app)
            .post('/vela/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Goal with bad category', category: 'INVALID_CATEGORY' });

        expect(res.status).toBe(201);
        expect(res.body.category).toBe('PERSONAL'); // default fallback
    });
});
