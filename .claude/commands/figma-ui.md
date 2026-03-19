# /figma-ui — Figma → UI Component Generator

Generate a preview-ready React component from a Figma design and register it in the figmafiles preview app.

## Usage

```
/figma-ui <figma-url> [component-name]
```

**Examples:**
```
/figma-ui https://www.figma.com/design/abc123/Vela?node-id=1:23
/figma-ui https://www.figma.com/design/abc123/Vela?node-id=1:23 TabsComponent
```

If no component name is given, infer it from the Figma node name.

---

## Steps to execute

### 1. Parse the URL
Extract `fileKey` and `nodeId` from the Figma URL:
- `figma.com/design/:fileKey/:name?node-id=:nodeId` → convert `-` to `:` in nodeId

### 2. Fetch design context
Call `mcp__claude_ai_Figma__get_design_context` with the fileKey and nodeId.
Also call `mcp__claude_ai_Figma__get_screenshot` to get a visual reference.

Write down key observations from the design context:
- Layout structure (flex direction, gaps, alignment)
- Colors (map to `--nds-*` tokens where possible)
- Typography (map to design system tokens)
- Spacing (map to `--nds-spacing-*` tokens)
- Interactive states (hover, focus, active, disabled)
- Any sub-components visible

### 3. Generate the React component
Create `figmafiles/src/components/<ComponentName>.jsx`:

**Requirements:**
- Use design system CSS variables (`--nds-*`) for ALL colors, spacing, shadows
- Do NOT use hardcoded hex colors or px values — map everything to tokens
- Add `aria-label` to all icon-only buttons
- Add proper semantic HTML (`role`, `aria-*` attributes)
- Include all interactive states (hover, focus, active) via CSS
- Export as default

**Component template:**
```jsx
import React, { useState } from 'react'
import './ComponentName.css'

export default function ComponentName() {
  // state if needed
  return (
    <div className="component-name">
      {/* implementation */}
    </div>
  )
}
```

### 4. Generate the CSS file
Create `figmafiles/src/components/<ComponentName>.css`:

**Requirements:**
- Only use `var(--nds-*)` for colors, spacing, shadows, border-radius
- Include `:hover`, `:focus-visible`, `:active`, `:disabled` states
- Include `@media (prefers-reduced-motion: reduce)` for any animations
- Include at least one responsive breakpoint if the component has layout

### 5. Save a reference file
Create `figmafiles/components/<ComponentName>.md` with:
```markdown
# <ComponentName>

**Figma URL**: <url>
**Node ID**: <nodeId>
**Generated**: <date>
**Status**: In Progress | Review | Merged

## Design Notes
<observations from step 2>

## Token Mapping
| Figma value | Token used |
|-------------|-----------|
| #06D6A0 | --nds-state-info |
| ... | ... |

## Implementation Notes
<any decisions made during implementation>
```

### 6. Start the preview server (if not running)
Tell the user:
```
Component created! Preview it at http://localhost:5174

To start the preview server (first time only):
  cd figmafiles
  npm install
  npm run dev
```

---

## Token Reference (use these instead of hardcoded values)

### Colors
| Purpose | Token |
|---------|-------|
| Primary background | `--nds-bg-primary` |
| Secondary background | `--nds-bg-secondary` |
| Tertiary background | `--nds-bg-tertiary` |
| Card surface | `--nds-surface-card` |
| Card hover | `--nds-surface-card-hover` |
| Border | `--nds-surface-border` |
| Primary text | `--nds-text-primary` |
| Secondary text | `--nds-text-secondary` |
| Tertiary text | `--nds-text-tertiary` |
| Accent/link | `--nds-state-info` (#06D6A0) |
| Error | `--nds-state-error` |
| Warning | `--nds-state-warning` |
| Success | `--nds-state-success` |

### Spacing (4px grid)
| Token | Value |
|-------|-------|
| `--nds-spacing-1` | 4px |
| `--nds-spacing-2` | 8px |
| `--nds-spacing-3` | 12px |
| `--nds-spacing-4` | 16px |
| `--nds-spacing-5` | 20px |
| `--nds-spacing-6` | 24px |
| `--nds-spacing-8` | 32px |

### Shadows
- `--nds-shadow-sm`, `--nds-shadow-md`, `--nds-shadow-lg`, `--nds-shadow-xl`
- `--nds-shadow-focus` — for focus rings

### Border radius
- `--nds-radius-sm` (3px), `--nds-radius-md` (6px), `--nds-radius-lg` (8px), `--nds-radius-xl` (12px)

### Typography
- `--nds-font-size-xs` through `--nds-font-size-5xl`
- `--nds-font-family-sans`
- `--nds-font-weight-normal`, `--nds-font-weight-medium`, `--nds-font-weight-semibold`

### Transitions
- `--nds-transition-fast` (100ms), `--nds-transition-base` (200ms), `--nds-transition-slow` (300ms)
