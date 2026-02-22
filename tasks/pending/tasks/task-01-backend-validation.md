# Task 01: Backend Task Completion Validation

**Issue**: #1 - Task Completion Validation
**ClickUp**: https://app.clickup.com/t/86d1x1qdu
**Priority**: 🚩 High
**Estimated Time**: 1-2 days
**Sprint**: Sprint 1 (Week 1)

---

## Objective
Implement backend validation to prevent parent tasks from being marked complete when they have incomplete subtasks.

## Context
- App has two types of subtasks:
  - **Inline subtasks**: JSONB in `tasks.subtasks` column
  - **Relational subtasks**: Using `parent_task_id` foreign key
- Currently no validation prevents completing parent tasks with incomplete subtasks

## Implementation Steps

### 1. Create Validation Helper Function
**File**: `backend/routes/tasks.js`

Add function to check for incomplete subtasks:

```javascript
// Helper function to check for incomplete subtasks
async function hasIncompleteSubtasks(taskId, userId) {
    try {
        const task = await db.query(
            'SELECT subtasks FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (task.rows.length === 0) return { has: false, count: 0 };

        // Check inline JSONB subtasks
        const inlineSubtasks = task.rows[0].subtasks || [];
        const incompleteInline = inlineSubtasks.filter(st => !st.completed);

        // Check relational subtasks
        const relationalResult = await db.query(
            'SELECT COUNT(*) as count FROM tasks WHERE parent_task_id = $1 AND user_id = $2 AND completed = FALSE',
            [taskId, userId]
        );

        const incompleteRelational = parseInt(relationalResult.rows[0].count);
        const totalIncomplete = incompleteInline.length + incompleteRelational;

        return {
            has: totalIncomplete > 0,
            count: totalIncomplete,
            inline: incompleteInline.length,
            relational: incompleteRelational
        };
    } catch (error) {
        console.error('Error checking subtasks:', error);
        return { has: false, count: 0 };
    }
}
```

### 2. Modify PUT /:id Endpoint
**File**: `backend/routes/tasks.js` (around line 454)

Add validation before task update:

```javascript
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed, status, force_complete } = req.body;

        // Check if trying to mark as complete
        const isMarkingComplete = completed === true || status === 'DONE';

        if (isMarkingComplete && !force_complete) {
            const subtaskCheck = await hasIncompleteSubtasks(id, req.userId);

            if (subtaskCheck.has) {
                return res.status(400).json({
                    error: 'Cannot complete task with incomplete subtasks',
                    subtaskCount: subtaskCheck.count,
                    details: {
                        inline: subtaskCheck.inline,
                        relational: subtaskCheck.relational
                    },
                    allowForce: true
                });
            }
        }

        // ... rest of existing update logic
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
```

## Testing Checklist

- [ ] Test with inline subtasks only
- [ ] Test with relational subtasks only
- [ ] Test with both types of subtasks
- [ ] Test force_complete override
- [ ] Test when all subtasks are complete (should allow)
- [ ] Test with task that has no subtasks (should allow)
- [ ] Test error handling (invalid task ID, user mismatch)

## Success Criteria

✅ Backend returns 400 error when attempting to complete task with incomplete subtasks
✅ Error response includes count and breakdown (inline vs relational)
✅ `force_complete: true` parameter bypasses validation
✅ No false positives (tasks with all subtasks complete can be marked done)
✅ All tests pass

## Dependencies

- None (can start immediately)

## Files Modified

- `backend/routes/tasks.js`

## Next Task

→ [Task 02: Frontend Validation UI](task-02-frontend-validation.md)
