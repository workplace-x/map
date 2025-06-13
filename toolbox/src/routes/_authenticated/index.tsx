import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import AdvancedExecutiveDashboard from '@/features/dashboard/advanced-executive-dashboard'
import { useAzureAuthStore } from '@/stores/azureAuthStore'

export default function Dashboard() {
  return (
    <AdvancedExecutiveDashboard />
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})
