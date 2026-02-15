import React from "react";

const ACTIONS = [
  { label: "☔ Umbrella?", prompt: "Do I need an umbrella in the next 6 hours? Answer briefly with reasons." },
  { label: "🧥 Outfit", prompt: "What should I wear right now? Consider temperature, feels-like, wind and rain." },
  { label: "🕒 Best time out", prompt: "What is the best time to go out in the next 12 hours and why?" },
  { label: "🚗 Driving risk", prompt: "Any driving risks in the next 12 hours (rain/snow/wind/visibility)? Keep it short." },
  { label: "📌 Today summary", prompt: "Summarize today's weather in 2 short lines." },
  { label: "📈 Getting better?", prompt: "Is the weather getting better or worse over the next 6 hours? Explain simply." }
];

export default function WeatherActions({ onAction }) {
  return (
    <>
      <div className="rail-header">
        <div>
          <div className="rail-title">Actions</div>
          <div className="rail-subtitle">One-tap questions for the agent</div>
        </div>
      </div>

      <div className="actions-grid">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className="action-chip"
            onClick={() => onAction?.(a.prompt)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}
