import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import io from 'socket.io-client';

const AdminDashboard = ({ auth: { user } }) => {
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [gameAnalytics, setGameAnalytics] = useState(null);
  const [topGames, setTopGames] = useState([]);
  const [realTimeReports, setRealTimeReports] = useState(null);

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

        const playerBehaviorRes = await axios.get('/api/analytics/player-behavior', {
          params: { startDate, endDate }
        });
        setPlayerBehavior(playerBehaviorRes.data);

        const financialAnalysisRes = await axios.get('/api/analytics/financial', {
          params: { startDate, endDate }
        });
        setFinancialAnalysis(financialAnalysisRes.data);

        const realTimeReportsRes = await axios.get('/api/admin/real-time-reports');
        setRealTimeReports(realTimeReportsRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };

    fetchData();

    // Set up WebSocket connection for real-time updates
    const socket = io('/admin');

    socket.on('gameDataUpdate', (data) => {
      setRealTimeReports(prevReports => ({
        ...prevReports,
        gamePerformance: prevReports.gamePerformance.map(game => 
          game.gameName === data.game ? { ...game, ...data.stats } : game
        )
      }));
    });

    socket.on('playerDataUpdate', (data) => {
      setRealTimeReports(prevReports => ({
        ...prevReports,
        userActivity: {
          ...prevReports.userActivity,
          activeUsers: new Set([...prevReports.userActivity.activeUsers, data.player]).size
        }
      }));
    });

    socket.on('financialDataUpdate', (data) => {
      setRealTimeReports(prevReports => ({
        ...prevReports,
        financialTransactions: prevReports.financialTransactions.map(transaction => 
          transaction._id === data.type ? { ...transaction, ...data.stats } : transaction
        )
      }));
    });

    return () => {
      socket.disconnect();
    };
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

  const renderRealTimeReports = () => {
    if (!realTimeReports) return null;

    const { gamePerformance, userActivity, financialTransactions } = realTimeReports;

    return (
      <div className="real-time-reports">
        <h3>Real-Time Reports (Last Hour)</h3>
        <div className="game-performance">
          <h4>Game Performance</h4>
          <Bar
            data={{
              labels: gamePerformance.map(game => game.gameName),
              datasets: [
                {
                  label: 'Total Spins',
                  data: gamePerformance.map(game => game.totalSpins),
                  backgroundColor: 'rgba(75,192,192,0.4)',
                },
                {
                  label: 'RTP (%)',
                  data: gamePerformance.map(game => game.rtp),
                  backgroundColor: 'rgba(255,99,132,0.4)',
                }
              ]
            }}
            options={{
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
        <div className="user-activity">
          <h4>User Activity</h4>
          <p>Active Users: {userActivity.activeUsers}</p>
          <p>New Registrations: {userActivity.newRegistrations}</p>
        </div>
        <div className="financial-transactions">
          <h4>Financial Transactions</h4>
          <ul>
            {financialTransactions.map((transaction, index) => (
              <li key={index}>
                {transaction._id}: ${transaction.totalAmount.toFixed(2)} ({transaction.count} transactions)
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderPlayerBehaviorChart = () => {
    if (!playerBehavior) return null;

    const data = {
      labels: playerBehavior.map(player => player.playerName),
      datasets: [
        {
          label: 'Total Games Played',
          data: playerBehavior.map(player => player.totalGamesPlayed),
          backgroundColor: 'rgba(75,192,192,0.4)',
        },
        {
          label: 'Net Profit',
          data: playerBehavior.map(player => player.netProfit),
          backgroundColor: 'rgba(255,99,132,0.4)',
        }
      ]
    };

    return (
      <div className="player-behavior-chart">
        <h3>Player Behavior Analysis</h3>
        <Bar data={data} options={{ maintainAspectRatio: false }} />
      </div>
    );
  };

  const renderFinancialAnalysisChart = () => {
    if (!financialAnalysis) return null;

    const data = {
      labels: financialAnalysis.map(item => item._id),
      datasets: [{
        data: financialAnalysis.map(item => item.totalAmount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }]
    };

    return (
      <div className="financial-analysis-chart">
        <h3>Financial Analysis</h3>
        <Pie data={data} options={{ maintainAspectRatio: false }} />
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
      {renderPlayerBehaviorChart()}
      {renderFinancialAnalysisChart()}
      {renderRealTimeReports()}
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
