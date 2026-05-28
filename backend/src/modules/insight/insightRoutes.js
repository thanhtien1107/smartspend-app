const express = require('express');
const { createInsightController } = require('./insightController');

function createInsightRoutes(dependencies) {
  const router = express.Router();
  const controller = createInsightController(dependencies);

  router.get('/', controller.getInsights);

  return router;
}

module.exports = {
  createInsightRoutes
};
