const request = require('supertest');
const app = require('./helpers/app');
const db = require('../database');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let token;
let testEmail;
let otherToken;
let otherEmail;

beforeAll(async () => {
    const user = await createTestUser();
    token = user.token;
    testEmail = user.email;
    const other = await createTestUser();
    otherToken = other.token;
    otherEmail = other.email;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
    await deleteTestUser(otherEmail);
});

describe('important dates', () => {
    test('creates, lists, updates, and deletes an important date', async () => {
        const createRes = await request(app)
            .post('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'AWS Exam',
                category: 'exam',
                date: '2026-05-20',
                time: '10:30',
                recurrence: 'none',
                reminder_offsets_days: [7, 1, 0]
            });

        expect(createRes.status).toBe(201);
        expect(createRes.body).toMatchObject({
            title: 'AWS Exam',
            category: 'exam',
            date: '2026-05-20',
            time: '10:30:00',
            recurrence: 'none',
            reminder_offsets_days: [7, 1, 0]
        });

        const id = createRes.body.id;
        const listRes = await request(app)
            .get('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`);
        expect(listRes.status).toBe(200);
        expect(listRes.body.some((item) => item.id === id)).toBe(true);

        const updateRes = await request(app)
            .put(`/vela/api/important-dates/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'AWS SAA Exam', recurrence: 'yearly' });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.title).toBe('AWS SAA Exam');
        expect(updateRes.body.recurrence).toBe('yearly');

        const deleteRes = await request(app)
            .delete(`/vela/api/important-dates/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toEqual({ success: true, id });
    });

    test('does not expose dates across users', async () => {
        const createRes = await request(app)
            .post('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Private date', date: '2026-06-01' });
        expect(createRes.status).toBe(201);

        const otherList = await request(app)
            .get('/vela/api/important-dates')
            .set('Authorization', `Bearer ${otherToken}`);
        expect(otherList.status).toBe(200);
        expect(otherList.body.some((item) => item.id === createRes.body.id)).toBe(false);
    });

    test('sorts yearly dates by their next occurrence', async () => {
        await db.query(
            `DELETE FROM important_dates
             WHERE user_id = (SELECT id FROM user_settings WHERE user_id = $1)`,
            [testEmail]
        );
        await request(app)
            .post('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'December yearly', date: '2020-12-01', recurrence: 'yearly' });
        await request(app)
            .post('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'May yearly', date: '2020-05-01', recurrence: 'yearly' });

        const listRes = await request(app)
            .get('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`);
        expect(listRes.status).toBe(200);
        expect(listRes.body.map((item) => item.next_occurrence)).toEqual(
            [...listRes.body.map((item) => item.next_occurrence)].sort()
        );
    });

    test('validates optional linked task ownership', async () => {
        const otherTask = await db.query(
            `INSERT INTO tasks (user_id, title) VALUES (
                (SELECT id FROM user_settings WHERE user_id = $1), 'Other user task'
             ) RETURNING id`,
            [otherEmail]
        );

        const res = await request(app)
            .post('/vela/api/important-dates')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Linked bad task',
                date: '2026-07-01',
                task_id: otherTask.rows[0].id
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Linked task not found');
    });
});
