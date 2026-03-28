// Tasks route tests — focus on response shapes, auth, and validation.
// These catch the Flutter "flat array" bug class and MCP wrong-value bugs.
const request = require('supertest');
const app = require('./helpers/app');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let token;
let testEmail;
let createdTaskId;

beforeAll(async () => {
    const user = await createTestUser();
    token = user.token;
    testEmail = user.email;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
});

// ─── Shape tests (catches Flutter "response.data as List" bug) ───────────────

describe('GET /vela/api/tasks — envelope shape', () => {
    test('returns { data: [], pagination: {} } envelope', async () => {
        const res = await request(app)
            .get('/vela/api/tasks')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        // Must have envelope — not a flat array
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
        // Pagination fields must exist
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('hasNextPage');
        expect(res.body.pagination).toHaveProperty('hasPrevPage');
    });

    test('returns 401 without token', async () => {
        const res = await request(app).get('/vela/api/tasks');
        expect(res.status).toBe(401);
    });
});

// ─── Create / Read / Delete ───────────────────────────────────────────────────

describe('POST /vela/api/tasks', () => {
    test('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/vela/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ priority: 'HIGH' }); // no title

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('creates a task and returns the task object', async () => {
        const res = await request(app)
            .post('/vela/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test task for shape validation' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('title', 'Test task for shape validation');
        createdTaskId = res.body.id;
    });
});

describe('DELETE /vela/api/tasks/:id', () => {
    test('returns { success: true, id } on deletion', async () => {
        // Create a task to delete
        const createRes = await request(app)
            .post('/vela/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Task to delete' });

        const id = createRes.body.id;

        const res = await request(app)
            .delete(`/vela/api/tasks/${id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('id');
    });

    test('returns 401 without token', async () => {
        const res = await request(app).delete('/vela/api/tasks/999');
        expect(res.status).toBe(401);
    });
});

// ─── Subtasks — FLAT ARRAY exception (not envelope) ─────────────────────────
// This is the one endpoint that returns a flat array. Flutter must NOT use
// the envelope pattern here. This test documents that contract explicitly.

describe('GET /vela/api/tasks/:id/subtasks — flat array (no envelope)', () => {
    test('returns a flat array, not an envelope object', async () => {
        const res = await request(app)
            .get(`/vela/api/tasks/${createdTaskId}/subtasks`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        // Must be a flat array — NOT { data: [], pagination: {} }
        expect(Array.isArray(res.body)).toBe(true);
        // Confirm it is NOT an envelope
        expect(res.body).not.toHaveProperty('data');
        expect(res.body).not.toHaveProperty('pagination');
    });
});

// ─── User isolation ───────────────────────────────────────────────────────────

describe('User isolation', () => {
    test('user only sees their own tasks', async () => {
        // Create a second user
        const other = await createTestUser();

        // Other user creates a task
        await request(app)
            .post('/vela/api/tasks')
            .set('Authorization', `Bearer ${other.token}`)
            .send({ title: 'Other user task — should not appear' });

        // Original user fetches tasks — should NOT see other user's task
        const res = await request(app)
            .get('/vela/api/tasks')
            .set('Authorization', `Bearer ${token}`);

        const titles = res.body.data.map(t => t.title);
        expect(titles).not.toContain('Other user task — should not appear');

        await deleteTestUser(other.email);
    });
});
