# mistakes.md — Vela Bug Log

A running log of bugs and errors encountered in this project.
**Fill this after every fix — before closing the task or PR.**

Format:
```
## [DATE] — Short title
**Category**: Flutter / API / Build / Auth / DB / UI / CI
**What happened**: What broke and how it was noticed
**Root cause**: Why it happened
**Fix**: What was changed (file + line if relevant)
**Status**: RESOLVED / OPEN
```

---

## 2026-02-15 — Parent task completable with open subtasks
**Category**: API / Business Logic
**What happened**: Users could mark a parent task as complete even when subtasks were still open. No validation existed on either layer.
**Root cause**: Task completion endpoint had no subtask check; frontend also had no guard.
**Fix**: Added backend check in `backend/routes/tasks.js` + frontend guard in `TaskDetailModal.jsx`. Added override flag for intentional bypass.
**Status**: RESOLVED

---

## 2026-02-27 — Task detail modal crash on open
**Category**: Flutter / Widget
**What happened**: Task detail modal crashed immediately when opened on Android.
**Root cause**: `Flexible` widget used outside a `Flex` parent — invalid widget tree.
**Fix**: Replaced `Flexible` with correct widget in `vela_flutter/lib/ui/screens/tasks/task_detail_modal.dart`.
**Status**: RESOLVED

---

## 2026-03-xx — Flutter list endpoints parsed as flat array
**Category**: Flutter / API
**What happened**: Multiple Flutter screens showed empty data or crashed with type errors.
**Root cause**: Flutter repositories did `response.data as List` but all Vela list endpoints return `{ "data": [...], "pagination": {} }`. The shape was assumed, not verified against the backend.
**Fix**: Changed all affected repositories to use `response.data['data'] as List`. Exception: `GET /api/tasks/:id/subtasks` returns a flat array — kept as-is.
**Status**: RESOLVED

---

## 2026-03-xx — MCP add_task tool schema mismatch
**Category**: API / MCP
**What happened**: 0% success rate for task creation via MCP. Every call failed silently or with a DB error.
**Root cause**: MCP tool used wrong column names (`task_type` instead of `type`, `deadline` instead of correct name) and wrong status values (`pending/in_progress/completed` instead of `TODO/IN_PROGRESS/DONE`).
**Fix**: Corrected column names and status enum in `mcp-server/tools/add-task.js`. Documented in `mcp-server/MCP_CONSISTENCY_ISSUES.md`.
**Status**: RESOLVED

---

## 2026-03-xx — EC2 disk space exhaustion during Docker pull
**Category**: Build / Deployment
**What happened**: Deployment pipeline failed with `no space left on device` during Docker image pull on EC2.
**Root cause**: Puppeteer downloads Chromium (~500MB) at install time. EC2 free-tier disk fills up after a few deploys.
**Fix**: Removed Puppeteer entirely (Instagram scraping unused). Added aggressive Docker cleanup step before pull in `.github/workflows/deploy.yml`.
**Status**: RESOLVED

---

## 2026-03-xx — User data isolation missing in progress routes
**Category**: Auth / Security
**What happened**: Progress route queries returned data across all users — no `user_id` filter applied.
**Root cause**: Routes were written without `WHERE user_id = $1` clauses; `req.user.id` was available but unused in queries.
**Fix**: Added `user_id` filtering to all queries in `backend/routes/progress.js`.
**Status**: RESOLVED

---

## 2026-03-xx — Login error message not shown to user
**Category**: UI / Auth
**What happened**: Failed login showed no feedback — the form just reset silently.
**Root cause**: Error state was set in component but not rendered in JSX.
**Fix**: Added error display block in `frontend-web/src/components/LoginModal.jsx`.
**Status**: RESOLVED

---

## 2026-03-xx — Broken design system import path
**Category**: Build
**What happened**: Production build failed; dev build worked fine.
**Root cause**: Relative import path to design system was wrong in one component — Vite resolved it in dev but not in the optimised build.
**Fix**: Corrected the import path. Added lint rule to catch bad relative imports.
**Status**: RESOLVED

---

## 2026-03-xx — Hardcoded IP address → blank screen on mobile
**Category**: Mobile / Config
**What happened**: Flutter app showed a blank white screen on real device; worked on emulator.
**Root cause**: API base URL was hardcoded to `127.0.0.1` — works on emulator (loopback) but not on a real device on the same network.
**Fix**: Moved base URL to a config constant pointing to the correct server address in `vela_flutter/lib/core/network/dio_client.dart`.
**Status**: RESOLVED

---

## 2026-03-xx — Android status bar overlapping header
**Category**: Flutter / Layout
**What happened**: App header was partially hidden behind the Android status bar on some devices.
**Root cause**: No `SafeArea` / `safe-area-inset-top` applied to the app shell.
**Fix**: Wrapped top-level scaffold with `SafeArea` in `vela_flutter/lib/ui/screens/shared/app_shell.dart`.
**Status**: RESOLVED

---

## 2026-03-xx — MCP OAuth user ID type mismatch
**Category**: API / Auth / MCP
**What happened**: MCP authenticated requests linked to wrong user or failed user lookup.
**Root cause**: OAuth handler stored and passed email string as user ID instead of numeric `user.id` from DB.
**Fix**: Changed MCP OAuth handler to use numeric user ID throughout.
**Status**: RESOLVED

---
<!-- Add new entries above this line -->
