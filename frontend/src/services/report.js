import { apiFetch } from './api.js';

function getFileName(response, fallback) {
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : fallback;
}

export async function downloadFinancialReport(format) {
  const normalizedFormat = format === 'excel' ? 'excel' : format;
  const response = await apiFetch(`/api/reports/export/${normalizedFormat}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Không thể xuất báo cáo.');
  }

  const blob = await response.blob();
  const extension = normalizedFormat === 'excel' ? 'xls' : normalizedFormat;
  const fileName = getFileName(response, `smartspend-report.${extension}`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
