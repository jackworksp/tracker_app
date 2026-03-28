const request = require('supertest');
const app = require('./helpers/app');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let token;
let testEmail;
let subjectId;

beforeAll(async () => {
    const user = await createTestUser();
    token = user.token;
    testEmail = user.email;

    // Create a subject to attach sessions to
    const subRes = await request(app)
        .post('/vela/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Progress Test Subject ${Date.now()}` });

    subjectId = subRes.body.id;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
});

describe('GET /vela/api/progress/all — response shape', () => {
    test('returns topics, sessions, and revisionItems', async () => {
        const res = await request(app)
            .get('/vela/api/progress/all')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('topics');
        expect(res.body).toHaveProperty('sessions');
        expect(res.body).toHaveProperty('revisionItems');
        expect(Array.isArray(res.body.topics)).toBe(true);
        expect(Array.isArray(res.body.sessions)).toBe(true);
        expect(Array.isArray(res.body.revisionItems)).toBe(true);
    });

    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/progress/all');
        expect(res.status).toBe(401);
    });
});

describe('POST /vela/api/progress/sessions', () => {
    test('creates a session and returns the session object', async () => {
        const res = await request(app)
            .post('/vela/api/progress/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                subject_id: subjectId,
                time_spent: 30,
                date: new Date().toISOString().split('T')[0],
                type: 'STUDY'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('subject_id', subjectId);
        expect(res.body).toHaveProperty('time_spent', 30);
    });

    test('returns 401 without token', async () => {
        const res = await request(app)
            .post('/vela/api/progress/sessions')
            .send({ subject_id: subjectId, time_spent: 30 });

        expect(res.status).toBe(401);
    });
});
