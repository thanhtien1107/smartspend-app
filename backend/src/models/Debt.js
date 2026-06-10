const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    carryoverRecordId: { type: String, default: '' },
    periodKey: { type: String, required: true, index: true },
    debtAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['OPEN', 'PARTIAL', 'PAID'], default: 'OPEN' },
    createdFrom: { type: String, default: 'debt_carryover' }
  },
  {
    timestamps: true,
    collection: 'debts'
  }
);

debtSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.models.Debt || mongoose.model('Debt', debtSchema);
