import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { joinGame, leaveGame, sendGameAction, onGameUpdate, onPlayerJoined, onPlayerLeft } from '../../utils/socket';
import Chat from '../chat/Chat';

const Game = () => {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);

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

  const handleGameAction = (action) => {
    sendGameAction(gameId, action);
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="game-container">
      <h2>Game {gameId}</h2>
      <div className="game-content">
        {/* Render game state and UI here */}
        <button onClick={() => handleGameAction('someAction')}>Perform Action</button>
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
