const express = require('express');
const { createExpenseController } = require('./expenseController');

function createExpenseRoutes(dependencies) {
  const router = express.Router();
  const controller = createExpenseController(dependencies);

  router.get('/', controller.getExpenses);
  router.post('/', controller.createExpense);
  router.put('/:id', controller.updateExpense);
  router.delete('/:id', controller.deleteExpense);

  return router;
}

module.exports = {
  createExpenseRoutes
};
