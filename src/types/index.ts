// Global type definitions for the SQL Valley application

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  progress: Record<string, ComponentProgress>;
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface ComponentProgress {
  componentId: string;
  type: 'concept' | 'skill';
  completed: boolean;
  completedAt?: Date;
  lastAccessed?: Date;
  
  // Skill-specific progress
  exercisesCompleted?: number;
  exercisesAttempted?: number;
  totalScore?: number;
  bestScore?: number;
  timeSpent?: number; // in seconds
  
  // Concept-specific progress
  sectionsViewed?: string[];
  bookmarked?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    achievements: boolean;
    reminders: boolean;
    updates: boolean;
  };
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
}

// Content types
export interface ComponentMeta {
  id: string;
  name: string;
  type: 'concept' | 'skill';
  description: string;
  prerequisites: string[];
  tags?: string[];
  category?: string;
  order?: number;
}

export interface ConceptContent {
  theory?: string;
  summary?: string;
  examples?: Array<{
    title: string;
    content: string;
    code?: string;
  }>;
  visualizations?: any[];
  nextConcepts?: string[];
}

export interface SkillContent {
  theory?: string;
  exercises: Exercise[];
  reference?: {
    syntax?: string;
    examples?: Array<{
      title: string;
      sql: string;
      description?: string;
    }>;
    commonMistakes?: Array<{
      mistake: string;
      correction: string;
    }>;
  };
}

export interface Exercise {
  id: string;
  version: number;
  points: number;
  
  // Exercise configuration
  config: {
    database?: string;
    timeLimit?: number; // in seconds
    hints?: string[];
    allowedAttempts?: number;
  };
  
  // Generation and validation (stored as strings, evaluated at runtime)
  generator: string; // JavaScript function as string
  validator: string; // JavaScript function as string
  
  // Solution template for hints
  solutionTemplate?: string;
  
  // Metadata
  tags?: string[];
  category?: string;
}

// Database types
export interface DatabaseConfig {
  name: string;
  schema?: string;
  data?: string;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export interface QueryExecution {
  query: string;
  result?: QueryResult[];
  error?: string;
  executionTime: number;
  timestamp: Date;
}

// Exercise execution types
export interface ExerciseState {
  exerciseId: string;
  version: number;
  state: any; // Generated state from the exercise generator
  attempts: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
  inputs: string[]; // History of user inputs
  feedback?: string[];
}

export interface ExerciseValidation {
  correct: boolean;
  feedback?: string;
  score?: number;
  hints?: string[];
}

// Learning path types
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  components: string[]; // Ordered list of component IDs
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string; // Condition for unlocking
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
}

// Analytics types
export interface AnalyticsEvent {
  type: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
}

export interface UserStats {
  totalTime: number; // in seconds
  conceptsCompleted: number;
  skillsCompleted: number;
  exercisesCompleted: number;
  totalScore: number;
  streak: number; // days
  averageScore: number;
  accuracy: number; // percentage
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Event types
export interface ComponentEvent {
  type: 'component_started' | 'component_completed' | 'component_accessed';
  componentId: string;
  componentType: 'concept' | 'skill';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ExerciseEvent {
  type: 'exercise_started' | 'exercise_completed' | 'exercise_attempted';
  exerciseId: string;
  skillId: string;
  attempt: number;
  correct?: boolean;
  score?: number;
  timeSpent: number;
  timestamp: Date;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

// Export all types as a namespace as well
// Avoid circular type aliases; consumers can import types directly from this module.
