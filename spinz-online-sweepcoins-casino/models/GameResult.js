const mongoose = require('mongoose');
const realTimeDataService = require('../services/realTimeDataService');

const GameResultSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    required: true,
    index: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  bet: {
    type: Number,
    required: true
  },
  outcome: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  winnings: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  achievementsUnlocked: [{
    type: String
  }],
  bonusTriggered: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  betType: String,
  gameSpecificData: mongoose.Schema.Types.Mixed
}, { 
  timeseries: { 
    timeField: 'timestamp', 
    metaField: 'game', 
    granularity: 'minutes' 
  },
  indexes: [
    { player: 1, game: 1, timestamp: -1 },
    { game: 1, timestamp: -1 },
    { player: 1, timestamp: -1 },
    { timestamp: -1 }
  ]
});

GameResultSchema.index({ bet: 1, winnings: 1 });

GameResultSchema.post('save', function(doc) {
  realTimeDataService.collectGameData(doc);
  realTimeDataService.collectPlayerData(doc);
});

module.exports = mongoose.model('GameResult', GameResultSchema);
