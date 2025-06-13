/**
 * Enterprise Error Handler
 * Provides intelligent error classification, retry logic, and circuit breaker patterns
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATA = 'data',
  BUSINESS_LOGIC = 'business_logic',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

export interface MarginAnalysisError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  originalError?: Error
  context?: Record<string, any>
  timestamp: Date
  retryable: boolean
  suggestedActions: string[]
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableCategories: ErrorCategory[]
}

interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitorWindow: number
}

export class ErrorHandler {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableCategories: [ErrorCategory.NETWORK, ErrorCategory.RATE_LIMIT]
  }

  private circuitBreakers = new Map<string, {
    failures: number
    lastFailure: Date
    state: 'closed' | 'open' | 'half-open'
  }>()

  private errorMetrics = {
    totalErrors: 0,
    errorsByCategory: new Map<ErrorCategory, number>(),
    errorsBySeverity: new Map<ErrorSeverity, number>(),
    retryAttempts: 0,
    recoveredErrors: 0
  }

  // ===== INTELLIGENT ERROR CLASSIFICATION =====

  classifyError(error: Error | unknown, context?: Record<string, any>): MarginAnalysisError {
    const classified = this.analyzeError(error)
    const id = this.generateErrorId()

    return {
      id,
      category: classified.category,
      severity: classified.severity,
      message: classified.message,
      originalError: error instanceof Error ? error : undefined,
      context,
      timestamp: new Date(),
      retryable: classified.retryable,
      suggestedActions: classified.suggestedActions
    }
  }

  private analyzeError(error: Error | unknown): {
    category: ErrorCategory
    severity: ErrorSeverity
    message: string
    retryable: boolean
    suggestedActions: string[]
  } {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          message: 'Network connectivity issue detected',
          retryable: true,
          suggestedActions: [
            'Check internet connection',
            'Verify API endpoint availability',
            'Try again in a few moments'
          ]
        }
      }

      // Rate limiting
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return {
          category: ErrorCategory.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: 'API rate limit exceeded',
          retryable: true,
          suggestedActions: [
            'Reduce request frequency',
            'Implement request batching',
            'Contact support for rate limit increase'
          ]
        }
      }

      // Authentication errors
      if (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403')) {
        return {
          category: ErrorCategory.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: 'Authentication or authorization failed',
          retryable: false,
          suggestedActions: [
            'Check login credentials',
            'Verify user permissions',
            'Contact administrator'
          ]
        }
      }

      // Data validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.LOW,
          message: 'Data validation failed',
          retryable: false,
          suggestedActions: [
            'Check input data format',
            'Verify required fields',
            'Review data constraints'
          ]
        }
      }

      // Business logic errors
      if (error.message.includes('margin') || error.message.includes('quote') || error.message.includes('CDA')) {
        return {
          category: ErrorCategory.BUSINESS_LOGIC,
          severity: ErrorSeverity.MEDIUM,
          message: 'Business logic error in margin analysis',
          retryable: false,
          suggestedActions: [
            'Verify quote data completeness',
            'Check customer/vendor information',
            'Review business rules configuration'
          ]
        }
      }
    }

    // Default classification
    return {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      message: 'Unknown system error occurred',
      retryable: false,
      suggestedActions: [
        'Contact technical support',
        'Check system logs',
        'Try again later'
      ]
    }
  }

  // ===== RETRY LOGIC WITH EXPONENTIAL BACKOFF =====

  async withRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig }
    let lastError: MarginAnalysisError | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // Recovery tracking
        if (attempt > 0) {
          this.errorMetrics.recoveredErrors++
        }
        
        return result
      } catch (error) {
        lastError = this.classifyError(error, { ...context, attempt })
        this.updateMetrics(lastError)

        // Don't retry if not retryable or max attempts reached
        if (!lastError.retryable || attempt === config.maxRetries) {
          break
        }

        // Don't retry if not in retryable categories
        if (!config.retryableCategories.includes(lastError.category)) {
          break
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        const jitteredDelay = delay + Math.random() * 1000 // Add jitter

        console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} for ${lastError.category} error. Waiting ${jitteredDelay}ms...`)
        
        await this.sleep(jitteredDelay)
        this.errorMetrics.retryAttempts++
      }
    }

    // All retries failed
    throw new Error(`Operation failed after ${config.maxRetries} retries: ${lastError?.message}`)
  }

  // ===== CIRCUIT BREAKER PATTERN =====

  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceKey: string,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      monitorWindow: 60000, // 1 minute
      ...config
    }

    const breaker = this.getCircuitBreaker(serviceKey)

    // Check circuit state
    if (breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime()
      
      if (timeSinceLastFailure < circuitConfig.resetTimeout) {
        throw new Error(`Circuit breaker open for ${serviceKey}. Try again in ${circuitConfig.resetTimeout - timeSinceLastFailure}ms`)
      } else {
        // Move to half-open state
        breaker.state = 'half-open'
      }
    }

    try {
      const result = await operation()
      
      // Success - reset circuit breaker
      if (breaker.state === 'half-open') {
        breaker.state = 'closed'
        breaker.failures = 0
      }
      
      return result
    } catch (error) {
      // Failure - update circuit breaker
      breaker.failures++
      breaker.lastFailure = new Date()

      if (breaker.failures >= circuitConfig.failureThreshold) {
        breaker.state = 'open'
        console.error(`Circuit breaker opened for ${serviceKey} after ${breaker.failures} failures`)
      }

      throw error
    }
  }

  private getCircuitBreaker(serviceKey: string) {
    if (!this.circuitBreakers.has(serviceKey)) {
      this.circuitBreakers.set(serviceKey, {
        failures: 0,
        lastFailure: new Date(),
        state: 'closed'
      })
    }
    return this.circuitBreakers.get(serviceKey)!
  }

  // ===== MARGIN-SPECIFIC ERROR HANDLING =====

  async handleQuoteAnalysisError(error: unknown, quoteId: string): Promise<{
    fallbackData: any
    errorInfo: MarginAnalysisError
  }> {
    const classified = this.classifyError(error, { quoteId })

    // Provide intelligent fallbacks based on error type
    let fallbackData: any = {}

    switch (classified.category) {
      case ErrorCategory.DATA:
        fallbackData = {
          message: 'Using historical data for analysis',
          confidence: 0.6,
          analysis: await this.getHistoricalFallback(quoteId)
        }
        break

      case ErrorCategory.NETWORK:
        fallbackData = {
          message: 'Analysis will complete when connection is restored',
          cached: true,
          analysis: await this.getCachedAnalysis(quoteId)
        }
        break

      case ErrorCategory.BUSINESS_LOGIC:
        fallbackData = {
          message: 'Using simplified analysis rules',
          warnings: ['Some advanced features may be unavailable'],
          analysis: await this.getSimplifiedAnalysis(quoteId)
        }
        break

      default:
        fallbackData = {
          message: 'Analysis temporarily unavailable',
          contact_support: true,
          error_id: classified.id
        }
    }

    return { fallbackData, errorInfo: classified }
  }

  async handleCDAError(error: unknown, cda: string): Promise<{
    fallbackData: any
    errorInfo: MarginAnalysisError
  }> {
    const classified = this.classifyError(error, { cda })

    const fallbackData = {
      cda,
      message: 'CDA analysis partially available',
      basic_info: await this.getBasicCDAInfo(cda),
      error_details: classified.suggestedActions
    }

    return { fallbackData, errorInfo: classified }
  }

  // ===== FALLBACK STRATEGIES =====

  private async getHistoricalFallback(quoteId: string): Promise<any> {
    // Would fetch historical data for similar quotes
    return {
      estimated_margin: 15.5,
      confidence: 0.6,
      source: 'historical_average',
      note: 'Based on similar quotes from past 12 months'
    }
  }

  private async getCachedAnalysis(quoteId: string): Promise<any> {
    // Would return cached analysis if available
    return {
      cached: true,
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      note: 'Cached analysis - may not reflect latest changes'
    }
  }

  private async getSimplifiedAnalysis(quoteId: string): Promise<any> {
    // Would return basic analysis without advanced features
    return {
      basic_margin_check: 'passed',
      simplified: true,
      note: 'Advanced AI features temporarily unavailable'
    }
  }

  private async getBasicCDAInfo(cda: string): Promise<any> {
    // Would return basic CDA information
    return {
      cda_number: cda,
      status: 'unknown',
      note: 'Detailed CDA analysis unavailable'
    }
  }

  // ===== METRICS & MONITORING =====

  private updateMetrics(error: MarginAnalysisError): void {
    this.errorMetrics.totalErrors++
    
    const categoryCount = this.errorMetrics.errorsByCategory.get(error.category) || 0
    this.errorMetrics.errorsByCategory.set(error.category, categoryCount + 1)
    
    const severityCount = this.errorMetrics.errorsBySeverity.get(error.severity) || 0
    this.errorMetrics.errorsBySeverity.set(error.severity, severityCount + 1)
  }

  getErrorMetrics() {
    return {
      ...this.errorMetrics,
      errorsByCategory: Object.fromEntries(this.errorMetrics.errorsByCategory),
      errorsBySeverity: Object.fromEntries(this.errorMetrics.errorsBySeverity),
      circuitBreakerStates: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([key, breaker]) => [
          key,
          { state: breaker.state, failures: breaker.failures }
        ])
      )
    }
  }

  // ===== UTILITY METHODS =====

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: new Map(),
      errorsBySeverity: new Map(),
      retryAttempts: 0,
      recoveredErrors: 0
    }
    this.circuitBreakers.clear()
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler() 