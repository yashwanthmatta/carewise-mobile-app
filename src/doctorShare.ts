import { buildRecordSummary, getRecordFor, type HealthRecordItem } from "./healthRecord";
import { LAB_PANEL_TEXT } from "./labPanel";
import type { ReportAnalysis } from "./reportAnalysis";

// The read-only summary sent with "Share with my doctor". Same shape as the website's,
// always in English, and only what the family already sees on the result.
const NEXT_STEP: Record<ReportAnalysis["riskLevel"], string> = {
  urgent: "Contact the doctor today. If very unwell, seek emergency care.",
  needs_review: "Asked to discuss these results soon.",
  attention: "To bring up at the next visit.",
  routine: "Nothing urgent stands out. For the next checkup.",
};

export const SHARE_VIEWER_URL = "https://carewise-frontend.onrender.com/share.html";

export function buildShareSnapshot(analysis: ReportAnalysis, person: string, record: HealthRecordItem[]) {
  const summary = buildRecordSummary(getRecordFor(record, person));
  const entry = (item: HealthRecordItem) => ({ name: item.name, start: item.start || "", notes: item.notes || "" });
  const statusText = LAB_PANEL_TEXT.en as Record<string, string>;
  return {
    version: 1,
    person,
    prepared_by: person === "Me" ? "the patient" : "a family caregiver",
    created_at: new Date().toISOString(),
    score: analysis.scanOnly || analysis.noData ? null : analysis.score,
    next_step: NEXT_STEP[analysis.riskLevel] ?? "",
    findings: analysis.findings.map((item) => ({ label: item.label, level: item.level, detail: item.detail })),
    values: analysis.labValues.map((item) => ({ label: item.label, value: String(item.value), unit: item.unit || "", flag: item.flag || "" })),
    panel: analysis.panelResults.map((item) => ({
      name: item.name,
      result: `${item.valueText} ${item.unit || ""}`.trim(),
      range: item.rangeText || "",
      status: statusText[`status_${item.status}`] ?? item.status,
    })),
    scan: analysis.scan ? { modality: analysis.scan.en.modality || "Imaging", follow_ups: analysis.scan.en.followUps.map((item) => item.sentence) } : null,
    history: {
      conditions: summary.conditions.map(entry),
      medicines: summary.medicines.map(entry),
      did_not_suit: summary.reactions.map(entry),
    },
    questions: analysis.questions,
  };
}

export function shareViewerLink(token: string): string {
  return `${SHARE_VIEWER_URL}#t=${encodeURIComponent(token)}`;
}
