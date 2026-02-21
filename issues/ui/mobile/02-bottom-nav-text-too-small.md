# Bottom Nav Text Too Small (CRITICAL)

**Priority:** 🔴 CRITICAL
**Status:** Open
**Category:** Accessibility, Typography
**WCAG Level:** Fails WCAG AAA

## Problem

Bottom navigation labels use 9px font size, which is extremely small and hard to read.

**Current:**
```css
.nav-label {
  font-size: 9px;
}
```

## Impact

- Users over 40 or with vision impairment struggle to read labels
- Fails WCAG AAA readability standards
- May require zooming on every navigation action
- Reduces app usability for large user segment

## Solution

Increase to **11px minimum** with 600 font weight for better legibility:

```css
.nav-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}
```

Alternative: Use icons only with tooltips/labels on long press.

## Files to Update

- `/frontend-web/src/components/BottomNav.css`

## Testing

1. Test readability on physical device at arm's length
2. Get feedback from users 40+ years old
3. Test in bright sunlight conditions
4. Verify text meets WCAG AA minimum (4.5:1 contrast)

## References

- [WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [Optimal font sizes for mobile](https://learnui.design/blog/mobile-desktop-website-font-size-guidelines.html)
