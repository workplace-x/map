import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface QuoteLine {
  line_no: number;
  item_no: string;
  description: string;
  qty_ordered: number;
  unit_sell: number;
  unit_cost: number;
  line_sell: number;
  line_cost: number;
  line_margin: number;
  margin_pct: number;
  vnd_no: string;
  vendor_name: string;
}

interface Props {
  quoteNo: string;
}

export function QuoteLinesTable({ quoteNo }: Props) {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuoteLines = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/quotes/${quoteNo}/lines`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote lines');
        }
        const data = await response.json();
        setLines(data);
      } catch (err: any) {
        console.error('Error fetching quote lines:', err);
        setError(err.message || 'Failed to load quote lines');
      } finally {
        setLoading(false);
      }
    };

    if (quoteNo) {
      fetchQuoteLines();
    }
  }, [quoteNo]);

  const columnDefs: ColDef[] = [
    {
      headerName: 'Line #',
      field: 'line_no',
      width: 80,
      pinned: 'left',
    },
    {
      headerName: 'Item #',
      field: 'item_no',
      width: 120,
    },
    {
      headerName: 'Description',
      field: 'description',
      width: 300,
      flex: 1,
    },
    {
      headerName: 'Qty',
      field: 'qty_ordered',
      width: 80,
      type: 'rightAligned',
    },
    {
      headerName: 'Unit Sell',
      field: 'unit_sell',
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Unit Cost',
      field: 'unit_cost',
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Line Sell',
      field: 'line_sell',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Line Cost',
      field: 'line_cost',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      headerName: 'Margin',
      field: 'line_margin',
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
    {
      headerName: 'Vendor',
      field: 'vendor_name',
      width: 150,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote Lines - {quoteNo}</CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle>Quote Lines - {quoteNo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Lines - {quoteNo} ({lines.length} items)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
          <AgGridReact
            rowData={lines}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={10}
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
  );
} 