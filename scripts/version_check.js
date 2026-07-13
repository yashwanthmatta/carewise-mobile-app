const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

const packageJson = readJson("package.json");
const app = readJson("app.json").expo;
const eas = readJson("eas.json");

assert(isSemver(packageJson.version), "package.json version must be semantic, for example 0.1.0.");
assert(app.version === packageJson.version, "app.json expo.version must match package.json version.");
assert(/^\d+$/.test(app.ios?.buildNumber ?? ""), "iOS buildNumber must be a positive integer string.");
assert(Number(app.ios.buildNumber) >= 1, "iOS buildNumber must be at least 1.");
assert(Number.isInteger(app.android?.versionCode), "Android versionCode must be an integer.");
assert(app.android.versionCode >= 1, "Android versionCode must be at least 1.");
assert(app.ios.bundleIdentifier === "com.carewise.app", "iOS bundle identifier must stay stable.");
assert(app.android.package === "com.carewise.app", "Android package name must stay stable.");
assert(eas.cli?.appVersionSource === "remote", "EAS appVersionSource should be remote for managed store builds.");
assert(eas.build?.production?.autoIncrement === true, "Production EAS builds must auto-increment store build numbers.");

console.log(`CareWise version check passed: ${app.version} / iOS build ${app.ios.buildNumber} / Android code ${app.android.versionCode}.`);
