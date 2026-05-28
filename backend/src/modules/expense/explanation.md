# Expense Module

This module handles CRUD operations and validations for user expenses and incomes.

## Architecture
- **expenseRoutes.js**: Express routing for expense endpoints.
- **expenseController.js**: Handlers for creating, reading, updating, deleting expenses. Uses multiparty parsing for image uploads.
- **transactionValidation.js**: Utility rules for validating payload correctness.

## Important Interfaces
- Data operations are decoupled using dependencies (`loadData`, `saveData`).
- Relies on `financialUtils.js` for user-scoped data generation and unusual expense detection.
