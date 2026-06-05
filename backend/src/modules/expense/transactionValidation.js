const { parseExpenseDate, startOfDay } =
  require("../../utils/dateUtils");

function validateExpensePayload(payload = {}) {
  const errors = [];
  const amount = Number(payload.amount);
  const category = String(payload.category || "").trim();
  const type =
    payload.type === "income"
      ? "income"
      : payload.type === "expense" || !payload.type
        ? "expense"
        : "invalid";
  const date = parseExpenseDate(payload.date);
  const today = startOfDay(new Date());

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Số tiền phải lớn hơn 0.");
  }
  if (type === "invalid") {
    errors.push("Loai giao dich khong hop le.");
  }
  if (amount > 1000000000) {
    errors.push("Số tiền quá lớn so với một giao dịch cá nhân thông thường.");
  }
  if (!category) {
    errors.push("Danh mục không được để trống.");
  }
  if (!payload.date || !date) {
    errors.push("Ngày giao dịch không hợp lệ.");
  }
  if (date && date > today) {
    errors.push("Không được nhập giao dịch trong tương lai.");
  }

  return errors;
}

module.exports = {
  validateExpensePayload,
};
