const { v4: uuidv4 } = require("uuid");
const { validateExpensePayload } = require("./transactionValidation");
const {
  isMultipartRequest,
  parseMultipartForm,
} = require("../../utils/requestUtils");
const { findCurrentUser, getUserId } = require("../../utils/authUtils");
const {
  buildUserScopedData,
  hasUserOwner,
  getUserExpenses,
} = require("../../utils/financialUtils");

/**
 * @interface ExpenseController
 * @description Exposes methods for managing expenses.
 */
function createExpenseController(dependencies) {
  const { loadData, saveData, findSimilarExpense, detectUnusualExpense } =
    dependencies;

  return {
    getExpenses(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      res.json(getUserExpenses(data, user));
    },

    async createExpense(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const multipart = isMultipartRequest(req)
        ? await parseMultipartForm(req)
        : null;
      const body = multipart ? multipart.fields : req.body || {};
      const image = multipart?.files?.image;
      const {
        title,
        amount,
        category,
        date,
        time,
        note,
        location,
        friends,
        force,
      } = body;
      const type = body.type === "income" ? "income" : "expense";
      const validationErrors = validateExpensePayload({
        amount,
        category,
        date,
        type,
      });
      if (validationErrors.length) {
        return res
          .status(400)
          .json({ error: validationErrors[0], errors: validationErrors });
      }
      const item = {
        userId,
        id: uuidv4(),
        type,
        title: title || (type === "income" ? "Thu vào mới" : "Chi tiêu mới"),
        amount: Number(amount) || 0,
        category: String(category).trim(),
        date: String(date).slice(0, 10),
        time: time || "",
        note: note || "",
        location: location || "",
        friends: friends || "",
        imageUrl: image?.url || "",
      };

      data.expenses = data.expenses || [];
      const userExpenses = getUserExpenses(data, user);
      const similar = findSimilarExpense(userExpenses, item);
      if (similar && !force) {
        return res
          .status(409)
          .json({
            issue: "duplicate",
            message: "Phát hiện giao dịch giống với bản ghi trước đó.",
            similar,
          });
      }

      const warnings = detectUnusualExpense(
        buildUserScopedData(data, user),
        item,
      );
      if (warnings.length && !force) {
        return res
          .status(409)
          .json({ issue: "unusual", message: warnings.join(" "), warnings });
      }

      data.expenses.unshift(item);
      saveData(data);
      res.status(201).json(item);
    },

    updateExpense(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      const { id } = req.params;
      const index = (data.expenses || []).findIndex(
        (item) => item.id === id && hasUserOwner(item, user),
      );
      if (index === -1) {
        return res.status(404).json({ error: "Expense not found" });
      }
      const merged = {
        ...data.expenses[index],
        ...req.body,
      };
      const validationErrors = validateExpensePayload(merged);
      if (validationErrors.length) {
        return res
          .status(400)
          .json({ error: validationErrors[0], errors: validationErrors });
      }
      const type = merged.type === "income" ? "income" : "expense";
      const { title, amount, category, date, time, note, location, friends } =
        merged;
      data.expenses[index] = {
        ...data.expenses[index],
        type,
        title: title || data.expenses[index].title,
        amount: Number(amount),
        category: String(category).trim(),
        date: String(date).slice(0, 10),
        time: time || data.expenses[index].time || "",
        note: note || "",
        location: location || "",
        friends: friends || "",
      };
      saveData(data);
      res.json(data.expenses[index]);
    },

    deleteExpense(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      const { id } = req.params;
      const originalLength = (data.expenses || []).length;
      const updated = (data.expenses || []).filter(
        (item) => !(item.id === id && hasUserOwner(item, user)),
      );
      if (updated.length === originalLength) {
        return res.status(404).json({ error: "Expense not found" });
      }
      data.expenses = updated;
      saveData(data);
      res.json({ success: true });
    },
  };
}

module.exports = {
  createExpenseController,
};
