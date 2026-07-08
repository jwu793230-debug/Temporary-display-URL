(() => {
  "use strict";

  const STORAGE_KEY = "wfd.state.v1";
  const THEME_KEY = "wfd.theme";
  const TOKEN_KEY = "wfd.github.token";
  const DEVICE_KEY = "wfd.device.v1";
  const ROUTES = ["home", "kitchen", "family", "plans", "sync"];
  const CURRENT_STATE_VERSION = "local-pwa-v2-meal-defaults";
  const defaultSyncConfig = {
    owner: "jwu793230-debug",
    repo: "Temporary-display-URL",
    branch: "main",
    path: "whats-for-dinner-pwa/data/whats-for-dinner.json"
  };

  const mealTypes = [
    { id: "breakfast", label: "早餐" },
    { id: "lunch", label: "午餐" },
    { id: "dinner", label: "晚餐" },
    { id: "snack", label: "加餐" }
  ];

  const unitOptions = ["份", "个", "颗", "克", "袋", "盒", "把", "瓶"];
  const categoryOptions = ["蔬菜", "肉蛋", "主食", "调味", "水果", "其他"];
  const areaOptions = ["冷藏", "冷冻", "常温", "厨房台面"];
  const defaultFamily = [
    {
      id: "lulu",
      name: "噜噜",
      role: "家庭成员",
      prefer: "米饭、牛肉、家常菜",
      avoid: "香菜"
    },
    {
      id: "lumeier",
      name: "噜妹儿",
      role: "家庭成员",
      prefer: "少油、蔬菜多一点、汤菜",
      avoid: "太辣"
    },
    {
      id: "tuantuan",
      name: "团团",
      role: "家庭成员",
      prefer: "鸡蛋、番茄、面条、口味温和",
      avoid: "辣椒"
    }
  ];
  const defaultMealParticipants = {
    breakfast: ["lumeier", "tuantuan"],
    lunch: ["lumeier"],
    dinner: ["lulu", "lumeier", "tuantuan"],
    snack: ["lumeier", "tuantuan"]
  };
  const legacyMemberIdMap = {
    dad: "lulu",
    mom: "lumeier",
    child: "tuantuan"
  };
  const legacyMemberNameMap = {
    dad: "噜噜",
    mom: "噜妹儿",
    child: "团团"
  };

  const dishBank = [
    {
      id: "tomato-egg-rice",
      name: "番茄鸡蛋盖饭",
      mealTypes: ["lunch", "dinner"],
      time: "22 分钟",
      difficulty: "简单",
      tags: ["家常", "快手", "孩子友好"],
      ingredients: [
        { name: "番茄", qty: 2, unit: "个" },
        { name: "鸡蛋", qty: 3, unit: "个" },
        { name: "米饭", qty: 2, unit: "份" }
      ],
      steps: ["番茄切块，鸡蛋打散。", "先炒鸡蛋盛出，再炒番茄出汁。", "回锅合炒，盖在热米饭上。"]
    },
    {
      id: "beef-broccoli-rice",
      name: "西兰花牛肉饭",
      mealTypes: ["lunch", "dinner"],
      time: "30 分钟",
      difficulty: "中等",
      tags: ["高蛋白", "少油", "便当"],
      ingredients: [
        { name: "牛肉", qty: 250, unit: "克" },
        { name: "西兰花", qty: 1, unit: "颗" },
        { name: "米饭", qty: 2, unit: "份" }
      ],
      steps: ["牛肉切片腌 10 分钟。", "西兰花焯水断生。", "牛肉大火快炒，再和西兰花合炒调味。"]
    },
    {
      id: "baby-cabbage-soup",
      name: "娃娃菜肉丸汤",
      mealTypes: ["lunch", "dinner"],
      time: "25 分钟",
      difficulty: "简单",
      tags: ["清淡", "汤菜", "暖胃"],
      ingredients: [
        { name: "娃娃菜", qty: 1, unit: "颗" },
        { name: "肉丸", qty: 8, unit: "个" },
        { name: "鸡蛋", qty: 1, unit: "个" }
      ],
      steps: ["水开后放肉丸煮透。", "加入娃娃菜煮软。", "淋入蛋液，少盐调味。"]
    },
    {
      id: "green-pepper-potato-noodle",
      name: "青椒土豆丝拌面",
      mealTypes: ["lunch", "dinner"],
      time: "24 分钟",
      difficulty: "简单",
      tags: ["快手", "主食", "清库存"],
      ingredients: [
        { name: "青椒", qty: 2, unit: "个" },
        { name: "土豆", qty: 2, unit: "个" },
        { name: "面条", qty: 2, unit: "份" }
      ],
      steps: ["土豆切丝冲洗淀粉。", "青椒土豆丝大火快炒。", "面条煮好后拌入浇头。"]
    },
    {
      id: "shrimp-egg-fried-rice",
      name: "虾仁鸡蛋炒饭",
      mealTypes: ["breakfast", "lunch", "dinner"],
      time: "18 分钟",
      difficulty: "简单",
      tags: ["快手", "剩饭友好", "鲜香"],
      ingredients: [
        { name: "虾仁", qty: 120, unit: "克" },
        { name: "鸡蛋", qty: 2, unit: "个" },
        { name: "米饭", qty: 2, unit: "份" }
      ],
      steps: ["虾仁煎至变色。", "鸡蛋炒散后加入米饭。", "放虾仁和葱花翻匀。"]
    },
    {
      id: "beef-greens-noodle",
      name: "牛肉青菜面",
      mealTypes: ["breakfast", "lunch", "dinner"],
      time: "20 分钟",
      difficulty: "简单",
      tags: ["热汤面", "高蛋白", "省事"],
      ingredients: [
        { name: "牛肉", qty: 180, unit: "克" },
        { name: "青菜", qty: 1, unit: "把" },
        { name: "面条", qty: 2, unit: "份" }
      ],
      steps: ["牛肉切片快炒或焯熟。", "另起锅煮面和青菜。", "加牛肉和汤底调味。"]
    },
    {
      id: "mushroom-chicken-rice",
      name: "香菇鸡腿焖饭",
      mealTypes: ["lunch", "dinner"],
      time: "40 分钟",
      difficulty: "中等",
      tags: ["一锅出", "香味足", "省洗锅"],
      ingredients: [
        { name: "鸡腿肉", qty: 300, unit: "克" },
        { name: "香菇", qty: 6, unit: "个" },
        { name: "米饭", qty: 2, unit: "份" }
      ],
      steps: ["鸡腿肉切块腌制。", "香菇煸香后加入鸡肉。", "和米饭一起焖熟，出锅拌匀。"]
    },
    {
      id: "family-hotpot",
      name: "家庭清库存小火锅",
      mealTypes: ["dinner"],
      time: "35 分钟",
      difficulty: "简单",
      tags: ["多人", "清库存", "互动"],
      ingredients: [
        { name: "娃娃菜", qty: 1, unit: "颗" },
        { name: "肉丸", qty: 8, unit: "个" },
        { name: "面条", qty: 2, unit: "份" }
      ],
      steps: ["准备汤底和蘸料。", "先下耐煮食材，再下蔬菜。", "最后煮面收尾。"]
    },
    {
      id: "banana-yogurt",
      name: "香蕉酸奶杯",
      mealTypes: ["breakfast", "snack"],
      time: "6 分钟",
      difficulty: "简单",
      tags: ["免开火", "加餐", "孩子友好"],
      ingredients: [
        { name: "香蕉", qty: 1, unit: "根" },
        { name: "酸奶", qty: 1, unit: "盒" }
      ],
      steps: ["香蕉切片。", "倒入酸奶。", "可加坚果或麦片。"]
    }
  ];

  const appShell = document.getElementById("app");
  const viewRoot = document.getElementById("viewRoot");
  const syncBadge = document.getElementById("syncBadge");

  let state = loadState();

  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  ensureRouteFromHash();
  render();
  registerServiceWorker();

  window.addEventListener("hashchange", () => {
    ensureRouteFromHash();
    render();
  });

  document.addEventListener("click", async (event) => {
    const modalClose = event.target.closest("[data-modal-close]");
    if (modalClose) {
      closeModal();
      return;
    }

    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      event.preventDefault();
      setRoute(routeButton.dataset.route);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    try {
      if (action === "toggle-theme") toggleTheme();
      if (action === "set-meal") setMeal(actionButton.dataset.meal);
      if (action === "toggle-participant") toggleParticipant(actionButton.dataset.id);
      if (action === "select-default-participants") selectDefaultParticipants();
      if (action === "generate-recommendations") generateRecommendations();
      if (action === "confirm-recommendation") confirmRecommendation();
      if (action === "adjust-inventory") adjustInventory(actionButton.dataset.id, Number(actionButton.dataset.delta));
      if (action === "delete-inventory") deleteInventory(actionButton.dataset.id);
      if (action === "complete-plan") completePlan(actionButton.dataset.id);
      if (action === "delete-plan") deletePlan(actionButton.dataset.id);
      if (action === "delete-log") deleteLog(actionButton.dataset.id);
      if (action === "export-json") openExportModal();
      if (action === "open-import") openImportModal();
      if (action === "import-json") importJsonFromModal();
      if (action === "pull-github") await pullFromGitHub();
      if (action === "push-github") await pushToGitHub();
      if (action === "open-ai-packet") openAiPacketModal();
      if (action === "copy-modal-text") await copyModalText(actionButton.dataset.target);
      if (action === "reset-demo") resetDemoData();
    } catch (error) {
      console.error(error);
      toast(error.message || "操作没有成功，请稍后再试");
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest('[data-action="toggle-dish"]');
    if (!checkbox) return;
    toggleDishSelection(checkbox.dataset.id, checkbox.checked);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();

    if (form.dataset.form === "inventory") saveInventoryForm(form);
    if (form.dataset.form === "member") saveMemberForm(form);
    if (form.dataset.form === "sync") saveSyncForm(form);
  });

  function createDefaultState() {
    const now = new Date().toISOString();
    return {
      version: CURRENT_STATE_VERSION,
      route: "home",
      selectedMeal: "dinner",
      selectedParticipants: [...defaultMealParticipants.dinner],
      mealDefaults: cloneMealDefaults(defaultMealParticipants),
      family: defaultFamily.map((member) => ({ ...member })),
      inventory: [
        makeItem("番茄", 4, "个", "蔬菜", "冷藏", 2),
        makeItem("鸡蛋", 8, "个", "肉蛋", "冷藏", 8),
        makeItem("牛肉", 380, "克", "肉蛋", "冷冻", 10),
        makeItem("西兰花", 1, "颗", "蔬菜", "冷藏", 3),
        makeItem("娃娃菜", 2, "颗", "蔬菜", "冷藏", 5),
        makeItem("米饭", 3, "份", "主食", "冷藏", 1),
        makeItem("面条", 4, "份", "主食", "常温", 30),
        makeItem("肉丸", 10, "个", "肉蛋", "冷冻", 14),
        makeItem("青菜", 1, "把", "蔬菜", "冷藏", 2),
        makeItem("香蕉", 3, "根", "水果", "厨房台面", 4),
        makeItem("酸奶", 2, "盒", "水果", "冷藏", 6)
      ],
      recommendations: [],
      selectedDishes: [],
      plans: [],
      logs: [],
      activity: [],
      pendingEvents: [],
      sync: {
        ...defaultSyncConfig,
        remoteSha: "",
        lastPulledAt: "",
        lastPushedAt: "",
        lastSyncedBy: ""
      },
      createdAt: now,
      updatedAt: now
    };
  }

  function makeItem(name, qty, unit, category, area, days) {
    return {
      id: uid("item"),
      name,
      qty,
      unit,
      category,
      area,
      expiresAt: addDays(days),
      updatedAt: new Date().toISOString()
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const next = normalizeState(raw ? JSON.parse(raw) : createDefaultState());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch (error) {
      console.warn("Failed to load saved state", error);
      return createDefaultState();
    }
  }

  function normalizeState(input) {
    const base = createDefaultState();
    const next = { ...base, ...(input || {}) };
    const isLegacyState = !input || input.version !== CURRENT_STATE_VERSION;
    next.family = Array.isArray(next.family) && next.family.length ? next.family.map(normalizeMember) : base.family;
    next.family = dedupeMembers(next.family);
    next.inventory = Array.isArray(next.inventory) ? next.inventory.map(normalizeItem) : base.inventory;
    next.recommendations = Array.isArray(next.recommendations) ? next.recommendations : [];
    next.selectedDishes = Array.isArray(next.selectedDishes) ? next.selectedDishes : [];
    next.plans = Array.isArray(next.plans) ? next.plans.map(normalizePlanParticipants) : [];
    next.logs = Array.isArray(next.logs) ? next.logs : [];
    next.activity = Array.isArray(next.activity) ? next.activity.slice(0, 80) : [];
    next.pendingEvents = Array.isArray(next.pendingEvents) ? next.pendingEvents.slice(0, 80) : [];
    next.sync = { ...base.sync, ...(next.sync || {}) };
    next.sync = normalizeSyncConfig(next.sync);
    delete next.sync.token;
    next.route = ROUTES.includes(next.route) ? next.route : "home";
    next.selectedMeal = mealTypes.some((meal) => meal.id === next.selectedMeal) ? next.selectedMeal : "dinner";
    next.mealDefaults = normalizeMealDefaults(next.mealDefaults, next.family);

    const memberIds = new Set(next.family.map((member) => member.id));
    next.selectedParticipants = Array.isArray(next.selectedParticipants)
      ? next.selectedParticipants.map(mapMemberId).filter((id) => memberIds.has(id))
      : [];
    if (isLegacyState || !next.selectedParticipants.length) {
      next.selectedParticipants = getMealDefaultParticipantsFor(next.selectedMeal, next);
    }
    next.version = CURRENT_STATE_VERSION;
    return next;
  }

  function normalizeMember(member) {
    const id = mapMemberId(member.id || "");
    const defaultMember = defaultFamily.find((item) => item.id === id);
    const wasLegacy = id !== member.id;
    return {
      id: id || uid("member"),
      name: String((wasLegacy && legacyMemberNameMap[member.id]) || member.name || defaultMember?.name || "家庭成员").trim(),
      role: String(member.role || defaultMember?.role || "家庭成员").trim(),
      prefer: String(member.prefer || defaultMember?.prefer || "").trim(),
      avoid: String(member.avoid || defaultMember?.avoid || "").trim(),
      defaultParticipant: Boolean(member.defaultParticipant)
    };
  }

  function dedupeMembers(members) {
    const seen = new Set();
    return members.filter((member) => {
      if (seen.has(member.id)) return false;
      seen.add(member.id);
      return true;
    });
  }

  function normalizePlanParticipants(plan) {
    return {
      ...plan,
      participants: Array.isArray(plan.participants) ? plan.participants.map(mapMemberId) : []
    };
  }

  function normalizeMealDefaults(value, family) {
    const memberIds = new Set(family.map((member) => member.id));
    return mealTypes.reduce((acc, meal) => {
      const inputIds = Array.isArray(value?.[meal.id]) ? value[meal.id] : defaultMealParticipants[meal.id] || [];
      const fallbackIds = defaultMealParticipants[meal.id] || [];
      const ids = inputIds.map(mapMemberId).filter((id) => memberIds.has(id));
      acc[meal.id] = Array.from(new Set(ids.length ? ids : fallbackIds.filter((id) => memberIds.has(id))));
      return acc;
    }, {});
  }

  function cloneMealDefaults(value) {
    return Object.fromEntries(Object.entries(value).map(([meal, ids]) => [meal, [...ids]]));
  }

  function mapMemberId(id) {
    return legacyMemberIdMap[id] || id;
  }

  function normalizeItem(item) {
    return {
      id: item.id || uid("item"),
      name: String(item.name || "食材").trim(),
      qty: Number(item.qty) || 0,
      unit: item.unit || "份",
      category: item.category || "其他",
      area: item.area || "常温",
      expiresAt: item.expiresAt || "",
      updatedAt: item.updatedAt || new Date().toISOString()
    };
  }

  function normalizeSyncConfig(sync) {
    return {
      ...sync,
      owner: String(sync.owner || defaultSyncConfig.owner).trim(),
      repo: String(sync.repo || defaultSyncConfig.repo).trim(),
      branch: String(sync.branch || defaultSyncConfig.branch).trim(),
      path: String(sync.path || defaultSyncConfig.path).trim()
    };
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncBadge();
  }

  function recordChange(type, label, payload = {}) {
    const event = {
      id: uid("evt"),
      type,
      label,
      payload,
      at: new Date().toISOString(),
      deviceId: getDeviceId()
    };
    state.activity = [event, ...(state.activity || [])].slice(0, 80);
    state.pendingEvents = [event, ...(state.pendingEvents || [])].slice(0, 80);
    saveState();
  }

  function render() {
    updateActiveNav();
    updateSyncBadge();
    const views = {
      home: renderHome,
      kitchen: renderKitchen,
      family: renderFamily,
      plans: renderPlans,
      sync: renderSync
    };
    viewRoot.innerHTML = views[state.route]();
  }

  function renderHome() {
    const stats = getStats();
    const selectedMembers = getSelectedMembers();
    const mealLabel = mealTypes.find((meal) => meal.id === state.selectedMeal)?.label || "晚餐";

    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">今晚吃什么</h1>
          <p class="view-subtitle">先按家里现有食材和成员口味给出本地规则建议；需要 AI 介入时，再把 GitHub 数据交给 Codex 生成更细的建议。</p>
        </div>
        <button class="btn green" type="button" data-action="generate-recommendations">生成${escapeHtml(mealLabel)}建议</button>
      </div>

      <section class="grid cols-3">
        ${metricCard("库存食材", `${stats.inventoryCount} 项`, `${stats.expiringCount} 项 3 天内到期`, "yellow")}
        ${metricCard("待做餐单", `${stats.openPlans} 个`, `${stats.completedPlans} 个已完成`, "blue")}
        ${metricCard("同步状态", `${state.pendingEvents.length} 条`, state.pendingEvents.length ? "等待推送到 GitHub" : "本地已整理", "green")}
      </section>

      <div class="section-title">
        <h2>餐次</h2>
        <div class="meal-tabs">
          ${mealTypes.map((meal) => `
            <button class="tab-button ${meal.id === state.selectedMeal ? "active" : ""}" type="button" data-action="set-meal" data-meal="${meal.id}">
              ${escapeHtml(meal.label)}
            </button>
          `).join("")}
        </div>
      </div>

      <section class="card">
        <div class="item-head">
          <div>
            <strong>今天一起吃饭</strong>
            <p class="muted">${selectedMembers.map((member) => member.name).join("、") || "还没有选择成员"}</p>
          </div>
          <button class="btn secondary" type="button" data-action="select-default-participants">本餐默认</button>
        </div>
        <div class="chip-row">
          ${state.family.map((member) => `
            <button class="chip member ${state.selectedParticipants.includes(member.id) ? "active" : ""}" type="button" data-action="toggle-participant" data-id="${member.id}">
              ${escapeHtml(member.name)}
            </button>
          `).join("")}
        </div>
      </section>

      <div class="section-title">
        <h2>推荐餐单</h2>
        <button class="btn secondary" type="button" data-action="confirm-recommendation" ${state.selectedDishes.length ? "" : "disabled"}>确认为待做餐单</button>
      </div>

      <section class="recommendation-list">
        ${state.recommendations.length ? state.recommendations.map(renderDishCard).join("") : emptyState("还没有推荐", "点上面的按钮，先用本地规则跑一版。")}
      </section>
    `;
  }

  function metricCard(label, value, hint, tone) {
    return `
      <article class="card ${tone}">
        <div class="metric">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(hint)}</small>
        </div>
      </article>
    `;
  }

  function renderDishCard(item) {
    const checked = state.selectedDishes.includes(item.id);
    return `
      <article class="dish-card">
        <input type="checkbox" data-action="toggle-dish" data-id="${escapeAttr(item.id)}" ${checked ? "checked" : ""} aria-label="选择${escapeAttr(item.name)}">
        <div>
          <div class="item-head">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <p class="muted">${escapeHtml(item.time)} · ${escapeHtml(item.difficulty)} · 匹配分 ${Math.round(item.score)}</p>
            </div>
            <span class="tag green">${item.missing.length ? `缺 ${item.missing.length} 项` : "可直接做"}</span>
          </div>
          <div class="tag-row">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            ${item.reasons.map((reason) => `<span class="tag blue">${escapeHtml(reason)}</span>`).join("")}
          </div>
          <p class="muted">食材：${item.ingredients.map(formatIngredient).join("、")}</p>
          <p class="muted">步骤：${item.steps.join(" / ")}</p>
        </div>
      </article>
    `;
  }

  function renderKitchen() {
    const sorted = sortedInventory();
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">厨房库存</h1>
          <p class="view-subtitle">库存是配餐建议的核心数据。数量变动、到期时间、存放位置都会进入同步数据。</p>
        </div>
      </div>

      <form class="form-card" data-form="inventory">
        <div class="form-grid">
          <div class="field">
            <label>食材</label>
            <input name="name" required placeholder="例如 番茄">
          </div>
          <div class="field">
            <label>数量</label>
            <input name="qty" type="number" min="0" step="0.1" required value="1">
          </div>
          <div class="field">
            <label>单位</label>
            <select name="unit">${unitOptions.map(optionTag).join("")}</select>
          </div>
          <div class="field">
            <label>分类</label>
            <select name="category">${categoryOptions.map(optionTag).join("")}</select>
          </div>
          <div class="field">
            <label>位置</label>
            <select name="area">${areaOptions.map(optionTag).join("")}</select>
          </div>
          <div class="field">
            <label>到期</label>
            <input name="expiresAt" type="date" value="${addDays(5)}">
          </div>
          <div class="field full">
            <button class="btn green" type="submit">加入库存</button>
          </div>
        </div>
      </form>

      <div class="section-title">
        <h2>现有食材</h2>
        <span class="tag">${sorted.length} 项</span>
      </div>

      <section class="inventory-list">
        ${sorted.length ? sorted.map(renderInventoryCard).join("") : emptyState("厨房是空的", "先加几样常用食材。")}
      </section>
    `;
  }

  function renderInventoryCard(item) {
    const days = daysUntil(item.expiresAt);
    const tagClass = days < 0 || days <= 1 ? "red" : days <= 3 ? "blue" : "green";
    return `
      <article class="inventory-card">
        <div>
          <div class="item-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="tag ${tagClass}">${escapeHtml(expiryLabel(item.expiresAt))}</span>
          </div>
          <div class="tag-row">
            <span class="tag">${escapeHtml(item.category)}</span>
            <span class="tag">${escapeHtml(item.area)}</span>
            <span class="tag">${escapeHtml(formatQty(item.qty, item.unit))}</span>
          </div>
        </div>
        <div class="quantity-controls">
          <button class="quantity-button" type="button" data-action="adjust-inventory" data-id="${escapeAttr(item.id)}" data-delta="-1" aria-label="减少${escapeAttr(item.name)}">-</button>
          <span class="quantity-value">${escapeHtml(shortNumber(item.qty))}</span>
          <button class="quantity-button" type="button" data-action="adjust-inventory" data-id="${escapeAttr(item.id)}" data-delta="1" aria-label="增加${escapeAttr(item.name)}">+</button>
        </div>
        <button class="btn secondary" type="button" data-action="delete-inventory" data-id="${escapeAttr(item.id)}">移除</button>
      </article>
    `;
  }

  function renderFamily() {
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">家庭口味</h1>
          <p class="view-subtitle">每个成员的偏好、忌口和餐次默认参与状态会影响本地配餐推荐。</p>
        </div>
      </div>

      <section class="grid">
        ${state.family.map(renderMemberCard).join("")}
      </section>
    `;
  }

  function renderMemberCard(member) {
    return `
      <form class="member-card" data-form="member" data-id="${escapeAttr(member.id)}">
        <div class="form-grid">
          <div class="field">
            <label>称呼</label>
            <input name="name" required value="${escapeAttr(member.name)}">
          </div>
          <div class="field">
            <label>角色</label>
            <input name="role" value="${escapeAttr(member.role)}">
          </div>
          <div class="field full">
            <label>偏好</label>
            <textarea name="prefer">${escapeHtml(member.prefer)}</textarea>
          </div>
          <div class="field full">
            <label>忌口</label>
            <textarea name="avoid">${escapeHtml(member.avoid)}</textarea>
          </div>
          <div class="field full">
            <label>餐次默认</label>
            <div class="tag-row">
              ${renderMemberMealDefaultTags(member.id)}
            </div>
          </div>
          <button class="btn green" type="submit">保存成员</button>
        </div>
      </form>
    `;
  }

  function renderMemberMealDefaultTags(memberId) {
    const tags = mealTypes
      .filter((meal) => state.mealDefaults[meal.id]?.includes(memberId))
      .map((meal) => `<span class="tag green">${escapeHtml(meal.label)}</span>`);
    return tags.length ? tags.join("") : `<span class="tag">非默认</span>`;
  }

  function renderPlans() {
    const openPlans = state.plans.filter((plan) => plan.status !== "completed");
    const completedPlans = state.plans.filter((plan) => plan.status === "completed");
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">餐单执行</h1>
          <p class="view-subtitle">确认后的推荐会成为待做餐单。做完后扣减库存，并沉淀成家庭吃饭记录。</p>
        </div>
        <button class="btn secondary" type="button" data-action="export-json">导出数据</button>
      </div>

      <div class="section-title">
        <h2>待做</h2>
        <span class="tag">${openPlans.length} 个</span>
      </div>
      <section class="plan-list">
        ${openPlans.length ? openPlans.map(renderPlanCard).join("") : emptyState("暂无待做餐单", "先去首页生成并确认一组推荐。")}
      </section>

      <div class="section-title">
        <h2>已完成</h2>
        <span class="tag">${completedPlans.length} 个</span>
      </div>
      <section class="plan-list">
        ${completedPlans.length ? completedPlans.map(renderPlanCard).join("") : emptyState("还没有完成记录", "做完一餐后会出现在这里。")}
      </section>

      <div class="section-title">
        <h2>吃饭日志</h2>
        <span class="tag">${state.logs.length} 条</span>
      </div>
      <section class="log-list">
        ${state.logs.length ? state.logs.map(renderLogCard).join("") : emptyState("日志为空", "完成餐单后自动记录。")}
      </section>
    `;
  }

  function renderPlanCard(plan) {
    const mealLabel = mealTypes.find((meal) => meal.id === plan.mealType)?.label || plan.mealType;
    const names = plan.participants.map((id) => state.family.find((member) => member.id === id)?.name || id);
    return `
      <article class="plan-card">
        <div class="item-head">
          <div>
            <strong>${escapeHtml(mealLabel)} · ${escapeHtml(plan.dishes.map((dish) => dish.name).join(" + "))}</strong>
            <p class="muted">${escapeHtml(formatDate(plan.createdAt))} · ${escapeHtml(names.join("、"))}</p>
          </div>
          <span class="tag ${plan.status === "completed" ? "green" : "blue"}">${plan.status === "completed" ? "已完成" : "待做"}</span>
        </div>
        <div class="tag-row">
          ${plan.dishes.flatMap((dish) => dish.tags || []).slice(0, 8).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <p class="muted">食材：${plan.dishes.flatMap((dish) => dish.ingredients.map(formatIngredient)).join("、")}</p>
        <div class="chip-row">
          ${plan.status === "completed" ? "" : `<button class="btn green" type="button" data-action="complete-plan" data-id="${escapeAttr(plan.id)}">做完并扣库存</button>`}
          <button class="btn secondary" type="button" data-action="delete-plan" data-id="${escapeAttr(plan.id)}">删除餐单</button>
        </div>
      </article>
    `;
  }

  function renderLogCard(log) {
    return `
      <article class="log-card">
        <div class="item-head">
          <div>
            <strong>${escapeHtml(log.title)}</strong>
            <p class="muted">${escapeHtml(formatDate(log.cookedAt))} · ${escapeHtml(log.mealLabel)}</p>
          </div>
          <button class="btn secondary" type="button" data-action="delete-log" data-id="${escapeAttr(log.id)}">删除</button>
        </div>
        <p class="muted">${escapeHtml(log.note)}</p>
      </article>
    `;
  }

  function renderSync() {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const sync = normalizeSyncConfig(state.sync);
    const progress = state.pendingEvents.length ? 68 : 100;
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">GitHub 同步</h1>
          <p class="view-subtitle">GitHub 用户名、仓库、分支和数据路径已经默认填好；第一次只需要粘贴 token 并保存。Token 只保存在当前浏览器。</p>
        </div>
      </div>

      <section class="grid cols-3">
        ${metricCard("待同步", `${state.pendingEvents.length} 条`, state.pendingEvents.length ? "本机有新变化" : "没有待推送变化", "yellow")}
        ${metricCard("最近推送", sync.lastPushedAt ? formatDate(sync.lastPushedAt) : "未推送", sync.lastSyncedBy ? `设备 ${sync.lastSyncedBy.slice(-6)}` : "本地演示数据", "blue")}
        ${metricCard("远端文件", sync.remoteSha ? sync.remoteSha.slice(0, 7) : "未连接", sync.path, "green")}
      </section>

      <form class="form-card sync-box" data-form="sync">
        <div class="form-grid">
          <div class="field">
            <label>Owner</label>
            <input name="owner" value="${escapeAttr(sync.owner)}">
          </div>
          <div class="field">
            <label>Repo</label>
            <input name="repo" value="${escapeAttr(sync.repo)}">
          </div>
          <div class="field">
            <label>Branch</label>
            <input name="branch" value="${escapeAttr(sync.branch)}">
          </div>
          <div class="field">
            <label>Data Path</label>
            <input name="path" value="${escapeAttr(sync.path)}">
          </div>
          <div class="field full">
            <label>Fine-grained Token</label>
            <input name="token" type="password" autocomplete="off" value="${escapeAttr(token)}" placeholder="这里粘贴一次 token">
          </div>
          <div class="field full">
            <button class="btn green" type="submit">保存同步配置</button>
          </div>
        </div>
      </form>

      <section class="card sync-status">
        <strong>同步进度</strong>
        <div class="progress" style="--progress: ${progress}%"><span></span></div>
        <p class="muted">${state.pendingEvents.length ? "本机有变化，推送后其他家庭成员可拉取。" : "本机数据已处于可同步状态。"}</p>
        <div class="chip-row">
          <button class="btn green" type="button" data-action="push-github">推送到 GitHub</button>
          <button class="btn secondary" type="button" data-action="pull-github">从 GitHub 拉取</button>
          <button class="btn secondary" type="button" data-action="export-json">导出 JSON</button>
          <button class="btn secondary" type="button" data-action="open-import">导入 JSON</button>
          <button class="btn secondary" type="button" data-action="open-ai-packet">Codex 数据包</button>
          <button class="btn secondary danger" type="button" data-action="reset-demo">重置演示数据</button>
        </div>
      </section>

      <div class="section-title">
        <h2>最近变化</h2>
        <span class="tag">${state.activity.length} 条</span>
      </div>
      <section class="log-list">
        ${state.activity.length ? state.activity.slice(0, 8).map((event) => `
          <article class="log-card">
            <strong>${escapeHtml(event.label)}</strong>
            <p class="muted">${escapeHtml(formatDate(event.at))} · ${escapeHtml(event.type)}</p>
          </article>
        `).join("") : emptyState("还没有变化记录", "新增库存、确认餐单后会自动记录。")}
      </section>
    `;
  }

  function generateRecommendations() {
    if (!state.selectedParticipants.length) {
      toast("先选择今天一起吃饭的人");
      return;
    }

    const selectedMembers = getSelectedMembers();
    const avoids = selectedMembers.flatMap((member) => splitWords(member.avoid));
    const prefs = selectedMembers.flatMap((member) => splitWords(member.prefer));
    const recommendations = dishBank
      .filter((dish) => dish.mealTypes.includes(state.selectedMeal))
      .filter((dish) => !hasAvoidedIngredient(dish, avoids))
      .map((dish) => scoreDish(dish, prefs))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!recommendations.length) {
      state.recommendations = [];
      state.selectedDishes = [];
      recordChange("recommendation_empty", "生成餐单建议未命中", { mealType: state.selectedMeal });
      render();
      toast("没有命中合适餐单，可以先补充库存或调整忌口");
      return;
    }

    state.recommendations = recommendations;
    state.selectedDishes = recommendations.slice(0, 1).map((dish) => dish.id);
    recordChange("recommendation_generated", "生成餐单建议", {
      mealType: state.selectedMeal,
      participants: state.selectedParticipants,
      dishes: recommendations.map((dish) => dish.name)
    });
    render();
    toast("已生成一组本地建议");
  }

  function scoreDish(dish, prefs) {
    const missing = [];
    const stocked = [];
    const expiring = [];
    let score = 60;

    dish.ingredients.forEach((ingredient) => {
      const item = findInventoryByName(ingredient.name);
      if (!item || Number(item.qty) < Number(ingredient.qty)) {
        missing.push(ingredient.name);
        score -= 14;
        return;
      }
      stocked.push(ingredient.name);
      score += 12;
      if (daysUntil(item.expiresAt) <= 3) {
        expiring.push(ingredient.name);
        score += 18;
      }
    });

    prefs.forEach((word) => {
      if (!word) return;
      const haystack = `${dish.name} ${dish.tags.join(" ")} ${dish.ingredients.map((item) => item.name).join(" ")}`;
      if (haystack.includes(word)) score += 4;
    });

    const reasons = [];
    if (expiring.length) reasons.push(`优先用${expiring.slice(0, 2).join("、")}`);
    if (stocked.length) reasons.push(`${stocked.length} 项有库存`);
    if (missing.length) reasons.push(`需补${missing.slice(0, 2).join("、")}`);
    if (!missing.length) reasons.push("今晚可直接做");

    return {
      ...dish,
      score,
      missing,
      reasons
    };
  }

  function confirmRecommendation() {
    const selected = state.recommendations.filter((dish) => state.selectedDishes.includes(dish.id));
    if (!selected.length) {
      toast("先勾选要确认的菜");
      return;
    }

    const plan = {
      id: uid("plan"),
      mealType: state.selectedMeal,
      participants: [...state.selectedParticipants],
      dishes: selected.map((dish) => ({
        id: dish.id,
        name: dish.name,
        tags: dish.tags,
        time: dish.time,
        difficulty: dish.difficulty,
        ingredients: dish.ingredients,
        steps: dish.steps
      })),
      status: "confirmed",
      createdAt: new Date().toISOString()
    };
    state.plans.unshift(plan);
    recordChange("plan_confirmed", "确认待做餐单", {
      mealType: plan.mealType,
      dishes: plan.dishes.map((dish) => dish.name)
    });
    state.route = "plans";
    location.hash = "plans";
    render();
    toast("已加入待做餐单");
  }

  function completePlan(id) {
    const plan = state.plans.find((item) => item.id === id);
    if (!plan || plan.status === "completed") return;

    plan.dishes.forEach((dish) => {
      dish.ingredients.forEach((ingredient) => deductInventory(ingredient.name, ingredient.qty));
    });

    const mealLabel = mealTypes.find((meal) => meal.id === plan.mealType)?.label || plan.mealType;
    plan.status = "completed";
    plan.completedAt = new Date().toISOString();
    state.logs.unshift({
      id: uid("log"),
      planId: plan.id,
      title: plan.dishes.map((dish) => dish.name).join(" + "),
      mealLabel,
      cookedAt: plan.completedAt,
      note: "已按餐单完成，并扣减库存。"
    });

    recordChange("plan_completed", "完成餐单并扣减库存", {
      dishes: plan.dishes.map((dish) => dish.name)
    });
    render();
    toast("已完成，库存也更新了");
  }

  function saveInventoryForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const name = String(data.name || "").trim();
    const qty = Math.max(0, Number(data.qty) || 0);
    if (!name || !qty) {
      toast("食材和数量都要填");
      return;
    }

    const existing = state.inventory.find((item) =>
      normalizeText(item.name) === normalizeText(name)
      && item.unit === data.unit
      && item.area === data.area
    );

    if (existing) {
      existing.qty = roundQty(Number(existing.qty) + qty);
      existing.category = data.category || existing.category;
      existing.expiresAt = data.expiresAt || existing.expiresAt;
      existing.updatedAt = new Date().toISOString();
    } else {
      state.inventory.unshift({
        id: uid("item"),
        name,
        qty,
        unit: data.unit || "份",
        category: data.category || "其他",
        area: data.area || "常温",
        expiresAt: data.expiresAt || "",
        updatedAt: new Date().toISOString()
      });
    }

    form.reset();
    recordChange("inventory_added", `新增库存：${name}`, { name, qty, unit: data.unit });
    render();
    toast(`${name} 已加入库存`);
  }

  function saveMemberForm(form) {
    const id = form.dataset.id;
    const member = state.family.find((item) => item.id === id);
    if (!member) return;

    const data = Object.fromEntries(new FormData(form).entries());
    member.name = String(data.name || member.name).trim();
    member.role = String(data.role || "").trim();
    member.prefer = String(data.prefer || "").trim();
    member.avoid = String(data.avoid || "").trim();

    recordChange("family_updated", `更新成员：${member.name}`, { memberId: id });
    render();
    toast("成员口味已保存");
  }

  function saveSyncForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    state.sync.owner = String(data.owner || defaultSyncConfig.owner).trim();
    state.sync.repo = String(data.repo || defaultSyncConfig.repo).trim();
    state.sync.branch = String(data.branch || defaultSyncConfig.branch).trim();
    state.sync.path = String(data.path || defaultSyncConfig.path).trim();
    localStorage.setItem(TOKEN_KEY, String(data.token || "").trim());
    recordChange("sync_config_saved", "保存 GitHub 同步配置", {
      owner: state.sync.owner,
      repo: state.sync.repo,
      path: state.sync.path
    });
    render();
    toast("同步配置已保存");
  }

  function adjustInventory(id, delta) {
    const item = state.inventory.find((entry) => entry.id === id);
    if (!item) return;
    item.qty = roundQty(Math.max(0, Number(item.qty) + Number(delta || 0)));
    item.updatedAt = new Date().toISOString();
    recordChange("inventory_adjusted", `调整库存：${item.name}`, { id, qty: item.qty });
    render();
  }

  function deleteInventory(id) {
    const item = state.inventory.find((entry) => entry.id === id);
    state.inventory = state.inventory.filter((entry) => entry.id !== id);
    recordChange("inventory_deleted", `移除库存：${item?.name || id}`, { id });
    render();
    toast("已移除食材");
  }

  function deletePlan(id) {
    const plan = state.plans.find((entry) => entry.id === id);
    state.plans = state.plans.filter((entry) => entry.id !== id);
    recordChange("plan_deleted", "删除餐单", { id, dishes: plan?.dishes?.map((dish) => dish.name) || [] });
    render();
  }

  function deleteLog(id) {
    state.logs = state.logs.filter((entry) => entry.id !== id);
    recordChange("log_deleted", "删除吃饭日志", { id });
    render();
  }

  function setMeal(meal) {
    if (!mealTypes.some((item) => item.id === meal)) return;
    state.selectedMeal = meal;
    state.selectedParticipants = getMealDefaultParticipantsFor(meal);
    state.recommendations = [];
    state.selectedDishes = [];
    saveState();
    render();
  }

  function toggleParticipant(id) {
    if (state.selectedParticipants.includes(id)) {
      state.selectedParticipants = state.selectedParticipants.filter((item) => item !== id);
    } else {
      state.selectedParticipants.push(id);
    }
    saveState();
    render();
  }

  function selectDefaultParticipants() {
    state.selectedParticipants = getMealDefaultParticipantsFor(state.selectedMeal);
    saveState();
    render();
  }

  function toggleDishSelection(id, checked) {
    if (checked && !state.selectedDishes.includes(id)) state.selectedDishes.push(id);
    if (!checked) state.selectedDishes = state.selectedDishes.filter((item) => item !== id);
    saveState();
    render();
  }

  function deductInventory(name, qty) {
    const item = findInventoryByName(name);
    if (!item) return;
    item.qty = roundQty(Math.max(0, Number(item.qty) - Number(qty || 0)));
    item.updatedAt = new Date().toISOString();
  }

  async function pullFromGitHub() {
    const cfg = readGithubConfig();
    ensureGithubConfig(cfg);

    toast("正在从 GitHub 拉取");
    const file = await getGithubFile(cfg, false);
    const remote = JSON.parse(decodeBase64Utf8(file.content || ""));
    const previousSync = state.sync;
    state = normalizeState(remote);
    state.sync = {
      ...state.sync,
      owner: cfg.owner || previousSync.owner,
      repo: cfg.repo || previousSync.repo,
      branch: cfg.branch || previousSync.branch,
      path: cfg.path || previousSync.path,
      remoteSha: file.sha || "",
      lastPulledAt: new Date().toISOString()
    };
    state.pendingEvents = [];
    saveState();
    render();
    toast("GitHub 数据已拉取到本机");
  }

  async function pushToGitHub() {
    const cfg = readGithubConfig();
    ensureGithubConfig(cfg);

    toast("正在推送到 GitHub");
    let sha = state.sync.remoteSha || "";
    if (!sha) {
      const existing = await getGithubFile(cfg, true);
      sha = existing?.sha || "";
    }

    const now = new Date().toISOString();
    const payload = exportableState({
      pendingEvents: [],
      sync: {
        ...state.sync,
        owner: cfg.owner,
        repo: cfg.repo,
        branch: cfg.branch,
        path: cfg.path,
        remoteSha: "",
        lastPushedAt: now,
        lastSyncedBy: getDeviceId()
      }
    });

    const body = {
      message: `Update What-for-dinner data ${todayIso()}`,
      content: encodeBase64Utf8(JSON.stringify(payload, null, 2)),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    const result = await githubRequest(
      "PUT",
      `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodePath(cfg.path)}`,
      cfg.token,
      body
    );

    state.pendingEvents = [];
    state.sync.owner = cfg.owner;
    state.sync.repo = cfg.repo;
    state.sync.branch = cfg.branch;
    state.sync.path = cfg.path;
    state.sync.remoteSha = result.content?.sha || sha;
    state.sync.lastPushedAt = now;
    state.sync.lastSyncedBy = getDeviceId();
    saveState();
    render();
    toast("已推送到 GitHub");
  }

  async function getGithubFile(cfg, allow404) {
    try {
      const query = cfg.branch ? `?ref=${encodeURIComponent(cfg.branch)}` : "";
      return await githubRequest(
        "GET",
        `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodePath(cfg.path)}${query}`,
        cfg.token
      );
    } catch (error) {
      if (allow404 && String(error.message).includes("404")) return null;
      throw error;
    }
  }

  async function githubRequest(method, url, token, body) {
    const response = await fetch(url, {
      method,
      headers: {
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const message = data?.message || response.statusText;
      throw new Error(`GitHub ${response.status}: ${message}`);
    }
    return data;
  }

  function readGithubConfig() {
    const sync = normalizeSyncConfig(state.sync);
    return {
      owner: sync.owner,
      repo: sync.repo,
      branch: sync.branch,
      path: sync.path,
      token: (localStorage.getItem(TOKEN_KEY) || "").trim()
    };
  }

  function ensureGithubConfig(cfg) {
    const missing = ["owner", "repo", "branch", "path", "token"].filter((key) => !cfg[key]);
    if (missing.length) {
      throw new Error(`请先补齐 GitHub 配置：${missing.join(", ")}`);
    }
  }

  function openExportModal() {
    const json = JSON.stringify(exportableState(), null, 2);
    openModal("导出 JSON", `
      <pre class="code-block" id="exportText">${escapeHtml(json)}</pre>
      <div class="chip-row">
        <button class="btn green" type="button" data-action="copy-modal-text" data-target="exportText">复制</button>
      </div>
    `);
  }

  function openImportModal() {
    openModal("导入 JSON", `
      <div class="field full">
        <label>JSON 数据</label>
        <textarea id="importJson" placeholder="粘贴导出的家庭数据"></textarea>
      </div>
      <div class="chip-row">
        <button class="btn green" type="button" data-action="import-json">导入</button>
      </div>
    `);
  }

  function importJsonFromModal() {
    const text = document.getElementById("importJson")?.value || "";
    if (!text.trim()) {
      toast("先粘贴 JSON 数据");
      return;
    }

    const previousSync = state.sync;
    state = normalizeState(JSON.parse(text));
    state.sync = { ...state.sync, ...previousSync };
    recordChange("data_imported", "导入家庭数据", {});
    closeModal();
    render();
    toast("数据已导入");
  }

  function openAiPacketModal() {
    const packet = {
      prompt: "请基于这个家庭菜单 PWA 数据，给出下一周配餐、采购清单、库存优先消耗和烹饪建议。不要调用外部 API。",
      data: exportableState()
    };
    openModal("Codex 数据包", `
      <pre class="code-block" id="aiPacketText">${escapeHtml(JSON.stringify(packet, null, 2))}</pre>
      <div class="chip-row">
        <button class="btn green" type="button" data-action="copy-modal-text" data-target="aiPacketText">复制</button>
      </div>
    `);
  }

  async function copyModalText(targetId) {
    const text = document.getElementById(targetId)?.textContent || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast("已复制");
  }

  function resetDemoData() {
    state = createDefaultState();
    saveState();
    render();
    toast("已重置为演示数据");
  }

  function exportableState(overrides = {}) {
    const clean = normalizeState({ ...state, ...overrides });
    delete clean.sync.token;
    return {
      ...clean,
      exportedAt: new Date().toISOString()
    };
  }

  function getStats() {
    return {
      inventoryCount: state.inventory.length,
      expiringCount: state.inventory.filter((item) => daysUntil(item.expiresAt) <= 3).length,
      openPlans: state.plans.filter((plan) => plan.status !== "completed").length,
      completedPlans: state.plans.filter((plan) => plan.status === "completed").length
    };
  }

  function getSelectedMembers() {
    return state.family.filter((member) => state.selectedParticipants.includes(member.id));
  }

  function getMealDefaultParticipantsFor(mealId, sourceState = state) {
    const memberIds = new Set(sourceState.family.map((member) => member.id));
    const defaults = sourceState.mealDefaults?.[mealId] || defaultMealParticipants[mealId] || [];
    return defaults.map(mapMemberId).filter((id) => memberIds.has(id));
  }

  function findInventoryByName(name) {
    const target = normalizeText(name);
    return state.inventory.find((item) => {
      const source = normalizeText(item.name);
      return source === target || source.includes(target) || target.includes(source);
    });
  }

  function hasAvoidedIngredient(dish, avoids) {
    if (!avoids.length) return false;
    const haystack = `${dish.name} ${dish.tags.join(" ")} ${dish.ingredients.map((item) => item.name).join(" ")}`;
    return avoids.some((word) => word && haystack.includes(word));
  }

  function sortedInventory() {
    return [...state.inventory].sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));
  }

  function splitWords(text) {
    return String(text || "")
      .split(/[、,，;；\s]+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  function optionTag(value) {
    return `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`;
  }

  function emptyState(title, hint) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(hint)}</span></div>`;
  }

  function formatIngredient(ingredient) {
    return `${ingredient.name}${shortNumber(ingredient.qty)}${ingredient.unit}`;
  }

  function formatQty(qty, unit) {
    return `${shortNumber(qty)}${unit}`;
  }

  function shortNumber(value) {
    return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
  }

  function roundQty(value) {
    return Math.round(Number(value) * 10) / 10;
  }

  function normalizeText(text) {
    return String(text || "").trim().toLowerCase();
  }

  function daysUntil(dateText) {
    if (!dateText) return 9999;
    const today = new Date(`${todayIso()}T12:00:00`);
    const target = new Date(`${dateText}T12:00:00`);
    return Math.ceil((target - today) / 86400000);
  }

  function expiryLabel(dateText) {
    if (!dateText) return "未设置";
    const days = daysUntil(dateText);
    if (days < 0) return `已过期 ${Math.abs(days)} 天`;
    if (days === 0) return "今天到期";
    if (days === 1) return "明天到期";
    return `${days} 天后到期`;
  }

  function formatDate(dateText) {
    if (!dateText) return "未记录";
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(dateText));
  }

  function addDays(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + Number(days));
    return localDate(date);
  }

  function todayIso() {
    return localDate(new Date());
  }

  function localDate(date) {
    const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return copy.toISOString().slice(0, 10);
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
  }

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `device_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function setRoute(route) {
    if (!ROUTES.includes(route)) return;
    state.route = route;
    saveState();
    if (location.hash.replace("#", "") !== route) location.hash = route;
    render();
  }

  function ensureRouteFromHash() {
    const route = location.hash.replace("#", "");
    if (ROUTES.includes(route)) state.route = route;
  }

  function updateActiveNav() {
    document.querySelectorAll("button[data-route]").forEach((button) => {
      button.classList.toggle("active", button.dataset.route === state.route);
    });
  }

  function updateSyncBadge() {
    if (!syncBadge) return;
    if (state.pendingEvents.length) {
      syncBadge.textContent = `${state.pendingEvents.length} 待同步`;
    } else if (state.sync.lastPushedAt || state.sync.lastPulledAt) {
      syncBadge.textContent = "已同步";
    } else {
      syncBadge.textContent = "本地";
    }
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  function applyTheme(theme) {
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else document.documentElement.removeAttribute("data-theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0e1522" : "#ffc928");
  }

  function openModal(title, bodyHtml) {
    closeModal();
    const template = document.getElementById("modalTemplate");
    const modal = template.content.firstElementChild.cloneNode(true);
    modal.querySelector("#modalTitle").textContent = title;
    modal.querySelector("#modalBody").innerHTML = bodyHtml;
    document.body.appendChild(modal);
  }

  function closeModal() {
    document.querySelector(".modal-backdrop")?.remove();
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 2600);
  }

  function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64Utf8(text) {
    const binary = atob(String(text || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  }
})();
