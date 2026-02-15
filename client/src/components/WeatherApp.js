import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';
import WeatherInfo from './WeatherInfo';
import RecentSearches from './RecentSearches';
import { getCachedData, setCachedData, clearOldCache } from '../utils/cache';
import { searchCities, getWeatherData, getWeatherByCoordinates } from '../utils/api';

import WeatherAgent from './WeatherAgent';
import WeatherActions from './WeatherActions';
import WeatherInsights from './WeatherInsights';

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  // This allows Actions to trigger a message inside WeatherAgent
  const agentRef = useRef(null);

  const handleWeatherSearch = async (city) => {
    setLoading(true);
    try {
      setSelectedCity(city);

      const cachedWeather = getCachedData(`weather_${city}`);
      if (cachedWeather) {
        setWeatherData(cachedWeather);
        addToRecentSearches(city);
        setError(null);
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
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const data = await getWeatherByCoordinates(latitude, longitude);

            // sets city + weather quickly
            setWeatherData(data);
            setSelectedCity(data.name);

            // triggers forecast fetch (your existing logic)
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

  // Actions -> Agent
  const handleActionPrompt = (promptText) => {
    if (!promptText) return;

    // If agentRef exists, call the exposed method
    if (agentRef.current && agentRef.current.sendPrompt) {
      agentRef.current.sendPrompt(promptText);
    }
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
        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>ForecastIQ</h1>
            <div className="subtitle">Live Weather Updates</div>
          </div>

          <SearchBar
            onSearch={handleWeatherSearch}
            searchCities={searchCities}
            selectedCity={selectedCity}
            currentLocation={fetchWeatherByLocation}
          />

          <RecentSearches
            searches={recentSearches}
            onSearchSelect={handleWeatherSearch}
            onClearHistory={clearRecentSearches}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {loading ? (
            <div className="landing-message fadeIn">
              <h2>Welcome to the ForecastIQ</h2>
              <p>Fetching weather data for your location...</p>
            </div>
          ) : error ? (
            <div className="not-found fadeIn">
              <img src="https://openweathermap.org/img/wn/11d@4x.png" alt="error" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="main-layout">
              {/* LEFT SIDE: WEATHER + CHARTS + HOURLY */}
              <div>
                {weatherData && <WeatherInfo data={weatherData} />}
              </div>

              {/* RIGHT SIDE: UTILITY RAIL */}
              <div className="right-rail">
                {/* 1) AI */}
                <div className="rail-card ai-card">
                  <WeatherAgent
                    ref={agentRef}
                    weatherData={weatherData}
                    selectedCity={selectedCity}
                  />
                </div>

                {/* 2) Actions */}
                <div className="rail-card actions-card">
                  <WeatherActions onAction={handleActionPrompt} />
                </div>

                {/* 3) Insights */}
                <div className="rail-card insights-card">
                  <WeatherInsights weatherData={weatherData} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
