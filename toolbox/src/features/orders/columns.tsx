import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '../tasks/components/data-table-column-header'
import { Link } from '@tanstack/react-router'

export type Order = {
  quote_no: string
  customer_name: string
  order_title: string
  salesperson_name: string
  date_created: string
  status: string
  total_sell?: number
  total_cost?: number
  overall_margin_pct: number
  low_margin_line_count: number
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'order_title',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Order Title' />,
    cell: info => info.getValue(),
    enableSorting: true,
    minSize: 240,
  },
  {
    accessorKey: 'quote_no',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Order #' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'customer_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer Name' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'salesperson_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Salesperson' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'date_created',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Date Created' />,
    cell: info => new Date(info.getValue() as string).toLocaleDateString(),
    enableSorting: true,
  },
  {
    accessorKey: 'total_sell',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total Sell' />,
    cell: info => {
      const value = info.getValue() as number
      return value != null ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    },
    enableSorting: true,
  },
  {
    accessorKey: 'total_cost',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total Cost' />,
    cell: info => {
      const value = info.getValue() as number
      return value != null ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    },
    enableSorting: true,
  },
  {
    accessorKey: 'overall_margin_pct',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Overall Margin > 20%' />,
    cell: info => {
      const value = Number(info.getValue())
      return value >= 20
        ? <span className="text-green-600 font-bold">✔ {value.toFixed(2)}%</span>
        : <span className="text-red-600 font-bold">✖ {value.toFixed(2)}%</span>
    },
    enableSorting: true,
    minSize: 150,
  },
  {
    accessorKey: 'low_margin_line_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Low Margin Line Count' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    id: 'marginAnalysis',
    header: 'Go to Margin Analysis',
    cell: ({ row }) => (
      <a href={`/margin-analysis?order=${row.original.quote_no}`} className='text-primary underline hover:text-primary/80'>
        View Margin
      </a>
    ),
    enableSorting: false,
    minSize: 160,
  },
] 