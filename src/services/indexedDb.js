/**
 * IndexedDB Service for NovaMetrics Financial Dashboard
 * Offline-first persistent storage using browser native IndexedDB
 */

const DB_NAME = 'NovaMetricsDB';
const DB_VERSION = 1;
const STORE_TRANSACTIONS = 'transactions';
const STORE_SETTINGS = 'settings';

let dbInstance = null;

export function openDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Transactions store
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        const store = db.createObjectStore(STORE_TRANSACTIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('pos_sale_id', 'pos_sale_id', { unique: false });
      }

      // 2. Settings store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Fetch all financial transactions
 * @returns {Promise<Array>}
 */
export async function getAllTransactions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort newest first
      const items = (request.result || []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(items);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Add a new financial transaction
 * @param {Object} item 
 * @returns {Promise<Object>}
 */
export async function addTransaction(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSACTIONS);

    const record = {
      ...item,
      amount: Number(item.amount) || 0,
      date: item.date || new Date().toISOString(),
      source: item.source || 'manual',
      created_at: new Date().toISOString()
    };

    const request = store.add(record);

    request.onsuccess = () => {
      record.id = request.result;
      resolve(record);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Bulk add transactions (used for NovaPOS sync)
 * @param {Array} items 
 * @returns {Promise<number>} count of added items
 */
export async function bulkAddTransactions(items) {
  if (!items || items.length === 0) return 0;
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    let addedCount = 0;

    items.forEach((item) => {
      const record = {
        ...item,
        amount: Number(item.amount) || 0,
        date: item.date || new Date().toISOString(),
        source: item.source || 'pos_sync',
        created_at: new Date().toISOString()
      };
      store.add(record);
      addedCount++;
    });

    tx.oncomplete = () => resolve(addedCount);
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete a transaction by ID
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
export async function deleteTransaction(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    const request = store.delete(Number(id));

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clear all transactions
 */
export async function clearTransactions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Seed realistic baseline transactions if DB is empty
 */
export async function seedInitialDataIfEmpty() {
  const isCleared = localStorage.getItem('novametrics_demo_cleared') === '1';
  if (isCleared) {
    return await getAllTransactions();
  }

  const existing = await getAllTransactions();
  if (existing && existing.length > 0) return existing;

  console.log('⚡ Seeding baseline retail financial data in IndexedDB...');

  const now = new Date();
  const seedItems = [];

  // 1. Generate 30 days of daily sales (Revenues)
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Pix'];
  const categories = ['Beverages', 'Bakery', 'Snacks', 'Prepared Food', 'Candy'];

  for (let i = 29; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    // 3 to 6 daily sales transactions per day
    const salesCount = 3 + Math.floor(Math.sin(i * 0.5 + 2) * 2 + 2);

    for (let s = 1; s <= salesCount; s++) {
      const pm = paymentMethods[(i * 3 + s) % paymentMethods.length];
      const cat = categories[(i + s) % categories.length];
      const baseAmount = 14.50 + ((i * 7 + s * 13) % 45) + Math.random() * 8;
      const roundedAmount = Math.round(baseAmount * 100) / 100;

      seedItems.push({
        type: 'revenue',
        category: cat,
        description: `POS Checkout #${1000 + i * 10 + s} (${cat})`,
        amount: roundedAmount,
        date: `${dateStr}T${String(9 + (s * 2)).padStart(2, '0')}:${String((s * 17) % 60).padStart(2, '0')}:00.000Z`,
        payment_method: pm,
        source: 'pos_sync',
        pos_sale_id: 1000 + i * 10 + s,
        operator: s % 2 === 0 ? 'STORE MANAGER' : 'CASHIER OPERATOR'
      });
    }
  }

  // 2. Fixed & Operational Expenses (Despesas do Mês)
  const currentMonth = now.toISOString().slice(0, 7);
  const expenseTemplates = [
    {
      day: 5,
      cat: 'Rent & Facilities',
      desc: 'Commercial Retail Store Rent',
      amount: 1850.00,
      pm: 'Bank Transfer'
    },
    {
      day: 10,
      cat: 'Utilities',
      desc: 'Commercial Electricity & HVAC',
      amount: 345.80,
      pm: 'Direct Debit'
    },
    {
      day: 10,
      cat: 'Technology & SaaS',
      desc: 'Cloud Infrastructure & High-Speed Fiber',
      amount: 129.00,
      pm: 'Credit Card'
    },
    {
      day: 12,
      cat: 'Inventory Restock',
      desc: 'Wholesale Beverages Distributor Restock',
      amount: 820.50,
      pm: 'Bank Transfer'
    },
    {
      day: 18,
      cat: 'Inventory Restock',
      desc: 'Fresh Bakery & Ingredients Supply',
      amount: 640.00,
      pm: 'Bank Transfer'
    },
    {
      day: 20,
      cat: 'Maintenance & Supplies',
      desc: 'POS Thermal Paper Rolls & Retail Bags',
      amount: 95.40,
      pm: 'Credit Card'
    },
    {
      day: 25,
      cat: 'Payroll',
      desc: 'Front-line Cashier Operator Payroll',
      amount: 1400.00,
      pm: 'Bank Transfer'
    }
  ];

  expenseTemplates.forEach(e => {
    const expenseDate = `${currentMonth}-${String(e.day).padStart(2, '0')}T10:00:00.000Z`;
    seedItems.push({
      type: 'expense',
      category: e.cat,
      description: e.desc,
      amount: e.amount,
      date: expenseDate,
      payment_method: e.pm,
      source: 'manual',
      operator: 'STORE MANAGER'
    });
  });

  await bulkAddTransactions(seedItems);
  return getAllTransactions();
}

/**
 * Clear all demo transactions from IndexedDB
 */
export async function clearIndexedDbDemoData() {
  localStorage.setItem('novametrics_demo_cleared', '1');
  await clearTransactions();
  return [];
}

/**
 * Re-seed demo baseline in IndexedDB
 */
export async function seedIndexedDbDemoData() {
  localStorage.removeItem('novametrics_demo_cleared');
  await clearTransactions();
  return await seedInitialDataIfEmpty();
}
