const request = require("supertest");
const app = require("./helpers/app");
const { createTestUser, deleteTestUser } = require("./helpers/testUser");
const db = require("../database");

let token;
let testEmail;
let userId;

beforeAll(async () => {
  const user = await createTestUser();
  token = user.token;
  testEmail = user.email;
  userId = user.userId;
});

afterAll(async () => {
  await deleteTestUser(testEmail);
});

describe("GET /vela/api/attachments", () => {
  test("returns { data: [], pagination: {}, metadata: {} } envelope", async () => {
    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(res.body).toHaveProperty("metadata");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toHaveProperty("page", 1);
    expect(res.body.pagination).toHaveProperty("limit", 20);
    expect(res.body.pagination).toHaveProperty("total");
    expect(res.body.pagination).toHaveProperty("hasNextPage");
    expect(res.body.pagination).toHaveProperty("hasPrevPage");
  });

  test("supports filtered requests without throwing", async () => {
    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&type=url")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.metadata).toHaveProperty("filters");
    expect(res.body.metadata.filters).toHaveProperty("type", "url");
  });

  test("platform=youtube matches youtube.com and youtu.be links", async () => {
    await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5),
                    ($1, $6, $7, $4, $8),
                    ($1, $9, $10, $4, $11)`,
      [
        userId,
        "YouTube Watch",
        "https://www.youtube.com/watch?v=abcdefghijk",
        "link",
        "youtube",
        "Short YouTube",
        "https://youtu.be/lmnopqrstuv",
        "youtube",
        "Generic Link",
        "https://example.com/article",
        "link",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&platform=youtube")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "YouTube Watch" }),
        expect.objectContaining({ title: "Short YouTube" }),
      ]),
    );
    expect(res.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Generic Link" }),
      ]),
    );
  });

  test("platform=instagram matches instagram links", async () => {
    await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5),
                    ($1, $6, $7, $4, $8)`,
      [
        userId,
        "Instagram Reel",
        "https://www.instagram.com/reel/abc123/",
        "link",
        "instagram",
        "Generic Link",
        "https://example.com/not-instagram",
        "link",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&platform=instagram")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Instagram Reel" }),
      ]),
    );
    expect(res.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Generic Link" }),
      ]),
    );
  });

  test("file_type=pdf matches pdf files and google docs links", async () => {
    await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5),
                    ($1, $6, $7, $8, $9),
                    ($1, $10, $11, $12, $13)`,
      [
        userId,
        "PDF File",
        "https://example.com/syllabus.pdf",
        "pdf",
        "link",
        "Drive Doc",
        "https://docs.google.com/document/d/123/edit",
        "pdf",
        "link",
        "Plain Link",
        "https://example.com/post",
        "link",
        "link",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&file_type=pdf")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "PDF File" }),
        expect.objectContaining({ title: "Drive Doc" }),
      ]),
    );
    expect(res.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Plain Link" }),
      ]),
    );
  });

  test("file_type=image matches image urls", async () => {
    await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5),
                    ($1, $6, $7, $8, $9)`,
      [
        userId,
        "Image File",
        "https://example.com/image.png",
        "image",
        "link",
        "Plain Link",
        "https://example.com/post",
        "link",
        "link",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&file_type=image")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Image File" }),
      ]),
    );
    expect(res.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Plain Link" }),
      ]),
    );
  });

  test("file_type=link excludes youtube, instagram, document, and image items", async () => {
    await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5),
                    ($1, $6, $7, $8, $9),
                    ($1, $10, $11, $4, $12),
                    ($1, $13, $14, $15, $16),
                    ($1, $17, $18, $4, $19)`,
      [
        userId,
        "Generic Link",
        "https://example.com/post",
        "link",
        "link",
        "YouTube Watch",
        "https://youtu.be/abcdefghijk",
        "link",
        "youtube",
        "Instagram Reel",
        "https://instagram.com/reel/xyz",
        "instagram",
        "PDF File",
        "https://example.com/syllabus.pdf",
        "pdf",
        "link",
        "Image File",
        "https://example.com/image.jpg",
        "link",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=20&file_type=link")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Generic Link" }),
      ]),
    );
    expect(res.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "YouTube Watch" }),
        expect.objectContaining({ title: "Instagram Reel" }),
        expect.objectContaining({ title: "PDF File" }),
        expect.objectContaining({ title: "Image File" }),
      ]),
    );
  });

  test("returns 401 without token", async () => {
    const res = await request(app).get("/vela/api/attachments?page=1&limit=20");
    expect(res.status).toBe(401);
  });
});

describe("PUT /vela/api/attachments/:id/rename", () => {
  test("renames a standalone attachment title", async () => {
    const inserted = await db.query(
      `INSERT INTO attachments (user_id, title, url, type, platform)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
      [userId, "Old Attachment", "https://example.com/doc.pdf", "link", "link"],
    );

    const attachmentId = inserted.rows[0].id;

    const res = await request(app)
      .put(`/vela/api/attachments/attachment-${attachmentId}/rename`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed Attachment" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: `attachment-${attachmentId}`,
      title: "Renamed Attachment",
    });

    const stored = await db.query(
      "SELECT title FROM attachments WHERE id = $1",
      [attachmentId],
    );
    expect(stored.rows[0].title).toBe("Renamed Attachment");
  });

  test("renames task attachment and task url titles independently", async () => {
    const subject = await db.query(
      "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING id",
      [userId, "Rename Subject"],
    );

    const task = await db.query(
      `INSERT INTO tasks (user_id, subject_id, type, title, attachment_url, url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
      [
        userId,
        subject.rows[0].id,
        "READ",
        "Task Title",
        "https://example.com/file.pdf",
        "https://example.com/article",
      ],
    );

    const taskId = task.rows[0].id;

    const attachmentRes = await request(app)
      .put(`/vela/api/attachments/task-${taskId}/rename`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task File Name" });

    expect(attachmentRes.status).toBe(200);
    expect(attachmentRes.body.data.title).toBe("Task File Name");

    const urlRes = await request(app)
      .put(`/vela/api/attachments/task-url-${taskId}/rename`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task URL Name" });

    expect(urlRes.status).toBe(200);
    expect(urlRes.body.data.title).toBe("Task URL Name");

    const stored = await db.query(
      "SELECT title, attachment_url_title, url_title FROM tasks WHERE id = $1",
      [taskId],
    );
    expect(stored.rows[0].title).toBe("Task Title");
    expect(stored.rows[0].attachment_url_title).toBe("Task File Name");
    expect(stored.rows[0].url_title).toBe("Task URL Name");
  });

  test("renames a session url title without changing activity", async () => {
    const subject = await db.query(
      "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING id",
      [userId, "Session Subject"],
    );

    const session = await db.query(
      `INSERT INTO study_sessions (subject_id, date, day, activity, url)
             VALUES ($1, CURRENT_DATE, 'Monday', $2, $3)
             RETURNING id`,
      [subject.rows[0].id, "Session Activity", "https://example.com/video"],
    );

    const sessionId = session.rows[0].id;

    const res = await request(app)
      .put(`/vela/api/attachments/session-${sessionId}/rename`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Session URL Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Session URL Name");

    const stored = await db.query(
      "SELECT activity, url_title FROM study_sessions WHERE id = $1",
      [sessionId],
    );
    expect(stored.rows[0].activity).toBe("Session Activity");
    expect(stored.rows[0].url_title).toBe("Session URL Name");
  });

  test("rejects note-link rename requests", async () => {
    const res = await request(app)
      .put("/vela/api/attachments/note-task-1/rename")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Should Fail" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be renamed/i);
  });

  test("rejects blank and overlong names", async () => {
    const blankRes = await request(app)
      .put("/vela/api/attachments/attachment-999999/rename")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "   " });

    expect(blankRes.status).toBe(400);
    expect(blankRes.body.error).toMatch(/title is required/i);

    const longRes = await request(app)
      .put("/vela/api/attachments/attachment-999999/rename")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "a".repeat(501) });

    expect(longRes.status).toBe(400);
    expect(longRes.body.error).toMatch(/500 characters or fewer/i);
  });

  test("aggregated listing returns renamed titles", async () => {
    const subject = await db.query(
      "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING id",
      [userId, "Aggregated Subject"],
    );

    const task = await db.query(
      `INSERT INTO tasks (user_id, subject_id, type, title, attachment_url, attachment_url_title)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
      [
        userId,
        subject.rows[0].id,
        "TASK",
        "Task Original",
        "https://example.com/file",
        "Attachment Alias",
      ],
    );

    const session = await db.query(
      `INSERT INTO study_sessions (subject_id, date, day, activity, url, url_title)
             VALUES ($1, CURRENT_DATE, 'Tuesday', $2, $3, $4)
             RETURNING id`,
      [
        subject.rows[0].id,
        "Session Original",
        "https://example.com/watch",
        "Session Alias",
      ],
    );

    const res = await request(app)
      .get("/vela/api/attachments?page=1&limit=50")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `task-${task.rows[0].id}`,
          title: "Attachment Alias",
        }),
        expect.objectContaining({
          id: `session-${session.rows[0].id}`,
          title: "Session Alias",
        }),
      ]),
    );
  });
});
