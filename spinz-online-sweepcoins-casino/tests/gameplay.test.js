const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Game = require('../models/Game');
const GameResult = require('../models/GameResult');
const config = require('config');

describe('Gameplay Simulations', () => {
  let userToken, gameId;

  beforeAll(async () => {
    await mongoose.connect(config.get('mongoURI'), { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Game.deleteMany({});
    await GameResult.deleteMany({});

    // Create a test user
    const user = new User({
      name: 'Test Player',
      email: 'player@test.com',
      password: 'password123',
      isVerified: true,
      sweepcoinsBalance: 1000
    });
    await user.save();

    // Login and get token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'player@test.com', password: 'password123' });
    userToken = loginRes.body.token;

    // Create a test game
    const game = new Game({
      name: 'Test Slots',
      type: 'Slots',
      description: 'Test slot machine',
      rules: 'Spin to win',
      payouts: 'Three of a kind pays 10x',
      minBet: 1,
      maxBet: 100,
      gameSettings: {
        symbols: ['🍒', '🍋', '🍊', '🍇', '🔔', '💎']
      }
    });
    await game.save();
    gameId = game._id;
  });

  test('Should play a game successfully', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('result');
    expect(res.body).toHaveProperty('payout');
    expect(res.body).toHaveProperty('newBalance');
  });

  test('Should not allow bet below minimum', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 0.5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Invalid bet amount');
  });

  test('Should not allow bet above maximum', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 150 });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Invalid bet amount');
  });

  test('Should not allow bet above user balance', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 1500 });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Insufficient balance');
  });

  test('Should update user balance after game', async () => {
    const initialUser = await User.findOne({ email: 'player@test.com' });
    const initialBalance = initialUser.sweepcoinsBalance;

    const res = await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 10 });

    const updatedUser = await User.findOne({ email: 'player@test.com' });
    expect(updatedUser.sweepcoinsBalance).not.toBe(initialBalance);
    expect(updatedUser.sweepcoinsBalance).toBe(res.body.newBalance);
  });

  test('Should create a game result after playing', async () => {
    await request(app)
      .post(`/api/games/${gameId}/play`)
      .set('x-auth-token', userToken)
      .send({ bet: 10 });

    const gameResult = await GameResult.findOne({ player: initialUser._id });
    expect(gameResult).toBeTruthy();
    expect(gameResult.game.toString()).toBe(gameId.toString());
    expect(gameResult.bet).toBe(10);
  });
});
