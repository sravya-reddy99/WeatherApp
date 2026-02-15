import React, { useMemo } from "react";

function formatHour(dt) {
  return new Date(dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

function getNextChange(list) {
  if (!Array.isArray(list) || list.length < 2) return null;
  const base = list[0]?.weather?.[0]?.main;
  for (let i = 1; i < Math.min(list.length, 12); i++) {
    const cur = list[i]?.weather?.[0]?.main;
    if (cur && base && cur !== base) return { time: formatHour(list[i].dt), from: base, to: cur };
  }
  return null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function WeatherInsights({ weatherData }) {
  const kpis = useMemo(() => {
    const list = weatherData?.list;
    if (!Array.isArray(list) || list.length === 0) return null;

    const next8 = list.slice(0, 8);
    const first = next8[0];

    const temp = Math.round(first?.main?.temp ?? 0);
    const feels = Math.round(first?.main?.feels_like ?? temp);
    const windKmh = Math.round((first?.wind?.speed ?? 0) * 3.6);

    const popMax = Math.round(
      clamp(
        Math.max(...next8.map((x) => (typeof x.pop === "number" ? x.pop : 0))) * 100,
        0,
        100
      )
    );

    const visibilityKm =
      typeof first?.visibility === "number" ? (first.visibility / 1000).toFixed(1) : null;

    // outdoor score (simple)
    let score = 10;
    score -= popMax >= 60 ? 4 : popMax >= 30 ? 2 : popMax >= 10 ? 1 : 0;
    score -= windKmh >= 35 ? 2 : windKmh >= 20 ? 1 : 0;
    score -= feels <= -10 ? 3 : feels <= 0 ? 1 : feels >= 32 ? 2 : 0;
    score = clamp(score, 1, 10);

    const comfort =
      feels <= -10 ? "Very cold" :
      feels <= 0 ? "Chilly" :
      feels <= 20 ? "Comfortable" :
      feels <= 28 ? "Warm" : "Hot";

    const change = getNextChange(list);
    const nextChangeText = change ? `${change.time}` : "—";
    const nextChangeSub = change ? `${change.from}→${change.to}` : "Stable";

    return [
      { icon: "🌤", label: "Outdoor", value: `${score}/10`, sub: comfort },
      { icon: "☔", label: "Rain", value: `${popMax}%`, sub: "Next 24h max" },
      { icon: "🌬", label: "Wind", value: `${windKmh} km/h`, sub: "Current" },
      { icon: "🧊", label: "Feels", value: `${feels}°C`, sub: `Temp ${temp}°C` },
      { icon: "🔄", label: "Next", value: nextChangeText, sub: nextChangeSub },
      { icon: "👁", label: "Vis", value: visibilityKm ? `${visibilityKm} km` : "—", sub: "Forecast slot" }
    ];
  }, [weatherData]);

  return (
    <>
      <div className="rail-header">
        <div>
          <div className="rail-title">Insights</div>
          <div className="rail-subtitle">Quick KPIs</div>
        </div>
      </div>

      {!kpis ? (
        <div className="insights-kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-label">Waiting for weather…</div>
          </div>
        </div>
      ) : (
        <div className="insights-kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="kpi-tile">
              <div className="kpi-top">
                <span className="kpi-ico">{k.icon}</span>
                <span className="kpi-label">{k.label}</span>
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
