const express = require('express');
const { createAiController } = require('./aiController');

function createAiRoutes(dependencies) {
  const router = express.Router();
  const controller = createAiController(dependencies);

  router.post('/ai-suggestions', controller.getAiSuggestions);
  router.post('/chat', controller.chat);

  return router;
}

module.exports = {
  createAiRoutes
};
