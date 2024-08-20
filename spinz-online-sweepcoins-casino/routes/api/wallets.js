const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../../middleware/auth');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');
const { convertCurrency } = require('../../utils/currencyConverter');
const { WalletError } = require('../../utils/customErrors');

// @route   GET api/wallets
// @desc    Get user's wallets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wallets');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.wallets);
  } catch (err) {
    logger.error(`Error fetching wallets: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/wallets
// @desc    Create a new wallet
// @access  Private
router.post('/', [
  auth,
  [
    check('currency', 'Currency is required').not().isEmpty(),
    check('currency', 'Invalid currency').isIn(['USD', 'EUR', 'GBP', 'BTC', 'ETH']),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currency } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const existingWallet = user.wallets.find(wallet => wallet.currency === currency);
    if (existingWallet) {
      return res.status(400).json({ msg: 'Wallet with this currency already exists' });
    }

    const newWallet = new Wallet({
      user: req.user.id,
      currency,
      balance: 0,
      isDefault: user.wallets.length === 0
    });

    await newWallet.save();

    user.wallets.push(newWallet._id);
    if (user.wallets.length === 1) {
      user.defaultWallet = newWallet._id;
    }
    await user.save();

    res.json(newWallet);
  } catch (err) {
    logger.error(`Error creating wallet: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/wallets/deposit
// @desc    Deposit funds into wallet
// @access  Private
router.post('/deposit', [
  auth,
  [
    check('amount', 'Amount is required').isNumeric(),
    check('amount', 'Amount must be positive').isFloat({ min: 0.01 }),
    check('currency', 'Currency is required').not().isEmpty(),
    check('currency', 'Invalid currency').isIn(['USD', 'EUR', 'GBP', 'BTC', 'ETH']),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, currency } = req.body;
    const user = await User.findById(req.user.id).populate('wallets');
    
    if (!user) {
      throw new WalletError('User not found', 404);
    }

    let wallet = user.wallets.find(w => w.currency === currency);
    if (!wallet) {
      wallet = new Wallet({
        user: req.user.id,
        currency,
        balance: 0,
        isDefault: user.wallets.length === 0
      });
      await wallet.save();
      user.wallets.push(wallet._id);
      if (user.wallets.length === 1) {
        user.defaultWallet = wallet._id;
      }
      await user.save();
    }

    const depositAmount = parseFloat(amount);
    wallet.balance += depositAmount;
    await wallet.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: depositAmount,
      currency,
      toWallet: wallet._id,
      status: 'completed'
    });
    await transaction.save();

    logger.info(`Deposit successful: User ${user._id} deposited ${depositAmount} ${currency}`);
    res.json({ wallet, transaction });
  } catch (err) {
    if (err instanceof WalletError) {
      return res.status(err.statusCode).json({ msg: err.message });
    }
    logger.error(`Error depositing funds: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/wallets/withdraw
// @desc    Withdraw funds from wallet
// @access  Private
router.post('/withdraw', [
  auth,
  [
    check('amount', 'Amount is required').isNumeric(),
    check('amount', 'Amount must be positive').isFloat({ min: 0.01 }),
    check('currency', 'Currency is required').not().isEmpty(),
    check('currency', 'Invalid currency').isIn(['USD', 'EUR', 'GBP', 'BTC', 'ETH']),
    check('paymentMethod', 'Payment method is required').not().isEmpty(),
    check('paymentDetails', 'Payment details are required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, currency, paymentMethod, paymentDetails } = req.body;
    const user = await User.findById(req.user.id).populate('wallets');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const wallet = user.wallets.find(w => w.currency === currency);
    if (!wallet) {
      return res.status(400).json({ msg: 'Wallet not found for this currency' });
    }

    const withdrawalAmount = parseFloat(amount);
    if (wallet.balance < withdrawalAmount) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    // Create a pending transaction
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdrawal',
      amount: withdrawalAmount,
      currency,
      fromWallet: wallet._id,
      status: 'pending',
      paymentMethod,
      paymentDetails: encryptPaymentData(paymentDetails)
    });
    await transaction.save();

    // Deduct the amount from the wallet
    wallet.balance -= withdrawalAmount;
    await wallet.save();

    // Send notification to admin for approval
    // This is a placeholder. You should implement a proper notification system.
    logger.info(`New withdrawal request: ${transaction._id}`);

    res.json({ 
      msg: 'Withdrawal request submitted for approval',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status
      }
    });
  } catch (err) {
    logger.error(`Error processing withdrawal: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/wallets/convert
// @desc    Convert currency between wallets
// @access  Private
router.post('/convert', [
  auth,
  [
    check('fromCurrency', 'From currency is required').not().isEmpty(),
    check('toCurrency', 'To currency is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric(),
    check('amount', 'Amount must be positive').isFloat({ min: 0.01 }),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const user = await User.findById(req.user.id).populate('wallets');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const fromWallet = user.wallets.find(w => w.currency === fromCurrency);
    const toWallet = user.wallets.find(w => w.currency === toCurrency);

    if (!fromWallet || !toWallet) {
      return res.status(400).json({ msg: 'One or both wallets not found' });
    }

    if (fromWallet.balance < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    const convertedAmount = await convertCurrency(parseFloat(amount), fromCurrency, toCurrency);

    fromWallet.balance -= parseFloat(amount);
    toWallet.balance += convertedAmount;

    await fromWallet.save();
    await toWallet.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'conversion',
      amount: parseFloat(amount),
      currency: fromCurrency,
      fromWallet: fromWallet._id,
      toWallet: toWallet._id,
      status: 'completed',
      details: {
        fromAmount: parseFloat(amount),
        fromCurrency,
        toAmount: convertedAmount,
        toCurrency
      }
    });
    await transaction.save();

    res.json({ fromWallet, toWallet, transaction });
  } catch (err) {
    logger.error(`Error converting currency: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
