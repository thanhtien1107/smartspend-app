export function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export function renderExpensesList(container, expenses, onEdit, onDelete) {
  container.innerHTML = '';
  if (!expenses.length) {
    container.innerHTML = '<p>Không có giao dịch phù hợp.</p>';
    return;
  }
  expenses.slice(0, 12).forEach((expense) => {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(expense.title)}</strong>
        <span>${escapeHtml(expense.category)} · ${escapeHtml(expense.date)}</span>
        <p>${escapeHtml(expense.note || '')}</p>
      </div>
      <div class="expense-actions">
        <span>${formatMoney(expense.amount)}</span>
        <button class="btn-action">Sửa</button>
        <button class="btn-delete">Xóa</button>
      </div>
    `;
    item.querySelector('.btn-action').addEventListener('click', () => onEdit(expense.id));
    item.querySelector('.btn-delete').addEventListener('click', () => onDelete(expense.id));
    container.appendChild(item);
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
