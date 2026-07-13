const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const reviewPlan = readText("src/appReviewTestPlan.md");
const storePacket = readText("src/storeSubmissionPacket.json");
const lowerPlan = reviewPlan.toLowerCase();

assert(reviewPlan.includes("Reviewer Access"), "Review plan must explain reviewer access.");
assert(reviewPlan.includes("Safe Test Scenario"), "Review plan must include a safe test scenario.");
assert(reviewPlan.includes("Synthetic Report Text"), "Review plan must include synthetic report text.");
assert(reviewPlan.includes("This is not real patient data"), "Synthetic scenario must clearly say it is not real patient data.");
assert(lowerPlan.includes("not a medical diagnosis tool"), "Review plan must keep non-diagnostic wording.");
assert(lowerPlan.includes("does not provide emergency care"), "Review plan must say CareWise does not provide emergency care.");
assert(lowerPlan.includes("licensed clinician"), "Review plan must direct review of health results to licensed clinicians.");
assert(lowerPlan.includes("data deletion request"), "Review plan must test data deletion request controls.");
assert(lowerPlan.includes("do not commit reviewer passwords"), "Review plan must prohibit committed reviewer passwords.");

const forbiddenPatterns = [
  /ghp_[A-Za-z0-9_]+/,
  /sk-[A-Za-z0-9_-]+/,
  /password\s*[:=]\s*\S+/i,
  /Matta@/i,
];

for (const pattern of forbiddenPatterns) {
  assert(!pattern.test(reviewPlan), "Review plan must not contain secrets, passwords, or personal credentials.");
}

assert(storePacket.includes("Test accounts used for review should not include real protected health information."), "Store packet must warn reviewers not to use real PHI.");

console.log("CareWise app review test plan check passed.");
