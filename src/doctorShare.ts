import { buildRecordSummary, getRecordFor, type HealthRecordItem } from "./healthRecord";
import type { ReportAnalysis } from "./reportAnalysis";
import { buildReportView } from "./reportView";

// The read-only summary sent with "Share with my doctor". Same shape as the website's,
// always in English, and only what the family already sees on the result.
const NEXT_STEP: Record<ReportAnalysis["riskLevel"], string> = {
  urgent: "Contact the doctor today. If very unwell, seek emergency care.",
  needs_review: "Some results are well outside the lab's range; the patient will ask how soon you want to discuss them.",
  attention: "To bring up at the next visit.",
  routine: "Nothing urgent stands out. For the next checkup.",
};

export const SHARE_VIEWER_URL = "https://followthroughhealth.com/share.html";

export function buildShareSnapshot(analysis: ReportAnalysis, person: string, record: HealthRecordItem[]) {
  const summary = buildRecordSummary(getRecordFor(record, person));
  const entry = (item: HealthRecordItem) => ({ name: item.name, start: item.start || "", notes: item.notes || "" });
  return {
    version: 1,
    person,
    prepared_by: person === "Me" ? "the patient" : "a family caregiver",
    created_at: new Date().toISOString(),
    score: analysis.scanOnly || analysis.noData ? null : analysis.score,
    next_step: NEXT_STEP[analysis.riskLevel] ?? "",
    findings: analysis.findings.map((item) => ({ label: item.label, level: item.level, detail: item.detail })),
    values: analysis.labValues.map((item) => ({ label: item.label, value: String(item.value), unit: item.unit || "", flag: item.flag || "" })),
    panel: buildReportView(analysis, "en").tests.map((item) => ({
      name: item.name,
      result: item.value,
      range: item.range,
      status: item.label,
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
