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

const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(`${base}#/studio`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  assert.equal(await page.getByText("Static demo", { exact: true }).count(), 1);
  assert.equal(await page.locator(".top-right .btn-primary").isDisabled(), true);
  assert.ok((await page.locator(".insight-headline").first().textContent()).length > 20);

  const fixtures = [
    "ast-2026-1018-nhr-orn",
    "ast-2026-1025-vel-kep",
    "ast-2026-1101-orn-vel",
    "ast-2026-1108-kep-nhr",
    "ast-2026-1115-nhr-vel",
  ];
  for (const fixture of fixtures) {
    await page.locator(".match-select").selectOption(fixture);
    await page.waitForTimeout(450);
    assert.equal(await page.locator(".error-banner").count(), 0, fixture);
    assert.ok((await page.locator(".insight-headline").first().textContent()).length > 20, fixture);
  }

  await page.goto(`${base}#/guide`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  assert.match(await page.locator(".guide-legend").innerText(), /DATA ITSELF/);

  await page.goto(`${base}#/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  assert.match(await page.locator(".about-hero h1").innerText(), /Five agents/);

  await page.goto(`${base}#/overlay?bg=1&template=stat_card`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".overlay-variant.stat-card").count(), 1);

  await page.goto(`${base}#/fan?match=ast-2026-1025-vel-kep`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Player" }).click();
  await page.waitForTimeout(700);
  assert.match(await page.locator(".fan-player-head select").inputValue(), /^VEL-/);

  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(" | ")}`);
  console.log("static smoke ok: 5 fixtures, overlay, fan player focus, 0 console errors");
} finally {
  await browser.close();
}
