const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  wallets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  }],
  defaultWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  totalWinnings: {
    type: Number,
    default: 0
  },
  achievementsUnlocked: [{
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    achievement: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);
