const request = require('supertest');
const app = require('../server').app;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

describe('Security Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should not allow access to protected routes without a token', async () => {
      const res = await request(app).get('/api/games');
      expect(res.statusCode).toBe(401);
    });

    it('should not allow access with an invalid token', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('x-auth-token', 'invalidtoken');
      expect(res.statusCode).toBe(401);
    });

    it('should prevent brute force attacks by rate limiting', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/users/login')
          .send({ email: 'test@test.com', password: 'password' });
      }
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'test@test.com', password: 'password' });
      expect(res.statusCode).toBe(429);
    });
  });

  describe('Input Validation', () => {
    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'weak',
          captchaToken: 'validtoken'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should reject login with SQL injection attempt', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1"
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: await bcrypt.hash('password', 10)
      });
      await user.save();

      const token = jwt.sign(
        { user: { id: user.id } },
        config.get('jwtSecret'),
        { expiresIn: '5h' }
      );

      const res = await request(app)
        .post('/api/users/change-password')
        .set('x-auth-token', token)
        .send({ newPassword: 'newpassword' });
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const user = new User({
        name: '<script>alert("XSS")</script>',
        email: 'test@test.com',
        password: await bcrypt.hash('password', 10)
      });
      await user.save();

      const res = await request(app).get(`/api/users/${user.id}`);
      expect(res.body.name).not.toContain('<script>');
    });
  });
});
