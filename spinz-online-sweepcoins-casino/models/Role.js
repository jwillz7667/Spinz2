const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Regular Player', 'VIP', 'Admin']
  },
  permissions: {
    accessVIPContent: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    manageGames: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: false },
    monitorActivity: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('Role', RoleSchema);
