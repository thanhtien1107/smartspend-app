const express = require('express');
// The places logic is too massive to fully extract in one shot safely without breaking existing maps.
// I have extracted the services, but let's route them.
const { createPlacesController } = require('./placesController');

function createPlacesRoutes(dependencies) {
  const router = express.Router();
  const controller = createPlacesController(dependencies);

  router.post('/search-expanded', controller.handleExpandedPlacesSearch);
  router.post('/search', controller.search);
  // detail could be added here later

  return router;
}

module.exports = {
  createPlacesRoutes
};
