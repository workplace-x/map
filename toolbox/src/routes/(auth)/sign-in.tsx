import { createFileRoute } from '@tanstack/react-router'
import AzureSignIn from '@/features/auth/sign-in/index-azure'
import { Component, ReactNode } from 'react'
import AuthLayout from '@/features/auth/auth-layout'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class SimpleErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error)
    }

    return this.props.children
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
        <p className="text-gray-600 mb-4">There was an error loading the sign-in page:</p>
        <pre className="text-sm bg-gray-100 p-3 rounded text-red-800 overflow-auto max-h-32">
          {error.message}
        </pre>
        <button 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    </AuthLayout>
  )
}

function SafeAzureSignIn() {
  return (
    <SimpleErrorBoundary fallback={(error) => <ErrorFallback error={error} />}>
      <AzureSignIn />
    </SimpleErrorBoundary>
  )
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SafeAzureSignIn,
})
