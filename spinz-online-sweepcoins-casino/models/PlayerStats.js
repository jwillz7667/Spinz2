const mongoose = require('mongoose');

const PlayerStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  totalSpins: {
    type: Number,
    default: 0
  },
  totalWagered: {
    type: Number,
    default: 0
  },
  totalWon: {
    type: Number,
    default: 0
  },
  biggestWin: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  },
  bonusFeaturesTriggers: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PlayerStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

PlayerStatsSchema.index({ user: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('PlayerStats', PlayerStatsSchema);
