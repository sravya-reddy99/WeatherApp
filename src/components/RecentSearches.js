import React from 'react';

// Displays a list of recent searches and provides ability to clear history
const RecentSearches = ({ searches, onSearchSelect, onClearHistory }) => {
  return (
    <div className="recent-searches">
      <div className="recent-header">
        <h2>Recent Searches</h2>
        <button onClick={onClearHistory} className="clear-history-btn">
          Clear History
        </button>
      </div>
      
      {/* Renders list of previous searches as clickable items */}
      <div className="recent-list">
        {searches.map((city, index) => (
          <div
            key={index}
            className="recent-item"
            onClick={() => onSearchSelect(city)}
          >
            <i className="fas fa-history"></i>
            {city}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;