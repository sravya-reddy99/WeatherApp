import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

function formatHour(dt) {
  return new Date(dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

export default function WeatherCharts({ data }) {
  const chartData = useMemo(() => {
    if (!data?.list?.length) return [];
    return data.list.slice(0, 8).map((item) => ({
      time: formatHour(item.dt),
      temp: Math.round(item.main.temp),
      feels: Math.round(item.main.feels_like),
      pop: typeof item.pop === "number" ? Math.round(item.pop * 100) : 0,
      wind: Math.round((item.wind?.speed ?? 0) * 3.6) // m/s -> km/h
    }));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div className="charts-section">
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Temperature Trend (Next 24 Hours)</div>
          <div className="chart-subtitle">Temp vs feels-like</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis unit="°C" />
                <Tooltip />
                <Line type="monotone" dataKey="temp" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="feels" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Rain Chance (Next 24 Hours)</div>
          <div className="chart-subtitle">POP % (probability of precipitation)</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="pop" strokeWidth={2} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
