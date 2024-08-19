const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { auth, hasRole, hasAnyRole } = require('./middleware/auth');

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

// Game routes (protected, accessible by players and admins)
app.use('/api/games', [auth, hasAnyRole(['player', 'admin'])], require('./routes/api/games'));

// Admin routes (protected and admin-only)
app.use('/api/admin', [auth, hasRole('admin')], require('./routes/api/admin'));
app.use('/api/admin/users', [auth, hasRole('admin')], require('./routes/api/admin/users'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
