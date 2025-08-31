import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { router } from './router';
import { ColorModeContext, getTheme } from './theme';
import { RouterProvider } from 'react-router-dom';
import { Suspense, useEffect, useMemo } from 'react';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import type { PaletteMode } from '@mui/material';
import { useLocalStorage } from '@/shared/hooks';

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
  const systemDefault: PaletteMode =
    typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  const [mode, setMode] = useLocalStorage<PaletteMode>('color-mode', systemDefault);

  const theme = useMemo(() => getTheme(mode), [mode]);

  // Sync a data-theme attribute for CSS variables in index.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode(mode === 'light' ? 'dark' : 'light'),
    }),
    [mode, setMode]
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Suspense fallback={<LoadingScreen fullScreen />}>
              <RouterProvider router={router} />
            </Suspense>
            {import.meta.env.DEV && <ReactQueryDevtools />}
          </ThemeProvider>
        </ColorModeContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
