const mongoose = require('mongoose');
const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class DataProcessingService {
  async aggregatePlayerBehavior(startDate, endDate) {
    return await GameResult.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$player',
        totalGamesPlayed: { $sum: 1 },
        totalBet: { $sum: '$bet' },
        totalWinnings: { $sum: '$winnings' },
        averageBetSize: { $avg: '$bet' },
        mostPlayedGame: { $first: '$game' }
      }},
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'playerInfo'
      }},
      { $unwind: '$playerInfo' },
      { $project: {
        _id: 1,
        playerName: '$playerInfo.name',
        totalGamesPlayed: 1,
        totalBet: 1,
        totalWinnings: 1,
        averageBetSize: 1,
        mostPlayedGame: 1,
        netProfit: { $subtract: ['$totalWinnings', '$totalBet'] }
      }}
    ]);
  }

  async aggregateGameOutcomes(startDate, endDate) {
    return await GameResult.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$game',
        totalGamesPlayed: { $sum: 1 },
        totalBet: { $sum: '$bet' },
        totalWinnings: { $sum: '$winnings' },
        averageBetSize: { $avg: '$bet' },
        uniquePlayers: { $addToSet: '$player' }
      }},
      { $lookup: {
        from: 'games',
        localField: '_id',
        foreignField: '_id',
        as: 'gameInfo'
      }},
      { $unwind: '$gameInfo' },
      { $project: {
        _id: 1,
        gameName: '$gameInfo.name',
        totalGamesPlayed: 1,
        totalBet: 1,
        totalWinnings: 1,
        averageBetSize: 1,
        uniquePlayerCount: { $size: '$uniquePlayers' },
        rtp: { $multiply: [{ $divide: ['$totalWinnings', '$totalBet'] }, 100] }
      }}
    ]);
  }

  async aggregateFinancialData(startDate, endDate) {
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }},
      { $project: {
        _id: 1,
        totalAmount: 1,
        count: 1,
        averageAmount: 1
      }}
    ]);
  }
}

module.exports = new DataProcessingService();
