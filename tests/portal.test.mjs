import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "file:///C:/Users/Jerry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const expectedSolutions = [
  "pump-storage-smart-construction-v2.0.9.html",
  "road-project-smart-construction-solution/",
];

const expectedDashboards = [
  "road-smart-integrated-3d-dashboard.html",
  "pump-storage-smart-platform-dashboard.html",
  "pump-storage-3d-twin-dashboard.html",
  "macau-tbm-monitoring-dashboard/",
  "dam-ship-lock-3d-model-glb.html",
  "dam-ship-lock-3d-model.html",
];

test("portal groups the approved engineering assets and keeps the hero compact", async () => {
  const html = await readFile(resolve("index.html"));
  const server = createServer((request, response) => {
    if (request.url === "/" || request.url === "/index.html") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const portalUrl = `http://127.0.0.1:${address.port}/`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const failedResponses = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  try {
    await page.goto(portalUrl, { waitUntil: "load" });

    assert.equal(await page.title(), "Temporary Display | 临时成果展示门户");
    assert.equal(await page.locator('link[rel~="icon"]').count(), 1);
    assert.match(await page.locator('link[rel~="icon"]').getAttribute("href"), /^data:image\/svg\+xml,/);
    assert.equal((await page.locator("h1").textContent())?.trim(), "智能建造成果展示门户");
    assert.equal(await page.locator('.actions a[href="#solutions"]').count(), 1);
    assert.equal(await page.locator('.actions a[href="#dashboards"]').count(), 1);

    const stats = await page.locator(".summary-item").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    assert.deepEqual(stats, [
      "8 项展示成果",
      "2 项方案类成果",
      "6 项大屏与三维展示",
    ]);

    assert.deepEqual(await page.locator("#solutions .card").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))), expectedSolutions);
    assert.deepEqual(await page.locator("#dashboards .card").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))), expectedDashboards);
    assert.equal(await page.locator('a[href*="half-marathon-pwa"]').count(), 0);
    assert.equal(await page.locator('a[href*="ai-learning-map"]').count(), 0);

    const desktopLayout = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const solutions = document.querySelector("#solutions");
      const dashboards = document.querySelector("#dashboards");
      const solutionBox = solutions?.getBoundingClientRect();
      const dashboardBox = dashboards?.getBoundingClientRect();
      return {
        heroHeight: hero?.getBoundingClientRect().height ?? 0,
        solutionsLeft: solutionBox?.left ?? 0,
        dashboardsLeft: dashboardBox?.left ?? 0,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    assert.ok(desktopLayout.heroHeight > 0 && desktopLayout.heroHeight < 390);
    assert.ok(desktopLayout.dashboardsLeft > desktopLayout.solutionsLeft);
    assert.equal(desktopLayout.hasHorizontalOverflow, false);
    assert.equal(await page.locator("h1").evaluate((node) => {
      const style = getComputedStyle(node);
      return node.clientWidth > 0 && node.clientHeight > 0 && (style.overflow === "visible" || node.scrollHeight <= node.clientHeight + 1);
    }), true);

    await page.locator('.actions a[href="#solutions"]').click();
    assert.equal(new URL(page.url()).hash, "#solutions");
    await page.locator('.actions a[href="#dashboards"]').click();
    assert.equal(new URL(page.url()).hash, "#dashboards");

    await page.setViewportSize({ width: 1366, height: 768 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileLayout = await page.evaluate(() => {
      const solutionBox = document.querySelector("#solutions")?.getBoundingClientRect();
      const dashboardBox = document.querySelector("#dashboards")?.getBoundingClientRect();
      return {
        solutionTop: solutionBox?.top ?? 0,
        dashboardTop: dashboardBox?.top ?? 0,
        solutionWidth: solutionBox?.width ?? 0,
        dashboardWidth: dashboardBox?.width ?? 0,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    assert.ok(mobileLayout.dashboardTop > mobileLayout.solutionTop);
    assert.ok(Math.abs(mobileLayout.solutionWidth - mobileLayout.dashboardWidth) < 2);
    assert.equal(mobileLayout.hasHorizontalOverflow, false);
    assert.deepEqual(failedResponses, []);
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
});
