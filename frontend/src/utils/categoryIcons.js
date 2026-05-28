const CATEGORY_ICONS = {
  'Ăn uống': '🍽️',
  'Sinh hoạt': '🧴',
  'Quần áo': '👕',
  'Mỹ phẩm': '💄',
  'Giao lưu': '🥂',
  'Y tế': '💊',
  'Giáo dục': '📚',
  'Điện nước': '💡',
  'Đi lại': '🚗',
  'Liên lạc': '📱',
  'Nhà cửa': '🏠',
  'Giải trí': '🎮',
  'Mua sắm': '🛍️',
  'Sức khỏe': '🩺',
  'Đầu tư': '📈',
  'Quà tặng & Quyên góp': '🎁',
  'Dịch vụ trực tuyến': '🌐',
  'Chi phí khác': '🧾',
  'Khác': '📌',
  Food: '🍽️',
  Transport: '🚗',
  Entertainment: '🎮',
  Shopping: '🛍️',
  Health: '🩺',
  Other: '📌'
};

Object.assign(CATEGORY_ICONS, {
  'Ăn uống': '🍽️',
  'Đi lại': '🚗',
  'Mua sắm': '🛍️',
  'Giải trí': '🎮',
  'Sức khỏe': '🩺',
  'Giáo dục': '📚',
  'Lương': '💼',
  'Thưởng': '🎁',
  'Phụ cấp': '💵',
  'Làm thêm': '🧰',
  'Kinh doanh': '🏪',
  'Đầu tư sinh lời': '📈',
  'Quà tặng nhận được': '🎉',
  'Hoàn tiền': '↩️',
  'Thu nhập khác': '💰'
});

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📌';
}
