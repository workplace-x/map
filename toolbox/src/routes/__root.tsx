import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'
import { LayoutProvider } from '@/components/layout/advanced-layout-system'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <LayoutProvider>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={50000} />
        {import.meta.env.MODE === 'development' && (
          <>
            {/* <ReactQueryDevtools buttonPosition='bottom-left' /> */}
            {/* <TanStackRouterDevtools position='bottom-right' /> */}
          </>
        )}
      </LayoutProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
