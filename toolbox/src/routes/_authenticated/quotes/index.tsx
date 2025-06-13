import { createFileRoute } from '@tanstack/react-router'
import AdvancedQuotesPage from '@/features/quotes/advanced-quotes-page'

export const Route = createFileRoute('/_authenticated/quotes/')({
  component: AdvancedQuotesPage,
}) 