import React from 'react';
import { Link } from 'react-router-dom';
import './UserJourney.css';

const UserJourney = () => {
  return (
    <div className="user-journey">
      <h1>Spinz Online Casino User Journey</h1>
      
      <section className="journey-step">
        <h2>1. Game Selection</h2>
        <div className="wireframe game-selection">
          <div className="game-categories">
            <button>Classic Slots</button>
            <button>Video Slots</button>
            <button>Progressive Jackpots</button>
          </div>
          <div className="game-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="game-card">
                <div className="game-thumbnail"></div>
                <h3>Game {i}</h3>
                <button>Play Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-step">
        <h2>2. Game Launch</h2>
        <div className="wireframe game-launch">
          <div className="game-preview">
            <h3>Game Title</h3>
            <div className="game-screen"></div>
          </div>
          <div className="game-info">
            <p>RTP: 96.5%</p>
            <p>Volatility: Medium</p>
            <p>Min Bet: $0.10</p>
            <p>Max Bet: $100</p>
          </div>
          <button className="launch-button">Launch Game</button>
        </div>
      </section>

      <section className="journey-step">
        <h2>3. Gameplay</h2>
        <div className="wireframe gameplay">
          <div className="slot-machine">
            <div className="reels">
              <div className="reel"></div>
              <div className="reel"></div>
              <div className="reel"></div>
            </div>
          </div>
          <div className="game-controls">
            <div className="bet-controls">
              <button>-</button>
              <span>Bet: $1.00</span>
              <button>+</button>
            </div>
            <button className="spin-button">SPIN</button>
          </div>
          <div className="game-stats">
            <p>Balance: $100.00</p>
            <p>Win: $0.00</p>
          </div>
        </div>
      </section>

      <section className="journey-step">
        <h2>4. Win Celebration</h2>
        <div className="wireframe win-celebration">
          <div className="celebration-overlay">
            <h2>Big Win!</h2>
            <p className="win-amount">$50.00</p>
            <div className="fireworks"></div>
          </div>
          <button>Continue Playing</button>
          <button>Collect Winnings</button>
        </div>
      </section>

      <section className="journey-step">
        <h2>5. Payout</h2>
        <div className="wireframe payout">
          <h3>Withdraw Winnings</h3>
          <form>
            <label>
              Amount:
              <input type="number" placeholder="Enter amount" />
            </label>
            <label>
              Withdrawal Method:
              <select>
                <option>Bank Transfer</option>
                <option>PayPal</option>
                <option>Crypto Wallet</option>
              </select>
            </label>
            <button>Request Withdrawal</button>
          </form>
        </div>
      </section>

      <Link to="/games" className="back-link">Back to Games</Link>
    </div>
  );
};

export default UserJourney;
