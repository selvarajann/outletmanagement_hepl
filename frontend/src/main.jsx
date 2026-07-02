import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — master data stays fresh
      gcTime:    10 * 60 * 1000,  // 10 min — keep in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false,
      // Prevent React Query from re-throwing query errors to the ErrorBoundary /
      // QueryClientProvider level. The Axios interceptor already handles 401s
      // silently (token refresh → retry), so these should never bubble up.
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Only log genuinely unexpected errors (not 401 — those are handled by the Axios interceptor)
      if (error?.response?.status !== 401) {
        console.error('[QueryCache] Unexpected query error:', error);
      }
    },
  }),
})

import { GlobalLoaderProvider } from './context/GlobalLoaderContext.jsx'
import { AppThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <AppThemeProvider>
      <GlobalLoaderProvider>
        <App />
      </GlobalLoaderProvider>
    </AppThemeProvider>
  </QueryClientProvider>,
)
