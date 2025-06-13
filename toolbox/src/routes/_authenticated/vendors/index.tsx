import { createFileRoute } from '@tanstack/react-router'
import VendorIntelligenceDashboard from '@/features/vendor-intelligence/components/VendorIntelligenceDashboard'

export const Route = createFileRoute('/_authenticated/vendors/')({
  component: VendorIntelligenceDashboard,
}) 