import { createFileRoute } from '@tanstack/react-router'
import RfpGpt from '@/features/rfp-gpt'

export const Route = createFileRoute('/_authenticated/rfp-gpt/')({
  component: RfpGpt,
}) 