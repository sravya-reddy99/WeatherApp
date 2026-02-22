import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import SearchBar from "./SearchBar";
import WeatherInfo from "./WeatherInfo";
import RecentSearches from "./RecentSearches";
import { getCachedData, setCachedData, clearOldCache } from "../utils/cache";
import {
  searchCities,
  getWeatherData,
  getForecastByCoordinates,
  getOneCallByCoordinates
} from "../utils/api";

import WeatherAgent from "./WeatherAgent";
import WeatherActions from "./WeatherActions";

import ProactiveIntelligence from "./ProactiveIntelligence";
import CalendarFusion from "./CalendarFusion";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const WeatherApp = () => {
  const query = useQuery();

  const [weatherData, setWeatherData] = useState(null); // forecast shape
  const [oneCall, setOneCall] = useState(null); // optional UV
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });

  const agentRef = useRef(null);
  const overlayRef = useRef(null);

  const addToRecentSearches = (cityName) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((city) => city !== cityName);
      const updated = [cityName, ...filtered].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

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
    } catch (e) {
      setError("City not found. Please try again.");
      setWeatherData(null);
      setOneCall(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastByLatLon = async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      const forecast = await getForecastByCoordinates(lat, lon);
      setWeatherData(forecast);
      setSelectedCity(forecast.city?.name || "");

      try {
        const oc = await getOneCallByCoordinates(lat, lon);
        setOneCall(oc);
      } catch {
        setOneCall(null);
      }
    } catch {
      setError("Could not fetch weather data for that location.");
      setWeatherData(null);
      setOneCall(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchForecastByLatLon(latitude, longitude);
      },
      () => {
        setError("Location access denied. Please enable location access.");
        setLoading(false);
      }
    );
  };

  const handleActionPrompt = (promptText) => {
    if (!promptText) return;
    if (agentRef.current && agentRef.current.sendPrompt) {
      agentRef.current.sendPrompt(promptText);
    }
  };

  useEffect(() => {
    const lat = query.get("lat");
    const lon = query.get("lon");

    if (lat && lon && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
      fetchForecastByLatLon(Number(lat), Number(lon));
      return;
    }

    fetchWeatherByLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(clearOldCache, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="background-overlay" ref={overlayRef} />
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
              <h2>Welcome to ForecastIQ</h2>
              <p>Fetching weather data...</p>
            </div>
          ) : error ? (
            <div className="not-found fadeIn">
              <img src="https://openweathermap.org/img/wn/11d@4x.png" alt="error" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="main-layout">
              {/* LEFT SIDE */}
              <div>{weatherData && <WeatherInfo data={weatherData} overlayRef={overlayRef} />}</div>

              {/* RIGHT SIDE */}
              <div className="right-rail">
                <div className="rail-card insights-card">
                  <ProactiveIntelligence
                    forecastData={weatherData}
                    oneCallData={oneCall}
                    demoMode={true}
                  />
                </div>

                <div className="rail-card insights-card">
                  <CalendarFusion forecastData={weatherData} />
                </div>

                <div className="rail-card ai-card">
                  <WeatherAgent ref={agentRef} weatherData={weatherData} selectedCity={selectedCity} />
                </div>

                <div className="rail-card actions-card">
                  <WeatherActions onAction={handleActionPrompt} />
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