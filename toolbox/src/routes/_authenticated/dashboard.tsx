import { createFileRoute } from '@tanstack/react-router'
import AdvancedExecutiveDashboard from '@/features/dashboard/advanced-executive-dashboard'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: AdvancedExecutiveDashboard,
}) 