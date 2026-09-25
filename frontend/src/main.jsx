import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — master data stays fresh
      gcTime:    10 * 60 * 1000,  // 10 min — keep in cache after unmount
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 1;
      },
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

import { AppThemeProvider } from './theme/AppThemeProvider.jsx'
import api from './config/axiosInstance.jsx'

api.store = store;

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </QueryClientProvider>
  </Provider>,
)
