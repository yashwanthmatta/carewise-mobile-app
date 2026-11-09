// AI Health Guide and help chat answer pipeline (src/guideReply.ts), with the network mocked:
// emergency words are answered on the phone and never sent; "are you a real doctor" and diagnosis
// questions get fixed answers; the online answer is used when the server replies; built-in answers
// when it cannot be reached; a busy server says so; the report is sent only when chosen.
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "carewise-guide-"));
for (const name of ["labPanel", "scanReport", "reportAnalysis", "personalPlan", "helpAnswers", "guideReply"]) {
  const source = fs.readFileSync(path.join(root, "src", `${name}.ts`), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(out, `${name}.js`), js);
}
const { guideReply } = require(path.join(out, "guideReply.js"));
const { analyzeReportTextLocally } = require(path.join(out, "reportAnalysis.js"));

let failed = 0;
const check = (ok, label) => {
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
};
const calls = [];
const online = async (url, init) => {
  calls.push({ url, body: JSON.parse(init.body) });
  return { ok: true, status: 200, json: async () => ({ reply: "eGFR estimates how well the kidneys filter blood." }) };
};
const offline = async () => { throw new Error("network down"); };
const busy = async () => ({ ok: false, status: 429, json: async () => ({}) });
const base = { baseUrl: "https://api.example.test", history: [], language: "en", analysis: null };

(async () => {
  const urgent = await guideReply({ ...base, question: "I have chest pain", fetcher: online });
  check(urgent.urgent && urgent.source === "safety" && /911/.test(urgent.reply) && calls.length === 0, "emergency words: urgent answer, nothing sent");
  const doctor = await guideReply({ ...base, question: "Are you a real doctor?", fetcher: online });
  check(/^No\./.test(doctor.reply) && /not a doctor/.test(doctor.reply) && calls.length === 0, "\"Are you a real doctor?\": fixed answer, nothing sent");
  const diagnosis = await guideReply({ ...base, question: "Do I have diabetes?", fetcher: online });
  check(/can't diagnose/.test(diagnosis.reply) && calls.length === 0, "\"Do I have diabetes?\": can't diagnose, nothing sent");
  const spanish = await guideReply({ ...base, language: "es", question: "¿Eres un médico?", fetcher: online });
  check(/^No\./.test(spanish.reply) && /no un médico/.test(spanish.reply), "Spanish: not a doctor");
  const answer = await guideReply({ ...base, question: "What does eGFR mean?", fetcher: online });
  check(answer.source === "online" && /kidneys filter/.test(answer.reply), "online answer used when the server replies");
  check(calls[0]?.url === "https://api.example.test/assistant/chat" && calls[0].body.messages.at(-1).content === "What does eGFR mean?" && calls[0].body.report_summary === "", "sends the question, no report unless chosen");
  const shared = await guideReply({ ...base, question: "What about my creatinine?", reportSummary: "Creatinine 2.3 mg/dL", shareReport: true, fetcher: online });
  check(shared.source === "online" && calls.at(-1).body.report_summary === "Creatinine 2.3 mg/dL", "report sent only when chosen");
  const fallback = await guideReply({ ...base, question: "What does eGFR mean?", fetcher: offline });
  check(fallback.source === "built-in" && /kidney/i.test(fallback.reply), "server unreachable: built-in answer");
  const medicine = await guideReply({ ...base, question: "What dose of metformin should I take?", fetcher: offline });
  check(/can't recommend or name medicines/.test(medicine.reply) && !/\b\d+\s?mg\b/i.test(medicine.reply), "medicine dose: refused, no dose");
  const tooBusy = await guideReply({ ...base, question: "What is LDL?", fetcher: busy });
  check(tooBusy.busy === true && /busy/.test(tooBusy.reply), "busy server: says so");
  const analysis = analyzeReportTextLocally("Creatinine 2.3 mg/dL 0.6-1.3");
  const result = await guideReply({ ...base, analysis, question: "What does my result mean?", fetcher: offline });
  check(/creatinine/i.test(result.reply), "built-in answer can explain the open report");
  if (failed) {
    console.error(`${failed} guide check(s) failed`);
    process.exit(1);
  }
  console.log("AI Health Guide checks passed.");
})();
