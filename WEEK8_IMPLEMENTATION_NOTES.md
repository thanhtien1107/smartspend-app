# Week 8 Implementation Notes - Huy

## Scope
This package keeps Task 2 implementation and updates Task 4 + Task 10 according to the final team request.

## Task 2 - Database readability and PDF/Excel export
Kept the previous implementation:
- Report export endpoints for PDF/Excel/CSV.
- Report screen export actions.
- Prisma schema additions for reports and notifications.

## Task 4 - Debt Carry-over using relational tables
Task 4 now follows the provided relationship diagram instead of relying only on one JSON file.

### ERD-based design
The relationship diagram shows `USER` owning/tracking `BUDGET`, `GOAL`, `NOTIFICATION`, and `DEBT`. Task 4 now stores debt carry-over data in relational tables:

- `DEBT`
  - Stores current debt by user and period.
  - Important fields: `userId`, `debtAmount`, `status`, `periodKey`, `createdAt`, `updatedAt`.

- `DEBT_CARRYOVER_RECORD`
  - Stores the Task 4 processing history for each user and period.
  - Important fields: `userId`, `budgetId`, `goalId`, `debtId`, `period`, `baseBudgetAmount`, `surplusAmount`, `debtAmount`, `debtRepaymentAmount`, `remainingDebtAmount`, `budgetAdjustmentAmount`, `savingGoalContributionAmount`, `strategy`, `status`, `warningMessage`.

### MySQL / Prisma files
- `backend/prisma/schema.prisma`
  - Changed to MySQL provider.
  - Added ERD-style table mapping such as `USER`, `BUDGET`, `GOAL`, `DEBT`, `NOTIFICATION`, `DEBT_CARRYOVER_RECORD`.
- `backend/database/task4_debt_carryover_mysql.sql`
  - Standalone MySQL script for Task 4 tables.
- `backend/prisma/migrations/20260609_task4_debt_carryover_mysql/migration.sql`
  - Prisma migration SQL for Task 4 tables.
- `backend/src/repositories/debtCarryoverRepository.js`
  - Saves Task 4 records to MySQL/Prisma when `DATABASE_URL` is configured.
  - Falls back to MongoDB only if MySQL is not configured and `MONGO_URI` exists.
  - Falls back to `backend/data/debt-carryover-db.json` only for local demo.

### Storage priority
1. MySQL relational tables through Prisma: `DEBT`, `DEBT_CARRYOVER_RECORD`.
2. MongoDB fallback if `MONGO_URI` exists.
3. Local demo fallback: `backend/data/debt-carryover-db.json`.

### Environment for MySQL
```env
DATABASE_URL="mysql://root:your_password@127.0.0.1:3306/smartspend"
REQUIRE_TASK4_RELATIONAL_DB=false
```

### Business rules
1. User has saving goal and has surplus:
   - Keep all surplus for next budget.
   - Split surplus: contribute part to saving goal and carry the rest to next budget.
   - Send all surplus to saving goal.
2. User has saving goal but has debt:
   - Handle like the no-saving debt case.
3. User has no saving goal:
   - No debt: carry surplus to next budget.
   - Has debt: subtract debt from next budget.
   - Debt is larger than next budget: show warning and only subtract 25% of debt.

### API
- `POST /api/debt-carryover/decision`
- `GET /api/debt-carryover/history`

## Task 10 - Overspending notification
Task 10 supports:
- Web popup notification on the right side of the page.
- Browser/device notification request button if the browser supports Notification API.
- Email demo queue in `emailOutbox` when user email exists.

### Main files
- `backend/src/modules/notification/notificationService.js`
- `frontend/src/App.vue`
- `frontend/src/components/ToastContainer.vue`
- `frontend/src/services/toast.js`
- `frontend/src/stores/useAppStore.js`
- `frontend/src/assets/main.css`

### Flow
User adds expense -> backend checks budget -> backend creates `budgetNotification` -> frontend receives it -> popup appears on the right side of the web page.

### Update: repeated overspending alerts
The backend no longer blocks duplicate overspending notifications for the same day/period. Every time the user adds a new expense while the budget is already exceeded, the system creates a new `budget_overspending` notification, records `overspendingCount`, and returns it to the frontend so another popup appears on the right side of the web page.

## How to run with MySQL
1. Create database:
```sql
CREATE DATABASE smartspend CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Set `.env`:
```env
DATABASE_URL="mysql://root:your_password@127.0.0.1:3306/smartspend"
```

3. Generate Prisma client and deploy tables:
```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```

4. Run app:
```bash
npm start
npm run dev
```

If MySQL is not available on the demo computer, the app still runs by using fallback storage so the presentation will not break.
