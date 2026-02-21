// utils/proactive.js

export function findRainStart(list = []) {
  // OpenWeather forecast list is 3-hour blocks
  // pop is probability (0..1), weather[0].main can indicate Rain
  for (let i = 0; i < Math.min(list.length, 16); i++) {
    const item = list[i];
    const popPct = typeof item?.pop === "number" ? item.pop * 100 : 0;
    const main = item?.weather?.[0]?.main || "";
    if (main.toLowerCase().includes("rain") || popPct >= 50) {
      return item; // first rainy-ish slot
    }
  }
  return null;
}

export function minutesUntil(dtSeconds, cityTzOffsetSeconds = 0) {
  // dtSeconds is UTC seconds; city timezone offset also seconds
  // convert to "city local ms" and compare with current UTC ms adjusted similarly
  const nowUtcMs = Date.now();
  const nowCityMs = nowUtcMs + cityTzOffsetSeconds * 1000;
  const eventCityMs = dtSeconds * 1000 + cityTzOffsetSeconds * 1000;
  return Math.round((eventCityMs - nowCityMs) / 60000);
}

export function pickForecastForTime(list = [], targetDate) {
  if (!targetDate || !list.length) return null;
  const targetMs = targetDate.getTime();
  let best = null;
  let bestDiff = Infinity;

  for (const item of list) {
    const itemMs = item.dt * 1000;
    const diff = Math.abs(itemMs - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }
  return best;
}

export function computeCommuteAdvice(forecastItem, cityTzOffsetSeconds = 0) {
  if (!forecastItem) return null;

  const popPct = typeof forecastItem.pop === "number" ? Math.round(forecastItem.pop * 100) : 0;
  const windKmh = Math.round((forecastItem.wind?.speed ?? 0) * 3.6);
  const visKm = typeof forecastItem.visibility === "number" ? forecastItem.visibility / 1000 : null;

  const risks = [];
  if (popPct >= 60) risks.push("rain");
  if (windKmh >= 30) risks.push("strong wind");
  if (visKm !== null && visKm < 2) risks.push("low visibility");

  if (!risks.length) return "Commute looks normal.";
  if (risks.includes("low visibility")) return "Leave early—low visibility likely during commute.";
  if (risks.includes("rain")) return "Leave ~10 minutes early—rain likely during commute.";
  return "Allow extra time—windy conditions may slow traffic.";
}