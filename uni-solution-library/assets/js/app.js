(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const search = window.UniLibrarySearch;

  const KIND_LABEL = {
    solution: "解决方案",
    platform: "平台产品",
    system: "子系统",
    document: "文档资料",
    media: "素材图片"
  };

  const PERMISSION_LABEL = {
    public: "公开版",
    internal: "内部版",
    customer: "客户定制版"
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function pageUrl(kind, id) {
    const map = {
      solution: "solution.html",
      platform: "solution.html",
      system: "system.html",
      document: "document.html",
      media: "document.html"
    };
    return `${map[kind] || "index.html"}?id=${encodeURIComponent(id)}`;
  }

  function permissionPill(record) {
    const key = record.permission || "public";
    return `<span class="pill ${escapeHtml(key)}">${escapeHtml(PERMISSION_LABEL[key] || key)}</span>`;
  }

  function tagsHtml(tags, limit = 4) {
    return (tags || []).slice(0, limit).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");
  }

  function imageHtml(src, alt) {
    if (!src) return `<div class="card-media"></div>`;
    return `<div class="card-media"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy"></div>`;
  }

  function summaryText(value, limit = 120) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  }

  function cardHtml(record, kind) {
    const label = KIND_LABEL[kind] || record.type || "条目";
    const title = record.title || record.name;
    const subtitle = record.subtitle || record.domainName || record.type || "";
    const href = kind === "platform" ? `solution.html?id=${encodeURIComponent(record.id)}` : pageUrl(kind, record.id);
    return `
      <article class="card" data-kind="${escapeHtml(kind)}" data-id="${escapeHtml(record.id)}">
        ${imageHtml(record.cover || record.src, title)}
        <div class="card-body">
          <div class="meta">
            <span class="pill">${escapeHtml(record.number || label)}</span>
            ${permissionPill(record)}
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(summaryText(record.summary || subtitle, 150))}</p>
          <div class="meta">${tagsHtml(record.tags || [record.industry, record.type].filter(Boolean), 3)}</div>
          <div class="card-actions">
            <a class="text-link" href="${escapeHtml(href)}">查看详情</a>
          </div>
        </div>
      </article>
    `;
  }

  function mediaCardHtml(record) {
    return `
      <article class="media-card">
        <a href="${escapeHtml(record.src)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(record.src)}" alt="${escapeHtml(record.title)}" loading="lazy">
        </a>
        <div>
          <b>${escapeHtml(record.title)}</b>
          <span>${escapeHtml(record.deckName || record.type)} · ${permissionLabel(record)}</span>
        </div>
      </article>
    `;
  }

  function permissionLabel(record) {
    return PERMISSION_LABEL[record.permission] || record.permission || "公开版";
  }

  function setSiteChrome(data) {
    const site = data.site;
    const brandTitle = $("#brandTitle");
    const brandSub = $("#brandSub");
    if (brandTitle) brandTitle.textContent = site.name;
    if (brandSub) brandSub.textContent = site.organization;
    const nav = $("#topNav");
    if (nav) {
      nav.innerHTML = (site.navigation || [])
        .map((item) => `<a href="index.html${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("");
    }
    const footer = $("#footer");
    if (footer) {
      footer.textContent = `${site.organization} · ${site.name} · ${site.version} · ${site.generatedAt}`;
    }
  }

  function renderStats(site) {
    const stats = site.stats || {};
    const items = [
      ["solutions", "方案"],
      ["platforms", "平台"],
      ["domains", "业务域"],
      ["systems", "子系统"],
      ["documents", "资料"],
      ["media", "素材图"]
    ];
    return items.map(([key, label]) => `
      <div class="stat"><b>${escapeHtml(stats[key] ?? 0)}</b><span>${escapeHtml(label)}</span></div>
    `).join("");
  }

  function buildRecords(data) {
    return [
      ...data.solutions.map((item) => ({ ...item, _kind: "solution" })),
      ...data.platforms.map((item) => ({ ...item, _kind: "platform" })),
      ...data.systems.map((item) => ({ ...item, _kind: "system" })),
      ...data.documents.map((item) => ({ ...item, _kind: "document" })),
      ...data.media.map((item) => ({ ...item, _kind: "media", cover: item.src }))
    ];
  }

  function renderSearch(data) {
    const records = buildRecords(data);
    const grid = $("#searchResults");
    const count = $("#searchCount");
    const queryInput = $("#globalSearch");
    const permissionSelect = $("#permissionFilter");
    const typeSelect = $("#typeFilter");
    const resetBtn = $("#resetFilters");

    function update() {
      const filters = {
        query: queryInput.value,
        permission: permissionSelect.value,
        type: typeSelect.value
      };
      const matched = search.filterRecords(records, filters);
      count.textContent = `${matched.length} 条结果`;
      grid.innerHTML = matched.length
        ? matched.slice(0, 24).map((record) => {
          const kind = record._kind;
          if (kind === "media") return cardHtml({ ...record, cover: record.src, summary: record.deckName }, "media");
          return cardHtml(record, kind);
        }).join("")
        : `<div class="empty">未找到匹配内容</div>`;
    }

    queryInput.addEventListener("input", update);
    permissionSelect.addEventListener("change", update);
    typeSelect.addEventListener("change", update);
    resetBtn.addEventListener("click", () => {
      queryInput.value = "";
      permissionSelect.value = "";
      typeSelect.value = "";
      update();
    });
    update();
  }

  function renderHome(data) {
    $("#heroTitle").textContent = data.site.name;
    $("#heroLead").textContent = data.site.subtitle;
    $("#stats").innerHTML = renderStats(data.site);
    $("#solutionGrid").innerHTML = data.solutions.map((item) => cardHtml(item, "solution")).join("");
    $("#platformGrid").innerHTML = data.platforms.map((item) => cardHtml(item, "platform")).join("");
    $("#documentGrid").innerHTML = data.documents.map((item) => cardHtml(item, "document")).join("");
    $("#mediaGrid").innerHTML = data.media.slice(0, 16).map(mediaCardHtml).join("");
    renderDomains(data);
    renderDataModel();
    renderPermissions(data);
    renderSearch(data);
  }

  function renderDomains(data) {
    const systemsByDomain = new Map();
    data.systems.forEach((system) => {
      if (!systemsByDomain.has(system.domainId)) systemsByDomain.set(system.domainId, []);
      systemsByDomain.get(system.domainId).push(system);
    });

    $("#domainBlocks").innerHTML = data.domains.map((domain) => {
      const systems = systemsByDomain.get(domain.id) || [];
      return `
        <section class="domain-block" id="${escapeHtml(domain.id)}">
          <div class="domain-head">
            <img src="${escapeHtml(domain.cover)}" alt="${escapeHtml(domain.name)}" loading="lazy">
            <div>
              <div class="meta"><span class="pill">${escapeHtml(domain.number)}</span><span class="pill">${systems.length} 个系统</span></div>
              <h3>${escapeHtml(domain.name)}</h3>
              <p>${escapeHtml(summaryText(domain.intro, 220))}</p>
            </div>
          </div>
          <div class="system-list">
            ${systems.map((system) => `
              <a class="system-row" href="system.html?id=${escapeHtml(system.id)}">
                <img src="${escapeHtml(system.cover)}" alt="${escapeHtml(system.title)}" loading="lazy">
                <div>
                  <h4>${escapeHtml(system.number)} ${escapeHtml(system.title)}</h4>
                  <p>${escapeHtml(summaryText(system.overview, 86))}</p>
                </div>
              </a>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderDataModel() {
    const rows = [
      ["solutions", "解决方案表", "方案名称、行业、版本、封面、简介、关联平台、关联子系统、关联文档。"],
      ["platforms", "平台产品表", "平台级产品能力、展示图、能力点、外部链接和权限等级。"],
      ["systems", "子系统表", "编号、业务域、五段式正文、配图、标签、来源、状态和正式方案链接。"],
      ["documents", "文档资料表", "HTML、Word、PDF、PPT、模板等资料登记和公开状态。"],
      ["media", "素材图片表", "PPT预览图、产品截图、平台截图、示意图、用途和来源。"],
      ["relations", "关系表", "方案与系统、系统与图片、方案与平台、平台与素材之间的多对多关系。"]
    ];
    $("#dataModelTable").innerHTML = `
      <table class="data-table">
        <thead><tr><th>数据表</th><th>名称</th><th>主要字段与用途</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td><code>${row[0]}</code></td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderPermissions(data) {
    $("#permissionGrid").innerHTML = data.site.permissions.map((item) => `
      <article class="card">
        <div class="card-body">
          <div class="meta"><span class="pill ${escapeHtml(item.id)}">${escapeHtml(item.name)}</span></div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
      </article>
    `).join("");
  }

  function listHtml(items) {
    if (!items || !items.length) return `<p>待补充。</p>`;
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function docSection(title, body) {
    const content = Array.isArray(body) ? listHtml(body) : `<p>${escapeHtml(body || "待补充。")}</p>`;
    return `<section class="doc-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
  }

  function systemPlainText(system) {
    const lines = [
      `${system.number} ${system.title}`,
      "",
      "系统概述",
      system.overview || "",
      "",
      "系统组成",
      ...(system.components || []).map((item) => `- ${item}`),
      "",
      "核心功能",
      ...(system.functions || []).map((item) => `- ${item}`),
      "",
      "系统亮点",
      ...(system.highlights || []).map((item) => `- ${item}`),
      "",
      "应用价值",
      system.value || "",
      "",
      "素材说明",
      system.mediaNote || ""
    ];
    return lines.join("\n");
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        const old = button.textContent;
        button.textContent = "已复制";
        setTimeout(() => { button.textContent = old; }, 1400);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  function relatedSystemsHtml(data, ids, limit = 12) {
    const systems = (ids || []).map((id) => data.maps.systems.get(id)).filter(Boolean).slice(0, limit);
    if (!systems.length) return `<div class="empty">暂无关联子系统</div>`;
    return `<div class="mini-list">${systems.map((item) => `
      <a class="mini-item" href="system.html?id=${escapeHtml(item.id)}">
        <b>${escapeHtml(item.number)} ${escapeHtml(item.title)}</b>
        <span>${escapeHtml(item.domainName)}</span>
      </a>
    `).join("")}</div>`;
  }

  function relatedDocsHtml(data, ids) {
    const docs = (ids || []).map((id) => data.maps.documents.get(id)).filter(Boolean);
    if (!docs.length) return `<div class="empty">暂无关联资料</div>`;
    return `<div class="mini-list">${docs.map((item) => `
      <a class="mini-item" href="document.html?id=${escapeHtml(item.id)}">
        <b>${escapeHtml(item.title)}</b>
        <span>${escapeHtml(item.type)} · ${permissionLabel(item)}</span>
      </a>
    `).join("")}</div>`;
  }

  function renderSolutionDetail(data) {
    const id = param("id") || data.solutions[0]?.id;
    const solution = data.maps.solutions.get(id) || data.solutions[0];
    document.title = `${solution.title} | ${data.site.name}`;
    const platformCards = (solution.platformIds || []).map((platformId) => data.maps.platforms.get(platformId)).filter(Boolean);
    $("#detailRoot").innerHTML = `
      <div class="detail-shell">
        <article class="detail-panel">
          <div class="detail-cover"><img src="${escapeHtml(solution.cover)}" alt="${escapeHtml(solution.title)}"></div>
          <div class="detail-body">
            <div class="meta">${permissionPill(solution)}<span class="pill">${escapeHtml(solution.industry)}</span></div>
            <h1>${escapeHtml(solution.title)}</h1>
            <p class="subtitle">${escapeHtml(solution.subtitle || solution.summary)}</p>
            ${docSection("方案定位", solution.summary)}
            ${docSection("平台组成", platformCards.map((item) => `${item.title}：${item.summary}`))}
            ${docSection("后续扩展", "本方案可按行业、客户需求、项目范围和公开层级继续扩展，子系统正文、素材图、交付资料和验收标准均可作为独立模块复用。")}
          </div>
        </article>
        <aside class="aside-panel">
          <h3>关联子系统</h3>
          ${relatedSystemsHtml(data, solution.systemIds, 18)}
          <h3 style="margin-top:18px;">关联资料</h3>
          ${relatedDocsHtml(data, solution.documentIds)}
        </aside>
      </div>
    `;
  }

  function renderPlatformAsSolution(data, platform) {
    document.title = `${platform.title} | ${data.site.name}`;
    $("#detailRoot").innerHTML = `
      <div class="detail-shell">
        <article class="detail-panel">
          <div class="detail-cover"><img src="${escapeHtml(platform.cover)}" alt="${escapeHtml(platform.title)}"></div>
          <div class="detail-body">
            <div class="meta">${permissionPill(platform)}${tagsHtml(platform.tags, 4)}</div>
            <h1>${escapeHtml(platform.title)}</h1>
            <p class="subtitle">${escapeHtml(platform.subtitle)}</p>
            ${docSection("产品定位", platform.summary)}
            ${docSection("核心能力", platform.capabilities || [])}
            ${docSection("扩展说明", "该平台记录可继续补充功能截图、产品手册、版本说明、典型项目案例、接口说明和客户定制边界。")}
          </div>
        </article>
        <aside class="aside-panel">
          <h3>外部链接</h3>
          <div class="mini-list">
            ${(platform.links || []).length ? platform.links.map((link) => `
              <a class="mini-item" href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer"><b>${escapeHtml(link.label)}</b><span>${escapeHtml(link.href)}</span></a>
            `).join("") : `<div class="empty">暂无外部链接</div>`}
          </div>
        </aside>
      </div>
    `;
  }

  function renderSolutionOrPlatform(data) {
    const id = param("id") || data.solutions[0]?.id;
    const platform = data.maps.platforms.get(id);
    if (platform) {
      renderPlatformAsSolution(data, platform);
      return;
    }
    renderSolutionDetail(data);
  }

  function renderSystemDetail(data) {
    const id = param("id") || data.systems[0]?.id;
    const system = data.maps.systems.get(id) || data.systems[0];
    document.title = `${system.title} | ${data.site.name}`;
    $("#detailRoot").innerHTML = `
      <div class="detail-shell">
        <article class="detail-panel">
          <div class="detail-cover"><img src="${escapeHtml(system.cover)}" alt="${escapeHtml(system.title)}"></div>
          <div class="detail-body">
            <div class="meta"><span class="pill">${escapeHtml(system.number)}</span>${permissionPill(system)}<span class="pill">${escapeHtml(system.domainName)}</span></div>
            <h1>${escapeHtml(system.title)}</h1>
            <p class="subtitle">${escapeHtml(summaryText(system.overview, 220))}</p>
            <div class="hero-actions">
              <button class="btn primary" id="copySystem">复制本系统正文</button>
              <button class="btn" id="copyLink">复制链接</button>
              <a class="btn" href="${escapeHtml(system.formalHref)}" target="_blank" rel="noreferrer">打开正式长文档</a>
            </div>
            ${docSection("系统概述", system.overview)}
            ${docSection("系统组成", system.components)}
            ${docSection("核心功能", system.functions)}
            ${docSection("系统亮点", system.highlights)}
            ${docSection("应用价值", system.value)}
            ${docSection("素材说明", system.mediaNote)}
          </div>
        </article>
        <aside class="aside-panel">
          <h3>系统标签</h3>
          <div class="meta">${tagsHtml(system.tags, 12)}</div>
          <h3 style="margin-top:18px;">配套素材</h3>
          <div class="mini-list">
            ${(system.images || []).map((src) => `<a class="mini-item" href="${escapeHtml(src)}" target="_blank" rel="noreferrer"><b>系统配图</b><span>${escapeHtml(src.split("/").pop())}</span></a>`).join("")}
          </div>
          <h3 style="margin-top:18px;">资料来源</h3>
          <div class="notice">${escapeHtml(system.source || "正式方案结构化内容")}</div>
        </aside>
      </div>
    `;
    $("#copySystem").addEventListener("click", (event) => copyText(systemPlainText(system), event.currentTarget));
    $("#copyLink").addEventListener("click", (event) => copyText(window.location.href, event.currentTarget));
  }

  function markdownToHtml(text) {
    const lines = String(text || "").split(/\r?\n/);
    const html = [];
    let inList = false;
    function closeList() {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    }
    lines.forEach((line) => {
      if (!line.trim()) {
        closeList();
        return;
      }
      if (line.startsWith("# ")) {
        closeList();
        html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      } else if (line.startsWith("## ")) {
        closeList();
        html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      } else if (line.startsWith("- ")) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      } else {
        closeList();
        html.push(`<p>${escapeHtml(line)}</p>`);
      }
    });
    closeList();
    return html.join("");
  }

  async function renderDocumentDetail(data) {
    const id = param("id") || data.documents[0]?.id;
    const doc = data.maps.documents.get(id) || data.maps.media.get(id) || data.documents[0];
    const isMedia = Boolean(doc.src);
    document.title = `${doc.title} | ${data.site.name}`;
    const file = doc.file || doc.src || "";
    $("#detailRoot").innerHTML = `
      <div class="detail-shell">
        <article class="detail-panel">
          ${isMedia ? `<div class="detail-cover"><img src="${escapeHtml(doc.src)}" alt="${escapeHtml(doc.title)}"></div>` : ""}
          <div class="detail-body">
            <div class="meta">${permissionPill(doc)}<span class="pill">${escapeHtml(doc.type || doc.deckName || "资料")}</span><span class="pill">${escapeHtml(doc.status || "")}</span></div>
            <h1>${escapeHtml(doc.title)}</h1>
            <p class="subtitle">${escapeHtml(doc.summary || doc.deckName || "")}</p>
            <div class="hero-actions">
              ${file ? `<a class="btn primary" href="${escapeHtml(file)}" target="_blank" rel="noreferrer">打开文件</a>` : ""}
              <a class="btn" href="index.html#documents">返回资料库</a>
            </div>
            <section class="doc-section" id="documentContent">
              <h2>资料内容</h2>
              ${file.endsWith(".html") ? `<iframe class="iframe-box" src="${escapeHtml(file)}" title="${escapeHtml(doc.title)}"></iframe>` : `<p>正在加载资料摘要。</p>`}
            </section>
          </div>
        </article>
        <aside class="aside-panel">
          <h3>资料标签</h3>
          <div class="meta">${tagsHtml(doc.tags || [doc.deckName, doc.type].filter(Boolean), 10)}</div>
          <h3 style="margin-top:18px;">维护说明</h3>
          <div class="notice">${doc.file ? "该资料已在方案库中登记文件路径。" : "该条目为资料登记或素材索引，源文件暂不放入公开仓库。"}</div>
        </aside>
      </div>
    `;
    if (file.endsWith(".md")) {
      const response = await fetch(file);
      const text = await response.text();
      $("#documentContent").innerHTML = `<h2>资料内容</h2>${markdownToHtml(text)}`;
    }
    if (isMedia) {
      $("#documentContent").innerHTML = `<h2>素材预览</h2><img src="${escapeHtml(doc.src)}" alt="${escapeHtml(doc.title)}">`;
    }
  }

  async function init() {
    try {
      const data = await window.UniLibraryData.loadLibraryData();
      setSiteChrome(data);
      const page = document.body.dataset.page || "home";
      if (page === "home") renderHome(data);
      if (page === "solution") renderSolutionOrPlatform(data);
      if (page === "system") renderSystemDetail(data);
      if (page === "document") await renderDocumentDetail(data);
    } catch (error) {
      const root = $("#app") || $("#detailRoot") || document.body;
      root.innerHTML = `<div class="empty">方案库数据加载失败：${escapeHtml(error.message)}。请通过本地 Web 服务或 GitHub Pages 打开页面。</div>`;
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
