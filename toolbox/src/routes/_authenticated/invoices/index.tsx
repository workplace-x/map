import { createFileRoute } from '@tanstack/react-router'
import AdvancedInvoicesPage from '@/features/invoices/advanced-invoices-page'

export const Route = createFileRoute('/_authenticated/invoices/')({
  component: AdvancedInvoicesPage,
}) 