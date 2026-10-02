/**
 * Format numeric value as USD currency
 * @param {number} val 
 * @returns {string}
 */
export function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format ISO date string to readable format
 * @param {string|Date} dateStr 
 * @param {boolean} includeTime 
 * @returns {string}
 */
export function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format percentage with + / - sign
 * @param {number} val 
 * @returns {string}
 */
export function formatPercent(val) {
  const num = Number(val) || 0;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

/**
 * Format plain number with commas
 * @param {number} val 
 * @returns {string}
 */
export function formatNumber(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US').format(num);
}
