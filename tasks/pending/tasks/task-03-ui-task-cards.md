# Task 03: UI Task Card Visual Enhancements

**Issue**: #2 - UI Alterations
**ClickUp**: https://app.clickup.com/t/86d1vpb9y
**Priority**: 💻 Medium
**Estimated Time**: 1-2 days
**Sprint**: Sprint 4 (Week 4)

---

## Objective
Add visual indicators to task cards showing subtask progress and completion status.

## Features to Implement

### 1. Subtask Progress Badge
Show completion ratio on task cards (e.g., "3/5 ✓")

### 2. Incomplete Subtask Indicator
Add yellow warning dot when subtasks remain incomplete

### 3. Visual Progress Indicator
Optional: Gray out checkbox or show warning icon if subtasks incomplete

## Implementation Steps

### 1. Add Progress Calculation Function
**File**: `frontend-web/src/components/Tasks.jsx`

```javascript
const getSubtaskProgress = (task) => {
    const inline = task.subtasks || [];
    const inlineComplete = inline.filter(st => st.completed).length;
    const inlineTotal = inline.length;

    // Note: For relational subtasks, would need API enhancement
    // or fetch from existing relationalSubtasks data

    return {
        completed: inlineComplete,
        total: inlineTotal,
        hasIncomplete: inlineComplete < inlineTotal
    };
};
```

### 2. Update Task Card Rendering
**File**: `frontend-web/src/components/Tasks.jsx`

Add badge to task card footer:

```jsx
// In task card JSX:
<div className="task-card-footer">
    {task.subtasks?.length > 0 && (
        <div className="subtask-badge">
            <CheckSquare size={12} />
            {getSubtaskProgress(task).completed}/{getSubtaskProgress(task).total}
            {getSubtaskProgress(task).hasIncomplete && (
                <span className="incomplete-indicator">⚠️</span>
            )}
        </div>
    )}
</div>
```

### 3. Add CSS Styles
**File**: `frontend-web/src/components/Tasks.css`

```css
.task-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.subtask-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(96, 165, 250, 0.15);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 12px;
    font-size: 0.75rem;
    color: var(--nds-text-secondary);
}

.subtask-badge .incomplete-indicator {
    font-size: 0.8rem;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.task-card.has-incomplete-subtasks {
    border-left: 3px solid #fbbf24;
}
```

### 4. Add Visual State to Task Cards
Apply class when task has incomplete subtasks:

```jsx
<div className={`task-card ${getSubtaskProgress(task).hasIncomplete ? 'has-incomplete-subtasks' : ''}`}>
    {/* card content */}
</div>
```

## API Enhancement (Optional)
If relational subtask count is needed on task cards, enhance GET /tasks endpoint:

**File**: `backend/routes/tasks.js`

```javascript
// Add to existing query:
SELECT t.*,
       s.name as subject_name,
       (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id) as relational_subtask_count,
       (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id AND completed = true) as relational_subtask_completed
FROM tasks t
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE t.user_id = $1
```

## Testing Checklist

- [ ] Badge appears on tasks with subtasks
- [ ] Badge shows correct count (completed/total)
- [ ] Warning indicator appears when incomplete
- [ ] Badge doesn't appear on tasks without subtasks
- [ ] Styling matches design system
- [ ] Works on mobile (touch-friendly)
- [ ] Animation performs smoothly
- [ ] Accessible (screen reader announces count)

## Success Criteria

✅ Subtask progress visible at a glance on task cards
✅ Incomplete tasks visually distinguished
✅ Badge styling matches design system
✅ Mobile-friendly design
✅ No performance impact (counts calculated efficiently)

## Files Modified

- `frontend-web/src/components/Tasks.jsx`
- `frontend-web/src/components/Tasks.css`
- (Optional) `backend/routes/tasks.js` for API enhancement

## Related Tasks

← [Task 02: Frontend Validation](task-02-frontend-validation.md)
→ [Task 04: Subtask Management Enhancements](task-04-ui-subtask-enhancements.md)
