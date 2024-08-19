const CryptoJS = require('crypto-js');

class SlotMachine {
  constructor(reels = 3, symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎']) {
    this.reels = reels;
    this.symbols = symbols;
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
      return bet * 10;
    } else if (uniqueSymbols.size === 2) {
      // Two matching symbols
      return bet * 2;
    }
    
    return 0;
  }
}

module.exports = SlotMachine;
