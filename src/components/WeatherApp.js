import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import WeatherInfo from './WeatherInfo';
import RecentSearches from './RecentSearches';
import { getCachedData, setCachedData, clearOldCache } from '../utils/cache';
import { searchCities, getWeatherData } from '../utils/api';

// Main weather application component that manages weather data, search history, and errors
const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  // Initialize recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetches weather data for a city, using cache when available
  const handleWeatherSearch = async (city) => {
    try {
      setSelectedCity(city);
      const cachedWeather = getCachedData(`weather_${city}`);
      if (cachedWeather) {
        setWeatherData(cachedWeather);
        addToRecentSearches(city);
        return;
      }

      const data = await getWeatherData(city);
      setCachedData(`weather_${city}`, data);
      setWeatherData(data);
      addToRecentSearches(city);
      setError(null);
    } catch (error) {
      setError("City not found. Please try again.");
      setWeatherData(null);
    }
  };

  // Adds a city to recent searches and updates localStorage
  const addToRecentSearches = (cityName) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(city => city !== cityName);
      const updated = [cityName, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  // Clears recent searches from state and localStorage
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Sets up interval to clear old cached data
  useEffect(() => {
    const interval = setInterval(clearOldCache, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <div className="background-overlay" />
      <div className="dashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>Weather App</h1>
            <div className="subtitle">Live Weather Updates</div>
          </div>
          
          <SearchBar 
            onSearch={handleWeatherSearch}
            searchCities={searchCities}
            selectedCity={selectedCity}
          />
          
          <RecentSearches
            searches={recentSearches}
            onSearchSelect={handleWeatherSearch}
            onClearHistory={clearRecentSearches}
          />
        </div>

        <div className="main-content">
          {error ? (
            <div className="not-found fadeIn">
              <img src="https://openweathermap.org/img/wn/11d@4x.png" alt="error" />
              <p>{error}</p>
            </div>
          ) : (
            weatherData && <WeatherInfo data={weatherData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;