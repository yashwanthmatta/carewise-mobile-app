const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo;
const apiBaseUrl = app.extra?.apiBaseUrl;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(pathname) {
  const url = `${apiBaseUrl}${pathname}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json();
}

async function main() {
  assert(apiBaseUrl?.startsWith("https://"), "expo.extra.apiBaseUrl must be an HTTPS URL.");

  const health = await fetchJson("/health");
  assert(health.status === "ok", "/health must return status ok.");

  const ready = await fetchJson("/ready");
  assert(ready.status === "ready", "/ready must return status ready.");
  assert(ready.checks?.database === true, "/ready must report database ready.");
  assert(ready.checks?.storage === true, "/ready must report storage ready.");

  const features = await fetchJson("/features");
  assert(features.report_uploads === true, "/features must enable report uploads.");
  assert(features.durable_storage === true, "/features must report durable storage.");

  console.log(`CareWise backend connectivity check passed for ${apiBaseUrl}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
