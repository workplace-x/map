import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, Building2, DollarSign, Activity, Users } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface VendorData {
  vendor_id: string;
  vendor_name: string;
  status: 'active' | 'dormant' | 'inactive' | 'new';
  lifetime_spend: number;
  spend_12mo: number;
  spend_trend: number;
  performance_pct: number;
  margin_variance: number;
  total_orders: number;
  avg_order_value: number;
  catalog_diversity: number;
  customer_diversity: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  days_since_activity: number;
  recent_activity: string;
  order_details: {
    order_value: number;
    order_margin_pct: number;
    order_count: number;
    order_lines: number;
  };
  invoice_details: {
    invoice_value: number;
    invoice_margin_pct: number;
    invoice_count: number;
    invoice_lines: number;
  };
}

interface VendorIntelligenceResponse {
  vendors: VendorData[];
  summary: {
    total_vendors: number;
    active_vendors: number;
    dormant_vendors: number;
    inactive_vendors: number;
    new_vendors: number;
    total_spend: number;
    spend_12mo: number;
    avg_performance: number;
    risk_breakdown: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  insights: string[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    has_more: boolean;
  };
}

const VendorIntelligenceList: React.FC = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [summary, setSummary] = useState<VendorIntelligenceResponse['summary'] | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lifetime_spend');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        risk_level: riskFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: '100'
      });

             const response = await fetch(`https://tangram-marketing-functions.azurewebsites.net/api/vendor-intelligence-fast?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VendorIntelligenceResponse = await response.json();
      
      setVendors(data.vendors || []);
      setSummary(data.summary || null);
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Error fetching vendor intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, statusFilter, riskFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'dormant': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (pct: number) => {
    return `${pct.toFixed(1)}%`;
  };

  const handleVendorClick = (vendorId: string) => {
    navigate({ to: `/vendors/${vendorId}` });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading vendor data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={fetchVendors}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Intelligence</h1>
          <p className="text-gray-600">Real-time vendor analytics with comprehensive spend tracking and performance insights</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold">{summary.total_vendors}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex space-x-2 mt-2 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{summary.active_vendors} Active</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{summary.inactive_vendors} Inactive</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_spend)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {formatCurrency(summary.spend_12mo)} in last 12 months
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold">{formatPercentage(summary.avg_performance)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Portfolio margin performance</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Vendors</p>
                <p className="text-2xl font-bold text-red-600">{summary.risk_breakdown.high + summary.risk_breakdown.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{summary.risk_breakdown.critical} critical attention needed</p>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Key Insights</h3>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-700">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vendors..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="dormant">Dormant</option>
                <option value="inactive">Inactive</option>
                <option value="new">New</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="lifetime_spend">Total Spend</option>
                <option value="spend_12mo">12-Month Spend</option>
                <option value="performance_pct">Performance</option>
                <option value="margin_variance">Margin Variance</option>
                <option value="days_since_activity">Recent Activity</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Vendor List */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend Analysis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diversity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr 
                  key={vendor.vendor_id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVendorClick(vendor.vendor_id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.vendor_name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                            {vendor.status}
                          </span>
                          <span className="text-xs text-gray-500">ID: {vendor.vendor_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{formatPercentage(vendor.performance_pct)}</div>
                      <div className="flex items-center mt-1">
                        {vendor.margin_variance > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : vendor.margin_variance < 0 ? (
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        ) : null}
                        <span className={`text-xs ${vendor.margin_variance > 0 ? 'text-green-600' : vendor.margin_variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {vendor.margin_variance > 0 ? '+' : ''}{formatPercentage(vendor.margin_variance)} vs planned
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{formatCurrency(vendor.lifetime_spend)}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(vendor.spend_12mo)} (12mo) • {vendor.total_orders} orders
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="font-medium">{vendor.catalog_diversity}</div>
                          <div className="text-xs text-gray-500">Products</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{vendor.customer_diversity}</div>
                          <div className="text-xs text-gray-500">Customers</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(vendor.risk_level)}`}>
                        {vendor.risk_level}
                      </span>
                      {vendor.risk_factors.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {vendor.risk_factors[0]}
                          {vendor.risk_factors.length > 1 && ` +${vendor.risk_factors.length - 1} more`}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {vendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorIntelligenceList; 