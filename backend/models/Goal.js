const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    target: {
      type: Number,
      required: true,
      min: 0
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

goalSchema.index({ userId: 1, createdAt: -1 });

goalSchema.virtual('id').get(function getId() {
  return this.legacyId || this._id.toString();
});

module.exports = mongoose.model('Goal', goalSchema);
