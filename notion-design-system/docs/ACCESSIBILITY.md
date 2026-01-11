# Accessibility Guidelines

The Notion Design System is built with accessibility in mind. All components follow WCAG 2.1 AA standards.

## Core Principles

1. **Perceivable** - Information must be presentable to users in ways they can perceive
2. **Operable** - UI components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough to work with assistive technologies

## Keyboard Navigation

### Focus Management

All interactive components are keyboard accessible:

- **Tab** - Move focus forward
- **Shift + Tab** - Move focus backward
- **Enter/Space** - Activate buttons and links
- **Escape** - Close modals, dropdowns, and tooltips
- **Arrow Keys** - Navigate within components (menus, selects)

### Focus Indicators

All focusable elements have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--nds-interactive-focus);
  outline-offset: 2px;
}
```

## Screen Reader Support

### ARIA Labels

All components include appropriate ARIA attributes:

```jsx
<Button aria-label="Close modal">
  <CloseIcon />
</Button>

<Input
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
```

### Semantic HTML

Components use semantic HTML elements:

- `<button>` for interactive elements
- `<nav>` for navigation
- `<main>` for main content
- `<aside>` for sidebars
- Proper heading hierarchy (h1-h6)

## Color Contrast

All text and interactive elements meet WCAG AA contrast requirements:

### Text Contrast Ratios

- **Normal text**: Minimum 4.5:1
- **Large text** (18pt+): Minimum 3:1
- **UI Components**: Minimum 3:1

### Testing Colors

```jsx
// Primary text on primary background
// #37352f on #ffffff = 12.6:1 ✓

// Secondary text on primary background  
// #787774 on #ffffff = 4.7:1 ✓

// Link text on primary background
// #2383e2 on #ffffff = 4.6:1 ✓
```

## Component-Specific Guidelines

### Button

✓ Keyboard navigable with Tab  
✓ Activates with Enter or Space  
✓ Has visible focus indicator  
✓ Disabled state communicated to screen readers  
✓ Loading state indicated with aria-busy  

```jsx
<Button
  disabled={isDisabled}
  loading={isLoading}
  aria-busy={isLoading}
>
  Submit
</Button>
```

### Input

✓ Associated label with `htmlFor`  
✓ Error messages linked with `aria-describedby`  
✓ Invalid state indicated with `aria-invalid`  
✓ Required fields marked with `aria-required`  

```jsx
<Input
  id="email"
  label="Email"
  required
  error="Invalid email"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
```

### Modal

✓ Focus trapped within modal  
✓ Returns focus to trigger on close  
✓ Closes with Escape key  
✓ Uses `role="dialog"` and `aria-modal="true"`  
✓ Title linked with `aria-labelledby`  

```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmation"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  {content}
</Modal>
```

### Select

✓ Keyboard navigable with Arrow keys  
✓ Opens/closes with Enter/Escape  
✓ Uses `role="listbox"` and `role="option"`  
✓ Selected option indicated with `aria-selected`  

### Sidebar

✓ Uses semantic `<nav>` element  
✓ Collapse button has descriptive label  
✓ Active item indicated visually and to screen readers  
✓ All items keyboard accessible  

### Tooltip

✓ Uses `role="tooltip"`  
✓ Not keyboard focusable (decorative)  
✓ Appears on hover and focus  
✓ Doesn't hide critical information  

## Forms

### Form Structure

```jsx
<form onSubmit={handleSubmit}>
  <Input
    label="Full Name"
    id="name"
    name="name"
    required
    aria-required="true"
  />
  
  <Select
    label="Country"
    id="country"
    name="country"
    options={countries}
    aria-label="Select your country"
  />
  
  <Button type="submit">
    Submit Form
  </Button>
</form>
```

### Error Handling

```jsx
<Input
  label="Email"
  error={errors.email}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email}
  </span>
)}
```

## Images and Icons

### Decorative Images

```jsx
<img src="decoration.png" alt="" role="presentation" />
```

### Informative Images

```jsx
<img src="chart.png" alt="Sales increased by 25% in Q4" />
```

### Icon-Only Buttons

```jsx
<Button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</Button>
```

## Testing Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all focusable elements
- [ ] Proper heading hierarchy (no skipped levels)
- [ ] All images have alt text (or are marked as decorative)
- [ ] Color is not the only means of conveying information
- [ ] Sufficient color contrast (4.5:1 for text, 3:1 for UI)
- [ ] Forms have associated labels
- [ ] Error messages are descriptive and linked
- [ ] Modals trap focus and return focus on close
- [ ] Screen reader announces states (loading, error, success)

## Tools for Testing

### Automated Testing

- **axe DevTools** - Browser extension for accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Built into Chrome DevTools

### Manual Testing

- **Keyboard Navigation** - Navigate entire app using only keyboard
- **Screen Reader** - Test with NVDA (Windows) or VoiceOver (Mac)
- **Color Contrast Analyzer** - Verify contrast ratios

### Code Linting

```bash
# Install eslint-plugin-jsx-a11y
npm install eslint-plugin-jsx-a11y --save-dev
```

```json
{
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
