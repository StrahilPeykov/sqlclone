import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { router } from './router';
import { theme } from './theme';
import { SQLJSProvider } from './shared/providers/SQLJSProvider';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

export function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SQLJSProvider>
            <RouterProvider router={router} />
          </SQLJSProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}