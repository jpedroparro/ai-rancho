/**
 * Cria um banco SQLite em memória limpo para cada teste.
 * Seta o global `_airancho_db` para que getDb() o encontre
 * sem acessar o sistema de arquivos.
 */

const g = global as any

export async function initTestDb(): Promise<any> {
  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // Mesmo schema de src/lib/database.ts
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
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
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
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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

  g._airancho_db = db
  return db
}

export function clearTestDb() {
  if (g._airancho_db) {
    g._airancho_db.close()
    delete g._airancho_db
  }
}

/** Insere uma fazenda e usuário demo no banco de testes */
export function seedFarm(db: any, farmId = 'farm-1', userId = 'user-1') {
  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, role) VALUES (?, ?, '', 'USER')`,
    [userId, `${userId}@test.com`]
  )
  db.run(
    `INSERT OR IGNORE INTO farms (id, name, userId) VALUES (?, ?, ?)`,
    [farmId, 'Fazenda Teste', userId]
  )
}
