# lessons.md — Vela Lessons Learned

Distilled rules from real bugs in this project.
**If a mistake reveals a repeatable pattern, add it here.**

Format:
```
## [LESSON TITLE]
**Learned from**: mistakes.md entry or commit reference
**Rule**: One clear actionable sentence
**Why it matters**: What goes wrong if ignored
```

---

## Always read the backend before writing Flutter data code
**Learned from**: mistakes.md — "Flutter list endpoints parsed as flat array"
**Rule**: Before writing any Flutter repository or parsing code, open the relevant `backend/routes/` file and confirm the exact JSON response shape.
**Why it matters**: Flutter had multi-rebuild cycles where fixes were written against assumed shapes that didn't match reality. Every wasted rebuild was caused by skipping this step. This is now CLAUDE.md Rule 3a.

---

## All Vela list endpoints return `{ "data": [], "pagination": {} }` — not a flat array
**Learned from**: mistakes.md — "Flutter list endpoints parsed as flat array"
**Rule**: Use `response.data['data'] as List` in Flutter repos for all list endpoints. The one exception is `GET /api/tasks/:id/subtasks` which returns a flat array.
**Why it matters**: A wrong cast silently returns empty data or throws a runtime type error — both hard to diagnose without knowing the API contract.

---

## Verify MCP tool schemas against the live DB schema before shipping
**Learned from**: mistakes.md — "MCP add_task tool schema mismatch"
**Rule**: When writing or updating an MCP tool, cross-check every column name and enum value against `backend/database.js` before the tool is used.
**Why it matters**: Wrong column names cause silent DB errors; wrong enum values cause constraint violations. The MCP tool had a 0% success rate and the failure was invisible to the caller.

---

## Never assume API shape — always grep or read the route
**Learned from**: mistakes.md — "Flutter list endpoints parsed as flat array", "MCP add_task tool schema mismatch"
**Rule**: If you are writing a client (Flutter, MCP, React) that calls an API endpoint, read the route handler first. Never assume.
**Why it matters**: Both Flutter and MCP bugs shared the same root cause — a client assuming an API shape that didn't match reality. Clients are downstream; the backend is the source of truth.

---

## Always filter by user_id in backend queries
**Learned from**: mistakes.md — "User data isolation missing in progress routes"
**Rule**: Every backend query that returns user data must include `WHERE user_id = $1` (or equivalent join) using `req.user.id`.
**Why it matters**: Missing isolation means one user can read another user's data — a silent data-privacy vulnerability. There is no error thrown; the data simply leaks.

---

## Puppeteer is a deployment liability — don't install it unless actively used
**Learned from**: mistakes.md — "EC2 disk space exhaustion during Docker pull"
**Rule**: If a dependency downloads large binaries at install time (e.g. Puppeteer's Chromium), confirm it is actively needed before keeping it in `package.json`.
**Why it matters**: Puppeteer added ~500MB to the Docker image. On a free-tier EC2 instance this repeatedly exhausted disk space and blocked deployments.

---

## SafeArea is mandatory in Flutter on Android
**Learned from**: mistakes.md — "Android status bar overlapping header"
**Rule**: Every Flutter screen's top-level scaffold must account for the system status bar — use `SafeArea` or `MediaQuery.of(context).padding.top`.
**Why it matters**: Emulators often hide status bars; real devices don't. A missing SafeArea passes local testing and breaks on real hardware.

---

## Error states must be rendered, not just set
**Learned from**: mistakes.md — "Login error message not shown to user"
**Rule**: Whenever you add an error state variable (`setError(...)`), immediately add the corresponding JSX/widget to display it.
**Why it matters**: Setting state with no render output gives users zero feedback — they see a silent failure and assume the app is broken.

---

## Add new lessons above this line
