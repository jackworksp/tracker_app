# MCP Server Quick Fix Guide

## 🚨 Critical Issues Found

Your MCP server has **3 critical bugs** preventing it from working. Here's how to fix them:

---

## Option 1: Quick Fix (Apply Changes Manually)

### Step 1: Backup Current File
```bash
cd mcp-server/tools
cp add-task.js add-task.js.backup
```

### Step 2: Replace with Fixed Version
```bash
# The fixed version is at: mcp-server/tools/add-task.js.FIXED
# Replace the current add-task.js with this fixed version
mv add-task.js.FIXED add-task.js
```

### Step 3: Restart MCP Server
```bash
cd mcp-server
npm start
```

---

## Option 2: Manual Edits (If you prefer to edit the file yourself)

### Edit 1: Remove `deadline` (Lines 10, 22, 55, 68, 82, 153-156)

**Find and DELETE these sections:**

```javascript
// Line 10: Delete this line
* @param {string} [args.deadline] - Task deadline (ISO format)

// Line 22: Delete this line
deadline,

// Line 55: Delete this from INSERT column list
deadline,

// Line 68: Delete this from RETURNING
deadline,

// Line 82: Delete this from VALUES array
deadline || null,

// Lines 153-156: Delete this from input schema
deadline: {
    type: "string",
    description: "Task deadline in ISO format (YYYY-MM-DD or full ISO timestamp)"
},
```

### Edit 2: Rename `task_type` → `type`

**Find and REPLACE all occurrences:**

```diff
// Line 12: Change parameter name
- * @param {string} [args.task_type] - Task type: 'normal' or 'exploratory'
+ * @param {string} [args.type] - Task type: 'TASK' or 'EXPLORATORY'

// Line 24: Change destructuring
- task_type = 'normal',
+ type = 'TASK',

// Line 43-46: Change validation variable name
- const validTaskTypes = ['normal', 'exploratory'];
- if (task_type && !validTaskTypes.includes(task_type)) {
-     throw new Error(`task_type must be one of: ${validTaskTypes.join(', ')}`);
+ const validTypes = ['TASK', 'EXPLORATORY'];
+ if (type && !validTypes.includes(type)) {
+     throw new Error(`type must be one of: ${validTypes.join(', ')}`);

// Line 56: Change INSERT column name
- task_type,
+ type,

// Line 70: Change RETURNING column name
- task_type,
+ type,

// Line 84: Change VALUES variable name
- task_type,
+ type,

// Lines 161-165: Change input schema property name
- task_type: {
+ type: {
     type: "string",
-    enum: ["normal", "exploratory"],
+    enum: ["TASK", "EXPLORATORY"],
-    description: "Task type: normal for regular tasks, exploratory for tasks with subtasks (default: normal)",
+    description: "Task type: TASK for regular tasks, EXPLORATORY for tasks with subtasks (default: TASK)",
-    default: "normal"
+    default: "TASK"
```

### Edit 3: Fix Status Values

**Find and REPLACE:**

```diff
// Line 21: Change default status
- status = 'pending',
+ status = 'TODO',

// Lines 38-41: Change valid statuses
- const validStatuses = ['pending', 'in_progress', 'completed'];
+ const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];

// Lines 147-151: Change input schema enum
status: {
    type: "string",
-   enum: ["pending", "in_progress", "completed"],
+   enum: ["TODO", "IN_PROGRESS", "DONE"],
-   description: "Task status (default: pending)",
+   description: "Task status (default: TODO)",
-   default: "pending"
+   default: "TODO"
}
```

---

## Option 3: Use the Fixed Version (Recommended)

The fixed version is ready at `mcp-server/tools/add-task.js.FIXED`

**What's Fixed:**
✅ Removed non-existent `deadline` column
✅ Renamed `task_type` → `type` with correct values (`TASK`, `EXPLORATORY`)
✅ Fixed status values: `TODO`, `IN_PROGRESS`, `DONE`
✅ Added optional columns: `tags`, `goal_id`, `rating`, `subtasks`, `resources`, `parent_task_id`
✅ Added goal details fetching
✅ Better error messages
✅ Full schema parity with backend API

**To apply:**
```bash
cd mcp-server/tools
mv add-task.js add-task.js.backup
mv add-task.js.FIXED add-task.js
```

---

## Testing After Fixes

### Test 1: Basic Task Creation
```javascript
// Try: "Add a task called 'Test MCP'"
// Expected tool call:
{
  "user_id": 1,
  "title": "Test MCP"
}
// Should succeed and return task with id
```

### Test 2: Task with Status
```javascript
// Try: "Add a TODO task called 'Study React'"
// Expected:
{
  "user_id": 1,
  "title": "Study React",
  "status": "TODO"
}
```

### Test 3: Exploratory Task
```javascript
// Try: "Create an exploratory task for learning Python"
// Expected:
{
  "user_id": 1,
  "title": "Learn Python",
  "type": "EXPLORATORY"
}
```

### Test 4: Task with Subject
```javascript
// Try: "Add a task for subject 5: Complete homework"
// Expected:
{
  "user_id": 1,
  "title": "Complete homework",
  "subject_id": 5
}
```

---

## Verification Checklist

After applying fixes:

- [ ] MCP server starts without errors
- [ ] `add_task` with basic params works
- [ ] Created tasks appear in `get_tasks`
- [ ] Status values match (`TODO`, not `pending`)
- [ ] Type values match (`TASK`, not `normal`)
- [ ] No SQL errors about missing columns
- [ ] Tasks created via MCP are visible in the web UI
- [ ] Can create both TASK and EXPLORATORY types

---

## Troubleshooting

### Server won't start
```bash
cd mcp-server
npm install  # Reinstall dependencies
node index.js  # Check for syntax errors
```

### Syntax errors after editing
- Check you didn't miss any commas
- Check all quotes are closed
- Compare with the .FIXED version

### Tasks still failing
```bash
# Run schema check to verify database state
cd backend
node check-tasks-schema.js
```

---

## Need Help?

1. Check the detailed analysis: `mcp-server/MCP_CONSISTENCY_ISSUES.md`
2. Compare your file with: `mcp-server/tools/add-task.js.FIXED`
3. Verify database schema: `backend/check-tasks-schema.js`
4. Check backend API reference: `backend/routes/tasks.js:396-411`

---

## Summary of Changes

| Item | Before (❌ Wrong) | After (✅ Fixed) |
|------|------------------|-----------------|
| **Column** | `deadline` | _removed_ |
| **Column** | `task_type` | `type` |
| **Default Status** | `'pending'` | `'TODO'` |
| **Status Values** | `pending`, `in_progress`, `completed` | `TODO`, `IN_PROGRESS`, `DONE` |
| **Default Type** | `'normal'` | `'TASK'` |
| **Type Values** | `normal`, `exploratory` | `TASK`, `EXPLORATORY` |
| **Optional Fields** | 3 | 9 (added tags, goal_id, rating, etc.) |

---

**Last Updated**: 2026-02-08
**Status**: Ready to apply ✅
