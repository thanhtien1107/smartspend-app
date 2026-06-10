const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

categorySchema.virtual('id').get(function getId() {
  return this._id.toString();
});

module.exports = mongoose.model('Category', categorySchema);
