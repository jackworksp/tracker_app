# Task 04: Subtask Management UI Enhancements

**Issue**: #2 - UI Alterations
**ClickUp**: https://app.clickup.com/t/86d1vpb9y
**Priority**: 💻 Medium
**Estimated Time**: 1-2 days
**Sprint**: Sprint 4 (Week 4)

---

## Objective
Improve subtask management experience in task detail modal with progress bars, bulk actions, and inline editing.

## Features to Implement

### 1. Visual Progress Bar
Show percentage completion of subtasks

### 2. Bulk Actions
"Complete All Subtasks" button

### 3. Inline Editing (Optional)
Edit subtask title without deleting/recreating

## Implementation Steps

### 1. Add Progress Bar Component
**File**: `frontend-web/src/components/TaskDetailModal.jsx`

Add after subtasks section header:

```jsx
const completedCount = subtasks.filter(t => t.completed).length +
                       relationalSubtasks.filter(t => t.completed).length;
const totalCount = subtasks.length + relationalSubtasks.length;
const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

<div className="subtask-progress-section">
    <div className="subtask-header">
        <h4>Subtasks ({completedCount}/{totalCount})</h4>
        {totalCount > 0 && completedCount < totalCount && (
            <button
                className="btn-complete-all-subtasks"
                onClick={handleCompleteAllSubtasks}
            >
                Complete All
            </button>
        )}
    </div>

    <div className="subtask-progress-bar">
        <div
            className="subtask-progress-fill"
            style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6)'
            }}
        />
    </div>

    <div className="subtask-progress-label">
        {progressPercent.toFixed(0)}% Complete
    </div>
</div>
```

### 2. Implement Complete All Handler

```javascript
const handleCompleteAllSubtasks = async () => {
    try {
        // Complete inline subtasks
        const updatedInlineSubtasks = subtasks.map(st => ({
            ...st,
            completed: true
        }));
        setSubtasks(updatedInlineSubtasks);

        // Update task with new subtasks
        await api.tasks.update(task.id, {
            subtasks: updatedInlineSubtasks
        });

        // Complete relational subtasks
        for (const relSubtask of relationalSubtasks) {
            if (!relSubtask.completed) {
                await api.tasks.update(relSubtask.id, {
                    completed: true,
                    status: 'DONE'
                });
            }
        }

        // Refresh subtasks
        await loadRelationalSubtasks();

        // Show success message
        // (implement toast notification)
    } catch (error) {
        console.error('Failed to complete all subtasks:', error);
    }
};
```

### 3. Add CSS Styles
**File**: `frontend-web/src/components/TaskDetailModal.css`

```css
.subtask-progress-section {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.subtask-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.subtask-header h4 {
    margin: 0;
    color: var(--nds-text-primary);
    font-size: 1rem;
}

.btn-complete-all-subtasks {
    padding: 6px 12px;
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.4);
    border-radius: 8px;
    color: #60a5fa;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-complete-all-subtasks:hover {
    background: rgba(96, 165, 250, 0.3);
    border-color: rgba(96, 165, 250, 0.6);
}

.subtask-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.subtask-progress-fill {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;
    border-radius: 4px;
}

.subtask-progress-label {
    text-align: right;
    font-size: 0.8rem;
    color: var(--nds-text-secondary);
}
```

### 4. Optional: Inline Editing for Subtasks

Add edit mode state:

```javascript
const [editingSubtaskId, setEditingSubtaskId] = useState(null);
const [editSubtaskText, setEditSubtaskText] = useState('');

const handleEditSubtask = (subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditSubtaskText(subtask.text);
};

const handleSaveSubtask = async (subtaskId) => {
    const updatedSubtasks = subtasks.map(st =>
        st.id === subtaskId ? { ...st, text: editSubtaskText } : st
    );

    setSubtasks(updatedSubtasks);
    await api.tasks.update(task.id, { subtasks: updatedSubtasks });

    setEditingSubtaskId(null);
    setEditSubtaskText('');
};
```

Render with edit mode:

```jsx
{subtasks.map(subtask => (
    <div key={subtask.id} className="subtask-item">
        <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => handleToggleSubtask(subtask.id)}
        />

        {editingSubtaskId === subtask.id ? (
            <input
                type="text"
                value={editSubtaskText}
                onChange={(e) => setEditSubtaskText(e.target.value)}
                onBlur={() => handleSaveSubtask(subtask.id)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveSubtask(subtask.id)}
                autoFocus
            />
        ) : (
            <span onDoubleClick={() => handleEditSubtask(subtask)}>
                {subtask.text}
            </span>
        )}
    </div>
))}
```

## Testing Checklist

- [ ] Progress bar displays correct percentage
- [ ] Progress bar color changes when 100% complete
- [ ] "Complete All" button appears only when incomplete subtasks exist
- [ ] "Complete All" marks all inline subtasks as complete
- [ ] "Complete All" marks all relational subtasks as complete
- [ ] Progress bar updates after completing subtasks
- [ ] Button disappears after all subtasks completed
- [ ] Inline editing saves changes correctly (if implemented)
- [ ] Double-click to edit works (if implemented)
- [ ] Enter key saves edit (if implemented)

## Success Criteria

✅ Visual progress indicator shows completion percentage
✅ "Complete All" button works for both subtask types
✅ Progress bar animates smoothly
✅ UI updates reflect real-time changes
✅ Mobile-friendly (buttons sized appropriately)
✅ (Optional) Inline editing functional

## Files Modified

- `frontend-web/src/components/TaskDetailModal.jsx`
- `frontend-web/src/components/TaskDetailModal.css`

## Related Tasks

← [Task 03: UI Task Card Enhancements](task-03-ui-task-cards.md)
→ [Task 05: Mobile UX Optimizations](task-05-ui-mobile-optimizations.md)
