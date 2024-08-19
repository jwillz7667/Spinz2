const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    initialBalance: {
      type: Number,
      required: true
    },
    currentBalance: {
      type: Number,
      required: true
    }
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'aborted'],
    default: 'active'
  }
});

module.exports = mongoose.model('GameSession', GameSessionSchema);
