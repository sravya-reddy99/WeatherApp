// components/ProactiveIntelligence.js
import React, { useEffect, useMemo, useState } from "react";
import { findRainStart, minutesUntil } from "../utils/proactive";

function formatCityTime(dtSeconds, cityTzOffsetSeconds) {
  const utcMs = dtSeconds * 1000;
  const cityMs = utcMs + (cityTzOffsetSeconds ?? 0) * 1000;
  return new Date(cityMs).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export default function ProactiveIntelligence({ forecastData, oneCallData, demoMode = false }) {
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  // Small UI state to show "in-app" toast style alert
  const [toast, setToast] = useState(null);

  const cityTz = forecastData?.city?.timezone ?? 0;

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  };

  const fireNotification = (title, body) => {
    // In-app toast (works even without permission)
    setToast({ title, body });
    setTimeout(() => setToast(null), 4500);

    // Desktop notification (requires permission)
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const insights = useMemo(() => {
    if (!forecastData?.list?.length) {
      return {
        rainText: "Search a city to activate proactive alerts.",
        rainMinutes: null,
        rainAtText: "—",
        uvText: "UV: unavailable",
      };
    }

    const rainSlot = findRainStart(forecastData.list);

    // ---- Rain logic (real vs demo) ----
    let rainMinutes = null;
    let rainAtText = "—";
    let rainText = "No significant rain expected soon.";

    if (demoMode) {
      // For demo: force a near-term alert so you can show it instantly
      rainMinutes = 3; // change to 1 or 2 if you want faster
      rainAtText = "in ~3 minutes";
      rainText = "Rain starts in ~3 minutes (Demo Mode).";
    } else if (rainSlot) {
      rainMinutes = minutesUntil(rainSlot.dt, cityTz);
      const at = formatCityTime(rainSlot.dt, cityTz);
      rainAtText = at;

      if (typeof rainMinutes === "number") {
        if (rainMinutes >= 0) rainText = `Rain likely in ~${rainMinutes} min (around ${at}).`;
        else rainText = `Rain likely around ${at}.`;
      } else {
        rainText = `Rain likely around ${at}.`;
      }
    }

    // ---- UV logic (optional from One Call; can simulate in demo) ----
    const uv = demoMode ? 9.5 : oneCallData?.current?.uvi;
    let uvText = "UV: unavailable";
    if (typeof uv === "number") {
      if (uv >= 8) uvText = `UV: ${uv} (Extreme) — sunscreen recommended.`;
      else if (uv >= 6) uvText = `UV: ${uv} (High) — sunscreen recommended.`;
      else if (uv >= 3) uvText = `UV: ${uv} (Moderate)`;
      else uvText = `UV: ${uv} (Low)`;
    }

    return { rainText, rainMinutes, rainAtText, uvText };
  }, [forecastData, oneCallData, cityTz, demoMode]);

  // Auto-notify when rain is soon (real mode) OR always soon (demo mode)
  useEffect(() => {
    if (!forecastData?.city?.name) return;

    const shouldAutoNotify =
      typeof insights?.rainMinutes === "number" &&
      insights.rainMinutes > 0 &&
      insights.rainMinutes <= 30;

    if (!shouldAutoNotify) return;

    // Avoid spamming: once per city per session
    const key = `fiq_notified_rain_${forecastData.city.name}_${demoMode ? "demo" : "real"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // In demo mode, show quickly so it looks alive
    const delayMs = demoMode ? 1500 : 0;

    setTimeout(() => {
      fireNotification("ForecastIQ Alert", `Rain starts in ~${insights.rainMinutes} minutes.`);
    }, delayMs);
  }, [forecastData, insights, demoMode]);

  const triggerDemoAlert = async () => {
    // If user hasn't granted permissions, request it, but still show in-app toast regardless
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await requestNotifications();
    }

    fireNotification(
      "ForecastIQ Demo Alert",
      "Leave 10 mins early — storm arriving during commute. (Demo)"
    );
  };

  return (
    <>
      <div className="rail-header">
        <div>
          <div className="rail-title">Proactive Intelligence</div>
          <div className="rail-subtitle">Smart, time-sensitive alerts</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {demoMode && (
            <button className="ai-clear-btn" type="button" onClick={triggerDemoAlert}>
              Trigger Demo Alert
            </button>
          )}

          {!notifEnabled && typeof Notification !== "undefined" && (
            <button className="ai-clear-btn" type="button" onClick={requestNotifications}>
              Enable Alerts
            </button>
          )}
        </div>
      </div>

      {/* In-app toast */}
      {toast && (
        <div className="insight-item" style={{ borderLeft: "4px solid #2a5298" }}>
          <div className="insight-label">{toast.title}</div>
          <div className="insight-value" style={{ fontSize: 14 }}>
            {toast.body}
          </div>
          <div className="insight-note">This is an in-app alert (works even without permissions).</div>
        </div>
      )}

      {!forecastData?.list?.length ? (
        <div className="insight-note">Search a city to activate proactive alerts.</div>
      ) : (
        <div className="insights-list">
          <div className="insight-item">
            <div className="insight-label">Rain alert</div>
            <div className="insight-value">{insights?.rainText ?? "—"}</div>
            <div className="insight-note">
              {notifEnabled
                ? "Desktop alerts enabled."
                : "Tip: click “Enable Alerts” for desktop notifications."}
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-label">UV alert</div>
            <div className="insight-value">{insights?.uvText ?? "—"}</div>
            <div className="insight-note">
              UV comes from OpenWeather One Call. In Demo Mode it’s simulated.
            </div>
          </div>
        </div>
      )}
    </>
  );
}