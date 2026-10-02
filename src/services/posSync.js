/**
 * NovaPOS Live Sync Service
 * Connects directly to NovaPOS SQLite REST Backend on port 3001
 */

import { getAllTransactions, bulkAddTransactions } from './indexedDb';

// Primary through Vite proxy '/pos-api', fallback directly to localhost:3001
const PROXY_URL = '/pos-api';
const DIRECT_URL = 'http://localhost:3001';

/**
 * Helper to fetch with timeout and fallback
 */
async function fetchWithFallback(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${PROXY_URL}${endpoint}`, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {
    // If proxy failed, try direct URL
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 2500);
      const directRes = await fetch(`${DIRECT_URL}${endpoint}`, {
        ...options,
        signal: directController.signal
      });
      clearTimeout(directTimeout);
      if (directRes.ok) return await directRes.json();
    } catch (directErr) {
      throw directErr;
    }
  }

  throw new Error(`Failed to fetch from POS endpoint: ${endpoint}`);
}

/**
 * Check if NovaPOS backend is online and reachable
 * @returns {Promise<boolean>}
 */
export async function probePosStatus() {
  try {
    const data = await fetchWithFallback('/api/reports/daily');
    return Boolean(data && data.summary);
  } catch (err) {
    return false;
  }
}

/**
 * Fetch NovaPOS live daily sales report & summary
 * @returns {Promise<Object>}
 */
export async function fetchPosDailyReport() {
  return await fetchWithFallback('/api/reports/daily');
}

/**
 * Fetch NovaPOS full product catalog
 * @returns {Promise<Array>}
 */
export async function fetchPosProducts() {
  return await fetchWithFallback('/api/products');
}

/**
 * Synchronize sales from NovaPOS SQLite database into IndexedDB
 * Filters out already imported sales by pos_sale_id
 * @returns {Promise<{ importedCount: number, skippedCount: number, total: number }>}
 */
export async function syncPosSalesToDatabase() {
  const report = await fetchPosDailyReport();
  if (!report || !report.recentSales) {
    throw new Error('No sales data received from NovaPOS.');
  }

  const existingTransactions = await getAllTransactions();
  const existingPosIds = new Set(
    existingTransactions
      .filter((t) => t.source === 'pos_sync' && t.pos_sale_id)
      .map((t) => String(t.pos_sale_id))
  );

  const salesToImport = [];
  let skippedCount = 0;

  for (const sale of report.recentSales) {
    const saleIdKey = String(sale.id || sale.sale_number);
    if (existingPosIds.has(saleIdKey)) {
      skippedCount++;
      continue;
    }

    salesToImport.push({
      type: 'revenue',
      category: 'POS Sales',
      description: `POS Receipt #${sale.sale_number || sale.id}`,
      amount: Number(sale.total_amount) || 0,
      date: sale.created_at || new Date().toISOString(),
      payment_method: sale.payment_method || 'Cash',
      source: 'pos_sync',
      pos_sale_id: sale.id,
      operator: sale.operator_name || 'STORE MANAGER',
      metadata: {
        subtotal: sale.subtotal,
        discount_total: sale.discount_total,
        tax_amount: sale.tax_amount,
        items_count: sale.items_count
      }
    });
  }

  let importedCount = 0;
  if (salesToImport.length > 0) {
    importedCount = await bulkAddTransactions(salesToImport);
  }

  return {
    importedCount,
    skippedCount,
    total: report.recentSales.length
  };
}
