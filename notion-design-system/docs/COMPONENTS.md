# Component API Reference

Complete API documentation for all components in the Notion Design System.

## Table of Contents

- [Button](#button)
- [Input](#input)
- [Select](#select)
- [Card](#card)
- [Modal](#modal)
- [Tooltip](#tooltip)
- [Divider](#divider)
- [Sidebar](#sidebar)
- [Typography](#typography)

---

## Button

A flexible button component with multiple variants and states.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'outline' \| 'subtle' \| 'danger'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `disabled` | `boolean` | `false` | Disable button |
| `loading` | `boolean` | `false` | Show loading state |
| `leftIcon` | `ReactNode` | - | Icon on left side |
| `rightIcon` | `ReactNode` | - | Icon on right side |
| `onClick` | `(e: Event) => void` | - | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |

### Examples

```jsx
// Basic button
<Button onClick={handleClick}>Click me</Button>

// Primary button
<Button variant="primary">Primary Action</Button>

// Button with icon
<Button leftIcon={<PlusIcon />} variant="primary">
  Add Item
</Button>

// Loading button
<Button loading variant="primary">
  Saving...
</Button>

// Full width button
<Button fullWidth variant="primary">
  Continue
</Button>
```

---

## Input

A versatile input field with support for icons, validation states, and labels.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `helperText` | `string` | - | Helper text below input |
| `error` | `string` | - | Error message |
| `success` | `string` | - | Success message |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Input value |
| `onChange` | `(e: Event) => void` | - | Change handler |
| `type` | `string` | `'text'` | Input type (text, email, password, etc.) |
| `disabled` | `boolean` | `false` | Disable input |
| `required` | `boolean` | `false` | Required field |
| `fullWidth` | `boolean` | `false` | Full width input |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `leftIcon` | `ReactNode` | - | Icon on left |
| `rightIcon` | `ReactNode` | - | Icon on right |

### Examples

```jsx
// Basic input
<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
/>

// Input with validation
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  fullWidth
/>

// Input with icon
<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>

// Controlled input
const [email, setEmail] = useState('');
<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  label="Email Address"
/>
```

---

## Select

A custom select dropdown component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Select label |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `value` | `any` | - | Selected value |
| `onChange` | `(value: any) => void` | - | Change handler |
| `options` | `Array<{value: any, label: string}>` | `[]` | Select options |
| `disabled` | `boolean` | `false` | Disable select |
| `required` | `boolean` | `false` | Required field |
| `fullWidth` | `boolean` | `false` | Full width select |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |

### Examples

```jsx
const options = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
];

const [country, setCountry] = useState('');

<Select
  label="Country"
  value={country}
  onChange={setCountry}
  options={options}
  fullWidth
/>
```

---

## Card

A flexible container component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Card padding |
| `shadow` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Shadow depth |
| `border` | `boolean` | `true` | Show border |
| `hoverable` | `boolean` | `false` | Add hover effect |
| `interactive` | `boolean` | `false` | Make card clickable |
| `onClick` | `(e: Event) => void` | - | Click handler |

### Examples

```jsx
// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Card with custom styling
<Card padding="lg" shadow="md" hoverable>
  <h3>Hoverable Card</h3>
  <p>Hover to see effect</p>
</Card>

// Interactive card
<Card interactive onClick={handleClick}>
  <h3>Clickable Card</h3>
</Card>
```

---

## Modal

An accessible modal dialog component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **required** | Modal open state |
| `onClose` | `() => void` | **required** | Close handler |
| `title` | `string` | - | Modal title |
| `footer` | `ReactNode` | - | Footer content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closeOnOverlayClick` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show close button |

### Examples

```jsx
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>
    Open Modal
  </Button>
  
  <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Confirm Action"
    footer={
      <>
        <Button variant="subtle" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm
        </Button>
      </>
    }
  >
    <p>Are you sure you want to continue?</p>
  </Modal>
</>
```

---

## Tooltip

A lightweight tooltip component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | - | Tooltip content |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `delay` | `number` | `200` | Delay before showing (ms) |
| `disabled` | `boolean` | `false` | Disable tooltip |

### Examples

```jsx
<Tooltip content="This is helpful information">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip content="Delete this item" placement="right">
  <IconButton icon={<TrashIcon />} />
</Tooltip>
```

---

## Divider

A simple divider/separator component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider orientation |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Spacing around divider |
| `label` | `string` | - | Optional label |

### Examples

```jsx
// Basic divider
<Divider />

// Divider with label
<Divider label="OR" />

// Vertical divider
<div style={{ display: 'flex', height: '100px' }}>
  <div>Left content</div>
  <Divider orientation="vertical" />
  <div>Right content</div>
</div>
```

---

## Sidebar

A collapsible sidebar navigation component.

### Components

- `Sidebar` - Main sidebar container
- `SidebarItem` - Individual navigation item
- `SidebarGroup` - Group of items with optional title

### Sidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `header` | `ReactNode` | - | Header content |
| `footer` | `ReactNode` | - | Footer content |
| `collapsed` | `boolean` | `false` | Initial collapsed state |
| `onToggle` | `(collapsed: boolean) => void` | - | Toggle handler |
| `width` | `string` | `'240px'` | Sidebar width |
| `collapsedWidth` | `string` | `'60px'` | Collapsed width |

### SidebarItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | - | Item icon |
| `label` | `string` | **required** | Item label |
| `active` | `boolean` | `false` | Active state |
| `onClick` | `() => void` | - | Click handler |
| `badge` | `ReactNode` | - | Badge content |

### Examples

```jsx
<Sidebar
  header={<Logo />}
  footer={<UserProfile />}
>
  <SidebarGroup title="Main">
    <SidebarItem 
      icon={<HomeIcon />} 
      label="Dashboard" 
      active 
    />
    <SidebarItem 
      icon={<DocumentIcon />} 
      label="Documents" 
      badge="12"
    />
  </SidebarGroup>
  
  <SidebarGroup title="Settings">
    <SidebarItem 
      icon={<SettingsIcon />} 
      label="Preferences" 
    />
  </SidebarGroup>
</Sidebar>
```

---

## Typography

Typography components for consistent text styling.

### Components

- `H1`, `H2`, `H3`, `H4`, `H5`, `H6` - Heading components
- `Paragraph` - Paragraph component
- `Text` - Generic text component
- `Caption` - Small caption text
- `Label` - Label component

### Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'inverse' \| 'link'` | `'primary'` | Text color |
| `weight` | `'normal' \| 'medium' \| 'semibold' \| 'bold'` | - | Font weight |
| `align` | `'left' \| 'center' \| 'right'` | - | Text alignment |

### Text-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'span'` | HTML element |
| `size` | `'xs' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'base'` | Font size |
| `truncate` | `boolean` | `false` | Truncate with ellipsis |

### Examples

```jsx
<H1>Page Title</H1>
<H2 color="secondary">Subtitle</H2>
<H3>Section Heading</H3>

<Paragraph>
  This is body text with proper spacing and line height.
</Paragraph>

<Text size="sm" color="tertiary">
  Small secondary text
</Text>

<Text as="span" weight="bold">
  Bold inline text
</Text>

<Caption>Small caption text</Caption>
```

---

## Interaction States

All interactive components support these states:

- **Hover** - Visual feedback on mouse over
- **Active** - Visual feedback when pressed
- **Focus** - Keyboard focus indicator
- **Disabled** - Non-interactive state
- **Loading** - Processing state (where applicable)

## Animation & Transitions

Components use consistent timing functions:

- **Fast**: 150ms - Quick interactions (hover)
- **Base**: 200ms - Standard transitions (buttons, inputs)
- **Slow**: 300ms - Larger animations (modals, sidebars)

All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth, natural motion.

---

For more examples, see the [Style Guide](../examples/StyleGuide.jsx) or visit the live documentation.
