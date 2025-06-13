import { createFileRoute } from '@tanstack/react-router'
import AdvancedOrdersPage from '@/features/orders/advanced-orders-page'

export const Route = createFileRoute('/_authenticated/orders/')({
  component: AdvancedOrdersPage,
}) 