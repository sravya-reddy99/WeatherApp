import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, searchCities, selectedCity, currentLocation }) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (selectedCity) {
      setSearchText(selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
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

  const handleInputFocus = () => {
    if (searchText.length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (city) => {
    const cityName = `${city.city}, ${city.countryCode}`;
    setSearchText(cityName);
    setShowSuggestions(false);
    onSearch(cityName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText);
      setShowSuggestions(false);
    }
  };

  return (
      <>
      <div className="button-container"><button className="currentLocation" onClick={currentLocation}>
        Use Current Location
      </button>
      </div>
      <div className="button-container" style={{'height': '1%'}}><h2>OR</h2></div>
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
      
      {showSuggestions && (
        <div ref={suggestionsRef} className="suggestions-box">
          {isLoading ? (
            <div className="suggestion-item">Loading...</div>
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
            <div className="suggestion-item">No cities found</div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default SearchBar;
