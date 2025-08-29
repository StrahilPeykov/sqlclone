import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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

export interface Exercise {
  id: string;
  skillId: string;
  version: number;
  state: any;
  input?: any;
  completed: boolean;
  attempts: number;
}

export interface DatabaseInstance {
  id: string;
  name: string;
  instance?: any; // SQL.js instance
  schema: string;
}

interface AppState {
  // User State
  user: User | null;
  
  // Navigation State
  currentComponent: string | null;
  currentTab: string;
  
  // Exercise State
  currentExercise: Exercise | null;
  exerciseHistory: Exercise[];
  
  // Database State
  databases: Record<string, DatabaseInstance>;
  currentDatabase: string | null;
  
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
  
  // Exercise Actions
  startExercise: (skillId: string) => void;
  submitAnswer: (input: any) => void;
  completeExercise: (exercise: Exercise) => void;
  resetExercise: () => void;
  
  // Database Actions
  initDatabase: (name: string, schema: string) => Promise<void>;
  setCurrentDatabase: (name: string) => void;
  executeQuery: (query: string) => Promise<any>;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  
  // Utility Actions
  reset: () => void;
}

const initialState: AppState = {
  user: null,
  currentComponent: null,
  currentTab: 'theory',
  currentExercise: null,
  exerciseHistory: [],
  databases: {},
  currentDatabase: null,
  isLoading: false,
  error: null,
  sidebarOpen: true,
};

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // User Actions
        setUser: (user) => set((state) => {
          state.user = user;
        }),
        
        updateProgress: (componentId, progress) => set((state) => {
          if (!state.user) return;
          
          const existing = state.user.progress[componentId] || {
            componentId,
            type: 'concept',
            completed: false,
          };
          
          state.user.progress[componentId] = {
            ...existing,
            ...progress,
            lastAccessed: new Date(),
          };
        }),
        
        // Navigation Actions
        setCurrentComponent: (componentId) => set((state) => {
          state.currentComponent = componentId;
        }),
        
        setCurrentTab: (tab) => set((state) => {
          state.currentTab = tab;
        }),
        
        // Exercise Actions
        startExercise: (skillId) => set((state) => {
          // Generate new exercise based on skill
          const exercise: Exercise = {
            id: `${skillId}-${Date.now()}`,
            skillId,
            version: 1,
            state: {}, // This would be generated based on skill
            completed: false,
            attempts: 0,
          };
          
          state.currentExercise = exercise;
        }),
        
        submitAnswer: (input) => set((state) => {
          if (!state.currentExercise) return;
          
          state.currentExercise.input = input;
          state.currentExercise.attempts += 1;
        }),
        
        completeExercise: (exercise) => set((state) => {
          state.exerciseHistory.push(exercise);
          state.currentExercise = null;
          
          // Update user progress
          if (state.user) {
            const progress = state.user.progress[exercise.skillId];
            const exercisesCompleted = (progress?.exercisesCompleted || 0) + 1;
            
            state.user.progress[exercise.skillId] = {
              ...progress,
              componentId: exercise.skillId,
              type: 'skill',
              exercisesCompleted,
              completed: exercisesCompleted >= 3,
              lastAccessed: new Date(),
            };
          }
        }),
        
        resetExercise: () => set((state) => {
          state.currentExercise = null;
        }),
        
        // Database Actions
        initDatabase: async (name, schema) => {
          const { databases } = get();
          
          if (databases[name]?.instance) {
            return; // Already initialized
          }
          
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            // Dynamically import SQL.js
            const initSqlJs = (await import('sql.js')).default;
            const SQL = await initSqlJs({
              locateFile: (file) => `/sqljs/${file}`,
            });
            
            const db = new SQL.Database();
            db.run(schema);
            
            set((state) => {
              state.databases[name] = {
                id: name,
                name,
                instance: db,
                schema,
              };
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize database';
              state.isLoading = false;
            });
          }
        },
        
        setCurrentDatabase: (name) => set((state) => {
          state.currentDatabase = name;
        }),
        
        executeQuery: async (query) => {
          const { currentDatabase, databases } = get();
          
          if (!currentDatabase || !databases[currentDatabase]?.instance) {
            throw new Error('No database selected');
          }
          
          try {
            return databases[currentDatabase].instance.exec(query);
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Query execution failed';
            });
            throw error;
          }
        },
        
        // UI Actions
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        toggleSidebar: () => set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),
        
        // Utility Actions
        reset: () => set(() => initialState),
      })),
      {
        name: 'sql-valley-storage',
        partialize: (state) => ({
          user: state.user,
          exerciseHistory: state.exerciseHistory,
        }),
      }
    )
  )
);