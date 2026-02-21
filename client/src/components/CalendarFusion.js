// components/CalendarFusion.js
import React, { useMemo, useState } from "react";
import { pickForecastForTime, computeCommuteAdvice } from "../utils/proactive";

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function loadEvents() {
  try {
    const raw = localStorage.getItem("fiq_events");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveEvents(events) {
  localStorage.setItem("fiq_events", JSON.stringify(events));
}

export default function CalendarFusion({ forecastData }) {
  const [events, setEvents] = useState(() => loadEvents());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(() => toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));

  const cityTz = forecastData?.city?.timezone ?? 0;

  const enriched = useMemo(() => {
    if (!forecastData?.list?.length) return events.map((e) => ({ ...e, forecast: null }));

    return events
      .map((e) => {
        const d = new Date(e.time);
        const forecast = pickForecastForTime(forecastData.list, d);
        const advice = computeCommuteAdvice(forecast, cityTz);
        return { ...e, forecast, advice };
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [events, forecastData, cityTz]);

  const addEvent = () => {
    const t = title.trim();
    if (!t) return;

    const newEvent = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title: t,
      time
    };

    const next = [...events, newEvent];
    setEvents(next);
    saveEvents(next);
    setTitle("");
  };

  const removeEvent = (id) => {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    saveEvents(next);
  };

  return (
    <>
      <div className="rail-header">
        <div>
          <div className="rail-title">Calendar</div>
          <div className="rail-subtitle">Your plans, fused with forecast</div>
        </div>
      </div>

      <div className="calendar-form">
        <input
          className="ai-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event (e.g., Meeting, Commute, Hike)"
        />
        <input
          className="ai-input"
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button className="ai-ask-btn" type="button" onClick={addEvent}>
          Add
        </button>
      </div>

      {!forecastData?.list?.length ? (
        <div className="insight-note">Search a city to see weather for events.</div>
      ) : enriched.length === 0 ? (
        <div className="insight-note">Add an event to get commute/weather recommendations.</div>
      ) : (
        <div className="calendar-list">
          {enriched.map((e) => {
            const f = e.forecast;
            const popPct = typeof f?.pop === "number" ? Math.round(f.pop * 100) : null;
            const temp = typeof f?.main?.temp === "number" ? Math.round(f.main.temp) : null;
            const main = f?.weather?.[0]?.main || null;
            const when = new Date(e.time).toLocaleString();

            return (
              <div key={e.id} className="calendar-item">
                <div className="calendar-top">
                  <div className="calendar-title">{e.title}</div>
                  <button className="clear-history-btn" onClick={() => removeEvent(e.id)}>
                    Remove
                  </button>
                </div>
                <div className="calendar-when">{when}</div>

                {f ? (
                  <>
                    <div className="calendar-meta">
                      {temp !== null ? <span>{temp}°C</span> : <span>—</span>}
                      {main ? <span>{main}</span> : <span>—</span>}
                      {popPct !== null ? <span>Rain chance {popPct}%</span> : <span>—</span>}
                    </div>
                    <div className="insight-note">{e.advice}</div>
                  </>
                ) : (
                  <div className="insight-note">No forecast available for that time yet.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}