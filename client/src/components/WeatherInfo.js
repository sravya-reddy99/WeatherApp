// WeatherInfo.js
import React, { useEffect, useMemo } from "react";
import WeatherCharts from "./WeatherCharts";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeOutdoorScore({ popMax6h, windAvg6h, feelsAvg6h, tempAvg6h }) {
  let score = 10;

  // rain penalty
  if (popMax6h >= 70) score -= 4;
  else if (popMax6h >= 40) score -= 2;
  else if (popMax6h >= 20) score -= 1;

  // wind penalty
  if (windAvg6h >= 35) score -= 3;
  else if (windAvg6h >= 25) score -= 2;
  else if (windAvg6h >= 18) score -= 1;

  // cold penalty (feels-like)
  if (feelsAvg6h <= -15) score -= 4;
  else if (feelsAvg6h <= -8) score -= 3;
  else if (feelsAvg6h <= -2) score -= 2;
  else if (feelsAvg6h <= 2) score -= 1;

  // very hot penalty
  if (tempAvg6h >= 35) score -= 3;
  else if (tempAvg6h >= 30) score -= 2;

  return clamp(score, 0, 10);
}

function formatMain(main) {
  if (!main) return "—";
  return main.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Format a forecast timestamp (UTC seconds) in the CITY's local time.
 * OpenWeather provides city timezone offset in seconds: data.city.timezone
 */
function formatCityTime(dtSeconds, cityTzOffsetSeconds) {
  const utcMs = dtSeconds * 1000;
  const cityMs = utcMs + (cityTzOffsetSeconds ?? 0) * 1000;

  // IMPORTANT: use timeZone:"UTC" so the formatted output doesn't get re-shifted
  // into the user's browser timezone (we already applied the city offset).
  return new Date(cityMs).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

const WeatherInfo = ({ data, overlayRef }) => {
  useEffect(() => {
    if (!data || !data.list || data.list.length === 0) return;

    const firstDay = data.list[0];
    const weatherId = firstDay.weather?.[0]?.id;
    const icon = firstDay.weather?.[0]?.icon || "";
    const isNight = icon.includes("n");
    const backgroundOverlay = overlayRef?.current;

    if (!backgroundOverlay || !weatherId) return;

    backgroundOverlay.className = "background-overlay";

    if (isNight) {
      backgroundOverlay.classList.add("background-night");
    } else if (weatherId >= 200 && weatherId < 300) {
      backgroundOverlay.classList.add("background-thunderstorm");
    } else if (weatherId >= 300 && weatherId < 600) {
      backgroundOverlay.classList.add("background-rain");
    } else if (weatherId >= 600 && weatherId < 700) {
      backgroundOverlay.classList.add("background-snow");
    } else if (weatherId >= 801 && weatherId <= 804) {
      backgroundOverlay.classList.add("background-clouds");
    } else {
      backgroundOverlay.classList.add("background-clear");
    }
  }, [data, overlayRef]);

  // Always call hooks (no conditional hook call)
  const insights = useMemo(() => {
    if (!data || !data.list || data.list.length === 0) {
      return { outdoorScoreText: "—", nextChangeText: "—", nextChangeSubText: "—" };
    }

    const list = data.list;
    const cityTz = data.city?.timezone ?? 0;

    // next ~6 hours (2 x 3h)
    const next6 = list.slice(0, 2);
    const popMax6h = Math.max(
      ...next6.map((x) => (typeof x.pop === "number" ? x.pop * 100 : 0))
    );

    const tempAvg6h =
      next6.reduce((sum, x) => sum + (x.main?.temp ?? 0), 0) /
      Math.max(1, next6.length);

    const feelsAvg6h =
      next6.reduce((sum, x) => sum + (x.main?.feels_like ?? 0), 0) /
      Math.max(1, next6.length);

    const windAvg6h =
      next6.reduce((sum, x) => sum + ((x.wind?.speed ?? 0) * 3.6), 0) /
      Math.max(1, next6.length);

    const outdoorScore = computeOutdoorScore({
      popMax6h,
      windAvg6h,
      feelsAvg6h,
      tempAvg6h,
    });

    const outdoorScoreText = `${outdoorScore}/10`;

    // Next change in weather "main"
    const currentMain = list[0]?.weather?.[0]?.main || "";
    let nextChangeText = "—";
    let nextChangeSubText = "—";

    for (let i = 1; i < Math.min(list.length, 16); i++) {
      const m = list[i]?.weather?.[0]?.main || "";
      if (m && m !== currentMain) {
        const t = formatCityTime(list[i].dt, cityTz);
        nextChangeText = `${t}`;
        nextChangeSubText = `(${formatMain(currentMain)} → ${formatMain(m)})`;
        break;
      }
    }

    return { outdoorScoreText, nextChangeText, nextChangeSubText };
  }, [data]);

  if (!data || !data.list || !data.city) {
    return (
      <div className="landing-message">
        <h2>Welcome to the ForecastIQ</h2>
        <p>
          Enter a city name or use your current location to view the latest weather updates.
        </p>
      </div>
    );
  }

  const firstDay = data.list[0];
  const cityName = data.city.name;
  const country = data.city.country;
  const cityTz = data.city?.timezone ?? 0;

  const windKmh = Math.round((firstDay.wind?.speed ?? 0) * 3.6); // m/s -> km/h
  const visibilityKm =
    typeof firstDay.visibility === "number"
      ? `${(firstDay.visibility / 1000).toFixed(1)} km`
      : "—";

  const popPct =
    typeof firstDay.pop === "number" ? `${Math.round(firstDay.pop * 100)}%` : "—";

  return (
    <>
      <div className="weather-grid">
        <div className="main-weather weather-card">
          <h2>
            {cityName}, {country}
          </h2>
          <img
            src={`https://openweathermap.org/img/wn/${firstDay.weather[0].icon}@4x.png`}
            alt={firstDay.weather[0].description}
          />
          <div className="temperature">{Math.round(firstDay.main.temp)}°C</div>
          <div className="description">{firstDay.weather[0].description}</div>
          <div className="feels-like">
            Feels like {Math.round(firstDay.main.feels_like)}°C
          </div>
        </div>

        <div className="metrics-grid">
          {[
            { icon: "water", label: "Humidity", value: `${firstDay.main.humidity}%` },
            { icon: "wind", label: "Wind Speed", value: `${windKmh} km/h` },
            { icon: "compress-arrows-alt", label: "Pressure", value: `${firstDay.main.pressure} hPa` },
            { icon: "eye", label: "Visibility", value: visibilityKm },
            { icon: "cloud", label: "Cloud Cover", value: `${firstDay.clouds.all}%` },
            { icon: "tint", label: "Chance of Rain", value: popPct },
            { icon: "sun", label: "Outdoor Score", value: insights.outdoorScoreText },
            { icon: "clock", label: "Next Change", value: insights.nextChangeText, subText: insights.nextChangeSubText},
          ].map((metric, index) => (
            <div key={index} className="metric-card">
              <i className={`fas fa-${metric.icon} metric-icon`}></i>
              <div className="metric-value">{metric.value}</div>
              {metric.subText && <div className="metric-label">{metric.subText}</div>}
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      <WeatherCharts data={data} />

      <div className="forecast-section">
        <div className="forecast-header">
          <h2>Hourly Forecast</h2>
        </div>
        <div className="hourly-forecast">
          {data.list.slice(0, 8).map((item, index) => {
            const time = formatCityTime(item.dt, cityTz);
            const windHourKmh = Math.round((item.wind?.speed ?? 0) * 3.6);

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
                    <i className="fas fa-wind ml-2"></i> {windHourKmh} km/h
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
