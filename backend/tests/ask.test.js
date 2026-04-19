const request = require('supertest');
const { Readable } = require('stream');
const app = require('./helpers/app');
const { createTestUser, deleteTestUser } = require('./helpers/testUser');

let testEmail;
let token;
let originalFetch;
let originalGroqKey;
let originalGeminiKey;

beforeAll(async () => {
    const user = await createTestUser();
    testEmail = user.email;
    token = user.token;
    originalFetch = global.fetch;
    originalGroqKey = process.env.GROQ_API_KEY;
    originalGeminiKey = process.env.GEMINI_API_KEY;
});

afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalGroqKey;
    process.env.GEMINI_API_KEY = originalGeminiKey;
});

afterAll(async () => {
    await deleteTestUser(testEmail);
});

describe('POST /vela/api/ask', () => {
    test('returns 500 when GROQ_API_KEY is not configured', async () => {
        delete process.env.GROQ_API_KEY;

        const res = await request(app)
            .post('/vela/api/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({ messages: [{ role: 'user', content: 'Hello' }] });

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/GROQ_API_KEY/i);
    });

    test('returns 400 for unsupported ask model', async () => {
        process.env.GROQ_API_KEY = 'test-groq-key';

        const res = await request(app)
            .post('/vela/api/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                model: 'gemini-2.5-flash',
                messages: [{ role: 'user', content: 'Hello' }],
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Unsupported ask model/i);
    });

    test('streams a response for an allowlisted model', async () => {
        process.env.GROQ_API_KEY = 'test-groq-key';
        delete process.env.GEMINI_API_KEY;

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            body: Readable.from([
                Buffer.from('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
                Buffer.from('data: {"choices":[{"delta":{"content":" world"}}]}\n\n'),
                Buffer.from('data: [DONE]\n\n'),
            ]),
        });

        const res = await request(app)
            .post('/vela/api/ask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                model: 'openai/gpt-oss-20b',
                messages: [{ role: 'user', content: 'Hello' }],
            });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/event-stream/);
        expect(res.text).toContain('"text":"Hello"');
        expect(res.text).toContain('"text":" world"');
        expect(global.fetch).toHaveBeenCalledTimes(2); // planner + main Groq call
    });
});
