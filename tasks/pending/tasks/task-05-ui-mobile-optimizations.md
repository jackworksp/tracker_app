# Task 05: Mobile UX Optimizations

**Issue**: #2 - UI Alterations
**ClickUp**: https://app.clickup.com/t/86d1vpb9y
**Priority**: 💻 Medium
**Estimated Time**: 1 day
**Sprint**: Sprint 4 (Week 4)

---

## Objective
Improve mobile user experience with better swipe gestures, touch targets, and mobile-specific interactions.

## Features to Implement

### 1. Improved Swipe Sensitivity
Adjust BidirectionalSwipeCard thresholds for better mobile feel

### 2. Larger Touch Targets
Ensure all interactive elements meet minimum 44px touch target size (iOS HIG)

### 3. Pull-to-Refresh (Optional)
Add to task lists for better mobile UX

## Implementation Steps

### 1. Optimize Swipe Card Thresholds
**File**: `frontend-web/src/components/BidirectionalSwipeCard.jsx`

Adjust swipe detection parameters:

```javascript
const SWIPE_THRESHOLD = 80; // Reduced from 100 for easier swipes
const VELOCITY_THRESHOLD = 0.3; // Lower threshold for more responsive detection
const TOUCH_SLOP = 10; // Ignore tiny movements

// In handleTouchEnd:
const swipeDistance = touchEnd - touchStart;
const swipeVelocity = Math.abs(swipeDistance) / swipeTime;

if (Math.abs(swipeDistance) > SWIPE_THRESHOLD || swipeVelocity > VELOCITY_THRESHOLD) {
    // Trigger swipe action
}
```

### 2. Ensure Minimum Touch Targets
**File**: `frontend-web/src/components/Tasks.css`

Update interactive element sizes:

```css
/* Checkboxes */
.task-checkbox,
.subtask-checkbox {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

/* Buttons on mobile */
@media (max-width: 768px) {
    .btn-icon-only {
        min-width: 44px;
        min-height: 44px;
        padding: 12px;
    }

    .task-actions button {
        padding: 10px 16px;
        font-size: 1rem;
    }

    /* Status dropdown */
    .status-select {
        min-height: 44px;
        font-size: 1rem;
    }

    /* Priority buttons */
    .priority-selector button {
        min-width: 44px;
        min-height: 44px;
    }
}
```

### 3. Improve Mobile Spacing
**File**: `frontend-web/src/components/Tasks.css`

Add mobile-specific spacing:

```css
@media (max-width: 768px) {
    .task-card {
        padding: 16px; /* Increased from 12px */
        margin-bottom: 16px; /* More breathing room */
    }

    .task-modal-content {
        padding: 20px; /* More comfortable padding */
    }

    .subtask-item {
        padding: 12px 0; /* Easier to tap */
        min-height: 44px;
    }

    /* Increased spacing between interactive elements */
    .task-actions {
        gap: 12px;
    }
}
```

### 4. Add Pull-to-Refresh (Optional)
**File**: `frontend-web/src/components/Tasks.jsx`

Implement pull-to-refresh:

```javascript
import { useState, useEffect } from 'react';

const Tasks = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullStartY, setPullStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setPullStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (pullStartY > 0) {
            const currentY = e.touches[0].clientY;
            const distance = currentY - pullStartY;

            if (distance > 0 && distance < 150) {
                setPullDistance(distance);
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 100) {
            setIsRefreshing(true);
            await loadTasks(); // Refresh data
            setIsRefreshing(false);
        }

        setPullStartY(0);
        setPullDistance(0);
    };

    return (
        <div
            className="tasks-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {pullDistance > 0 && (
                <div className="pull-refresh-indicator" style={{
                    height: `${pullDistance}px`,
                    opacity: pullDistance / 100
                }}>
                    {isRefreshing ? '↻ Refreshing...' : '↓ Pull to refresh'}
                </div>
            )}

            {/* Rest of component */}
        </div>
    );
};
```

### 5. Optimize Modal Animations for Mobile
**File**: `frontend-web/src/components/TaskDetailModal.jsx`

Reduce animation complexity on mobile:

```javascript
const isMobile = window.innerWidth <= 768;

const modalVariants = {
    hidden: {
        opacity: 0,
        y: isMobile ? '100%' : 20,
        scale: isMobile ? 1 : 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: isMobile ? 'tween' : 'spring',
            duration: isMobile ? 0.25 : 0.3
        }
    }
};
```

### 6. Add Haptic Feedback (Capacitor)
**File**: `frontend-web/src/components/Tasks.jsx`

```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const triggerHaptic = async (style = ImpactStyle.Light) => {
    if (window.Capacitor) {
        try {
            await Haptics.impact({ style });
        } catch (error) {
            // Haptics not available on this device
        }
    }
};

// Use on important actions:
const handleTaskComplete = async (taskId) => {
    await triggerHaptic(ImpactStyle.Medium);
    // ... complete task logic
};

const handleSubtaskToggle = async (subtaskId) => {
    await triggerHaptic(ImpactStyle.Light);
    // ... toggle subtask logic
};
```

## Testing Checklist

- [ ] All buttons/checkboxes meet 44px minimum touch target
- [ ] Swipe gestures feel responsive (not too sensitive/insensitive)
- [ ] No accidental swipes while scrolling
- [ ] Pull-to-refresh works when at top of list
- [ ] Modal animations perform smoothly on low-end devices
- [ ] Haptic feedback triggers on appropriate actions
- [ ] Spacing comfortable on smallest target device (iPhone SE)
- [ ] No horizontal scrolling on mobile
- [ ] Keyboard doesn't obscure important UI elements

## Device Testing

Test on:
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)
- [ ] Low-end device (performance check)

## Success Criteria

✅ All interactive elements meet accessibility touch target size
✅ Swipe gestures feel natural and responsive
✅ No performance issues on mobile devices
✅ Haptic feedback enhances interactions
✅ Pull-to-refresh provides satisfying manual refresh option
✅ Mobile users can complete tasks efficiently

## Files Modified

- `frontend-web/src/components/BidirectionalSwipeCard.jsx`
- `frontend-web/src/components/Tasks.jsx`
- `frontend-web/src/components/Tasks.css`
- `frontend-web/src/components/TaskDetailModal.jsx`

## Related Tasks

← [Task 04: Subtask Management Enhancements](task-04-ui-subtask-enhancements.md)
→ Sprint 4 complete
