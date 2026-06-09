# Week 8 Implementation Notes

## Assigned items completed

### 2. Database design + PDF/Excel export

Implemented a clearer data structure for reporting and future database migration.

Changed files:
- `backend/prisma/schema.prisma`
- `backend/data/db.json`
- `backend/src/modules/report/reportExport.js`
- `backend/server.js`
- `frontend/src/services/report.js`
- `frontend/src/views/ReportView.vue`

New export endpoints:
- `GET /api/reports/export/pdf`
- `GET /api/reports/export/excel`
- `GET /api/reports/export/csv`

The Report screen now has export buttons. Excel is generated as an `.xls` HTML table so it opens directly in Excel without adding extra dependencies.

### 4. Debt carry-over logic

Implemented from `W4_package/ADR/ADR.docx`.

Rule:
- If spending exceeds available budget, the overflow becomes debt.
- The debt is carried forward to the next budgeting period.
- The carried debt reduces the next period's available budget.

Changed files:
- `backend/src/modules/finance/debtCarryover.js`
- `backend/server.js`
- `frontend/src/utils/financialAnalysis.js`
- `frontend/src/views/HomeView.vue`
- `frontend/src/views/ReportView.vue`

Important fields now returned by `/api/insights`:
- `budget_before_debt`
- `debt_carried_from_previous`
- `available_budget_after_debt`
- `new_overspending_debt`
- `debt_to_carry_next_period`
- `debt_history`

### 10. Overspending notification

Implemented budget overspending notification logic.

Changed files:
- `backend/src/modules/notification/notificationService.js`
- `backend/server.js`
- `frontend/src/services/notification.js`
- `frontend/src/views/HomeView.vue`

New endpoints:
- `GET /api/notifications`
- `PUT /api/notifications/read-all`

When an expense causes overspending, a notification is created and a simulated email is stored in `emailOutbox`.

## Validation performed

- Backend syntax check passed with `node -c`.
- Vue SFC parse/compile check passed for:
  - `HomeView.vue`
  - `ReportView.vue`
  - `BudgetView.vue`
  - `AddView.vue`
- Backend API smoke test passed for:
  - `/api/insights`
  - `/api/notifications`
  - `/api/reports/export/csv`
  - overspending expense notification creation

Note: `npm run build` could not complete inside this Linux sandbox because the uploaded `node_modules` contains Windows Rollup optional dependencies only. On your Windows machine, run `npm install` again and then `npm run build`.
