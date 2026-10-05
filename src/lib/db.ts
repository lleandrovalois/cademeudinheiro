import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let client: Client | null = null;
let isInitialized = false;

export function getDb(): Client {
  if (!client) {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {
          // ignore
        }
      }
      dbUrl = `file:${path.join(dataDir, 'cademeudinheiro.db')}`;
    }
    client = createClient({ url: dbUrl });
  }
  return client;
}

export async function ensureDbInitialized() {
  if (isInitialized) return;
  const db = getDb();

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      installment_id TEXT,
      recurring_id TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS recurring_bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      due_day INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      paid_months TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS installment_purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      total_amount REAL NOT NULL,
      installment_amount REAL NOT NULL,
      total_installments INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      category TEXT NOT NULL,
      payment_card TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      month TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      deadline TEXT,
      color TEXT NOT NULL,
      icon TEXT NOT NULL
    );`,

    `CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);`,
    `CREATE INDEX IF NOT EXISTS idx_rec_user ON recurring_bills(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_inst_user ON installment_purchases(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_cat_user ON categories(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_bdg_user_month ON budgets(user_id, month);`,
    `CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id);`
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }

  isInitialized = true;
}
