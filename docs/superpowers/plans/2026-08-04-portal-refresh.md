# Temporary Display Portal Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Temporary Display 门户改为精简首屏与“左侧解决方案、右侧可视化大屏”的成果分类入口，并在测试通过后发布到 GitHub Pages。

**Architecture:** 继续使用现有单文件静态门户 `index.html`，不增加运行时依赖。使用真实浏览器集成测试验证可见文案、分类链接、排除项、响应式布局和导航目标，然后以 GitHub Pages 的 `main` 分支发布。

**Tech Stack:** HTML5、CSS3、Node.js test runner、Playwright Chromium、GitHub Pages

## Global Constraints

- 顶部保持现有品牌导航与深色工业科技风格。
- 首屏标题为“智能建造成果展示门户”，仅保留“查看解决方案”和“浏览可视化大屏”两个分类操作。
- 统计为 8 项展示成果、2 项方案类成果、6 项大屏与三维展示。
- 左侧方案类必须恰好包含 2 个指定页面；右侧大屏类必须恰好包含 6 个指定页面。
- 门户不得出现半马训练 PWA 或 AI 视频精讲学习地图入口，但不得删除其源文件。
- 桌面端无横向滚动，移动端两栏纵向排列。

---

### Task 1: 门户分类结构与文案

**Files:**
- Create: `tests/portal.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: 浏览器加载仓库根目录的 `index.html`。
- Produces: `#solutions` 和 `#dashboards` 两个分类区域、8 个可点击成果卡片、两个首屏分类按钮和三项成果统计。

- [ ] **Step 1: Write the failing browser test**

```js
assert.equal(await page.locator("h1").textContent(), "智能建造成果展示门户");
assert.equal(await page.locator("#solutions .card").count(), 2);
assert.equal(await page.locator("#dashboards .card").count(), 6);
assert.equal(await page.locator('a[href*="half-marathon-pwa"]').count(), 0);
assert.equal(await page.locator('a[href*="ai-learning-map"]').count(), 0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/portal.test.mjs`

Expected: FAIL because the current page has the old heading and no `#solutions` or `#dashboards` category sections.

- [ ] **Step 3: Implement the approved static layout**

Update `index.html` so the slim hero contains the approved heading, description, two anchor actions, and aggregate statistics. Replace the ungrouped project grid with a 35/65 desktop split and a single-column mobile layout containing the exact 2/6 destination links from the design specification.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/portal.test.mjs`

Expected: PASS for desktop structure, mobile stacking, link targets, exclusions, and overflow checks.

### Task 2: Visual verification and publication

**Files:**
- Modify only if visual defects are found: `index.html`
- Remove before commit: temporary screenshots under the system temporary directory

**Interfaces:**
- Consumes: the completed static page and all eight published target URLs.
- Produces: a visually verified GitHub Pages portal on `main`.

- [ ] **Step 1: Capture desktop and mobile renders**

Use Playwright Chromium at 1920×1080, 1366×768, and 390×844. Save temporary screenshots outside the repository and inspect the 1920×1080 and 390×844 images with `view_image`.

- [ ] **Step 2: Verify navigation and assets**

Click both hero category actions and validate every card href. Confirm all eight live destination URLs return HTTP 200 after publication.

- [ ] **Step 3: Run the complete fresh verification suite**

Run: `node --test tests/portal.test.mjs`

Expected: all tests PASS with zero failures; `git diff --check` returns no errors.

- [ ] **Step 4: Commit and publish**

```powershell
git add index.html tests/portal.test.mjs docs/superpowers
git commit -m "feat: reorganize portal by asset type"
git push origin HEAD:main
```

- [ ] **Step 5: Verify GitHub Pages deployment**

Confirm the Pages workflow succeeds for the pushed commit, then verify the portal URL and required resources return HTTP 200 and the live page title matches `Temporary Display | 临时成果展示门户`.
