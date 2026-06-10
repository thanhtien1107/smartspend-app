const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['Ngày', 'Tuần', 'Tháng', 'Năm'],
      default: 'Tháng'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

budgetSchema.index({ userId: 1 }, { unique: true });

budgetSchema.virtual('id').get(function getId() {
  return this._id.toString();
});

module.exports = mongoose.model('Budget', budgetSchema);
