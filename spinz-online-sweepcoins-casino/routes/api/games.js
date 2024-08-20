const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../../middleware/auth');

const Game = require('../../models/Game');
const User = require('../../models/User');
const GameResult = require('../../models/GameResult');
const SlotMachine = require('../../gameLogic/slotMachine');

// @route   GET api/games
// @desc    Get all games
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const games = await Game.find().select('-rules -payouts');
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/:id
// @desc    Get game by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/:id/leaderboard
// @desc    Get game leaderboard
// @access  Private
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    // This is a placeholder. In a real application, you would fetch the leaderboard data from a database.
    const leaderboard = [
      { username: 'player1', score: 1000 },
      { username: 'player2', score: 900 },
      { username: 'player3', score: 800 },
    ];
    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/:id/achievements
// @desc    Get game achievements
// @access  Private
router.get('/:id/achievements', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    res.json(game.achievements);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/games/:id/play
// @desc    Play a game
// @access  Private
router.post('/:id/play', [
  auth,
  [
    check('bet', 'Bet amount is required').not().isEmpty(),
    check('bet', 'Bet amount must be a number').isNumeric(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    const user = await User.findById(req.user.id).populate('wallets');
    const bet = parseFloat(req.body.bet);
    const currency = req.body.currency || 'USD'; // Default to USD if not specified

    if (bet < game.minBet || bet > game.maxBet) {
      return res.status(400).json({ msg: 'Invalid bet amount' });
    }

    const wallet = user.wallets.find(w => w.currency === currency);
    if (!wallet) {
      return res.status(400).json({ msg: 'Wallet not found for this currency' });
    }

    if (wallet.balance < bet) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    let result, payout;

    switch (game.type) {
      case 'Slots':
        const slotMachine = new SlotMachine(3, game.gameSettings.symbols || undefined);
        result = slotMachine.spin();
        payout = slotMachine.calculatePayout(bet, result);
        break;
      // Add cases for other game types here
      default:
        return res.status(400).json({ msg: 'Unsupported game type' });
    }

    // Update wallet balance
    wallet.balance -= bet;
    wallet.balance += payout;
    await wallet.save();

    // Update user's total winnings
    user.totalWinnings += payout > bet ? payout - bet : 0;
    await user.save();

    // Create game result
    const gameResult = new GameResult({
      player: user._id,
      game: game._id,
      bet,
      outcome: JSON.stringify(result),
      winnings: payout,
      currency
    });
    await gameResult.save();

    // Create transaction records
    const betTransaction = new Transaction({
      user: user._id,
      type: 'game_bet',
      amount: bet,
      currency,
      fromWallet: wallet._id,
      game: game._id,
      status: 'completed'
    });
    await betTransaction.save();

    const winTransaction = new Transaction({
      user: user._id,
      type: 'game_win',
      amount: payout,
      currency,
      toWallet: wallet._id,
      game: game._id,
      status: 'completed'
    });
    await winTransaction.save();

    res.json({
      result,
      payout,
      newBalance: wallet.balance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
