import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { onGameUpdate, onJackpotChange, onPromotionChange } from '../../utils/socket';
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
  const [jackpots, setJackpots] = useState({});
  const [promotions, setPromotions] = useState([]);

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

    // Set up real-time listeners
    onGameUpdate(handleGameUpdate);
    onJackpotChange(handleJackpotChange);
    onPromotionChange(handlePromotionChange);

    // Clean up listeners on component unmount
    return () => {
      // Clean up listeners here if needed
    };
  }, []);

  const handleGameUpdate = (data) => {
    // Update the specific game in the state
    setGames(prevGames => {
      const updatedGames = { ...prevGames };
      for (const category in updatedGames) {
        const index = updatedGames[category].findIndex(game => game.id === data.gameId);
        if (index !== -1) {
          updatedGames[category][index] = { ...updatedGames[category][index], ...data };
          break;
        }
      }
      return updatedGames;
    });
  };

  const handleJackpotChange = (data) => {
    setJackpots(prevJackpots => ({ ...prevJackpots, [data.gameId]: data.amount }));
  };

  const handlePromotionChange = (data) => {
    setPromotions(data);
  };

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
      
      {promotions.length > 0 && (
        <div className="promotions-banner">
          {promotions.map((promo, index) => (
            <div key={index} className="promotion">{promo.message}</div>
          ))}
        </div>
      )}
      
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
            {jackpots[selectedGame.id] && (
              <p className="jackpot">Current Jackpot: ${jackpots[selectedGame.id].toLocaleString()}</p>
            )}
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
