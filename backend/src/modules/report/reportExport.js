const { formatVnd } = require('../../utils/money');

function stripVietnamese(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsv(value = '') {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function escapePdf(value = '') {
  return stripVietnamese(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function normalizeExpenseForReport(expense = {}) {
  return {
    date: String(expense.date || expense.createdAt || '').slice(0, 10),
    type: expense.type === 'income' ? 'Thu vào' : 'Chi tiêu',
    title: expense.title || expense.note || '-',
    category: expense.category || 'Khác',
    amount: Number(expense.amount || 0),
    note: expense.note || '',
    location: expense.location || ''
  };
}

function buildFinancialReport({ scopedData = {}, insight = {}, generatedAt = new Date() } = {}) {
  const transactions = (scopedData.expenses || [])
    .map(normalizeExpenseForReport)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.type,
    transaction.title,
    transaction.category,
    Math.round(transaction.amount),
    transaction.note,
    transaction.location
  ]);

  const summary = [
    ['Generated at', generatedAt.toLocaleString('vi-VN')],
    ['Total income', formatVnd(insight.total_income || 0)],
    ['Total expense', formatVnd(insight.total_expense || 0)],
    ['Monthly spending', formatVnd(insight.monthly_spending || 0)],
    ['Budget before debt', formatVnd(insight.budget_before_debt || insight.base_budget_amount || 0)],
    ['Debt carried from previous period', formatVnd(insight.debt_carried_from_previous || 0)],
    ['Available budget after debt', formatVnd(insight.budget_amount || 0)],
    ['Debt to carry next period', formatVnd(insight.debt_to_carry_next_period || 0)],
    ['Budget usage', `${insight.budget_usage || 0}%`],
    ['Financial health score', `${insight.financial_health_score || 0}/100`],
    ['Risk level', insight.risk_level || '-'],
    ['Top category', insight.top_category || '-']
  ];

  return {
    title: 'SmartSpend Financial Report',
    generatedAt,
    summary,
    headers: ['Date', 'Type', 'Title', 'Category', 'Amount', 'Note', 'Location'],
    rows,
    alerts: (insight.alerts || []).map((alert) => alert.message || String(alert)).filter(Boolean),
    recommendations: insight.recommendations || insight.personalizedRecommendations || [],
    debtHistory: insight.debt_history || []
  };
}

function toCsv(report) {
  const sections = [];
  sections.push([report.title]);
  sections.push([]);
  sections.push(['Summary']);
  sections.push(...report.summary);
  sections.push([]);
  sections.push(['Transactions']);
  sections.push(report.headers);
  sections.push(...report.rows);
  sections.push([]);
  sections.push(['Alerts']);
  report.alerts.forEach((alert) => sections.push([alert]));
  sections.push([]);
  sections.push(['Recommendations']);
  report.recommendations.forEach((item) => sections.push([item]));
  return sections.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function toExcelHtml(report) {
  const summaryRows = report.summary
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join('');
  const transactionRows = report.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  const debtRows = report.debtHistory
    .map((row) => `<tr><td>${escapeHtml(row.periodLabel)}</td><td>${row.grossBudget}</td><td>${row.carriedDebtFromPrevious}</td><td>${row.availableBudget}</td><td>${row.periodExpense}</td><td>${row.debtToCarryNextPeriod}</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>table{border-collapse:collapse}td,th{border:1px solid #999;padding:6px}th{background:#e8f3ed}</style></head>
<body>
<h1>${escapeHtml(report.title)}</h1>
<h2>Summary</h2>
<table>${summaryRows}</table>
<h2>Debt Carry-over</h2>
<table><tr><th>Period</th><th>Gross budget</th><th>Debt from previous</th><th>Available budget</th><th>Expense</th><th>Debt to next</th></tr>${debtRows}</table>
<h2>Transactions</h2>
<table><tr>${report.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>${transactionRows}</table>
<h2>Alerts</h2><ul>${report.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join('')}</ul>
<h2>Recommendations</h2><ul>${report.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
</body></html>`;
}

function createSimplePdf(lines) {
  const safeLines = lines.flatMap((line) => {
    const text = stripVietnamese(line);
    const chunks = [];
    for (let index = 0; index < text.length; index += 92) chunks.push(text.slice(index, index + 92));
    return chunks.length ? chunks : [''];
  }).slice(0, 58);
  const content = ['BT', '/F1 10 Tf', '50 790 Td', '14 TL'];
  safeLines.forEach((line, index) => {
    if (index > 0) content.push('T*');
    content.push(`(${escapePdf(line)}) Tj`);
  });
  content.push('ET');
  const stream = content.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function toPdfBuffer(report) {
  const lines = [
    report.title,
    `Generated: ${report.generatedAt.toLocaleString('vi-VN')}`,
    '',
    'SUMMARY'
  ];
  report.summary.forEach(([label, value]) => lines.push(`${label}: ${value}`));
  lines.push('', 'DEBT CARRY-OVER');
  report.debtHistory.slice(-6).forEach((row) => {
    lines.push(`${row.periodLabel}: gross ${formatVnd(row.grossBudget)}, previous debt ${formatVnd(row.carriedDebtFromPrevious)}, available ${formatVnd(row.availableBudget)}, expense ${formatVnd(row.periodExpense)}, next debt ${formatVnd(row.debtToCarryNextPeriod)}`);
  });
  lines.push('', 'RECENT TRANSACTIONS');
  report.rows.slice(0, 20).forEach((row) => lines.push(`${row[0]} | ${row[1]} | ${row[3]} | ${formatVnd(row[4])} | ${row[2]}`));
  lines.push('', 'ALERTS');
  report.alerts.slice(0, 5).forEach((alert) => lines.push(`- ${alert}`));
  return createSimplePdf(lines);
}

function sendReportExport(res, format, report) {
  const normalizedFormat = String(format || '').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);
  if (normalizedFormat === 'pdf') {
    const buffer = toPdfBuffer(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="smartspend-report-${timestamp}.pdf"`);
    return res.end(buffer);
  }
  if (normalizedFormat === 'excel' || normalizedFormat === 'xls') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="smartspend-report-${timestamp}.xls"`);
    return res.send(toExcelHtml(report));
  }
  if (normalizedFormat === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="smartspend-report-${timestamp}.csv"`);
    return res.send(`\ufeff${toCsv(report)}`);
  }
  return res.status(400).json({ error: 'Unsupported export format. Use pdf, excel, xls, or csv.' });
}

module.exports = {
  buildFinancialReport,
  sendReportExport
};
