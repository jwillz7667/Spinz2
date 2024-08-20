const GameResult = require('../models/GameResult');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const io = require('../websocket/setup').getIo();

class RealTimeDataService {
  constructor() {
    this.gameData = new Map();
    this.playerData = new Map();
    this.financialData = new Map();
  }

  collectGameData(gameResult) {
    const { game, player, bet, winnings } = gameResult;
    if (!this.gameData.has(game)) {
      this.gameData.set(game, { totalBets: 0, totalWinnings: 0, spins: 0 });
    }
    const gameStats = this.gameData.get(game);
    gameStats.totalBets += bet;
    gameStats.totalWinnings += winnings;
    gameStats.spins += 1;
    this.gameData.set(game, gameStats);

    io.emit('gameDataUpdate', { game, stats: gameStats });
  }

  collectPlayerData(gameResult) {
    const { player, bet, winnings } = gameResult;
    if (!this.playerData.has(player)) {
      this.playerData.set(player, { totalBets: 0, totalWinnings: 0, gamesPlayed: 0 });
    }
    const playerStats = this.playerData.get(player);
    playerStats.totalBets += bet;
    playerStats.totalWinnings += winnings;
    playerStats.gamesPlayed += 1;
    this.playerData.set(player, playerStats);

    io.emit('playerDataUpdate', { player, stats: playerStats });
  }

  collectFinancialData(transaction) {
    const { type, amount } = transaction;
    if (!this.financialData.has(type)) {
      this.financialData.set(type, { totalAmount: 0, count: 0 });
    }
    const financialStats = this.financialData.get(type);
    financialStats.totalAmount += amount;
    financialStats.count += 1;
    this.financialData.set(type, financialStats);

    io.emit('financialDataUpdate', { type, stats: financialStats });
  }

  async getRealtimeStats() {
    const gameStats = Array.from(this.gameData.entries()).map(([game, stats]) => ({ game, ...stats }));
    const playerStats = Array.from(this.playerData.entries()).map(([player, stats]) => ({ player, ...stats }));
    const financialStats = Array.from(this.financialData.entries()).map(([type, stats]) => ({ type, ...stats }));

    return { gameStats, playerStats, financialStats };
  }
}

module.exports = new RealTimeDataService();
