const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo;
const apiBaseUrl = app.extra?.apiBaseUrl;
const runId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const email = `mobile-smoke-${runId}@example.com`;
const password = `Smoke-${runId}-password`;
const newPassword = `Smoke-${runId}-new-password`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(pathname, options = {}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  assert(apiBaseUrl?.startsWith("https://"), "expo.extra.apiBaseUrl must be an HTTPS URL.");

  const signup = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, role: "patient" }),
  });
  assert(signup.access_token, "Signup must return an access token.");
  assert(signup.refresh_token, "Signup must return a refresh token.");

  const me = await request("/auth/me", {
    headers: { Authorization: `Bearer ${signup.access_token}` },
  });
  assert(me.email === email, "Signed-in session email must match smoke account.");
  assert(me.email_verified === false, "Smoke account should start unverified.");

  const verification = await request("/auth/email-verification/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${signup.access_token}` },
  });
  assert(["already_verified", "email_queued", "email_provider_not_configured"].includes(verification.delivery_status), "Unexpected verification delivery status.");

  const refresh = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: signup.refresh_token }),
  });
  assert(refresh.access_token, "Refresh must return an access token.");
  assert(refresh.refresh_token && refresh.refresh_token !== signup.refresh_token, "Refresh token must rotate.");

  await request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh.refresh_token }),
  });

  const revoked = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh.refresh_token }),
  });
  assert(revoked.status === 401, "Logged-out refresh token must be revoked.");

  const reset = await request("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  assert(reset.status === "ok", "Password reset request must return ok.");
  assert(["email_queued", "email_provider_not_configured"].includes(reset.delivery_status), "Unexpected reset delivery status.");

  if (reset.reset_token) {
    const confirmed = await request("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token: reset.reset_token, new_password: newPassword }),
    });
    assert(confirmed.access_token, "Password reset confirm must return an access token in non-production.");
  }

  console.log(`CareWise auth smoke check passed for ${apiBaseUrl} with ${email}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
