import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { db, initSharedDatabase, getDatabasePath, clearAllDemoData, seedDemoBaseline } from './db.js';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Initialize shared SQLite schema & seed baseline
initSharedDatabase();

/**
 * Helper to probe if NovaPOS backend is running on port 3001
 */
function probePosTerminal() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/reports/daily', { timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Filter SQL date range based on period param
 */
function getDateFilterClause(period, fieldName) {
  if (period === '7d') {
    return `datetime(${fieldName}) >= datetime('now', '-7 days')`;
  } else if (period === '30d') {
    return `datetime(${fieldName}) >= datetime('now', '-30 days')`;
  } else if (period === 'month') {
    return `strftime('%Y-%m', ${fieldName}) = strftime('%Y-%m', 'now')`;
  }
  return '1=1'; // all
}

// 1. Diagnostics & System Status
app.get('/api/status', async (req, res) => {
  try {
    const isPosOnline = await probePosTerminal();
    const salesCount = db.prepare('SELECT COUNT(*) AS total FROM sales').get().total;
    const expensesCount = db.prepare('SELECT COUNT(*) AS total FROM expenses').get().total;
    const productsCount = db.prepare('SELECT COUNT(*) AS total FROM products').get().total;
    const lastSale = db.prepare('SELECT id, sale_number, total_amount, created_at, operator_name FROM sales ORDER BY id DESC LIMIT 1').get() || null;

    res.json({
      online: true,
      dbPath: getDatabasePath(),
      isPosOnline,
      stats: {
        salesCount,
        expensesCount,
        productsCount
      },
      lastSale
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Executive KPIs (Calculated from SQLite)
app.get('/api/kpis', (req, res) => {
  try {
    const period = req.query.period || '30d';
    const salesFilter = getDateFilterClause(period, 'created_at');
    const expensesFilter = getDateFilterClause(period, 'date');

    const salesStats = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS totalRevenue,
        COALESCE(AVG(total_amount), 0) AS avgTicket,
        COALESCE(SUM(discount_total), 0) AS totalDiscounts,
        COALESCE(SUM(tax_amount), 0) AS totalTax,
        COUNT(*) AS revenueCount
      FROM sales
      WHERE ${salesFilter}
    `).get();

    const expenseStats = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) AS totalExpenses,
        COUNT(*) AS expenseCount
      FROM expenses
      WHERE ${expensesFilter}
    `).get();

    const totalRevenue = Number(salesStats.totalRevenue) || 0;
    const totalExpenses = Number(expenseStats.totalExpenses) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgTicket = Number(salesStats.avgTicket) || 0;

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      avgTicket,
      revenueCount: salesStats.revenueCount,
      expenseCount: expenseStats.expenseCount,
      totalTransactions: salesStats.revenueCount + expenseStats.expenseCount,
      totalDiscounts: salesStats.totalDiscounts,
      totalTax: salesStats.totalTax
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Cashflow Evolution Timeline (From SQLite sales & expenses)
app.get('/api/charts/cashflow', (req, res) => {
  try {
    const period = req.query.period || '30d';
    const salesFilter = getDateFilterClause(period, 'created_at');
    const expensesFilter = getDateFilterClause(period, 'date');

    const salesByDay = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', created_at) AS day,
        SUM(total_amount) AS total
      FROM sales
      WHERE ${salesFilter}
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const expensesByDay = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', date) AS day,
        SUM(amount) AS total
      FROM expenses
      WHERE ${expensesFilter}
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const map = new Map();

    salesByDay.forEach(s => {
      if (!map.has(s.day)) map.set(s.day, { revenue: 0, expense: 0 });
      map.get(s.day).revenue = Number(s.total) || 0;
    });

    expensesByDay.forEach(e => {
      if (!map.has(e.day)) map.set(e.day, { revenue: 0, expense: 0 });
      map.get(e.day).expense = Number(e.total) || 0;
    });

    // Sort days chronologically
    const sortedDays = Array.from(map.keys()).sort();
    const labels = [];
    const revenues = [];
    const expenses = [];
    const net = [];

    sortedDays.forEach(day => {
      const parts = day.split('-');
      labels.push(`${parts[1]}/${parts[2]}`);
      const val = map.get(day);
      revenues.push(Number(val.revenue.toFixed(2)));
      expenses.push(Number(val.expense.toFixed(2)));
      net.push(Number((val.revenue - val.expense).toFixed(2)));
    });

    res.json({ labels, revenues, expenses, net });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Payment Method Tender Mix (From SQLite sales)
app.get('/api/charts/payment-methods', (req, res) => {
  try {
    const period = req.query.period || '30d';
    const salesFilter = getDateFilterClause(period, 'created_at');

    const rows = db.prepare(`
      SELECT 
        payment_method,
        SUM(total_amount) AS total,
        COUNT(*) AS count
      FROM sales
      WHERE ${salesFilter}
      GROUP BY payment_method
      ORDER BY total DESC
    `).all();

    const labels = rows.map(r => r.payment_method);
    const values = rows.map(r => Number((r.total || 0).toFixed(2)));

    res.json({ labels, values });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Category Breakdown (From SQLite sale_items + products & expenses)
app.get('/api/charts/categories', (req, res) => {
  try {
    const period = req.query.period || '30d';
    const salesFilter = getDateFilterClause(period, 's.created_at');
    const expensesFilter = getDateFilterClause(period, 'date');

    const salesByCat = db.prepare(`
      SELECT 
        COALESCE(p.category, 'General') AS cat,
        SUM(si.total) AS total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE ${salesFilter}
      GROUP BY cat
      ORDER BY total DESC
    `).all();

    const expensesByCat = db.prepare(`
      SELECT 
        category AS cat,
        SUM(amount) AS total
      FROM expenses
      WHERE ${expensesFilter}
      GROUP BY cat
      ORDER BY total DESC
    `).all();

    const categoryMap = new Map();

    salesByCat.forEach(s => {
      if (!categoryMap.has(s.cat)) categoryMap.set(s.cat, { revenue: 0, expense: 0 });
      categoryMap.get(s.cat).revenue = Number(s.total) || 0;
    });

    expensesByCat.forEach(e => {
      if (!categoryMap.has(e.cat)) categoryMap.set(e.cat, { revenue: 0, expense: 0 });
      categoryMap.get(e.cat).expense = Number(e.total) || 0;
    });

    const labels = Array.from(categoryMap.keys());
    const revenues = labels.map(l => Number(categoryMap.get(l).revenue.toFixed(2)));
    const expenses = labels.map(l => Number(categoryMap.get(l).expense.toFixed(2)));

    res.json({ labels, revenues, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Unified Ledger Transactions (Sales + Expenses)
app.get('/api/transactions', (req, res) => {
  try {
    const period = req.query.period || 'all';
    const salesFilter = getDateFilterClause(period, 'created_at');
    const expensesFilter = getDateFilterClause(period, 'date');

    const sales = db.prepare(`
      SELECT 
        id,
        'revenue' AS type,
        'POS Sales' AS category,
        ('POS Receipt #' || sale_number) AS description,
        total_amount AS amount,
        created_at AS date,
        payment_method,
        'pos_sync' AS source,
        operator_name AS operator
      FROM sales
      WHERE ${salesFilter}
    `).all();

    const expenses = db.prepare(`
      SELECT 
        id,
        'expense' AS type,
        category,
        description,
        amount,
        date,
        payment_method,
        'manual' AS source,
        operator
      FROM expenses
      WHERE ${expensesFilter}
    `).all();

    const allTransactions = [...sales, ...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(allTransactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Add Operating Expense (Stored directly in SQLite)
app.post('/api/expenses', (req, res) => {
  try {
    const { category, description, amount, payment_method, date, operator } = req.body;
    if (!description || !amount) {
      return res.status(400).json({ error: 'Missing required expense fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (category, description, amount, payment_method, date, operator)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      category || 'Other Overhead',
      description.trim(),
      Number(amount),
      payment_method || 'Bank Transfer',
      date || new Date().toISOString(),
      operator || 'STORE MANAGER'
    );

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, expense: newExpense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete Operating Expense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(Number(id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Clear all demo / mock sales and expenses
app.post('/api/clear-demo-data', (req, res) => {
  try {
    const result = clearAllDemoData();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Re-seed demo baseline data
app.post('/api/seed-demo-data', (req, res) => {
  try {
    const result = seedDemoBaseline();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ NovaMetrics Analytics SQL Backend running on http://localhost:${PORT}`);
  console.log(`📂 Connected to SQLite Database: ${getDatabasePath()}`);
});
