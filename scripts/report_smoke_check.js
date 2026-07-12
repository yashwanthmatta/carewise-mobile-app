const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo;
const apiBaseUrl = app.extra?.apiBaseUrl;
const runId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const email = `mobile-report-smoke-${runId}@example.com`;
const password = `Report-${runId}-password`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(pathname, options = {}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  assert(apiBaseUrl?.startsWith("https://"), "expo.extra.apiBaseUrl must be an HTTPS URL.");

  const signup = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, role: "patient" }),
  });
  const headers = { Authorization: `Bearer ${signup.access_token}` };
  assert(signup.access_token, "Signup must return an access token.");

  const profile = await request("/patients/me/profile", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      name: "Mobile Smoke Patient",
      conditions: "Synthetic smoke test only",
      allergies: "",
      location_region: "US",
      insurance_status: "unknown",
    }),
  });
  assert(profile.patient_id, "Profile must return a patient_id.");

  const upload = await request("/reports/upload", {
    method: "POST",
    headers,
    body: JSON.stringify({
      patient_id: profile.patient_id,
      file_name: `mobile-smoke-${runId}.txt`,
      content_type: "text/plain",
      report_text: "Synthetic smoke test report. LDL cholesterol elevated. A1C normal. No chest pain. Not real patient data.",
    }),
  });
  assert(upload.id, "Report upload must return an id.");
  assert(upload.status === "uploaded", "Report upload status must be uploaded.");

  const analysis = await request(`/reports/${upload.id}/analyze`, {
    method: "POST",
    headers,
  });
  assert(analysis.report_id === upload.id, "Analysis must reference uploaded report.");
  assert(["routine", "clinician_review", "emergency"].includes(analysis.risk_level), "Analysis must return a known risk level.");
  assert(analysis.status, "Analysis must return a status.");

  const labTrend = await request("/lab-trends", {
    method: "POST",
    headers,
    body: JSON.stringify({
      patient_id: profile.patient_id,
      report_id: upload.id,
      test_name: "LDL cholesterol",
      value: "142",
      unit: "mg/dL",
      observed_on: new Date().toISOString().slice(0, 10),
      flag: "high",
      notes: "Synthetic smoke test value. Verify with original report.",
      source: "mobile_smoke",
    }),
  });
  assert(labTrend.id, "Lab trend save must return an id.");

  const trends = await request(`/lab-trends?patient_id=${encodeURIComponent(profile.patient_id)}`, {
    headers,
  });
  assert(Array.isArray(trends), "Lab trends response must be an array.");
  assert(trends.some((item) => item.id === labTrend.id), "Saved lab trend must be returned by list endpoint.");

  console.log(`CareWise report smoke check passed for ${apiBaseUrl} with ${email}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
