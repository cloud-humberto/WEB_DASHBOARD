/**
 * Backend API Client for NovaMetrics
 * Communicates with the shared SQLite REST Backend on port 3003 (proxied via /api)
 */

export async function getSystemStatus() {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('API status call failed');
  return await res.json();
}

export async function getKpis(period = '30d') {
  const res = await fetch(`/api/kpis?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  return await res.json();
}

export async function getCashflowTimeline(period = '30d') {
  const res = await fetch(`/api/charts/cashflow?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch cashflow chart data');
  return await res.json();
}

export async function getPaymentMethods(period = '30d') {
  const res = await fetch(`/api/charts/payment-methods?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch payment methods breakdown');
  return await res.json();
}

export async function getCategoryBreakdown(period = '30d') {
  const res = await fetch(`/api/charts/categories?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch category chart data');
  return await res.json();
}

export async function getTransactions(period = '30d') {
  const res = await fetch(`/api/transactions?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return await res.json();
}

export async function addExpense(expenseData) {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData)
  });
  if (!res.ok) throw new Error('Failed to record expense');
  return await res.json();
}

export async function removeExpense(id) {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  return await res.json();
}

export async function clearDemoData() {
  const res = await fetch('/api/clear-demo-data', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear demo data');
  return await res.json();
}

export async function seedDemoData() {
  const res = await fetch('/api/seed-demo-data', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return await res.json();
}
