const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(path.join(dataDir, 'avtr.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    email TEXT,
    phone TEXT,
    tax_number TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    tax_rate REAL DEFAULT 6,
    currency TEXT DEFAULT 'RM',
    invoice_prefix TEXT DEFAULT 'INV',
    logo_width INTEGER DEFAULT 120,
    sign_width INTEGER DEFAULT 72,
    payment_instruction TEXT,
    signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS items_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit_price REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    client_id INTEGER,
    invoice_number TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    date TEXT NOT NULL,
    due_date TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    invoice_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  );
`);

// Seed default user + 2 businesses on first run
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('avtr2024', 10);
  const user = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  db.prepare('INSERT INTO businesses (user_id, name, currency, tax_rate, invoice_prefix) VALUES (?, ?, ?, ?, ?)').run(user.lastInsertRowid, 'Business 1', 'RM', 6, 'INV');
  db.prepare('INSERT INTO businesses (user_id, name, currency, tax_rate, invoice_prefix) VALUES (?, ?, ?, ?, ?)').run(user.lastInsertRowid, 'Business 2', 'RM', 6, 'INV');
  console.log('✅ Default account created. Password: avtr2024');
}

// Migrations for existing DBs
try { db.exec('ALTER TABLE businesses ADD COLUMN logo_width INTEGER DEFAULT 120') } catch {}
try { db.exec('ALTER TABLE businesses ADD COLUMN payment_instruction TEXT') } catch {}
try { db.exec('ALTER TABLE businesses ADD COLUMN signature TEXT') } catch {}
try { db.exec('ALTER TABLE businesses ADD COLUMN sign_width INTEGER DEFAULT 72') } catch {}

module.exports = db;
