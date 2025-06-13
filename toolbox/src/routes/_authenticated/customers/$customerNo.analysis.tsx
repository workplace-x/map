import { createFileRoute } from '@tanstack/react-router'
import CustomerAnalysisPage from '@/features/customers/customer-analysis'

export const Route = createFileRoute('/_authenticated/customers/$customerNo/analysis')({
  component: CustomerAnalysisPage,
}) 