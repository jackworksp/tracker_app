# Quick Start Guide

Get up and running with the Notion Design System in minutes!

## Installation

### NPM

```bash
npm install @notion-design-system/core
```

### Yarn

```bash
yarn add @notion-design-system/core
```

## Setup

### 1. Import Styles

Import the design system styles in your app's entry point:

```jsx
// In your main App.jsx or index.jsx
import '@notion-design-system/core/dist/index.css';
```

### 2. Use Components

Import and use components in your application:

```jsx
import React from 'react';
import { Button, Card, H1, Paragraph } from '@notion-design-system/core';

function App() {
  return (
    <div className="app">
      <Card padding="lg" shadow="md">
        <H1>Welcome!</H1>
        <Paragraph>
          Start building with the Notion Design System
        </Paragraph>
        <Button variant="primary" fullWidth>
          Get Started
        </Button>
      </Card>
    </div>
  );
}

export default App;
```

## Basic Example

Here's a complete example of a simple form:

```jsx
import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  H2,
  Divider
} from '@notion-design-system/core';
import '@notion-design-system/core/dist/index.css';

function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: ''
  });

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <Card padding="lg" shadow="md" style={{ maxWidth: '400px' }}>
      <H2>Create Account</H2>
      <Divider spacing="md" />
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            required
          />
          
          <Select
            label="Country"
            value={formData.country}
            onChange={(value) => setFormData({ ...formData, country: value })}
            options={countries}
            fullWidth
            required
          />
          
          <Button type="submit" variant="primary" fullWidth>
            Sign Up
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default SignupForm;
```

## Layout Example

Creating a page layout with Sidebar:

```jsx
import React from 'react';
import {
  Sidebar,
  SidebarItem,
  SidebarGroup,
  H1,
  Card,
  Paragraph
} from '@notion-design-system/core';
import '@notion-design-system/core/dist/index.css';

function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        header={<div style={{ fontWeight: 'bold' }}>My App</div>}
        footer={<div style={{ fontSize: '12px', color: '#787774' }}>v1.0.0</div>}
      >
        <SidebarGroup title="Main">
          <SidebarItem 
            icon={<span>🏠</span>} 
            label="Home" 
            active 
          />
          <SidebarItem 
            icon={<span>📊</span>} 
            label="Analytics" 
          />
          <SidebarItem 
            icon={<span>⚙️</span>} 
            label="Settings" 
          />
        </SidebarGroup>
      </Sidebar>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <H1>Dashboard</H1>
        <div style={{ marginTop: '24px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <Card padding="lg" shadow="sm" hoverable>
            <h3>Total Users</h3>
            <Paragraph color="secondary">1,234</Paragraph>
          </Card>
          <Card padding="lg" shadow="sm" hoverable>
            <h3>Revenue</h3>
            <Paragraph color="secondary">$12,345</Paragraph>
          </Card>
          <Card padding="lg" shadow="sm" hoverable>
            <h3>Active Sessions</h3>
            <Paragraph color="secondary">456</Paragraph>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
```

## Customization

Override CSS variables to match your brand:

```css
/* In your global CSS file */
:root {
  /* Brand colors */
  --nds-brand-primary: #6366f1;
  --nds-brand-accent: #8b5cf6;
  
  /* Custom font */
  --nds-font-primary: 'Inter', -apple-system, sans-serif;
  
  /* Adjust spacing */
  --nds-spacing-4: 20px;
  
  /* Custom shadows */
  --nds-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.15);
}
```

## TypeScript Support

The package includes TypeScript definitions. Import types like this:

```tsx
import { Button } from '@notion-design-system/core';
import type { ButtonProps } from '@notion-design-system/core';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Next Steps

- 📖 Read the [Component API Documentation](./docs/COMPONENTS.md)
- 🎨 Explore [Design Tokens](./docs/DESIGN_TOKENS.md)
- ♿ Learn about [Accessibility](./docs/ACCESSIBILITY.md)
- 🎯 View the live [Style Guide](#) (start dev server with `npm run dev`)

## Development

To run the style guide locally:

```bash
# Clone the repo
git clone https://github.com/yourusername/notion-design-system
cd notion-design-system

# Install dependencies
npm install

# Start dev server
npm run dev
```

The style guide will open at `http://localhost:3000`

## Building for Production

```bash
# Build the library
npm run build

# Build outputs to dist/
# - dist/index.js (CommonJS)
# - dist/index.esm.js (ES Modules)
# - dist/index.css (Styles)
```

## Support

- 📧 Email: support@yourdesignsystem.com
- 💬 Discord: [Join our community](#)
- 🐛 Issues: [GitHub Issues](#)
- 📚 Docs: [Full Documentation](#)

## License

MIT © 2026
