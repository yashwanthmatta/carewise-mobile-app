const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert(fs.existsSync(fullPath), `${relativePath} is missing`);
  assert(fs.statSync(fullPath).size > 0, `${relativePath} is empty`);
}

const app = readJson("app.json").expo;
const packageJson = readJson("package.json");
const appSource = readText("App.tsx");
const apiClient = readText("src/apiClient.ts");
const safetyRules = readText("src/safetyRules.md");
const privacyChecklist = readText("src/appStorePrivacyChecklist.md");
const finalLaunchStage = readText("src/finalLaunchStage.md");
const releaseChecklist = readText("src/releaseChecklist.md");
const storeListing = readText("src/storeListingDraft.md");

assert(app.name === "CareWise", "Expo app name must be CareWise");
assert(app.slug === "carewise", "Expo slug must be carewise");
assert(app.ios?.bundleIdentifier === "com.carewise.app", "iOS bundle identifier is missing");
assert(app.android?.package === "com.carewise.app", "Android package is missing");
assert(app.ios?.buildNumber, "iOS buildNumber is missing");
assert(Number.isInteger(app.android?.versionCode), "Android versionCode is missing");
assert(app.extra?.apiBaseUrl?.startsWith("https://"), "Production API URL must use HTTPS");

assertFile("assets/icon.png");
assertFile("assets/adaptive-icon.png");
assertFile("assets/splash.png");

assert(packageJson.scripts?.typecheck === "tsc --noEmit", "typecheck script is missing");
assert(packageJson.scripts?.["release:check"] === "node scripts/mobile_release_check.js", "release:check script is missing");
assert(packageJson.dependencies?.["expo-secure-store"], "expo-secure-store dependency is missing");
assert(packageJson.dependencies?.["expo-document-picker"], "expo-document-picker dependency is missing");

assert(appSource.includes("SecureStore"), "App must use secure token storage");
assert(appSource.includes("DocumentPicker.getDocumentAsync"), "App must expose file picking");
assert(appSource.includes("uploadReportFile"), "App must call mobile file upload");
assert(appSource.includes("logout"), "App must include logout behavior");

assert(apiClient.includes("/reports/upload-file"), "API client must call multipart report upload endpoint");
assert(apiClient.includes("FormData"), "API client must use FormData for file uploads");
assert(apiClient.includes("/reports/") && apiClient.includes("/analyze"), "API client must analyze uploaded reports");
assert(!apiClient.includes("OPENAI_API_KEY"), "Mobile app must not include OpenAI API keys");

assert(safetyRules.toLowerCase().includes("not a diagnosis"), "Safety rules must include non-diagnostic wording");
assert(privacyChecklist.includes("Google Play Data Safety"), "Privacy checklist must mention Google Play Data Safety");
assert(finalLaunchStage.includes("must not claim to diagnose"), "Final launch stage must include safe positioning");
assert(releaseChecklist.includes("Do Not Submit If"), "Release checklist must include submission blockers");
assert(storeListing.includes("CareWise AI is not a medical diagnosis tool"), "Store listing must include medical disclaimer");

console.log("CareWise mobile release check passed.");
