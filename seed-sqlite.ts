import sqlite from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const dbPath = path.resolve(__dirname, "honey.db");
  const db = new sqlite(dbPath);
  
  console.log(`Seeding database at ${dbPath}...`);
  
  const seedSqlPath = path.resolve(__dirname, "database_seed.sql");
  let seedSql = fs.readFileSync(seedSqlPath, "utf8");

  // Adapt MySQL SQL for SQLite
  const adaptedSql = seedSql
    .replace(/INT AUTO_INCREMENT/g, "INTEGER") // We'll handle PRIMARY KEY separately if needed, or just let it be
    .replace(/PRIMARY KEY/g, "PRIMARY KEY")
    .replace(/AUTO_INCREMENT/g, "AUTOINCREMENT")
    .replace(/VARCHAR\(\d+\)/g, "TEXT")
    .replace(/TINYINT\(1\)/g, "INTEGER")
    .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, "DATETIME DEFAULT CURRENT_TIMESTAMP")
    .replace(/INSERT IGNORE/g, "INSERT OR IGNORE")
    .replace(/SET FOREIGN_KEY_CHECKS = \d;/g, "")
    .replace(/TRUNCATE TABLE (\w+);/g, "DELETE FROM $1;")
    // Special fix for "id INT AUTO_INCREMENT PRIMARY KEY"
    .replace(/id INT AUTOINCREMENT PRIMARY KEY/g, "id INTEGER PRIMARY KEY AUTOINCREMENT")
    .replace(/id INT PRIMARY KEY AUTOINCREMENT/g, "id INTEGER PRIMARY KEY AUTOINCREMENT")
    .replace(/id INT AUTO_INCREMENT/g, "id INTEGER PRIMARY KEY AUTOINCREMENT");

  try {
    // Split into individual statements because exec can sometimes be picky or we want better error reporting
    const statements = adaptedSql.split(';').filter(s => s.trim());
    
    db.prepare("BEGIN").run();
    for (let statement of statements) {
      if (statement.trim()) {
        db.prepare(statement).run();
      }
    }
    db.prepare("COMMIT").run();
    
    console.log("Database seeded successfully!");
  } catch (err) {
    db.prepare("ROLLBACK").run();
    console.error("Error seeding database:", err);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
