import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Potential paths to locate the shared NovaPOS database
const candidatePaths = [
  path.resolve(__dirname, '../../pdv-vue2/server/database.sqlite'),
  path.resolve(process.cwd(), '../pdv-vue2/server/database.sqlite'),
  path.resolve(process.cwd(), 'pdv-vue2/server/database.sqlite'),
  'C:/DEVS/Projects_JS/MyProjects_JS/pdv-vue2/server/database.sqlite',
  path.resolve(__dirname, 'database.sqlite')
];

let sharedDbPath = candidatePaths[candidatePaths.length - 1]; // fallback

for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    sharedDbPath = candidate;
    break;
  }
}

console.log('⚡ NovaMetrics Database Link Target:', sharedDbPath);

export const db = new DatabaseSync(sharedDbPath);

// Enable SQLite Write-Ahead Logging (WAL) and 5000ms busy timeout for concurrent multi-process access
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
`);

export function getDatabasePath() {
  return sharedDbPath;
}

function seedExpenses() {
  const now = new Date();
  const curMonth = now.toISOString().slice(0, 7);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, description, amount, payment_method, date, operator)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const baselineExpenses = [
    ['Rent & Facilities', 'Commercial Retail Store Rent', 1850.00, 'Bank Transfer', `${curMonth}-05T10:00:00.000Z`, 'STORE MANAGER'],
    ['Utilities', 'Commercial Electricity & HVAC', 345.80, 'Direct Debit', `${curMonth}-10T11:30:00.000Z`, 'STORE MANAGER'],
    ['Technology & SaaS', 'Cloud Infrastructure & High-Speed Fiber', 129.00, 'Credit Card', `${curMonth}-10T14:00:00.000Z`, 'STORE MANAGER'],
    ['Inventory Restock', 'Wholesale Beverages Distributor Restock', 820.50, 'Bank Transfer', `${curMonth}-12T09:15:00.000Z`, 'STORE MANAGER'],
    ['Inventory Restock', 'Fresh Bakery & Ingredients Supply', 640.00, 'Bank Transfer', `${curMonth}-18T08:45:00.000Z`, 'STORE MANAGER'],
    ['Maintenance & Supplies', 'POS Thermal Paper Rolls & Retail Bags', 95.40, 'Credit Card', `${curMonth}-20T16:20:00.000Z`, 'STORE MANAGER'],
    ['Payroll', 'Front-line Cashier Operator Payroll', 1400.00, 'Bank Transfer', `${curMonth}-25T18:00:00.000Z`, 'STORE MANAGER']
  ];

  for (const item of baselineExpenses) {
    insertExpense.run(...item);
  }
}

function seedSales() {
  const now = new Date();
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Pix'];
  const productsInDb = db.prepare('SELECT id, name, price, category, barcode FROM products').all();

  const insertSale = db.prepare(`
    INSERT INTO sales (sale_number, user_id, operator_name, subtotal, discount_total, tax_amount, total_amount, payment_method, received_amount, change_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, product_id, name, barcode, qty, unit_price, discount, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let saleNum = 1001;

  for (let i = 29; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dailyCount = 3 + ((i * 3) % 4);

    for (let s = 1; s <= dailyCount; s++) {
      const pm = paymentMethods[(i + s) % paymentMethods.length];
      const hour = 9 + ((s * 2) % 11);
      const minute = (s * 17) % 60;
      const timeStamp = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

      const itemsToPick = productsInDb.length > 0 
        ? [productsInDb[(i + s) % productsInDb.length], productsInDb[(i * 2 + s) % productsInDb.length]].filter(Boolean)
        : [{ id: 1, name: 'Coca-Cola Classic', price: 1.75, barcode: '049000028904' }];

      let subtotal = 0;
      itemsToPick.forEach(p => {
        subtotal += (Number(p.price) || 2.50) * 2;
      });

      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const operator = s % 2 === 0 ? 'STORE MANAGER' : 'CASHIER OPERATOR';

      const result = insertSale.run(
        saleNum,
        s % 2 === 0 ? 8 : 2,
        operator,
        subtotal,
        0,
        tax,
        total,
        pm,
        total + 5.00,
        5.00,
        timeStamp
      );

      const newSaleId = result.lastInsertRowid;

      itemsToPick.forEach(p => {
        insertSaleItem.run(
          newSaleId,
          p.id,
          p.name,
          p.barcode || '000000000000',
          2,
          p.price,
          0,
          p.price * 2
        );
      });

      saleNum++;
    }
  }
}

/**
 * Initialize shared database tables
 */
export function initSharedDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_code TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      max_discount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      unit TEXT DEFAULT 'EA'
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number INTEGER NOT NULL,
      user_id INTEGER,
      operator_name TEXT,
      subtotal REAL NOT NULL,
      discount_total REAL DEFAULT 0,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      received_amount REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      operator TEXT DEFAULT 'STORE MANAGER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const settingRow = db.prepare("SELECT value FROM system_settings WHERE key = 'demo_cleared'").get();
  const isDemoCleared = settingRow ? settingRow.value === '1' : false;

  if (!isDemoCleared) {
    const countExpenses = db.prepare('SELECT COUNT(*) AS total FROM expenses').get().total;
    if (countExpenses === 0) {
      console.log('📦 Seeding baseline operating expenses into shared SQLite database...');
      seedExpenses();
    }

    const countSales = db.prepare('SELECT COUNT(*) AS total FROM sales').get().total;
    if (countSales === 0) {
      console.log('🛒 Seeding 30-day baseline retail sales into shared SQLite database...');
      seedSales();
    }
  } else {
    console.log('🛡️ Demo data was explicitly purged by user. Keeping clean empty state.');
  }

  console.log('✅ Shared SQLite Database ready.');
}

/**
 * Clear all demo / mock sales, items, and expenses
 */
export function clearAllDemoData() {
  db.exec(`
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM expenses;
    INSERT OR REPLACE INTO system_settings (key, value) VALUES ('demo_cleared', '1');
  `);
  console.log('🗑️ All mock sales, items, and expenses successfully cleared from SQLite database.');
  return { success: true, message: 'All mock transactions cleared successfully.' };
}

/**
 * Reload demo baseline data for testing/presentation
 */
export function seedDemoBaseline() {
  db.exec(`
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM expenses;
    INSERT OR REPLACE INTO system_settings (key, value) VALUES ('demo_cleared', '0');
  `);
  seedExpenses();
  seedSales();
  console.log('⚡ Demo baseline sales and expenses re-seeded.');
  return { success: true, message: 'Demo baseline data successfully re-seeded.' };
}
