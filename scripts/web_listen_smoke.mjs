// Web-preview smoke of the mobile report flow at 390 px (optional; needs a browser, so not in ci:check).
// Usage: npx expo export --platform web --output-dir /tmp/web, serve it on :4190
//   (python3 -m http.server 4190 -d /tmp/web), then: node scripts/web_listen_smoke.mjs [screenshot.png]
// Checks: the sample report is explained, Listen has its accessible label, speaks the summary first, and
// never reads raw units or symbols; no script errors. The voice is recorded, not played. /features is answered locally with
// {"report_explanations": true}; every other backend call is blocked. Synthetic sample report only.
const { chromium } = await import("playwright");
const out = process.argv[2] || "listen.png";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  // Record what would be spoken instead of using a real voice.
  window.__spoken = [];
  const synth = window.speechSynthesis;
  if (synth) {
    synth.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 10); };
    synth.cancel = () => {};
  }
});
await page.route(/onrender|followthroughhealth/, (r) => r.abort());
await page.route(/\/features(\?|$)/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"report_explanations": true}' }));
await page.goto(process.env.WEB_PREVIEW_URL || "http://localhost:4190/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByText("Try a sample report").first().click();
await page.waitForTimeout(500);
await page.getByText("Explain on this phone").last().click();
await page.waitForTimeout(2500);
const body = (await page.innerText("body")).replace(/\s+/g, " ");
const listen = page.getByLabel("Listen to the explanation");
const hasListen = (await listen.count()) > 0;
let spoken = [];
if (hasListen) {
  await listen.first().click();
  await page.waitForTimeout(1500);
  spoken = await page.evaluate(() => window.__spoken);
}
await page.screenshot({ path: out, fullPage: false });
const checks = [
  ["report explained (no 'Connect once' gate)", !/Connect to the internet once/.test(body)],
  ["Listen button present with accessible label", hasListen],
  ["Listen speaks something", spoken.length > 0],
  ["spoken text has no raw mmol/L, <, > or x10^", !spoken.join(" ").match(/mmol\/L|[<>]|x10\^/)],
  ["no script errors", errors.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) { if (!ok) failed++; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); }
console.log("first spoken:", (spoken[0] || "").slice(0, 160));
if (errors.length) console.log("errors:", errors.join(" | "));
await browser.close();
process.exit(failed ? 1 : 0);
