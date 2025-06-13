import { createFileRoute } from '@tanstack/react-router'
import UserManagement from '@/features/settings/user-management'

export const Route = createFileRoute('/_authenticated/settings/user-management')({
  component: UserManagement,
}) 