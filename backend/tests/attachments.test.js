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

describe('GET /vela/api/attachments', () => {
    test('returns { data: [], pagination: {}, metadata: {} } envelope', async () => {
        const res = await request(app)
            .get('/vela/api/attachments?page=1&limit=20')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('metadata');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toHaveProperty('page', 1);
        expect(res.body.pagination).toHaveProperty('limit', 20);
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('hasNextPage');
        expect(res.body.pagination).toHaveProperty('hasPrevPage');
    });

    test('supports filtered requests without throwing', async () => {
        const res = await request(app)
            .get('/vela/api/attachments?page=1&limit=20&type=url')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.metadata).toHaveProperty('filters');
        expect(res.body.metadata.filters).toHaveProperty('type', 'url');
    });

    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/attachments?page=1&limit=20');
        expect(res.status).toBe(401);
    });
});
