import { createFileRoute } from '@tanstack/react-router'
import VendorDetails from '@/features/vendor-intelligence/components/VendorDetails'

export const Route = createFileRoute('/_authenticated/vendors/$vendorId')({
  component: VendorDetails,
}) 