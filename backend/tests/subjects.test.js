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

describe('GET /vela/api/subjects — envelope shape', () => {
    test('returns { data: [], pagination: {} } envelope', async () => {
        const res = await request(app)
            .get('/vela/api/subjects')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/subjects');
        expect(res.status).toBe(401);
    });
});

describe('POST /vela/api/subjects', () => {
    test('returns 400 when name is missing', async () => {
        const res = await request(app)
            .post('/vela/api/subjects')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('creates a subject and returns the subject object', async () => {
        const res = await request(app)
            .post('/vela/api/subjects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Test Subject ${Date.now()}` });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name');
    });
});

describe('User isolation', () => {
    test('user only sees their own subjects', async () => {
        const other = await createTestUser();

        const subjectName = `Isolated Subject ${Date.now()}`;
        await request(app)
            .post('/vela/api/subjects')
            .set('Authorization', `Bearer ${other.token}`)
            .send({ name: subjectName });

        const res = await request(app)
            .get('/vela/api/subjects')
            .set('Authorization', `Bearer ${token}`);

        const names = res.body.data.map(s => s.name);
        expect(names).not.toContain(subjectName);

        await deleteTestUser(other.email);
    });
});
