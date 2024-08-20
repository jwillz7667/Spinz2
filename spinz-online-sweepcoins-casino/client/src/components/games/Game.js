import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { joinGame, leaveGame, sendGameAction, onGameUpdate, onPlayerJoined, onPlayerLeft } from '../../utils/socket';
import Chat from '../chat/Chat';
import './Game.css';

const Game = () => {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [betAmount, setBetAmount] = useState(1);

  useEffect(() => {
    joinGame(gameId);

    onGameUpdate((update) => {
      setGameState(update);
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
    sendGameAction(gameId, { type: 'spin', betAmount });
  };

  const handleBetChange = (amount) => {
    setBetAmount(amount);
  };

  if (!gameState) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="game-container">
      <h2 className="game-title">Slot Game: {gameState.name}</h2>
      <div className="game-content">
        <div className="slot-machine">
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
          <button className="spin-button" onClick={handleSpin}>SPIN</button>
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
    </div>
  );
};

export default Game;
