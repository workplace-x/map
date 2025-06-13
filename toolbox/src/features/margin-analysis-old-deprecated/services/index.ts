// Modular Service Architecture for Margin Analysis
// This replaces the monolithic services.ts with focused, efficient modules

export * from './core/MarginAnalysisCore'
export * from './core/CacheManager' 
export * from './core/ErrorHandler'
export * from './core/APIClient'

export * from './ai/MLModelManager'
export * from './ai/PredictiveAnalytics'
export * from './ai/AnomalyDetection'
export * from './ai/OptimizationEngine'

export * from './business/TangramServices'
export * from './business/SteelcasePartnership'
export * from './business/CDAIntelligence'
export * from './business/ContractAnalyzer'

export * from './data/DataTransformer'
export * from './data/QueryBuilder'
export * from './data/StreamProcessor'

export * from './integrations/GoalsIntegration'
export * from './integrations/RealtimeSync'

// Main service aggregator with dependency injection
export { MarginAnalysisService } from './MarginAnalysisService' 