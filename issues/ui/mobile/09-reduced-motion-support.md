# Reduced Motion Support Missing (MEDIUM)

**Priority:** 🟡 MEDIUM
**Status:** Open
**Category:** Accessibility

## Problem

No `prefers-reduced-motion` media query support. Animations may trigger vestibular issues for users with motion sensitivity.

## Impact

- Users with vestibular disorders may experience dizziness, nausea
- Violates WCAG 2.1 Level AAA (Animation from Interactions)
- Excludes users who disable animations in system settings
- Poor accessibility experience

## Solution

Respect the `prefers-reduced-motion` user preference to disable or reduce animations.

### 1. Add Global Reduced Motion CSS

```css
/* frontend-web/src/design-system/styles/global.css */

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 2. Component-Specific Overrides

```css
/* Tasks.css */
.task-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .task-card {
    transition: none;
  }
}
```

```css
/* Modal.css */
.nds-modal-overlay {
  animation: fadeIn 0.2s ease;
}

.nds-modal-content {
  animation: slideUp 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .nds-modal-overlay,
  .nds-modal-content {
    animation: none;
  }
}
```

```css
/* BidirectionalSwipeCard.css */
.swipe-card {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .swipe-card {
    /* Keep transform but remove animation */
    transition: none;
  }
}
```

### 3. JavaScript Hook for Reduced Motion

```jsx
// hooks/useReducedMotion.js
import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
```

### 4. Usage in Components

```jsx
// BidirectionalSwipeCard.jsx
import { useReducedMotion } from '../hooks/useReducedMotion';

function BidirectionalSwipeCard({ onSwipeLeft, onSwipeRight, children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      drag={!prefersReducedMotion ? 'x' : false}
      animate={!prefersReducedMotion ? { x: 0 } : {}}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 300 }
      }
    >
      {children}
    </motion.div>
  );
}
```

### 5. Framer Motion Configuration

```jsx
// App.jsx
import { MotionConfig } from 'framer-motion';
import { useReducedMotion } from './hooks/useReducedMotion';

function App() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
      {/* App content */}
    </MotionConfig>
  );
}
```

### 6. Keep Essential Animations

Some animations improve usability even for users who prefer reduced motion:

```css
/* Keep instant transitions for focus/hover states */
@media (prefers-reduced-motion: reduce) {
  .nds-button:hover,
  .nds-button:focus-visible {
    /* Keep these - they provide essential feedback */
    transition: background-color 0.1s ease;
  }

  /* Remove decorative animations */
  .skeleton-shimmer {
    animation: none;
    background: var(--nds-bg-tertiary);
  }

  /* Keep loading spinner but simplify */
  .spinner {
    animation: spin 1s linear infinite;
  }
}
```

## What to Disable/Keep

### Disable (Decorative Animations)
- ✅ Skeleton shimmer animations
- ✅ Modal slide-in/fade animations
- ✅ Card hover lift effects
- ✅ Parallax scrolling
- ✅ Auto-playing carousels
- ✅ Page transition animations

### Keep (Functional Animations)
- ✅ Focus indicators (important for keyboard navigation)
- ✅ Loading spinners (indicate progress)
- ✅ Toggle switches (show state change)
- ✅ Accordion expand/collapse (show/hide content)
- ✅ Scroll position (instant instead of smooth)

## Files to Create

- `/frontend-web/src/hooks/useReducedMotion.js`

## Files to Update

- `/frontend-web/src/design-system/styles/global.css`
- `/frontend-web/src/components/Tasks.css`
- `/frontend-web/src/design-system/components/Modal/Modal.css`
- `/frontend-web/src/components/BidirectionalSwipeCard.jsx`
- `/frontend-web/src/components/SkeletonCard.css`
- `/frontend-web/src/App.jsx` (wrap with MotionConfig)

## Testing

### Desktop Testing
```js
// Chrome DevTools → Rendering → Emulate CSS media feature
// Set: prefers-reduced-motion: reduce
```

### Mobile Testing
```bash
# Android
Settings → Accessibility → Remove animations

# iOS
Settings → Accessibility → Motion → Reduce Motion
```

### Manual Testing Checklist
1. Enable reduced motion in system settings
2. Navigate through app
3. Verify no jarring animations
4. Verify essential feedback still works (focus, loading)
5. Test all interactive elements still respond correctly

## Implementation Priority

1. Add global reduced motion CSS (HIGH)
2. Add useReducedMotion hook (HIGH)
3. Update Modal animations (MEDIUM)
4. Update Framer Motion config (MEDIUM)
5. Update individual component animations (LOW)

## References

- [WCAG 2.1 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [prefers-reduced-motion MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Designing Safer Web Animation](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/)
