import { createBrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Import components directly instead of lazy loading for now to avoid import issues
import HomePage from '@/features/home/HomePage';
import LearningPage from '@/features/learning/LearningPage';
import { Layout } from '@/features/layout/Layout';

// Simple fallback components for pages that might not be ready
const SimpleLearningPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Learning Page</h1>
    <p>Individual skills and concepts will be shown here.</p>
    <p>Navigate back to <a href="/">Home</a></p>
  </div>
);

const SimplePracticePage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Practice Page</h1>
    <p>Interactive exercises will be shown here.</p>
    <p>Navigate back to <a href="/">Home</a></p>
  </div>
);

const SimpleProgressPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Progress Page</h1>
    <p>Your learning progress will be tracked here.</p>
    <p>Navigate back to <a href="/">Home</a></p>
  </div>
);

const SimplePlaygroundPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>SQL Playground</h1>
    <p>Interactive SQL editor will be available here.</p>
    <p>Navigate back to <a href="/">Home</a></p>
  </div>
);

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
            <SimpleLearningPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice',
        element: (
          <SuspenseWrapper>
            <SimplePracticePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'practice/:skillId',
        element: (
          <SuspenseWrapper>
            <SimplePracticePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'progress',
        element: (
          <SuspenseWrapper>
            <SimpleProgressPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'playground',
        element: (
          <SuspenseWrapper>
            <SimplePlaygroundPage />
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