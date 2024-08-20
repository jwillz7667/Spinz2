const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { auth, hasRole, hasAnyRole } = require('./middleware/auth');
const setupWebSocket = require('./websocket/setup');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Set up WebSocket
setupWebSocket(io);

// Middleware
app.use(express.json());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Apply stricter rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

// Routes
app.get('/', (req, res) => {
  res.send('Spinz Online Sweepcoins Casino API is running');
});

// User routes
app.use('/api/users', require('./routes/api/users'));

// Game routes (protected, accessible by players and admins)
app.use('/api/games', [auth, hasAnyRole(['player', 'admin'])], require('./routes/api/games'));

// Payment routes (protected)
app.use('/api/payments', auth, require('./routes/api/payments'));

// Wallet routes (protected)
app.use('/api/wallets', auth, require('./routes/api/wallets'));

// Admin routes (protected and admin-only)
app.use('/api/admin', [auth, hasPermission('manageUsers')], require('./routes/api/admin'));

// Start server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server, io };
