const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

// Middleware to verify the JWT token
const auth = async (req, res, next) => {
  // Get the token from the request header
  const token = req.header('x-auth-token');

  // Check if there's a token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // Add the user to the request object
    const user = await User.findById(decoded.user.id).populate('roles');
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if the user has a specific role
const hasRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.some(role => role.name === roleName)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

// Middleware to check if the user has any of the specified roles
const hasAnyRole = (roleNames) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.some(role => roleNames.includes(role.name))) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

// Middleware to check if MFA is required
const requireMFA = (req, res, next) => {
  if (req.user.mfaEnabled && !req.session.mfaVerified) {
    return res.status(403).json({ msg: 'MFA verification required' });
  }
  next();
};

module.exports = { auth, hasRole, hasAnyRole, requireMFA };
