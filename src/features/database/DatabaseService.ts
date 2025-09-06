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

export class DatabaseService {
  private static instance: DatabaseService;
  private SQL?: any;
  private databases: Map<string, Database> = new Map();
  private initPromise?: Promise<void>;
  
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
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }
  
  private async _doInitialize(): Promise<void> {
    try {
      this.SQL = await initSqlJs({
        locateFile: (file) => `/sqljs/${file}`,
      });
      console.log('SQL.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQL.js:', error);
      throw error;
    }
  }
  
  /**
   * Check if SQL.js is ready
   */
  isReady(): boolean {
    return !!this.SQL;
  }

  /**
   * Get or create a database instance for the given config
   */
  async getDatabase(config: DatabaseConfig): Promise<Database> {
    if (!this.SQL) {
      await this.initialize();
    }

    const existing = this.databases.get(config.name);
    if (existing) {
      return existing;
    }

    const db = new this.SQL.Database();
    // Apply schema if provided
    if (config.schema && config.schema.trim().length > 0) {
      try {
        db.exec(config.schema);
      } catch (err) {
        console.error('Failed to apply schema:', err);
        throw err;
      }
    }
    this.databases.set(config.name, db);
    return db;
  }

  /**
   * Execute a query against a named database
   */
  async executeQuery(databaseName: string, query: string): Promise<QueryResult[]> {
    const db = this.databases.get(databaseName);
    if (!db) {
      throw new Error(`Database '${databaseName}' not found`);
    }
    try {
      const results: QueryExecResult[] = db.exec(query);
      return results.map((r) => ({ columns: r.columns, values: r.values }));
    } catch (err) {
      console.error('Query execution error:', err);
      throw err instanceof Error ? err : new Error('Query execution failed');
    }
  }

  /**
   * Reset a database by name/config (close and recreate)
   */
  async resetDatabase(config: DatabaseConfig): Promise<void> {
    const existing = this.databases.get(config.name);
    if (existing) {
      try {
        existing.close();
      } catch {
        // ignore close errors
      }
      this.databases.delete(config.name);
    }
    await this.getDatabase(config);
  }

  /**
   * Get list of user tables in a database
   */
  async getTableNames(databaseName: string): Promise<string[]> {
    const db = this.databases.get(databaseName);
    if (!db) return [];
    try {
      const res = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
      );
      if (!res || res.length === 0) return [];
      const first = res[0];
      const idx = first.columns.findIndex((c) => c.toLowerCase() === 'name');
      return first.values.map((row) => String(row[idx]));
    } catch (err) {
      console.error('Failed to get table names:', err);
      return [];
    }
  }
}
