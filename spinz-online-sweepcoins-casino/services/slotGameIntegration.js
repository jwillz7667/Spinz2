const axios = require('axios');
const config = require('config');
const Game = require('../models/Game');
const GameMetadata = require('../models/GameMetadata');
const PlayerStats = require('../models/PlayerStats');

class SlotGameIntegration {
  constructor() {
    this.apiUrl = config.get('pragmaticPlayApiUrl');
    this.apiKey = config.get('pragmaticPlayApiKey');
  }

  async getGameList() {
    try {
      const response = await axios.get(`${this.apiUrl}/games`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      await this.updateGameDatabase(response.data);
      return this.categorizeGames(await Game.find().populate('metadata'));
    } catch (error) {
      console.error('Error fetching game list:', error);
      throw error;
    }
  }

  async updateGameDatabase(externalGames) {
    for (const externalGame of externalGames) {
      let game = await Game.findOne({ externalId: externalGame.id });
      if (!game) {
        game = new Game({
          name: externalGame.name,
          type: this.mapGameType(externalGame.type),
          description: externalGame.description,
          provider: externalGame.provider,
          externalId: externalGame.id,
          thumbnail: externalGame.thumbnail
        });
      }

      const metadata = await GameMetadata.findOneAndUpdate(
        { game: game._id },
        {
          rtp: externalGame.rtp,
          volatility: externalGame.volatility,
          minBet: externalGame.minBet,
          maxBet: externalGame.maxBet,
          paylines: externalGame.paylines,
          reels: externalGame.reels,
          bonusFeatures: externalGame.bonusFeatures
        },
        { upsert: true, new: true }
      );

      game.metadata = metadata._id;
      await game.save();
    }
  }

  mapGameType(externalType) {
    const typeMap = {
      classic: 'ClassicSlot',
      video: 'VideoSlot',
      progressive: 'ProgressiveJackpot'
    };
    return typeMap[externalType] || 'VideoSlot';
  }

  categorizeGames(games) {
    return {
      classicSlots: games.filter(game => game.type === 'ClassicSlot'),
      videoSlots: games.filter(game => game.type === 'VideoSlot'),
      progressiveJackpots: games.filter(game => game.type === 'ProgressiveJackpot')
    };
  }

  async launchGame(gameId, userId, mode = 'real') {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const response = await axios.post(`${this.apiUrl}/launch`, {
        game_id: game.externalId,
        user_id: userId,
        mode: mode
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return response.data;
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
    }
  }

  async getGameResult(sessionId) {
    try {
      const response = await axios.get(`${this.apiUrl}/result/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      await this.updatePlayerStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching game result:', error);
      throw error;
    }
  }

  async updatePlayerStats(gameResult) {
    const { userId, gameId, bet, win, bonusFeatures } = gameResult;
    
    const stats = await PlayerStats.findOneAndUpdate(
      { user: userId, game: gameId },
      {
        $inc: {
          totalSpins: 1,
          totalWagered: bet,
          totalWon: win
        },
        $max: { biggestWin: win },
        $set: { lastPlayed: new Date() }
      },
      { upsert: true, new: true }
    );

    if (bonusFeatures) {
      for (const feature of bonusFeatures) {
        stats.bonusFeaturesTriggers.set(
          feature,
          (stats.bonusFeaturesTriggers.get(feature) || 0) + 1
        );
      }
      await stats.save();
    }
  }

  async getJackpotInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/jackpots`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching jackpot information:', error);
      throw error;
    }
  }
}

module.exports = new SlotGameIntegration();
