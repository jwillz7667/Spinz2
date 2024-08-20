const express = require('express');
const { check, validationResult } = require('express-validator');
const { auth, hasRole } = require('../../middleware/auth');
const Game = require('../../models/Game');

// Apply admin role check to all routes
router.use(auth, hasRole('admin'));

// @route   POST api/admin/games
// @desc    Create a new game
// @access  Private (Admin only)
router.post(
  '/games',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('type', 'Type is required').isIn(['Slots', 'Poker', 'Blackjack']),
    check('description', 'Description is required').not().isEmpty(),
    check('rules', 'Rules are required').not().isEmpty(),
    check('payouts', 'Payouts are required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, description, rules, payouts, achievements } = req.body;

    try {
      let game = new Game({
        name,
        type,
        description,
        rules,
        payouts,
        achievements
      });

      await game.save();

      res.json(game);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/admin/games/:id
// @desc    Update a game
// @access  Private (Admin only)
router.put('/games/:id', async (req, res) => {
  const { name, type, description, rules, payouts, achievements } = req.body;

  const gameFields = {};
  if (name) gameFields.name = name;
  if (type) gameFields.type = type;
  if (description) gameFields.description = description;
  if (rules) gameFields.rules = rules;
  if (payouts) gameFields.payouts = payouts;
  if (achievements) gameFields.achievements = achievements;

  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    game = await Game.findByIdAndUpdate(
      req.params.id,
      { $set: gameFields },
      { new: true }
    );

    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/games/:id
// @desc    Delete a game
// @access  Private (Admin only)
router.delete('/games/:id', async (req, res) => {
  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    await Game.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Game removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/real-time-reports
// @desc    Get real-time reports
// @access  Private (Admin only)
router.get('/real-time-reports', [auth, hasPermission('viewAnalytics')], async (req, res) => {
  try {
    const timeFrame = 3600000; // 1 hour in milliseconds
    const gamePerformance = await AnalyticsService.getRealTimeGamePerformance(timeFrame);
    const userActivity = await AnalyticsService.getRealTimeUserActivity(timeFrame);
    const financialTransactions = await AnalyticsService.getRealTimeFinancialTransactions(timeFrame);

    res.json({
      gamePerformance,
      userActivity: userActivity[0],
      financialTransactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
const router = express.Router();
const { auth, hasPermission } = require('../../middleware/auth');
const User = require('../../models/User');
const Role = require('../../models/Role');
const AnalyticsService = require('../../services/analyticsService');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, hasPermission('manageUsers')], async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('roles');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', [auth, hasPermission('manageUsers')], async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const newRole = await Role.findOne({ name: role });
    if (!newRole) {
      return res.status(404).json({ msg: 'Role not found' });
    }
    user.roles = [newRole._id];
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/activity
// @desc    Get recent activity logs
// @access  Private (Admin only)
router.get('/activity', [auth, hasPermission('monitorActivity')], async (req, res) => {
  try {
    // Implement activity logging and retrieval logic here
    res.json({ msg: 'Activity logs retrieved' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
