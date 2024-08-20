const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, hasPermission } = require('../../middleware/auth');

const Game = require('../../models/Game');
const User = require('../../models/User');
const GameResult = require('../../models/GameResult');
const SlotMachine = require('../../gameLogic/slotMachine');
const slotGameIntegration = require('../../services/slotGameIntegration');
const analyticsService = require('../../services/analyticsService');

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

// @route   GET api/games/slots
// @desc    Get all slot games
// @access  Private
router.get('/slots', auth, async (req, res) => {
  try {
    const slotGames = await slotGameIntegration.getGameList();
    res.json(slotGames);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/slots/:type
// @desc    Get slot games by type (classic, video, progressive)
// @access  Private
router.get('/slots/:type', auth, async (req, res) => {
  try {
    const slotGames = await slotGameIntegration.getGameList();
    const { type } = req.params;
    
    if (!['classicSlots', 'videoSlots', 'progressiveJackpots'].includes(type)) {
      return res.status(400).json({ msg: 'Invalid slot game type' });
    }
    
    res.json(slotGames[type]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/games/slots/launch
// @desc    Launch a slot game
// @access  Private
router.post('/slots/launch', auth, async (req, res) => {
  try {
    const { gameId, mode } = req.body;
    const launchData = await slotGameIntegration.launchGame(gameId, req.user.id, mode);
    res.json(launchData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/slots/result/:sessionId
// @desc    Get slot game result
// @access  Private
router.get('/slots/result/:sessionId', auth, async (req, res) => {
  try {
    const result = await slotGameIntegration.getGameResult(req.params.sessionId);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/slots/jackpots
// @desc    Get jackpot information
// @access  Private
router.get('/slots/jackpots', auth, async (req, res) => {
  try {
    const jackpotInfo = await slotGameIntegration.getJackpotInfo();
    res.json(jackpotInfo);
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

    let result, payout, expectedReturn;

    switch (game.type) {
      case 'Slots':
        const slotMachine = new SlotMachine(3, game.gameSettings.symbols || undefined);
        result = slotMachine.spin();
        payout = slotMachine.calculatePayout(bet, result);
        expectedReturn = slotMachine.calculateExpectedReturn();
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

    if (payout > 0) {
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
    }

    // Check for achievements
    const achievements = await checkAchievements(user, game, gameResult);

    logger.info(`Game played: User ${user._id} bet ${bet} ${currency} and won ${payout} ${currency} in ${game.name}`);

    res.json({
      result,
      payout,
      newBalance: wallet.balance,
      expectedReturn,
      achievements
    });
  } catch (err) {
    logger.error(`Error playing game: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

async function checkAchievements(user, game, gameResult) {
  const unlockedAchievements = [];

  for (const achievement of game.achievements) {
    if (!user.achievementsUnlocked.some(a => a.achievement === achievement.name)) {
      if (await evaluateAchievementCriteria(user, game, gameResult, achievement.criteria)) {
        user.achievementsUnlocked.push({
          game: game._id,
          achievement: achievement.name,
          unlockedAt: new Date()
        });
        unlockedAchievements.push(achievement.name);
      }
    }
  }

  if (unlockedAchievements.length > 0) {
    await user.save();
  }

  return unlockedAchievements;
}

async function evaluateAchievementCriteria(user, game, gameResult, criteria) {
  // Implement the logic to evaluate achievement criteria
  // This is a placeholder and should be replaced with actual logic
  return Math.random() < 0.1; // 10% chance of unlocking an achievement
}

// @route   GET api/games/analytics/:id
// @desc    Get analytics for a specific game
// @access  Private (Admin only)
router.get('/analytics/:id', [auth, hasPermission('viewAnalytics')], async (req, res) => {
  try {
    const gameId = req.params.id;
    const { startDate, endDate } = req.query;

    const metrics = await analyticsService.getSlotGameMetrics(gameId, new Date(startDate), new Date(endDate));
    const retentionRate = await analyticsService.getPlayerRetentionRate(gameId, new Date(startDate), new Date(endDate), 30);

    res.json({
      ...metrics,
      retentionRate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/analytics/top-performing
// @desc    Get top performing games
// @access  Private (Admin only)
router.get('/analytics/top-performing', [auth, hasPermission('viewAnalytics')], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const topGames = await analyticsService.getTopPerformingGames(new Date(startDate), new Date(endDate));
    res.json(topGames);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
