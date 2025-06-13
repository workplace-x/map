import { createFileRoute } from '@tanstack/react-router'
import UnifiedMarginAnalysis from '@/features/margin-analysis-unified'

export const Route = createFileRoute('/_authenticated/ai-margin-analysis/')({
  component: () => <UnifiedMarginAnalysis />
}) 