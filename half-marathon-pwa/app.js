(function () {
  const PLAN = (window.TRAINING_PLAN || []).sort((a, b) => a.date.localeCompare(b.date));
  const planByDate = new Map(PLAN.map((item) => [item.date, item]));
  const STORAGE_KEY = "half-marathon-checkins-v1";
  const TOKEN_KEY = "half-marathon-github-token-v1";
  const SYNC_META_KEY = "half-marathon-sync-meta-v1";
  const GITHUB_SYNC = {
    owner: "jwu793230-debug",
    repo: "Temporary-display-URL",
    branch: "main",
    path: "half-marathon-pwa/checkins.json",
  };
  const initialSyncMeta = loadSyncMeta();

  const state = {
    activeTab: "calendar",
    selectedDate: resolveInitialDate(),
    calendarMonth: startOfMonth(resolveInitialDate()),
    planFilter: "stats",
    statsType: "run",
    records: loadRecords(),
    sync: {
      isSyncing: false,
      tokenSaved: Boolean(loadGitHubToken()),
      lastSyncedAt: initialSyncMeta.lastSyncedAt || "",
      message: initialSyncMeta.lastSyncedAt ? "上次同步已记录" : "本地记录已保留，填写 token 后可同步到 GitHub",
      messageType: "muted",
    },
  };

  const app = document.getElementById("app");
  let autoSyncTimer = null;

  const ACTIVITY_TYPES = {
    run: { label: "跑步", short: "跑", distance: true, runVolume: true, className: "type-run" },
    bike: { label: "骑行", short: "骑", distance: true, runVolume: false, className: "type-bike" },
    swim: { label: "游泳", short: "泳", distance: true, runVolume: false, className: "type-swim" },
    hike: { label: "徒步", short: "徒", distance: true, runVolume: false, className: "type-hike" },
    strength: { label: "力量", short: "力", distance: false, runVolume: false, className: "type-strength" },
    machine: { label: "器械", short: "械", distance: false, runVolume: false, className: "type-machine" },
    rest: { label: "休息", short: "休", distance: false, runVolume: false, className: "type-rest" },
  };

  function resolveInitialDate() {
    const today = toISO(new Date());
    if (planByDate.has(today)) return today;
    const future = PLAN.find((item) => item.date >= today);
    return future?.date || PLAN[PLAN.length - 1]?.date || today;
  }

  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  }

  function loadSyncMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveSyncMeta() {
    localStorage.setItem(
      SYNC_META_KEY,
      JSON.stringify({
        lastSyncedAt: state.sync.lastSyncedAt,
      })
    );
  }

  function loadGitHubToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function saveGitHubToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    state.sync.tokenSaved = true;
  }

  function clearGitHubToken() {
    localStorage.removeItem(TOKEN_KEY);
    state.sync.tokenSaved = false;
    state.sync.message = "Token 已清除，本地打卡记录仍然保留在手机里";
    state.sync.messageType = "muted";
    render();
  }

  function parseISO(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(iso, offset) {
    const date = parseISO(iso);
    date.setDate(date.getDate() + offset);
    return toISO(date);
  }

  function startOfMonth(iso) {
    const date = parseISO(iso);
    date.setDate(1);
    return toISO(date);
  }

  function addMonths(iso, offset) {
    const date = parseISO(startOfMonth(iso));
    date.setMonth(date.getMonth() + offset);
    return toISO(date);
  }

  function startOfWeek(iso) {
    const date = parseISO(iso);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return toISO(date);
  }

  function monthLabel(iso) {
    const date = parseISO(iso);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  function formatDate(iso, weekday) {
    const date = parseISO(iso);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekday || ""}`.trim();
  }

  function shortDate(iso) {
    const date = parseISO(iso);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function distanceText(distance) {
    if (!distance) return "0 km";
    const value = Math.abs(distance - 21.0975) < 0.001 ? 21.1 : Number(distance.toFixed(1));
    return `${value} km`;
  }

  function categoryClass(category) {
    if (/半马|比赛|测试/.test(category)) return "cat-race";
    if (/高铁|出行/.test(category)) return "cat-travel";
    if (/间歇|节奏|坡|质量|唤醒/.test(category)) return "cat-quality";
    if (/长距离|长跑/.test(category)) return "cat-long";
    if (/力量/.test(category)) return "cat-strength";
    if (/休息|恢复走|赛前准备|计划启动/.test(category)) return "cat-rest";
    if (/轻松跑|恢复跑/.test(category)) return "cat-run";
    return "cat-default";
  }

  function recordFor(date) {
    return state.records[date] || {};
  }

  function statusText(status) {
    if (status === "done") return "完成";
    if (status === "adjusted") return "调整";
    if (status === "missed") return "未完成";
    return "待打卡";
  }

  function statusClass(status) {
    return status || "";
  }

  function defaultPlan(date) {
    return {
      date,
      week: "",
      weekday: weekdayText(date),
      start: "灵活",
      category: "无计划",
      content: "这一天不在当前训练计划里，可只记录实际运动。",
      duration: "灵活",
      distance: 0,
      intensity: "无",
      reminder: "",
    };
  }

  function weekdayText(iso) {
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][parseISO(iso).getDay()];
  }

  function isRunPlan(plan) {
    return Boolean(plan?.distance) && !/骑行|游泳|徒步|力量|器械|休息|恢复走|高铁|出行/.test(plan?.category || "");
  }

  function inferActivityType(plan, record = {}) {
    if (record.activityType && ACTIVITY_TYPES[record.activityType]) return record.activityType;

    const note = String(record.note || "");
    const category = String(plan?.category || "");
    const content = String(plan?.content || "");
    const source = `${note} ${category} ${content}`;

    if (record.status === "missed" && !Number(record.actualDistance)) return isRunPlan(plan) ? "run" : "rest";
    if (/骑行|骑车|单车|自行车/.test(source)) return "bike";
    if (/游泳|泳池|公开水域/.test(source)) return "swim";
    if (/划船|划船机|椭圆|器械|健身房|登山机/.test(source)) return "machine";
    if (/徒步|远足|爬山|登山/.test(source)) return "hike";
    if (/力量|深蹲|箭步蹲|臀桥|平板|提踵|核心/.test(source)) return "strength";
    if (/休息|恢复走|赛前准备|计划启动|高铁|出行/.test(source) && !Number(record.actualDistance)) return "rest";
    if (Number(record.actualDistance) > 0) return "run";
    if (isRunPlan(plan)) return "run";
    return "rest";
  }

  function activityMeta(type) {
    return ACTIVITY_TYPES[type] || ACTIVITY_TYPES.run;
  }

  function usesDistance(type) {
    return Boolean(activityMeta(type).distance);
  }

  function countsAsRunVolume(type) {
    return Boolean(activityMeta(type).runVolume);
  }

  function numericDistance(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function completedRunDistance(plan, record = {}) {
    const type = inferActivityType(plan, record);
    if (!countsAsRunVolume(type)) return 0;
    const actual = numericDistance(record.actualDistance);
    if (actual) return actual;
    if (record.status === "done" && isRunPlan(plan)) return plan.distance || 0;
    return 0;
  }

  function crossTrainingDistance(plan, record = {}) {
    const type = inferActivityType(plan, record);
    if (countsAsRunVolume(type) || !usesDistance(type)) return 0;
    return numericDistance(record.actualDistance);
  }

  function activityIcon(type) {
    const meta = activityMeta(type);
    const common = `class="sport-icon ${escapeHTML(meta.className)}" viewBox="0 0 24 24" aria-hidden="true"`;
    if (type === "bike") {
      return `<svg ${common} fill="none"><circle cx="6" cy="16" r="3.2"/><circle cx="18" cy="16" r="3.2"/><path d="M8.5 16l3-6h3l2.5 6M11.5 10l-2.2 6M12 10l4 6M14.5 10l1.3-2.2M9.5 8h3"/></svg>`;
    }
    if (type === "swim") {
      return `<svg ${common} fill="none"><path d="M4 15c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4M5 19c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4M8.2 11.3c1.8-2.7 5.4-3.4 8.1-1.7l1.1.7M11.8 7.6l2.5 2.1"/></svg>`;
    }
    if (type === "hike") {
      return `<svg ${common} fill="none"><path d="M8 20l2.2-6.4 3.7-2.3M13 4.5a2 2 0 1 0-2.1-3.4M9.4 9l2.1-2.2 2.8 1.8 2.1 3.1M14.2 11.4l2.2 2.1 2.6.5M6 22l3.2-1.3 3.4 1.3 3.3-1.3L19 22M18.5 7v15"/></svg>`;
    }
    if (type === "strength") {
      return `<svg ${common} fill="none"><path d="M4 10v4M7 8v8M10 12h4M17 8v8M20 10v4"/></svg>`;
    }
    if (type === "machine") {
      return `<svg ${common} fill="none"><path d="M6 18h12M7 18l2-10h6l2 10M9.5 8l-2-3M14.5 8l2-3M9 13h6"/></svg>`;
    }
    if (type === "rest") {
      return `<svg ${common} fill="none"><path d="M6 12h12M8 16h8"/></svg>`;
    }
    return `<svg ${common} fill="none"><path d="M13 5.5a2 2 0 1 0-2-2M9 21l2-6 3-2 2 3 3 1M7 10l4-2 2 3M11 8l-2 5-4 2M14 13l-2 3 2 5"/></svg>`;
  }

  function activityBadge(type, extra = "") {
    const meta = activityMeta(type);
    const detail = extra ? `<span>${escapeHTML(extra)}</span>` : "";
    return `<span class="activity-badge ${escapeHTML(meta.className)}">${activityIcon(type)}<strong>${escapeHTML(meta.label)}</strong>${detail}</span>`;
  }

  function updateRecord(date, patch) {
    state.records[date] = {
      ...recordFor(date),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    saveRecords();
    queueAutoSync();
    render();
  }

  function saveRecordField(date, patch) {
    state.records[date] = {
      ...recordFor(date),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    saveRecords();
    queueAutoSync();
  }

  function recordCount(records = state.records) {
    return Object.values(records).filter((record) => record && Object.keys(record).length).length;
  }

  function formatDateTime(iso) {
    if (!iso) return "未同步";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "未同步";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hour}:${minute}`;
  }

  function syncApiUrl() {
    const encodedPath = GITHUB_SYNC.path.split("/").map(encodeURIComponent).join("/");
    return `https://api.github.com/repos/${GITHUB_SYNC.owner}/${GITHUB_SYNC.repo}/contents/${encodedPath}`;
  }

  function githubHeaders(token) {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  function encodeBase64Text(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64Text(value) {
    const binary = atob(String(value || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function githubError(response) {
    let message = `GitHub 请求失败：${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // Keep the status-based message.
    }
    const error = new Error(message);
    error.status = response.status;
    return error;
  }

  async function fetchRemoteCheckins(token) {
    const response = await fetch(`${syncApiUrl()}?ref=${encodeURIComponent(GITHUB_SYNC.branch)}`, {
      headers: githubHeaders(token),
    });
    if (response.status === 404) return { sha: null, records: {} };
    if (!response.ok) throw await githubError(response);

    const data = await response.json();
    const text = decodeBase64Text(data.content);
    const payload = JSON.parse(text);
    const records = payload.records && typeof payload.records === "object" ? payload.records : payload;
    return { sha: data.sha, records: records || {} };
  }

  async function putRemoteCheckins(token, records, sha) {
    const payload = {
      version: 1,
      source: "half-marathon-pwa",
      updatedAt: new Date().toISOString(),
      records,
    };
    const body = {
      branch: GITHUB_SYNC.branch,
      message: "Sync half marathon checkins",
      content: encodeBase64Text(`${JSON.stringify(payload, null, 2)}\n`),
    };
    if (sha) body.sha = sha;

    const response = await fetch(syncApiUrl(), {
      method: "PUT",
      headers: githubHeaders(token),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw await githubError(response);
    return response.json();
  }

  function recordTime(record) {
    const timestamp = Date.parse(record?.updatedAt || "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function mergeRecords(localRecords, remoteRecords) {
    const merged = {};
    const dates = new Set([...Object.keys(remoteRecords || {}), ...Object.keys(localRecords || {})]);
    dates.forEach((date) => {
      const local = localRecords?.[date] || null;
      const remote = remoteRecords?.[date] || null;
      if (!remote) {
        merged[date] = { ...local };
        return;
      }
      if (!local) {
        merged[date] = { ...remote };
        return;
      }
      if (recordTime(local) >= recordTime(remote)) {
        merged[date] = { ...remote, ...local };
      } else {
        merged[date] = { ...local, ...remote };
      }
    });
    return merged;
  }

  function renderSyncChange(force = false) {
    if (force || state.activeTab === "sync") render();
  }

  function setSyncMessage(message, type = "muted", forceRender = false) {
    state.sync.message = message;
    state.sync.messageType = type;
    renderSyncChange(forceRender);
  }

  function queueAutoSync() {
    const token = loadGitHubToken();
    if (!token) return;
    window.clearTimeout(autoSyncTimer);
    autoSyncTimer = window.setTimeout(() => {
      syncNow({ silent: true });
    }, 1800);
  }

  async function saveTokenAndSync() {
    const input = app.querySelector("[data-token-input]");
    const token = input?.value.trim();
    if (token) saveGitHubToken(token);
    if (!loadGitHubToken()) {
      setSyncMessage("请先粘贴 GitHub token，再同步", "error", true);
      return;
    }
    await syncNow({ silent: false });
  }

  async function syncNow({ silent = false } = {}) {
    const token = loadGitHubToken();
    if (!token) {
      setSyncMessage("请先保存 GitHub token", "error", true);
      return;
    }
    if (state.sync.isSyncing) return;

    state.sync.isSyncing = true;
    state.sync.tokenSaved = true;
    state.sync.message = "正在合并手机本地记录和 GitHub 记录...";
    state.sync.messageType = "muted";
    renderSyncChange(!silent);

    try {
      let remote = await fetchRemoteCheckins(token);
      let merged = mergeRecords(state.records, remote.records);
      try {
        await putRemoteCheckins(token, merged, remote.sha);
      } catch (error) {
        if (error.status !== 409) throw error;
        remote = await fetchRemoteCheckins(token);
        merged = mergeRecords(merged, remote.records);
        await putRemoteCheckins(token, merged, remote.sha);
      }
      state.records = merged;
      saveRecords();
      state.sync.lastSyncedAt = new Date().toISOString();
      saveSyncMeta();
      state.sync.message = `已同步 ${recordCount(merged)} 天记录到 GitHub`;
      state.sync.messageType = "success";
    } catch (error) {
      state.sync.message = `同步失败：${error.message || "请检查 token 权限和网络"}`;
      state.sync.messageType = "error";
    } finally {
      state.sync.isSyncing = false;
      renderSyncChange(!silent);
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const selectedPlan = planByDate.get(state.selectedDate);
    const titleDate =
      state.activeTab === "calendar"
        ? `${monthLabel(state.calendarMonth)} · ${formatDate(state.selectedDate, selectedPlan?.weekday || weekdayText(state.selectedDate))}`
        : selectedPlan
          ? formatDate(selectedPlan.date, selectedPlan.weekday)
          : state.selectedDate;

    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-row">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 15c3-1 5-4 7-8 1-2 4-2 5 1l1 3c1 2 2 3 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 19h13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h1>半马训练</h1>
              <p>${escapeHTML(titleDate)}</p>
            </div>
          </div>
          <div class="date-jump" aria-label="日期切换">
            <button class="icon-button" data-action="prev-day" aria-label="前一天">‹</button>
            <button class="today-button" data-action="today">今天</button>
            <button class="icon-button" data-action="next-day" aria-label="后一天">›</button>
          </div>
        </div>
      </header>

      <main class="page">
        ${renderActiveTab()}
      </main>

      <nav class="bottom-nav" aria-label="主导航">
        <div class="bottom-nav-inner">
          ${tabButton("calendar", "日历")}
          ${tabButton("week", "周复盘")}
          ${tabButton("plan", "计划")}
          ${tabButton("sync", "同步")}
        </div>
      </nav>
    `;
  }

  function tabButton(tab, label) {
    const active = state.activeTab === tab ? " active" : "";
    return `<button class="tab-button${active}" data-tab="${tab}">${label}</button>`;
  }

  function renderActiveTab() {
    if (state.activeTab === "calendar") return renderCalendarTab();
    if (state.activeTab === "week") return renderWeekTab();
    if (state.activeTab === "plan") return renderPlanTab();
    if (state.activeTab === "sync") return renderSyncTab();
    return renderCalendarTab();
  }

  function renderCalendarTab() {
    const monthStart = state.calendarMonth;
    const gridStart = startOfWeek(monthStart);
    const selectedPlan = planByDate.get(state.selectedDate) || defaultPlan(state.selectedDate);
    const selectedRecord = recordFor(state.selectedDate);
    const days = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      return {
        date,
        plan: planByDate.get(date),
        record: recordFor(date),
        inMonth: startOfMonth(date) === monthStart,
      };
    });

    return `
      <section class="calendar-shell">
        <div class="calendar-head">
          <button class="month-button" data-action="prev-month" aria-label="上个月">‹</button>
          <div>
            <h2>${escapeHTML(monthLabel(monthStart))}</h2>
            <p>${escapeHTML(formatDate(state.selectedDate, selectedPlan.weekday))}</p>
          </div>
          <button class="month-button" data-action="next-month" aria-label="下个月">›</button>
        </div>
        <div class="weekday-grid" aria-hidden="true">
          ${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="calendar-grid">
          ${days.map((item) => renderCalendarDay(item)).join("")}
        </div>
      </section>
      ${renderCalendarLegend()}
      ${renderCalendarDetail(selectedPlan, selectedRecord)}
    `;
  }

  function renderCalendarLegend() {
    const sportTypes = ["run", "bike", "hike", "swim", "strength", "machine"];
    return `
      <section class="calendar-legend" aria-label="图例">
        <div class="legend-row">
          <span><i class="legend-dot done"></i>已完成</span>
          <span><i class="legend-dot adjusted"></i>调整/交叉训练</span>
          <span><i class="legend-ring missed"></i>未完成</span>
          <span><i class="legend-dot planned"></i>计划/休息</span>
        </div>
        <div class="legend-row sport-legend">
          ${sportTypes.map((type) => `<span>${activityIcon(type)}${escapeHTML(activityMeta(type).label)}</span>`).join("")}
        </div>
      </section>
    `;
  }

  function renderCalendarDay({ date, plan, record, inMonth }) {
    const type = inferActivityType(plan, record);
    const meta = activityMeta(type);
    const status = record.status || "";
    const selected = date === state.selectedDate ? " selected" : "";
    const dimmed = inMonth ? "" : " out-month";
    const statusClassName = status ? ` ${status}` : "";
    const planned = !status && plan ? " planned" : "";
    const distance = numericDistance(record.actualDistance);
    const distanceLine =
      distance && usesDistance(type)
        ? `${Number(distance.toFixed(1))}km`
        : status
          ? meta.short
          : plan?.distance
            ? `${Number(plan.distance.toFixed(1))}km`
            : plan
              ? meta.short
              : "";

    return `
      <button class="calendar-day${selected}${dimmed}${statusClassName}${planned} ${escapeHTML(meta.className)}" data-calendar-date="${date}" aria-label="${escapeHTML(formatDate(date, plan?.weekday || weekdayText(date)))}">
        <span class="calendar-date">${parseISO(date).getDate()}</span>
        <span class="calendar-mark">${activityIcon(type)}</span>
        <span class="calendar-distance">${escapeHTML(distanceLine)}</span>
      </button>
    `;
  }

  function renderCalendarDetail(plan, record) {
    const type = inferActivityType(plan, record);
    const meta = activityMeta(type);
    const distance = numericDistance(record.actualDistance);
    const distanceNote = countsAsRunVolume(type)
      ? "计入跑步跑量"
      : usesDistance(type)
        ? `${meta.label}距离不计入跑步跑量`
        : "无距离记录，只统计完成、时长和体感";

    return `
      <section class="card calendar-detail">
        <div class="detail-head">
          <div>
            <div class="workout-label">选中日期</div>
            <h2>${escapeHTML(formatDate(plan.date, plan.weekday))}</h2>
          </div>
          <span class="row-status ${statusClass(record.status)}">${escapeHTML(statusText(record.status))}</span>
        </div>
        <div class="detail-badges">
          ${activityBadge(type, distance && usesDistance(type) ? `${Number(distance.toFixed(2))}km` : "")}
          ${record.durationDone ? `<span class="detail-chip">时长 ${escapeHTML(record.durationDone)}</span>` : ""}
          ${record.rpe ? `<span class="detail-chip">RPE ${escapeHTML(record.rpe)}</span>` : ""}
        </div>
        <p class="detail-note">${escapeHTML(record.note || plan.content || "暂无备注")}</p>
        <div class="distance-rule">${escapeHTML(distanceNote)}</div>
        ${renderCheckin(plan, true)}
      </section>
    `;
  }

  function renderTodayTab() {
    const plan = planByDate.get(state.selectedDate) || defaultPlan(state.selectedDate);
    const tomorrow = planByDate.get(addDays(state.selectedDate, 1));

    return `
      ${renderWorkoutCard(plan, "今天训练")}
      ${renderCheckin(plan)}
      ${tomorrow ? renderWorkoutCard(tomorrow, "明天提醒", true) : ""}
    `;
  }

  function renderWorkoutCard(plan, label, compact = false) {
    const category = escapeHTML(plan.category);
    const compactClass = compact ? " compact" : "";
    return `
      <section class="card workout-card${compactClass}">
        <div class="workout-head">
          <div>
            <div class="workout-label">${label}</div>
            <div class="workout-date">${escapeHTML(formatDate(plan.date, plan.weekday))}</div>
          </div>
          <div class="category-pill ${categoryClass(plan.category)}">${category}</div>
        </div>
        <div class="workout-body">
          <div class="metric-row">
            <div class="metric"><span>计划距离</span><strong>${distanceText(plan.distance)}</strong></div>
            <div class="metric"><span>预计用时</span><strong>${escapeHTML(plan.duration || "灵活")}</strong></div>
            <div class="metric"><span>强度</span><strong>${escapeHTML(plan.intensity || "无")}</strong></div>
          </div>
          ${compact ? "" : `<p class="content-text">${escapeHTML(plan.content)}</p>`}
          ${plan.reminder ? `<div class="reminder">${escapeHTML(plan.reminder)}</div>` : ""}
        </div>
      </section>
    `;
  }

  function renderCheckin(plan, compact = false) {
    const record = recordFor(plan.date);
    const status = record.status || "";
    const activityType = inferActivityType(plan, record);
    const meta = activityMeta(activityType);
    const actualDistance = record.actualDistance ?? "";
    const durationDone = record.durationDone ?? "";
    const rpe = record.rpe || 5;
    const note = record.note || "";
    const distanceLabel = activityType === "bike" ? "骑行距离" : activityType === "swim" ? "游泳距离" : activityType === "hike" ? "徒步距离" : "跑步距离";
    const distanceHelp = countsAsRunVolume(activityType)
      ? "跑步距离会计入周跑量"
      : usesDistance(activityType)
        ? activityType === "hike"
          ? "徒步距离会作为交叉训练记录，不计入跑步跑量"
          : `${meta.label}距离会作为交叉训练记录，不计入跑步跑量`
        : `${meta.label}不需要填写距离`;
    const checkinClass = compact ? "checkin compact-checkin" : "card checkin";

    return `
      <section class="${checkinClass}">
        <div class="section-title">
          <h2>打卡</h2>
          <span>${escapeHTML(statusText(status))}</span>
        </div>
        <div class="status-grid">
          ${statusButton("done", "完成", status)}
          ${statusButton("adjusted", "调整", status)}
          ${statusButton("missed", "未完成", status)}
        </div>
        <div class="activity-selector" aria-label="运动类型">
          ${Object.keys(ACTIVITY_TYPES)
            .filter((type) => type !== "rest")
            .map((type) => activityButton(type, activityType))
            .join("")}
        </div>
        <div class="distance-rule">${escapeHTML(distanceHelp)}</div>
        <div class="form-grid">
          ${
            usesDistance(activityType)
              ? `<div class="field">
                  <label for="actualDistance">${escapeHTML(distanceLabel)}</label>
                  <input id="actualDistance" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHTML(actualDistance)}" placeholder="${plan.distance && countsAsRunVolume(activityType) ? distanceText(plan.distance).replace(" km", "") : "0"}" data-field="actualDistance" />
                </div>`
              : `<div class="field">
                  <label for="durationDone">运动时长</label>
                  <input id="durationDone" inputmode="text" type="text" value="${escapeHTML(durationDone)}" placeholder="15-30分钟" data-field="durationDone" />
                </div>`
          }
          <div class="field">
            <label for="rpe">体感</label>
            <div class="range-row">
              <input id="rpe" type="range" min="1" max="10" step="1" value="${escapeHTML(rpe)}" data-field="rpe" />
              <span class="rpe-value">${escapeHTML(rpe)}</span>
            </div>
          </div>
          ${
            usesDistance(activityType)
              ? `<div class="field full">
                  <label for="durationDone">运动时长</label>
                  <input id="durationDone" inputmode="text" type="text" value="${escapeHTML(durationDone)}" placeholder="例如 20分钟 / 3:40" data-field="durationDone" />
                </div>`
              : ""
          }
          <div class="field full">
            <label for="note">备注</label>
            <textarea id="note" data-field="note" placeholder="比如：腿沉、很轻松、改成快走">${escapeHTML(note)}</textarea>
          </div>
        </div>
      </section>
    `;
  }

  function statusButton(value, label, current) {
    const active = value === current ? " active" : "";
    return `<button class="status-button${active}" data-status="${value}">${label}</button>`;
  }

  function activityButton(type, current) {
    const meta = activityMeta(type);
    const active = type === current ? " active" : "";
    return `<button class="activity-button ${escapeHTML(meta.className)}${active}" data-activity="${type}">${activityIcon(type)}<span>${escapeHTML(meta.label)}</span></button>`;
  }

  function weeklyMetrics(weekStart) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, plan: planByDate.get(date), record: recordFor(date) };
    });
    const plannedDistance = days.reduce((sum, item) => sum + (isRunPlan(item.plan) ? item.plan.distance || 0 : 0), 0);
    const actualDistance = days.reduce((sum, item) => sum + completedRunDistance(item.plan, item.record), 0);
    const crossDistance = days.reduce((sum, item) => sum + crossTrainingDistance(item.plan, item.record), 0);
    const completedDays = days.filter((item) => item.record.status === "done").length;
    const adjustedDays = days.filter((item) => item.record.status === "adjusted").length;
    const missedDays = days.filter((item) => item.record.status === "missed").length;
    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      days,
      plannedDistance,
      actualDistance,
      crossDistance,
      completedDays,
      adjustedDays,
      missedDays,
      advice: weeklyAdvice(plannedDistance, actualDistance, crossDistance, completedDays, adjustedDays, missedDays),
    };
  }

  function renderWeekTab() {
    const metrics = weeklyMetrics(startOfWeek(state.selectedDate));

    return `
      <section class="section-title">
        <h2>${shortDate(metrics.weekStart)} - ${shortDate(metrics.weekEnd)}</h2>
        <span>本周复盘</span>
      </section>
      <section class="summary-grid">
        <div class="summary-card"><span>本周跑量</span><strong>${Number(metrics.plannedDistance.toFixed(1))}</strong></div>
        <div class="summary-card"><span>跑步完成</span><strong>${Number(metrics.actualDistance.toFixed(1))}</strong></div>
        <div class="summary-card"><span>交叉距离</span><strong>${Number(metrics.crossDistance.toFixed(1))}</strong></div>
        <div class="summary-card"><span>完成天数</span><strong>${metrics.completedDays}</strong></div>
      </section>
      <section class="advice">${escapeHTML(metrics.advice)}</section>
      <section class="week-list">
        ${metrics.days.map((item) => renderDayRow(item.date, item.plan, item.record)).join("")}
      </section>
    `;
  }

  function weeklyAdvice(planned, actual, cross, done, adjusted, missed) {
    if (cross >= 30 && actual < planned * 0.5) return "这周交叉训练负荷不低，跑步不用硬补；下一次跑步保持轻松，先看腿部恢复。";
    if (planned > 0 && actual > planned * 1.15) return "这周实际跑量偏高，接下来两天优先恢复，不要为了状态好继续加码。";
    if (missed >= 2) return "这周漏练偏多，不建议补齐所有跑量，保留下一次关键课或周末长距离就好。";
    if (adjusted >= 2) return "这周身体可能有些波动，质量课可以降强度，轻松跑继续慢。";
    if (done >= 4 || actual >= planned * 0.8) return "节奏不错，继续把轻松跑压慢，周末训练看恢复情况执行。";
    return "这周先稳住，不急着追跑量。能完成下一次计划训练，就已经是在往前走。";
  }

  function renderDayRow(date, plan, record) {
    const active = date === state.selectedDate ? " active" : "";
    const category = plan?.category || "无计划";
    const type = inferActivityType(plan, record);
    const distance = plan ? distanceText(plan.distance) : "0 km";
    return `
      <button class="day-row${active}" data-date="${date}">
        <span class="row-date">${shortDate(date)}</span>
        <span class="row-main">
          <strong>${activityIcon(type)}${escapeHTML(category)}</strong>
          <span>${escapeHTML(distance)} · ${escapeHTML(plan?.duration || "灵活")}</span>
        </span>
        <span class="row-status ${statusClass(record.status)}">${escapeHTML(statusText(record.status))}</span>
      </button>
    `;
  }

  function renderPlanTab() {
    const filters = `
      <div class="filter-row">
        ${filterButton("stats", "统计")}
        ${filterButton("week", "周训练情况")}
        ${filterButton("race", "比赛日")}
      </div>
    `;
    if (state.planFilter === "stats") return `${filters}${renderStatsPanel()}`;
    if (state.planFilter === "week") return `${filters}${renderWeeklyPlanReview()}`;

    const items = filteredPlanItems();
    return `
      ${filters}
      <section class="plan-list">
        ${items.length ? items.map((plan) => renderPlanRow(plan)).join("") : `<div class="empty">没有符合条件的计划</div>`}
      </section>
    `;
  }

  function filterButton(value, label) {
    const active = state.planFilter === value ? " active" : "";
    return `<button class="filter-button${active}" data-filter="${value}">${label}</button>`;
  }

  function filteredPlanItems() {
    if (state.planFilter === "race") {
      return PLAN.filter((item) => /半马|比赛|测试/.test(item.category));
    }
    return [];
  }

  function statTypes() {
    return ["run", "bike", "hike", "swim", "strength", "machine"];
  }

  function trackedEntries() {
    const dates = Array.from(new Set([...PLAN.map((plan) => plan.date), ...Object.keys(state.records)])).sort();
    return dates
      .map((date) => ({ date, plan: planByDate.get(date) || defaultPlan(date), record: recordFor(date) }))
      .filter((item) => hasWorkoutRecord(item.plan, item.record));
  }

  function hasWorkoutRecord(plan, record = {}) {
    if (!record || !Object.keys(record).length) return false;
    if (record.status === "missed") return false;
    if (numericDistance(record.actualDistance) > 0) return true;
    if (record.durationDone) return true;
    if (record.status === "done" && (record.note || record.activityType || isRunPlan(plan))) return true;
    return false;
  }

  function distanceForType(type, plan, record) {
    if (!usesDistance(type)) return 0;
    if (countsAsRunVolume(type)) return completedRunDistance(plan, record);
    return numericDistance(record.actualDistance);
  }

  function statsForType(type) {
    const entries = trackedEntries().filter((item) => inferActivityType(item.plan, item.record) === type);
    const distance = entries.reduce((sum, item) => sum + distanceForType(type, item.plan, item.record), 0);
    const done = entries.filter((item) => item.record.status === "done").length;
    const adjusted = entries.filter((item) => item.record.status === "adjusted").length;
    return { type, entries, distance, sessions: entries.length, done, adjusted };
  }

  function renderStatsPanel() {
    const stats = statTypes().map((type) => statsForType(type));
    const selected = stats.find((item) => item.type === state.statsType) || stats[0];
    const totalRun = stats.find((item) => item.type === "run")?.distance || 0;
    const totalCross = stats
      .filter((item) => item.type !== "run")
      .reduce((sum, item) => sum + item.distance, 0);
    const totalSessions = stats.reduce((sum, item) => sum + item.sessions, 0);

    return `
      <section class="summary-grid stats-overview">
        <div class="summary-card"><span>跑步距离</span><strong>${Number(totalRun.toFixed(1))}</strong></div>
        <div class="summary-card"><span>交叉距离</span><strong>${Number(totalCross.toFixed(1))}</strong></div>
        <div class="summary-card"><span>运动次数</span><strong>${totalSessions}</strong></div>
        <div class="summary-card"><span>已记录类型</span><strong>${stats.filter((item) => item.sessions > 0).length}</strong></div>
      </section>
      <section class="stat-type-grid">
        ${stats.map((item) => renderStatTypeCard(item)).join("")}
      </section>
      <section class="card stat-detail-card">
        <div class="section-title">
          <h2>${escapeHTML(activityMeta(selected.type).label)}明细</h2>
          <span>${selected.sessions} 次</span>
        </div>
        <div class="stat-detail-list">
          ${selected.entries.length ? selected.entries.map((item) => renderStatDetailRow(selected.type, item.plan, item.record)).join("") : `<div class="empty">还没有这类运动记录</div>`}
        </div>
      </section>
    `;
  }

  function renderStatTypeCard(stats) {
    const meta = activityMeta(stats.type);
    const active = stats.type === state.statsType ? " active" : "";
    const primary = usesDistance(stats.type) ? `${Number(stats.distance.toFixed(1))} km` : `${stats.sessions} 次`;
    const secondary = usesDistance(stats.type) ? `${stats.sessions} 次记录` : `${stats.done} 完成 / ${stats.adjusted} 调整`;
    return `
      <button class="stat-type-card ${escapeHTML(meta.className)}${active}" data-stat-type="${stats.type}">
        ${activityIcon(stats.type)}
        <span>${escapeHTML(meta.label)}</span>
        <strong>${escapeHTML(primary)}</strong>
        <small>${escapeHTML(secondary)}</small>
      </button>
    `;
  }

  function renderStatDetailRow(type, plan, record) {
    const meta = activityMeta(type);
    const distance = distanceForType(type, plan, record);
    const metric = usesDistance(type)
      ? `${Number(distance.toFixed(2))} km`
      : record.durationDone || statusText(record.status);
    const note = record.note || plan.content || "";
    const planned = plan.category && plan.category !== meta.label ? `原计划：${plan.category}` : plan.category;
    return `
      <button class="stat-detail-row" data-date="${plan.date}">
        <span class="row-date">${shortDate(plan.date)}<br>${escapeHTML(plan.weekday)}</span>
        <span class="row-main">
          <strong>${activityIcon(type)}${escapeHTML(meta.label)}</strong>
          <span>${escapeHTML(metric)} · ${escapeHTML(planned)} · ${escapeHTML(note)}</span>
        </span>
        <span class="row-status ${statusClass(record.status)}">${escapeHTML(statusText(record.status))}</span>
      </button>
    `;
  }

  function trainingWeekStarts() {
    if (!PLAN.length) return [startOfWeek(state.selectedDate)];
    const starts = [];
    let cursor = startOfWeek(PLAN[0].date);
    const end = startOfWeek(PLAN[PLAN.length - 1].date);
    while (cursor <= end) {
      starts.push(cursor);
      cursor = addDays(cursor, 7);
    }
    return starts;
  }

  function renderWeeklyPlanReview() {
    const weeks = trainingWeekStarts().map((weekStart) => weeklyMetrics(weekStart));
    return `
      <section class="week-plan-list">
        ${weeks.map((metrics) => renderWeeklySummaryRow(metrics)).join("")}
      </section>
    `;
  }

  function renderWeeklySummaryRow(metrics) {
    const active = state.selectedDate >= metrics.weekStart && state.selectedDate <= metrics.weekEnd ? " active" : "";
    const progress = metrics.plannedDistance ? Math.min(120, (metrics.actualDistance / metrics.plannedDistance) * 100) : 0;
    return `
      <button class="week-summary-row${active}" data-week-start="${metrics.weekStart}">
        <div class="week-summary-head">
          <strong>${shortDate(metrics.weekStart)} - ${shortDate(metrics.weekEnd)}</strong>
          <span>${metrics.completedDays} 完成 / ${metrics.adjustedDays} 调整 / ${metrics.missedDays} 未完成</span>
        </div>
        <div class="week-summary-metrics">
          <span>计划 ${Number(metrics.plannedDistance.toFixed(1))} km</span>
          <span>跑步 ${Number(metrics.actualDistance.toFixed(1))} km</span>
          <span>交叉 ${Number(metrics.crossDistance.toFixed(1))} km</span>
        </div>
        <div class="week-progress" aria-hidden="true"><i style="width:${progress}%"></i></div>
        <p>${escapeHTML(metrics.advice)}</p>
      </button>
    `;
  }

  function renderPlanRow(plan) {
    const record = recordFor(plan.date);
    const active = plan.date === state.selectedDate ? " active" : "";
    const type = inferActivityType(plan, record);
    return `
      <button class="plan-row${active}" data-date="${plan.date}">
        <span class="row-date">${shortDate(plan.date)}<br>${escapeHTML(plan.weekday)}</span>
        <span class="row-main">
          <strong>${activityIcon(type)}${escapeHTML(plan.category)}</strong>
          <span>${distanceText(plan.distance)} · ${escapeHTML(plan.duration || "灵活")}</span>
        </span>
        <span class="row-status ${statusClass(record.status)}">${escapeHTML(statusText(record.status))}</span>
      </button>
    `;
  }

  function renderSyncTab() {
    const tokenLabel = state.sync.tokenSaved ? "已保存" : "未保存";
    const disabled = state.sync.isSyncing ? " disabled" : "";
    const buttonDisabled = state.sync.isSyncing ? "disabled" : "";
    const messageType = state.sync.messageType || "muted";
    return `
      <section class="section-title">
        <h2>GitHub 同步</h2>
        <span>${tokenLabel}</span>
      </section>
      <section class="card sync-card">
        <div class="sync-stats">
          <div class="sync-stat">
            <span>本地记录</span>
            <strong>${recordCount()}</strong>
          </div>
          <div class="sync-stat">
            <span>云端文件</span>
            <strong>checkins</strong>
          </div>
          <div class="sync-stat">
            <span>上次同步</span>
            <strong>${escapeHTML(formatDateTime(state.sync.lastSyncedAt))}</strong>
          </div>
        </div>
        <div class="field full">
          <label for="githubToken">GitHub token</label>
          <input id="githubToken" type="password" autocomplete="off" data-token-input placeholder="${state.sync.tokenSaved ? "已保存；留空可直接同步" : "粘贴 fine-grained token"}" />
        </div>
        <div class="sync-actions">
          <button class="sync-button primary${disabled}" data-action="save-token-sync" ${buttonDisabled}>保存并同步</button>
          <button class="sync-button${disabled}" data-action="sync-now" ${buttonDisabled}>立即同步</button>
          <button class="sync-button danger${disabled}" data-action="clear-token" ${buttonDisabled}>清除 token</button>
        </div>
        <div class="sync-message ${messageType}">${escapeHTML(state.sync.message)}</div>
        <p class="sync-help">首次同步会合并手机本地记录和 GitHub 文件；同一天记录按更新时间保留较新的，时间相同保留手机本地。</p>
      </section>
    `;
  }

  app.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      state.activeTab = tab.dataset.tab;
      if (state.activeTab === "calendar") state.calendarMonth = startOfMonth(state.selectedDate);
      render();
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      if (action.dataset.action === "prev-day") state.selectedDate = addDays(state.selectedDate, -1);
      if (action.dataset.action === "next-day") state.selectedDate = addDays(state.selectedDate, 1);
      if (action.dataset.action === "today") state.selectedDate = resolveInitialDate();
      if (action.dataset.action === "prev-month") {
        state.calendarMonth = addMonths(state.calendarMonth, -1);
        state.selectedDate = state.calendarMonth;
        render();
        return;
      }
      if (action.dataset.action === "next-month") {
        state.calendarMonth = addMonths(state.calendarMonth, 1);
        state.selectedDate = state.calendarMonth;
        render();
        return;
      }
      if (action.dataset.action === "save-token-sync") {
        saveTokenAndSync();
        return;
      }
      if (action.dataset.action === "sync-now") {
        syncNow({ silent: false });
        return;
      }
      if (action.dataset.action === "clear-token") {
        clearGitHubToken();
        return;
      }
      state.calendarMonth = startOfMonth(state.selectedDate);
      render();
      return;
    }

    const activity = event.target.closest("[data-activity]");
    if (activity) {
      updateRecord(state.selectedDate, { activityType: activity.dataset.activity });
      return;
    }

    const status = event.target.closest("[data-status]");
    if (status) {
      updateRecord(state.selectedDate, { status: status.dataset.status });
      return;
    }

    const statType = event.target.closest("[data-stat-type]");
    if (statType) {
      state.statsType = statType.dataset.statType;
      render();
      return;
    }

    const calendarDate = event.target.closest("[data-calendar-date]");
    if (calendarDate) {
      state.selectedDate = calendarDate.dataset.calendarDate;
      state.calendarMonth = startOfMonth(state.selectedDate);
      render();
      return;
    }

    const weekRow = event.target.closest("[data-week-start]");
    if (weekRow) {
      state.selectedDate = weekRow.dataset.weekStart;
      state.calendarMonth = startOfMonth(state.selectedDate);
      render();
      return;
    }

    const dateRow = event.target.closest("[data-date]");
    if (dateRow) {
      state.selectedDate = dateRow.dataset.date;
      state.calendarMonth = startOfMonth(state.selectedDate);
      state.activeTab = "calendar";
      render();
      return;
    }

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      state.planFilter = filter.dataset.filter;
      render();
    }
  });

  app.addEventListener("input", (event) => {
    const field = event.target.closest("[data-field]");
    if (!field) return;
    saveRecordField(state.selectedDate, { [field.dataset.field]: field.value });
    if (field.dataset.field === "rpe") {
      const value = field.closest(".range-row")?.querySelector(".rpe-value");
      if (value) value.textContent = field.value;
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  render();
})();
