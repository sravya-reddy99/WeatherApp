import React, { useEffect } from 'react';

// Displays detailed weather information including current conditions and hourly forecast
const WeatherInfo = ({ data }) => {
  const firstDay = data.list[0];
  const cityName = data.city.name;
  const country = data.city.country;

  // Updates background based on weather conditions and time of day
  useEffect(() => {
    const weatherId = firstDay.weather[0].id;
    const icon = firstDay.weather[0].icon;
    const isNight = icon.includes('n');
    const backgroundOverlay = document.querySelector('.background-overlay');
    
    backgroundOverlay.className = 'background-overlay';
    if (isNight) {
      backgroundOverlay.classList.add('background-night');
    } else if (weatherId >= 200 && weatherId < 300) {
      backgroundOverlay.classList.add('background-thunderstorm');
    } else if (weatherId >= 300 && weatherId < 600) {
      backgroundOverlay.classList.add('background-rain');
    } else if (weatherId >= 600 && weatherId < 700) {
      backgroundOverlay.classList.add('background-snow');
    } else if (weatherId >= 801 && weatherId <= 804) {
      backgroundOverlay.classList.add('background-clouds');
    } else {
      backgroundOverlay.classList.add('background-clear');
    }
  }, [firstDay]);

  return (
    <>
      {/* Main weather card showing current conditions */}
      <div className="weather-grid">
        <div className="main-weather weather-card">
          <h2>{cityName}, {country}</h2>
          <img 
            src={`https://openweathermap.org/img/wn/${firstDay.weather[0].icon}@4x.png`}
            alt={firstDay.weather[0].description}
          />
          <div className="temperature">{Math.round(firstDay.main.temp)}°C</div>
          <div className="description">{firstDay.weather[0].description}</div>
          <div className="feels-like">Feels like {Math.round(firstDay.main.feels_like)}°C</div>
        </div>

        {/* Grid of weather metrics */}
        <div className="metrics-grid">
          {[
            { icon: 'water', label: 'Humidity', value: `${firstDay.main.humidity}%` },
            { icon: 'wind', label: 'Wind Speed', value: `${Math.round(firstDay.wind.speed)} km/h` },
            { icon: 'compress-arrows-alt', label: 'Pressure', value: `${firstDay.main.pressure} hPa` },
            { icon: 'eye', label: 'Visibility', value: `${(firstDay.visibility / 1000).toFixed(1)} km` },
            { icon: 'cloud', label: 'Cloud Cover', value: `${firstDay.clouds.all}%` },
            { icon: 'tint', label: 'Chance of Rain', value: `${(firstDay.pop * 100).toFixed(0)}%` }
          ].map((metric, index) => (
            <div key={index} className="metric-card">
              <i className={`fas fa-${metric.icon} metric-icon`}></i>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly forecast section */}
      <div className="forecast-section">
        <div className="forecast-header">
          <h2>Hourly Forecast</h2>
        </div>
        <div className="hourly-forecast">
          {data.list.slice(0, 8).map((item, index) => {
            const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true
            });
            return (
              <div key={index} className="forecast-card">
                <div className="forecast-time">{time}</div>
                <img 
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                  alt={item.weather[0].description}
                />
                <div className="forecast-temp">{Math.round(item.main.temp)}°C</div>
                <div className="forecast-desc">{item.weather[0].description}</div>
                <div className="forecast-details">
                  <small>
                    <i className="fas fa-tint"></i> {item.main.humidity}%
                    <i className="fas fa-wind ml-2"></i> {Math.round(item.wind.speed)} km/h
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default WeatherInfo;