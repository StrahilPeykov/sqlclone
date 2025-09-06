import { useState, useCallback, useEffect } from 'react';
import { DatabaseService, DatabaseConfig, QueryResult } from '../DatabaseService';

interface UseDatabaseReturn {
  database: any | null;
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
  queryResult: QueryResult[] | null;
  queryError: Error | null;
  executeQuery: (query: string) => Promise<QueryResult[]>;
  resetDatabase: () => Promise<void>;
  tableNames: string[];
}

export function useDatabase(
  config: DatabaseConfig | string = 'default',
  schema?: string
): UseDatabaseReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [database, setDatabase] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<QueryResult[] | null>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);

  // Normalize config
  const dbConfig: DatabaseConfig = typeof config === 'string' 
    ? { name: config, schema }
    : (schema ? { ...config, schema } : config);

  const dbService = DatabaseService.getInstance();

  // Initialize database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for SQL.js to be ready
        await dbService.initialize();
        
        // Create/get database
        const db = await dbService.getDatabase(dbConfig);
        setDatabase(db);
        
        // Get table names
        const tables = await dbService.getTableNames(dbConfig.name);
        setTableNames(tables);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        console.error('Database initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, [dbConfig.name, dbConfig.schema]);

  // Execute query
  const executeQuery = useCallback(async (query: string): Promise<QueryResult[]> => {
    if (!dbService.isReady()) {
      throw new Error('Database service not ready');
    }

    try {
      setIsExecuting(true);
      setQueryError(null);
      const res = await dbService.executeQuery(dbConfig.name, query);
      setQueryResult(res);
      return res;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Query execution failed');
      setQueryError(e);
      console.error('Query execution error:', e);
      throw e;
    } finally {
      setIsExecuting(false);
    }
  }, [dbConfig.name]);

  // Reset database
  const resetDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      await dbService.resetDatabase(dbConfig);
      setQueryResult(null);
      setQueryError(null);
      
      // Refresh table names
      const tables = await dbService.getTableNames(dbConfig.name);
      setTableNames(tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset database');
    } finally {
      setIsLoading(false);
    }
  }, [dbConfig]);

  return {
    database,
    isLoading,
    isExecuting,
    error,
    queryResult,
    queryError,
    executeQuery,
    resetDatabase,
    tableNames,
  };
}
