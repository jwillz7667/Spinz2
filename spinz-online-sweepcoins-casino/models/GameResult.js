const mongoose = require('mongoose');

const GameResultSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  bet: {
    type: Number,
    required: true
  },
  outcome: {
    type: String,
    required: true
  },
  winnings: {
    type: Number,
    required: true
  },
  achievementsUnlocked: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GameResult', GameResultSchema);
