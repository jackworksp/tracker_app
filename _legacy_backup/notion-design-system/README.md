# Notion Design System

A complete, production-ready design system inspired by Notion's minimalist UI principles.

## Features

✨ **Complete Component Library** - Button, Input, Select, Card, Modal, Tooltip, Sidebar, Typography, and more  
🎨 **Design Tokens** - Comprehensive system of colors, typography, spacing, and more  
♿ **Accessible** - WCAG 2.1 AA compliant with full keyboard navigation  
📱 **Responsive** - Mobile-first design with responsive components  
🎭 **Themeable** - CSS variables for easy customization  
📦 **Tree-shakeable** - Optimized bundle size with ES modules  
⚡ **Performant** - Lightweight and optimized for production  

## Installation

```bash
npm install @notion-design-system/core
```

## Quick Start

```jsx
import React from 'react';
import { Button, Input, Card } from '@notion-design-system/core';
import '@notion-design-system/core/dist/index.css';

function App() {
  return (
    <Card padding="lg" shadow="md">
      <h2>Welcome to Notion Design System</h2>
      <Input 
        label="Email" 
        placeholder="Enter your email" 
        fullWidth 
      />
      <Button variant="primary" fullWidth>
        Get Started
      </Button>
    </Card>
  );
}
```

## Design Tokens

The design system includes comprehensive design tokens:

### Colors

- **Backgrounds**: Primary, secondary, tertiary
- **Surfaces**: Cards, overlays, borders
- **Text**: Primary, secondary, tertiary, inverse, link
- **States**: Info, success, warning, error
- **Interactive**: Hover, active, selected, focus

### Typography

- **Font Families**: System fonts with fallbacks
- **Font Sizes**: xs (12px) to 5xl (48px)
- **Font Weights**: Normal, medium, semibold, bold
- **Line Heights**: Tight, normal, relaxed, loose

### Spacing

Based on a 4px grid system:
- 0.5 (2px), 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), etc.

### Shadows

Five depth levels (xs, sm, md, lg, xl) for elevation

## Components

### Button

```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Props:**
- `variant`: 'default' | 'primary' | 'outline' | 'subtle' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `disabled`: boolean
- `loading`: boolean
- `leftIcon`, `rightIcon`: React nodes

### Input

```jsx
<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
  error="Invalid email"
  leftIcon={<EmailIcon />}
/>
```

**Props:**
- `label`: string
- `type`: string
- `error`, `success`, `helperText`: string
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `leftIcon`, `rightIcon`: React nodes

### Card

```jsx
<Card padding="md" shadow="sm" hoverable>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `shadow`: 'none' | 'xs' | 'sm' | 'md' | 'lg'
- `border`: boolean
- `hoverable`: boolean
- `interactive`: boolean

### Modal

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  footer={<Button variant="primary">Save</Button>}
>
  <p>Modal content</p>
</Modal>
```

**Props:**
- `isOpen`: boolean (required)
- `onClose`: function (required)
- `title`: string
- `footer`: React node
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick`, `closeOnEscape`: boolean

### Select

```jsx
<Select
  label="Choose option"
  value={value}
  onChange={setValue}
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
/>
```

### Typography

```jsx
import { H1, H2, Paragraph, Text } from '@notion-design-system/core';

<H1>Page Title</H1>
<H2 color="secondary">Subtitle</H2>
<Paragraph>Body text</Paragraph>
<Text size="sm" color="tertiary">Small text</Text>
```

### Tooltip

```jsx
<Tooltip content="This is a tooltip" placement="top">
  <button>Hover me</button>
</Tooltip>
```

### Sidebar

```jsx
import { Sidebar, SidebarItem, SidebarGroup } from '@notion-design-system/core';

<Sidebar
  header={<Logo />}
  footer={<UserMenu />}
>
  <SidebarGroup title="Navigation">
    <SidebarItem icon={<HomeIcon />} label="Dashboard" active />
    <SidebarItem icon={<SettingsIcon />} label="Settings" />
  </SidebarGroup>
</Sidebar>
```

### Divider

```jsx
<Divider />
<Divider orientation="vertical" />
<Divider label="OR" />
```

## Customization

Override CSS variables to customize the design system:

```css
:root {
  --nds-brand-primary: #your-color;
  --nds-font-primary: 'Your Font', sans-serif;
  --nds-radius-md: 8px;
}
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA attributes
- ✅ Color contrast

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT © 2026

## Support

- Documentation: [Link to docs]
- Issues: [GitHub Issues]
- Discord: [Community link]
