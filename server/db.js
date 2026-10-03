import 'dotenv/config';
import { createClient } from '@libsql/client';

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
let client;

function getClient() {
  if (!databaseUrl) {
    throw new Error('TURSO_DATABASE_URL is required to connect to the Turso database.');
  }
  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required to connect to the Turso database.');
  }
  if (!client) {
    client = createClient({ url: databaseUrl, authToken });
  }
  return client;
}

export async function queryAll(sql, args = []) {
  const result = await getClient().execute({ sql, args });
  return result.rows.map((row) => Object.fromEntries(
    result.columns.map((column, index) => [column, row[index]])
  ));
}

export async function queryOne(sql, args = []) {
  return (await queryAll(sql, args))[0] || null;
}

export function execute(sql, args = []) {
  return getClient().execute({ sql, args });
}

export function getDatabasePath() {
  return databaseUrl || 'TURSO_DATABASE_URL not configured';
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
        : [{ id: 1, name: 'Coca-Cola Classic', price: 1.75, barcode: '049000028904' }];

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

  const settingRow = await queryOne("SELECT value FROM system_settings WHERE key = 'demo_cleared'");
  const isDemoCleared = settingRow ? settingRow.value === '1' : false;

  if (!process.env.VERCEL && !isDemoCleared) {
    const countExpenses = (await queryOne('SELECT COUNT(*) AS total FROM expenses')).total;
    if (countExpenses === 0) {
      console.log('Seeding baseline operating expenses into Turso...');
      await seedExpenses();
    }

    const countSales = (await queryOne('SELECT COUNT(*) AS total FROM sales')).total;
    if (countSales === 0) {
      console.log('Seeding 30-day baseline retail sales into Turso...');
      await seedSales();
    }
  } else {
    console.log('Demo data was explicitly purged. Keeping clean empty state.');
  }

  console.log('Turso database ready.');
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
  console.log('All mock sales, items, and expenses cleared from Turso.');
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
  console.log('Demo baseline sales and expenses re-seeded in Turso.');
  return { success: true, message: 'Demo baseline data successfully re-seeded.' };
}
