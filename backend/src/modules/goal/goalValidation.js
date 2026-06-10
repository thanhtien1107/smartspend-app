function validateGoalPayload(payload = {}) {
  const errors = [];
  const name = String(payload.name || '').trim();
  const target = Number(payload.target);

  if (!name) {
    errors.push('Tên mục tiêu không được để trống.');
  }
  if (!Number.isFinite(target) || target <= 0) {
    errors.push('Số tiền mục tiêu phải lớn hơn 0.');
  }
  if (target > 100000000000) {
    errors.push('Số tiền mục tiêu quá lớn.');
  }

  return errors;
}

module.exports = {
  validateGoalPayload
};
