# Glassmorphism Design System Guide

## Overview
This guide explains how to implement glassmorphism effects throughout the Toolbox application. The design system provides a modern, elegant interface with glass-like transparency effects, subtle animations, and beautiful gradients.

## Core Components

### 1. GlassCard
The foundation component for all glassmorphism elements.

```tsx
import { GlassCard } from '@/components/ui/glass-card'

// Basic usage
<GlassCard variant="default" className="p-6">
  Content here
</GlassCard>

// Interactive card with animation
<GlassCard variant="elevated" interactive animated className="p-6">
  Interactive content
</GlassCard>
```

**Variants:**
- `default`: Standard glass effect
- `elevated`: Enhanced shadow and blur
- `subtle`: Minimal glass effect
- `frosted`: Heavy blur effect
- `tinted`: Gradient tinted glass

### 2. GlassLayout Components

#### GlassPageWrapper
Full-page wrapper with gradient background and particles.

```tsx
import { GlassPageWrapper } from '@/components/layout/glass-layout'

<GlassPageWrapper
  title="Page Title"
  description="Page description"
  section="dashboard" // or 'sales', 'ai', 'management', 'data', 'customers'
  showParticles
>
  {/* Page content */}
</GlassPageWrapper>
```

#### GlassGrid
Responsive grid with staggered animations.

```tsx
import { GlassGrid } from '@/components/layout/glass-layout'

<GlassGrid cols={4} gap="md" animated>
  {items.map(item => (
    <GlassCard key={item.id}>
      {/* Card content */}
    </GlassCard>
  ))}
</GlassGrid>
```

#### GlassKPICard
Specialized card for displaying metrics and KPIs.

```tsx
import { GlassKPICard } from '@/components/layout/glass-layout'

<GlassKPICard
  title="Revenue"
  value="$124,500"
  subtitle="vs last month"
  icon={DollarSign}
  trend={{ value: 12.5, direction: 'up', label: 'vs last month' }}
  color="success"
/>
```

### 3. Interactive Elements

#### GlassButton
Glassmorphism-styled buttons with hover animations.

```tsx
import { GlassButton } from '@/components/ui/glass-card'

<GlassButton variant="primary">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</GlassButton>
```

#### GlassInput
Form inputs with glass styling.

```tsx
import { GlassInput } from '@/components/ui/glass-card'

<GlassInput
  placeholder="Enter text..."
  className="mb-4"
/>
```

#### GlassBadge
Status indicators with glass effects.

```tsx
import { GlassBadge } from '@/components/ui/glass-card'

<GlassBadge variant="success">
  <CheckCircle className="h-3 w-3 mr-1" />
  Completed
</GlassBadge>
```

## Section-Specific Implementations

### Dashboard (Home)
- **Gradient**: Blue to purple to indigo
- **Components**: KPI cards, activity feed, system status
- **Features**: Floating particles, staggered animations

```tsx
// Toggle between standard and glass dashboard
import { GlassDashboard } from '@/features/dashboard/components/GlassDashboard'

// Already implemented in /_authenticated/index.tsx with toggle button
```

### AI Tools Section
- **Gradient**: Purple to pink to rose
- **Components**: Document upload, processing status, AI capabilities
- **Features**: Enhanced animations, capability showcase

```tsx
import { GlassRFPDashboard } from '@/features/rfp-gpt/components/GlassRFPDashboard'

// Use in RFP/AI routes
```

### Sales Section
- **Gradient**: Green to emerald to teal
- **Components**: Sales metrics, pipeline visualization, quote management

### Management Section
- **Gradient**: Orange to red to pink
- **Components**: Team performance, approvals, forecasting

### Data Section
- **Gradient**: Gray to slate to zinc
- **Components**: Sync status, database health, system monitoring

### Customers Section
- **Gradient**: Cyan to blue to indigo
- **Components**: Customer lists, vendor management, relationship tracking

## Implementation Strategy

### Phase 1: Core Pages
1. ✅ Dashboard (with toggle)
2. ✅ AI Tools/RFP section
3. 🔄 Sales pages (margin analysis, quotes)
4. 🔄 Management pages (forecast, approvals)

### Phase 2: Secondary Pages
1. Settings pages
2. User management
3. Data sync status
4. Customer/vendor pages

### Phase 3: Components
1. Forms and inputs
2. Tables and data displays
3. Navigation enhancements
4. Modal dialogs

## Usage Guidelines

### When to Use Glassmorphism
- ✅ Dashboard and overview pages
- ✅ Feature showcase sections
- ✅ Interactive elements that need emphasis
- ✅ Modern, premium feeling interfaces

### When NOT to Use
- ❌ Dense data tables (readability issues)
- ❌ Text-heavy content pages
- ❌ Forms with many inputs (can be distracting)
- ❌ Print-friendly pages

### Performance Considerations
- Use `backdrop-blur` sparingly on mobile
- Limit particle animations on low-end devices
- Consider reduced motion preferences
- Optimize gradient backgrounds

## Color Schemes by Section

```tsx
export const glassGradients = {
  dashboard: 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700',
  sales: 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700',
  ai: 'bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700',
  management: 'bg-gradient-to-br from-orange-600 via-red-600 to-pink-700',
  data: 'bg-gradient-to-br from-gray-600 via-slate-600 to-zinc-700',
  customers: 'bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700'
}
```

## Animation Presets

```tsx
export const glassAnimations = {
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}
```

## Next Steps

1. **Test the current implementation**: Visit the dashboard and click the "Glass Design" toggle
2. **Extend to other sections**: Apply glassmorphism to sales, management, and data pages
3. **Customize per section**: Use appropriate gradients and animations for each area
4. **User feedback**: Gather feedback on usability and visual appeal
5. **Performance optimization**: Monitor performance impact and optimize as needed

## Examples

### Converting Existing Components

**Before (Standard Card):**
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$124,500</div>
  </CardContent>
</Card>
```

**After (Glass Card):**
```tsx
<GlassKPICard
  title="Revenue"
  value="$124,500"
  icon={DollarSign}
  trend={{ value: 12.5, direction: 'up', label: 'vs last month' }}
  color="success"
/>
```

### Page Structure
```tsx
function MyGlassPage() {
  return (
    <GlassPageWrapper
      title="Page Title"
      description="Description"
      section="sales"
    >
      <GlassGrid cols={3}>
        <GlassCard variant="elevated" className="p-6">
          {/* Content */}
        </GlassCard>
      </GlassGrid>
    </GlassPageWrapper>
  )
}
```

This design system provides a cohesive, modern interface that can be gradually implemented across the entire application while maintaining usability and performance. 