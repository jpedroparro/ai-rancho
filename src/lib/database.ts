import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'dev.db')

// Use global to survive HMR in development
const g = global as unknown as { _airancho_db: any }

export async function getDb(): Promise<any> {
  if (g._airancho_db) return g._airancho_db

  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()

  const db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database()

  const origRun = db.run.bind(db)
  db.run = (...args: any[]) => {
    const result = origRun(...args)
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
    return result
  }

  initSchema(db)
  g._airancho_db = db
  return db
}

function initSchema(db: any): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'USER',
      farmName TEXT,
      provider TEXT NOT NULL DEFAULT 'credentials',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      hectares REAL,
      description TEXT,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      tag TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      breed TEXT,
      birthDate TEXT,
      gender TEXT NOT NULL DEFAULT 'FEMALE',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      weight REAL,
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS milk_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      date TEXT NOT NULL,
      morning REAL NOT NULL DEFAULT 0,
      evening REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      pricePerUnit REAL NOT NULL,
      total REAL NOT NULL,
      buyer TEXT,
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      supplier TEXT,
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      salary REAL NOT NULL DEFAULT 0,
      phone TEXT,
      startDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'SALARY',
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employeeId) REFERENCES employees(id)
    );
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      farmId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      eventType TEXT NOT NULL DEFAULT 'OTHER',
      date TEXT NOT NULL,
      animalId TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      farmId TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'OTHER',
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'un',
      minQuantity REAL NOT NULL DEFAULT 0,
      costPerUnit REAL NOT NULL DEFAULT 0,
      supplier TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weights (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      notes TEXT,
      farmId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS health_events (
      id TEXT PRIMARY KEY,
      animalId TEXT,
      farmId TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      dose TEXT,
      product TEXT,
      veterinarian TEXT,
      withdrawalDays INTEGER DEFAULT 0,
      withdrawalEndDate TEXT,
      famacha INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'DONE',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reproduction_events (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      farmId TEXT,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      result TEXT,
      bullId TEXT,
      calvingDate TEXT,
      calfId TEXT,
      daysOpen INTEGER,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS milk_stock_movements (
      id TEXT PRIMARY KEY,
      farmId TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT NOT NULL,
      quantity REAL NOT NULL,
      saleId TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sale_animals (
      saleId TEXT NOT NULL,
      animalId TEXT NOT NULL,
      weight REAL,
      pricePerKg REAL,
      PRIMARY KEY (saleId, animalId)
    );
    CREATE TABLE IF NOT EXISTS shearing_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      farmId TEXT,
      date TEXT NOT NULL,
      woolWeight REAL NOT NULL,
      quality TEXT,
      serviceProvider TEXT,
      costPerAnimal REAL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      farmId TEXT,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      targetValue REAL NOT NULL,
      periodType TEXT NOT NULL DEFAULT 'MONTHLY',
      periodValue TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Idempotent migrations: add farmId to existing tables created before multi-fazenda
  const migrations = [
    'ALTER TABLE animals ADD COLUMN farmId TEXT',
    'ALTER TABLE milk_records ADD COLUMN farmId TEXT',
    'ALTER TABLE sales ADD COLUMN farmId TEXT',
    'ALTER TABLE expenses ADD COLUMN farmId TEXT',
    'ALTER TABLE employees ADD COLUMN farmId TEXT',
    'ALTER TABLE sales ADD COLUMN animalIds TEXT',
  ]
  for (const sql of migrations) {
    try { db.run(sql) } catch { /* column already exists */ }
  }
}

export function qRows(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) results.push(stmt.getAsObject())
  stmt.free()
  return results
}

export function qRow(db: any, sql: string, params: any[] = []): any | null {
  return qRows(db, sql, params)[0] ?? null
}

export function newId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/** Builds a SQL farmId IN (?) fragment for farm-scoped queries. */
export function farmClause(farmIds: string[] | undefined): { sql: string; params: any[] } {
  if (!farmIds) return { sql: '', params: [] }
  if (farmIds.length === 0) return { sql: ' AND 1=0', params: [] }
  const ph = farmIds.map(() => '?').join(',')
  return { sql: ` AND farmId IN (${ph})`, params: farmIds }
}
