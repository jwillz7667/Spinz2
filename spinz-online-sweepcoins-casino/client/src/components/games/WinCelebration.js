import React, { useEffect } from 'react';
import './WinCelebration.css';

const WinCelebration = ({ winAmount, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="win-celebration">
      <div className="celebration-content">
        <h2>Congratulations!</h2>
        <p>You won ${winAmount}!</p>
        <div className="fireworks"></div>
      </div>
    </div>
  );
};

export default WinCelebration;
