import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { joinGame, leaveGame, sendGameAction, onGameUpdate, onPlayerJoined, onPlayerLeft } from '../../utils/socket';
import Chat from '../chat/Chat';
import WinCelebration from './WinCelebration';
import './Game.css';

const Game = () => {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [betAmount, setBetAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    joinGame(gameId);

    onGameUpdate((update) => {
      setGameState(update);
      if (update.lastWin > 0) {
        setWinAmount(update.lastWin);
        setShowWinCelebration(true);
        playSound('win');
      }
    });

    onPlayerJoined((player) => {
      setPlayers((prevPlayers) => [...prevPlayers, player]);
    });

    onPlayerLeft((player) => {
      setPlayers((prevPlayers) => prevPlayers.filter(p => p.userId !== player.userId));
    });

    return () => {
      leaveGame(gameId);
    };
  }, [gameId]);

  const handleSpin = () => {
    setIsSpinning(true);
    sendGameAction(gameId, { type: 'spin', betAmount });
    playSound('spin');
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000);
  };

  const handleBetChange = (amount) => {
    setBetAmount(amount);
  };

  const playSound = (soundType) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${soundType}.mp3`;
      audioRef.current.play();
    }
  };

  if (!gameState) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="game-container">
      <h2 className="game-title">Slot Game: {gameState.name}</h2>
      <div className="game-content">
        <div className={`slot-machine ${isSpinning ? 'spinning' : ''}`}>
          {gameState.reels.map((reel, index) => (
            <div key={index} className="reel">
              {reel.map((symbol, symIndex) => (
                <div key={symIndex} className="symbol">{symbol}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="game-controls">
          <div className="bet-controls">
            <button onClick={() => handleBetChange(Math.max(1, betAmount - 1))}>-</button>
            <span className="bet-amount">{betAmount}</span>
            <button onClick={() => handleBetChange(betAmount + 1)}>+</button>
          </div>
          <button className="spin-button" onClick={handleSpin} disabled={isSpinning}>
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
        <div className="game-info">
          <p>Balance: ${gameState.balance}</p>
          <p>Last Win: ${gameState.lastWin}</p>
        </div>
      </div>
      <div className="players-list">
        <h3>Players</h3>
        <ul>
          {players.map((player) => (
            <li key={player.userId}>{player.name}</li>
          ))}
        </ul>
      </div>
      <Chat gameId={gameId} />
      {showWinCelebration && (
        <WinCelebration
          winAmount={winAmount}
          onClose={() => setShowWinCelebration(false)}
        />
      )}
      <audio ref={audioRef} />
    </div>
  );
};

export default Game;
