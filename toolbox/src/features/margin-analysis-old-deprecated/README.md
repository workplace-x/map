# Margin Analysis Feature

This feature provides comprehensive margin analysis for orders, including vendor comparisons, approval workflows, and detailed reporting.

## 📁 File Structure

```
margin-analysis/
├── components/           # UI Components
│   ├── ApprovalSection.tsx
│   ├── OrderSummaryCards.tsx
│   ├── SearchSection.tsx
│   ├── analysis-tab.tsx
│   ├── columns.tsx
│   ├── tangram-lines-table.tsx
│   ├── vendor-lines-table.tsx
│   └── index.ts
├── hooks.ts            # Custom hooks for state management
├── services.ts         # API service layer
├── types.ts           # TypeScript interfaces
├── utils.ts           # Utility functions
├── MarginAnalysis.tsx # Main component
├── index.tsx          # Component re-export
├── index.ts           # Feature exports
└── README.md          # This file
```

## 🔧 Architecture

The refactored margin analysis feature follows these principles:

### **Separation of Concerns**
- **Components**: Pure UI components focused on rendering
- **Hooks**: State management and business logic
- **Services**: API calls and data transformation
- **Utils**: Pure utility functions

### **Custom Hooks**
- `useMarginAnalysis()` - Manages order data fetching and search
- `useApprovalStatus()` - Handles approval workflow
- `useVendorSummaries()` - Fetches vendor comparison data

### **Service Layer**
- `MarginAnalysisService` - Order data operations
- `ApprovalService` - Approval workflow operations

## 🚀 Usage

### Basic Usage
```tsx
import { MarginAnalysis } from '@/features/margin-analysis'

function App() {
  return <MarginAnalysis />
}
```

### Using Hooks Independently
```tsx
import { useMarginAnalysis } from '@/features/margin-analysis'

function MyComponent() {
  const { orderSummary, loading, handleSearch } = useMarginAnalysis()
  // ... component logic
}
```

### Using Services Directly
```tsx
import { MarginAnalysisService } from '@/features/margin-analysis'

async function fetchOrderData(orderNo: string) {
  try {
    const data = await MarginAnalysisService.fetchOrderMargin(orderNo)
    return data
  } catch (error) {
    console.error('Failed to fetch order:', error)
  }
}
```

## 📊 Components

### **MarginAnalysis** (Main Component)
The main component that orchestrates the entire margin analysis interface.

### **SearchSection**
Handles order number search functionality with real-time validation.

### **OrderSummaryCards**
Displays order overview information in a card layout.

### **ApprovalSection**
Manages the approval workflow UI and state.

### **AnalysisTab**
Complex analysis component with charts and data grids.

## 🎯 Benefits of Refactoring

### **Before Refactoring:**
- ❌ 333+ line monolithic component
- ❌ Mixed concerns (UI, API, state)
- ❌ Duplicate code and types
- ❌ Hard to test and maintain
- ❌ Inline components

### **After Refactoring:**
- ✅ Modular, focused components
- ✅ Separated business logic in hooks
- ✅ Reusable service layer
- ✅ Type safety with consolidated types
- ✅ Easy to test and maintain
- ✅ Better code organization

## 🔄 Data Flow

1. **User Input** → SearchSection component
2. **Search Action** → useMarginAnalysis hook
3. **API Call** → MarginAnalysisService
4. **Data Transformation** → Utils functions
5. **State Update** → React state
6. **UI Update** → Components render new data

## 🧪 Testing

The refactored structure makes testing much easier:

```tsx
// Test hooks independently
import { renderHook } from '@testing-library/react'
import { useMarginAnalysis } from './hooks'

test('should fetch order data', async () => {
  const { result } = renderHook(() => useMarginAnalysis())
  // ... test logic
})

// Test services in isolation
import { MarginAnalysisService } from './services'

test('should transform API data correctly', async () => {
  const mockData = { /* mock API response */ }
  // ... test logic
})
```

## 🎨 Styling

Components use the existing design system:
- Tailwind CSS for styling
- Shadcn/ui components
- Consistent theming with CSS variables

## 🔮 Future Improvements

- [ ] Add React Query for better caching
- [ ] Implement optimistic updates
- [ ] Add comprehensive error boundaries
- [ ] Create Storybook stories for components
- [ ] Add unit and integration tests
- [ ] Implement virtualization for large datasets 