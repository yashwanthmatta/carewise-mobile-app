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
const storePrivacyAnswers = readText("src/storePrivacyAnswersDraft.md");
const finalLaunchStage = readText("src/finalLaunchStage.md");
const releaseChecklist = readText("src/releaseChecklist.md");
const deviceQaChecklist = readText("src/deviceQaChecklist.md");
const storeListing = readText("src/storeListingDraft.md");
const storeSubmissionPacket = readText("src/storeSubmissionPacket.json");
const appReviewTestPlan = readText("src/appReviewTestPlan.md");

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
assert(packageJson.scripts?.["version:check"] === "node scripts/version_check.js", "version:check script is missing");
assert(packageJson.scripts?.["ci:check"] === "node scripts/ci_check.js", "ci:check script is missing");
assert(packageJson.scripts?.["release:check"] === "node scripts/mobile_release_check.js", "release:check script is missing");
assert(packageJson.scripts?.["store:check"] === "node scripts/store_submission_check.js", "store:check script is missing");
assert(packageJson.scripts?.["review:check"] === "node scripts/app_review_check.js", "review:check script is missing");
assert(packageJson.scripts?.["launch:report"] === "node scripts/generate_launch_report.js", "launch:report script is missing");
assert(packageJson.scripts?.["launch:smoke"] === "node scripts/launch_smoke_check.js", "launch:smoke script is missing");
assert(packageJson.scripts?.["backend:check"] === "node scripts/backend_connectivity_check.js", "backend:check script is missing");
assert(packageJson.scripts?.["auth:smoke"] === "node scripts/auth_smoke_check.js", "auth:smoke script is missing");
assert(packageJson.scripts?.["report:smoke"] === "node scripts/report_smoke_check.js", "report:smoke script is missing");
assert(packageJson.dependencies?.["expo-secure-store"], "expo-secure-store dependency is missing");
assert(packageJson.dependencies?.["expo-document-picker"], "expo-document-picker dependency is missing");
assert(packageJson.dependencies?.["expo-constants"], "expo-constants dependency is missing");

assert(appSource.includes("SecureStore"), "App must use secure token storage");
assert(appSource.includes("Constants.expoConfig?.extra?.apiBaseUrl"), "App must read API URL from Expo config");
assert(!appSource.includes('const API_BASE_URL = "https://carewise-api.onrender.com"'), "App must not hardcode production API URL only in source");
assert(!appSource.includes('useState("patient@example.com")'), "Production app must not prefill demo email addresses.");
assert(appSource.includes('placeholder="Email address"'), "Account email field must use a placeholder instead of a prefilled value.");
assert(appSource.includes("Enter your email and password before signing in."), "App must validate missing sign-in credentials.");
assert(appSource.includes("DocumentPicker.getDocumentAsync"), "App must expose file picking");
assert(appSource.includes("uploadReportFile"), "App must call mobile file upload");
assert(appSource.includes("logout"), "App must include logout behavior");
assert(appSource.includes("api.logout(refreshToken)"), "App logout must revoke refresh tokens through the backend");
assert(appSource.includes("requestPasswordReset"), "App must include password reset request behavior");
assert(appSource.includes("confirmPasswordReset"), "App must include password reset confirm behavior");
assert(appSource.includes("requestEmailVerification"), "App must include email verification request behavior");
assert(appSource.includes("confirmEmailVerification"), "App must include email verification confirm behavior");
assert(appSource.includes("loadPrivacySummary"), "App must include privacy export summary behavior");
assert(appSource.includes("requestDataDeletion"), "App must include data deletion request behavior");

assert(apiClient.includes("/reports/upload-file"), "API client must call multipart report upload endpoint");
assert(apiClient.includes("/auth/password-reset/request"), "API client must call password reset request endpoint");
assert(apiClient.includes("/auth/password-reset/confirm"), "API client must call password reset confirm endpoint");
assert(apiClient.includes("/auth/email-verification/request"), "API client must call email verification request endpoint");
assert(apiClient.includes("/auth/email-verification/confirm"), "API client must call email verification confirm endpoint");
assert(apiClient.includes("/privacy/me/export-summary"), "API client must call privacy export summary endpoint");
assert(apiClient.includes("/privacy/me/delete-request"), "API client must call data deletion request endpoint");
assert(apiClient.includes("/auth/logout"), "API client must call logout endpoint");
assert(apiClient.includes("FormData"), "API client must use FormData for file uploads");
assert(apiClient.includes("/reports/") && apiClient.includes("/analyze"), "API client must analyze uploaded reports");
assert(!apiClient.includes("OPENAI_API_KEY"), "Mobile app must not include OpenAI API keys");

assert(safetyRules.toLowerCase().includes("not a diagnosis"), "Safety rules must include non-diagnostic wording");
assert(privacyChecklist.includes("Google Play Data Safety"), "Privacy checklist must mention Google Play Data Safety");
assert(storePrivacyAnswers.includes("Do not sell health data"), "Store privacy answers must prohibit selling health data");
assert(storePrivacyAnswers.includes("CareWise AI is not a medical diagnosis"), "Store privacy answers must include non-diagnostic positioning");
assert(finalLaunchStage.includes("must not claim to diagnose"), "Final launch stage must include safe positioning");
assert(releaseChecklist.includes("Do Not Submit If"), "Release checklist must include submission blockers");
assert(deviceQaChecklist.includes("Do not submit the app"), "Device QA checklist must include release blockers");
assert(storeListing.includes("CareWise AI is not a medical diagnosis tool"), "Store listing must include medical disclaimer");
assert(storeSubmissionPacket.includes('"screenshotChecklist"'), "Store submission packet must include screenshot checklist");
assert(storeSubmissionPacket.includes("Do not submit before legal review"), "Store submission packet must include legal submission blockers");
assert(appReviewTestPlan.includes("Synthetic Report Text"), "App review test plan must include synthetic report text");
assert(appReviewTestPlan.includes("Do not commit reviewer passwords"), "App review test plan must prohibit committed reviewer passwords");

console.log("CareWise mobile release check passed.");
