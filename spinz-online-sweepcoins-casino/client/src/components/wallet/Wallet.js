import React, { useState, useEffect } from 'react';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // TODO: Fetch wallet balance and transactions from API
    // This is a placeholder
    setBalance(1000);
    setTransactions([
      { id: 1, type: 'deposit', amount: 500, date: '2023-05-01' },
      { id: 2, type: 'withdrawal', amount: -200, date: '2023-05-02' },
      { id: 3, type: 'game_win', amount: 100, date: '2023-05-03' },
    ]);
  }, []);

  return (
    <div className="wallet">
      <h2>My Wallet</h2>
      <div className="balance">
        <h3>Balance: ${balance.toFixed(2)}</h3>
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

export default Wallet;
