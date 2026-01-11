# Design Tokens Documentation

This document provides detailed information about the design tokens used in the Notion Design System.

## Overview

Design tokens are the visual design atoms of the design system. They are named entities that store visual design attributes such as colors, typography, spacing, and more.

## Color System

### Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-bg-primary` | `#ffffff` | Main background color |
| `--nds-bg-secondary` | `#f7f6f3` | Secondary background, sidebar |
| `--nds-bg-tertiary` | `#f1f0ed` | Tertiary background, hover states |
| `--nds-bg-hover` | `#f5f4f1` | Hover background |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-text-primary` | `#37352f` | Primary text color |
| `--nds-text-secondary` | `#787774` | Secondary text, captions |
| `--nds-text-tertiary` | `#9b9a97` | Tertiary text, placeholders |
| `--nds-text-disabled` | `#c7c7c5` | Disabled text |
| `--nds-text-inverse` | `#ffffff` | Text on dark backgrounds |
| `--nds-text-link` | `#2383e2` | Link color |

### State Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-state-info` | `#2383e2` | Info messages |
| `--nds-state-success` | `#0f7b6c` | Success states |
| `--nds-state-warning` | `#f59e0b` | Warning states |
| `--nds-state-error` | `#eb5757` | Error states |

### Interactive Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-interactive-hover` | `rgba(55, 53, 47, 0.06)` | Hover background |
| `--nds-interactive-active` | `rgba(55, 53, 47, 0.1)` | Active/pressed state |
| `--nds-interactive-selected` | `#e3f2fd` | Selected state |
| `--nds-interactive-focus` | `#2383e2` | Focus indicator |

## Typography

### Font Families

```css
--nds-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
--nds-font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
```

### Font Sizes

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--nds-font-size-xs` | `0.75rem` | 12px | Small labels, timestamps |
| `--nds-font-size-sm` | `0.875rem` | 14px | Body text small, captions |
| `--nds-font-size-base` | `1rem` | 16px | Body text |
| `--nds-font-size-lg` | `1.125rem` | 18px | Subheadings |
| `--nds-font-size-xl` | `1.25rem` | 20px | H4 |
| `--nds-font-size-2xl` | `1.5rem` | 24px | H3 |
| `--nds-font-size-3xl` | `1.875rem` | 30px | H2 |
| `--nds-font-size-4xl` | `2.25rem` | 36px | H1 |
| `--nds-font-size-5xl` | `3rem` | 48px | Hero text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-font-weight-normal` | `400` | Body text |
| `--nds-font-weight-medium` | `500` | Emphasized text |
| `--nds-font-weight-semibold` | `600` | Headings |
| `--nds-font-weight-bold` | `700` | Strong emphasis |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-line-height-tight` | `1.2` | Headings |
| `--nds-line-height-normal` | `1.5` | Body text |
| `--nds-line-height-relaxed` | `1.6` | Paragraphs |
| `--nds-line-height-loose` | `2` | Loose spacing |

## Spacing

Based on a **4px base grid**:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--nds-spacing-0` | `0` | 0px | No spacing |
| `--nds-spacing-0-5` | `0.125rem` | 2px | Minimal spacing |
| `--nds-spacing-1` | `0.25rem` | 4px | Tiny gaps |
| `--nds-spacing-2` | `0.5rem` | 8px | Small gaps |
| `--nds-spacing-3` | `0.75rem` | 12px | Medium gaps |
| `--nds-spacing-4` | `1rem` | 16px | Standard gaps |
| `--nds-spacing-5` | `1.25rem` | 20px | Increased gaps |
| `--nds-spacing-6` | `1.5rem` | 24px | Large gaps |
| `--nds-spacing-8` | `2rem` | 32px | Section gaps |
| `--nds-spacing-10` | `2.5rem` | 40px | Large sections |
| `--nds-spacing-12` | `3rem` | 48px | Major sections |

## Border Radius

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--nds-radius-none` | `0` | 0px | No rounding |
| `--nds-radius-sm` | `0.1875rem` | 3px | Small elements |
| `--nds-radius-md` | `0.375rem` | 6px | Buttons, inputs |
| `--nds-radius-lg` | `0.5rem` | 8px | Cards, modals |
| `--nds-radius-xl` | `0.75rem` | 12px | Large cards |
| `--nds-radius-full` | `9999px` | Full | Pills, circles |

## Shadows

### Elevation Levels

```css
--nds-shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--nds-shadow-sm: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, 
                 rgba(15, 15, 15, 0.1) 0px 3px 6px, 
                 rgba(15, 15, 15, 0.2) 0px 9px 24px;
--nds-shadow-md: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, 
                 rgba(15, 15, 15, 0.1) 0px 5px 10px, 
                 rgba(15, 15, 15, 0.2) 0px 15px 40px;
--nds-shadow-lg: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, 
                 rgba(15, 15, 15, 0.1) 0px 10px 20px, 
                 rgba(15, 15, 15, 0.2) 0px 20px 60px;
--nds-shadow-focus: 0 0 0 3px rgba(35, 131, 226, 0.3);
```

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Quick interactions |
| `--nds-transition-base` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |
| `--nds-transition-slow` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | Slow animations |

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--nds-z-base` | `0` | Base level |
| `--nds-z-dropdown` | `1000` | Dropdowns |
| `--nds-z-sticky` | `1100` | Sticky elements |
| `--nds-z-overlay` | `1200` | Overlays |
| `--nds-z-modal` | `1300` | Modals |
| `--nds-z-popover` | `1400` | Popovers |
| `--nds-z-tooltip` | `1500` | Tooltips |

## Usage Examples

### In CSS

```css
.my-component {
  color: var(--nds-text-primary);
  background-color: var(--nds-bg-secondary);
  padding: var(--nds-spacing-4);
  border-radius: var(--nds-radius-md);
  transition: all var(--nds-transition-base);
}
```

### Customization

Override tokens to customize the design system:

```css
:root {
  /* Override brand colors */
  --nds-brand-primary: #your-primary-color;
  --nds-brand-accent: #your-accent-color;
  
  /* Override spacing */
  --nds-spacing-4: 20px; /* Change base spacing */
  
  /* Override typography */
  --nds-font-primary: 'Your Custom Font', sans-serif;
}
```

## Best Practices

1. **Always use tokens** instead of hard-coded values
2. **Maintain consistency** across your application
3. **Test customizations** to ensure proper contrast and accessibility
4. **Document overrides** for your team
5. **Use semantic names** when creating custom tokens
