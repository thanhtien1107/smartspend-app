const express = require('express');
const { createCategoryController } = require('./categoryController');

function createCategoryRoutes(dependencies) {
  const router = express.Router();
  const controller = createCategoryController(dependencies);

  router.get('/', controller.listCategories);
  router.post('/', controller.createCategory);

  return router;
}

module.exports = {
  createCategoryRoutes
};
