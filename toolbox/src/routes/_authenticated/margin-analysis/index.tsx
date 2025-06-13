import { createFileRoute } from '@tanstack/react-router'
import UnifiedMarginAnalysis from '@/features/margin-analysis-unified'

export const Route = createFileRoute('/_authenticated/margin-analysis/')({
  component: () => <UnifiedMarginAnalysis />
}) 