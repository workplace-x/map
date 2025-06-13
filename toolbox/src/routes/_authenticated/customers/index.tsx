import { createFileRoute } from '@tanstack/react-router'
import AdvancedCustomersPage from '@/features/customers/advanced-customers-page'

export const Route = createFileRoute('/_authenticated/customers/')({
  component: AdvancedCustomersPage,
}) 