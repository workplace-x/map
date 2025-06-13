import { createFileRoute } from '@tanstack/react-router'
import UserProfilePage from '@/features/profile/UserProfilePage'

export const Route = createFileRoute('/_authenticated/profile')({
  component: UserProfilePage,
}) 