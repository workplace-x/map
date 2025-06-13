import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '../tasks/components/data-table-column-header'

export type Customer = {
  customerName: string
  customerNo: string
  totalSell: number
  totalMargin: number
  sell12mo: number
  margin12mo: number
  marginPct12mo: number
  marginPct: number
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer Name' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'customerNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer #' />,
    cell: info => info.getValue(),
    enableSorting: true,
  },
  {
    accessorKey: 'totalSell',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total Sell' />,
    cell: info => `$${Number(info.getValue()).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`,
    enableSorting: true,
  },
  {
    accessorKey: 'totalMargin',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total Margin' />,
    cell: info => `$${Number(info.getValue()).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`,
    enableSorting: true,
  },
  {
    accessorKey: 'sell12mo',
    header: ({ column }) => <DataTableColumnHeader column={column} title='12mo Sell' />,
    cell: info => `$${Number(info.getValue()).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`,
    enableSorting: true,
  },
  {
    accessorKey: 'margin12mo',
    header: ({ column }) => <DataTableColumnHeader column={column} title='12mo Margin' />,
    cell: info => `$${Number(info.getValue()).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`,
    enableSorting: true,
  },
  {
    accessorKey: 'marginPct12mo',
    header: ({ column }) => <DataTableColumnHeader column={column} title='12mo Margin %' />,
    cell: info => `${Number(info.getValue()).toFixed(2)}%`,
    enableSorting: true,
  },
  {
    accessorKey: 'marginPct',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Margin %' />,
    cell: info => `${Number(info.getValue()).toFixed(2)}%`,
    enableSorting: true,
  },
] 