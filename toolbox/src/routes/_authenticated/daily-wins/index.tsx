import { createFileRoute } from '@tanstack/react-router'

function DailyWins() {
  return <div>Daily Wins feature coming soon.</div>
}

export const Route = createFileRoute('/_authenticated/daily-wins/')({
  component: DailyWins,
}) 