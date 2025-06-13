import { createFileRoute } from '@tanstack/react-router'
import GoalsManagement from '@/features/settings/goals-management'
 
export const Route = createFileRoute('/_authenticated/settings/goals-management')({
  component: GoalsManagement,
}) 