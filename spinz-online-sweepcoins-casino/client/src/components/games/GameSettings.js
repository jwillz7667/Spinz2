import React, { useState } from 'react';
import './GameSettings.css';

const GameSettings = ({ settings, updateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingChange = (setting, value) => {
    updateSettings({ ...settings, [setting]: value });
  };

  return (
    <div className="game-settings">
      <button onClick={() => setShowSettings(!showSettings)} className="settings-toggle">
        {showSettings ? 'Hide Settings' : 'Show Settings'}
      </button>
      {showSettings && (
        <div className="settings-panel">
          <h3>Game Settings</h3>
          <div className="setting">
            <label>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => handleSettingChange('sound', e.target.checked)}
              />
              Sound
            </label>
          </div>
          <div className="setting">
            <label>
              Game Speed:
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.gameSpeed}
                onChange={(e) => handleSettingChange('gameSpeed', parseFloat(e.target.value))}
              />
              {settings.gameSpeed.toFixed(1)}x
            </label>
          </div>
          <div className="setting">
            <label>
              <input
                type="checkbox"
                checked={settings.highQualityGraphics}
                onChange={(e) => handleSettingChange('highQualityGraphics', e.target.checked)}
              />
              High Quality Graphics
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSettings;
