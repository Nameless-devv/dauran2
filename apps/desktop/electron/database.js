/**
 * sql.js (WebAssembly SQLite) asosida offline database.
 * Native build kerak emas — barcha platformalarda ishlaydi.
 */
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;
let dbPath = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, barcode TEXT UNIQUE NOT NULL, sku TEXT, name TEXT NOT NULL,
    category_name TEXT, unit TEXT DEFAULT 'pcs', sale_price REAL NOT NULL,
    cost_price REAL DEFAULT 0, vat_rate REAL DEFAULT 12,
    is_weighable INTEGER DEFAULT 0, stock_qty REAL DEFAULT 0, synced_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY, server_id TEXT, cashier_id TEXT NOT NULL, cashier_name TEXT,
    opened_at TEXT NOT NULL, closed_at TEXT, opening_cash REAL DEFAULT 0,
    closing_cash REAL, total_sales REAL DEFAULT 0, sales_count INTEGER DEFAULT 0,
    is_closed INTEGER DEFAULT 0, synced INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, server_id TEXT, receipt_no TEXT UNIQUE NOT NULL, shift_id TEXT,
    cashier_id TEXT NOT NULL, customer_id TEXT, subtotal REAL NOT NULL,
    discount REAL DEFAULT 0, total REAL NOT NULL, paid REAL NOT NULL,
    change_amount REAL DEFAULT 0, payment_type TEXT DEFAULT 'cash',
    bonus_used REAL DEFAULT 0, bonus_earned REAL DEFAULT 0,
    status TEXT DEFAULT 'completed', created_at TEXT NOT NULL, synced INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, product_id TEXT NOT NULL,
    product_name TEXT NOT NULL, qty REAL NOT NULL, price REAL NOT NULL,
    discount REAL DEFAULT 0, total REAL NOT NULL, vat_rate REAL DEFAULT 12
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, phone TEXT UNIQUE NOT NULL, name TEXT,
    bonus_balance REAL DEFAULT 0, card_no TEXT, synced_at TEXT
  );
`;

async function setupDatabase() {
  if (db) return { run: runQuery, all: getAll, get: getOne };

  const SqlJs = await require('sql.js')({
    locateFile: (file) => {
      // sql.js WASM faylini topish
      const candidates = [
        path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
        path.join(__dirname, '..', '..', '..', 'node_modules', '.pnpm', 'sql.js@1.12.0', 'node_modules', 'sql.js', 'dist', file),
      ];
      return candidates.find(p => fs.existsSync(p)) || candidates[0];
    },
  });

  dbPath = app
    ? path.join(app.getPath('userData'), 'dauran-pos.db')
    : path.join(__dirname, '../dauran-pos.db');

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SqlJs.Database(fileBuffer);
  } else {
    db = new SqlJs.Database();
  }

  db.run(SCHEMA);
  saveDb();
  setInterval(saveDb, 30000);

  return { run: runQuery, all: getAll, get: getOne };
}

function saveDb() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

function runQuery(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

function getAll(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function getOne(sql, params = []) {
  return getAll(sql, params)[0] || null;
}

module.exports = { setupDatabase, runQuery, getAll, getOne, saveDb };
