import React, { useEffect, useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ HistoryObjects = [], clearHistory, toggleSidebar, isVisible, username, deleteHistoryEntry }) => {
  const [sortedHistory, setSortedHistory] = useState([]);

  useEffect(() => {
    if (HistoryObjects) {
      setSortedHistory(HistoryObjects);
    }
  }, [HistoryObjects]);

  const sortByDate = () => {
    const sorted = [...sortedHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    setSortedHistory(sorted);
  };

  const sortByTarget = () => {
    const sorted = [...sortedHistory].sort((a, b) => a.target.localeCompare(b.target));
    setSortedHistory(sorted);
  };

  const sortByDestination = () => {
    const sorted = [...sortedHistory].sort((a, b) => a.destination.localeCompare(b.destination));
    setSortedHistory(sorted);
  };

  const deleteEntry = async (index) => {
    const entryToDelete = sortedHistory[index];
    deleteHistoryEntry(entryToDelete.id);
    setSortedHistory(prevHistory => prevHistory.filter((_, i) => i !== index));
  };

  return (
    <div>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isVisible ? 'Hide History' : 'Show History'}
      </button>
      <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
        <h2>Route History</h2>
        <div className="sort-buttons">
          <button onClick={sortByDate}>Sort by Date</button>
          <button onClick={sortByTarget}>Sort by Target</button>
          <button onClick={sortByDestination}>Sort by Destination</button>
        </div>
        <ul>
          {sortedHistory.map((historyObj, index) => (
            <li key={index} className="history-entry">
              {`${historyObj.history_entry}`}
              <span className="delete-button" onClick={() => deleteEntry(index)}>✖</span>
            </li>
          ))}
        </ul>
        <button onClick={clearHistory}>Clear History</button>
      </div>
    </div>
  );
};

export default Sidebar;
