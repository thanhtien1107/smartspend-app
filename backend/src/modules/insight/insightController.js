const { findCurrentUser } = require("../../utils/authUtils");
const {
  buildInsight,
  buildUserScopedData,
} = require("../../utils/financialUtils");

/**
 * @interface InsightController
 * @description Exposes methods to retrieve financial insights.
 */
function createInsightController(dependencies) {
  const { loadData } = dependencies;

  return {
    getInsights(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      res.json(buildInsight(buildUserScopedData(data, user), user));
    },
  };
}

module.exports = {
  createInsightController,
};
