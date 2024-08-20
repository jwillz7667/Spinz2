const mongoose = require('mongoose');
const realTimeDataService = require('../services/realTimeDataService');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'game_win', 'game_loss', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  paymentGateway: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentGateway'
  },
  externalTransactionId: String,
  details: {
    type: mongoose.Schema.Types.Mixed
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

TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

TransactionSchema.post('save', function(doc) {
  if (doc.status === 'completed') {
    realTimeDataService.collectFinancialData(doc);
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
