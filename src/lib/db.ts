import pg from "pg";
import mysql from "mysql2/promise";
import sqlite from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Priority: Postgres (Supabase) > MySQL > SQLite
const isPostgres = !!process.env.DATABASE_URL;
const isSQLite = !isPostgres && (process.env.USE_SQLITE === "true" || !process.env.DB_HOST);

let pgPool: pg.Pool | null = null;
let mysqlPool: mysql.Pool | null = null;
let sqliteDb: sqlite.Database | null = null;

if (isPostgres) {
  console.log("Using PostgreSQL (Supabase)");
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // 10s timeout
  });
} else if (isSQLite) {
  console.log("Using SQLite fallback");
  sqliteDb = new sqlite(path.resolve(__dirname, "../../honey.db"));
  sqliteDb.pragma('journal_mode = WAL');
} else if (process.env.DB_HOST) {
  console.log("Using MySQL");
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  };
  mysqlPool = mysql.createPool(dbConfig);
} else {
  console.error("NO DATABASE CONFIGURATION FOUND! Please set DATABASE_URL or DB_HOST.");
}

export const db = {
  isPostgres,
  isSQLite,
  async query(sql: string, params?: any[]): Promise<any> {
    if (isPostgres && pgPool) {
      // Postgres uses $1, $2 instead of ?
      let pgSql = sql;
      if (params && params.length > 0) {
        let count = 0;
        pgSql = sql.replace(/\?/g, () => {
          count++;
          return `$${count}`;
        });
      }
      
      // Basic translation for common v4 migration issues
      pgSql = pgSql
        .replace(/INSERT IGNORE/g, "INSERT") 
        .replace(/INSERT OR IGNORE/g, "INSERT")
        .replace(/INT AUTO_INCREMENT/g, "SERIAL")
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY");

      // Handle insertId for Postgres
      const isInsert = pgSql.trim().toUpperCase().startsWith("INSERT");
      if (isInsert && !pgSql.toUpperCase().includes("RETURNING")) {
        pgSql += " RETURNING id";
      }

      try {
        const result = await pgPool.query(pgSql, params);
        
        // Map results to match expected casing and handle BigInts
        const rows = result.rows.map(row => {
          const newRow: any = {};
          for (const key in row) {
            let val = row[key];
            if (typeof val === 'string' && /^\d+$/.test(val) && val.length < 15) {
              val = Number(val);
            }
            
            let newKey = key;
            const mappings: any = {
              'passwordhash': 'passwordHash',
              'customername': 'customerName',
              'totalamount': 'totalAmount',
              'paymentmethod': 'paymentMethod',
              'paymentid': 'paymentId',
              'originalprice': 'originalPrice',
              'seotitle': 'seoTitle',
              'seodescription': 'seoDescription',
              'seokeywords': 'seoKeywords',
              'key_name': 'key_name',
              'key_value': 'key_value'
            };
            if (mappings[key]) newKey = mappings[key];
            newRow[newKey] = val;
          }
          return newRow;
        });

        if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("SHOW")) {
          return [rows, result.fields];
        } else {
          return [{ insertId: (rows[0] as any)?.id || null, affectedRows: result.rowCount }];
        }
      } catch (err: any) {
        console.error("Postgres Query Error:", err.message, "SQL:", pgSql.substring(0, 100));
        throw err;
      }
    } else if (isSQLite && sqliteDb) {
      const normalizedSql = sql
        .replace(/INSERT IGNORE/g, "INSERT OR IGNORE")
        .replace(/INT AUTO_INCREMENT/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
        .replace(/TINYINT\(1\)/g, "INTEGER")
        .replace(/DECIMAL\(\d+,\d+\)/g, "REAL");

      if (normalizedSql.includes(';') && normalizedSql.trim().split(';').filter(s => s.trim()).length > 1) {
        const statements = normalizedSql.split(';').filter(s => s.trim());
        let lastResult: any = null;
        for (const s of statements) {
          lastResult = this.executeSingle(s, params);
        }
        return lastResult;
      }

      return this.executeSingle(normalizedSql, params);
    } else if (mysqlPool) {
      return await mysqlPool.query(sql, params);
    }
    throw new Error("Database not initialized");
  },

  executeSingle(sql: string, params?: any[]) {
    if (!sqliteDb) return [[]];
    const stmt = sqliteDb.prepare(sql);
    const upperSql = sql.trim().toUpperCase();
    if (upperSql.startsWith("SELECT") || upperSql.startsWith("SHOW") || upperSql.startsWith("PRAGMA")) {
      const rows = stmt.all(...(params || []));
      return [rows];
    } else {
      const info = stmt.run(...(params || []));
      return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
    }
  },

  async getConnection(): Promise<any> {
    if (isPostgres && pgPool) {
      const client = await pgPool.connect();
      return {
        query: (sql: string, params?: any[]) => this.query(sql, params),
        beginTransaction: async () => client.query("BEGIN"),
        commit: async () => client.query("COMMIT"),
        rollback: async () => client.query("ROLLBACK"),
        release: () => client.release()
      };
    } else if (isSQLite && sqliteDb) {
      return {
        query: (sql: string, params?: any[]) => this.query(sql, params),
        beginTransaction: async () => sqliteDb!.prepare("BEGIN").run(),
        commit: async () => sqliteDb!.prepare("COMMIT").run(),
        rollback: async () => sqliteDb!.prepare("ROLLBACK").run(),
        release: () => {}
      };
    } else if (mysqlPool) {
      return await mysqlPool.getConnection();
    }
    throw new Error("Database not initialized");
  }
};
