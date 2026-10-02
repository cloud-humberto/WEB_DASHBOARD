/**
 * Executive Financial Statement PDF Generator
 * Uses jsPDF to create a clean A4 corporate report
 */
import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, formatPercent } from './formatters';

export function exportExecutivePdf(kpis, transactions, periodLabel = 'Last 30 Days') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('NOVAMETRICS // FINANCIAL STATEMENT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`REPORT PERIOD: ${periodLabel.toUpperCase()} | GENERATED ON: ${formatDate(new Date(), true).toUpperCase()}`, 14, 23);

  y = 44;

  // 2. Executive KPI Summary Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SUMMARY & KPIS', 14, y);
  y += 6;

  // 4 Boxes
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 22;

  const kpiItems = [
    { title: 'GROSS REVENUE', val: formatCurrency(kpis.totalRevenue), color: [16, 185, 129] }, // emerald
    { title: 'TOTAL EXPENSES', val: formatCurrency(kpis.totalExpenses), color: [244, 63, 94] }, // rose
    { title: 'NET PROFIT', val: formatCurrency(kpis.netProfit), color: [59, 130, 246] }, // blue
    { title: 'PROFIT MARGIN', val: formatPercent(kpis.profitMargin), color: [245, 158, 11] } // amber
  ];

  kpiItems.forEach((kpi, index) => {
    const x = 14 + index * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

    // Accent line on top
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, y, boxWidth, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + 3, y + 16);
  });

  y += boxHeight + 12;

  // 3. Operational Highlights & Ticket Metrics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. OPERATIONAL METRICS & CASHFLOW', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`* Total Processed Transactions: ${kpis.totalTransactions || transactions.length}`, 16, y);
  y += 5;
  doc.text(`* Average Retail Ticket: ${formatCurrency(kpis.avgTicket)}`, 16, y);
  y += 5;
  doc.text(`* Operating Cash Ratio (Revenue/Expense): ${(kpis.totalExpenses > 0 ? (kpis.totalRevenue / kpis.totalExpenses).toFixed(2) : 'N/A')}x`, 16, y);
  y += 10;

  // 4. Statement of Transactions (Table)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. RECENT AUDIT TRANSACTIONS (TOP 20)', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', 16, y + 5);
  doc.text('TYPE', 42, y + 5);
  doc.text('CATEGORY', 64, y + 5);
  doc.text('DESCRIPTION', 105, y + 5);
  doc.text('PAYMENT', 152, y + 5);
  doc.text('AMOUNT', pageWidth - 16, y + 5, { align: 'right' });

  y += 7;

  // Rows
  const sampleTransactions = transactions.slice(0, 20);

  sampleTransactions.forEach((t, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    const dStr = formatDate(t.date);
    doc.text(dStr, 16, y + 4.5);

    // Type badge
    if (t.type === 'revenue') {
      doc.setTextColor(16, 185, 129);
      doc.text('INCOME', 42, y + 4.5);
    } else {
      doc.setTextColor(244, 63, 94);
      doc.text('EXPENSE', 42, y + 4.5);
    }

    doc.setTextColor(71, 85, 105);
    doc.text(String(t.category || '-').slice(0, 18), 64, y + 4.5);
    doc.text(String(t.description || '-').slice(0, 26), 105, y + 4.5);
    doc.text(String(t.payment_method || '-').slice(0, 14), 152, y + 4.5);

    // Amount
    doc.setFont('helvetica', 'bold');
    if (t.type === 'revenue') {
      doc.setTextColor(16, 185, 129);
      doc.text(`+${formatCurrency(t.amount)}`, pageWidth - 16, y + 4.5, { align: 'right' });
    } else {
      doc.setTextColor(244, 63, 94);
      doc.text(`-${formatCurrency(t.amount)}`, pageWidth - 16, y + 4.5, { align: 'right' });
    }

    y += 6.5;
  });

  // Footer on bottom of current page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('NovaMetrics SaaS Financial Dashboard | Offline-First & NovaPOS Synchronized', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Open in new tab or download
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
