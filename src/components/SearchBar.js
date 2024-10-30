import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

// Handles city search with autocomplete suggestions
const SearchBar = ({ onSearch, searchCities, selectedCity }) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  // Updates search input when a city is selected from recent searches
  useEffect(() => {
    if (selectedCity) {
      setSearchText(selectedCity);
    }
  }, [selectedCity]);

  // Closes suggestion dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Handles input changes and fetches city suggestions
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length >= 3) {
      setIsLoading(true);
      setShowSuggestions(true);
      
      searchTimeout.current = setTimeout(async () => {
        try {
          const cities = await searchCities(value);
          setSuggestions(cities);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  // Shows suggestions when input is focused
  const handleInputFocus = () => {
    if (searchText.length >= 3) {
      setShowSuggestions(true);
    }
  };

  // Handles city selection from suggestions
  const handleSuggestionClick = (city) => {
    const cityName = `${city.city}, ${city.countryCode}`;
    setSearchText(cityName);
    setShowSuggestions(false);
    onSearch(cityName);
  };

  // Handles form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="search-container">
      <h2>Search Location</h2>
      <form onSubmit={handleSubmit} className="search-box">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Enter city name..."
          autoComplete="off"
        />
        <button type="submit">
          <Search size={16} />
        </button>
      </form>
      
      {/* Renders suggestions dropdown with loading and empty states */}
      {showSuggestions && (
        <div ref={suggestionsRef} className="suggestions-box">
          {isLoading ? (
            <div className="suggestion-item">
              <div className="city-name">Loading...</div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((city, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(city)}
              >
                <div className="city-name">{city.city}, {city.countryCode}</div>
                <div className="population">
                  Population: {city.population.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="suggestion-item">
              <div className="city-name">No cities found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;