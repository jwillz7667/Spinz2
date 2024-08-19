const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../../../models/User');
const Role = require('../../../models/Role');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('roles');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id/roles
// @desc    Update user roles
// @access  Private (Admin only)
router.put('/:id/roles', [
  check('roles', 'Roles are required').isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const roles = await Role.find({ name: { $in: req.body.roles } });
    user.roles = roles.map(role => role._id);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
