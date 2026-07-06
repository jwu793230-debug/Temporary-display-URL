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

assert.match(app, /const RPE_OPTIONS = \[/, "perceived effort uses fixed choices");
assert.match(app, /label:\s*"很轻松"/, "RPE choice includes 很轻松");
assert.match(app, /label:\s*"轻松"/, "RPE choice includes 轻松");
assert.match(app, /label:\s*"一般"/, "RPE choice includes 一般");
assert.match(app, /label:\s*"吃力"/, "RPE choice includes 吃力");
assert.match(app, /label:\s*"很吃力"/, "RPE choice includes 很吃力");
assert.match(app, /function renderRpeChoices\(/, "RPE is rendered by choice buttons");
assert.match(app, /data-rpe=/, "RPE choices save through button clicks");
assert.doesNotMatch(app, /type="range"/, "RPE slider is removed");
assert.match(app, /function renderDurationWheel\(/, "duration is rendered by a wheel-style control");
assert.match(app, /data-duration-part="hours"/, "duration wheel has an hour column");
assert.match(app, /data-duration-part="minutes"/, "duration wheel has a minute column");
assert.match(app, /data-duration-part="seconds"/, "duration wheel has a second column");
assert.match(app, /function parseDurationParts\(/, "existing duration strings are parsed into wheel values");
assert.match(app, /function formatDurationDone\(/, "duration wheel saves a normalized duration string");
assert.match(css, /\.rpe-choice-grid\s*\{/, "RPE choice grid is styled");
assert.match(css, /\.duration-wheel\s*\{/, "duration wheel is styled");
assert.match(css, /\.duration-column\s+select\s*\{/, "duration columns style native selects");

assert.match(css, /color-scheme:\s*dark/, "the app declares a dark color scheme");
assert.match(css, /--bg:\s*#0a0f14/, "the global background is black");
assert.match(css, /\.bottom-nav-inner\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*1fr\)/, "bottom nav uses four slots");
assert.match(css, /\.type-hike\s*\{/, "hike type has a color token");

console.log("UI contract checks passed");
