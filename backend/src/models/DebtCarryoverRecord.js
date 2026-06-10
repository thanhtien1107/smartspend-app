const mongoose = require('mongoose');

const debtCarryoverRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    periodKey: { type: String, required: true, index: true },
    periodLabel: { type: String, default: '' },
    periodType: { type: String, default: 'month' },
    strategy: { type: String, default: '' },
    goalId: { type: String, default: '' },
    baseBudgetAmount: { type: Number, default: 0 },
    periodIncome: { type: Number, default: 0 },
    periodExpense: { type: Number, default: 0 },
    grossBudget: { type: Number, default: 0 },
    availableBudget: { type: Number, default: 0 },
    surplusAmount: { type: Number, default: 0 },
    budgetCarryAmount: { type: Number, default: 0 },
    savingGoalContributionAmount: { type: Number, default: 0 },
    debtAmount: { type: Number, default: 0 },
    debtRepaymentAmount: { type: Number, default: 0 },
    remainingDebtAmount: { type: Number, default: 0 },
    budgetAdjustmentAmount: { type: Number, default: 0 },
    nextBudgetAmount: { type: Number, default: 0 },
    warning: { type: String, default: '' },
    isLimitedDebtRepayment: { type: Boolean, default: false },
    storageNote: { type: String, default: 'Task 4 debt carry-over record' }
  },
  {
    timestamps: true,
    collection: 'debt_carryover_records'
  }
);

debtCarryoverRecordSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.models.DebtCarryoverRecord || mongoose.model('DebtCarryoverRecord', debtCarryoverRecordSchema);
