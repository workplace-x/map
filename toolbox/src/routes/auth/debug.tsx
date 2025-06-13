import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/debug')({
  component: AuthDebug,
})

function AuthDebug() {
  const { user, accessToken, loading, clearStaleAuth, refreshUser } = useAuth()

  const handleClearAuth = () => {
    clearStaleAuth()
    window.location.reload()
  }

  const handleTestAuth = async () => {
    try {
      await refreshUser()
    } catch (error) {
      console.error('Test auth failed:', error)
    }
  }

  // Get current URL info for debugging
  const currentUrl = window.location.href
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const queryParams = new URLSearchParams(window.location.search)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold">Auth State</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</div>
              <div><strong>Has Token:</strong> {accessToken ? 'Yes' : 'No'}</div>
              <div><strong>Token Preview:</strong> {accessToken ? accessToken.substring(0, 50) + '...' : 'None'}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold">LocalStorage</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div><strong>sb-access-token:</strong> {localStorage.getItem('sb-access-token') ? 'Present' : 'None'}</div>
              <div><strong>sb-refresh-token:</strong> {localStorage.getItem('sb-refresh-token') ? 'Present' : 'None'}</div>
            </div>
          </div>

          <div className="space-x-4">
            <Button onClick={handleClearAuth} variant="destructive">
              Clear Auth State
            </Button>
            <Button onClick={handleTestAuth} variant="outline">
              Test Auth
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-blue-800">Current URL Debug</h3>
            <div className="mt-2 space-y-2 text-sm text-blue-700">
              <div><strong>Full URL:</strong> <code className="bg-white p-1 rounded text-xs break-all">{currentUrl}</code></div>
              <div><strong>Hash Parameters:</strong></div>
              {Array.from(hashParams.entries()).length > 0 ? (
                <ul className="ml-4 space-y-1">
                  {Array.from(hashParams.entries()).map(([key, value]) => (
                    <li key={key} className="text-xs"><code>{key}</code>: <code className="bg-white p-1 rounded">{value.substring(0, 30)}...</code></li>
                  ))}
                </ul>
              ) : (
                <div className="ml-4 text-xs">No hash parameters</div>
              )}
              <div><strong>Query Parameters:</strong></div>
              {Array.from(queryParams.entries()).length > 0 ? (
                <ul className="ml-4 space-y-1">
                  {Array.from(queryParams.entries()).map(([key, value]) => (
                    <li key={key} className="text-xs"><code>{key}</code>: <code className="bg-white p-1 rounded">{value.substring(0, 30)}...</code></li>
                  ))}
                </ul>
              ) : (
                <div className="ml-4 text-xs">No query parameters</div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
            <h3 className="font-semibold text-yellow-800">SSO Troubleshooting</h3>
            <div className="mt-2 text-yellow-700 text-sm space-y-2">
              <p><strong>For Azure SSO issues:</strong></p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Click "Clear Auth State" to remove stale tokens</li>
                <li>Go to <a href="/sign-in" className="underline">/sign-in</a> and try Azure login</li>
                <li>Check if URL contains tokens after SSO redirect</li>
                <li>Look for 'access_token', 'code', or session in URL parameters above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 