import 'dotenv/config';
import { createClient } from '@libsql/client/web';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const isTurso = Boolean(databaseUrl);
let tursoClient = null;
let localSqliteDb = null;
let localDbPath = null;

export function isUsingTurso() {
  return isTurso;
}

// Find candidate paths for local SQLite fallback
const candidatePaths = [
  path.resolve(__dirname, '../../pdv-vue2/server/database.sqlite'),
  path.resolve(process.cwd(), '../pdv-vue2/server/database.sqlite'),
  path.resolve(process.cwd(), 'pdv-vue2/server/database.sqlite'),
  'C:/DEVS/Projects_JS/MyProjects_JS/pdv-vue2/server/database.sqlite',
  path.resolve(__dirname, 'database.sqlite')
];

function getLocalDbPath() {
  if (localDbPath) return localDbPath;
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      localDbPath = candidate;
      return localDbPath;
    }
  }
  localDbPath = candidatePaths[candidatePaths.length - 1];
  return localDbPath;
}

export function getDatabasePath() {
  if (isTurso) {
    return databaseUrl;
  }
  return getLocalDbPath();
}

function getClient() {
  if (isTurso) {
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN is required to connect to the Turso database.');
    }
    if (!tursoClient) {
      tursoClient = createClient({ url: databaseUrl, authToken });
    }
    return tursoClient;
  }

  if (process.env.VERCEL) {
    throw new Error('TURSO_DATABASE_URL is required when running serverless on Vercel.');
  }

  if (!localSqliteDb) {
    const targetPath = getLocalDbPath();
    localSqliteDb = new DatabaseSync(targetPath);
    localSqliteDb.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;
    `);
  }
  return localSqliteDb;
}

export async function queryAll(sql, args = []) {
  if (isTurso) {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return result.rows.map((row) =>
      Object.fromEntries(result.columns.map((column, index) => [column, row[index]]))
    );
  } else {
    const db = getClient();
    return db.prepare(sql).all(...args);
  }
}

export async function queryOne(sql, args = []) {
  if (isTurso) {
    const rows = await queryAll(sql, args);
    return rows[0] || null;
  } else {
    const db = getClient();
    return db.prepare(sql).get(...args) || null;
  }
}

export async function execute(sql, args = []) {
  if (isTurso) {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return {
      lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : null,
      rowsAffected: result.rowsAffected
    };
  } else {
    const db = getClient();
    const result = db.prepare(sql).run(...args);
    return {
      lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : null,
      rowsAffected: result.changes
    };
  }
}

async function seedExpenses() {
  const now = new Date();
  const curMonth = now.toISOString().slice(0, 7);

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
    await execute(`
      INSERT INTO expenses (category, description, amount, payment_method, date, operator)
      VALUES (?, ?, ?, ?, ?, ?)
    `, item);
  }
}

async function seedSales() {
  const now = new Date();
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Pix'];
  const productsInDb = await queryAll('SELECT id, name, price, category, barcode FROM products');

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
        : [{ id: 1, name: 'Coca-Cola Classic 12oz Can', price: 1.75, barcode: '049000028904' }];

      let subtotal = 0;
      itemsToPick.forEach(p => {
        subtotal += (Number(p.price) || 2.50) * 2;
      });

      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const operator = s % 2 === 0 ? 'STORE MANAGER' : 'CASHIER OPERATOR';

      const result = await execute(`
        INSERT INTO sales (sale_number, user_id, operator_name, subtotal, discount_total, tax_amount, total_amount, payment_method, received_amount, change_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ]);

      const newSaleId = Number(result.lastInsertRowid);

      for (const product of itemsToPick) {
        await execute(`
          INSERT INTO sale_items (sale_id, product_id, name, barcode, qty, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newSaleId,
          product.id,
          product.name,
          product.barcode || '000000000000',
          2,
          product.price,
          0,
          product.price * 2
        ]);
      }

      saleNum++;
    }
  }
}

/**
 * Initialize shared database tables
 */
async function initializeDatabase() {
  getClient();

  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_code TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      max_discount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      unit TEXT DEFAULT 'EA'
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
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
    )`,
    `CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      operator TEXT DEFAULT 'STORE MANAGER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`
  ];

  for (const statement of schema) {
    await execute(statement);
  }

  // Seed default admin and cashier if users is empty
  const userCount = await queryOne('SELECT COUNT(*) AS total FROM users');
  if (!userCount || Number(userCount.total) === 0) {
    await execute(`
      INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['BADGE-9001', 'admin', 'STORE MANAGER', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'admin', 50.0]);
    await execute(`
      INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['BADGE-1002', 'clerk', 'CASHIER OPERATOR', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'cashier', 10.0]);
  }

  // Seed default products if products is empty
  const prodCount = await queryOne('SELECT COUNT(*) AS total FROM products');
  if (!prodCount || Number(prodCount.total) === 0) {
    const initialCatalog = [
      ['049000028904', 'Coca-Cola Classic 12oz Can', 1.75, 50, 'Beverages', 'EA'],
      ['049000000443', 'Diet Coke 20oz Bottle', 2.25, 40, 'Beverages', 'EA'],
      ['071142000018', 'Spring Water 16.9oz', 1.20, 100, 'Beverages', 'EA'],
      ['611269000010', 'Red Bull Energy Drink 8.4oz', 3.50, 32, 'Beverages', 'EA'],
      ['025000044005', 'Orange Juice 14oz Bottle', 2.80, 25, 'Beverages', 'EA'],
      ['852084004012', 'Cold Brew Coffee 12oz', 3.95, 20, 'Beverages', 'EA'],
      ['200000000001', 'Artisan Baguette', 3.50, 40, 'Bakery', 'EA'],
      ['200000000002', 'Ham & Cheddar Croissant', 5.75, 18, 'Prepared Food', 'EA'],
      ['200000000003', 'Blueberry Muffin', 2.95, 30, 'Bakery', 'EA'],
      ['200000000004', 'Classic Glazed Donut', 1.50, 60, 'Bakery', 'EA'],
      ['200000000005', 'Chicken Club Sandwich', 7.50, 15, 'Prepared Food', 'EA'],
      ['028400000012', 'Potato Chips Sea Salt 5oz', 3.25, 35, 'Snacks', 'EA'],
      ['034000002405', 'Milk Chocolate Bar 3.5oz', 2.10, 65, 'Candy', 'EA'],
      ['030000061203', 'Chewy Granola Bar', 1.15, 80, 'Snacks', 'EA'],
      ['022000004455', 'Peppermint Chewing Gum', 1.45, 90, 'Candy', 'EA'],
      ['041143000023', 'Roasted Almonds 2.5oz', 4.25, 30, 'Snacks', 'EA']
    ];
    for (const item of initialCatalog) {
      await execute(`
        INSERT INTO products (barcode, name, price, stock, category, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `, item);
    }
  }

  const settingRow = await queryOne("SELECT value FROM system_settings WHERE key = 'demo_cleared'");
  const isDemoCleared = settingRow ? settingRow.value === '1' : false;

  if (!process.env.VERCEL && !isDemoCleared) {
    const countExpenses = (await queryOne('SELECT COUNT(*) AS total FROM expenses')).total;
    if (countExpenses === 0) {
      console.log('Seeding baseline operating expenses into database...');
      await seedExpenses();
    }

    const countSales = (await queryOne('SELECT COUNT(*) AS total FROM sales')).total;
    if (countSales === 0) {
      console.log('Seeding 30-day baseline retail sales into database...');
      await seedSales();
    }
  } else {
    console.log('Demo data was explicitly purged or running in production clean mode.');
  }

  console.log(`✅ NovaMetrics database ready: ${getDatabasePath()}`);
}

let initialization;
export function initSharedDatabase() {
  if (!initialization) {
    initialization = initializeDatabase().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

/**
 * Clear all demo / mock sales, items, and expenses
 */
export async function clearAllDemoData() {
  await execute('DELETE FROM sale_items');
  await execute('DELETE FROM sales');
  await execute('DELETE FROM expenses');
  await execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('demo_cleared', '1')");
  console.log('All mock sales, items, and expenses cleared.');
  return { success: true, message: 'All mock transactions cleared successfully.' };
}

/**
 * Reload demo baseline data for testing/presentation
 */
export async function seedDemoBaseline() {
  await execute('DELETE FROM sale_items');
  await execute('DELETE FROM sales');
  await execute('DELETE FROM expenses');
  await execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('demo_cleared', '0')");
  await seedExpenses();
  await seedSales();
  console.log('Demo baseline sales and expenses re-seeded.');
  return { success: true, message: 'Demo baseline data successfully re-seeded.' };
}
