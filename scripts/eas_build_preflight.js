const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = readJson("package.json");
const app = readJson("app.json").expo;
const eas = readJson("eas.json");

assert(packageJson.scripts?.["release:check"], "Run npm run release:check before EAS builds.");
assert(eas.cli?.version, "eas.json must pin a CLI version range.");
assert(eas.build?.preview?.distribution === "internal", "Preview builds must use internal distribution.");
assert(eas.build?.preview?.android?.buildType === "apk", "Android preview should build an APK for easy device testing.");
assert(eas.build?.production?.autoIncrement === true, "Production builds should auto-increment.");
assert(app.ios?.bundleIdentifier, "iOS bundle identifier is required.");
assert(app.android?.package, "Android package name is required.");
assert(app.extra?.apiBaseUrl?.startsWith("https://"), "Backend API URL must be HTTPS.");

const versionCheck = run("npm", ["run", "version:check"]);
assert(versionCheck.status === 0, versionCheck.stdout + versionCheck.stderr);

const releaseCheck = run("npm", ["run", "release:check"]);
assert(releaseCheck.status === 0, releaseCheck.stdout + releaseCheck.stderr);

const storeCheck = run("npm", ["run", "store:check"]);
assert(storeCheck.status === 0, storeCheck.stdout + storeCheck.stderr);

const reviewCheck = run("npm", ["run", "review:check"]);
assert(reviewCheck.status === 0, reviewCheck.stdout + reviewCheck.stderr);

const typecheck = run("npm", ["run", "typecheck"]);
assert(typecheck.status === 0, typecheck.stdout + typecheck.stderr);

if (process.env.CAREWISE_SKIP_BACKEND_CHECK === "1") {
  console.warn("Skipping backend connectivity check because CAREWISE_SKIP_BACKEND_CHECK=1.");
} else {
  const backendCheck = run("npm", ["run", "backend:check"]);
  assert(backendCheck.status === 0, backendCheck.stdout + backendCheck.stderr);
  if (process.env.CAREWISE_RUN_AUTH_SMOKE === "1") {
    const authSmoke = run("npm", ["run", "auth:smoke"]);
    assert(authSmoke.status === 0, authSmoke.stdout + authSmoke.stderr);
  } else {
    console.warn("Skipping auth smoke check. Set CAREWISE_RUN_AUTH_SMOKE=1 to create a temporary live test account.");
  }
  if (process.env.CAREWISE_RUN_REPORT_SMOKE === "1") {
    const reportSmoke = run("npm", ["run", "report:smoke"]);
    assert(reportSmoke.status === 0, reportSmoke.stdout + reportSmoke.stderr);
  } else {
    console.warn("Skipping report smoke check. Set CAREWISE_RUN_REPORT_SMOKE=1 to create temporary synthetic report data.");
  }
}

const gitStatus = run("git", ["status", "--short"]);
assert(gitStatus.status === 0, "Unable to read git status.");
if (gitStatus.stdout.trim()) {
  console.warn("Warning: there are uncommitted files. Commit before production builds.");
  console.warn(gitStatus.stdout.trim());
}

const easVersion = run("eas", ["--version"]);
if (easVersion.status !== 0) {
  console.warn("EAS CLI is not installed or not on PATH.");
  console.warn("Install it locally with: npm install --save-dev eas-cli");
} else {
  console.log(`EAS CLI found: ${easVersion.stdout.trim() || easVersion.stderr.trim()}`);
}

console.log("CareWise EAS build preflight passed.");
console.log("Next commands:");
console.log("  npm run eas:login");
console.log("  npm run build:android:preview");
console.log("  npm run build:ios:preview");
