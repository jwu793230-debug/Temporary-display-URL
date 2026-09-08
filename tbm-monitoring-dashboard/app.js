function classifyMetric(value, warningThreshold, criticalThreshold) {
  if (!Number.isFinite(value)) return "missing";
  if (value >= criticalThreshold) return "critical";
  if (value >= warningThreshold) return "warning";
  return "normal";
}

function appendTrendPoint(samples, point, limit = 30) {
  return [...samples, point].slice(-limit);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drift(value, random, amplitude, min, max, precision) {
  const next = clamp(value + (random() - 0.5) * 2 * amplitude, min, max);
  return Number(next.toFixed(precision));
}

function stepTelemetry(state, random = Math.random) {
  return {
    ...state,
    speed: drift(state.speed, random, 1.2, 35, 50, 1),
    rotation: drift(state.rotation, random, 0.04, 1.1, 1.8, 2),
    torque: drift(state.torque, random, 40, 3200, 4300, 0),
    thrust: drift(state.thrust, random, 300, 19000, 25000, 0),
    pressure: drift(state.pressure, random, 0.04, 2.05, 2.55, 2),
    screwSpeed: drift(state.screwSpeed, random, 0.12, 7.5, 9.4, 2),
    bearingTemp: drift(state.bearingTemp, random, 0.26, 43, 58, 2),
  };
}

function formatMetric(value, precision = 0) {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    appendTrendPoint,
    classifyMetric,
    formatMetric,
    stepTelemetry,
  };
}

if (typeof document !== "undefined") {
  const initialState = {
    currentRing: 864,
    totalDistance: 1296,
    mileage: "K1+296.0",
    speed: 42.6,
    rotation: 1.42,
    torque: 3860,
    thrust: 22480,
    pressure: 2.31,
    screwSpeed: 8.4,
    bearingTemp: 47.8,
  };

  let state = { ...initialState };
  let simulationPhase = 0;
  let speedTrend = Array.from({ length: 30 }, (_, index) =>
    Number((40.7 + Math.sin(index * 0.56) * 1.4 + index * 0.045).toFixed(1)),
  );
  let pressureTrend = Array.from({ length: 30 }, (_, index) =>
    Number((2.27 + Math.sin(index * 0.42 + 1.1) * 0.045 + index * 0.0015).toFixed(2)),
  );

  const simulationSequences = [
    [0.72, 0.62, 0.58, 0.66, 0.61, 0.55, 0.59],
    [0.36, 0.44, 0.47, 0.41, 0.38, 0.46, 0.43],
    [0.64, 0.58, 0.55, 0.62, 0.57, 0.6, 0.54],
    [0.42, 0.48, 0.45, 0.46, 0.43, 0.49, 0.47],
  ];

  function setValue(name, value) {
    document.querySelectorAll(`[data-value="${name}"]`).forEach((element) => {
      element.textContent = value;
    });
  }

  function setMetricTone(name, tone) {
    const element = document.querySelector(`[data-metric="${name}"]`);
    if (!element) return;
    element.classList.remove("normal", "warning", "critical", "missing");
    element.classList.add(tone);
  }

  function buildPolyline(values, min, max) {
    const width = 1000;
    const top = 15;
    const height = 120;
    return values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * width;
        const ratio = clamp((value - min) / (max - min), 0, 1);
        const y = top + height - ratio * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function renderDashboard() {
    setValue("currentRing", String(state.currentRing).padStart(4, "0"));
    setValue("totalDistance", formatMetric(state.totalDistance, 1));
    setValue("mileage", state.mileage);
    setValue("speed", formatMetric(state.speed, 1));
    setValue("rotation", formatMetric(state.rotation, 2));
    setValue("torque", formatMetric(state.torque, 0));
    setValue("thrust", formatMetric(state.thrust, 0));
    setValue("pressure", formatMetric(state.pressure, 2));
    setValue("screwSpeed", formatMetric(state.screwSpeed, 2));
    setValue("bearingTemp", formatMetric(state.bearingTemp, 1));

    setMetricTone("pressure", classifyMetric(state.pressure, 2.4, 2.5));
    setMetricTone("torque", classifyMetric(state.torque, 4100, 4250));
    setMetricTone("bearingTemp", classifyMetric(state.bearingTemp, 52, 56));

    const speedLine = document.querySelector('[data-line="speed"]');
    const pressureLine = document.querySelector('[data-line="pressure"]');
    if (speedLine) speedLine.setAttribute("points", buildPolyline(speedTrend, 35, 50));
    if (pressureLine) pressureLine.setAttribute("points", buildPolyline(pressureTrend, 2.05, 2.55));
  }

  function updateClock() {
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now).replaceAll("/", "-");
    const timeText = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const timeElement = document.querySelector("[data-clock]");
    const dateElement = document.querySelector("[data-date]");
    const clockElement = document.querySelector("[data-time]");
    if (timeElement) timeElement.dateTime = now.toISOString();
    if (dateElement) dateElement.textContent = dateText;
    if (clockElement) clockElement.textContent = timeText;
  }

  function tickDashboard() {
    const sequence = simulationSequences[simulationPhase % simulationSequences.length];
    let cursor = 0;
    state = stepTelemetry(state, () => sequence[cursor++]);
    simulationPhase += 1;
    speedTrend = appendTrendPoint(speedTrend, state.speed, 30);
    pressureTrend = appendTrendPoint(pressureTrend, state.pressure, 30);
    renderDashboard();
  }

  renderDashboard();
  updateClock();
  window.setInterval(updateClock, 1000);
  window.setInterval(tickDashboard, 2800);
}
