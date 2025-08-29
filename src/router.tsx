import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Layout } from '@/features/layout/Layout';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/features/home/HomePage'));
const LearningPage = lazy(() => import('@/features/learning/LearningPage'));
const PracticePage = lazy(() => import('@/features/practice/PracticePage'));
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage'));
const PlaygroundPage = lazy(() => import('@/features/playground/PlaygroundPage'));

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
        path: 'learn/:componentId/:tab?',
        element: (
          <SuspenseWrapper>
            <LearningPage />
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
        element: <div>404 - Page not found</div>,
      },
    ],
  },
]);