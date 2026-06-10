const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

expenseSchema.virtual('id').get(function getId() {
  return this.legacyId || this._id.toString();
});

module.exports = mongoose.model('Expense', expenseSchema);
