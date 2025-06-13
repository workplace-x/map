import { createFileRoute } from '@tanstack/react-router'
import TeamManagementPage from '@/features/settings/team-management'

export const Route = createFileRoute('/_authenticated/settings/team-management')({
  component: TeamManagementPage,
}) 