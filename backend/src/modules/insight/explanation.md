# Insight Module

Handles generation of financial insights and reports based on user's transactions.

## Architecture
- **insightRoutes.js**: Express routing for insight endpoints.
- **insightController.js**: Handlers for fetching insights.
- **financialUtils.js** (in `src/utils`): Contains heavy logic for calculating projections, patterns, and financial health scores.

## Important Interfaces
- Insights rely on data from `loadData`.
- Calculates projections without mutating the database (Open/Close principle).
