import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { 
  ArrowLeft, Building2, TrendingUp, TrendingDown, AlertTriangle, 
  DollarSign, Package, Users, Calendar, BarChart3, Target,
  CheckCircle, XCircle, Clock, Zap
} from 'lucide-react';

interface VendorDetails {
  vendor_id: string;
  vendor_name: string;
  status: 'active' | 'dormant' | 'inactive' | 'new';
  lifetime_spend: number;
  spend_12mo: number;
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
  first_activity: string;
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

const VendorDetails: React.FC = () => {
  const { vendorId } = useParams({ from: '/_authenticated/vendors/$vendorId' });
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!vendorId) return;

      try {
        setLoading(true);
        setError(null);

        // For now, we'll fetch from the main list and find the specific vendor
        // In production, this would use the dedicated vendor detail endpoint
                 const response = await fetch(`https://tangram-marketing-functions.azurewebsites.net/api/vendor-intelligence-fast-details/${vendorId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.vendor) {
          setVendor(data.vendor);
        } else {
          throw new Error('Vendor not found');
        }
      } catch (err) {
        console.error('Error fetching vendor details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor details');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [vendorId]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const getPerformanceInsights = (vendor: VendorDetails) => {
    const insights = [];
    
    if (vendor.margin_variance > 5) {
      insights.push({
        type: 'positive',
        icon: CheckCircle,
        message: `Delivering ${formatPercentage(vendor.margin_variance)} better margins than planned`
      });
    } else if (vendor.margin_variance < -5) {
      insights.push({
        type: 'negative',
        icon: XCircle,
        message: `Underperforming by ${formatPercentage(Math.abs(vendor.margin_variance))} vs planned margins`
      });
    }

    if (vendor.performance_pct > 25) {
      insights.push({
        type: 'positive',
        icon: Target,
        message: 'Excellent overall performance above 25% margin'
      });
    } else if (vendor.performance_pct < 10) {
      insights.push({
        type: 'negative',
        icon: AlertTriangle,
        message: 'Performance below 10% margin threshold'
      });
    }

    if (vendor.days_since_activity > 90) {
      insights.push({
        type: 'warning',
        icon: Clock,
        message: `No activity for ${vendor.days_since_activity} days - relationship may be dormant`
      });
    }

    if (vendor.catalog_diversity > 10) {
      insights.push({
        type: 'positive',
        icon: Package,
        message: `High product diversity with ${vendor.catalog_diversity} different catalog items`
      });
    }

    return insights;
  };

  const getRecommendations = (vendor: VendorDetails) => {
    const recommendations = [];

    if (vendor.margin_variance > 10) {
      recommendations.push('Study this vendor\'s practices - potential model for other relationships');
    }

    if (vendor.margin_variance < -10) {
      recommendations.push('Review pricing strategy and consider renegotiation');
    }

    if (vendor.risk_level === 'critical') {
      recommendations.push('Immediate attention required - consider alternative vendors');
    }

    if (vendor.catalog_diversity < 3) {
      recommendations.push('Explore additional product categories to diversify relationship');
    }

    if (vendor.customer_diversity === 1) {
      recommendations.push('Single customer dependency - monitor relationship health');
    }

    if (vendor.spend_12mo < vendor.lifetime_spend * 0.2) {
      recommendations.push('Declining volume trend - investigate relationship status');
    }

    return recommendations;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate({ to: '..' })}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendor Intelligence
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading vendor details</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'Vendor not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const insights = getPerformanceInsights(vendor);
  const recommendations = getRecommendations(vendor);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate({ to: '..' })}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.vendor_name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                {vendor.status}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(vendor.risk_level)}`}>
                {vendor.risk_level} risk
              </span>
              <span className="text-sm text-gray-500">ID: {vendor.vendor_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold">{formatCurrency(vendor.lifetime_spend)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {formatCurrency(vendor.spend_12mo)} in last 12 months
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance</p>
              <p className="text-2xl font-bold">{formatPercentage(vendor.performance_pct)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex items-center mt-2">
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

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Order Activity</p>
              <p className="text-2xl font-bold">{vendor.total_orders}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Avg: {formatCurrency(vendor.avg_order_value)} per order
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Diversity</p>
              <p className="text-2xl font-bold">{vendor.catalog_diversity}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {vendor.customer_diversity} customers served
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'performance', label: 'Performance Analysis' },
            { key: 'insights', label: 'AI Insights' },
            { key: 'recommendations', label: 'Recommendations' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order vs Invoice Analysis */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Planned vs Actual Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Orders (Planned)</span>
                    <span className="text-sm font-bold">{formatCurrency(vendor.order_details.order_value)}</span>
                  </div>
                  <div className="bg-blue-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (vendor.order_details.order_value / vendor.lifetime_spend) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{vendor.order_details.order_count} orders</span>
                    <span>{formatPercentage(vendor.order_details.order_margin_pct)} margin</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Invoices (Actual)</span>
                    <span className="text-sm font-bold">{formatCurrency(vendor.invoice_details.invoice_value)}</span>
                  </div>
                  <div className="bg-green-100 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (vendor.invoice_details.invoice_value / vendor.lifetime_spend) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{vendor.invoice_details.invoice_count} invoices</span>
                    <span>{formatPercentage(vendor.invoice_details.invoice_margin_pct)} margin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">First Activity</p>
                    <p className="text-sm text-gray-600">{formatDate(vendor.first_activity)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Recent Activity</p>
                    <p className="text-sm text-gray-600">{formatDate(vendor.recent_activity)} ({vendor.days_since_activity} days ago)</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Relationship Duration</p>
                    <p className="text-sm text-gray-600">
                      {Math.round((new Date().getTime() - new Date(vendor.first_activity).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Margin Performance</span>
                  <span className="text-sm font-bold">{formatPercentage(vendor.performance_pct)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Planned vs Actual Variance</span>
                  <span className={`text-sm font-bold ${vendor.margin_variance > 0 ? 'text-green-600' : vendor.margin_variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {vendor.margin_variance > 0 ? '+' : ''}{formatPercentage(vendor.margin_variance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="text-sm font-bold">{formatCurrency(vendor.avg_order_value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">12-Month Spend Ratio</span>
                  <span className="text-sm font-bold">{formatPercentage((vendor.spend_12mo / vendor.lifetime_spend) * 100)}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(vendor.risk_level)}`}>
                    {vendor.risk_level}
                  </span>
                </div>
                {vendor.risk_factors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Risk Factors:</p>
                    <ul className="space-y-1">
                      {vendor.risk_factors.map((factor, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mr-2" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => {
                const IconComponent = insight.icon;
                const colorClasses = {
                  positive: 'bg-green-50 border-green-200 text-green-800',
                  negative: 'bg-red-50 border-red-200 text-red-800',
                  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
                };
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${colorClasses[insight.type as keyof typeof colorClasses]}`}>
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 mr-3" />
                      <p className="text-sm font-medium">{insight.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Zap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Insights will be generated as more data becomes available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-blue-500 mr-3" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This vendor is performing well with no immediate action needed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetails; 