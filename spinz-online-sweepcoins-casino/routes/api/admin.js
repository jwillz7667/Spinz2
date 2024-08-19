const express = require('express');
const router = express.Router();
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

module.exports = router;
