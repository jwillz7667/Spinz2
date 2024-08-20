const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const config = require('config');

describe('Authentication Module', () => {
  beforeAll(async () => {
    await mongoose.connect(config.get('mongoURI'), { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});

    // Create default roles
    const userRole = new Role({ name: 'user' });
    const adminRole = new Role({ name: 'admin' });
    await userRole.save();
    await adminRole.save();
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('User registered successfully. Please check your email to verify your account.');
    });

    it('should not register a user with an existing email', async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Another Test User',
          email: 'test@example.com',
          password: 'password456'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('User already exists');
    });

    it('should not register a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Please include a valid email');
    });

    it('should not register a user with a short password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Please enter a password with 6 or more characters');
    });
  });

  describe('User Login', () => {
    it('should login a verified user', async () => {
      const userRole = await Role.findOne({ name: 'user' });
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: [userRole._id],
        isVerified: true
      });
      await user.save();

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('roles');
      expect(res.body.user.roles).toContain('user');
    });

    it('should not login an unverified user', async () => {
      const userRole = await Role.findOne({ name: 'user' });
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: [userRole._id],
        isVerified: false
      });
      await user.save();

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Please verify your email before logging in');
    });

    it('should not login with incorrect password', async () => {
      const userRole = await Role.findOne({ name: 'user' });
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: [userRole._id],
        isVerified: true
      });
      await user.save();

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid Credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid Credentials');
    });
  });

  describe('Role-Based Access Control', () => {
    let userToken, adminToken;

    beforeEach(async () => {
      const userRole = await Role.findOne({ name: 'user' });
      const adminRole = await Role.findOne({ name: 'admin' });

      const user = new User({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        roles: [userRole._id],
        isVerified: true
      });
      await user.save();

      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        roles: [adminRole._id],
        isVerified: true
      });
      await admin.save();

      userToken = jwt.sign(
        { user: { id: user._id, roles: ['user'] } },
        config.get('jwtSecret'),
        { expiresIn: '1h' }
      );

      adminToken = jwt.sign(
        { user: { id: admin._id, roles: ['admin'] } },
        config.get('jwtSecret'),
        { expiresIn: '1h' }
      );
    });

    it('should allow a user to access game routes', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('x-auth-token', userToken);

      expect(res.statusCode).toBe(200);
    });

    it('should allow an admin to access game routes', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('x-auth-token', adminToken);

      expect(res.statusCode).toBe(200);
    });

    it('should not allow a user to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-auth-token', userToken);

      expect(res.statusCode).toBe(403);
    });

    it('should allow an admin to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-auth-token', adminToken);

      expect(res.statusCode).toBe(200);
    });

    it('should not allow access with an invalid token', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('x-auth-token', 'invalidtoken');

      expect(res.statusCode).toBe(401);
    });

    it('should not allow access without a token', async () => {
      const res = await request(app)
        .get('/api/games');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Password Reset', () => {
    it('should send a password reset email', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isVerified: true
      });
      await user.save();

      const res = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Password reset email sent');
    });

    it('should not send a password reset email for non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('User not found');
    });

    // Add more tests for password reset functionality
  });
});
