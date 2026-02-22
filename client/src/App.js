import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import WeatherApp from "./components/WeatherApp";
import GlobePage from "./pages/GlobePage";

import "./styles/index.css";
import "./styles/weather-backgrounds.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* New globe route */}
        <Route path="/" element={<GlobePage />} />

        {/* Your existing dashboard */}
        <Route path="/weather" element={<WeatherApp />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;