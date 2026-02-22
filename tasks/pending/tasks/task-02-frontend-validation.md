# Task 02: Frontend Task Completion Validation UI

**Issue**: #1 - Task Completion Validation
**ClickUp**: https://app.clickup.com/t/86d1x1qdu
**Priority**: 🚩 High
**Estimated Time**: 1-2 days
**Sprint**: Sprint 1 (Week 1)

---

## Objective
Create frontend UI to warn users when attempting to complete tasks with incomplete subtasks, with option to override.

## Dependencies

- ✅ Task 01 completed (backend validation)

## Implementation Steps

### 1. Update API Client
**File**: `frontend-web/src/api.js`

Ensure task update supports `force_complete` parameter:

```javascript
update: async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data) // includes force_complete if present
    });

    if (!response.ok) {
        const error = await response.json();
        throw error; // Will contain subtaskCount and details
    }

    return response.json();
}
```

### 2. Add State to TaskDetailModal
**File**: `frontend-web/src/components/TaskDetailModal.jsx`

Add state variables:

```javascript
const [showCompletionWarning, setShowCompletionWarning] = useState(false);
const [incompleteSubtaskInfo, setIncompleteSubtaskInfo] = useState(null);
```

### 3. Modify handleStatusChange
**File**: `frontend-web/src/components/TaskDetailModal.jsx` (around line 102)

Add client-side check:

```javascript
const handleStatusChange = async (newStatus) => {
    // If marking as DONE, check for incomplete subtasks
    if (newStatus === 'DONE') {
        const incompleteInline = subtasks.filter(st => !st.completed).length;
        const incompleteRelational = relationalSubtasks.filter(st => !st.completed).length;
        const totalIncomplete = incompleteInline + incompleteRelational;

        if (totalIncomplete > 0) {
            setIncompleteSubtaskInfo({
                count: totalIncomplete,
                inline: incompleteInline,
                relational: incompleteRelational
            });
            setShowCompletionWarning(true);
            return; // Don't proceed with status change
        }
    }

    // Proceed with status change
    setStatus(newStatus);
    if (onUpdate) onUpdate(task.id, { status: newStatus });
};
```

### 4. Add Force Complete Handler

```javascript
const handleForceComplete = () => {
    setStatus('DONE');
    if (onUpdate) onUpdate(task.id, { status: 'DONE', force_complete: true });
    setShowCompletionWarning(false);
    setIncompleteSubtaskInfo(null);
};
```

### 5. Add Warning Modal UI
**File**: `frontend-web/src/components/TaskDetailModal.jsx`

Add modal before closing `</AnimatePresence>`:

```jsx
{/* Completion Warning Modal */}
{showCompletionWarning && (
    <div
        style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
        }}
        onClick={() => setShowCompletionWarning(false)}
    >
        <div
            style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                padding: '24px',
                borderRadius: '16px',
                maxWidth: '400px',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <h3 style={{
                color: '#fbbf24',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                ⚠️ Incomplete Subtasks
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                This task has <strong>{incompleteSubtaskInfo?.count}</strong> incomplete subtask(s):
            </p>
            <ul style={{
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '20px',
                fontSize: '0.9rem',
                listStyle: 'none',
                padding: 0
            }}>
                {incompleteSubtaskInfo?.inline > 0 && (
                    <li>• {incompleteSubtaskInfo.inline} inline subtask(s)</li>
                )}
                {incompleteSubtaskInfo?.relational > 0 && (
                    <li>• {incompleteSubtaskInfo.relational} linked subtask(s)</li>
                )}
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Are you sure you want to mark this task as complete?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowCompletionWarning(false)}
                    style={{
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleForceComplete}
                    style={{
                        padding: '10px 20px',
                        background: '#fbbf24',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#1e1b4b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Complete Anyway
                </button>
            </div>
        </div>
    </div>
)}
```

## Testing Checklist

- [ ] Warning appears when trying to complete task with incomplete subtasks
- [ ] Warning shows correct count breakdown (inline vs relational)
- [ ] Cancel button dismisses modal and prevents completion
- [ ] "Complete Anyway" button marks task as complete
- [ ] No warning shown when all subtasks are complete
- [ ] No warning shown when task has no subtasks
- [ ] Modal styling matches app design system
- [ ] Modal is accessible (keyboard navigation, focus trap)

## Success Criteria

✅ Warning modal appears for tasks with incomplete subtasks
✅ Displays accurate count and breakdown
✅ User can cancel or force complete
✅ No warnings for tasks with all subtasks done
✅ Styling matches design system
✅ Works on mobile and desktop

## Files Modified

- `frontend-web/src/api.js`
- `frontend-web/src/components/TaskDetailModal.jsx`

## Next Tasks

→ [Task 03: UI Task Card Enhancements](task-03-ui-task-cards.md) (Sprint 4)
→ [Task 06: Vault Database Schema](task-06-vault-database-schema.md) (Sprint 2)
→ [Task 10: Skills Database Schema](task-10-skills-database-schema.md) (Sprint 3)
