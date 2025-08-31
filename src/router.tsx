import { createBrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Import actual components
import HomePage from '@/features/home/HomePage';
import LearningPage from '@/features/learning/LearningPage';
import PlaygroundPage from '@/features/playground/PlaygroundPage';
import PracticePage from '@/features/practice/PracticePage';
import ProgressPage from '@/features/progress/ProgressPage';
import { Layout } from '@/features/layout/Layout';

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p><a href="/">Return to Home</a></p>
      </div>
    ),
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'learn',
        element: (
          <SuspenseWrapper>
            <LearningPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'learn/:componentId',
        element: (
          <SuspenseWrapper>
            <LearningPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'learn/:componentId/:tab',
        element: (
          <SuspenseWrapper>
            <LearningPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice',
        element: (
          <SuspenseWrapper>
            <PracticePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice/:skillId',
        element: (
          <SuspenseWrapper>
            <PracticePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'progress',
        element: (
          <SuspenseWrapper>
            <ProgressPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'playground',
        element: (
          <SuspenseWrapper>
            <PlaygroundPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '*',
        element: (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>404 - Page not found</h1>
            <p><a href="/">Return to Home</a></p>
          </div>
        ),
      },
    ],
  },
]);