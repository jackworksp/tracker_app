# Skeleton Loading States Missing (MEDIUM)

**Priority:** 🟡 MEDIUM
**Status:** Open
**Category:** User Experience, Performance

## Problem

App uses spinner-only loading, with no skeleton screens during data fetch. This makes the page feel janky when switching between tabs, especially on slower connections.

## Impact

- Perceived performance is poor
- Layout shifts when content loads (CLS)
- Users uncertain if app is working
- Feels slower than it actually is

## Solution

Replace spinner with skeleton cards that match the shape of real content.

### 1. Skeleton Card Component

```jsx
// SkeletonCard.jsx
export function SkeletonCard({ type = 'task' }) {
  return (
    <div className="skeleton-card" aria-busy="true" aria-label="Loading...">
      <div className="skeleton-header">
        <div className="skeleton-title skeleton-shimmer" />
        <div className="skeleton-badge skeleton-shimmer" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-text skeleton-shimmer" />
        <div className="skeleton-text skeleton-shimmer short" />
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-icon skeleton-shimmer" />
        <div className="skeleton-icon skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonTaskCard() {
  return <SkeletonCard type="task" />;
}

export function SkeletonSessionCard() {
  return <SkeletonCard type="session" />;
}

export function SkeletonAttachmentCard() {
  return <SkeletonCard type="attachment" />;
}
```

```css
/* SkeletonCard.css */
.skeleton-card {
  background: var(--nds-bg-secondary);
  border-radius: var(--nds-radius-lg);
  padding: var(--nds-spacing-4);
  margin-bottom: var(--nds-spacing-3);
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--nds-bg-tertiary) 25%,
    var(--nds-bg-secondary) 50%,
    var(--nds-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-title {
  height: 20px;
  width: 70%;
  border-radius: var(--nds-radius-sm);
  margin-bottom: var(--nds-spacing-2);
}

.skeleton-text {
  height: 14px;
  width: 100%;
  border-radius: var(--nds-radius-sm);
  margin-bottom: var(--nds-spacing-2);
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-badge {
  height: 24px;
  width: 80px;
  border-radius: var(--nds-radius-full);
}

.skeleton-icon {
  height: 32px;
  width: 32px;
  border-radius: var(--nds-radius-sm);
}

.skeleton-header,
.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--nds-spacing-3);
}
```

### 2. Usage in Components

**Before:**
```jsx
function Tasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
        tasks.map(task => <TaskCard key={task.id} task={task} />)
      )}
    </div>
  );
}
```

**After:**
```jsx
import { SkeletonTaskCard } from './SkeletonCard';

function Tasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  return (
    <div>
      {loading ? (
        <>
          <SkeletonTaskCard />
          <SkeletonTaskCard />
          <SkeletonTaskCard />
        </>
      ) : (
        tasks.map(task => <TaskCard key={task.id} task={task} />)
      )}
    </div>
  );
}
```

### 3. Skeleton Variants

```jsx
// SkeletonList.jsx
export function SkeletonList({ count = 3, type = 'task' }) {
  const SkeletonComponent = {
    task: SkeletonTaskCard,
    session: SkeletonSessionCard,
    attachment: SkeletonAttachmentCard,
  }[type];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </>
  );
}

// Usage
<SkeletonList count={5} type="task" />
```

### 4. Progressive Loading

For long lists, show skeleton items as user scrolls:

```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  return (
    <>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
      {loadingMore && <SkeletonList count={3} />}
    </>
  );
}
```

## Files to Create

- `/frontend-web/src/components/SkeletonCard.jsx`
- `/frontend-web/src/components/SkeletonCard.css`
- `/frontend-web/src/components/SkeletonList.jsx`

## Files to Update

- `/frontend-web/src/components/Tasks.jsx`
- `/frontend-web/src/components/Timeline.jsx`
- `/frontend-web/src/components/AttachmentsTab.jsx`
- `/frontend-web/src/components/NotesPage.jsx`

## Benefits

- **Perceived Performance**: Feels 2-3x faster
- **No Layout Shift**: Content appears in place
- **User Confidence**: Clear indication something is loading
- **Professional Feel**: Modern, polished UX

## Testing

1. Throttle network to "Slow 3G"
2. Switch between tabs
3. Verify skeleton cards match real content shape
4. Test shimmer animation performance
5. Verify ARIA labels for screen readers

## References

- [Skeleton Screens Best Practices](https://www.nngroup.com/articles/skeleton-screens/)
- [Perceived Performance](https://web.dev/rail/)
- [React Skeleton Examples](https://github.com/dvtng/react-loading-skeleton)
