/**
 * High-Performance API Client
 * Features: Request batching, deduplication, rate limiting, offline support
 */

import { cacheManager } from './CacheManager'
import { errorHandler, ErrorCategory } from './ErrorHandler'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTTL?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
  batchable?: boolean
  deduplicateKey?: string
}

interface BatchRequest {
  id: string
  url: string
  config: RequestConfig
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
  priority: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  queueSize: number
}

export class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private requestQueue: BatchRequest[] = []
  private pendingRequests = new Map<string, Promise<any>>()
  private rateLimiter: {
    requests: number[]
    config: RateLimitConfig
  }
  private batchTimeout: NodeJS.Timeout | null = null
  private offlineQueue: BatchRequest[] = []
  private isOnline = true

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    }
    
    this.rateLimiter = {
      requests: [],
      config: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        queueSize: 1000
      }
    }

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      this.isOnline = navigator.onLine
    }
  }

  // ===== MAIN REQUEST METHOD =====

  async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const requestId = this.generateRequestId()
    const fullConfig = this.mergeConfig(config)
    
    // Check for deduplication
    const dedupeKey = config.deduplicateKey || `${config.method || 'GET'}:${url}`
    if (this.pendingRequests.has(dedupeKey)) {
      return this.pendingRequests.get(dedupeKey)!
    }

    // Check cache first
    if (config.cache !== false && (config.method === 'GET' || config.method === undefined)) {
      const cached = await cacheManager.get<T>(this.getCacheKey(url, config))
      if (cached) {
        return cached
      }
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(requestId, url, fullConfig)
    
    // Store for deduplication
    this.pendingRequests.set(dedupeKey, requestPromise)
    
    // Clean up after completion
    requestPromise.finally(() => {
      this.pendingRequests.delete(dedupeKey)
    })

    return requestPromise
  }

  private async executeRequest<T>(requestId: string, url: string, config: RequestConfig): Promise<T> {
    // Check rate limiting
    await this.checkRateLimit()

    // Check if offline and queue if necessary
    if (!this.isOnline && config.method !== 'GET') {
      return this.queueOfflineRequest<T>(requestId, url, config)
    }

    // Execute with error handling and retries
    return errorHandler.withRetry(
      () => this.performRequest<T>(url, config),
      { requestId, url, method: config.method },
      { maxRetries: config.retries || 2 }
    )
  }

  private async performRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const fullURL = this.buildURL(url)
    const headers = { ...this.defaultHeaders, ...config.headers }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(fullURL, {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache successful GET requests
      if (config.cache !== false && (config.method === 'GET' || config.method === undefined)) {
        await cacheManager.set(this.getCacheKey(url, config), data, config.cacheTTL)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // ===== BATCH PROCESSING =====

  async batchRequest<T>(url: string, config: RequestConfig = {}): Promise<T> {
    if (!config.batchable) {
      return this.request<T>(url, config)
    }

    return new Promise<T>((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: this.generateRequestId(),
        url,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: this.getPriorityScore(config.priority || 'medium')
      }

      this.requestQueue.push(batchRequest)
      this.scheduleBatchProcessing()
    })
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.processBatch()
      this.batchTimeout = null
    }, 50) // 50ms batch window
  }

  private async processBatch(): Promise<void> {
    if (this.requestQueue.length === 0) return

    // Sort by priority
    const batch = this.requestQueue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10) // Process up to 10 requests per batch

    this.requestQueue = this.requestQueue.slice(batch.length)

    // Group similar requests
    const groupedRequests = this.groupSimilarRequests(batch)

    // Process each group
    for (const group of groupedRequests) {
      this.processRequestGroup(group).catch(console.error)
    }
  }

  private groupSimilarRequests(requests: BatchRequest[]): BatchRequest[][] {
    const groups: BatchRequest[][] = []
    const processed = new Set<string>()

    for (const request of requests) {
      if (processed.has(request.id)) continue

      const group = [request]
      processed.add(request.id)

      // Find similar requests (same endpoint, method)
      for (const other of requests) {
        if (processed.has(other.id)) continue
        
        if (this.areSimilarRequests(request, other)) {
          group.push(other)
          processed.add(other.id)
        }
      }

      groups.push(group)
    }

    return groups
  }

  private areSimilarRequests(a: BatchRequest, b: BatchRequest): boolean {
    const baseUrlA = a.url.split('?')[0]
    const baseUrlB = b.url.split('?')[0]
    return baseUrlA === baseUrlB && a.config.method === b.config.method
  }

  private async processRequestGroup(group: BatchRequest[]): Promise<void> {
    // If group has only one request, process normally
    if (group.length === 1) {
      const request = group[0]
      try {
        const result = await this.executeRequest(request.id, request.url, request.config)
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
      return
    }

    // For multiple similar requests, check if we can create a batch API call
    if (this.canBatchRequests(group)) {
      await this.executeBatchAPICall(group)
    } else {
      // Process individually with small delays to avoid thundering herd
      for (let i = 0; i < group.length; i++) {
        const request = group[i]
        try {
          const result = await this.executeRequest(request.id, request.url, request.config)
          request.resolve(result)
        } catch (error) {
          request.reject(error)
        }
        
        // Small delay between requests
        if (i < group.length - 1) {
          await this.sleep(10)
        }
      }
    }
  }

  private canBatchRequests(group: BatchRequest[]): boolean {
    // Check if all requests are GET requests to similar endpoints
    return group.every(req => 
      (req.config.method === 'GET' || !req.config.method) &&
      req.url.includes('margin-analysis')
    )
  }

  private async executeBatchAPICall(group: BatchRequest[]): Promise<void> {
    try {
      // Create batch request payload
      const batchPayload = {
        requests: group.map(req => ({
          id: req.id,
          url: req.url,
          method: req.config.method || 'GET',
          body: req.config.body
        }))
      }

      // Execute batch API call
      const batchResponse = await this.performRequest<any>('/api/batch', {
        method: 'POST',
        body: batchPayload
      })

      // Distribute responses
      for (const request of group) {
        const response = batchResponse.responses?.find((r: any) => r.id === request.id)
        if (response?.success) {
          request.resolve(response.data)
        } else {
          request.reject(new Error(response?.error || 'Batch request failed'))
        }
      }
    } catch (error) {
      // Fallback to individual requests
      for (const request of group) {
        request.reject(error)
      }
    }
  }

  // ===== RATE LIMITING =====

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.config.windowMs
    )

    // Check if we're at the limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.config.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests)
      const waitTime = this.rateLimiter.config.windowMs - (now - oldestRequest)
      
      if (waitTime > 0) {
        await this.sleep(waitTime)
        return this.checkRateLimit()
      }
    }

    // Add current request to tracker
    this.rateLimiter.requests.push(now)
  }

  // ===== OFFLINE SUPPORT =====

  private async queueOfflineRequest<T>(requestId: string, url: string, config: RequestConfig): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const offlineRequest: BatchRequest = {
        id: requestId,
        url,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: this.getPriorityScore(config.priority || 'medium')
      }

      this.offlineQueue.push(offlineRequest)
      
      // Set timeout for offline requests
      setTimeout(() => {
        reject(new Error('Request timed out while offline'))
      }, 30000)
    })
  }

  private async handleOnline(): Promise<void> {
    this.isOnline = true
    console.log('Connection restored. Processing queued requests...')

    // Process offline queue
    const queuedRequests = [...this.offlineQueue]
    this.offlineQueue = []

    for (const request of queuedRequests) {
      try {
        const result = await this.executeRequest(request.id, request.url, request.config)
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }
  }

  private handleOffline(): void {
    this.isOnline = false
    console.log('Connection lost. Requests will be queued...')
  }

  // ===== MARGIN ANALYSIS SPECIFIC METHODS =====

  async analyzeQuote(quoteId: string): Promise<any> {
    return this.request(`/api/margin-analysis/analyze-quote-ai/${quoteId}`, {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      priority: 'high',
      batchable: true
    })
  }

  async getCustomerHistory(customerId: string): Promise<any> {
    return this.request(`/api/margin-analysis/customer-history/${customerId}`, {
      cache: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      priority: 'medium',
      batchable: true,
      deduplicateKey: `customer:${customerId}`
    })
  }

  async getCDAAnalysis(cda: string): Promise<any> {
    return this.request(`/api/margin-analysis/cda-performance/${cda}`, {
      cache: true,
      cacheTTL: 60 * 60 * 1000, // 1 hour
      priority: 'medium',
      batchable: true
    })
  }

  async getVendorAnalysis(vendorId: string): Promise<any> {
    return this.request(`/api/margin-analysis/vendors/${vendorId}/enhanced`, {
      method: 'POST',
      cache: true,
      cacheTTL: 20 * 60 * 1000, // 20 minutes
      priority: 'medium'
    })
  }

  async streamLargeDataset(endpoint: string, callback: (chunk: any) => void): Promise<void> {
    // Simulated streaming for large datasets
    const response = await this.performRequest<any>(endpoint, { method: 'GET' })
    
    if (response.chunks) {
      for (const chunk of response.chunks) {
        callback(chunk)
        await this.sleep(50) // Prevent UI blocking
      }
    } else {
      callback(response)
    }
  }

  // ===== UTILITY METHODS =====

  private mergeConfig(config: RequestConfig): RequestConfig {
    return {
      timeout: 30000,
      retries: 2,
      cache: true,
      priority: 'medium',
      batchable: false,
      ...config
    }
  }

  private buildURL(path: string): string {
    if (path.startsWith('http')) return path
    return `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`
  }

  private getCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET'
    const body = config.body ? JSON.stringify(config.body) : ''
    return `api:${method}:${url}:${body}`
  }

  private getPriorityScore(priority: string): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 }
    return scores[priority as keyof typeof scores] || 2
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ===== CONFIGURATION METHODS =====

  setRateLimit(config: Partial<RateLimitConfig>): void {
    this.rateLimiter.config = { ...this.rateLimiter.config, ...config }
  }

  updateDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  // ===== METRICS =====

  getMetrics() {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.length,
      offlineQueueSize: this.offlineQueue.length,
      isOnline: this.isOnline,
      rateLimitRequests: this.rateLimiter.requests.length,
      cacheMetrics: cacheManager.getMetrics()
    }
  }

  // Reset for testing
  reset(): void {
    this.requestQueue = []
    this.pendingRequests.clear()
    this.offlineQueue = []
    this.rateLimiter.requests = []
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }
}

// Create singleton instances for different API types
export const marginAnalysisAPI = new APIClient('/api/margin-analysis')
export const coreAPI = new APIClient('/api')

// Default export for main usage
export default marginAnalysisAPI 