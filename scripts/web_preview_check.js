// Web preview guard (E-004, 20 Nov 2026). `npm run web` needs react-dom and react-native-web at the
// versions this Expo SDK expects, and secure storage has no web version. This checks both without a
// network or a browser, so it can run in Mobile CI:
// - react-dom matches react exactly, and react-native-web is installed;
// - only src/secureStorage.ts imports expo-secure-store, so the web preview never calls a native-only
//   module (it keeps sign-in in memory instead of in browser storage).
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const deps = pkg.dependencies || {};
const problems = [];

const bare = (v) => String(v || "").replace(/^[~^]/, "");
if (!deps["react-dom"]) problems.push("react-dom is missing from dependencies");
else if (bare(deps["react-dom"]) !== bare(deps.react)) problems.push(`react-dom ${deps["react-dom"]} does not match react ${deps.react}`);
if (!deps["react-native-web"]) problems.push("react-native-web is missing from dependencies");

const allowed = path.join("src", "secureStorage.ts");
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(name) && path.relative(root, full) !== allowed) {
      if (/from\s+["']expo-secure-store["']|require\(["']expo-secure-store["']\)/.test(fs.readFileSync(full, "utf8"))) {
        problems.push(`${path.relative(root, full)} imports expo-secure-store directly; use src/secureStorage instead`);
      }
    }
  }
}
walk(path.join(root, "src"));
for (const file of ["App.tsx"]) {
  if (/from\s+["']expo-secure-store["']/.test(fs.readFileSync(path.join(root, file), "utf8"))) {
    problems.push(`${file} imports expo-secure-store directly; use src/secureStorage instead`);
  }
}

if (problems.length) {
  console.error("Web preview check failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("Web preview check passed: react-dom and react-native-web present; secure storage goes through src/secureStorage.");
