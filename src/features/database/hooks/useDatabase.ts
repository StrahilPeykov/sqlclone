import { useState, useCallback, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';

interface QueryResult {
  columns: string[];
  values: any[][];
}

interface UseDatabaseReturn {
  database: Database | null;
  isLoading: boolean;
  error: string | null;
  executeQuery: (query: string) => Promise<QueryResult[]>;
  resetDatabase: () => Promise<void>;
}

// Global SQL.js instance
let SQL: any = null;
let isInitializing = false;
const initPromise: Promise<any> | null = null;

async function initializeSQLJS() {
  if (SQL) return SQL;
  if (isInitializing) return initPromise;
  
  isInitializing = true;
  
  try {
    SQL = await initSqlJs({
      locateFile: (file: string) => `/sqljs/${file}`,
    });
    return SQL;
  } catch (error) {
    isInitializing = false;
    throw error;
  }
}

export function useDatabase(
  databaseName: string = 'default',
  schema?: string
): UseDatabaseReturn {
  const [database, setDatabase] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database
  const initDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const SQL = await initializeSQLJS();
      const db = new SQL.Database();

      // Apply schema if provided
      if (schema) {
        db.run(schema);
      }

      setDatabase(db);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize database');
    } finally {
      setIsLoading(false);
    }
  }, [schema]);

  // Execute query
  const executeQuery = useCallback(async (query: string): Promise<QueryResult[]> => {
    if (!database) {
      throw new Error('Database not initialized');
    }

    try {
      const results = database.exec(query);
      return results.map(result => ({
        columns: result.columns,
        values: result.values,
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Query execution failed');
    }
  }, [database]);

  // Reset database
  const resetDatabase = useCallback(async () => {
    if (database) {
      database.close();
    }
    await initDatabase();
  }, [database, initDatabase]);

  // Initialize on mount
  useEffect(() => {
    initDatabase();
    
    // Cleanup on unmount
    return () => {
      if (database) {
        database.close();
      }
    };
  }, [initDatabase]);

  return {
    database,
    isLoading,
    error,
    executeQuery,
    resetDatabase,
  };
}