import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ShoppingCart, Receipt, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

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

interface Props {
  summary: CustomerSummary | null;
}

export function CustomerOverviewCards({ summary }: Props) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Quotes',
      value: summary.quote_count,
      subValue: formatCurrency(summary.total_quote_value),
      icon: FileText,
      description: 'Active quotes',
    },
    {
      title: 'Total Orders',
      value: summary.order_count,
      subValue: formatCurrency(summary.total_order_value),
      icon: ShoppingCart,
      description: 'Completed orders',
    },
    {
      title: 'Total Invoices',
      value: summary.invoice_count,
      subValue: formatCurrency(summary.total_invoice_value),
      icon: Receipt,
      description: 'Invoiced amount',
    },
    {
      title: 'Last Quote',
      value: summary.last_quote_date ? formatDate(summary.last_quote_date) : 'N/A',
      subValue: '',
      icon: Calendar,
      description: 'Most recent quote',
    },
    {
      title: 'Last Order',
      value: summary.last_order_date ? formatDate(summary.last_order_date) : 'N/A',
      subValue: '',
      icon: Calendar,
      description: 'Most recent order',
    },
    {
      title: 'Last Invoice',
      value: summary.last_invoice_date ? formatDate(summary.last_invoice_date) : 'N/A',
      subValue: '',
      icon: Calendar,
      description: 'Most recent invoice',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subValue && (
                <p className="text-xs text-muted-foreground">{card.subValue}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 