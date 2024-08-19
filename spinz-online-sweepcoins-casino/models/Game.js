const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Slots', 'Poker', 'Blackjack']
  },
  description: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    required: true
  },
  payouts: {
    type: String,
    required: true
  },
  minBet: {
    type: Number,
    required: true
  },
  maxBet: {
    type: Number,
    required: true
  },
  maxPlayers: {
    type: Number,
    default: 1
  },
  achievements: [{
    name: String,
    description: String,
    criteria: mongoose.Schema.Types.Mixed
  }],
  gameSettings: {
    type: mongoose.Schema.Types.Mixed,
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

module.exports = mongoose.model('Game', GameSchema);
