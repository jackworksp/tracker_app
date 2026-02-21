# Spacing Inconsistencies (LOW)

**Priority:** 🟢 LOW
**Status:** Open
**Category:** Visual Design, Polish

## Problem

Tasks container has excessive 100px bottom padding for FAB clearance, wasting vertical space on small screens.

## Impact

- Unnecessary scrolling on small devices
- Wastes screen real estate
- Less content visible at once
- Minor UX degradation

## Solution

Reduce bottom padding to 80px and use safe area insets for devices with gesture bars (iPhone X+, newer Android phones).

### Before

```css
.tasks-container {
  padding-bottom: 100px; /* Too much */
}
```

### After

```css
.tasks-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}
```

### Explanation

- `80px`: Base padding for FAB (56px FAB + 16px margin + 8px breathing room)
- `env(safe-area-inset-bottom)`: Additional space for iPhone home indicator or Android gesture bar
- Fallback to `0` on devices without safe areas

### Apply to All Scrollable Containers

```css
/* Tasks container */
.tasks-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

/* Timeline container */
.timeline-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

/* Attachments container */
.attachments-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

/* Notes container */
.notes-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}
```

### Mobile Viewport Configuration

Ensure viewport meta tag includes `viewport-fit=cover`:

```html
<!-- index.html -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

### Safe Area Insets for All Edges

```css
/* Apply safe area insets globally */
.app-container {
  padding-top: env(safe-area-inset-top, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Bottom nav respects safe area */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

## Additional Spacing Improvements

### 1. Consistent Card Spacing

```css
/* Use design system spacing tokens */
.task-card {
  margin-bottom: var(--nds-spacing-3); /* 12px */
  padding: var(--nds-spacing-4); /* 16px */
}

.session-card {
  margin-bottom: var(--nds-spacing-3);
  padding: var(--nds-spacing-4);
}
```

### 2. Modal Padding

```css
.nds-modal-content {
  padding: var(--nds-spacing-5) var(--nds-spacing-4);
  /* Top/bottom: 20px, Left/right: 16px */
}
```

### 3. Input Spacing

```css
.nds-input-group {
  margin-bottom: var(--nds-spacing-4); /* 16px between form fields */
}
```

## Files to Update

- `/frontend-web/src/components/Tasks.css`
- `/frontend-web/src/components/Timeline.css`
- `/frontend-web/src/components/AttachmentsTab.css`
- `/frontend-web/src/components/NotesPage.css`
- `/frontend-web/src/design-system/styles/global.css`
- `/frontend-web/index.html` (viewport meta tag)

## Testing

1. Test on iPhone X+ (notch devices)
2. Test on Android with gesture navigation
3. Verify FAB doesn't overlap content
4. Test on small screens (iPhone SE, 320px width)
5. Verify safe areas work in landscape orientation

## Visual Regression Testing

Before/After screenshots:
- Tasks tab with long list
- Timeline with many sessions
- Small screen (iPhone SE 1st gen)
- Notched device (iPhone 12)

## References

- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Viewport Fit](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
