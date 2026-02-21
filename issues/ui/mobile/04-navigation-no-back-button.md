# Navigation - No Back Button in Deep Views (HIGH)

**Priority:** 🟠 HIGH
**Status:** Open
**Category:** Navigation, User Experience

## Problem

No breadcrumb or back button in deep views (task detail, session detail, note detail). Users may feel lost when drilling into nested content, especially on single-tab mobile views.

## Impact

- Users feel disoriented in deep navigation
- Rely solely on Android back button (may not be intuitive)
- No visual indicator of navigation depth
- Difficult to return to previous context

## Solution

### 1. Add Header with Back Button

```jsx
// DetailHeader.jsx
import { ChevronLeft } from 'lucide-react';
import { Button } from '../design-system';

export function DetailHeader({ title, onBack }) {
  return (
    <header className="detail-header">
      <Button
        variant="subtle"
        onClick={onBack}
        aria-label="Go back"
        className="back-button"
      >
        <ChevronLeft size={24} />
      </Button>
      <h1 className="detail-title">{title}</h1>
    </header>
  );
}
```

```css
/* DetailHeader.css */
.detail-header {
  display: flex;
  align-items: center;
  gap: var(--nds-spacing-3);
  padding: var(--nds-spacing-4);
  border-bottom: 1px solid var(--nds-border-secondary);
  position: sticky;
  top: 0;
  background: var(--nds-bg-primary);
  z-index: 10;
}

.back-button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--nds-spacing-2);
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
```

### 2. Handle Android Back Button

```jsx
// App.jsx
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

function App() {
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Exit app if at root
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.remove();
    };
  }, []);

  // ... rest of app
}
```

### 3. Add Breadcrumb Trail (Optional)

```jsx
// Breadcrumbs.jsx
export function Breadcrumbs({ path }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {path.map((item, index) => (
        <span key={item.id}>
          {index > 0 && <ChevronRight size={16} />}
          <button onClick={() => item.onNavigate()}>
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}

// Usage
<Breadcrumbs
  path={[
    { id: 'tasks', label: 'Tasks', onNavigate: () => navigate('/tasks') },
    { id: 'task-detail', label: taskTitle, onNavigate: null }
  ]}
/>
```

## Files to Create

- `/frontend-web/src/components/DetailHeader.jsx`
- `/frontend-web/src/components/DetailHeader.css`
- `/frontend-web/src/components/Breadcrumbs.jsx` (optional)

## Files to Update

- `/frontend-web/src/App.jsx` (add Capacitor back button handler)
- `/frontend-web/src/components/TaskDetailModal.jsx` (add DetailHeader)
- `/frontend-web/src/components/SessionDetailModal.jsx` (add DetailHeader)
- `/frontend-web/src/components/NoteDetailView.jsx` (add DetailHeader)

## Testing

1. Navigate to task detail → verify back button appears
2. Tap back button → verify returns to task list
3. Test Android back button integration
4. Verify back button is 44x44px minimum
5. Test with screen reader (announces "Go back")

## Implementation Priority

1. Add DetailHeader component (HIGH)
2. Add Capacitor back button handler (HIGH)
3. Add breadcrumbs (MEDIUM - optional enhancement)

## References

- [Capacitor App API](https://capacitorjs.com/docs/apis/app#addlistener)
- [Mobile Navigation Patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)
