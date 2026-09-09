import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "file:///C:/Users/Jerry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const repoRoot = resolve(".");
const solutionRoute = "/thermal-power-project-solution-and-platform/thermal-power-smart-construction-v2.3.html";
const dashboardUrl = "https://jwu793230-debug.github.io/Temporary-display-URL/thermal-power-project-solution-and-platform/thermal-power-smart-platform-dashboard-v1.1.html";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      const filePath = resolve(repoRoot, relative);
      if (filePath !== repoRoot && !filePath.startsWith(repoRoot + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      const body = await readFile(filePath);
      const contentType = contentTypes[extname(filePath)] ?? "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

test("published thermal solution opens the real dashboard and all subsystem images", async () => {
  const { server, baseUrl } = await startStaticServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failedResponses = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(response.url());
  });

  try {
    await page.goto(baseUrl + solutionRoute, { waitUntil: "load" });
    assert.equal(await page.title(), "火电工程施工期智慧建造整体解决方案");
    const footerText = (await page.locator("footer .footer-inner").textContent())?.replace(/\s+/g, " ").trim();
    assert.equal(footerText, "火电工程施工期智慧建造整体解决方案 V2.3");
    assert.equal(footerText.includes("五大业务域展开版"), false);
    assert.equal(await page.locator('iframe[src="thermal-power-smart-platform-dashboard-v1.1.html"]').count(), 1);
    assert.equal(await page.locator(`a[href="${dashboardUrl}"]`).count(), 1);

    const tabs = page.locator("[data-subsystem]");
    assert.equal(await tabs.count(), 30);
    for (let index = 0; index < 30; index += 1) {
      const tab = tabs.nth(index);
      const key = await tab.getAttribute("data-subsystem");
      const panelId = await tab.evaluate((element) => element.closest("article")?.id);
      assert.ok(panelId, `Missing domain panel for ${key}`);
      await page.locator(`.domain-tab[aria-controls="${panelId}"]`).click();
      await tab.click();
      const activePanel = tab.locator("xpath=ancestor::article[1]");
      const image = activePanel.locator(".subsystem-image");
      await image.waitFor({ state: "visible" });
      await page.waitForFunction((element) => element.complete, await image.elementHandle());
      assert.ok(await image.evaluate((element) => element.naturalWidth > 0), `Image failed for ${key}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      false,
      "Mobile layout should not overflow horizontally",
    );
    assert.deepEqual(failedResponses, []);
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
});
