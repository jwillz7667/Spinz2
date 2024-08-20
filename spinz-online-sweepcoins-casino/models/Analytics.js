const mongoose = require('mongoose');

const GameEventSchema = new mongoose.Schema({
  user: {
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
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventData: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timeseries: { timeField: 'timestamp', metaField: 'eventType', granularity: 'minutes' } });

const UserSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date,
    index: true
  },
  device: String,
  browser: String,
  ip: String
});

const AggregatedStatsSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalBets: Number,
  totalWins: Number,
  uniquePlayers: Number,
  averageBetSize: Number,
  rtp: Number
}, { timeseries: { timeField: 'date', metaField: 'game', granularity: 'hours' } });

const GameEvent = mongoose.model('GameEvent', GameEventSchema);
const UserSession = mongoose.model('UserSession', UserSessionSchema);
const AggregatedStats = mongoose.model('AggregatedStats', AggregatedStatsSchema);

module.exports = { GameEvent, UserSession, AggregatedStats };
