import { useState, useCallback, useEffect } from 'react';
import { useDatabaseContext, DatabaseContextType } from '@/shared/providers/DatabaseProvider';
import { schemas, getSchemaForSkill } from '@/features/database/schemas';

interface QueryResult {
  columns: string[];
  values: any[][];
}

interface DatabaseOptions {
  context: DatabaseContextType;
  schema?: keyof typeof schemas;
  skillId?: string; // Alternative to schema - will auto-detect schema
  resetOnSchemaChange?: boolean;
  persistent?: boolean; // Only applies to playground context
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

export function useDatabase(options: DatabaseOptions): UseDatabaseReturn {
  const { 
    context, 
    schema, 
    skillId, 
    resetOnSchemaChange = true,
    persistent = false 
  } = options;

  const { getDatabase, resetDatabase: resetContextDatabase, isReady: contextReady } = useDatabaseContext();
  
  const [currentSchema, setCurrentSchema] = useState<string>('');
  const [database, setDatabase] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult[] | null>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);

  // Determine which schema to use
  const resolvedSchema = schema 
    ? schemas[schema] 
    : skillId 
    ? schemas[getSchemaForSkill(skillId)]
    : schemas.companies;

  // Update database when schema changes or context is ready
  useEffect(() => {
    if (!contextReady || !resolvedSchema) return;

    const schemaChanged = currentSchema !== resolvedSchema;
    const needsInit = !database;
    const shouldReset = resetOnSchemaChange && schemaChanged && !(context === 'playground' && persistent);

    if (shouldReset || needsInit) {
      if (shouldReset) {
        resetContextDatabase(context);
      }

      const db = getDatabase(context, resolvedSchema);
      setDatabase(db);
      setCurrentSchema(resolvedSchema);
      setError(null);

      // Update table names
      if (db) {
        try {
          const tables = db.exec(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
          );
          if (tables[0]) {
            setTableNames(tables[0].values.map((row: any[]) => row[0]));
          } else {
            setTableNames([]);
          }
        } catch (err) {
          console.warn('Could not fetch table names:', err);
          setTableNames([]);
        }
      }
    }
  }, [
    contextReady,
    resolvedSchema,
    currentSchema,
    context,
    persistent,
    resetOnSchemaChange,
    getDatabase,
    resetContextDatabase,
    database,
  ]);

  // Execute query function
  const executeQuery = useCallback(async (query: string): Promise<QueryResult[]> => {
    if (!database) {
      throw new Error(`Database not ready for ${context} context`);
    }

    setIsExecuting(true);
    setQueryError(null);

    try {
      const result = database.exec(query);
      setQueryResult(result);
      return result;
    } catch (err) {
      const message = ((): string => {
        if (err instanceof Error) return err.message;
        if (typeof err === 'string') return err;
        try {
          // sql.js sometimes throws objects; best-effort stringify
          return (err as any)?.message ?? JSON.stringify(err);
        } catch {
          return 'Query execution failed';
        }
      })();
      const error = new Error(message || 'Query execution failed');
      setQueryError(error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [database, context]);

  // Reset current database
  const resetDatabase = useCallback(() => {
    resetContextDatabase(context);
    setQueryResult(null);
    setQueryError(null);
    setError(null);
    // Database will be recreated in the next effect cycle
  }, [context, resetContextDatabase]);

  return {
    database,
    executeQuery,
    resetDatabase,
    isReady: contextReady && !!database,
    isExecuting,
    error,
    queryResult,
    queryError,
    tableNames,
  };
}

// Convenience hooks for specific contexts
export function usePlaygroundDatabase(schema: keyof typeof schemas = 'companiesAndPositions') {
  return useDatabase({
    context: 'playground',
    schema,
    persistent: true,
    resetOnSchemaChange: false,
  });
}

export function useExerciseDatabase(skillId: string) {
  return useDatabase({
    context: 'exercise',
    skillId,
    resetOnSchemaChange: true,
    persistent: false,
  });
}

export function useConceptDatabase(schema: keyof typeof schemas = 'companies') {
  return useDatabase({
    context: 'concept',
    schema,
    resetOnSchemaChange: true,
    persistent: false,
  });
}
