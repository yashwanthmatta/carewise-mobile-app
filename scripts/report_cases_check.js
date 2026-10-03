// Real-world report cases: how people type results and how common labs print them.
// Guards the safety rule that a result far outside its range is never called "routine".
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "carewise-cases-"));
for (const name of ["labPanel", "scanReport", "reportAnalysis"]) {
  const source = fs.readFileSync(path.join(root, "src", `${name}.ts`), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(out, `${name}.js`), js);
}
const { analyzeReportTextLocally } = require(path.join(out, "reportAnalysis.js"));

const panel = (analysis, key) => analysis.panelResults.find((item) => item.key === key);
const cases = [
  ["typed by a caregiver", "my dad's cholesterol is 240, ldl 160, hdl 35, triglycerides 210, fasting sugar 130, hba1c 7.2, bp 150/95", (a) => [
    a.riskLevel === "needs_review", panel(a, "hdl")?.status === "below", panel(a, "glucose")?.status === "above",
    panel(a, "glucose")?.generalRange === true, a.labValues.some((v) => v.label === "Blood pressure"),
  ]],
  ["Indian lab format", "HbA1c 6.8 % 4.0-5.6\nFasting Blood Sugar 126 mg/dL 70-100\nSerum Creatinine 1.4 mg/dL 0.7-1.3\nSGPT 82 U/L 0-45\nUric Acid 8.1 mg/dL 3.5-7.2", (a) => [
    a.riskLevel === "needs_review", panel(a, "alt")?.status === "above", panel(a, "creatinine")?.far === false,
  ]],
  ["thyroid far above range", "TSH 9.8 uIU/mL 0.27-4.20", (a) => [a.riskLevel === "needs_review", panel(a, "tsh")?.far === true, a.score <= 74]],
  ["anemia on a blood count", "Hemoglobin 9.1 g/dL 12.0-15.5\nWBC 13.5 x10^3/uL 4.0-11.0", (a) => [a.riskLevel === "needs_review", panel(a, "hemoglobin")?.far === true]],
  ["critical potassium", "Potassium 6.9 mmol/L 3.5-5.1 HH critical", (a) => [a.riskLevel === "urgent"]],
  ["completely normal", "Total cholesterol 172 mg/dL <200\nLDL cholesterol 92 mg/dL <100\nHDL cholesterol 58 mg/dL >39\nHbA1c 5.2 % 4.0-5.6\nGlucose fasting 88 mg/dL 70-99", (a) => [a.riskLevel === "routine", a.score >= 90]],
  ["UK units", "LDL cholesterol 4.1 mmol/L\nHDL cholesterol 0.9 mmol/L\nHbA1c 53 mmol/mol", (a) => [panel(a, "hdl")?.status === "below", a.labValues.some((v) => v.label === "A1C")]],
  ["no results in the text", "Doctor said my dad has some liver problem and his sugar is a bit high.", (a) => [a.noData === true]],
  ["serious kidney results", "Creatinine 2.3 mg/dL 0.6-1.3\neGFR 28 mL/min/1.73m2 >60", (a) => [a.riskLevel === "needs_review", panel(a, "egfr")?.far === true]],
  ["micrograms shown correctly", "Iron 40 ug/dL 60-170\nFerritin 8 ng/mL 15-150", (a) => [/ug\/dl/i.test(panel(a, "iron")?.unit || ""), panel(a, "ferritin")?.far === true]],
  ["inclusive lower limit", "HDL cholesterol 35 mg/dL >=40", (a) => [panel(a, "hdl")?.status === "below"]],
];

let failed = 0;
for (const [name, text, check] of cases) {
  const results = check(analyzeReportTextLocally(text));
  const ok = results.every(Boolean);
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` (checks: ${results.map((r) => (r ? "ok" : "x")).join(" ")})`}`);
}
fs.rmSync(out, { recursive: true, force: true });
if (failed) {
  console.error(`${failed} report case(s) failed.`);
  process.exit(1);
}
console.log(`All ${cases.length} report cases passed.`);
