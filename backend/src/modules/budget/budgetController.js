const { v4: uuidv4 } = require('uuid');

function createBudgetController({
  loadData,
  saveData,
  findCurrentUser,
  getUserId,
  getUserBudget,
  getUserCategoryBudgets
}) {
  function getBudget(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    res.json(getUserBudget(data, user));
  }

  function saveBudget(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    const userId = getUserId(user);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { amount, period } = req.body;
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Số tiền ngân sách phải lớn hơn 0.' });
    }
    data.budgets = data.budgets || [];
    const existing = data.budgets.find((budget) => budget.userId === userId);
    if (existing) {
      existing.amount = amountValue;
      existing.period = period || existing.period || 'Tháng';
      existing.updatedAt = new Date().toISOString();
    } else {
      data.budgets.unshift({
        id: uuidv4(),
        userId,
        amount: amountValue,
        period: period || 'Tháng',
        createdAt: new Date().toISOString()
      });
    }
    saveData(data);
    res.json(existing || data.budgets[0]);
  }

  function listCategoryBudgets(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    res.json(getUserCategoryBudgets(data, user));
  }

  function saveCategoryBudget(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    const userId = getUserId(user);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { category, amount, period, force } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category budget requires category' });
    }
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Số tiền ngân sách hạng mục phải lớn hơn 0.' });
    }
    data.categoryBudgets = data.categoryBudgets || [];
    const existing = data.categoryBudgets.find((budget) => budget.userId === userId && budget.category === category);
    if (existing && !force) {
      return res.status(409).json({ issue: 'budget_exists', message: `Ngân sách cho ${category} đã tồn tại.`, existing });
    }
    if (existing) {
      existing.amount = amountValue;
      existing.period = period || existing.period;
    } else {
      const newBudget = {
        id: uuidv4(),
        userId,
        category,
        amount: amountValue,
        period: period || getUserBudget(data, user).period,
        createdAt: new Date().toISOString()
      };
      data.categoryBudgets.unshift(newBudget);
    }
    saveData(data);
    res.json(existing || data.categoryBudgets[0]);
  }

  return {
    getBudget,
    saveBudget,
    listCategoryBudgets,
    saveCategoryBudget
  };
}

module.exports = {
  createBudgetController
};
