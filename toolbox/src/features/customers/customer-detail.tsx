import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileText, ShoppingCart, Receipt, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { QuotesTable } from './components/quotes-table';
import { OrdersTable } from './components/orders-table';
import { InvoicesTable } from './components/invoices-table';
import { CustomerOverviewCards } from './components/customer-overview-cards';

interface Customer {
  customer_no: string;
  name: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  salesperson_id?: string;
  credit_limit?: number;
  ar_balance?: number;
  last_invoice_date?: string;
  last_order_date?: string;
}

interface CustomerSummary {
  quote_count: number;
  order_count: number;
  invoice_count: number;
  total_quote_value: number;
  total_order_value: number;
  total_invoice_value: number;
  last_invoice_date?: string;
  last_order_date?: string;
  last_quote_date?: string;
}

export default function CustomerDetail() {
  const { customerNo } = useParams({ from: '/customers/$customerNo' });
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerNo) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get(`/customers/${customerNo}/overview`);
        setCustomer(response.data.customer);
        setSummary(response.data.summary);
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err.response?.data?.error || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerNo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Customer not found'}</p>
          <Button onClick={() => navigate({ to: '/customers' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate({ to: '/customers' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Customer #{customer.customer_no}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          Active Account
        </Badge>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm">
                {customer.address_1 && <span>{customer.address_1}<br /></span>}
                {customer.address_2 && <span>{customer.address_2}<br /></span>}
                {customer.city && customer.state && (
                  <span>{customer.city}, {customer.state} {customer.zip}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Limit</p>
              <p className="text-sm">{customer.credit_limit ? formatCurrency(customer.credit_limit) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">AR Balance</p>
              <p className="text-sm">{customer.ar_balance ? formatCurrency(customer.ar_balance) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Quotes ({summary?.quote_count || 0})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders ({summary?.order_count || 0})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices ({summary?.invoice_count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CustomerOverviewCards summary={summary} />
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <QuotesTable customerNo={customerNo} />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersTable customerNo={customerNo} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesTable customerNo={customerNo} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 