const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(label, command, args, options = {}) {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    stdio: "inherit",
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed.`);
  }
}

try {
  run("Version metadata", "npm", ["run", "version:check"]);
  run("Release readiness", "npm", ["run", "release:check"]);
  run("Store submission packet", "npm", ["run", "store:check"]);
  run("App review test plan", "npm", ["run", "review:check"]);
  run("TypeScript", "npm", ["run", "typecheck"]);
  run("Offline EAS preflight", "npm", ["run", "build:preflight"], {
    env: { CAREWISE_SKIP_BACKEND_CHECK: "1" },
  });
  console.log("\nCareWise mobile CI check passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
