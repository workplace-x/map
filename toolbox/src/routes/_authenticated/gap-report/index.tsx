import { createFileRoute } from '@tanstack/react-router'

function GapReport() {
  return <div>Gap Report feature coming soon.</div>
}

export const Route = createFileRoute('/_authenticated/gap-report/')({
  component: GapReport,
}) 