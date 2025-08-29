import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { router } from './router';
import { theme } from './theme';
import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Suspense fallback={<LoadingScreen fullScreen />}>
            <RouterProvider router={router} />
          </Suspense>
          {import.meta.env.DEV && <ReactQueryDevtools />}
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}