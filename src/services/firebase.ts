import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCBugAyNxWTnzRO1FbwE_Rovk1_KplWmew',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sql-tutor-19b75.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sql-tutor-19b75',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sql-tutor-19b75.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '554144537748',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:554144537748:web:305d2dcabca3d8ee5a6881',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H8K881WZKN',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in production and if supported)
export const initAnalytics = async () => {
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

// Initialize Performance Monitoring (only in production)
export const performance = import.meta.env.PROD ? getPerformance(app) : null;

// Helper functions for common operations
export const firebaseService = {
  /**
   * Track custom events
   */
  trackEvent: async (eventName: string, parameters?: Record<string, any>) => {
    const analytics = await initAnalytics();
    if (analytics) {
      // @ts-ignore - Dynamic import for analytics functions
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, eventName, parameters);
    }
  },
  
  /**
   * Track page views
   */
  trackPageView: async (pageName: string) => {
    await firebaseService.trackEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  },
  
  /**
   * Track user progress
   */
  trackProgress: async (componentId: string, completed: boolean) => {
    await firebaseService.trackEvent('progress_update', {
      component_id: componentId,
      completed,
      timestamp: new Date().toISOString(),
    });
  },
  
  /**
   * Track exercise completion
   */
  trackExercise: async (exerciseId: string, success: boolean, attempts: number) => {
    await firebaseService.trackEvent('exercise_complete', {
      exercise_id: exerciseId,
      success,
      attempts,
      timestamp: new Date().toISOString(),
    });
  },
};