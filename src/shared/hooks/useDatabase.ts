import { useState, useEffect, useCallback } from 'react';
import { useSQLJS } from '@/shared/providers/SQLJSProvider';

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
  
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult[] | null>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  
  // Initialize database with schema
  const initializeDatabase = useCallback(() => {
    if (!SQLJS || !schema) return null;
    
    try {
      const database = new SQLJS.Database();
      database.run(schema);
      return database;
    } catch (err) {
      console.error('Database initialization error:', err);
      setError(err instanceof Error ? err.message : 'Database setup failed');
      return null;
    }
  }, [SQLJS, schema]);
  
  // Set up database when SQLJS and schema are ready
  useEffect(() => {
    if (SQLJS && schema) {
      const database = initializeDatabase();
      if (database) {
        setDb(database);
        setError(null);
        
        // Get table names
        try {
          const tables = database.exec(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
          );
          if (tables[0]) {
            setTableNames(tables[0].values.map((row: any[]) => row[0]));
          }
        } catch (err) {
          console.warn('Could not fetch table names:', err);
        }
      }
    }
  }, [SQLJS, schema, initializeDatabase]);
  
  // Cleanup database on unmount
  useEffect(() => {
    return () => {
      if (db && typeof db.close === 'function') {
        try {
          db.close();
        } catch (err) {
          console.warn('Error closing database:', err);
        }
      }
    };
  }, [db]);
  
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
    if (db && typeof db.close === 'function') {
      try {
        db.close();
      } catch (err) {
        console.warn('Error closing old database:', err);
      }
    }
    
    const database = initializeDatabase();
    if (database) {
      setDb(database);
      setQueryResult(null);
      setQueryError(null);
      setError(null);
      
      // Update table names
      try {
        const tables = database.exec(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        );
        if (tables[0]) {
          setTableNames(tables[0].values.map((row: any[]) => row[0]));
        }
      } catch (err) {
        console.warn('Could not fetch table names after reset:', err);
      }
    }
  }, [initializeDatabase]);
  
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