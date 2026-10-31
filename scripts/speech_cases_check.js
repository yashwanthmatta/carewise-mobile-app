// Read-aloud safety: the words the Listen button says for a lab result must mean exactly what is
// written. Same cases as the website's scripts/eval/speech-cases.mjs: decimals, units, ranges,
// comparisons, negative numbers and negations, in English and Spanish.
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "carewise-speech-"));
for (const name of ["labPanel", "scanReport", "reportAnalysis", "personalPlan", "reportView", "spokenText"]) {
  const source = fs.readFileSync(path.join(root, "src", `${name}.ts`), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(out, `${name}.js`), js);
}
const { spokenText, listenParts } = require(path.join(out, "spokenText.js"));
const { analyzeReportTextLocally } = require(path.join(out, "reportAnalysis.js"));
const { buildReportView } = require(path.join(out, "reportView.js"));

// [written text, language, exact spoken text]
const CASES = [
  ["Potassium: 6.8 mmol/L.", "en", "Potassium: 6 point 8 millimoles per liter."],
  ["2.5 mg/dL", "en", "2 point 5 milligrams per deciliter"],
  ["25 mg/dL", "en", "25 milligrams per deciliter"],
  ["0.04 ng/mL", "en", "0 point 0 4 nanograms per milliliter"],
  ["0.4 ng/mL", "en", "0 point 4 nanograms per milliliter"],
  ["Lab range: <0.04", "en", "Lab range: less than 0 point 0 4"],
  ["Lab range: >60", "en", "Lab range: more than 60"],
  ["Lab range: ≥ 40", "en", "Lab range: more than or equal to 40"],
  ["Lab range: <=5", "en", "Lab range: less than or equal to 5"],
  ["Lab range: 3.5-5.1", "en", "Lab range: 3 point 5 to 5 point 1"],
  ["Lab range: 70 – 99", "en", "Lab range: 70 to 99"],
  ["Base excess -2.0 mmol/L", "en", "Base excess minus 2 point 0 millimoles per liter"],
  ["Range (-2-2)", "en", "Range (minus 2 to 2)"],
  ["12 x10^3/uL", "en", "12 thousand per microliter"],
  ["4.1 x 10^6/uL", "en", "4 point 1 million per microliter"],
  ["250 x10^9/L", "en", "250 billion per liter"],
  ["5.2 uIU/mL", "en", "5 point 2 micro international units per milliliter"],
  ["2.1 mIU/L", "en", "2 point 1 milli international units per liter"],
  ["40 IU/L and 30 U/L", "en", "40 international units per liter and 30 units per liter"],
  ["55 mL/min/1.73m2", "en", "55 milliliters per minute per 1 point 7 3 square meters"],
  ["6.1 %", "en", "6 point 1 percent"],
  ["5.7% to 6.4%", "en", "5 point 7 percent to 6 point 4 percent"],
  ["44 mmol/mol", "en", "44 millimoles per mole"],
  ["7 widgets/hL", "en", "7 widgets/hL"],
  ["This result alone does not show prediabetes.", "en", "This result alone does not show prediabetes."],
  ["A high TSH may mean the thyroid is underactive.", "en", "A high TSH may mean the thyroid is underactive."],
  ["Contact your doctor today, or get emergency care if you feel very unwell.", "en", "Contact your doctor today, or get emergency care if you feel very unwell."],
  ["Potasio: 6.8 mmol/L.", "es", "Potasio: 6 punto 8 milimoles por litro."],
  ["Rango del laboratorio: <0.04", "es", "Rango del laboratorio: menos de 0 punto 0 4"],
  ["Rango del laboratorio: >60", "es", "Rango del laboratorio: más de 60"],
  ["Rango del laboratorio: 3.5-5.1", "es", "Rango del laboratorio: 3 punto 5 a 5 punto 1"],
  ["12 x10^3/uL", "es", "12 mil por microlitro"],
  ["250 x10^9/L", "es", "250 mil millones por litro"],
  ["6.1 %", "es", "6 punto 1 por ciento"],
  ["110 mg/dL", "es", "110 miligramos por decilitro"],
  ["Su informe no dice si fue en ayunas.", "es", "Su informe no dice si fue en ayunas."],
];
const REPORTS = [
  "Potassium 6.8 mmol/L 3.5-5.1\nGlucose 110 mg/dL 70-99\nTroponin I 0.9 ng/mL <0.04",
  "Platelets 12 x10^3/uL 150-400\nHemoglobin A1c 6.1 % 4.0-5.6\nTSH 5.2 uIU/mL 0.4-4.0",
  "eGFR 55 mL/min/1.73m2 >60\nCalcium 13.8 mg/dL 8.6-10.3\nINR 5.6 0.8-1.2",
  "Sodium 140 mmol/L 135-145\nLDL cholesterol 151 mg/dL <100 H\nHDL cholesterol 46 mg/dL >40",
];

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log(`FAIL ${message}`);
};
for (const [text, lang, expected] of CASES) {
  const got = spokenText(text, lang);
  if (got !== expected) fail(`[${lang}] ${JSON.stringify(text)}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(got)}`);
}

const numbers = (text) => (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
const heard = (spoken, lang) => {
  const point = lang === "es" ? "punto" : "point";
  return numbers(spoken.replace(new RegExp(`(\\d+) ${point} ((?:\\d )*\\d)(?!\\d)`, "g"), (m, whole, digits) => `${whole}.${digits.replace(/ /g, "")}`));
};
const negations = (s) => (s.match(/\b(not|no|nunca|sin)\b/gi) || []).length;
for (const report of REPORTS) {
  for (const lang of ["en", "es"]) {
    const view = buildReportView(analyzeReportTextLocally(report), lang);
    if (!view.cards.length) fail(`[${lang}] no result cards for ${JSON.stringify(report)}`);
    const lines = view.cards.flatMap((card) => [card.value, card.range || "", card.meaning || "", card.label || ""]).concat(view.body);
    for (const written of lines) {
      const spoken = spokenText(written, lang);
      const want = numbers(written.replace(/x\s*10\^\d+/g, "").replace(/1\.73m2/g, "1.73"));
      if (JSON.stringify(want) !== JSON.stringify(heard(spoken, lang)) || negations(written) !== negations(spoken)) {
        fail(`[${lang}] numbers or negations changed\n  written ${JSON.stringify(written)}\n  spoken  ${JSON.stringify(spoken)}`);
      }
    }
    // What the Listen button says: the summary first, then each card with its range, no raw symbols.
    const parts = listenParts(view, "", lang);
    const all = parts.join(" | ");
    if (parts[0] !== spokenText(view.headline, lang)) fail(`[${lang}] Listen does not start with the summary`);
    if (/mmol\/L|ng\/mL|mg\/dL|<\d|>\d|x10\^/.test(all)) fail(`[${lang}] Listen reads raw symbols: ${all}`);
    for (const card of view.cards) {
      if (!all.includes(spokenText(`${card.name}: ${card.value}`, lang))) fail(`[${lang}] Listen skips ${card.name}`);
    }
  }
}

if (failures) {
  console.error(`${failures} read-aloud check(s) failed`);
  process.exit(1);
}
console.log(`All ${CASES.length} read-aloud cases and ${REPORTS.length * 2} reports passed`);
