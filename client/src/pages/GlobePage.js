import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Globe from "react-globe.gl";

export default function GlobePage() {
  const globeRef = useRef(null);
  const navigate = useNavigate();

  const [countries, setCountries] = useState({ features: [] });
  const [hover, setHover] = useState(null);

  const cities = useMemo(
    () => [
      { city: "Toronto", lat: 43.6532, lng: -79.3832 },
      { city: "New York", lat: 40.7128, lng: -74.006 },
      { city: "London", lat: 51.5072, lng: -0.1276 },
      { city: "Hyderabad", lat: 17.385, lng: 78.4867 },
      { city: "Tokyo", lat: 35.6762, lng: 139.6503 }
    ],
    []
  );

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => res.json())
      .then(setCountries)
      .catch(() => setCountries({ features: [] }));
  }, []);

  const goToWeather = (lat, lon) => {
    if (typeof lat !== "number" || typeof lon !== "number") return;
    navigate(`/weather?lat=${lat}&lon=${lon}`);
  };

  const goToWeatherFromEvent = (event) => {
    const coords = globeRef.current?.toGlobeCoords?.(event.clientX, event.clientY);
    if (coords) goToWeather(coords.lat, coords.lng);
  };

  return (
    <div className="globe-page">
      <div className="globe-topbar">
        <div className="globe-title">
          <div className="globe-h1">ForecastIQ Globe</div>
          <div className="globe-subtitle">Click a country/city or anywhere to open dashboard</div>
        </div>

        <button className="globe-btn" onClick={() => navigate("/weather")}>
          Go to Dashboard
        </button>
      </div>

      <div className="globe-wrap">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#4aa3ff"
          atmosphereAltitude={0.25}

          polygonsData={countries.features}
          polygonAltitude={0.01}
          polygonCapColor={() => "rgba(255,255,255,0.04)"}
          polygonSideColor={() => "rgba(0,0,0,0.18)"}
          polygonStrokeColor={() => "rgba(74,163,255,0.9)"}
          polygonLabel={({ properties }) => `<b>${properties?.ADMIN ?? ""}</b>`}

          onPolygonHover={(p) => setHover(p?.properties?.ADMIN ?? null)}
          onPolygonClick={(poly, event, coords) => {
            if (coords?.lat != null && coords?.lng != null) {
              goToWeather(coords.lat, coords.lng);
            } else {
              goToWeatherFromEvent(event);
            }
          }}

          pointsData={cities}
          pointLat={(d) => d.lat}
          pointLng={(d) => d.lng}
          pointAltitude={0.02}
          pointRadius={0.3}
          pointLabel={(d) => `<b>${d.city}</b>`}
          pointColor={() => "#ff6b6b"}
          onPointClick={(d) => goToWeather(d.lat, d.lng)}

          onGlobeClick={({ lat, lng }) => goToWeather(lat, lng)}
        />
      </div>

      {hover && <div className="globe-hover">{hover}</div>}
      <div className="globe-hint">Tip: click on a country or anywhere (even ocean) → dashboard opens.</div>
    </div>
  );
}