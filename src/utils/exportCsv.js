/**
 * Export transactions to CSV format with UTF-8 BOM
 * @param {Array} transactions 
 * @param {string} filename 
 */
export function exportTransactionsToCsv(transactions, filename = 'novametrics_transactions.csv') {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount ($)', 'Payment Method', 'Source', 'Operator'];

  const rows = transactions.map((t) => [
    t.id || '',
    t.date ? new Date(t.date).toISOString().replace('T', ' ').slice(0, 19) : '',
    t.type ? t.type.toUpperCase() : '',
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    (Number(t.amount) || 0).toFixed(2),
    `"${(t.payment_method || '').replace(/"/g, '""')}"`,
    t.source === 'pos_sync' ? 'POS Live Sync' : 'Manual Entry',
    `"${(t.operator || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
