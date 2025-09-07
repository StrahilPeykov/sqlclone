import { StrictMode, useEffect, useMemo, useContext } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { router } from './router';
import { getTheme, ColorModeContext } from './theme';
import { SQLJSProvider } from './shared/providers/SQLJSProvider';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { useAppStore } from './store';

export function App() {
  const mode = useAppStore((s) => s.currentTheme);
  const setTheme = useAppStore((s) => s.setTheme);

  const muiTheme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleColorMode = () => setTheme(mode === 'light' ? 'dark' : 'light');

  return (
    <StrictMode>
      <ErrorBoundary>
        <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <SQLJSProvider>
              <RouterProvider router={router} />
            </SQLJSProvider>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </ErrorBoundary>
    </StrictMode>
  );
}