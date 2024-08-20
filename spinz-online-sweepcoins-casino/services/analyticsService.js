const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Game = require('../models/Game');

class AnalyticsService {
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
