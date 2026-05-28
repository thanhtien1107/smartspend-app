const express = require('express');
const { createBudgetController } = require('./budgetController');

function createBudgetRoutes(dependencies) {
  const router = express.Router();
  const controller = createBudgetController(dependencies);

  router.get('/budget', controller.getBudget);
  router.post('/budget', controller.saveBudget);
  router.get('/category-budgets', controller.listCategoryBudgets);
  router.post('/category-budgets', controller.saveCategoryBudget);

  return router;
}

module.exports = {
  createBudgetRoutes
};
