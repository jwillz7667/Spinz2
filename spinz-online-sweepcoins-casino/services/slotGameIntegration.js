const axios = require('axios');
const config = require('config');

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
      return this.categorizeGames(response.data);
    } catch (error) {
      console.error('Error fetching game list:', error);
      throw error;
    }
  }

  categorizeGames(games) {
    return {
      classicSlots: games.filter(game => game.type === 'classic'),
      videoSlots: games.filter(game => game.type === 'video'),
      progressiveJackpots: games.filter(game => game.type === 'progressive')
    };
  }

  async launchGame(gameId, userId, mode = 'real') {
    try {
      const response = await axios.post(`${this.apiUrl}/launch`, {
        game_id: gameId,
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
      return response.data;
    } catch (error) {
      console.error('Error fetching game result:', error);
      throw error;
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
