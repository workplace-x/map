import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { QuoteLinesTable } from './quote-lines-table';

interface Quote {
  quote_no: string;
  order_index: number;
  quote_title: string;
  date_entered: string;
  order_status: string;
  salesperson_name: string;
  total_sell: number;
  total_cost: number;
  total_margin: number;
  margin_pct: number;
  line_count: number;
}

interface Props {
  customerNo: string;
}

export function QuotesTable({ customerNo }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.getCustomerQuotes(customerNo);
        setQuotes(response);
      } catch (err: any) {
        console.error('Error fetching quotes:', err);
        setError(err.response?.data?.error || 'Failed to load quotes');
      } finally {
        setLoading(false);
      }
    };

    if (customerNo) {
      fetchQuotes();
    }
  }, [customerNo]);

  const toggleQuoteExpansion = (quoteNo: string) => {
    setExpandedQuote(expandedQuote === quoteNo ? null : quoteNo);
  };

  const actionsCellRenderer = (params: any) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleQuoteExpansion(params.data.quote_no)}
      >
        {expandedQuote === params.data.quote_no ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        Lines ({params.data.line_count})
      </Button>
    </div>
  );

  const statusCellRenderer = (params: any) => {
    const status = params.value;
    const variant = status === 'Open' ? 'default' : 
                   status === 'Closed' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: actionsCellRenderer,
      width: 150,
      pinned: 'left',
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Quote #',
      field: 'quote_no',
      width: 120,
      pinned: 'left',
    },
    {
      headerName: 'Title',
      field: 'quote_title',
      width: 200,
      flex: 1,
    },
    {
      headerName: 'Date',
      field: 'date_entered',
      width: 120,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      headerName: 'Status',
      field: 'order_status',
      width: 100,
      cellRenderer: statusCellRenderer,
    },
    {
      headerName: 'Salesperson',
      field: 'salesperson_name',
      width: 150,
    },
    {
      headerName: 'Total Sell',
      field: 'total_sell',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Total Cost',
      field: 'total_cost',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Margin',
      field: 'total_margin',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Margin %',
      field: 'margin_pct',
      width: 100,
      valueFormatter: (params) => formatPercentage(params.value),
      type: 'rightAligned',
      cellStyle: (params) => ({
        color: params.value < 0 ? '#ef4444' : params.value < 10 ? '#f59e0b' : '#10b981'
      }),
    },
  ];

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Customer Quotes ({quotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
            <AgGridReact
              rowData={quotes}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              pagination={true}
              paginationPageSize={20}
              suppressRowClickSelection={true}
              animateRows={true}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {expandedQuote && (
        <QuoteLinesTable quoteNo={expandedQuote} />
      )}
    </div>
  );
} 