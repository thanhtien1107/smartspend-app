export const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Sinh hoạt',
  'Quần áo',
  'Mỹ phẩm',
  'Giao lưu',
  'Y tế',
  'Giáo dục',
  'Điện nước',
  'Đi lại',
  'Liên lạc',
  'Nhà cửa',
  'Giải trí',
  'Mua sắm',
  'Sức khỏe',
  'Đầu tư',
  'Quà tặng & Quyên góp',
  'Dịch vụ trực tuyến',
  'Chi phí khác',
  'Khác'
];

export const INCOME_CATEGORIES = [
  'Lương',
  'Thưởng',
  'Phụ cấp',
  'Làm thêm',
  'Kinh doanh',
  'Đầu tư sinh lời',
  'Quà tặng nhận được',
  'Hoàn tiền',
  'Thu nhập khác'
];

export function normalizeTransactionType(type) {
  return type === 'income' ? 'income' : 'expense';
}

export function getTransactionTypeLabel(type) {
  return normalizeTransactionType(type) === 'income' ? 'Thu vào' : 'Chi tiêu';
}
