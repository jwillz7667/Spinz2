const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../../middleware/auth');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');

// @route   GET api/wallets
// @desc    Get user's wallets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wallets');
    res.json(user.wallets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallets
// @desc    Create a new wallet
// @access  Private
router.post('/', [
  auth,
  [
    check('currency', 'Currency is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currency } = req.body;
    const user = await User.findById(req.user.id);

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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallets/deposit
// @desc    Deposit funds into wallet
// @access  Private
router.post('/deposit', [
  auth,
  [
    check('amount', 'Amount is required').isNumeric(),
    check('currency', 'Currency is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, currency } = req.body;
    const user = await User.findById(req.user.id).populate('wallets');
    
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

    wallet.balance += parseFloat(amount);
    await wallet.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      currency,
      toWallet: wallet._id,
      status: 'completed'
    });
    await transaction.save();

    res.json({ wallet, transaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallets/withdraw
// @desc    Withdraw funds from wallet
// @access  Private
router.post('/withdraw', [
  auth,
  [
    check('amount', 'Amount is required').isNumeric(),
    check('currency', 'Currency is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, currency } = req.body;
    const user = await User.findById(req.user.id).populate('wallets');
    
    const wallet = user.wallets.find(w => w.currency === currency);
    if (!wallet) {
      return res.status(400).json({ msg: 'Wallet not found for this currency' });
    }

    if (wallet.balance < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    wallet.balance -= parseFloat(amount);
    await wallet.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      currency,
      fromWallet: wallet._id,
      status: 'pending'
    });
    await transaction.save();

    res.json({ wallet, transaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
