import { create } from 'zustand';
import { useCallback } from 'react';
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
  
  // Common
  lastAccessed?: Date;
  type?: 'concept' | 'skill';
}

interface AppState {
  // All component progress (replaces LocalStorageManager)
  components: Record<string, ComponentState>;
  
  // UI state
  sidebarOpen: boolean;
  currentTheme: 'light' | 'dark';
  
  // Actions
  updateComponent: (id: string, data: Partial<ComponentState>) => void;
  getComponent: (id: string) => ComponentState;
  resetComponent: (id: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      components: {},
      sidebarOpen: true,
      currentTheme: 'dark',
      
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
    }),
    {
      name: 'sql-valley-storage',
      partialize: (state) => ({
        components: state.components,
        currentTheme: state.currentTheme,
      }),
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

// Hook to check if localStorage is initialized
export function useIsLocalStorageInitialized() {
  // Zustand persist is always ready after first render
  return true;
}
