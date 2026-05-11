import mysql from "mysql2/promise";
import sqlite from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// fallback to SQLite if DB_HOST is not set or USE_SQLITE is true
const isSQLite = process.env.USE_SQLITE === "true" || !process.env.DB_HOST;

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: sqlite.Database | null = null;

if (isSQLite) {
  console.log("Using SQLite fallback");
  sqliteDb = new sqlite(path.resolve(__dirname, "../../honey.db"));
  sqliteDb.pragma('journal_mode = WAL');
} else {
  const dbConfig = {
    host: process.env.DB_HOST || '82.25.121.98',
    user: process.env.DB_USER || 'u711900092_livegreen',
    password: process.env.DB_PASSWORD || 'Livegreen@2025',
    database: process.env.DB_NAME || 'u711900092_livegreen',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  };
  mysqlPool = mysql.createPool(dbConfig);
}

export const db = {
  isSQLite,
  async query(sql: string, params?: any[]): Promise<any> {
    if (isSQLite && sqliteDb) {
      const normalizedSql = sql
        .replace(/INSERT IGNORE/g, "INSERT OR IGNORE")
        .replace(/INT AUTO_INCREMENT/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
        .replace(/TINYINT\(1\)/g, "INTEGER")
        .replace(/DECIMAL\(\d+,\d+\)/g, "REAL");

      // Handle multiple statements if necessary (rudimentary split)
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
    if (isSQLite && sqliteDb) {
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
