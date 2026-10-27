import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright-core";

const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:8020/";
const candidates = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const executablePath = candidates.find((path) => fs.existsSync(path));
if (!executablePath) throw new Error("No Chrome/Chromium binary found for the smoke test");

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${base}#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  assert.match(await page.locator("h1").innerText(), /See the game/);
  assert.equal(await page.getByRole("link", { name: "Explore the moment" }).count(), 1);
  assert.equal(await page.getByRole("link", { name: "Enter Studio" }).count(), 1);
  assert.equal(await page.locator(".nav-media a").count(), 2);
  assert.match(await page.locator(".nav-media a").first().getAttribute("href"), /promo\.mp4\?v=english-v3$/);
  assert.match(await page.locator(".nav-media a").nth(1).getAttribute("href"), /teaser\.mp4\?v=english-v3$/);
  assert.ok(await page.locator(".match-scene canvas, .pitch-svg").first().isVisible());

  await page.getByRole("link", { name: "Explore the moment" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  await page.locator(".claim-list button").first().waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".claim-list button").count() > 0);
  await page.locator(".claim-list button").first().click();
  await page.getByRole("button", { name: "Audiences", exact: true }).click();
  await page.locator(".segmented-control button").nth(1).waitFor({ state: "visible", timeout: 5000 });
  await page.locator(".segmented-control button").nth(1).click();
  await page.locator(".fan-card-headline").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".fan-card-headline").isVisible());
  await page.getByRole("button", { name: "Structure", exact: true }).click();
  await page.locator(".play-button").click();
  await page.waitForTimeout(250);
  await page.locator(".play-button").click();

  // Verify upgraded Agent Graph Visualizer, Story Arc, Tactical Copilot, Hallucination Lab & Share Poster
  assert.ok(await page.locator(".agent-graph-card").isVisible());
  await page.getByRole("button", { name: /Replay Graph/ }).click();
  await page.waitForTimeout(200);
  assert.equal(await page.locator(".story-arc-card").count(), 3);
  await page.locator(".story-arc-card").first().click();
  await page.waitForTimeout(350);
  assert.ok(await page.locator(".copilot-answer-box").isVisible());
  await page.getByRole("textbox", { name: "Ask MatchMind tactical question" }).fill("An unscripted tactical question");
  await page.locator(".copilot-form button[type=submit]").click();
  await page.locator(".copilot-answer-box.withheld").waitFor({ state: "visible" });
  assert.match(await page.locator(".copilot-notice").innerText(), /no model call was made/);
  await page.locator(".hallucination-lab .challenge-tabs button").nth(1).click();
  assert.match(await page.locator(".hallucination-lab .injected-quote").innerText(), /94\.6%/);
  await page.locator(".share-poster-btn").first().click();
  assert.ok(await page.locator(".share-card-modal").isVisible());
  await page.getByRole("button", { name: "Close share card" }).click();
  await page.locator(".nav-tour-btn").click();
  assert.ok(await page.locator(".judge-tour-modal").isVisible());
  await page.getByRole("button", { name: "Close judge guide" }).click();

  await page.goto(`${base}#/studio`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  assert.equal(await page.getByText("Static demo", { exact: true }).count(), 1);
  assert.equal(await page.locator(".generate-button").isDisabled(), true);
  assert.ok((await page.locator(".insight-headline").textContent()).length > 20);

  const fixtures = [
    "ast-2026-1018-nhr-orn",
    "ast-2026-1025-vel-kep",
    "ast-2026-1101-orn-vel",
    "ast-2026-1108-kep-nhr",
    "ast-2026-1115-nhr-vel",
  ];
  for (const fixture of fixtures) {
    await page.locator(".fixture-select").selectOption(fixture);
    await page.locator(".decision-status.pass").waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await page.locator(".error-banner").count(), 0, fixture);
    assert.ok((await page.locator(".insight-headline").textContent()).length > 20, fixture);
  }
  await page.locator(".fixture-select").selectOption(fixtures[1]);
  await page.locator(".decision-status.pass").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".rundown-state").first().textContent(), "hold");
  assert.equal(await page.getByRole("button", { name: "Approve", exact: true }).isEnabled(), true);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.locator(".program-screen .overlay-cue").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".program-screen .overlay-cue").isVisible());
  await page.getByRole("link", { name: "Full screen" }).click();
  await page.waitForLoadState("networkidle");
  await page.locator(".overlay-cue").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".overlay-cue").isVisible());
  await page.goto(`${base}#/overlay?bg=1&match=${fixtures[1]}`, { waitUntil: "networkidle" });
  await page.locator(".overlay-waiting").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".overlay-waiting").isVisible());
  await page.goto(`${base}#/studio`, { waitUntil: "networkidle" });
  await page.locator(".fixture-select").selectOption(fixtures[0]);
  await page.locator(".decision-status.pass").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await page.locator(".program-hold").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".program-hold").isVisible());
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.locator(".program-screen .overlay-cue").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator(".program-screen .overlay-cue").isVisible());

  await page.goto(`${base}#/guide`, { waitUntil: "networkidle" });
  await page.locator(".guide-legend").waitFor();
  assert.match(await page.locator(".guide-legend").innerText(), /Data itself/i);
  await page.goto(`${base}#/about`, { waitUntil: "networkidle" });
  await page.locator(".about-hero h1").filter({ hasText: "Five agents" }).waitFor();
  assert.match(await page.locator(".about-hero h1").innerText(), /Five agents/);
  await page.goto(`${base}#/overlay?bg=1&template=stat_card`, { waitUntil: "networkidle" });
  await page.locator(".overlay-variant.stat-card").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".overlay-variant.stat-card").count(), 1);

  await page.goto(`${base}#/fan?match=ast-2026-1025-vel-kep`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Player Follow/ }).click();
  assert.match(await page.locator(".fan-player-head select").inputValue(), /^VEL-/);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  assert.ok(await page.locator(".fan-card-headline").isVisible());
  await page.locator(".fan-recap summary").click();
  assert.ok(await page.locator(".fan-recap-row").count() > 0);
  await page.locator(".fan-match-header select").selectOption(fixtures[0]);
  await page.waitForTimeout(600);
  assert.match(await page.locator(".fan-player-head select").inputValue(), /^(NHR|ORN)-/);
  assert.notEqual(await page.locator(".fan-player-head strong").textContent(), "Select a player");

  await page.goto(`${base}#/moment?match=not-a-match`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".fixture-select").inputValue(), fixtures[0]);
  assert.ok(page.url().endsWith(`match=${fixtures[0]}`));
  consoleErrors.length = 0;

  await page.route("**/demo/*/insight.json", async (route) => {
    const delay = route.request().url().includes(fixtures[1]) ? 800 : 50;
    await new Promise((resolve) => setTimeout(resolve, delay));
    await route.continue();
  });
  await page.goto(`${base}#/studio`, { waitUntil: "networkidle" });
  await page.locator(".fixture-select").selectOption(fixtures[1]);
  await page.waitForTimeout(80);
  await page.locator(".fixture-select").selectOption(fixtures[0]);
  await page.waitForTimeout(1100);
  assert.equal(await page.locator(".fixture-select").inputValue(), fixtures[0]);
  assert.match(await page.locator(".insight-headline").textContent(), /NHR-/);
  await page.unroute("**/demo/*/insight.json");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  mobile.on("pageerror", (error) => consoleErrors.push(error.message));
  for (const route of ["#/", "#/moment", "#/studio", "#/fan"]) {
    await mobile.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await mobile.waitForTimeout(350);
    const widths = await mobile.locator("body").evaluate((body) => ({
      scroll: body.scrollWidth,
      client: body.clientWidth,
    }));
    assert.ok(widths.scroll <= widths.client + 1, `${route} overflows on mobile: ${JSON.stringify(widths)}`);
    assert.ok(await mobile.locator("h1, .fan-card-headline").first().isVisible());
  }
  await mobile.goto(`${base}#/`, { waitUntil: "networkidle" });
  assert.ok(await mobile.locator(".pitch-svg").first().isVisible());
  await mobile.setViewportSize({ width: 320, height: 740 });
  await mobile.goto(`${base}#/moment`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(350);
  const narrowWidths = await mobile.locator("body").evaluate((body) => [body.scrollWidth, body.clientWidth]);
  assert.ok(narrowWidths[0] <= narrowWidths[1] + 1, `Moment overflows at 320px: ${narrowWidths}`);

  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(" | ")}`);
  console.log("static smoke ok: home, moment layers, 5 fixtures, approval, overlay, fan, mobile, reduced motion");
} finally {
  await browser.close();
}
