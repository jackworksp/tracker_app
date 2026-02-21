# Haptic Feedback Missing (MEDIUM)

**Priority:** 🟡 MEDIUM
**Status:** Open
**Category:** User Experience, Mobile UX

## Problem

Task completion uses visual-only feedback (Ant Design toast message). There's no haptic (vibration) feedback for actions like:
- Task completion
- Task deletion
- Swipe gestures
- Button presses
- Form submission

## Impact

- Missing tactile confirmation reduces user confidence
- Hard to know if action succeeded without looking at screen
- Less satisfying user experience
- Not leveraging native mobile capabilities

## Solution

Add haptic feedback using Capacitor's Haptics API for key interactions.

### 1. Install Capacitor Haptics

```bash
npm install @capacitor/haptics
```

### 2. Create Haptics Utility

```jsx
// utils/haptics.js
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Check if haptics are supported
const isHapticsAvailable = Capacitor.isNativePlatform();

export const hapticFeedback = {
  // Light tap (button press, toggle)
  light: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  },

  // Medium impact (swipe action, card interaction)
  medium: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  },

  // Heavy impact (delete, important action)
  heavy: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.impact({ style: ImpactStyle.Heavy });
  },

  // Success feedback (task completed, form submitted)
  success: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notification({ type: NotificationType.Success });
  },

  // Warning feedback (delete confirmation, destructive action)
  warning: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notification({ type: NotificationType.Warning });
  },

  // Error feedback (form validation error, action failed)
  error: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.notification({ type: NotificationType.Error });
  },

  // Selection changed (tab switch, option selected)
  selection: async () => {
    if (!isHapticsAvailable) return;
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  },
};
```

### 3. Usage Examples

#### Task Completion

```jsx
// Tasks.jsx
import { hapticFeedback } from '../utils/haptics';

const handleCompleteTask = async (taskId) => {
  try {
    await api.completeTask(taskId);
    await hapticFeedback.success(); // Success vibration
    message.success('Task completed!');
  } catch (error) {
    await hapticFeedback.error(); // Error vibration
    message.error('Failed to complete task');
  }
};
```

#### Task Deletion

```jsx
const handleDeleteTask = async (taskId) => {
  await hapticFeedback.warning(); // Warning before delete

  // Show confirmation modal
  Modal.confirm({
    title: 'Delete task?',
    onOk: async () => {
      try {
        await api.deleteTask(taskId);
        await hapticFeedback.heavy(); // Heavy impact on delete
        message.success('Task deleted');
      } catch (error) {
        await hapticFeedback.error();
        message.error('Failed to delete task');
      }
    },
  });
};
```

#### Swipe Gestures

```jsx
// BidirectionalSwipeCard.jsx
import { hapticFeedback } from '../utils/haptics';

const handleSwipeComplete = async (direction) => {
  if (Math.abs(direction) > threshold) {
    await hapticFeedback.medium(); // Tactile feedback when threshold reached
  }
};

const handleSwipeEnd = async () => {
  await hapticFeedback.success(); // Confirm action completed
};
```

#### Button Press

```jsx
// Button component
import { hapticFeedback } from '../utils/haptics';

export function Button({ onClick, haptic = 'light', ...props }) {
  const handleClick = async (e) => {
    if (haptic) {
      await hapticFeedback[haptic]();
    }
    onClick?.(e);
  };

  return <button onClick={handleClick} {...props} />;
}

// Usage
<Button onClick={handleSubmit} haptic="medium">
  Submit
</Button>
```

#### Tab Navigation

```jsx
// BottomNav.jsx
const handleTabChange = async (tabKey) => {
  await hapticFeedback.selection(); // Selection feedback
  setActiveTab(tabKey);
};
```

#### Form Validation

```jsx
const handleSubmit = async () => {
  if (!isValid) {
    await hapticFeedback.error(); // Error vibration
    setErrors(validationErrors);
    return;
  }

  try {
    await api.submit(formData);
    await hapticFeedback.success(); // Success vibration
  } catch (error) {
    await hapticFeedback.error();
  }
};
```

### 4. User Preference (Optional)

Allow users to disable haptics in settings:

```jsx
// Settings.jsx
const [hapticsEnabled, setHapticsEnabled] = useState(
  localStorage.getItem('hapticsEnabled') !== 'false'
);

// Update haptics.js
export const hapticFeedback = {
  light: async () => {
    const enabled = localStorage.getItem('hapticsEnabled') !== 'false';
    if (!isHapticsAvailable || !enabled) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  },
  // ... same for other methods
};
```

## Haptic Feedback Map

| Action | Haptic Type | Reason |
|--------|-------------|--------|
| Task completed | Success | Positive reinforcement |
| Task deleted | Heavy | Destructive action |
| Swipe gesture | Medium | Interactive feedback |
| Button press | Light | Subtle confirmation |
| Tab switch | Selection | Navigation feedback |
| Form error | Error | Alert user to problem |
| Form submitted | Success | Confirm completion |
| Delete warning | Warning | Alert before destructive action |

## Files to Create

- `/frontend-web/src/utils/haptics.js`

## Files to Update

- `/frontend-web/src/components/Tasks.jsx`
- `/frontend-web/src/components/BidirectionalSwipeCard.jsx`
- `/frontend-web/src/components/BottomNav.jsx`
- `/frontend-web/src/design-system/components/Button/Button.jsx`
- `/frontend-web/src/components/AddTaskModal.jsx`
- `/frontend-web/src/components/AddSessionModal.jsx`

## Testing

1. Test on physical Android device (haptics don't work in emulator)
2. Verify each haptic type feels appropriate for the action
3. Test with haptics disabled in system settings
4. Ensure web version doesn't error (Capacitor check works)
5. Test battery impact (minimal with proper usage)

## Best Practices

- ✅ Use sparingly - not every tap needs haptics
- ✅ Match intensity to action importance
- ✅ Respect system haptics settings
- ✅ Gracefully degrade on web
- ❌ Don't use haptics for informational messages
- ❌ Don't vibrate on every scroll or animation

## References

- [Capacitor Haptics API](https://capacitorjs.com/docs/apis/haptics)
- [iOS Haptic Feedback Guidelines](https://developer.apple.com/design/human-interface-guidelines/haptics)
- [Material Design Haptics](https://material.io/design/platform-guidance/android-haptics.html)
