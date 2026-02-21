# Swipe Gesture Affordance Missing (MEDIUM)

**Priority:** 🟡 MEDIUM
**Status:** Open
**Category:** Discoverability, User Experience

## Problem

Task cards don't visually indicate they're swipeable. Users won't discover swipe-to-delete/complete functionality without trial and error.

## Impact

- Hidden functionality - users may never discover swipe gestures
- Frustration trying to tap non-existent buttons
- Underutilized feature that improves efficiency
- Requires onboarding tutorial to compensate

## Solution

Add subtle visual hints that cards are swipeable.

### Option 1: Edge Gradient Hint

```jsx
// TaskCard.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

function TaskCard({ task, index }) {
  const [hasSeenSwipeHint, setHasSeenSwipeHint] = useState(
    localStorage.getItem('hasSeenSwipeHint') === 'true'
  );

  const showHint = index === 0 && !hasSeenSwipeHint;

  return (
    <div className="task-card-wrapper">
      {showHint && (
        <div className="swipe-hint">
          <div className="swipe-hint-left">
            <ChevronLeft size={20} />
            <span>Complete</span>
          </div>
          <div className="swipe-hint-right">
            <span>Delete</span>
            <ChevronRight size={20} />
          </div>
        </div>
      )}
      <BidirectionalSwipeCard
        onSwipeLeft={() => handleComplete(task.id)}
        onSwipeRight={() => handleDelete(task.id)}
        onSwipeStart={() => {
          if (!hasSeenSwipeHint) {
            localStorage.setItem('hasSeenSwipeHint', 'true');
            setHasSeenSwipeHint(true);
          }
        }}
      >
        {/* Task card content */}
      </BidirectionalSwipeCard>
    </div>
  );
}
```

```css
/* TaskCard.css */
.swipe-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  opacity: 0.6;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.swipe-hint-left,
.swipe-hint-right {
  display: flex;
  align-items: center;
  gap: var(--nds-spacing-2);
  padding: var(--nds-spacing-3);
  background: linear-gradient(
    to right,
    rgba(34, 139, 34, 0.1),
    transparent
  );
  color: var(--nds-text-success);
  font-size: 12px;
  font-weight: 600;
}

.swipe-hint-right {
  background: linear-gradient(
    to left,
    rgba(220, 38, 38, 0.1),
    transparent
  );
  color: var(--nds-text-danger);
}
```

### Option 2: Subtle Edge Icons

```jsx
// BidirectionalSwipeCard.jsx
function BidirectionalSwipeCard({ children, onSwipeLeft, onSwipeRight }) {
  return (
    <div className="swipe-card-container">
      <div className="swipe-indicator swipe-indicator-left">
        <Check size={20} />
      </div>
      <div className="swipe-indicator swipe-indicator-right">
        <Trash2 size={20} />
      </div>
      <motion.div className="swipe-card">
        {children}
      </motion.div>
    </div>
  );
}
```

```css
.swipe-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.2;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.swipe-indicator-left {
  left: 12px;
  color: var(--nds-text-success);
}

.swipe-indicator-right {
  right: 12px;
  color: var(--nds-text-danger);
}

.swipe-card:hover ~ .swipe-indicator {
  opacity: 0.5;
}
```

### Option 3: First-Time Animated Demo

```jsx
// SwipeDemo.jsx
import { motion } from 'framer-motion';

export function SwipeDemo({ onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) {
        setStep(step + 1);
      } else {
        onComplete();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="swipe-demo-overlay">
      <motion.div
        className="demo-card"
        animate={{
          x: step === 1 ? -100 : step === 2 ? 100 : 0
        }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <p>Try swiping cards</p>
      </motion.div>
      <div className="demo-labels">
        <span className="demo-label-left">← Complete</span>
        <span className="demo-label-right">Delete →</span>
      </div>
    </div>
  );
}
```

### Option 4: Persistent Visual Cue (Recommended)

```css
/* Add subtle gradient edges to all swipeable cards */
.task-card {
  position: relative;
}

.task-card::before,
.task-card::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  pointer-events: none;
  opacity: 0.3;
}

.task-card::before {
  left: 0;
  background: linear-gradient(
    to right,
    var(--nds-bg-success-subtle),
    transparent
  );
}

.task-card::after {
  right: 0;
  background: linear-gradient(
    to left,
    var(--nds-bg-danger-subtle),
    transparent
  );
}
```

## Recommendation

**Implement multi-layered approach**:

1. **Onboarding tooltip** (from issue #3) - teaches users explicitly
2. **Edge gradients** (Option 4) - persistent subtle hint
3. **First card animation** (Option 1) - draws attention to new users

This provides discovery through:
- Education (onboarding)
- Visual affordance (gradients)
- Contextual hint (first card only)

## Files to Create

- `/frontend-web/src/components/SwipeDemo.jsx` (optional)

## Files to Update

- `/frontend-web/src/components/TaskCard.jsx`
- `/frontend-web/src/components/TaskCard.css`
- `/frontend-web/src/components/BidirectionalSwipeCard.css`

## Testing

1. Clear localStorage and test as new user
2. Verify swipe hint appears on first card
3. Test that hint disappears after first swipe
4. Verify edge gradients are visible but not distracting
5. Test with different card backgrounds (light/dark mode)

## A/B Testing Ideas

- Track how many users discover swipe without onboarding
- Measure time to first swipe action
- Compare different hint designs for effectiveness

## References

- [Gestural Interfaces](https://www.nngroup.com/articles/gesture-controls/)
- [Teaching Gestures in Mobile Apps](https://www.smashingmagazine.com/2013/05/gesture-driven-interface/)
