import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

assert.match(app, /activeTab:\s*"calendar"/, "calendar stays as the default tab");
assert.doesNotMatch(app, /tabButton\("today"/, "bottom navigation should not include 今日");
assert.match(app, /tabButton\("calendar",\s*"日历"\)/, "calendar tab remains");
assert.match(app, /tabButton\("plan",\s*"计划"\)/, "plan tab remains");
assert.match(app, /tabButton\("sync",\s*"同步"\)/, "sync tab remains");

assert.match(app, /planFilter:\s*"stats"/, "plan page should default to statistics");
assert.match(app, /filterButton\("stats",\s*"统计"\)/, "接下来 is replaced by 统计");
assert.match(app, /filterButton\("week",\s*"周训练情况"\)/, "全部 is replaced by 周训练情况");
assert.match(app, /filterButton\("race",\s*"比赛日"\)/, "race-day filter remains");
assert.match(app, /function renderStatsPanel\(/, "plan statistics panel is rendered");
assert.match(app, /function renderWeeklyPlanReview\(/, "weekly training analysis is rendered in plan tab");

assert.match(app, /hike:\s*\{\s*label:\s*"徒步"/, "hike is a supported activity type");
assert.match(app, /activityType === "hike"\s*\?\s*"徒步距离"/, "hike distance label is explicit");
assert.match(app, /if \(type === "hike"\)/, "hike has a dedicated icon");
assert.match(app, /徒步距离会作为交叉训练记录/, "hike distance is treated as cross training");

assert.match(css, /color-scheme:\s*dark/, "the app declares a dark color scheme");
assert.match(css, /--bg:\s*#0a0f14/, "the global background is black");
assert.match(css, /\.bottom-nav-inner\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*1fr\)/, "bottom nav uses four slots");
assert.match(css, /\.type-hike\s*\{/, "hike type has a color token");

console.log("UI contract checks passed");
