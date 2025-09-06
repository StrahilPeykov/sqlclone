import { Exercise } from '@/features/content/types';
import { DatabaseService } from '@/features/database/DatabaseService';
import { selectRandomly, generateRandomNumber } from '@/shared/utils';

export interface ExerciseState {
  exerciseId: string;
  version: number;
  state: any;
  attempts: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface ExerciseGenerationUtils {
  selectRandomly: <T>(arr: T[]) => T;
  generateRandomNumber: (min: number, max: number) => number;
}

class ExerciseService {
  private static instance: ExerciseService;
  private exerciseStates: Map<string, ExerciseState> = new Map();
  
  private constructor() {}
  
  static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }
  
  /**
   * Generate exercise state for a given exercise
   */
  async generateExercise(exercise: Exercise, additionalData?: any): Promise<ExerciseState> {
    const utils: ExerciseGenerationUtils = {
      selectRandomly,
      generateRandomNumber,
    };
    
    try {
      // Compile and run the generator function
      const generatorFn = new Function('utils', `${exercise.generator}; return generate;`);
      const generator = generatorFn(utils);
      const state = generator(utils, additionalData);
      
      const exerciseState: ExerciseState = {
        exerciseId: exercise.id,
        version: exercise.version,
        state,
        attempts: 0,
        completed: false,
        startTime: new Date(),
      };
      
      this.exerciseStates.set(exercise.id, exerciseState);
      return exerciseState;
    } catch (error) {
      console.error('Failed to generate exercise:', error);
      throw new Error(`Exercise generation failed: ${error}`);
    }
  }
  
  /**
   * Validate exercise input
   */
  async validateExercise(
    exercise: Exercise, 
    exerciseState: ExerciseState, 
    userInput: string
  ): Promise<{ correct: boolean; feedback?: string }> {
    try {
      // Run query if it's a SQL exercise
      let queryResult = null;
      if (exercise.config?.database) {
        const dbService = DatabaseService.getInstance();
        
        // Get appropriate database config
        const dbConfig = this.getDatabaseConfig(exercise.config.database);
        await dbService.getDatabase(dbConfig);
        queryResult = await dbService.executeQuery(dbConfig.name, userInput);
      }
      
      // Compile and run validator function
      const validatorFn = new Function(
        'input', 
        'state', 
        'result', 
        `${exercise.validator}; return validate(input, state, result);`
      );
      
      const isCorrect = validatorFn(userInput, exerciseState.state, queryResult);
      
      // Update exercise state
      exerciseState.attempts++;
      if (isCorrect) {
        exerciseState.completed = true;
        exerciseState.endTime = new Date();
      }
      
      return {
        correct: isCorrect,
        feedback: isCorrect 
          ? 'Excellent! Your answer is correct.' 
          : 'Not quite right. Try again!'
      };
    } catch (error) {
      console.error('Exercise validation failed:', error);
      return {
        correct: false,
        feedback: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get exercise state
   */
  getExerciseState(exerciseId: string): ExerciseState | null {
    return this.exerciseStates.get(exerciseId) || null;
  }
  
  /**
   * Reset exercise
   */
  async resetExercise(exercise: Exercise): Promise<ExerciseState> {
    this.exerciseStates.delete(exercise.id);
    return this.generateExercise(exercise);
  }
  
  /**
   * Get database config for exercise
   */
  private getDatabaseConfig(databaseName: string) {
    // Import database configs
    const configs = {
      companies: {
        name: 'companies',
        schema: `
          CREATE TABLE companies (
            id INTEGER PRIMARY KEY,
            company_name TEXT NOT NULL,
            country TEXT NOT NULL,
            founded_year INTEGER,
            num_employees INTEGER,
            industry TEXT
          );
          
          INSERT INTO companies VALUES 
            (1, 'LinkedIn', 'United States', 2003, 20000, 'Social Media'),
            (2, 'Meta', 'United States', 2004, 77000, 'Social Media'),
            (3, 'ING', 'Netherlands', 1991, 57000, 'Banking'),
            (4, 'KPMG', 'Netherlands', 1987, 236000, 'Consulting'),
            (5, 'PwC', 'Netherlands', 1998, 328000, 'Consulting'),
            (6, 'Deloitte', 'Netherlands', 1845, 415000, 'Consulting'),
            (7, 'EY', 'Netherlands', 1989, 365000, 'Consulting'),
            (8, 'TikTok', 'United States', 2016, 150000, 'Social Media'),
            (9, 'Twitter', 'United States', 2006, 7500, 'Social Media'),
            (10, 'Google', 'United States', 1998, 190000, 'Technology'),
            (11, 'Apple', 'United States', 1976, 164000, 'Technology'),
            (12, 'Microsoft', 'United States', 1975, 221000, 'Technology'),
            (13, 'Rabobank', 'Netherlands', 1972, 43000, 'Banking'),
            (14, 'ASML', 'Netherlands', 1984, 40000, 'Technology'),
            (15, 'Philips', 'Netherlands', 1891, 78000, 'Healthcare'),
            (16, 'NXP', 'Netherlands', 2006, 34000, 'Semiconductors'),
            (17, 'Unilever', 'United Kingdom', 1929, 128000, 'Consumer Goods'),
            (18, 'Shell', 'Netherlands', 1907, 86000, 'Energy');
        `
      },
      positions: {
        name: 'positions',
        schema: `
          CREATE TABLE positions (
            id INTEGER PRIMARY KEY,
            company_id INTEGER,
            company_name TEXT,
            country TEXT,
            city TEXT,
            position TEXT,
            department TEXT,
            salary INTEGER,
            remote_allowed BOOLEAN
          );
          
          INSERT INTO positions VALUES
            (1, 1, 'LinkedIn', 'United States', 'San Francisco', 'ML Engineer', 'Engineering', 140000, 1),
            (2, 1, 'LinkedIn', 'United States', 'New York', 'ML Engineer', 'Engineering', 100000, 1),
            (3, 1, 'LinkedIn', 'United States', 'Sunnyvale', 'Data Engineer', 'Data', 110000, 0),
            (4, 2, 'Meta', 'United States', 'New York', 'Data Analyst', 'Analytics', 130000, 1),
            (5, 2, 'Meta', 'United States', 'San Francisco', 'Data Engineer', 'Data', 130000, 1);
        `
      }
    };
    
    return configs[databaseName as keyof typeof configs] || configs.companies;
  }
  
  /**
   * Calculate score based on attempts
   */
  calculateScore(exercise: Exercise, attempts: number): number {
    const maxPoints = exercise.points;
    const penalty = Math.max(0, attempts - 1) * 0.1;
    return Math.round(maxPoints * Math.max(0.3, 1 - penalty));
  }
  
  /**
   * Get exercise statistics
   */
  getExerciseStats(exerciseId: string) {
    const state = this.exerciseStates.get(exerciseId);
    if (!state) return null;
    
    const duration = state.endTime 
      ? state.endTime.getTime() - state.startTime.getTime()
      : Date.now() - state.startTime.getTime();
      
    return {
      attempts: state.attempts,
      completed: state.completed,
      duration: Math.round(duration / 1000), // seconds
      startTime: state.startTime,
      endTime: state.endTime,
    };
  }
}

export const exerciseService = ExerciseService.getInstance();

// React hooks for exercises
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useExerciseGeneration(exercise: Exercise) {
  return useMutation({
    mutationFn: () => exerciseService.generateExercise(exercise),
    onSuccess: (data) => {
      console.log('Exercise generated:', data);
    },
  });
}

export function useExerciseValidation(exercise: Exercise) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ exerciseState, userInput }: { 
      exerciseState: ExerciseState; 
      userInput: string; 
    }) => exerciseService.validateExercise(exercise, exerciseState, userInput),
    onSuccess: (data) => {
      if (data.correct) {
        // Invalidate related queries to update progress
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

export function useExerciseState(exerciseId: string) {
  return useQuery({
    queryKey: ['exercise', 'state', exerciseId],
    queryFn: () => exerciseService.getExerciseState(exerciseId),
    enabled: !!exerciseId,
  });
}
