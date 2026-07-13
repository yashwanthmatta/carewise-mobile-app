const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "docs", "launch-readiness-report.md");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function checkbox(done, text) {
  return `- [${done ? "x" : " "}] ${text}`;
}

const app = readJson("app.json").expo;
const packageJson = readJson("package.json");
const storePacket = readJson("src/storeSubmissionPacket.json");
const storeListing = readText("src/storeListingDraft.md");
const reviewPlan = readText("src/appReviewTestPlan.md");
const releaseChecklist = readText("src/releaseChecklist.md");

const requiredScripts = [
  "ci:check",
  "release:check",
  "store:check",
  "review:check",
  "launch:report",
  "launch:smoke",
  "backend:check",
  "auth:smoke",
  "report:smoke",
  "build:preflight",
  "build:android:preview",
  "build:ios:preview",
];

const report = `# CareWise Mobile Launch Readiness Report

Generated from the local mobile project configuration.

## App Identity

- App name: ${storePacket.appName}
- Expo name: ${app.name}
- Version: ${app.version}
- iOS bundle ID: ${app.ios?.bundleIdentifier ?? "missing"}
- Android package: ${app.android?.package ?? "missing"}
- Backend API: ${app.extra?.apiBaseUrl ?? "missing"}

## Automated Gates

${requiredScripts.map((script) => checkbox(Boolean(packageJson.scripts?.[script]), `\`${script}\` script exists`)).join("\n")}
${checkbox(storeListing.includes("CareWise AI is not a medical diagnosis tool"), "Store listing includes non-diagnostic wording")}
${checkbox(reviewPlan.includes("This is not real patient data"), "Reviewer test plan uses synthetic data")}
${checkbox(releaseChecklist.includes("Do Not Submit If"), "Release checklist includes submission blockers")}

## Store Submission Packet

- Apple category: ${storePacket.category.apple}
- Google Play category: ${storePacket.category.googlePlay}
- Support URL: ${storePacket.support.url}
- Privacy Policy URL: ${storePacket.support.privacyPolicyUrl}
- Terms URL: ${storePacket.support.termsUrl}
- Medical Disclaimer URL: ${storePacket.support.medicalDisclaimerUrl}
- Data Deletion URL: ${storePacket.support.dataDeletionUrl}

## Screenshot Plan

${storePacket.screenshotChecklist.map((item) => `- ${item.name}: ${item.mustShow}`).join("\n")}

## Human Blockers Before Public Launch

${storePacket.submissionBlockers.map((item) => `- ${item}`).join("\n")}
- Apple Developer account access and paid agreement must be active.
- Google Play Console account access must be active.
- TestFlight and Android internal testing must pass on real devices.
- Legal, privacy, and clinician review must be completed before real patient use.

## Safe Review Notes

${storePacket.reviewNotes.map((note) => `- ${note}`).join("\n")}

## Next Commands

\`\`\`bash
npm run ci:check
npm run launch:report
npm run launch:smoke
npm run backend:check
npm run auth:smoke
npm run report:smoke
npm run eas:login
npm run build:android:preview
npm run build:ios:preview
\`\`\`
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report);
console.log(`CareWise launch readiness report written to ${path.relative(root, outputPath)}.`);
