# MCP Protocol Consistency Analysis

**Date**: 2026-02-08
**Status**: ❌ **CRITICAL ISSUES FOUND**

## Executive Summary

The MCP server has **3 critical schema mismatches** that prevent the `add_task` tool from functioning correctly. The tool attempts to insert into non-existent columns and uses incorrect status values that don't match the application's data model.

---

## Critical Issues

### 🔴 Issue 1: Column `deadline` Does Not Exist

**Severity**: CRITICAL - Prevents task creation

**Location**: `mcp-server/tools/add-task.js:55, 68, 82`

**Problem**:
- MCP tool tries to INSERT into `deadline` column
- Database schema has NO `deadline` column (verified via check-tasks-schema.js)
- Backend API does NOT use `deadline` column

**Evidence**:
```javascript
// add-task.js line 50-60
INSERT INTO tasks (
    user_id,
    title,
    content,
    status,
    deadline,          // ❌ DOES NOT EXIST
    subject_id,
    ...
)
```

**Actual Schema** (22 columns):
- id, subject_id, type, title, url, content, completed, created_at, updated_at
- tags, rating, reminder_time, alert_type, reminder_snoozed_until, reminder_dismissed
- user_id, goal_id, attachment_url, status, subtasks, resources, parent_task_id
- ❌ NO `deadline` column

**Impact**: All `add_task` calls fail with:
```
column "deadline" of relation "tasks" does not exist
```

**Fix**: Remove `deadline` parameter entirely from add-task.js

---

### 🔴 Issue 2: Column `task_type` Should Be `type`

**Severity**: CRITICAL - Prevents task creation

**Location**: `mcp-server/tools/add-task.js:56, 70`

**Problem**:
- MCP tool tries to INSERT into `task_type` column
- Actual column name is `type` (not `task_type`)
- get-tasks.js correctly uses `t.type` (line 64)

**Evidence**:
```javascript
// add-task.js - WRONG
INSERT INTO tasks (..., task_type, ...)  // ❌

// get-tasks.js - CORRECT
SELECT ..., t.type, ... FROM tasks t     // ✅
```

**Backend API**: Uses `type` column
```javascript
// backend/routes/tasks.js:396
INSERT INTO tasks (..., type, ...)
VALUES ($1, $2, $3, ...)  // $3 = type
```

**Impact**: All `add_task` calls fail with:
```
column "task_type" of relation "tasks" does not exist
```

**Fix**: Rename `task_type` → `type` throughout add-task.js

---

### 🔴 Issue 3: Status Value Mismatch

**Severity**: CRITICAL - Creates invalid data

**Location**: `mcp-server/tools/add-task.js:21, 38-41, 149`

**Problem**:
- MCP tool uses: `["pending", "in_progress", "completed"]`
- Actual database uses: `["TODO", "IN_PROGRESS", "DONE"]`
- Creates tasks with invalid status values

**Evidence**:

| Source | Status Values |
|--------|---------------|
| **MCP add-task.js** | ❌ `pending`, `in_progress`, `completed` |
| **MCP get-tasks.js** | ✅ `TODO`, `IN_PROGRESS`, `DONE` |
| **Database schema** | ✅ Default: `'TODO'::character varying` |
| **Backend API** | ✅ `req.body.status \|\| 'TODO'` |

```javascript
// add-task.js - WRONG
const validStatuses = ['pending', 'in_progress', 'completed'];  // ❌
status = 'pending'  // ❌

// get-tasks.js - CORRECT
enum: ["TODO", "IN_PROGRESS", "DONE"]  // ✅

// Backend API - CORRECT
req.body.status || 'TODO'  // ✅
```

**Impact**:
- Tasks created with status `"pending"` instead of `"TODO"`
- Frontend UI won't filter/display these tasks correctly
- Status updates may fail
- Inconsistent with rest of application

**Fix**: Change status values to match database:
- `pending` → `TODO`
- `in_progress` → `IN_PROGRESS`
- `completed` → `DONE`

---

## Schema Comparison

### Backend API INSERT Statement
```sql
INSERT INTO tasks (
    user_id,      -- ✅ MCP has
    subject_id,   -- ✅ MCP has
    type,         -- ❌ MCP calls it "task_type"
    title,        -- ✅ MCP has
    url,          -- ✅ MCP has
    content,      -- ✅ MCP has
    tags,         -- ⚠️  MCP missing (optional)
    goal_id,      -- ⚠️  MCP missing (optional)
    attachment_url, -- ✅ MCP has
    status,       -- ⚠️  MCP has but wrong values
    subtasks,     -- ⚠️  MCP missing (optional)
    resources     -- ⚠️  MCP missing (optional)
)
```

### MCP add-task.js Current INSERT
```sql
INSERT INTO tasks (
    user_id,        -- ✅ Correct
    title,          -- ✅ Correct
    content,        -- ✅ Correct
    status,         -- ❌ Wrong values (pending vs TODO)
    deadline,       -- ❌ Column doesn't exist
    subject_id,     -- ✅ Correct
    task_type,      -- ❌ Should be "type"
    url,            -- ✅ Correct
    attachment_url  -- ✅ Correct
)
```

---

## Additional Issues (Non-Critical)

### ⚠️  Issue 4: Missing Optional Columns

**Severity**: MINOR - Limits functionality

**Missing from add-task.js**:
- `tags` (ARRAY) - For task categorization
- `goal_id` (integer) - Link tasks to goals
- `rating` (integer) - Task priority/importance
- `subtasks` (jsonb) - Inline subtasks (different from relational subtasks)
- `resources` (jsonb) - Learning resources
- `parent_task_id` (integer) - Create sub-tasks
- `reminder_time` (timestamp) - Set reminders
- `alert_type` (varchar) - 'basic' or 'persistent'

**Recommendation**: Add as optional parameters to match full backend API capability

---

### ⚠️  Issue 5: Inconsistency Between MCP Tools

**Severity**: MINOR - Confusing for developers

**get-tasks.js**: ✅ Uses correct schema
- Column: `t.type`
- Status: `["TODO", "IN_PROGRESS", "DONE"]`

**add-task.js**: ❌ Uses incorrect schema
- Column: `task_type`
- Status: `["pending", "in_progress", "completed"]`

**Impact**: Developer confusion, maintenance burden

---

## Verification

### Test Results

```bash
# Running check-tasks-schema.js shows actual schema:
=== TASKS TABLE SCHEMA ===
Columns found: 22

Key findings:
✅ user_id column exists: YES
✅ status column exists: YES (default: 'TODO'::character varying)
✅ type column exists: YES (default: 'TASK'::character varying)
❌ deadline column exists: NO
❌ task_type column exists: NO
```

### Error Log
```
User attempted: Add task "mcp test"
Result: FAILED
Error: column "deadline" of relation "tasks" does not exist
```

---

## Recommended Fixes

### Priority 1: Critical Fixes (Required for basic functionality)

1. **Remove `deadline` parameter** from add-task.js entirely
   - Delete from INSERT column list (line 55)
   - Delete from VALUES parameters (line 77-87)
   - Delete from RETURNING clause (line 68)
   - Delete from input schema (line 153-156)

2. **Rename `task_type` → `type`** throughout add-task.js
   - Line 24: `const { ..., task_type = 'normal', ... }`  → `type = 'TASK'`
   - Line 43-46: validTaskTypes constant
   - Line 56: INSERT column name
   - Line 84: INSERT value
   - Line 70: RETURNING clause
   - Line 161-165: Input schema property

3. **Fix status values**
   - Line 21: Default `'pending'` → `'TODO'`
   - Line 38: `['pending', 'in_progress', 'completed']` → `['TODO', 'IN_PROGRESS', 'DONE']`
   - Line 149: Schema enum values

### Priority 2: Enhancement Fixes (Optional)

4. **Add missing optional parameters**:
   - `tags` (array)
   - `goal_id` (number)
   - `rating` (number)
   - `subtasks` (jsonb array)
   - `resources` (jsonb array)
   - `parent_task_id` (number)

5. **Update documentation**
   - Fix README.md to reflect actual schema
   - Update tool descriptions
   - Add migration notes

---

## Testing Checklist

After fixes are applied, verify:

- [ ] `add_task` with minimal params (user_id, title)
- [ ] `add_task` with subject_id
- [ ] `add_task` with status="TODO"
- [ ] `add_task` with type="TASK"
- [ ] `add_task` with type="EXPLORATORY"
- [ ] Verify created task appears in `get_tasks`
- [ ] Verify status values match across tools
- [ ] Backend API can read MCP-created tasks
- [ ] Frontend UI displays MCP-created tasks

---

## Root Cause

The MCP server was developed based on **assumed schema** rather than **actual schema**. The developer likely:

1. ❌ Didn't check actual database columns before implementing
2. ❌ Assumed common task fields (deadline) without verification
3. ❌ Used different naming conventions (task_type vs type)
4. ❌ Used generic status values instead of app-specific ones

**Lesson**: Always verify schema with `information_schema.columns` or existing API code before implementing MCP tools.

---

## Impact Assessment

**Current State**: 🔴 MCP server is **non-functional**
- 0% of `add_task` calls succeed
- Users cannot create tasks via MCP
- Error messages are cryptic to end users

**After Priority 1 Fixes**: 🟢 MCP server will be **functional**
- 100% of basic `add_task` calls succeed
- Tasks integrate seamlessly with existing app
- Status values consistent across all interfaces

**After Priority 2 Fixes**: 🟢 MCP server will be **feature-complete**
- Full parity with backend API
- Support for advanced features (tags, goals, ratings)
- Complete task management via MCP

---

## References

- Database schema: `backend/check-tasks-schema.js` (line 15-42)
- Backend API: `backend/routes/tasks.js` (line 396-411)
- MCP get-tasks: `mcp-server/tools/get-tasks.js` (line 64, 168) ✅ Correct
- MCP add-task: `mcp-server/tools/add-task.js` ❌ Has issues
- Actual schema dump: 22 columns (see test output above)
