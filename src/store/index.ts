import { create } from 'zustand';
import { useCallback, useState, useEffect } from 'react';
import { persist } from 'zustand/middleware';

interface ComponentState {
  // Component ID
  id?: string;
  
  // For concepts
  understood?: boolean;
  tab?: string;
  
  // For skills
  numSolved?: number;
  exerciseHistory?: any[];
  currentExercise?: any;
  
  // Database status for skills
  database?: 'test' | 'practice';
  dbReady?: boolean;
  
  // Common
  lastAccessed?: Date;
  type?: 'concept' | 'skill';
}

interface AppState {
  // All component progress (replaces LocalStorageManager)
  components: Record<string, ComponentState>;
  
  // Database cache for sharing instances
  databases: Record<string, any>;
  
  // UI state
  sidebarOpen: boolean;
  currentTheme: 'light' | 'dark';
  
  // Hydration state for localStorage compatibility
  _hasHydrated: boolean;
  
  // Actions
  updateComponent: (id: string, data: Partial<ComponentState>) => void;
  getComponent: (id: string) => ComponentState;
  resetComponent: (id: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Database management
  getDatabase: (schema: string, SQLJS: any) => any;
  clearDatabases: () => void;
  
  // Hydration
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      components: {},
      databases: {},
      sidebarOpen: true,
      currentTheme: 'dark',
      _hasHydrated: false,
      
      updateComponent: (id, data) => 
        set(state => ({
          components: {
            ...state.components,
            [id]: { 
              ...state.components[id], 
              ...data,
              id,
              lastAccessed: new Date()
            }
          }
        })),
        
      getComponent: (id) => get().components[id] || { id },
      
      resetComponent: (id) =>
        set(state => ({
          components: {
            ...state.components,
            [id]: { id }
          }
        })),
      
      toggleSidebar: () => 
        set(state => ({ sidebarOpen: !state.sidebarOpen })),
      
      setTheme: (theme) =>
        set({ currentTheme: theme }),
      
      getDatabase: (schema: string, SQLJS: any) => {
        const { databases } = get();
        
        // Return existing database if available
        if (databases[schema]) {
          return databases[schema];
        }
        
        // Create new database instance
        if (!SQLJS) {
          throw new Error('SQLJS not available');
        }
        
        try {
          const database = new SQLJS.Database();
          database.run(schema);
          
          // Cache the database instance
          set(state => ({
            databases: {
              ...state.databases,
              [schema]: database
            }
          }));
          
          return database;
        } catch (error) {
          console.error('Failed to create database:', error);
          throw error;
        }
      },
      
      clearDatabases: () => {
        const { databases } = get();
        
        // Close all database connections
        Object.values(databases).forEach((db: any) => {
          try {
            if (db && typeof db.close === 'function') {
              db.close();
            }
          } catch (error) {
            console.warn('Error closing database:', error);
          }
        });
        
        set({ databases: {} });
      },
      
      setHasHydrated: (hasHydrated) =>
        set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'sql-valley-storage',
      partialize: (state) => ({
        components: state.components,
        currentTheme: state.currentTheme,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated when Zustand finishes loading from localStorage
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper hooks for backward compatibility with old LocalStorageManager
export function useComponentState(componentId: string) {
  const component = useAppStore(state => state.components[componentId] || { id: componentId });
  const updateComponent = useAppStore(state => state.updateComponent);
  
  const setComponentState = useCallback((data: Partial<ComponentState> | ((prev: ComponentState) => Partial<ComponentState>)) => {
    if (typeof data === 'function') {
      const currentState = useAppStore.getState().components[componentId] || { id: componentId };
      const newData = data(currentState);
      updateComponent(componentId, newData);
    } else {
      updateComponent(componentId, data);
    }
  }, [componentId, updateComponent]);
  
  return [component, setComponentState] as const;
}

// Compatibility hook for old localStorage pattern
export function useLocalStorageState(key: string, initialValue: any) {
  // Extract component ID from key (e.g., "component-database" -> "database")
  const componentId = key.replace('component-', '');
  return useComponentState(componentId);
}

// Hook to check if localStorage is initialized - now properly detects Zustand hydration
export function useIsLocalStorageInitialized() {
  const hasHydrated = useAppStore(state => state._hasHydrated);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (hasHydrated) {
      // Give a tick for any remaining hydration to complete
      const timer = setTimeout(() => setIsReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated]);
  
  return isReady;
}

// Hook to get shared database instances
export function useSharedDatabase(schema: string, SQLJS: any) {
  const getDatabase = useAppStore(state => state.getDatabase);
  const [database, setDatabase] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (SQLJS && schema) {
      try {
        const db = getDatabase(schema, SQLJS);
        setDatabase(db);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database creation failed');
        setDatabase(null);
      }
    }
  }, [SQLJS, schema, getDatabase]);
  
  return { database, error };
}
