import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './Games.css';

const Games = ({ auth: { user } }) => {
  const [games, setGames] = useState({
    classicSlots: [],
    videoSlots: [],
    progressiveJackpots: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/games/slots');
        setGames(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching games:', err);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const renderGameList = (gameType, title) => (
    <div className="game-section">
      <h2>{title}</h2>
      <div className="game-grid">
        {games[gameType].map(game => (
          <div key={game.id} className="game-card">
            <img src={game.thumbnail} alt={game.name} loading="lazy" />
            <h3>{game.name}</h3>
            <button onClick={() => openLaunchModal(game)} className="play-button">Play Now</button>
          </div>
        ))}
      </div>
    </div>
  );

  const openLaunchModal = (game) => {
    setSelectedGame(game);
    setShowLaunchModal(true);
  };

  const closeLaunchModal = () => {
    setSelectedGame(null);
    setShowLaunchModal(false);
  };

  const launchGame = async () => {
    try {
      const res = await axios.post('/api/games/slots/launch', { gameId: selectedGame.id });
      window.open(res.data.gameUrl, '_blank');
      closeLaunchModal();
    } catch (err) {
      console.error('Error launching game:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading games...</div>;
  }

  return (
    <div className="games-container">
      <h1>Slot Games</h1>
      <Link to="/user-journey" className="journey-link">View User Journey</Link>
      {renderGameList('classicSlots', 'Classic Slots')}
      {renderGameList('videoSlots', 'Video Slots')}
      {renderGameList('progressiveJackpots', 'Progressive Jackpots')}

      {showLaunchModal && selectedGame && (
        <div className="launch-modal">
          <div className="launch-modal-content">
            <h2>{selectedGame.name}</h2>
            <img src={selectedGame.thumbnail} alt={selectedGame.name} />
            <p>RTP: {selectedGame.rtp}%</p>
            <p>Volatility: {selectedGame.volatility}</p>
            <p>Min Bet: ${selectedGame.minBet}</p>
            <p>Max Bet: ${selectedGame.maxBet}</p>
            <button onClick={launchGame} className="launch-button">Launch Game</button>
            <button onClick={closeLaunchModal} className="close-button">Close</button>
          </div>
        </div>
      )}
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
