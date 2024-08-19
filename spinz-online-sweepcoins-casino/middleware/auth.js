const jwt = require('jsonwebtoken');
const config = require('config');

// Middleware to verify the JWT token
const auth = (req, res, next) => {
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
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if the user has a specific role
const hasRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.includes(role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

// Middleware to check if the user has any of the specified roles
const hasAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, hasRole, hasAnyRole };
