// Checks what the phone app sends for feedback, usage counts and early access:
// the right endpoints, "mobile" as the source, consent, and nothing from the report.
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const out = fs.mkdtempSync(path.join(os.tmpdir(), "carewise-signals-"));
const source = fs.readFileSync(path.resolve(__dirname, "..", "src", "productSignals.ts"), "utf8");
fs.writeFileSync(path.join(out, "productSignals.js"), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
const signals = require(path.join(out, "productSignals.js"));

const calls = [];
global.fetch = async (url, options) => {
  calls.push({ url, body: JSON.parse(options.body) });
  return { ok: true, status: 200, json: async () => ({ ok: true, id: "fb_1" }) };
};

(async () => {
  const base = "https://api.example";
  signals.trackUsage(base, "report_explained");
  const feedback = await signals.sendFeedback(base, false);
  await signals.sendFeedbackComment(base, feedback.id, "Too long");
  await signals.joinEarlyAccess(base, { email: " a@b.co ", role: "caregiver", note: "  dad  " });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const checks = [
    [calls[0].url === `${base}/product/events` && calls[0].body.name === "report_explained" && calls[0].body.source === "mobile", "usage count sent with source mobile"],
    [calls[1].url === `${base}/product/feedback` && calls[1].body.helpful === false && Object.keys(calls[1].body).sort().join() === "helpful,source", "feedback sends only the answer"],
    [calls[2].url === `${base}/product/feedback/fb_1/comment` && calls[2].body.comment === "Too long", "comment follows the answer"],
    [calls[3].body.email === "a@b.co" && calls[3].body.note === "dad" && calls[3].body.consent === true && calls[3].body.source === "mobile", "early access trimmed, with consent"],
    [signals.isValidEmail("x@y.org") && !signals.isValidEmail("nope"), "email check"],
  ];
  global.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  try {
    await signals.joinEarlyAccess(base, { email: "a@b.co", role: "other", note: "" });
    checks.push([false, "rate limit raises"]);
  } catch (error) {
    checks.push([error.status === 429, "rate limit raises with its status"]);
  }
  global.fetch = async () => { throw new Error("offline"); };
  signals.trackUsage(base, "sample_opened");
  checks.push([true, "usage count never throws offline"]);

  fs.rmSync(out, { recursive: true, force: true });
  let failed = 0;
  for (const [ok, name] of checks) {
    if (!ok) failed += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  }
  if (failed) process.exit(1);
  console.log(`All ${checks.length} product signal checks passed.`);
})();
