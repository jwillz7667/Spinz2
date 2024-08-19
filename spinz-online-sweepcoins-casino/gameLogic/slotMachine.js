const crypto = require('crypto');

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
    const bytes = crypto.randomBytes(4);
    const randomInt = bytes.readUInt32BE(0);
    return min + (randomInt % range);
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
