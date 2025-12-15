# Component Audit Report

## Overview
This document provides a comprehensive audit of all dashboard components, their usage, props, variants, states, and improvement opportunities.

## Component Inventory

### 1. Button Component

**Location:** `src/components/newDashboard/ui/Button.tsx`

**Current Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- Standard HTML button attributes

**Usage:**
- Used in: DashboardPage, CalendarPage
- Total usages: 2 files

**Issues:**
- Missing `aria-label` for icon-only buttons
- Missing `aria-busy` for loading state
- No `aria-describedby` for help text
- Focus ring offset may not be visible on dark backgrounds
- No keyboard shortcut support

**Improvements Needed:**
- Add ARIA attributes for accessibility
- Improve focus visibility
- Add icon prop support
- Add tooltip support

### 2. Card Component

**Location:** `src/components/newDashboard/ui/Card.tsx`

**Current Props:**
- `children`: ReactNode
- `className`: string
- `title`: ReactNode (string or element)
- `description`: string
- `action`: ReactNode

**Usage:**
- Used in: DashboardPage, CalendarPage
- Total usages: 2 files

**Issues:**
- No variant system (elevated, outlined, filled)
- Missing hover state documentation
- No loading/error/empty state variants
- No semantic HTML (should use `<article>` or `<section>`)

**Improvements Needed:**
- Add variant prop (elevated, outlined, filled)
- Add semantic HTML structure
- Add loading skeleton variant
- Improve spacing consistency

### 3. StatCard Component

**Location:** `src/components/newDashboard/StatCard.tsx`

**Current Props:**
- `label`: string
- `value`: string | number
- `trend`: string (optional)
- `trendUp`: boolean (optional)
- `icon`: LucideIcon
- `iconColor`: string (Tailwind class)
- `bgColor`: string (Tailwind class)

**Usage:**
- Used in: DashboardPage
- Total usages: 1 file

**Issues:**
- Icon and color props are too flexible (should be predefined variants)
- No loading state
- No error state
- No empty state
- Trend indicator could be more accessible

**Improvements Needed:**
- Create predefined icon/color combinations
- Add skeleton loading state
- Add error/empty states
- Improve trend indicator accessibility

### 4. StatusBadge Component

**Location:** `src/components/newDashboard/StatusBadge.tsx`

**Current Props:**
- `status`: 'completed' | 'missed' | 'voicemail' | string

**Usage:**
- Used in: DashboardPage (in Recent Calls table)
- Total usages: 1 file

**Issues:**
- String fallback is too permissive
- Missing status types (pending, in-progress, etc.)
- No size variants
- Icon sizes are hardcoded

**Improvements Needed:**
- Strict type checking for status
- Add more status types
- Add size variants (sm, md, lg)
- Make icon sizes configurable

### 5. QuickActionButton Component

**Location:** `src/components/newDashboard/QuickActionButton.tsx`

**Current Props:**
- `icon`: LucideIcon
- `label`: string
- `onClick`: () => void (optional)
- `disabled`: boolean

**Usage:**
- Used in: DashboardPage (Quick Actions section)
- Total usages: 1 file

**Issues:**
- Missing `aria-label` (relies on visible text)
- No keyboard navigation documentation
- No loading state
- Arrow icon animation could be smoother

**Improvements Needed:**
- Add ARIA labels
- Add keyboard navigation (Enter/Space)
- Add loading state
- Improve animations

### 6. HealthItem Component

**Location:** `src/components/newDashboard/HealthItem.tsx`

**Current Props:**
- `label`: string
- `status`: 'ok' | 'error' | 'warning'

**Usage:**
- Used in: DashboardPage (System Health section)
- Total usages: 1 file

**Issues:**
- Status dot is too small (1.5px)
- No tooltip for status details
- No click handler for details
- Text colors may not meet contrast requirements

**Improvements Needed:**
- Increase status dot size for visibility
- Add tooltip support
- Add onClick handler for details
- Verify color contrast ratios

### 7. NavItem Component

**Location:** `src/components/newDashboard/NavItem.tsx`

**Current Props:**
- `icon`: LucideIcon
- `label`: string
- `active`: boolean
- `onClick`: () => void (optional)

**Usage:**
- Used in: SideNav component
- Total usages: 1 file

**Issues:**
- Missing `aria-current="page"` for active state
- No keyboard navigation (Arrow keys)
- No role="navigation" on parent
- Focus state could be more visible

**Improvements Needed:**
- Add ARIA current attribute
- Add keyboard navigation
- Improve focus visibility
- Add role attributes

## Component Usage Matrix

| Component | DashboardPage | CallsPage | AnalyticsPage | KnowledgeBasePage | Other |
|-----------|--------------|-----------|--------------|-------------------|-------|
| Button | ✓ | - | - | - | CalendarPage |
| Card | ✓ | - | - | - | CalendarPage |
| StatCard | ✓ | - | - | - | - |
| StatusBadge | ✓ | - | - | - | - |
| QuickActionButton | ✓ | - | - | - | - |
| HealthItem | ✓ | - | - | - | - |
| NavItem | ✓ (via SideNav) | ✓ (via SideNav) | ✓ (via SideNav) | ✓ (via SideNav) | - |

## Missing Components

1. **Input Component** - No form input component exists
2. **Select Component** - No dropdown/select component
3. **Textarea Component** - No textarea component
4. **Toast/Notification** - Basic toast exists but needs enhancement
5. **Skeleton Loader** - No loading skeleton components
6. **Empty State** - No reusable empty state component
7. **Modal/Dialog** - Exists but needs accessibility improvements
8. **Tooltip** - No tooltip component
9. **Dropdown Menu** - No dropdown menu component
10. **DatePicker** - No date picker component

## Duplicate Components

1. **Button**: 
   - `src/components/ui/Button.tsx` (used in landing page, onboarding)
   - `src/components/newDashboard/ui/Button.tsx` (used in dashboard)
   - **Action**: Consolidate into single component with all variants

## Priority Improvements

### High Priority
1. Add accessibility attributes (ARIA labels, roles, keyboard navigation)
2. Create missing form components (Input, Select, Textarea)
3. Consolidate duplicate Button components
4. Add loading/error/empty states to all components

### Medium Priority
1. Improve color contrast ratios
2. Add tooltip component
3. Create skeleton loaders
4. Standardize spacing and sizing

### Low Priority
1. Add animation improvements
2. Create component documentation (Storybook)
3. Add more variant options
4. Performance optimizations

## Next Steps

1. Extend design tokens in tailwind.config.cjs
2. Create design-system folder structure
3. Implement accessibility improvements
4. Create missing components
5. Consolidate duplicate components
