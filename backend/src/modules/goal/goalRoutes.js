const express = require('express');
const { createGoalController } = require('./goalController');

function createGoalRoutes(dependencies) {
  const router = express.Router();
  const controller = createGoalController(dependencies);

  router.get('/', controller.listGoals);
  router.post('/', controller.createGoal);
  router.put('/:id', controller.updateGoal);
  router.delete('/:id', controller.deleteGoal);

  return router;
}

module.exports = {
  createGoalRoutes
};
