import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  progress: Record<string, ComponentProgress>;
}

export interface ComponentProgress {
  componentId: string;
  type: 'concept' | 'skill';
  completed: boolean;
  exercisesCompleted?: number;
  lastAccessed?: Date;
}

interface AppState {
  // User State
  user: User | null;
  
  // Navigation State
  currentComponent: string | null;
  currentTab: string;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

interface AppActions {
  // User Actions
  setUser: (user: User) => void;
  updateProgress: (componentId: string, progress: Partial<ComponentProgress>) => void;
  
  // Navigation Actions
  setCurrentComponent: (componentId: string | null) => void;
  setCurrentTab: (tab: string) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  
  // Utility Actions
  reset: () => void;
}

const initialState: AppState = {
  user: {
    id: 'default-user',
    progress: {},
  },
  currentComponent: null,
  currentTab: 'theory',
  isLoading: false,
  error: null,
  sidebarOpen: true,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // User Actions
      setUser: (user) => set({ user }),
      
      updateProgress: (componentId, progress) => set((state) => {
        if (!state.user) return state;
        
        const existing = state.user.progress[componentId] || {
          componentId,
          type: 'concept',
          completed: false,
        };
        
        return {
          user: {
            ...state.user,
            progress: {
              ...state.user.progress,
              [componentId]: {
                ...existing,
                ...progress,
                lastAccessed: new Date(),
              },
            },
          },
        };
      }),
      
      // Navigation Actions
      setCurrentComponent: (componentId) => set({ currentComponent: componentId }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      
      // UI Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Utility Actions
      reset: () => set(initialState),
    }),
    {
      name: 'sql-valley-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);