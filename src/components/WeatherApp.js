import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import WeatherInfo from './WeatherInfo';
import RecentSearches from './RecentSearches';
import { getCachedData, setCachedData, clearOldCache } from '../utils/cache';
import { searchCities, getWeatherData, getWeatherByCoordinates } from '../utils/api';

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [selectedCity, setSelectedCity] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const handleWeatherSearch = async (city) => {
    setLoading(true); // Set loading to true when a new search is initiated
    try {
      setSelectedCity(city);
      const cachedWeather = getCachedData(`weather_${city}`);
      if (cachedWeather) {
        setWeatherData(cachedWeather);
        addToRecentSearches(city);
        setLoading(false);
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
    } finally {
      setLoading(false); // Ensure loading is set to false after fetching
    }
  };

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const data = await getWeatherByCoordinates(latitude, longitude);
            setWeatherData(data);
            setSelectedCity(data.name);
            handleWeatherSearch(data.name);
            setError(null);
          } catch (err) {
            setError('Could not fetch weather data for your location.');
            setWeatherData(null);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError('Location access denied. Please enable location access.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  };

  const addToRecentSearches = (cityName) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((city) => city !== cityName);
      const updated = [cityName, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  useEffect(() => {
    fetchWeatherByLocation();
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
            currentLocation={fetchWeatherByLocation} // Use current location
          />
          
          <RecentSearches
            searches={recentSearches}
            onSearchSelect={handleWeatherSearch}
            onClearHistory={clearRecentSearches}
          />
        </div>

        <div className="main-content">
          {loading ? (
            <div className="landing-message fadeIn">
              <h2>Welcome to the Weather App</h2>
              <p>Fetching weather data for your location...</p>
            </div>
          ) : error ? (
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
