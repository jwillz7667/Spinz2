import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const Games = ({ auth: { user } }) => {
  const [games, setGames] = useState({
    classicSlots: [],
    videoSlots: [],
    progressiveJackpots: []
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axios.get('/api/games/slots');
        setGames(res.data);
      } catch (err) {
        console.error('Error fetching games:', err);
      }
    };

    fetchGames();
  }, []);

  const renderGameList = (gameType, title) => (
    <div>
      <h2>{title}</h2>
      <div className="game-grid">
        {games[gameType].map(game => (
          <div key={game.id} className="game-card">
            <img src={game.thumbnail} alt={game.name} />
            <h3>{game.name}</h3>
            <button onClick={() => launchGame(game.id)}>Play Now</button>
          </div>
        ))}
      </div>
    </div>
  );

  const launchGame = async (gameId) => {
    try {
      const res = await axios.post('/api/games/slots/launch', { gameId });
      // Handle game launch, e.g., open in a new window or modal
      window.open(res.data.gameUrl, '_blank');
    } catch (err) {
      console.error('Error launching game:', err);
    }
  };

  return (
    <div className="games-container">
      <h1>Slot Games</h1>
      {renderGameList('classicSlots', 'Classic Slots')}
      {renderGameList('videoSlots', 'Video Slots')}
      {renderGameList('progressiveJackpots', 'Progressive Jackpots')}
    </div>
  );
};

Games.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Games);
