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
    activeTab: "today",
    selectedDate: resolveInitialDate(),
    planFilter: "upcoming",
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

  function startOfWeek(iso) {
    const date = parseISO(iso);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return toISO(date);
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
    const titleDate = selectedPlan ? formatDate(selectedPlan.date, selectedPlan.weekday) : state.selectedDate;

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
          ${tabButton("today", "今日")}
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
    if (state.activeTab === "week") return renderWeekTab();
    if (state.activeTab === "plan") return renderPlanTab();
    if (state.activeTab === "sync") return renderSyncTab();
    return renderTodayTab();
  }

  function renderTodayTab() {
    const plan = planByDate.get(state.selectedDate);
    const tomorrow = planByDate.get(addDays(state.selectedDate, 1));

    if (!plan) {
      return `<div class="empty">这一天不在当前训练计划里</div>`;
    }

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

  function renderCheckin(plan) {
    const record = recordFor(plan.date);
    const status = record.status || "";
    const actualDistance = record.actualDistance ?? "";
    const rpe = record.rpe || 5;
    const note = record.note || "";

    return `
      <section class="card checkin">
        <div class="section-title">
          <h2>打卡</h2>
          <span>${escapeHTML(statusText(status))}</span>
        </div>
        <div class="status-grid">
          ${statusButton("done", "完成", status)}
          ${statusButton("adjusted", "调整", status)}
          ${statusButton("missed", "未完成", status)}
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="actualDistance">实际距离</label>
            <input id="actualDistance" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHTML(actualDistance)}" placeholder="${plan.distance ? distanceText(plan.distance).replace(" km", "") : "0"}" data-field="actualDistance" />
          </div>
          <div class="field">
            <label for="rpe">体感</label>
            <div class="range-row">
              <input id="rpe" type="range" min="1" max="10" step="1" value="${escapeHTML(rpe)}" data-field="rpe" />
              <span class="rpe-value">${escapeHTML(rpe)}</span>
            </div>
          </div>
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

  function renderWeekTab() {
    const weekStart = startOfWeek(state.selectedDate);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, plan: planByDate.get(date), record: recordFor(date) };
    });
    const plannedDistance = days.reduce((sum, item) => sum + (item.plan?.distance || 0), 0);
    const actualDistance = days.reduce((sum, item) => {
      const typed = Number(item.record.actualDistance);
      if (Number.isFinite(typed) && typed > 0) return sum + typed;
      if (item.record.status === "done") return sum + (item.plan?.distance || 0);
      return sum;
    }, 0);
    const completedDays = days.filter((item) => item.record.status === "done").length;
    const adjustedDays = days.filter((item) => item.record.status === "adjusted").length;
    const missedDays = days.filter((item) => item.record.status === "missed").length;

    return `
      <section class="section-title">
        <h2>${shortDate(weekStart)} - ${shortDate(addDays(weekStart, 6))}</h2>
        <span>本周复盘</span>
      </section>
      <section class="summary-grid">
        <div class="summary-card"><span>本周跑量</span><strong>${Number(plannedDistance.toFixed(1))}</strong></div>
        <div class="summary-card"><span>已完成</span><strong>${Number(actualDistance.toFixed(1))}</strong></div>
        <div class="summary-card"><span>完成天数</span><strong>${completedDays}</strong></div>
      </section>
      <section class="advice">${escapeHTML(weeklyAdvice(plannedDistance, actualDistance, completedDays, adjustedDays, missedDays))}</section>
      <section class="week-list">
        ${days.map((item) => renderDayRow(item.date, item.plan, item.record)).join("")}
      </section>
    `;
  }

  function weeklyAdvice(planned, actual, done, adjusted, missed) {
    if (planned > 0 && actual > planned * 1.15) return "这周实际跑量偏高，接下来两天优先恢复，不要为了状态好继续加码。";
    if (missed >= 2) return "这周漏练偏多，不建议补齐所有跑量，保留下一次关键课或周末长距离就好。";
    if (adjusted >= 2) return "这周身体可能有些波动，质量课可以降强度，轻松跑继续慢。";
    if (done >= 4 || actual >= planned * 0.8) return "节奏不错，继续把轻松跑压慢，周末训练看恢复情况执行。";
    return "这周先稳住，不急着追跑量。能完成下一次计划训练，就已经是在往前走。";
  }

  function renderDayRow(date, plan, record) {
    const active = date === state.selectedDate ? " active" : "";
    const category = plan?.category || "无计划";
    const distance = plan ? distanceText(plan.distance) : "0 km";
    return `
      <button class="day-row${active}" data-date="${date}">
        <span class="row-date">${shortDate(date)}</span>
        <span class="row-main">
          <strong>${escapeHTML(category)}</strong>
          <span>${escapeHTML(distance)} · ${escapeHTML(plan?.duration || "灵活")}</span>
        </span>
        <span class="row-status ${statusClass(record.status)}">${escapeHTML(statusText(record.status))}</span>
      </button>
    `;
  }

  function renderPlanTab() {
    const filters = `
      <div class="filter-row">
        ${filterButton("upcoming", "接下来")}
        ${filterButton("all", "全部")}
        ${filterButton("race", "比赛")}
      </div>
    `;
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
    if (state.planFilter === "all") {
      return PLAN.filter((item) => item.date >= "2026-06-29");
    }
    return PLAN.filter((item) => item.date >= state.selectedDate).slice(0, 21);
  }

  function renderPlanRow(plan) {
    const record = recordFor(plan.date);
    const active = plan.date === state.selectedDate ? " active" : "";
    return `
      <button class="plan-row${active}" data-date="${plan.date}">
        <span class="row-date">${shortDate(plan.date)}<br>${escapeHTML(plan.weekday)}</span>
        <span class="row-main">
          <strong>${escapeHTML(plan.category)}</strong>
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
      render();
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      if (action.dataset.action === "prev-day") state.selectedDate = addDays(state.selectedDate, -1);
      if (action.dataset.action === "next-day") state.selectedDate = addDays(state.selectedDate, 1);
      if (action.dataset.action === "today") state.selectedDate = resolveInitialDate();
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
      render();
      return;
    }

    const status = event.target.closest("[data-status]");
    if (status) {
      updateRecord(state.selectedDate, { status: status.dataset.status });
      return;
    }

    const dateRow = event.target.closest("[data-date]");
    if (dateRow) {
      state.selectedDate = dateRow.dataset.date;
      state.activeTab = "today";
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
