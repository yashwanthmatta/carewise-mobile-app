// Reminder calls follow the reminded person's time zone, which the caregiver picks, not the
// phone's zone. Checks the zone list and that the screen sends the chosen zone.
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "carewise-zones-"));
const source = fs.readFileSync(path.join(root, "src", "reminderZones.ts"), "utf8");
fs.writeFileSync(path.join(out, "reminderZones.js"), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
const { REMINDER_TIME_ZONES, reminderZoneChoices } = require(path.join(out, "reminderZones.js"));

let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

ok(REMINDER_TIME_ZONES.every((zone) => { try { new Intl.DateTimeFormat("en-US", { timeZone: zone.value }); return true; } catch { return false; } }), "every listed zone is a real IANA zone");
const us = reminderZoneChoices("America/Chicago").map((zone) => zone.value);
ok(us.length === REMINDER_TIME_ZONES.length, "a US phone zone is not listed twice");
const abroad = reminderZoneChoices("Europe/London");
ok(abroad.some((zone) => zone.value === "Europe/London" && zone.label === "Europe/London"), "a phone outside the US zones gets its own zone added");
ok(reminderZoneChoices("Asia/Kolkata").length === REMINDER_TIME_ZONES.length + 1, "only one extra zone is added");

const screen = fs.readFileSync(path.join(root, "src", "RemindersScreen.tsx"), "utf8");
ok(/timezone: zone,/.test(screen), "the reminder is saved with the chosen zone");
ok(!/timezone: deviceTimeZone\(\)/.test(screen), "the phone's zone is no longer sent directly");
ok(/where the person lives/.test(screen), "the screen explains whose clock the times follow");
ok(/agreed to get automated reminder calls at this number/.test(screen), "the consent switch names automated calls and the number (matches the website)");

if (failures) {
  console.error(`${failures} reminder zone check(s) failed`);
  process.exit(1);
}
console.log("Reminder zone checks passed.");
