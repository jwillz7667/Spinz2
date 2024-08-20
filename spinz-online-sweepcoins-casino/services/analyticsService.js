const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');

class AnalyticsService {
  async getRealTimeGamePerformance(timeFrame) {
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

  async getRealTimeUserActivity(timeFrame) {
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

  async getRealTimeFinancialTransactions(timeFrame) {
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
    const results = await GameResult.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$game',
        totalBets: { $sum: '$bet' },
        totalWins: { $sum: '$winnings' },
        totalSpins: { $sum: 1 }
      }},
      { $project: {
        rtp: { $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100] },
        totalSpins: 1
      }},
      { $sort: { rtp: -1 } },
      { $limit: limit }
    ]);

    return Promise.all(results.map(async (result) => {
      const game = await Game.findById(result._id);
      return {
        gameName: game.name,
        rtp: result.rtp,
        totalSpins: result.totalSpins
      };
    }));
  }
}

module.exports = new AnalyticsService();
