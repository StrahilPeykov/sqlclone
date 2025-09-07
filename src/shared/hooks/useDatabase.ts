import { useState, useEffect, useCallback } from 'react';
import { useSQLJS } from '@/shared/providers/SQLJSProvider';
import { useAppStore } from '@/store';

interface QueryResult {
  columns: string[];
  values: any[][];
}

interface UseDatabaseReturn {
  database: any | null;
  executeQuery: (query: string) => Promise<QueryResult[]>;
  resetDatabase: () => void;
  isReady: boolean;
  isExecuting: boolean;
  error: string | null;
  queryResult: QueryResult[] | null;
  queryError: Error | null;
  tableNames: string[];
}

export function useDatabase(schema?: string): UseDatabaseReturn {
  const SQLJS = useSQLJS();
  const getSharedDatabase = useAppStore(state => state.getDatabase);
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult[] | null>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  
  // Initialize database with schema using shared cache
  useEffect(() => {
    if (SQLJS && schema) {
      try {
        // Use shared database from store instead of creating new instance
        const database = getSharedDatabase(schema, SQLJS);
        setDb(database);
        setError(null);
        
        // Get table names
        const tables = database.exec(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        );
        if (tables[0]) {
          setTableNames(tables[0].values.map((row: any[]) => row[0]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database setup failed');
        console.error('Database initialization error:', err);
      }
    }
  }, [SQLJS, schema, getSharedDatabase]);
  
  // Execute query function
  const executeQuery = useCallback(async (query: string): Promise<QueryResult[]> => {
    if (!db) {
      throw new Error('Database not ready');
    }
    
    setIsExecuting(true);
    setQueryError(null);
    
    try {
      const result = db.exec(query);
      setQueryResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Query execution failed');
      setQueryError(error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [db]);
  
  // Reset database to initial state
  const resetDatabase = useCallback(() => {
    if (SQLJS && schema) {
      try {
        // Create new database instance
        const database = getSharedDatabase(schema, SQLJS);
        setDb(database);
        setQueryResult(null);
        setQueryError(null);
        setError(null);
        
        // Update table names
        const tables = database.exec(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        );
        if (tables[0]) {
          setTableNames(tables[0].values.map((row: any[]) => row[0]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database reset failed');
      }
    }
  }, [SQLJS, schema, getSharedDatabase]);
  
  
  return { 
    database: db,
    executeQuery,
    resetDatabase,
    isReady: !!db,
    isExecuting,
    error,
    queryResult,
    queryError,
    tableNames
  };
}

// Helper hook for skill-specific databases
export function useSkillDatabase(skillId: string, isTest: boolean = false) {
  // Import schemas dynamically to avoid circular dependencies
  const [schemas, setSchemas] = useState<Record<string, string>>({});
  
  useEffect(() => {
    import('@/features/database/schemas').then(({ schemas: importedSchemas }) => {
      setSchemas(importedSchemas);
    });
  }, []);
  
  const schema = schemas[skillId] || schemas.companies; // Default to companies schema
  const result = useDatabase(schema);
  
  // Store database reference in component state if needed
  const updateComponent = useAppStore(state => state.updateComponent);
  
  useEffect(() => {
    if (result.database) {
      updateComponent(skillId, { 
        database: isTest ? 'test' : 'practice',
        dbReady: true 
      });
    }
  }, [result.database, skillId, isTest, updateComponent]);
  
  return result;
}

// Hook to clear all cached databases (useful for memory management)
export function useDatabaseManager() {
  const clearDatabases = useAppStore(state => state.clearDatabases);
  const databases = useAppStore(state => state.databases);
  
  return {
    clearAll: clearDatabases,
    count: Object.keys(databases).length,
    schemas: Object.keys(databases),
  };
}
