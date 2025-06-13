import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Download, Trash2 } from 'lucide-react'

export interface RFP {
  id: string
  title: string
  uploadedAt: string
  uploadedBy: string
  status: string
  fileSize: string
  fileType: string
}

export const rfpColumns: ColumnDef<RFP>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'uploadedAt',
    header: 'Uploaded Date',
    cell: ({ row }) => new Date(row.getValue('uploadedAt')).toLocaleDateString(),
  },
  {
    accessorKey: 'uploadedBy',
    header: 'Uploaded By',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
  },
  {
    accessorKey: 'fileType',
    header: 'File Type',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const rfp = row.original

      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
] 