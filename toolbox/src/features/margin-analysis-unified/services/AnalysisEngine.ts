import { 
  AnalysisData, 
  AnalysisProgress, 
  QuoteData, 
  OverallMarginAnalysis, 
  OrderLineAnalysis,
  AnalysisFlag,
  AIInsights
} from '../types'
import { MarginCalculations } from './MarginCalculations'
import { CDAAnalysis } from './CDAAnalysis'

const API_BASE = 'http://localhost:8080/api/margin-analysis/unified'

/**
 * AI ANALYSIS ENGINE
 * 
 * Core service for performing comprehensive margin analysis on quotes.
 * Handles the complete analysis workflow with progress tracking.
 */
export class AnalysisEngine {
  
  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async searchQuotes(query: string): Promise<any[]> {
    if (query.length < 3) {
      throw new Error('Search query must be at least 3 characters long');
    }

    const data = await this.makeRequest(`${API_BASE}/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });

    return data.results.map((result: any) => ({
      id: `${result.type || 'order'}-${result.order_no}`,
      order_no: result.order_no,
      type: result.type,
      display_name: result.display_name,
      customer_no: result.customer_no,
      customer_name: result.customer_name,
      date_entered: result.date_entered,
      sell_value: result.sell_value,
      margin_pct: result.margin_pct,
      status: result.status,
      relevance_score: 1.0 // API doesn't provide this yet
    }));
  }

  async analyzeSelected(
    orderNo: string, 
    orderType: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<any> {
    // Convert frontend type to API type
    const apiOrderType = orderType.toLowerCase() === 'order' ? 'O' : 
                        orderType.toLowerCase() === 'quote' ? 'Q' : 
                        orderType.toUpperCase();
                        
    console.log(`🔍 Analyzing order ${orderNo}, type: ${orderType} -> ${apiOrderType}`);
    
    // Start analysis
    const data = await this.makeRequest(`${API_BASE}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ 
        order_no: orderNo, 
        order_type: apiOrderType 
      })
    });

    return data.analysis;
  }

  async getCustomerHistory(customerNo: string, months: number = 24, companyCode?: string) {
    try {
      const params = new URLSearchParams({ months: months.toString() });
      if (companyCode) {
        params.append('company_code', companyCode);
      }
      
      return await this.makeRequest(`${API_BASE}/customer/${customerNo}/history?${params}`);
    } catch (error) {
      console.warn(`⚠️ Customer history not available for ${customerNo}${companyCode ? ` (company: ${companyCode})` : ''}:`, error);
      return {
        customer_info: {
          customer_no: customerNo,
          customer_name: 'Customer Record Not Found',
          customer_type: null,
          customer_since: null,
          company_code: companyCode || null
        },
        analysis_period: {
          months_analyzed: months,
          start_date: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        },
        metrics: {
          total_orders: 0,
          total_value: 0,
          avg_margin_pct: 0,
          last_12_months: { orders: 0, value: 0, margin_pct: 0 },
          last_6_months: { orders: 0, value: 0, margin_pct: 0 }
        },
        performance_insights: {
          margin_trend: 'unknown',
          order_frequency: 'unknown',
          value_tier: 'unknown'
        },
        error: 'Customer record not found in database'
      };
    }
  }

  async getVendorPerformance(vendorNo: string, months: number = 12, customerNo?: string) {
    const params = new URLSearchParams({ months: months.toString() });
    if (customerNo) params.append('customer_no', customerNo);
    
    return this.makeRequest(`${API_BASE}/vendor/${vendorNo}/performance?${params}`);
  }

  async getCDAAnalysis(customerNo: string, orderNo?: string) {
    const params = orderNo ? `?order_no=${orderNo}` : '';
    return this.makeRequest(`${API_BASE}/cda-analysis/${customerNo}${params}`);
  }

  // Enhanced analysis with additional data
  async getEnhancedAnalysis(
    orderNo: string, 
    orderType: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<any> {
    // Convert frontend type to API type
    const apiOrderType = orderType.toLowerCase() === 'order' ? 'O' : 
                        orderType.toLowerCase() === 'quote' ? 'Q' : 
                        orderType.toUpperCase();
                        
    console.log(`🚀 Enhanced analysis for order ${orderNo}, type: ${orderType} -> ${apiOrderType}`);
    
    // Get basic analysis first
    onProgress?.({
      progress: 25,
      stage: 'analyzing_overall',
      current_action: 'Running comprehensive analysis...'
    });

    const baseAnalysis = await this.analyzeSelected(orderNo, orderType);

    // Get customer history (with error handling)
    onProgress?.({
      progress: 50,
      stage: 'analyzing_lines',
      current_action: 'Analyzing customer history...'
    });

    let customerHistory = null;
    try {
      if (baseAnalysis.customer_info?.customer_no) {
        customerHistory = await this.getCustomerHistory(
          baseAnalysis.customer_info.customer_no,
          24,
          baseAnalysis.customer_info.company_code
        );
      }
    } catch (error) {
      console.warn('⚠️ Customer history unavailable, continuing with basic analysis:', error);
    }

    // Get vendor performance (with error handling)
    onProgress?.({
      progress: 75,
      stage: 'generating_insights',
      current_action: 'Analyzing vendor performance...'
    });

    let vendorPerformance = null;
    try {
      // Extract unique vendors from order lines
      const vendors = new Set<string>();
      baseAnalysis.order_lines?.forEach((line: any) => {
        if (line.vendor_no?.trim()) {
          vendors.add(line.vendor_no.trim());
        }
      });

      if (vendors.size > 0) {
        console.log(`🏭 Found ${vendors.size} unique vendors in order: ${Array.from(vendors).join(', ')}`);
        
        // Get performance for the first vendor (most common case)
        // In the future, could aggregate multiple vendors
        const primaryVendor = Array.from(vendors)[0];
        vendorPerformance = await this.getVendorPerformance(
          primaryVendor,
          12,
          baseAnalysis.customer_info?.customer_no
        );
        
        // Add vendor count info
        vendorPerformance.vendors_in_order = {
          total_vendors: vendors.size,
          analyzed_vendor: primaryVendor,
          all_vendors: Array.from(vendors)
        };
      } else {
        console.log('📝 No vendors found in order lines');
      }
    } catch (error) {
      console.warn('⚠️ Vendor performance unavailable, continuing with basic analysis:', error);
    }

    // Combine everything
    onProgress?.({
      progress: 100,
      stage: 'complete',
      current_action: 'Finalizing analysis...'
    });

    // Return enhanced analysis
    return {
      ...baseAnalysis,
      customer_analysis: {
        ...baseAnalysis.customer_analysis,
        detailed_history: customerHistory
      },
      // DON'T overwrite vendor_analysis - it's already populated by the backend!
      // vendor_analysis: vendorPerformance?.performance_metrics || null,
      enhanced_vendor_performance: vendorPerformance, // Add as separate field if needed
      cda_analysis: null
    };
  }
}

export default AnalysisEngine

// Create and export an instance for easy use
export const analysisEngine = new AnalysisEngine() 