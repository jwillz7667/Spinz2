const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { auth, isAdmin } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Spinz Online Sweepcoins Casino API is running');
});

// User routes
app.use('/api/users', require('./routes/api/users'));

// Game routes (protected)
app.use('/api/games', auth, require('./routes/api/games'));

// Admin routes (protected and admin-only)
app.use('/api/admin', [auth, isAdmin], require('./routes/api/admin'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
