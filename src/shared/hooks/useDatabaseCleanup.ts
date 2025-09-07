import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

/**
 * Hook to manage database lifecycle and cleanup
 * Useful for components that want to ensure databases are cleaned up
 * when they're no longer needed
 */
export function useDatabaseCleanup() {
  const clearDatabases = useAppStore(state => state.clearDatabases);
  const databases = useAppStore(state => state.databases);
  
  // Get current database count and schemas
  const databaseCount = Object.keys(databases).length;
  const activeSchemas = Object.keys(databases);
  
  // Clean up all databases on component unmount
  const cleanupOnUnmount = useCallback(() => {
    return () => {
      clearDatabases();
    };
  }, [clearDatabases]);
  
  // Clean up specific database by schema
  const cleanupDatabase = useCallback((schema: string) => {
    const db = databases[schema];
    if (db) {
      try {
        if (typeof db.close === 'function') {
          db.close();
        }
      } catch (error) {
        console.warn(`Error closing database for schema "${schema}":`, error);
      }
      
      // Remove from store
      useAppStore.setState(state => {
        const newDatabases = { ...state.databases };
        delete newDatabases[schema];
        return { databases: newDatabases };
      });
    }
  }, [databases]);
  
  // Auto cleanup when component unmounts (optional)
  const enableAutoCleanup = useCallback(() => {
    useEffect(() => cleanupOnUnmount(), []);
  }, [cleanupOnUnmount]);
  
  return {
    // Database info
    databaseCount,
    activeSchemas,
    
    // Cleanup methods
    cleanupAll: clearDatabases,
    cleanupDatabase,
    cleanupOnUnmount,
    enableAutoCleanup,
    
    // Memory info (rough estimate)
    getMemoryInfo: () => ({
      databaseCount,
      activeSchemas,
      estimatedMemoryUsage: `${databaseCount} database${databaseCount !== 1 ? 's' : ''} active`,
    }),
  };
}

/**
 * Hook to monitor database memory usage
 * Logs warnings when too many databases are active
 */
export function useDatabaseMemoryMonitor(maxDatabases: number = 10) {
  const databaseCount = useAppStore(state => Object.keys(state.databases).length);
  const activeSchemas = useAppStore(state => Object.keys(state.databases));
  
  useEffect(() => {
    if (databaseCount > maxDatabases) {
      console.warn(
        `Memory Warning: ${databaseCount} databases active (max recommended: ${maxDatabases}). ` +
        `Active schemas: ${activeSchemas.join(', ')}. ` +
        `Consider cleaning up unused databases.`
      );
    }
  }, [databaseCount, maxDatabases, activeSchemas]);
  
  return {
    databaseCount,
    isOverLimit: databaseCount > maxDatabases,
    limit: maxDatabases,
    activeSchemas,
  };
}

/**
 * Development helper hook to log database usage
 * Only active in development mode
 */
export function useDatabaseDevTools() {
  const databases = useAppStore(state => state.databases);
  
  useEffect(() => {
    if (import.meta.env.DEV) {
      const count = Object.keys(databases).length;
      const schemas = Object.keys(databases);
      
      console.group('Database State');
      console.log(`Active databases: ${count}`);
      console.log('Schemas:', schemas);
      console.log('Full state:', databases);
      console.groupEnd();
    }
  }, [databases]);
  
  // Expose methods for manual debugging
  if (import.meta.env.DEV) {
    (window as any).__databaseDebug = {
      databases,
      count: Object.keys(databases).length,
      schemas: Object.keys(databases),
      clearAll: useAppStore.getState().clearDatabases,
    };
  }
}