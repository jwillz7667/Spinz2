const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const DataProcessingService = require('./dataProcessingService');
const RealTimeDataService = require('./realTimeDataService');

class AnalyticsService {
  async getRealTimeGamePerformance(timeFrame) {
    const realtimeStats = await RealTimeDataService.getRealtimeStats();
    const dbStats = await this.getDbGamePerformance(timeFrame);
    
    return this.mergeGameStats(realtimeStats.gameStats, dbStats);
  }

  async getDbGamePerformance(timeFrame) {
    const startTime = new Date(Date.now() - timeFrame);
    const results = await GameResult.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      { $group: {
        _id: '$game',
        totalBets: { $sum: '$bet' },
        totalWins: { $sum: '$winnings' },
        totalSpins: { $sum: 1 }
      }},
      { $sort: { totalSpins: -1 } }
    ]);

    return Promise.all(results.map(async (result) => {
      const game = await Game.findById(result._id);
      return {
        gameName: game.name,
        totalBets: result.totalBets,
        totalWins: result.totalWins,
        totalSpins: result.totalSpins,
        rtp: (result.totalWins / result.totalBets) * 100
      };
    }));
  }

  mergeGameStats(realtimeStats, dbStats) {
    const mergedStats = [...dbStats];
    realtimeStats.forEach(realtimeStat => {
      const existingStatIndex = mergedStats.findIndex(stat => stat.gameName === realtimeStat.game);
      if (existingStatIndex !== -1) {
        mergedStats[existingStatIndex].totalBets += realtimeStat.totalBets;
        mergedStats[existingStatIndex].totalWins += realtimeStat.totalWinnings;
        mergedStats[existingStatIndex].totalSpins += realtimeStat.spins;
        mergedStats[existingStatIndex].rtp = (mergedStats[existingStatIndex].totalWins / mergedStats[existingStatIndex].totalBets) * 100;
      } else {
        mergedStats.push({
          gameName: realtimeStat.game,
          totalBets: realtimeStat.totalBets,
          totalWins: realtimeStat.totalWinnings,
          totalSpins: realtimeStat.spins,
          rtp: (realtimeStat.totalWinnings / realtimeStat.totalBets) * 100
        });
      }
    });
    return mergedStats;
  }

  async getRealTimeUserActivity(timeFrame) {
    const realtimeStats = await RealTimeDataService.getRealtimeStats();
    const dbStats = await this.getDbUserActivity(timeFrame);
    
    return this.mergeUserStats(realtimeStats.playerStats, dbStats);
  }

  async getDbUserActivity(timeFrame) {
    const startTime = new Date(Date.now() - timeFrame);
    return await User.aggregate([
      { $match: { lastActivity: { $gte: startTime } } },
      { $group: {
        _id: null,
        activeUsers: { $sum: 1 },
        newRegistrations: {
          $sum: { $cond: [{ $gte: ['$createdAt', startTime] }, 1, 0] }
        }
      }}
    ]);
  }

  mergeUserStats(realtimeStats, dbStats) {
    const activeUsers = new Set(dbStats[0].activeUsers);
    realtimeStats.forEach(stat => activeUsers.add(stat.player));
    
    return [{
      _id: null,
      activeUsers: activeUsers.size,
      newRegistrations: dbStats[0].newRegistrations
    }];
  }

  async getRealTimeFinancialTransactions(timeFrame) {
    const realtimeStats = await RealTimeDataService.getRealtimeStats();
    const dbStats = await this.getDbFinancialTransactions(timeFrame);
    
    return this.mergeFinancialStats(realtimeStats.financialStats, dbStats);
  }

  async getDbFinancialTransactions(timeFrame) {
    const startTime = new Date(Date.now() - timeFrame);
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      { $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);
  }

  mergeFinancialStats(realtimeStats, dbStats) {
    const mergedStats = [...dbStats];
    realtimeStats.forEach(realtimeStat => {
      const existingStatIndex = mergedStats.findIndex(stat => stat._id === realtimeStat.type);
      if (existingStatIndex !== -1) {
        mergedStats[existingStatIndex].totalAmount += realtimeStat.totalAmount;
        mergedStats[existingStatIndex].count += realtimeStat.count;
      } else {
        mergedStats.push({
          _id: realtimeStat.type,
          totalAmount: realtimeStat.totalAmount,
          count: realtimeStat.count
        });
      }
    });
    return mergedStats;
  }
  async getSlotGameMetrics(gameId, startDate, endDate) {
    const results = await GameResult.find({
      game: gameId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalBets = results.reduce((sum, result) => sum + result.bet, 0);
    const totalWins = results.reduce((sum, result) => sum + result.winnings, 0);
    const rtp = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    const uniquePlayers = new Set(results.map(result => result.player.toString())).size;
    const totalSpins = results.length;

    const bonusTriggered = results.filter(result => result.bonusTriggered).length;
    const bonusUtilizationRate = (bonusTriggered / totalSpins) * 100;

    return {
      rtp,
      uniquePlayers,
      totalSpins,
      averageBetSize: totalBets / totalSpins,
      bonusUtilizationRate
    };
  }

  async getPlayerRetentionRate(gameId, startDate, endDate, retentionPeriodDays) {
    const initialPlayers = await GameResult.distinct('player', {
      game: gameId,
      createdAt: { $gte: startDate, $lte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    const retainedPlayers = await GameResult.distinct('player', {
      game: gameId,
      player: { $in: initialPlayers },
      createdAt: { $gte: new Date(endDate.getTime() - retentionPeriodDays * 24 * 60 * 60 * 1000), $lte: endDate }
    });

    return (retainedPlayers.length / initialPlayers.length) * 100;
  }

  async getTopPerformingGames(startDate, endDate, limit = 10) {
    const gameOutcomes = await DataProcessingService.aggregateGameOutcomes(startDate, endDate);
    return gameOutcomes
      .sort((a, b) => b.rtp - a.rtp)
      .slice(0, limit)
      .map(game => ({
        gameName: game.gameName,
        rtp: game.rtp,
        totalSpins: game.totalGamesPlayed
      }));
  }

  async getPlayerBehaviorAnalysis(startDate, endDate) {
    return await DataProcessingService.aggregatePlayerBehavior(startDate, endDate);
  }

  async getFinancialAnalysis(startDate, endDate) {
    return await DataProcessingService.aggregateFinancialData(startDate, endDate);
  }
}

module.exports = new AnalyticsService();
