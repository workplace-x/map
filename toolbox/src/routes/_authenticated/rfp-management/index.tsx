import { createFileRoute } from '@tanstack/react-router'
import RfpManagement from '@/features/rfp-management'

export const Route = createFileRoute('/_authenticated/rfp-management/')({
  component: RfpManagement,
}) 