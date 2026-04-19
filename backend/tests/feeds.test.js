const request = require('supertest');
const app = require('./helpers/app');
const db = require('../database');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let token;
let testEmail;
let userId;
let subjectId;
let otherToken;
let otherEmail;
let otherUserId;
let otherSubjectId;

const channelId = 'UCfeedtestchannel000000001';
const videoId = `yt_feed_${Date.now()}`;
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

beforeAll(async () => {
    const user = await createTestUser();
    token = user.token;
    testEmail = user.email;
    userId = user.userId;

    const otherUser = await createTestUser();
    otherToken = otherUser.token;
    otherEmail = otherUser.email;
    otherUserId = otherUser.userId;

    const subRes = await request(app)
        .post('/vela/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Feeds Test Subject ${Date.now()}` });
    subjectId = subRes.body.id;

    const otherSubRes = await request(app)
        .post('/vela/api/subjects')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: `Other Feeds Subject ${Date.now()}` });
    otherSubjectId = otherSubRes.body.id;

    await db.query(
        `INSERT INTO feeds_channels (user_id, channel_id, source_type, channel_name)
         VALUES ($1, $2, 'youtube', 'Feed Test Channel')
         ON CONFLICT (user_id, channel_id) DO NOTHING`,
        [userId, channelId]
    );

    await db.query(
        `INSERT INTO feeds_cache (user_id, channel_id, video_id, title, published_at, video_url)
         VALUES ($1, $2, $3, 'Feed Test Video', NOW(), $4)
         ON CONFLICT (user_id, video_id) DO UPDATE SET video_url = EXCLUDED.video_url`,
        [userId, channelId, videoId, videoUrl]
    );
});

afterAll(async () => {
    await deleteTestUser(testEmail);
    await deleteTestUser(otherEmail);
});

describe('POST /vela/api/feeds/videos/:videoId/open', () => {
    test('creates one WATCH session for the first open and dedupes same-day opens', async () => {
        const first = await request(app)
            .post(`/vela/api/feeds/videos/${encodeURIComponent(videoId)}/open`)
            .set('Authorization', `Bearer ${token}`)
            .send({ subject_id: subjectId });

        expect(first.status).toBe(200);
        expect(first.body).toHaveProperty('created_session', true);
        expect(first.body.session).toHaveProperty('type', 'WATCH');
        expect(first.body.session).toHaveProperty('time_spent', 60);
        expect(first.body.session).toHaveProperty('subject_id', subjectId);
        expect(first.body.session).toHaveProperty('url', videoUrl);
        expect(first.body.item).toHaveProperty('is_read', true);
        expect(first.body.item.session_id).toBe(first.body.session.id);

        const second = await request(app)
            .post(`/vela/api/feeds/videos/${encodeURIComponent(videoId)}/open`)
            .set('Authorization', `Bearer ${token}`)
            .send({ subject_id: subjectId });

        expect(second.status).toBe(200);
        expect(second.body).toHaveProperty('created_session', false);
        expect(second.body.session).toHaveProperty('id', first.body.session.id);

        const count = await db.query(
            `SELECT COUNT(*)::integer AS count
             FROM study_sessions
             WHERE subject_id = $1
               AND url = $2
               AND type = 'WATCH'`,
            [subjectId, videoUrl]
        );
        expect(count.rows[0].count).toBe(1);
    });

    test('exposes read state through GET /feeds/videos', async () => {
        const res = await request(app)
            .get('/vela/api/feeds/videos')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        const item = res.body.data.find((candidate) => candidate.video_id === videoId);
        expect(item).toBeTruthy();
        expect(item).toHaveProperty('is_read', true);
        expect(item).toHaveProperty('opened_at');
        expect(item).toHaveProperty('session_id');
    });

    test('returns 403 when subject does not belong to the user', async () => {
        const forbiddenVideoId = `yt_feed_forbidden_${Date.now()}`;
        await db.query(
            `INSERT INTO feeds_cache (user_id, channel_id, video_id, title, published_at, video_url)
             VALUES ($1, $2, $3, 'Forbidden Feed Video', NOW(), $4)`,
            [userId, channelId, forbiddenVideoId, `https://www.youtube.com/watch?v=${forbiddenVideoId}`]
        );

        const res = await request(app)
            .post(`/vela/api/feeds/videos/${encodeURIComponent(forbiddenVideoId)}/open`)
            .set('Authorization', `Bearer ${token}`)
            .send({ subject_id: otherSubjectId });

        expect(res.status).toBe(403);
    });

    test('returns 404 for a missing or other-user feed item', async () => {
        const missing = await request(app)
            .post('/vela/api/feeds/videos/not-owned-by-this-user/open')
            .set('Authorization', `Bearer ${token}`)
            .send({ subject_id: subjectId });

        expect(missing.status).toBe(404);

        const otherVideoId = `yt_feed_other_${Date.now()}`;
        await db.query(
            `INSERT INTO feeds_cache (user_id, channel_id, video_id, title, published_at, video_url)
             VALUES ($1, $2, $3, 'Other User Feed Video', NOW(), $4)`,
            [otherUserId, channelId, otherVideoId, `https://www.youtube.com/watch?v=${otherVideoId}`]
        );

        const otherOwned = await request(app)
            .post(`/vela/api/feeds/videos/${encodeURIComponent(otherVideoId)}/open`)
            .set('Authorization', `Bearer ${token}`)
            .send({ subject_id: subjectId });

        expect(otherOwned.status).toBe(404);
    });
});
