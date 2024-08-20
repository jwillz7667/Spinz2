import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import './Wallet.css';

const Wallet = ({ auth: { user } }) => {
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const balanceRes = await axios.get('/api/wallets/balance');
        setBalance(balanceRes.data.balance);

        const transactionsRes = await axios.get('/api/wallets/transactions');
        setTransactions(transactionsRes.data);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
      }
    };

    fetchWalletData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/wallets/withdraw', {
        amount: withdrawAmount,
        method: withdrawMethod
      });
      setBalance(res.data.newBalance);
      setWithdrawAmount('');
      alert('Withdrawal request submitted successfully!');
      
      // Refresh transactions after withdrawal
      const transactionsRes = await axios.get('/api/wallets/transactions');
      setTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Error submitting withdrawal:', err);
      alert('Error submitting withdrawal. Please try again.');
    }
  };

  return (
    <div className="wallet-container">
      <h2>My Wallet</h2>
      <div className="balance-info">
        <h3>Current Balance: ${balance.toFixed(2)}</h3>
      </div>
      <div className="withdrawal-form">
        <h3>Request Withdrawal</h3>
        <form onSubmit={handleWithdraw}>
          <div className="form-group">
            <label htmlFor="withdrawAmount">Amount:</label>
            <input
              type="number"
              id="withdrawAmount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="1"
              max={balance}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="withdrawMethod">Withdrawal Method:</label>
            <select
              id="withdrawMethod"
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
            >
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>
          <button type="submit" className="withdraw-button">Request Withdrawal</button>
        </form>
      </div>
      <div className="transactions">
        <h3>Recent Transactions</h3>
        <ul>
          {transactions.map(transaction => (
            <li key={transaction.id}>
              {transaction.type}: ${transaction.amount.toFixed(2)} on {transaction.date}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

Wallet.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Wallet);
