const request = require('supertest');
const app = require('./helpers/app');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let testEmail;
let token;

beforeAll(async () => {
    const user = await createTestUser();
    testEmail = user.email;
    token = user.token;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
});

describe('POST /vela/api/auth/signup', () => {
    test('returns 400 when fields are missing', async () => {
        const res = await request(app)
            .post('/vela/api/auth/signup')
            .send({ email: 'missing@fields.com' }); // no name or password

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/vela/api/auth/signup')
            .send({ name: 'Test', email: 'not-an-email', password: 'pass123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    test('returns 400 when password is too short', async () => {
        const res = await request(app)
            .post('/vela/api/auth/signup')
            .send({ name: 'Test', email: 'short@pass.com', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/password/i);
    });

    test('returns 400 when email already exists', async () => {
        const res = await request(app)
            .post('/vela/api/auth/signup')
            .send({ name: 'Duplicate', email: testEmail, password: 'testpass123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/exists/i);
    });
});

describe('POST /vela/api/auth/login', () => {
    test('returns 400 when fields are missing', async () => {
        const res = await request(app)
            .post('/vela/api/auth/login')
            .send({ email: testEmail }); // no password

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 401 for wrong password', async () => {
        const res = await request(app)
            .post('/vela/api/auth/login')
            .send({ email: testEmail, password: 'wrongpassword' });

        expect(res.status).toBe(401);
    });

    test('returns 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/vela/api/auth/login')
            .send({ email: 'nobody@nowhere.com', password: 'testpass123' });

        expect(res.status).toBe(401);
    });

    test('returns { token, user } on success', async () => {
        const res = await request(app)
            .post('/vela/api/auth/login')
            .send({ email: testEmail, password: 'testpass123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user).toHaveProperty('email');
        // token must not be null or empty
        expect(typeof res.body.token).toBe('string');
        expect(res.body.token.length).toBeGreaterThan(0);
    });
});

describe('GET /vela/api/auth/me', () => {
    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/auth/me');
        expect(res.status).toBe(401);
    });

    test('returns 401 with malformed token', async () => {
        const res = await request(app)
            .get('/vela/api/auth/me')
            .set('Authorization', 'Bearer not-a-real-token');

        expect(res.status).toBe(401);
    });

    test('returns user profile with valid token', async () => {
        const res = await request(app)
            .get('/vela/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email');
    });
});
