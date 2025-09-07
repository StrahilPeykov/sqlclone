import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSQLJS } from './SQLJSProvider';

export type DatabaseContextType = 'playground' | 'exercise' | 'concept';

interface DatabaseState {
  playground: any | null;
  exercise: any | null;
  concept: any | null;
}

interface DatabaseContextValue {
  databases: DatabaseState;
  getDatabase: (context: DatabaseContextType, schema: string) => any | null;
  resetDatabase: (context: DatabaseContextType) => void;
  resetAllDatabases: () => void;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const SQLJS = useSQLJS();
  const [databases, setDatabases] = useState<DatabaseState>({
    playground: null,
    exercise: null,
    concept: null,
  });
  
  const [isReady, setIsReady] = useState(false);

  // Initialize readiness when SQLJS is available
  useEffect(() => {
    setIsReady(!!SQLJS);
  }, [SQLJS]);

  // Create a database with the given schema and context-specific setup
  const createDatabase = useCallback((schema: string, context: DatabaseContextType) => {
    if (!SQLJS) return null;

    try {
      const db = new SQLJS.Database();
      db.run(schema);

      // Add context-specific setup
      switch (context) {
        case 'playground':
          // Add helpful comments for playground
          db.run(`-- SQL Playground - Experiment freely!
-- Your changes will persist until you reset the database.
-- Available tables: ${getTableNamesFromSchema(schema).join(', ')}`);
          break;
        case 'exercise':
          // Clean slate for exercises
          break;
        case 'concept':
          // Read-only demonstrations
          break;
      }

      return db;
    } catch (error) {
      console.error(`Failed to create ${context} database:`, error);
      return null;
    }
  }, [SQLJS]);

  // Get or create a database for the given context and schema
  const getDatabase = useCallback((context: DatabaseContextType, schema: string) => {
    const existingDb = databases[context];
    
    // For exercises and concepts, always create fresh databases
    if (context === 'exercise' || context === 'concept') {
      const newDb = createDatabase(schema, context);
      setDatabases(prev => ({ ...prev, [context]: newDb }));
      return newDb;
    }
    
    // For playground, reuse existing database or create new one
    if (!existingDb) {
      const newDb = createDatabase(schema, context);
      setDatabases(prev => ({ ...prev, [context]: newDb }));
      return newDb;
    }
    
    return existingDb;
  }, [databases, createDatabase]);

  // Reset a specific database context
  const resetDatabase = useCallback((context: DatabaseContextType) => {
    const db = databases[context];
    if (db && typeof db.close === 'function') {
      try {
        db.close();
      } catch (error) {
        console.warn(`Error closing ${context} database:`, error);
      }
    }
    
    setDatabases(prev => ({ ...prev, [context]: null }));
  }, [databases]);

  // Reset all databases
  const resetAllDatabases = useCallback(() => {
    Object.entries(databases).forEach(([context, db]) => {
      if (db && typeof db.close === 'function') {
        try {
          db.close();
        } catch (error) {
          console.warn(`Error closing ${context} database:`, error);
        }
      }
    });
    
    setDatabases({
      playground: null,
      exercise: null,
      concept: null,
    });
  }, [databases]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAllDatabases();
    };
  }, [resetAllDatabases]);

  const value: DatabaseContextValue = {
    databases,
    getDatabase,
    resetDatabase,
    resetAllDatabases,
    isReady,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

// Helper function to extract table names from schema
function getTableNamesFromSchema(schema: string): string[] {
  const matches = schema.match(/CREATE TABLE (\w+)/gi);
  if (!matches) return [];
  
  return matches.map(match => 
    match.replace(/CREATE TABLE /i, '').trim()
  );
}