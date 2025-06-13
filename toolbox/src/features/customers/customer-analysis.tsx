import { useParams, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Percent, Calendar, Activity } from 'lucide-react'
import { useCustomerAnalysis } from '@/hooks/api-hooks'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import 'ag-grid-enterprise/styles/ag-theme-quartz.css'

interface CustomerAnalysisPageProps {
  customerNo: string;
}

// Define interface for invoice line data
interface InvoiceLine {
  invoice_date: string;
  quantity_invoiced: number;
  unit_sell: number;
  unit_cost: number;
  [key: string]: any; // Allow additional properties
}

// Format large numbers with K/M suffix
const formatLargeNumber = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

// Performance indicator component
const PerformanceIndicator = ({ current, previous, label }: { current: number; previous: number; label: string }) => {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  const isPositive = change >= 0;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {changePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default function CustomerAnalysisPage() {
  const { customerNo } = useParams({ from: '/_authenticated/customers/$customerNo/analysis' } as const);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    data: analysis,
    isLoading,
    error
  } = useCustomerAnalysis(customerNo);

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading customer analysis...</p>
            </div>
          </div>
        </Main>
      </>
    );
  }

  if (error || !analysis) {
    return (
      <>
        <Header fixed>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive">Failed to load customer analysis</p>
              <p className="text-muted-foreground text-sm mt-1">
                {error?.message || 'Customer not found'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/customers">Back to Customers</Link>
              </Button>
            </div>
          </div>
        </Main>
      </>
    );
  }

  // Prepare chart data
  const yearlyChartData = analysis.yearly.map(item => ({
    year: item.year,
    sales: item.sell,
    margin: item.margin,
    marginPercent: item.sell > 0 ? (item.margin / item.sell) * 100 : 0,
  }));

  const monthlyChartData = analysis.monthly.map(item => ({
    month: item.month,
    sales: item.sell,
    margin: item.margin,
    marginPercent: item.sell > 0 ? (item.margin / item.sell) * 100 : 0,
  }));

  // AG Grid column definitions for invoice lines
  const invoiceColumnDefs: ColDef<InvoiceLine>[] = [
    {
      headerName: 'Date',
      field: 'invoice_date',
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
      width: 120,
    },
    {
      headerName: 'Quantity',
      field: 'quantity_invoiced',
      type: 'numericColumn',
      valueFormatter: (params) => params.value?.toLocaleString(),
      width: 100,
    },
    {
      headerName: 'Unit Sell',
      field: 'unit_sell',
      type: 'numericColumn',
      valueFormatter: (params) => formatCurrency(params.value),
      width: 120,
    },
    {
      headerName: 'Unit Cost',
      field: 'unit_cost',
      type: 'numericColumn',
      valueFormatter: (params) => formatCurrency(params.value),
      width: 120,
    },
    {
      headerName: 'Line Total',
      valueGetter: (params) => (params.data!.unit_sell * params.data!.quantity_invoiced),
      valueFormatter: (params) => formatCurrency(params.value),
      width: 130,
      type: 'numericColumn',
    },
    {
      headerName: 'Line Margin',
      valueGetter: (params) => ((params.data!.unit_sell - params.data!.unit_cost) * params.data!.quantity_invoiced),
      valueFormatter: (params) => formatCurrency(params.value),
      width: 130,
      type: 'numericColumn',
    },
    {
      headerName: 'Margin %',
      valueGetter: (params) => params.data!.unit_sell > 0 ? ((params.data!.unit_sell - params.data!.unit_cost) / params.data!.unit_sell) * 100 : 0,
      valueFormatter: (params) => `${params.value?.toFixed(1)}%`,
      width: 100,
      type: 'numericColumn',
    },
  ];

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        {/* Header with back button */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{analysis.customerName}</h1>
              <p className="text-muted-foreground">Customer #{analysis.customerNo}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLargeNumber(analysis.totalSell)}</div>
              <p className="text-xs text-muted-foreground">
                12mo: {formatLargeNumber(analysis.sell12mo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLargeNumber(analysis.totalMargin)}</div>
              <p className="text-xs text-muted-foreground">
                12mo: {formatLargeNumber(analysis.margin12mo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Margin %</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.avgMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                12mo: {analysis.avgMargin12mo.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoice Lines</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.invoiceLines.length.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Year-over-year comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PerformanceIndicator
                current={analysis.sell12mo}
                previous={analysis.totalSell - analysis.sell12mo}
                label="Sales Trend"
              />
              <PerformanceIndicator
                current={analysis.margin12mo}
                previous={analysis.totalMargin - analysis.margin12mo}
                label="Margin Trend"
              />
              <PerformanceIndicator
                current={analysis.avgMargin12mo}
                previous={analysis.avgMargin}
                label="Margin % Trend"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Yearly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Yearly Performance</CardTitle>
                  <CardDescription>Sales and margin by year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          name === 'marginPercent' ? `${value.toFixed(1)}%` : formatCurrency(value),
                          name === 'sales' ? 'Sales' : name === 'margin' ? 'Margin' : 'Margin %'
                        ]}
                      />
                      <Bar dataKey="sales" fill="#8884d8" name="sales" />
                      <Bar dataKey="margin" fill="#82ca9d" name="margin" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>Recent monthly trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData.slice(-12)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          name === 'marginPercent' ? `${value.toFixed(1)}%` : formatCurrency(value),
                          name === 'sales' ? 'Sales' : name === 'margin' ? 'Margin' : 'Margin %'
                        ]}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="margin" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Margin Percentage Trends</CardTitle>
                <CardDescription>Track margin percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Margin %']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marginPercent" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Line Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of all invoice lines for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="ag-theme-quartz" style={{ height: 500 }}>
                  <AgGridReact<InvoiceLine>
                    columnDefs={invoiceColumnDefs}
                    rowData={analysis.invoiceLines}
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                      filter: true,
                    }}
                    pagination={true}
                    paginationPageSize={20}
                    animateRows={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
} 