# Touch Targets Too Small (CRITICAL)

**Priority:** 🔴 CRITICAL
**Status:** Open
**Category:** Accessibility, Usability
**WCAG Level:** Level A violation

## Problem

Multiple interactive elements are below the 44x44px minimum touch target size required by WCAG 2.5.5 (Target Size).

**Current Sizes:**
- Modal close button: 32x32px
- Bottom nav items: 60px wide but only ~36px tall
- Input fields (md): 40px height
- Card option buttons: Variable, often <44px

## Impact

- Users with motor impairments cannot reliably tap small targets
- Accidental taps on wrong elements
- Frustration, especially while moving or one-handed use
- Blocks accessibility certification

## Solution

Increase all interactive elements to **44x44px minimum**:

```css
/* Modal close button */
.nds-modal-close {
  width: 44px;
  height: 44px;
}

/* Bottom nav items */
.bottom-nav-item {
  min-height: 48px;
  padding: 12px 16px;
}

/* Input fields */
.nds-input-container--md {
  min-height: 48px;
}
```

## Files to Update

- `/frontend-web/src/design-system/components/Modal/Modal.css`
- `/frontend-web/src/design-system/components/Input/Input.css`
- `/frontend-web/src/components/BottomNav.css`

## Testing

1. Use browser DevTools to measure touch targets
2. Test on physical device with finger
3. Run accessibility audit with axe DevTools
4. Verify all interactive elements ≥44x44px

## References

- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-typography)
