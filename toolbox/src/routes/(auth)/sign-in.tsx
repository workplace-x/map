import { createFileRoute } from '@tanstack/react-router'
import AzureSignIn from '@/features/auth/sign-in/index-azure'

export const Route = createFileRoute('/(auth)/sign-in')({
  component: AzureSignIn,
})
