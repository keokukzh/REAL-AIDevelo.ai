# Design System Documentation

## Overview

This document describes the AIDevelo dashboard design system, including design tokens, components, and usage guidelines.

## Design Tokens

### Colors

The design system uses a dark theme with the following color palette:

#### Primary Colors
- **Background**: `#0E0E0E` - Main page background
- **Surface**: `#111827` - Card and component backgrounds
- **Primary**: `#1A73E8` - Primary actions and links
- **Accent**: `#00E0FF` - Accent color for highlights
- **Swiss Red**: `#DA291C` - Brand color, primary CTAs

#### Semantic Colors
- **Success**: Emerald (green) - `#10B981`
- **Warning**: Amber (yellow) - `#F59E0B`
- **Error**: Red - `#EF4444`
- **Info**: Cyan - `#00E0FF`

#### Gray Scale
- **Gray-50**: `#F9FAFB` (lightest)
- **Gray-100**: `#F3F4F6`
- **Gray-200**: `#E5E7EB`
- **Gray-300**: `#D1D5DB`
- **Gray-400**: `#9CA3AF`
- **Gray-500**: `#6B7280`
- **Gray-600**: `#4B5563`
- **Gray-700**: `#374151`
- **Gray-800**: `#1F2937`
- **Gray-900**: `#111827`
- **Gray-950**: `#030712` (darkest)

### Typography

#### Font Families
- **Sans**: Inter - Used for body text and UI elements
- **Display**: Space Grotesk - Used for headings and emphasis

#### Font Sizes
- **xs**: 0.75rem (12px) - Small labels, captions
- **sm**: 0.875rem (14px) - Secondary text, helper text
- **base**: 1rem (16px) - Body text
- **lg**: 1.125rem (18px) - Large body text
- **xl**: 1.25rem (20px) - Small headings
- **2xl**: 1.5rem (24px) - Section headings
- **3xl**: 1.875rem (30px) - Page headings
- **4xl**: 2.25rem (36px) - Large page headings
- **5xl**: 3rem (48px) - Hero headings

#### Font Weights
- **normal**: 400 - Regular text
- **medium**: 500 - Medium emphasis
- **semibold**: 600 - Strong emphasis
- **bold**: 700 - Headings, strong emphasis

### Spacing

Spacing scale based on 4px base unit:

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)
- **4xl**: 6rem (96px)
- **5xl**: 8rem (128px)

### Border Radius

- **none**: 0
- **sm**: 0.25rem (4px)
- **DEFAULT**: 0.5rem (8px)
- **md**: 0.75rem (12px)
- **lg**: 1rem (16px)
- **xl**: 1.5rem (24px)
- **2xl**: 2rem (32px)
- **full**: 9999px (fully rounded)

### Shadows

#### Standard Shadows
- **sm**: Subtle shadow for cards
- **md**: Medium shadow for elevated elements
- **lg**: Large shadow for modals
- **xl**: Extra large shadow for popovers
- **2xl**: Maximum shadow for overlays

#### Dark Theme Shadows
- **dark-sm**: Enhanced shadow for dark backgrounds
- **dark-md**: Medium dark shadow
- **dark-lg**: Large dark shadow
- **dark-xl**: Extra large dark shadow

#### Glow Effects
- **glow-accent**: Cyan glow effect
- **glow-primary**: Blue glow effect
- **glow-red**: Red glow effect
- **glow-success**: Green glow effect

#### Gradients
- **gradient-primary**: `linear-gradient(135deg, #1A73E8 0%, #00E0FF 100%)` - Primary to accent gradient
- **gradient-accent**: `linear-gradient(135deg, #00E0FF 0%, #38BDF8 100%)` - Accent gradient
- **gradient-surface**: `linear-gradient(180deg, rgba(17,24,39,0.8) 0%, rgba(15,23,42,0.9) 100%)` - Surface gradient
- **gradient-hero**: `linear-gradient(135deg, rgba(26,115,232,0.1) 0%, rgba(0,224,255,0.1) 100%)` - Hero background gradient

**Usage:**
```tsx
<div className="bg-gradient-primary">...</div>
<div className="bg-gradient-accent">...</div>
```

#### Glass Morphism
- **glass-light**: `rgba(255,255,255,0.05) backdrop-blur-xl` - Subtle glass effect
- **glass-medium**: `rgba(255,255,255,0.1) backdrop-blur-2xl` - Medium glass effect
- **glass-heavy**: `rgba(255,255,255,0.15) backdrop-blur-2xl` - Strong glass effect

**Usage:**
```tsx
<div className="glass-light">...</div>
<div className="glass-medium">...</div>
```

#### Elevation System
- **elevation-0**: No shadow
- **elevation-1**: Subtle elevation (cards at rest)
- **elevation-2**: Medium elevation (hovered cards)
- **elevation-3**: High elevation (modals, dropdowns)
- **elevation-4**: Very high elevation (overlays)
- **elevation-5**: Maximum elevation (full-screen modals)

**Usage:**
```tsx
<div className="elevation-2">...</div>
```

### CSS Variables

All design tokens are also available as CSS variables in `src/styles/design-tokens.css`:

```css
/* Colors */
--color-primary: #1A73E8;
--color-accent: #00E0FF;
--color-success: #10B981;
/* ... */

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
/* ... */

/* Shadows */
--shadow-elevation-1: ...;
--shadow-elevation-2: ...;
/* ... */
```

**Usage:**
```css
.custom-element {
  background: var(--color-primary);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-elevation-2);
}
```

### Animations

#### Durations
- **fast**: 150ms - Quick transitions (hover states, microinteractions)
- **normal**: 200ms - Standard transitions (default)
- **slow**: 300ms - Smooth transitions (card hovers, reveals)
- **slower**: 500ms - Deliberate transitions (section transitions)
- **slowest**: 800ms - Signature hero motion only

#### Easing
- **ease-in-out-back**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Bouncy animations (buttons, cards)
- **ease-out-expo**: `cubic-bezier(0.19, 1, 0.22, 1)` - Smooth deceleration (default, section reveals)
- **ease-out-cubic**: `cubic-bezier(0.33, 1, 0.68, 1)` - Quick microinteractions

#### Keyframe Animations
- **fade-in**: Fade in animation
- **fade-out**: Fade out animation
- **slide-up**: Slide up animation
- **slide-down**: Slide down animation
- **skeleton**: Loading skeleton pulse

## Components

### Button

**Location**: `src/components/newDashboard/ui/Button.tsx`

**Variants**:
- `primary`: Swiss red background, white text
- `secondary`: Dark slate background, white text
- `outline`: Transparent background, bordered
- `ghost`: Transparent, hover background

**Sizes**:
- `sm`: Small (px-3 py-1.5 text-sm)
- `md`: Medium (px-4 py-2 text-base) - Default
- `lg`: Large (px-6 py-3 text-lg)

**States**:
- Default
- Hover
- Active
- Disabled
- Loading (with spinner)

**Accessibility**:
- ARIA labels support
- aria-busy for loading state
- aria-disabled for disabled state
- Keyboard support (Enter/Space)
- Visible focus indicators

### Card

**Location**: `src/components/newDashboard/ui/Card.tsx`

**Props**:
- `title`: Card title (string or ReactNode)
- `description`: Optional description text
- `action`: Optional action element (button, etc.)
- `children`: Card content
- `className`: Additional CSS classes

**Features**:
- Semantic HTML (`<article>`)
- Hover effects
- Backdrop blur
- Border and shadow

### Input

**Location**: `src/components/newDashboard/ui/Input.tsx`

**Props**:
- `label`: Input label
- `error`: Error message
- `helperText`: Helper text
- `icon`: Optional icon
- `size`: sm, md, lg

**Features**:
- Label association
- Error state with icon
- Helper text support
- Icon support
- Full accessibility (ARIA attributes)

### Select

**Location**: `src/components/newDashboard/ui/Select.tsx`

**Props**:
- `label`: Select label
- `options`: Array of {value, label, disabled}
- `placeholder`: Placeholder option
- `error`: Error message
- `helperText`: Helper text
- `size`: sm, md, lg

**Features**:
- Custom styled dropdown
- Keyboard navigation
- Error state
- Helper text support

### StatCard

**Location**: `src/components/newDashboard/StatCard.tsx`

**Props**:
- `label`: Metric label
- `value`: Metric value
- `trend`: Optional trend indicator
- `trendUp`: Boolean for trend direction
- `icon`: Lucide icon
- `iconColor`: Tailwind color class
- `bgColor`: Background color class

**Features**:
- Large value display
- Icon with colored background
- Trend indicators
- Hover effects

### StatusBadge

**Location**: `src/components/newDashboard/StatusBadge.tsx`

**Status Types**:
- `completed`: Green badge
- `missed`: Red badge
- `voicemail`: Amber badge

**Features**:
- Icon support
- Color-coded status
- Border for definition

### EmptyState

**Location**: `src/components/newDashboard/EmptyState.tsx`

**Props**:
- `icon`: Optional Lucide icon
- `title`: Empty state title
- `description`: Optional description
- `actionLabel`: Optional action button label
- `onAction`: Optional action handler

**Predefined Variants**:
- `EmptyCalls`: For call lists
- `EmptyCalendar`: For calendar connection
- `EmptyDocuments`: For document lists

### Skeleton

**Location**: `src/components/newDashboard/Skeleton.tsx`

**Variants**:
- `text`: Text line skeleton
- `circular`: Circle skeleton
- `rectangular`: Rectangle skeleton

**Predefined Components**:
- `SkeletonCard`: Card skeleton
- `SkeletonTable`: Table skeleton
- `SkeletonStatCard`: Stat card skeleton

## Usage Guidelines

### Component Import

```typescript
import { Button } from '../components/newDashboard/ui/Button';
import { Card } from '../components/newDashboard/ui/Card';
import { Input } from '../components/newDashboard/ui/Input';
```

### Button Usage

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="outline" isLoading={loading}>
  Loading...
</Button>
```

### Form Usage

```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="Enter your email address"
/>

<Select
  label="Country"
  options={[
    { value: 'ch', label: 'Switzerland' },
    { value: 'de', label: 'Germany' },
  ]}
  value={country}
  onChange={(e) => setCountry(e.target.value)}
/>
```

### Card Usage

```tsx
<Card title="My Card" description="Card description">
  <p>Card content</p>
</Card>

<Card 
  title="Card with Action"
  action={<Button size="sm">Action</Button>}
>
  <p>Content</p>
</Card>
```

## Best Practices

### Accessibility
- Always provide labels for form inputs
- Use semantic HTML elements
- Include ARIA attributes where needed
- Ensure keyboard navigation works
- Test with screen readers

### Spacing
- Use design token spacing values
- Maintain consistent spacing between elements
- Use larger spacing for section separation

### Colors
- Use semantic colors for status indicators
- Maintain sufficient contrast ratios (WCAG AA)
- Use accent color sparingly for emphasis

### Typography
- Use display font for headings
- Use sans font for body text
- Maintain consistent font sizes
- Use appropriate font weights

### Responsive Design
- Design mobile-first
- Test on multiple screen sizes
- Use responsive grid layouts
- Ensure touch targets are adequate (44x44px minimum)

## Migration Guide

### From Old Components

If migrating from `src/components/ui/Button.tsx`:

1. Update imports:
   ```typescript
   // Old
   import { Button } from '../components/ui/Button';
   
   // New
   import { Button } from '../components/newDashboard/ui/Button';
   ```

2. Props are compatible, but new Button has additional features:
   - `isLoading` prop
   - Better accessibility
   - Improved focus states

3. Variants may need adjustment:
   - Old `primary` → New `primary` (same)
   - Old `secondary` → New `secondary` (similar)
   - Old `outline` → New `outline` (similar)

## Component Status

### Stable Components
- ✅ Button
- ✅ Card
- ✅ Input
- ✅ Select
- ✅ Textarea
- ✅ StatCard
- ✅ StatusBadge
- ✅ NavItem
- ✅ QuickActionButton
- ✅ HealthItem
- ✅ Skeleton
- ✅ EmptyState

### Components to Create
- ⏳ Tooltip
- ⏳ Dropdown Menu
- ⏳ DatePicker
- ⏳ Modal (enhanced)
- ⏳ Toast/Notification (enhanced)

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://react.dev/learn/accessibility)
