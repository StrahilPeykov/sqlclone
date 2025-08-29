import initSqlJs, { Database, QueryExecResult } from 'sql.js';

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export interface DatabaseConfig {
  name: string;
  schema?: string;
  data?: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private SQL?: any;
  private databases: Map<string, Database> = new Map();
  
  private constructor() {}
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * Initialize SQL.js library
   */
  async initialize(): Promise<void> {
    if (this.SQL) return;
    
    this.SQL = await initSqlJs({
      locateFile: (file) => `/sqljs/${file}`,
    });
  }
  
  /**
   * Create or get a database instance
   */
  async getDatabase(config: DatabaseConfig): Promise<Database> {
    await this.initialize();
    
    // Return existing database if already created
    if (this.databases.has(config.name)) {
      return this.databases.get(config.name)!;
    }
    
    // Create new database
    const db = new this.SQL.Database();
    
    // Apply schema if provided
    if (config.schema) {
      db.run(config.schema);
    }
    
    // Apply data if provided
    if (config.data) {
      db.run(config.data);
    }
    
    this.databases.set(config.name, db);
    return db;
  }
  
  /**
   * Execute a query on a specific database
   */
  async executeQuery(
    databaseName: string,
    query: string
  ): Promise<QueryResult[]> {
    const db = this.databases.get(databaseName);
    if (!db) {
      throw new Error(`Database "${databaseName}" not found`);
    }
    
    try {
      const results = db.exec(query);
      return results.map(result => ({
        columns: result.columns,
        values: result.values,
      }));
    } catch (error) {
      throw new Error(
        `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Reset a database to its initial state
   */
  async resetDatabase(config: DatabaseConfig): Promise<void> {
    const existingDb = this.databases.get(config.name);
    if (existingDb) {
      existingDb.close();
      this.databases.delete(config.name);
    }
    
    await this.getDatabase(config);
  }
  
  /**
   * Get all table names in a database
   */
  async getTableNames(databaseName: string): Promise<string[]> {
    const results = await this.executeQuery(
      databaseName,
      'SELECT name FROM sqlite_master WHERE type="table"'
    );
    
    if (!results.length || !results[0].values.length) {
      return [];
    }
    
    return results[0].values.map(row => row[0] as string);
  }
  
  /**
   * Get table schema
   */
  async getTableSchema(
    databaseName: string,
    tableName: string
  ): Promise<any[]> {
    const results = await this.executeQuery(
      databaseName,
      `PRAGMA table_info(${tableName})`
    );
    
    if (!results.length) return [];
    
    return results[0].values.map(row => ({
      cid: row[0],
      name: row[1],
      type: row[2],
      notnull: row[3],
      dflt_value: row[4],
      pk: row[5],
    }));
  }
  
  /**
   * Close a database and free memory
   */
  closeDatabase(databaseName: string): void {
    const db = this.databases.get(databaseName);
    if (db) {
      db.close();
      this.databases.delete(databaseName);
    }
  }
  
  /**
   * Close all databases
   */
  closeAll(): void {
    this.databases.forEach(db => db.close());
    this.databases.clear();
  }
}

export const databaseService = DatabaseService.getInstance();

// React Hook for database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDatabase(config: DatabaseConfig) {
  const queryClient = useQueryClient();
  
  // Initialize database
  const { data: database, isLoading: isInitializing } = useQuery({
    queryKey: ['database', config.name],
    queryFn: () => databaseService.getDatabase(config),
    staleTime: Infinity,
  });
  
  // Execute query
  const executeQuery = useMutation({
    mutationFn: (query: string) =>
      databaseService.executeQuery(config.name, query),
    onError: (error) => {
      console.error('Query execution error:', error);
    },
  });
  
  // Reset database
  const resetDatabase = useMutation({
    mutationFn: () => databaseService.resetDatabase(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', config.name] });
    },
  });
  
  // Get table names
  const { data: tableNames = [] } = useQuery({
    queryKey: ['database', config.name, 'tables'],
    queryFn: () => databaseService.getTableNames(config.name),
    enabled: !!database,
  });
  
  return {
    database,
    isInitializing,
    executeQuery: executeQuery.mutateAsync,
    isExecuting: executeQuery.isPending,
    queryError: executeQuery.error,
    queryResult: executeQuery.data,
    resetDatabase: resetDatabase.mutateAsync,
    isResetting: resetDatabase.isPending,
    tableNames,
  };
}