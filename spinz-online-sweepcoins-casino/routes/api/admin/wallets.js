const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, hasRole } = require('../../../middleware/auth');
const User = require('../../../models/User');
const Wallet = require('../../../models/Wallet');
const Transaction = require('../../../models/Transaction');
const logger = require('../../../utils/logger');

// Apply admin role check to all routes
router.use(auth, hasRole('admin'));

// @route   GET api/admin/wallets
// @desc    Get all wallets
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.find().populate('user', 'name email');
    res.json(wallets);
  } catch (err) {
    logger.error(`Error fetching all wallets: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/wallets/:id
// @desc    Get wallet by ID
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id).populate('user', 'name email');
    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }
    res.json(wallet);
  } catch (err) {
    logger.error(`Error fetching wallet: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/admin/wallets/:id
// @desc    Update wallet balance
// @access  Private (Admin only)
router.put('/:id', [
  check('balance', 'Balance is required').isNumeric(),
  check('balance', 'Balance must be non-negative').isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { balance } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    wallet.balance = parseFloat(balance);
    await wallet.save();

    res.json(wallet);
  } catch (err) {
    logger.error(`Error updating wallet balance: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/wallets/transactions
// @desc    Get all transactions
// @access  Private (Admin only)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('fromWallet')
      .populate('toWallet');
    res.json(transactions);
  } catch (err) {
    logger.error(`Error fetching all transactions: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/admin/wallets/transactions/:id
// @desc    Update transaction status
// @access  Private (Admin only)
router.put('/transactions/:id', [
  check('status', 'Status is required').isIn(['pending', 'completed', 'failed', 'cancelled']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    transaction.status = status;
    await transaction.save();

    res.json(transaction);
  } catch (err) {
    logger.error(`Error updating transaction status: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/admin/wallets/withdrawals/:id
// @desc    Approve or reject a withdrawal
// @access  Private (Admin only)
router.put('/withdrawals/:id', [
  check('status', 'Status is required').isIn(['approved', 'rejected']),
  check('reason', 'Reason is required for rejection').if((value, { req }) => req.body.status === 'rejected').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status, reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
      return res.status(400).json({ msg: 'Invalid transaction for approval' });
    }

    if (status === 'approved') {
      // Process the withdrawal through the appropriate payment gateway
      // This is a placeholder. You should implement the actual payment processing logic.
      const paymentResult = await processPayment(transaction);
      
      if (paymentResult.success) {
        transaction.status = 'completed';
        transaction.details = { ...transaction.details, paymentResult };
      } else {
        transaction.status = 'failed';
        transaction.details = { ...transaction.details, error: paymentResult.error };
      }
    } else {
      // Rejected withdrawal
      transaction.status = 'rejected';
      transaction.details = { ...transaction.details, rejectionReason: reason };

      // Refund the amount to the user's wallet
      const wallet = await Wallet.findById(transaction.fromWallet);
      wallet.balance += transaction.amount;
      await wallet.save();
    }

    await transaction.save();

    // Notify the user about the withdrawal status
    // This is a placeholder. You should implement a proper notification system.
    logger.info(`Withdrawal ${transaction._id} ${status}: ${reason || ''}`);

    res.json(transaction);
  } catch (err) {
    logger.error(`Error processing withdrawal approval: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
