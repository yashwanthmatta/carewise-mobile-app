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

function assertHttpsUrl(value, label) {
  assert(typeof value === "string" && value.startsWith("https://"), `${label} must be an HTTPS URL`);
}

const app = readJson("app.json").expo;
const packet = readJson("src/storeSubmissionPacket.json");
const listing = readText("src/storeListingDraft.md");
const privacyAnswers = readText("src/storePrivacyAnswersDraft.md");
const releaseChecklist = readText("src/releaseChecklist.md");

assert(packet.appName === "CareWise AI", "Store packet appName must be CareWise AI");
assert(app.name === "CareWise", "Expo app name must remain CareWise");
assert(packet.bundleId === app.ios?.bundleIdentifier, "Store packet bundleId must match app.json iOS bundleIdentifier");
assert(packet.androidPackage === app.android?.package, "Store packet androidPackage must match app.json Android package");
assert(packet.category?.apple === "Health & Fitness", "Apple category must be Health & Fitness");
assert(packet.category?.googlePlay === "Health & Fitness", "Google Play category must be Health & Fitness");

assertHttpsUrl(packet.support?.url, "Support URL");
assertHttpsUrl(packet.support?.privacyPolicyUrl, "Privacy Policy URL");
assertHttpsUrl(packet.support?.termsUrl, "Terms URL");
assertHttpsUrl(packet.support?.medicalDisclaimerUrl, "Medical Disclaimer URL");
assertHttpsUrl(packet.support?.dataDeletionUrl, "Data Deletion URL");

assert(Array.isArray(packet.reviewNotes) && packet.reviewNotes.length >= 3, "Review notes must include at least three notes");
assert(packet.reviewNotes.some((note) => note.includes("not a medical diagnosis tool")), "Review notes must include non-diagnostic wording");
assert(packet.reviewNotes.some((note) => note.includes("data deletion")), "Review notes must mention data deletion");

assert(Array.isArray(packet.screenshotChecklist) && packet.screenshotChecklist.length >= 5, "Screenshot checklist must include at least five screens");
assert(packet.screenshotChecklist.some((item) => item.name === "Report upload"), "Screenshot checklist must include Report upload");
assert(packet.screenshotChecklist.some((item) => item.name === "Legal"), "Screenshot checklist must include Legal");

assert(Array.isArray(packet.submissionBlockers) && packet.submissionBlockers.length >= 4, "Submission blockers must be explicit");
assert(packet.submissionBlockers.some((item) => item.toLowerCase().includes("legal review")), "Submission blockers must require legal review");
assert(packet.submissionBlockers.some((item) => item.toLowerCase().includes("clinician review")), "Submission blockers must require clinician review");

assert(listing.includes("CareWise AI is not a medical diagnosis tool"), "Store listing must keep non-diagnostic wording");
assert(listing.includes(packet.support.privacyPolicyUrl), "Store listing must include privacy policy URL");
assert(listing.includes(packet.support.dataDeletionUrl), "Store listing must include data deletion URL");
assert(privacyAnswers.includes("Do not sell health data"), "Privacy answers must prohibit selling health data");
assert(releaseChecklist.includes("Apple App Privacy"), "Release checklist must mention Apple App Privacy");
assert(releaseChecklist.includes("Google Play Data Safety"), "Release checklist must mention Google Play Data Safety");

console.log("CareWise store submission packet check passed.");
