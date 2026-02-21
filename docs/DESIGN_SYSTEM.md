# Vela Design System Documentation

**A custom Notion-inspired design system for the Vela learning management application**

Version: 1.0
Last Updated: February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Philosophy & Design Principles](#philosophy--design-principles)
3. [Getting Started](#getting-started)
4. [Design Tokens](#design-tokens)
5. [Component Library](#component-library)
6. [Layout & Grid System](#layout--grid-system)
7. [Accessibility](#accessibility)
8. [Migration from Ant Design](#migration-from-ant-design)
9. [Contributing](#contributing)
10. [Resources](#resources)

---

## Overview

The Vela Design System is a custom, lightweight UI component library built from scratch to replace Ant Design. It follows Notion's minimalist design philosophy with clean typography, subtle interactions, and a focus on content-first design.

### Key Features

- **Lightweight**: No heavy dependencies, built with vanilla CSS and React
- **Consistent**: Unified design language across web and mobile
- **Accessible**: WCAG 2.1 AA compliant with semantic HTML and ARIA attributes
- **Themeable**: CSS custom properties for easy customization
- **Modular**: Import only what you need
- **Dark Mode**: Built-in dark theme support

### Philosophy & Design Principles

#### 1. Content First
The interface should never compete with the content. Every design decision prioritizes readability, clarity, and reducing cognitive load.

#### 2. Minimalism
Less is more. We use subtle borders, generous whitespace, and understated colors to create a calm, focused environment.

#### 3. Consistency
Components share common patterns, spacing, and interactions. Once you learn one component, others feel familiar.

#### 4. Progressive Disclosure
Show only what's necessary. Advanced features and options are revealed contextually.

#### 5. Accessibility by Default
Every component is keyboard-navigable, screen-reader friendly, and follows WCAG guidelines.

---

## Getting Started

### Installation

The design system is already integrated into Vela. No separate installation needed.

### Basic Usage

Import components from the design system:

```jsx
import { Button, Card, Input, Modal, H1, H2, Paragraph } from './design-system';

function MyComponent() {
  return (
    <Card padding="md" shadow="sm">
      <H1>Welcome to Vela</H1>
      <Paragraph color="secondary">
        Start tracking your learning progress
      </Paragraph>
      <Button variant="primary" onClick={handleClick}>
        Get Started
      </Button>
    </Card>
  );
}
```

The design system styles are automatically loaded when you import from `./design-system`.

---

## Design Tokens

Design tokens are the visual design atoms of the system — the smallest, indivisible design decisions. They're implemented as CSS custom properties with the `--nds-` prefix (Notion Design System).

### Colors

#### Backgrounds
```css
--nds-bg-primary: #0A0E27         /* Main background (dark theme) */
--nds-bg-secondary: #0f1420       /* Secondary background */
--nds-bg-tertiary: #1a1f2e        /* Tertiary background */
--nds-bg-hover: rgba(255, 255, 255, 0.05)  /* Hover state */
```

#### Text Colors
```css
--nds-text-primary: #F8F9FA       /* Primary text (high contrast) */
--nds-text-secondary: #ADB5BD     /* Secondary text (medium contrast) */
--nds-text-tertiary: #868e96      /* Tertiary text (low contrast) */
--nds-text-disabled: #495057      /* Disabled state */
--nds-text-inverse: #0A0E27       /* Light text on dark bg */
--nds-text-link: #2383e2          /* Links */
--nds-text-link-hover: #1a6ec1    /* Link hover */
```

#### State Colors
```css
--nds-state-info: #2383e2         /* Informational */
--nds-state-success: #0f7b6c      /* Success */
--nds-state-warning: #f59e0b      /* Warning */
--nds-state-error: #eb5757        /* Error/danger */

/* Background variants */
--nds-state-info-bg: #e3f2fd
--nds-state-success-bg: #d1f4dd
--nds-state-warning-bg: #fff3cd
--nds-state-error-bg: #fde8e8
```

#### Interactive Colors
```css
--nds-interactive-default: transparent
--nds-interactive-hover: rgba(255, 255, 255, 0.08)
--nds-interactive-active: rgba(255, 255, 255, 0.12)
--nds-interactive-selected: rgba(6, 214, 160, 0.15)
--nds-interactive-selected-hover: rgba(6, 214, 160, 0.2)
--nds-interactive-focus: #06D6A0   /* Focus ring color */
```

#### Brand Colors
```css
--nds-brand-primary: #37352f
--nds-brand-primary-hover: #2f2e29
--nds-brand-primary-active: #1f1e1b
--nds-brand-secondary: #787774
--nds-brand-accent: #2383e2
```

#### Surfaces
```css
--nds-surface-default: #0f1420
--nds-surface-elevated: #1a1f2e
--nds-surface-overlay: rgba(15, 15, 15, 0.8)
--nds-surface-card: rgba(255, 255, 255, 0.05)
--nds-surface-card-hover: rgba(255, 255, 255, 0.08)
--nds-surface-border: rgba(255, 255, 255, 0.1)
--nds-surface-border-dark: rgba(255, 255, 255, 0.05)
```

### Typography

#### Font Families
```css
--nds-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                    'Helvetica Neue', Arial, sans-serif,
                    'Apple Color Emoji', 'Segoe UI Emoji'
--nds-font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono',
                 Menlo, Courier, monospace
```

#### Font Sizes
```css
--nds-font-size-xs: 0.75rem      /* 12px */
--nds-font-size-sm: 0.875rem     /* 14px */
--nds-font-size-base: 1rem       /* 16px */
--nds-font-size-md: 1rem         /* 16px */
--nds-font-size-lg: 1.125rem     /* 18px */
--nds-font-size-xl: 1.25rem      /* 20px */
--nds-font-size-2xl: 1.5rem      /* 24px */
--nds-font-size-3xl: 1.875rem    /* 30px */
--nds-font-size-4xl: 2.25rem     /* 36px */
--nds-font-size-5xl: 3rem        /* 48px */
```

#### Font Weights
```css
--nds-font-weight-normal: 400
--nds-font-weight-medium: 500
--nds-font-weight-semibold: 600
--nds-font-weight-bold: 700
```

#### Line Heights
```css
--nds-line-height-tight: 1.2     /* Headings */
--nds-line-height-normal: 1.5    /* Body text */
--nds-line-height-relaxed: 1.6   /* Long-form content */
--nds-line-height-loose: 2       /* Extra spacing */
```

### Spacing

Based on a **4px base grid system** for consistent spacing throughout the application.

```css
--nds-spacing-0: 0
--nds-spacing-0-5: 0.125rem      /* 2px */
--nds-spacing-1: 0.25rem         /* 4px */
--nds-spacing-2: 0.5rem          /* 8px */
--nds-spacing-3: 0.75rem         /* 12px */
--nds-spacing-4: 1rem            /* 16px */
--nds-spacing-5: 1.25rem         /* 20px */
--nds-spacing-6: 1.5rem          /* 24px */
--nds-spacing-8: 2rem            /* 32px */
--nds-spacing-10: 2.5rem         /* 40px */
--nds-spacing-12: 3rem           /* 48px */
--nds-spacing-16: 4rem           /* 64px */
--nds-spacing-20: 5rem           /* 80px */
--nds-spacing-24: 6rem           /* 96px */
```

### Border Radius

```css
--nds-radius-none: 0
--nds-radius-sm: 0.1875rem       /* 3px - subtle rounding */
--nds-radius-md: 0.375rem        /* 6px - default for inputs/buttons */
--nds-radius-lg: 0.5rem          /* 8px - cards */
--nds-radius-xl: 0.75rem         /* 12px - modals */
--nds-radius-full: 9999px        /* Fully rounded (pills, circles) */
```

### Shadows

Notion-inspired layered shadows for depth and elevation.

```css
--nds-shadow-none: none
--nds-shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--nds-shadow-sm: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
                 rgba(15, 15, 15, 0.1) 0px 3px 6px,
                 rgba(15, 15, 15, 0.2) 0px 9px 24px
--nds-shadow-md: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
                 rgba(15, 15, 15, 0.1) 0px 5px 10px,
                 rgba(15, 15, 15, 0.2) 0px 15px 40px
--nds-shadow-lg: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
                 rgba(15, 15, 15, 0.1) 0px 10px 20px,
                 rgba(15, 15, 15, 0.2) 0px 20px 60px
--nds-shadow-xl: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
                 rgba(15, 15, 15, 0.1) 0px 15px 30px,
                 rgba(15, 15, 15, 0.2) 0px 30px 80px
--nds-shadow-focus: 0 0 0 3px rgba(35, 131, 226, 0.3)  /* Focus ring */
```

### Transitions

```css
--nds-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)   /* Hover effects */
--nds-transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)   /* Default */
--nds-transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)   /* Expansions */
```

### Z-Index Scale

```css
--nds-z-base: 0
--nds-z-dropdown: 1000
--nds-z-sticky: 1100
--nds-z-overlay: 1200
--nds-z-modal: 1300
--nds-z-popover: 1400
--nds-z-tooltip: 1500
```

### Using Tokens in Your CSS

```css
.my-component {
  color: var(--nds-text-primary);
  background: var(--nds-bg-secondary);
  padding: var(--nds-spacing-4);
  border-radius: var(--nds-radius-md);
  box-shadow: var(--nds-shadow-sm);
  transition: all var(--nds-transition-base);
}

.my-component:hover {
  background: var(--nds-interactive-hover);
}
```

---

## Component Library

### Button

A flexible button component with multiple variants and states.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | — | Button content (required) |
| `variant` | `'default' \| 'primary' \| 'outline' \| 'subtle' \| 'danger'` | `'default'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `disabled` | `boolean` | `false` | Disable button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `leftIcon` | `node` | `null` | Icon on left side |
| `rightIcon` | `node` | `null` | Icon on right side |
| `onClick` | `function` | — | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `className` | `string` | `''` | Additional CSS classes |

#### Variants

**Default**: Subtle, neutral appearance
```jsx
<Button variant="default">Cancel</Button>
```

**Primary**: High emphasis, brand color
```jsx
<Button variant="primary">Save Changes</Button>
```

**Outline**: Medium emphasis with border
```jsx
<Button variant="outline">Learn More</Button>
```

**Subtle**: Low emphasis, minimal styling
```jsx
<Button variant="subtle">Skip</Button>
```

**Danger**: Destructive actions
```jsx
<Button variant="danger">Delete</Button>
```

#### Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  {/* Default */}
<Button size="lg">Large</Button>
```

#### With Icons

```jsx
import { Plus, Download } from 'lucide-react';

<Button variant="primary" leftIcon={<Plus size={16} />}>
  Add Task
</Button>

<Button variant="outline" rightIcon={<Download size={16} />}>
  Export
</Button>
```

#### Loading State

```jsx
<Button loading variant="primary">
  Saving...
</Button>
```

#### Full Width

```jsx
<Button fullWidth variant="primary">
  Continue
</Button>
```

---

### Card

A flexible container component for grouping related content.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | — | Card content (required) |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding |
| `shadow` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Shadow depth |
| `border` | `boolean` | `true` | Show border |
| `hoverable` | `boolean` | `false` | Add hover effect |
| `interactive` | `boolean` | `false` | Make card clickable (renders as button) |
| `onClick` | `function` | — | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

**Basic Card**
```jsx
<Card>
  <h3>Study Session</h3>
  <p>React Hooks - 2 hours</p>
</Card>
```

**Interactive Card**
```jsx
<Card
  interactive
  hoverable
  onClick={() => navigate('/task/123')}
>
  <h3>Task Title</h3>
  <p>Click to view details</p>
</Card>
```

**Custom Styling**
```jsx
<Card
  padding="lg"
  shadow="md"
  border={false}
>
  <h2>Featured Content</h2>
</Card>
```

---

### Input

A versatile input field with support for icons, validation states, and labels.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Input label |
| `helperText` | `string` | — | Helper text below input |
| `error` | `string` | — | Error message (shows error state) |
| `success` | `string` | — | Success message (shows success state) |
| `placeholder` | `string` | — | Placeholder text |
| `value` | `string` | — | Input value |
| `onChange` | `function` | — | Change handler |
| `onFocus` | `function` | — | Focus handler |
| `onBlur` | `function` | — | Blur handler |
| `type` | `string` | `'text'` | HTML input type |
| `disabled` | `boolean` | `false` | Disable input |
| `readOnly` | `boolean` | `false` | Read-only input |
| `required` | `boolean` | `false` | Required field (shows asterisk) |
| `fullWidth` | `boolean` | `false` | Full width input |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `leftIcon` | `node` | `null` | Icon on left side |
| `rightIcon` | `node` | `null` | Icon on right side |
| `id` | `string` | — | Input ID |
| `name` | `string` | — | Input name |

#### Examples

**Basic Input**
```jsx
<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**With Validation**
```jsx
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error={passwordError}
  required
/>
```

**With Icons**
```jsx
import { Search, Eye } from 'lucide-react';

<Input
  placeholder="Search tasks..."
  leftIcon={<Search size={16} />}
/>

<Input
  type="password"
  label="Password"
  rightIcon={<Eye size={16} />}
/>
```

**Helper Text**
```jsx
<Input
  label="Username"
  helperText="Must be 3-20 characters"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

---

### TextArea

Multi-line text input component.

#### Props

Same as Input, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `3` | Number of visible rows |

#### Examples

```jsx
<TextArea
  label="Notes"
  placeholder="Enter your notes..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
/>
```

---

### Select

Custom dropdown select component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Select label |
| `helperText` | `string` | — | Helper text |
| `error` | `string` | — | Error message |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `value` | `any` | — | Selected value |
| `onChange` | `function` | — | Change handler (receives value) |
| `options` | `array` | `[]` | Array of `{value, label}` objects |
| `disabled` | `boolean` | `false` | Disable select |
| `required` | `boolean` | `false` | Required field |
| `fullWidth` | `boolean` | `false` | Full width select |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |

#### Examples

```jsx
<Select
  label="Priority"
  value={priority}
  onChange={setPriority}
  options={[
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ]}
/>
```

---

### Modal

Accessible modal dialog with overlay and focus management.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Whether modal is open (required) |
| `onClose` | `function` | — | Close handler (required) |
| `title` | `string` | — | Modal title |
| `children` | `node` | — | Modal content (required) |
| `footer` | `node` | — | Footer content (usually buttons) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking overlay |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `className` | `string` | `''` | Additional CSS classes |
| `zIndex` | `number` | — | Custom z-index |

#### Examples

**Basic Modal**
```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add New Task"
>
  <p>Modal content goes here</p>
</Modal>
```

**With Footer**
```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  footer={
    <>
      <Button variant="subtle" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

**Different Sizes**
```jsx
<Modal size="sm" isOpen={isOpen} onClose={onClose}>
  Small modal
</Modal>

<Modal size="lg" isOpen={isOpen} onClose={onClose}>
  Large modal
</Modal>

<Modal size="full" isOpen={isOpen} onClose={onClose}>
  Full screen modal
</Modal>
```

---

### Tabs

Tab navigation component for switching between views.

#### Props

**Tabs Component**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeKey` | `string` | — | Currently active tab key |
| `onChange` | `function` | — | Tab change handler (receives key) |
| `children` | `node` | — | TabPane components |
| `size` | `'large' \| 'default'` | `'large'` | Tab size |
| `className` | `string` | `''` | Additional CSS classes |

**TabPane Component**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabKey` | `string` | — | Unique tab identifier |
| `tab` | `node` | — | Tab label/title |
| `children` | `node` | — | Tab content |

#### Examples

```jsx
<Tabs activeKey={activeTab} onChange={setActiveTab}>
  <TabPane tabKey="tasks" tab="Tasks">
    <TasksList />
  </TabPane>
  <TabPane tabKey="notes" tab="Notes">
    <NotesList />
  </TabPane>
  <TabPane tabKey="goals" tab="Goals">
    <GoalsList />
  </TabPane>
</Tabs>
```

---

### Typography

Semantic typography components with consistent styling.

#### Components

- **H1, H2, H3, H4, H5, H6**: Heading components
- **Paragraph**: Body text
- **Caption**: Small text for captions/labels
- **Label**: Form labels
- **Text**: Generic text component

#### Shared Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | — | Text content (required) |
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'inverse' \| 'link'` | `'primary'` | Text color |
| `weight` | `'normal' \| 'medium' \| 'semibold' \| 'bold'` | — | Font weight |
| `align` | `'left' \| 'center' \| 'right'` | — | Text alignment |
| `className` | `string` | `''` | Additional CSS classes |

#### Text Component Additional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'span'` | HTML element to render |
| `size` | `'xs' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'base'` | Text size |
| `truncate` | `boolean` | `false` | Truncate with ellipsis |

#### Examples

**Headings**
```jsx
<H1>Page Title</H1>
<H2 color="secondary">Section Header</H2>
<H3 weight="semibold">Subsection</H3>
```

**Body Text**
```jsx
<Paragraph color="secondary">
  This is a paragraph with secondary color for less emphasis.
</Paragraph>

<Caption>Small caption text</Caption>
```

**Generic Text**
```jsx
<Text size="lg" weight="bold" color="primary">
  Large bold text
</Text>

<Text as="div" truncate>
  This text will be truncated with ellipsis if too long
</Text>
```

---

### Tooltip

Lightweight tooltip that appears on hover.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | — | Element to attach tooltip to (required) |
| `content` | `node` | — | Tooltip content |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `delay` | `number` | `200` | Delay before showing (ms) |
| `disabled` | `boolean` | `false` | Disable tooltip |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

```jsx
<Tooltip content="This will delete the task">
  <Button variant="danger">Delete</Button>
</Tooltip>

<Tooltip content="Edit task" placement="bottom">
  <button>
    <Edit size={16} />
  </button>
</Tooltip>
```

---

### Divider

Separator component for content sections.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider direction |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Spacing around divider |
| `label` | `string` | — | Optional label text |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

```jsx
<Divider />

<Divider label="OR" />

<div style={{ display: 'flex', height: '100px' }}>
  <div>Left content</div>
  <Divider orientation="vertical" />
  <div>Right content</div>
</div>
```

---

### Sidebar

Collapsible navigation sidebar.

#### Components

- **Sidebar**: Main sidebar container
- **SidebarItem**: Individual navigation item
- **SidebarGroup**: Group of sidebar items with optional title

#### Sidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | — | Sidebar content |
| `header` | `node` | — | Header content (logo, etc.) |
| `footer` | `node` | — | Footer content (user menu, etc.) |
| `collapsed` | `boolean` | `false` | Initial collapsed state |
| `onToggle` | `function` | — | Toggle handler (receives collapsed state) |
| `width` | `string` | `'240px'` | Sidebar width when expanded |
| `collapsedWidth` | `string` | `'60px'` | Sidebar width when collapsed |
| `className` | `string` | `''` | Additional CSS classes |

#### SidebarItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `node` | — | Item icon |
| `label` | `string` | — | Item label (required) |
| `active` | `boolean` | `false` | Active/selected state |
| `onClick` | `function` | — | Click handler |
| `badge` | `node` | — | Badge content (notification count, etc.) |
| `className` | `string` | `''` | Additional CSS classes |

#### SidebarGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Group title |
| `children` | `node` | — | SidebarItem components |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

```jsx
import { Home, Book, Target, Settings } from 'lucide-react';

<Sidebar
  header={<Logo />}
  footer={<UserProfile />}
  onToggle={(collapsed) => console.log('Collapsed:', collapsed)}
>
  <SidebarItem
    icon={<Home size={20} />}
    label="Dashboard"
    active
  />
  <SidebarItem
    icon={<Book size={20} />}
    label="Study"
  />
  <SidebarItem
    icon={<Target size={20} />}
    label="Goals"
    badge="3"
  />

  <SidebarGroup title="Settings">
    <SidebarItem
      icon={<Settings size={20} />}
      label="Preferences"
    />
  </SidebarGroup>
</Sidebar>
```

---

## Layout & Grid System

### Base Grid

The design system uses a **4px base grid** for consistent spacing. All spacing values are multiples of 4px.

```css
/* 4px base grid */
--nds-spacing-1: 0.25rem;   /* 4px */
--nds-spacing-2: 0.5rem;    /* 8px */
--nds-spacing-3: 0.75rem;   /* 12px */
--nds-spacing-4: 1rem;      /* 16px */
/* etc. */
```

### Container Utilities

```css
.nds-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--nds-spacing-4);
  padding-right: var(--nds-spacing-4);
}

.nds-container-sm { max-width: 640px; }
.nds-container-md { max-width: 768px; }
.nds-container-lg { max-width: 1024px; }
.nds-container-xl { max-width: 1280px; }
.nds-container-2xl { max-width: 1536px; }
```

### Grid Utilities

```css
/* Grid with default gap */
.nds-grid {
  display: grid;
  gap: var(--nds-spacing-4);
}

/* Grid with different gaps */
.nds-grid-2 { gap: var(--nds-spacing-2); }
.nds-grid-3 { gap: var(--nds-spacing-3); }
.nds-grid-6 { gap: var(--nds-spacing-6); }
.nds-grid-8 { gap: var(--nds-spacing-8); }
```

### Spacing Utilities

```css
/* Padding utilities */
.nds-p-0 { padding: 0; }
.nds-p-1 { padding: var(--nds-spacing-1); }
.nds-p-2 { padding: var(--nds-spacing-2); }
/* ... up to nds-p-8 */

/* Margin utilities */
.nds-m-0 { margin: 0; }
.nds-m-1 { margin: var(--nds-spacing-1); }
/* ... up to nds-m-8 */
```

### Layout Patterns

**Two-column layout**
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '240px 1fr',
  gap: 'var(--nds-spacing-6)'
}}>
  <aside>Sidebar</aside>
  <main>Main content</main>
</div>
```

**Card grid**
```jsx
<div className="nds-grid" style={{
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
}}>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

---

## Accessibility

All components follow WCAG 2.1 AA guidelines and include:

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus states are clearly visible (via `--nds-shadow-focus`)
- Tab order follows logical structure
- Modal traps focus and restores on close

### Screen Readers

- Semantic HTML elements (`button`, `nav`, `aside`, etc.)
- ARIA attributes where needed (`aria-label`, `aria-expanded`, etc.)
- Screen reader-only text for icon buttons
- Proper form labels with `htmlFor` associations

### Color Contrast

- Text meets WCAG AA contrast requirements (4.5:1 for normal, 3:1 for large)
- Interactive states have sufficient contrast
- Error states don't rely solely on color

### Focus Management

- `:focus-visible` for keyboard-only focus styles
- Focus trapping in modals
- Focus restoration after modal close
- Skip links for keyboard navigation (coming soon)

### Utility Classes

```css
/* Screen reader only (visually hidden but accessible) */
.nds-sr-only
.nds-visually-hidden

/* Text truncation with proper ARIA */
.nds-truncate
```

### Best Practices

1. **Always provide labels**: Even if visually hidden, ensure all inputs have labels
2. **Use semantic HTML**: Prefer `<button>` over `<div onClick>`
3. **Test with keyboard**: Navigate your entire UI using only keyboard
4. **Test with screen reader**: Use NVDA (Windows) or VoiceOver (Mac)
5. **Don't disable outlines**: Focus indicators are essential for accessibility

---

## Migration from Ant Design

### Why Build a Custom Design System?

1. **Bundle Size**: Ant Design is large (~1.2MB minified). Our custom system is <100KB.
2. **Customization**: Theming Ant Design is complex. CSS variables are simple.
3. **Design Control**: Full control over visual design to match Notion's aesthetic.
4. **Learning**: Building components deepens understanding of React and accessibility.
5. **Performance**: No unused components or styles shipped to users.

### Key Differences

| Aspect | Ant Design | Vela Design System |
|--------|-----------|-------------------|
| Bundle size | ~1.2MB | <100KB |
| Theming | Less variables | CSS custom properties |
| Components | 70+ components | 15 essential components |
| Design | Enterprise UI | Notion-inspired minimal |
| Dependencies | Many | Zero external UI deps |
| Mobile | Responsive | Mobile-first + Capacitor |

### Migration Guide

#### Button Migration

**Before (Ant Design)**
```jsx
import { Button } from 'antd';

<Button type="primary" size="large" loading={isLoading}>
  Submit
</Button>
```

**After (Vela DS)**
```jsx
import { Button } from './design-system';

<Button variant="primary" size="lg" loading={isLoading}>
  Submit
</Button>
```

**Mapping:**
- `type="primary"` → `variant="primary"`
- `type="default"` → `variant="default"`
- `type="dashed"` → `variant="outline"`
- `type="text"` → `variant="subtle"`
- `danger` → `variant="danger"`

#### Input Migration

**Before**
```jsx
import { Input } from 'antd';

<Input
  placeholder="Email"
  prefix={<MailOutlined />}
/>
```

**After**
```jsx
import { Input } from './design-system';
import { Mail } from 'lucide-react';

<Input
  placeholder="Email"
  leftIcon={<Mail size={16} />}
/>
```

**Mapping:**
- `prefix` → `leftIcon`
- `suffix` → `rightIcon`
- `addonBefore/After` → Custom wrapper

#### Modal Migration

**Before**
```jsx
import { Modal } from 'antd';

<Modal
  visible={visible}
  onCancel={handleClose}
  title="My Modal"
  footer={[...buttons]}
>
  Content
</Modal>
```

**After**
```jsx
import { Modal } from './design-system';

<Modal
  isOpen={visible}
  onClose={handleClose}
  title="My Modal"
  footer={<>...buttons</>}
>
  Content
</Modal>
```

**Mapping:**
- `visible` → `isOpen`
- `onCancel` → `onClose`
- Footer is now a ReactNode instead of array

#### Tabs Migration

**Before**
```jsx
import { Tabs } from 'antd';
const { TabPane } = Tabs;

<Tabs activeKey={key} onChange={setKey}>
  <TabPane tab="Tab 1" key="1">Content</TabPane>
</Tabs>
```

**After**
```jsx
import { Tabs, TabPane } from './design-system';

<Tabs activeKey={key} onChange={setKey}>
  <TabPane tab="Tab 1" tabKey="1">Content</TabPane>
</Tabs>
```

**Mapping:**
- `key` → `tabKey` (on TabPane)

#### Card Migration

**Before**
```jsx
import { Card } from 'antd';

<Card title="Title" hoverable>
  Content
</Card>
```

**After**
```jsx
import { Card, H3 } from './design-system';

<Card hoverable>
  <H3>Title</H3>
  <p>Content</p>
</Card>
```

**Note:** Card no longer has built-in title prop. Use Typography components instead.

---

## Contributing

### Adding New Components

1. **Create component directory**: `frontend-web/src/design-system/components/MyComponent/`
2. **Add files**:
   ```
   MyComponent/
   ├── MyComponent.jsx    # Component logic
   ├── MyComponent.css    # Component styles
   └── index.js           # Export
   ```

3. **Component template**:
   ```jsx
   import React from 'react';
   import PropTypes from 'prop-types';
   import './MyComponent.css';

   /**
    * MyComponent - Description
    *
    * @component
    * @example
    * ```jsx
    * <MyComponent prop="value">Content</MyComponent>
    * ```
    */
   const MyComponent = ({
     children,
     variant = 'default',
     className = '',
     ...props
   }) => {
     const baseClass = 'nds-mycomponent';
     const classNames = [
       baseClass,
       `${baseClass}--${variant}`,
       className
     ].filter(Boolean).join(' ');

     return (
       <div className={classNames} {...props}>
         {children}
       </div>
     );
   };

   MyComponent.propTypes = {
     children: PropTypes.node.isRequired,
     variant: PropTypes.oneOf(['default', 'alternate']),
     className: PropTypes.string,
   };

   export default MyComponent;
   ```

4. **CSS template**:
   ```css
   /* MyComponent styles using design tokens */
   .nds-mycomponent {
     padding: var(--nds-spacing-4);
     background: var(--nds-bg-secondary);
     border-radius: var(--nds-radius-md);
     transition: all var(--nds-transition-base);
   }

   .nds-mycomponent--alternate {
     background: var(--nds-bg-tertiary);
   }
   ```

5. **Export in index.js**: Add to `frontend-web/src/design-system/index.js`
   ```js
   export { default as MyComponent } from './components/MyComponent/MyComponent';
   ```

6. **Update documentation**: Add component to this file

### Updating Design Tokens

1. **Edit tokens**: `frontend-web/src/design-system/tokens/tokens.json`
2. **Regenerate CSS**: `frontend-web/src/design-system/styles/variables.css`
3. **Test throughout app**: Ensure no breaking changes
4. **Document changes**: Update this file

### Code Style Guidelines

1. **Use design tokens**: Never hardcode colors, spacing, etc.
   ```css
   /* Good */
   padding: var(--nds-spacing-4);

   /* Bad */
   padding: 16px;
   ```

2. **Follow naming convention**: `nds-{component}__{element}--{modifier}`
   ```css
   .nds-button { }                    /* Block */
   .nds-button__icon { }              /* Element */
   .nds-button--primary { }           /* Modifier */
   .nds-button__icon--left { }        /* Element + Modifier */
   ```

3. **Use semantic HTML**: Choose the right element for the job
   ```jsx
   /* Good */
   <button type="button" onClick={...}>Click</button>

   /* Bad */
   <div onClick={...}>Click</div>
   ```

4. **Include PropTypes**: Document all props
5. **Add accessibility**: ARIA, keyboard support, focus management
6. **Write examples**: JSDoc with usage examples
7. **Test thoroughly**: Check all variants, states, and sizes

### Testing Checklist

Before submitting a new component:

- [ ] Works in all supported browsers (Chrome, Firefox, Safari, Edge)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Keyboard accessible (tab, enter, escape)
- [ ] Screen reader friendly (test with NVDA/VoiceOver)
- [ ] All variants/sizes render correctly
- [ ] Handles edge cases (empty state, very long text, etc.)
- [ ] Follows design token system
- [ ] PropTypes defined and validated
- [ ] Examples in documentation
- [ ] No console errors or warnings

---

## Resources

### Internal Files

- **Tokens**: `frontend-web/src/design-system/tokens/tokens.json`
- **Variables**: `frontend-web/src/design-system/styles/variables.css`
- **Global Styles**: `frontend-web/src/design-system/styles/global.css`
- **Components**: `frontend-web/src/design-system/components/*/`

### External Inspiration

- **Notion Design**: https://notion.so (design reference)
- **Radix UI**: https://radix-ui.com (accessibility patterns)
- **Tailwind**: https://tailwindcss.com (design tokens structure)
- **Material Design**: https://m3.material.io (component behavior)

### Accessibility Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/resources/
- **A11y Project**: https://www.a11yproject.com/

### Design Tools

- **Lucide Icons**: https://lucide.dev (icon library used in Vela)
- **React Icons**: https://react-icons.github.io/react-icons/
- **Framer Motion**: https://www.framer.com/motion/ (animations)

### Development

- **React Docs**: https://react.dev
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **PropTypes**: https://www.npmjs.com/package/prop-types

---

## Support

For questions, issues, or contributions to the Vela Design System:

1. **Check documentation**: This file covers most use cases
2. **Review examples**: Look at existing components in `frontend-web/src/components/`
3. **Ask the team**: Design system discussions in team channel
4. **Create issue**: For bugs or feature requests

---

**Version**: 1.0
**Last Updated**: February 2026
**Maintained By**: Vela Development Team

---

## Appendix: Component Quick Reference

| Component | Import | Use Case |
|-----------|--------|----------|
| `Button` | `import { Button } from './design-system'` | Actions, forms, navigation |
| `Card` | `import { Card } from './design-system'` | Content containers |
| `Input` | `import { Input } from './design-system'` | Text input fields |
| `TextArea` | `import { TextArea } from './design-system'` | Multi-line text |
| `Select` | `import { Select } from './design-system'` | Dropdown selections |
| `Modal` | `import { Modal } from './design-system'` | Dialogs, overlays |
| `Tabs` | `import { Tabs, TabPane } from './design-system'` | Tab navigation |
| `H1-H6` | `import { H1, H2, H3 } from './design-system'` | Headings |
| `Paragraph` | `import { Paragraph } from './design-system'` | Body text |
| `Text` | `import { Text } from './design-system'` | Generic text |
| `Tooltip` | `import { Tooltip } from './design-system'` | Hover hints |
| `Divider` | `import { Divider } from './design-system'` | Section separators |
| `Sidebar` | `import { Sidebar, SidebarItem } from './design-system'` | Navigation |

---

Happy coding with the Vela Design System!
