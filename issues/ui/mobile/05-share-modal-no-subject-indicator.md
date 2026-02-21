# Share Modal - No Subject Indicator (HIGH)

**Priority:** 🟠 HIGH
**Status:** Open
**Category:** User Experience, Information Architecture

## Problem

ShareConfirmModal doesn't show which subject the shared content will be added to. Users sharing content when no subject is selected may be confused about where it goes.

## Impact

- Users uncertain about where shared content is stored
- May create tasks/sessions in wrong subject
- Requires extra steps to move content to correct subject
- Reduces confidence in share target feature

## Solution

### Option 1: Display Current Subject Badge

```jsx
// ShareConfirmModal.jsx
import { Tag } from 'lucide-react';

function ShareConfirmModal({ url, currentSubject }) {
  return (
    <Modal visible={isVisible} title="Add to Vela">
      {currentSubject ? (
        <div className="current-subject-badge">
          <Tag size={16} />
          <span>Adding to: <strong>{currentSubject.name}</strong></span>
        </div>
      ) : (
        <div className="no-subject-warning">
          <AlertCircle size={16} />
          <span>No subject selected. Content will be added to default.</span>
        </div>
      )}

      {/* Preview and action buttons */}
      <div className="share-preview">
        {/* ... existing preview code ... */}
      </div>

      <div className="share-actions">
        <button onClick={() => handleAddTask()}>Add as Task</button>
        <button onClick={() => handleAddSession()}>Log Session</button>
        <button onClick={() => handleAddAttachment()}>Add as Attachment</button>
      </div>
    </Modal>
  );
}
```

```css
/* ShareConfirmModal.css */
.current-subject-badge {
  display: flex;
  align-items: center;
  gap: var(--nds-spacing-2);
  padding: var(--nds-spacing-3);
  background: var(--nds-bg-accent-subtle);
  border: 1px solid var(--nds-border-accent);
  border-radius: var(--nds-radius-md);
  margin-bottom: var(--nds-spacing-4);
  font-size: 14px;
}

.no-subject-warning {
  display: flex;
  align-items: center;
  gap: var(--nds-spacing-2);
  padding: var(--nds-spacing-3);
  background: var(--nds-bg-warning-subtle);
  border: 1px solid var(--nds-border-warning);
  border-radius: var(--nds-radius-md);
  margin-bottom: var(--nds-spacing-4);
  font-size: 14px;
  color: var(--nds-text-warning);
}
```

### Option 2: Add Subject Selector Dropdown

```jsx
// ShareConfirmModal.jsx
import { Select } from '../design-system';

function ShareConfirmModal({ url, subjects, currentSubject, onSubjectChange }) {
  return (
    <Modal visible={isVisible} title="Add to Vela">
      <div className="subject-selector">
        <label htmlFor="subject-select">Add to subject:</label>
        <Select
          id="subject-select"
          value={currentSubject?.id}
          onChange={(subjectId) => onSubjectChange(subjectId)}
          options={subjects.map(s => ({ value: s.id, label: s.name }))}
        />
      </div>

      {/* ... rest of modal ... */}
    </Modal>
  );
}
```

## Recommendation

**Implement both**:
1. Show current subject badge (always visible)
2. Add subject selector dropdown (for quick switching without leaving modal)

This provides both visibility and flexibility.

## Files to Update

- `/frontend-web/src/components/ShareConfirmModal.jsx`
- `/frontend-web/src/components/ShareConfirmModal.css`
- `/frontend-web/src/App.jsx` (pass current subject and subjects list)

## Testing

1. Share content with subject selected → verify badge shows correct subject
2. Share content with no subject → verify warning appears
3. Change subject in dropdown → verify content added to new subject
4. Test with screen reader → verify subject is announced

## User Flow

```
1. User shares link from browser
   ↓
2. ShareConfirmModal opens
   ↓
3. User sees: "Adding to: AWS SAA" badge
   ↓
4. User can optionally change subject via dropdown
   ↓
5. User selects action (Task/Session/Attachment)
   ↓
6. Content added to selected subject
```

## References

- [Context Awareness in Mobile UX](https://www.nngroup.com/articles/context-mobile/)
