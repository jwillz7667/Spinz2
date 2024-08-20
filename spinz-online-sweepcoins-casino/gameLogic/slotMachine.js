const CryptoJS = require('crypto-js');

class SlotMachine {
  constructor(reels = 3, symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎']) {
    this.reels = reels;
    this.symbols = symbols;
    this.payoutTable = {
      '🍒': 2,
      '🍋': 3,
      '🍊': 4,
      '🍇': 5,
      '🔔': 8,
      '💎': 10
    };
  }

  spin() {
    const result = [];
    for (let i = 0; i < this.reels; i++) {
      const randomIndex = this.getRandomInt(0, this.symbols.length - 1);
      result.push(this.symbols[randomIndex]);
    }
    return result;
  }

  getRandomInt(min, max) {
    const range = max - min + 1;
    const randomBytes = CryptoJS.lib.WordArray.random(4);
    const randomInt = randomBytes.words[0] >>> 0; // Convert to unsigned 32-bit integer
    return min + (randomInt % range);
  }

  // Method for seeding the RNG (for testing purposes only)
  seedRNG(seed) {
    CryptoJS.lib.WordArray.random = () => CryptoJS.lib.WordArray.create([seed]);
  }

  calculatePayout(bet, result) {
    const uniqueSymbols = new Set(result);
    
    if (uniqueSymbols.size === 1) {
      // All symbols are the same
      return bet * this.payoutTable[result[0]];
    } else if (uniqueSymbols.size === 2) {
      // Two matching symbols
      const [symbol1, symbol2] = uniqueSymbols;
      const count1 = result.filter(s => s === symbol1).length;
      const count2 = result.filter(s => s === symbol2).length;
      const majorSymbol = count1 > count2 ? symbol1 : symbol2;
      return bet * (this.payoutTable[majorSymbol] / 2);
    }
    
    return 0;
  }

  getSymbolProbabilities() {
    const totalSymbols = this.symbols.length;
    return this.symbols.reduce((acc, symbol) => {
      acc[symbol] = 1 / totalSymbols;
      return acc;
    }, {});
  }

  calculateExpectedReturn() {
    const probabilities = this.getSymbolProbabilities();
    let expectedReturn = 0;

    for (let i = 0; i < this.symbols.length; i++) {
      for (let j = 0; j < this.symbols.length; j++) {
        for (let k = 0; k < this.symbols.length; k++) {
          const result = [this.symbols[i], this.symbols[j], this.symbols[k]];
          const payout = this.calculatePayout(1, result);
          const probability = probabilities[this.symbols[i]] * probabilities[this.symbols[j]] * probabilities[this.symbols[k]];
          expectedReturn += payout * probability;
        }
      }
    }

    return expectedReturn;
  }
}

module.exports = SlotMachine;
