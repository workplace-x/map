/**
 * High-Performance Cache Manager
 * Provides intelligent caching with TTL, LRU eviction, and cache warming
 */

interface CacheEntry<T> {
  data: T
  expiry: number
  hits: number
  lastAccessed: number
  size: number
}

interface CacheConfig {
  maxSize: number
  defaultTTL: number
  enableMetrics: boolean
  compressionThreshold: number
  warmingStrategies: string[]
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB default
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableMetrics: true,
      compressionThreshold: 1024, // 1KB
      warmingStrategies: ['prediction', 'frequency'],
      ...config
    }
  }

  // ===== INTELLIGENT CACHING =====

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.metrics.misses++
      return null
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.metrics.misses++
      this.metrics.totalSize -= entry.size
      return null
    }

    // Update access metrics
    entry.hits++
    entry.lastAccessed = Date.now()
    this.metrics.hits++

    return entry.data
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const size = this.calculateSize(data)
    const expiry = Date.now() + (ttl || this.config.defaultTTL)

    // Check if we need to evict entries
    await this.ensureCapacity(size)

    // Compress large data
    const processedData = size > this.config.compressionThreshold 
      ? await this.compress(data) 
      : data

    this.cache.set(key, {
      data: processedData,
      expiry,
      hits: 0,
      lastAccessed: Date.now(),
      size
    })

    this.metrics.totalSize += size
  }

  // ===== MARGIN-SPECIFIC CACHING STRATEGIES =====

  async getMarginAnalysis(quoteId: string): Promise<any> {
    return this.get(`margin:analysis:${quoteId}`)
  }

  async setMarginAnalysis(quoteId: string, analysis: any): Promise<void> {
    // Margin analysis cached for 10 minutes (business critical)
    await this.set(`margin:analysis:${quoteId}`, analysis, 10 * 60 * 1000)
  }

  async getCDAData(cda: string): Promise<any> {
    return this.get(`cda:data:${cda}`)
  }

  async setCDAData(cda: string, data: any): Promise<void> {
    // CDA data cached for 1 hour (relatively stable)
    await this.set(`cda:data:${cda}`, data, 60 * 60 * 1000)
  }

  async getCustomerHistory(customerId: string): Promise<any> {
    return this.get(`customer:history:${customerId}`)
  }

  async setCustomerHistory(customerId: string, history: any): Promise<void> {
    // Customer history cached for 30 minutes
    await this.set(`customer:history:${customerId}`, history, 30 * 60 * 1000)
  }

  async getVendorAnalysis(vendorId: string): Promise<any> {
    return this.get(`vendor:analysis:${vendorId}`)
  }

  async setVendorAnalysis(vendorId: string, analysis: any): Promise<void> {
    // Vendor analysis cached for 20 minutes
    await this.set(`vendor:analysis:${vendorId}`, analysis, 20 * 60 * 1000)
  }

  // ===== PREDICTIVE CACHE WARMING =====

  async warmCache(strategy: 'customer_patterns' | 'quote_predictions' | 'vendor_trends'): Promise<void> {
    switch (strategy) {
      case 'customer_patterns':
        await this.warmCustomerPatterns()
        break
      case 'quote_predictions':
        await this.warmQuotePredictions()
        break
      case 'vendor_trends':
        await this.warmVendorTrends()
        break
    }
  }

  private async warmCustomerPatterns(): Promise<void> {
    // Pre-load frequently accessed customer data
    const topCustomers = await this.getTopAccessedCustomers()
    for (const customerId of topCustomers) {
      // Load in background without blocking
      this.preloadCustomerData(customerId).catch(console.error)
    }
  }

  private async warmQuotePredictions(): Promise<void> {
    // Pre-calculate margin predictions for active quotes
    const activeQuotes = await this.getActiveQuotes()
    for (const quoteId of activeQuotes) {
      this.preloadQuoteAnalysis(quoteId).catch(console.error)
    }
  }

  private async warmVendorTrends(): Promise<void> {
    // Pre-load vendor analysis for key partners
    const keyVendors = ['steelcase', 'tangram'] // Primary partners
    for (const vendorId of keyVendors) {
      this.preloadVendorAnalysis(vendorId).catch(console.error)
    }
  }

  // ===== INTELLIGENT EVICTION =====

  private async ensureCapacity(requiredSize: number): Promise<void> {
    if (this.metrics.totalSize + requiredSize <= this.config.maxSize) {
      return
    }

    // LRU eviction with access frequency consideration
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: this.calculateEvictionScore(entry)
      }))
      .sort((a, b) => a.score - b.score)

    // Evict lowest scoring entries
    let freedSize = 0
    for (const { key, entry } of entries) {
      if (freedSize >= requiredSize) break
      
      this.cache.delete(key)
      freedSize += entry.size
      this.metrics.evictions++
      this.metrics.totalSize -= entry.size
    }
  }

  private calculateEvictionScore(entry: CacheEntry<any>): number {
    const age = Date.now() - entry.lastAccessed
    const frequency = entry.hits
    const size = entry.size

    // Lower score = higher priority for eviction
    // Factor in recency, frequency, and size
    return (age / 1000) - (frequency * 100) + (size / 1024)
  }

  // ===== COMPRESSION & OPTIMIZATION =====

  private async compress<T>(data: T): Promise<T> {
    // Simple JSON compression (in production, use proper compression)
    if (typeof data === 'object') {
      return JSON.parse(JSON.stringify(data)) as T
    }
    return data
  }

  private calculateSize(data: any): number {
    // Rough size calculation
    return JSON.stringify(data).length * 2 // UTF-16 approximation
  }

  // ===== CACHE INVALIDATION =====

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        const entry = this.cache.get(key)
        if (entry) {
          this.metrics.totalSize -= entry.size
        }
        this.cache.delete(key)
      }
    }
  }

  invalidateCustomer(customerId: string): void {
    this.invalidatePattern(`customer:*:${customerId}`)
  }

  invalidateQuote(quoteId: string): void {
    this.invalidatePattern(`*:*:${quoteId}`)
  }

  invalidateVendor(vendorId: string): void {
    this.invalidatePattern(`vendor:*:${vendorId}`)
  }

  // ===== METRICS & MONITORING =====

  getMetrics() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses)
    return {
      ...this.metrics,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      cacheSize: this.cache.size,
      memoryUsage: this.metrics.totalSize
    }
  }

  clear(): void {
    this.cache.clear()
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    }
  }

  // ===== HELPER METHODS =====

  private async getTopAccessedCustomers(): Promise<string[]> {
    // Mock implementation - would query actual usage analytics
    return ['customer_123', 'customer_456', 'customer_789']
  }

  private async getActiveQuotes(): Promise<string[]> {
    // Mock implementation - would query for active quotes
    return ['quote_123', 'quote_456', 'quote_789']
  }

  private async preloadCustomerData(customerId: string): Promise<void> {
    // Would trigger actual data loading in background
    console.log(`Preloading customer data for ${customerId}`)
  }

  private async preloadQuoteAnalysis(quoteId: string): Promise<void> {
    // Would trigger actual quote analysis in background
    console.log(`Preloading quote analysis for ${quoteId}`)
  }

  private async preloadVendorAnalysis(vendorId: string): Promise<void> {
    // Would trigger actual vendor analysis in background
    console.log(`Preloading vendor analysis for ${vendorId}`)
  }
}

// Singleton instance for app-wide usage
export const cacheManager = new CacheManager() 