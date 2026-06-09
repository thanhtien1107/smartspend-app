const path = require("path");

function createFinancialHealthRoutes(dependencies) {
  const compiledModule = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "dist",
    "financial-intelligence",
    "presentation",
    "express-router.js",
  );
  const { createFinancialHealthRoutes: createCompiledRoutes } =
    require(compiledModule);
  return createCompiledRoutes(dependencies);
}

module.exports = {
  createFinancialHealthRoutes,
};
