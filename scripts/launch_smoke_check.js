const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(label, command, args) {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed.`);
  }
}

try {
  console.log("CareWise live launch smoke uses temporary synthetic accounts, no real patient data, and self-cleans successful test accounts.");
  run("Backend readiness", "npm", ["run", "backend:check"]);
  run("Authentication smoke", "npm", ["run", "auth:smoke"]);
  run("Report, lab trend, privacy smoke", "npm", ["run", "report:smoke"]);
  console.log("\nCareWise live launch smoke passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
