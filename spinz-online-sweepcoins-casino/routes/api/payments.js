const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { processStripePayment, processPayPalPayment, processCryptoPayment } = require('../../services/paymentService');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

// @route   POST api/payments/deposit
// @desc    Process a deposit
// @access  Private
router.post('/deposit', [
  auth,
  [
    check('amount', 'Amount is required').not().isEmpty(),
    check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
    check('currency', 'Currency is required').not().isEmpty(),
    check('paymentMethod', 'Payment method is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, currency, paymentMethod, paymentDetails } = req.body;

  try {
    let paymentResult;

    switch (paymentMethod) {
      case 'stripe':
        paymentResult = await processStripePayment(amount * 100, currency, paymentDetails.paymentMethodId, req.user.id);
        break;
      case 'paypal':
        paymentResult = await processPayPalPayment(amount, currency);
        break;
      case 'crypto':
        paymentResult = await processCryptoPayment(amount, currency, paymentDetails.address);
        break;
      default:
        return res.status(400).json({ msg: 'Unsupported payment method' });
    }

    // Create a new transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount,
      currency,
      paymentMethod,
      status: 'completed',
      details: paymentResult
    });
    await transaction.save();

    // Update user's balance
    const user = await User.findById(req.user.id);
    user.sweepcoinsBalance += amount;
    await user.save();

    res.json({ msg: 'Deposit successful', transaction, newBalance: user.sweepcoinsBalance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments/withdraw
// @desc    Process a withdrawal request
// @access  Private
router.post('/withdraw', [
  auth,
  [
    check('amount', 'Amount is required').not().isEmpty(),
    check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
    check('currency', 'Currency is required').not().isEmpty(),
    check('withdrawalMethod', 'Withdrawal method is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, currency, withdrawalMethod, withdrawalDetails } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user.sweepcoinsBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Create a new transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      currency,
      paymentMethod: withdrawalMethod,
      status: 'pending',
      details: withdrawalDetails
    });
    await transaction.save();

    // Update user's balance
    user.sweepcoinsBalance -= amount;
    await user.save();

    res.json({ msg: 'Withdrawal request submitted', transaction, newBalance: user.sweepcoinsBalance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
