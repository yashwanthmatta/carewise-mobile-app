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

const releaseCheck = run("npm", ["run", "release:check"]);
assert(releaseCheck.status === 0, releaseCheck.stdout + releaseCheck.stderr);

const typecheck = run("npm", ["run", "typecheck"]);
assert(typecheck.status === 0, typecheck.stdout + typecheck.stderr);

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
