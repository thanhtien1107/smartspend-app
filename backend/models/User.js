const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    legacyId: {
      type: String,
      index: true,
      unique: true,
      sparse: true
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      default: ''
    },
    fullName: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true
    },
    birthday: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Other', ''],
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: 'assets/logo/smartspending-mark.svg'
    },
    wallet: {
      type: Number,
      default: 0,
      min: 0
    },
    token: {
      type: String,
      default: '',
      index: true
    },
    authProvider: {
      type: String,
      enum: ['password', 'google', 'facebook'],
      default: 'password'
    },
    providerId: {
      type: String,
      default: ''
    },
    inviteCode: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    referredByUserId: {
      type: String,
      default: '',
      index: true
    },
    referralCount: {
      type: Number,
      default: 0,
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.index({ authProvider: 1, providerId: 1 });

userSchema.virtual('id').get(function getId() {
  return this.legacyId || this._id.toString();
});

module.exports = mongoose.model('User', userSchema);
