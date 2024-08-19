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

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  next();
};

module.exports = { auth, isAdmin };
