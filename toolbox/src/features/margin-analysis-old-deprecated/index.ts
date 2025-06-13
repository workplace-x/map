// Main component
export { default as MarginAnalysis } from './MarginAnalysis'
export { default } from './MarginAnalysis'

// Advanced components
export { AdvancedMarginAnalysisDashboard } from './components/AdvancedMarginAnalysisDashboard'

// Types that might be needed elsewhere
export type { 
  OrderSummary, 
  OrderLine, 
  VendorSummary, 
  ApprovalStatus 
} from './types'

// Hooks for reuse
export { 
  useMarginAnalysis, 
  useApprovalStatus, 
  useVendorSummaries 
} from './hooks'

// Services for reuse
export { 
  MarginAnalysisService
} from './services' 