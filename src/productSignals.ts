// Anonymous product signals, matching the website: a daily count of a few actions,
// "Was this helpful?" answers and early-access sign-ups. No report text, account or
// device id is sent. Failures are silent for counts and explained for the forms.

export const USAGE_EVENTS = ["report_explained", "sample_opened", "doctor_brief_opened", "spanish_used", "early_access_opened"] as const;
export type UsageEvent = (typeof USAGE_EVENTS)[number];
export const EARLY_ACCESS_ROLES = ["caregiver", "patient", "clinician", "other"] as const;
export type EarlyAccessRole = (typeof EARLY_ACCESS_ROLES)[number];

async function post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}/product/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = new Error(`CareWise answered ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export function trackUsage(baseUrl: string, name: UsageEvent): void {
  post(baseUrl, "events", { name, source: "mobile" }).catch(() => undefined);
}

export function sendFeedback(baseUrl: string, helpful: boolean): Promise<{ ok: boolean; id?: string | null }> {
  return post(baseUrl, "feedback", { helpful, source: "mobile" });
}

export function sendFeedbackComment(baseUrl: string, id: string, comment: string): Promise<{ ok: boolean }> {
  return post(baseUrl, `feedback/${encodeURIComponent(id)}/comment`, { comment });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function joinEarlyAccess(baseUrl: string, input: { email: string; role: EarlyAccessRole; note: string }): Promise<{ ok: boolean }> {
  return post(baseUrl, "early-access", { email: input.email.trim(), role: input.role, note: input.note.trim(), consent: true, source: "mobile" });
}
