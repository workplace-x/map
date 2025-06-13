import { createFileRoute } from '@tanstack/react-router'
import AdvancedUsersPage from '@/features/users/advanced-users-page'

export const Route = createFileRoute('/_authenticated/users/')({
  component: AdvancedUsersPage,
})
