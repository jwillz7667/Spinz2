import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

const AdminDashboard = ({ auth: { user } }) => {
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [gameAnalytics, setGameAnalytics] = useState(null);
  const [topGames, setTopGames] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get('/api/admin/users');
        setUsers(usersRes.data);

        const activityRes = await axios.get('/api/admin/activity');
        setActivityLogs(activityRes.data);

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const analyticsRes = await axios.get(`/api/games/analytics/${gameId}`, {
          params: { startDate, endDate }
        });
        setGameAnalytics(analyticsRes.data);

        const topGamesRes = await axios.get('/api/games/analytics/top-performing', {
          params: { startDate, endDate }
        });
        setTopGames(topGamesRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      // Refresh users after role change
      const usersRes = await axios.get('/api/admin/users');
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error changing user role:', err);
    }
  };

  const renderAnalyticsChart = () => {
    if (!gameAnalytics) return null;

    const data = {
      labels: ['RTP', 'Bonus Utilization', 'Retention Rate'],
      datasets: [{
        label: 'Game Metrics',
        data: [gameAnalytics.rtp, gameAnalytics.bonusUtilizationRate, gameAnalytics.retentionRate],
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      }]
    };

    return (
      <div className="analytics-chart">
        <h3>Game Analytics</h3>
        <Line data={data} />
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="user-management">
        <h3>User Management</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.roles[0].name}</td>
                <td>
                  <select
                    value={user.roles[0].name}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  >
                    <option value="Regular Player">Regular Player</option>
                    <option value="VIP">VIP</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderAnalyticsChart()}
      <div className="top-games">
        <h3>Top Performing Games</h3>
        <ul>
          {topGames.map((game, index) => (
            <li key={index}>
              {game.gameName} - RTP: {game.rtp.toFixed(2)}%, Total Spins: {game.totalSpins}
            </li>
          ))}
        </ul>
      </div>
      <div className="activity-monitoring">
        <h3>Recent Activity</h3>
        <ul>
          {activityLogs.map((log, index) => (
            <li key={index}>
              {log.action} by {log.user} at {new Date(log.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

AdminDashboard.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(AdminDashboard);
