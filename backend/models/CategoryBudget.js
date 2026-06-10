const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema(
  {
    legacyId: {
      type: String,
      index: true,
      unique: true,
      sparse: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    legacyUserId: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['Ngày', 'Tuần', 'Tháng', 'Năm'],
      default: 'Tháng'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

categoryBudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

categoryBudgetSchema.virtual('id').get(function getId() {
  return this.legacyId || this._id.toString();
});

module.exports = mongoose.model('CategoryBudget', categoryBudgetSchema);
