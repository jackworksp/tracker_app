---
description: Fetch open issues from ClickUp and fix them using the appropriate agent
---

# Get Issue and Fix

This workflow fetches open issues from the **TaskApp** ClickUp space and routes them to the correct agent for fixing. UI issues go to the frontend-developer agent; backend issues go to the backend-developer agent. On completion, the issue is marked resolved or left in-progress with notes.

---

## 1. Fetch Open Issues from ClickUp

Use the ClickUp MCP to search for tasks in the TaskApp space that are **not resolved**.

Target Space ID: `90020052321`
Lists:
- `901613294573` — TaskApp - mobile UI
- `901613296977` — TaskApp - Backend

```
Use mcp__claude_ai_ClickUp__clickup_search with:
  filters.asset_types: ["task"]
  filters.location.projects: ["90020052321"]
  filters.task_statuses: ["unstarted", "active"]
```

Pick one issue to work on (prioritise 🚩 new issue > bugs > enhancements > new features).

---

## 2. Classify the Issue

Read the task name and description. Classify it as one of:

| Category | Criteria | Agent to use |
|----------|----------|--------------|
| **UI / Frontend** | Mentions UI, layout, button, card, screen, modal, tab, styling, mobile view | `@.claude/agents/frontend-developer.md` |
| **Backend** | Mentions API, database, endpoint, query, auth, server, performance, data | `@.claude/agents/backend-developer.md` |
| **Full-stack** | Touches both layers | Run both agents; frontend first |

---

## 3. Mark Issue as In-Progress

Before starting work, update the ClickUp task status to **in progress** so it's clear work has started.

```
Use mcp__claude_ai_ClickUp__clickup_update_task with:
  task_id: <id>
  status: "in progress"
```

---

## 4. Fix the Issue

### For UI / Frontend Issues

Use agent: `@.claude/agents/frontend-developer.md`

Steps the agent follows:
1. Read the relevant UI flow doc from `.claude/ui-flows/` before touching any component
2. Read the affected component file(s) before editing
3. Apply the fix using the design system (`--nds-*` tokens, `@design-system` imports)
4. Never use raw hex colors or hardcoded spacing
5. Respect the `handleCardClick` guard pattern for swipeable cards

### For Backend Issues

Use agent: `@.claude/agents/backend-developer.md`

Steps the agent follows:
1. Read `backend/routes/` relevant file before editing
2. Use parameterized queries — never string-interpolated SQL
3. Apply auth middleware (`authenticateToken`) on all protected routes
4. Test via `backend/verify_tables.js` or `backend/list-*.js` scripts if applicable
5. Update `frontend-web/src/api.js` if the API contract changed

---

## 5. After Attempting the Fix

### If fixed successfully:
```
Use mcp__claude_ai_ClickUp__clickup_update_task with:
  task_id: <id>
  status: "✅ resolved"
```
Then add a comment summarising what was changed:
```
Use mcp__claude_ai_ClickUp__clickup_create_task_comment with:
  task_id: <id>
  comment_text: "Fixed in commit <hash>. <1-2 sentence summary of the change>"
```

### If blocked / not fully fixed:
```
Use mcp__claude_ai_ClickUp__clickup_update_task with:
  task_id: <id>
  status: "in progress"
```
Add a comment with the blocker details:
```
Use mcp__claude_ai_ClickUp__clickup_create_task_comment with:
  task_id: <id>
  comment_text: "Attempted fix. Blocked: <describe the issue>. Files touched: <list>. Next steps: <what's needed>"
```
Leave the task as-is and move on.

---

## 6. Check In (REQUIRED after every fix)

After every successful fix, **always** run the check-in workflow to commit and push:
```
@.agent/workflows/check_in_to_main.md
```
Use a commit message that references the issue, e.g.:
`"Fix: <issue name> (ClickUp #<id>)"`

Update the ClickUp comment with the actual commit hash after pushing:
```
Use mcp__claude_ai_ClickUp__clickup_create_task_comment with:
  task_id: <id>
  comment_text: "Fixed in commit <hash>. <1-2 sentence summary of the change>"
```

---

## Notes

- Always read files before editing — never modify code you haven't read
- For UI fixes: check both dark and light theme compatibility
- For backend fixes: ensure no SQL injection risk (use `$1`, `$2` params)
- The backend-developer agent lives at: `.claude/agents/backend-developer.md`
  - If it doesn't exist yet, create it following the same structure as `frontend-developer.md`
