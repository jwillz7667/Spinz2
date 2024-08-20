const mongoose = require('mongoose');

const GameMetadataSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  rtp: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  volatility: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
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
  paylines: {
    type: Number,
    required: true
  },
  reels: {
    type: Number,
    required: true
  },
  bonusFeatures: [{
    name: String,
    description: String
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

GameMetadataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GameMetadata', GameMetadataSchema);
