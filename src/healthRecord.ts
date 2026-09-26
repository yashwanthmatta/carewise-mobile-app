// Lifetime health record. Same entry shape, rules and backup format as the
// CareWise website, so a backup made on one opens on the other.

export type HealthRecordType = "condition" | "medicine" | "reaction" | "habit" | "procedure";

export type HealthRecordItem = {
  id: string;
  type: HealthRecordType;
  name: string;
  person: string;
  start: string; // YYYY-MM or ""
  end: string; // YYYY-MM or ""
  ongoing: boolean;
  notes: string;
  sample?: boolean;
  createdAt: string;
};

export const HEALTH_RECORD_STORAGE_KEY = "carewiseHealthRecord";

export const HEALTH_RECORD_TYPES: Record<HealthRecordType, { label: string; formLabel: string }> = {
  condition: { label: "Condition", formLabel: "Condition" },
  medicine: { label: "Medicine", formLabel: "Medicine" },
  reaction: { label: "Did not suit me", formLabel: "Did not suit me" },
  habit: { label: "Habit", formLabel: "Habit" },
  procedure: { label: "Surgery or visit", formLabel: "Surgery or visit" }
};

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function normalizeRecordPerson(value: unknown): string {
  const person = String(value || "").trim().slice(0, 40);
  return person && person.toLowerCase() !== "me" ? person : "Me";
}

export function isValidRecordMonth(value: string): boolean {
  if (!MONTH_PATTERN.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const year = Number(value.slice(0, 4));
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
}

export function isRecordItemCurrent(item: HealthRecordItem): boolean {
  return item.type === "reaction" || item.ongoing || !item.end;
}

export function formatRecordMonth(value: string): string {
  if (!isValidRecordMonth(value)) return "";
  return `${MONTH_NAMES[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;
}

export function formatRecordRange(item: HealthRecordItem): string {
  const start = formatRecordMonth(item.start);
  if (item.type === "reaction") return start ? `Noted ${start}` : "Date not recorded";
  if (start && !item.ongoing && item.end === item.start) return start;
  const end = item.ongoing || !item.end ? "now" : formatRecordMonth(item.end);
  return start ? `${start} to ${end}` : end === "now" ? "Ongoing" : `Until ${end}`;
}

export function getRecordPeople(items: HealthRecordItem[], extra: string[] = []): string[] {
  const people = new Set<string>(extra.map(normalizeRecordPerson));
  items.forEach((item) => people.add(normalizeRecordPerson(item.person)));
  return ["Me", ...[...people].filter((person) => person !== "Me")];
}

export function getRecordFor(items: HealthRecordItem[], person: string): HealthRecordItem[] {
  return items.filter((item) => normalizeRecordPerson(item.person) === person);
}

export function buildRecordSummary(items: HealthRecordItem[]) {
  return {
    conditions: items.filter((item) => item.type === "condition" && isRecordItemCurrent(item)),
    medicines: items.filter((item) => item.type === "medicine" && isRecordItemCurrent(item)),
    reactions: items.filter((item) => item.type === "reaction")
  };
}

export function groupRecordByYear(items: HealthRecordItem[], type: HealthRecordType | "" = ""): [string, HealthRecordItem[]][] {
  const groups = new Map<string, HealthRecordItem[]>();
  items
    .filter((item) => !type || item.type === type)
    .sort((a, b) => b.start.localeCompare(a.start))
    .forEach((item) => {
      const year = /^\d{4}/.test(item.start) ? item.start.slice(0, 4) : "Date not recorded";
      groups.set(year, [...(groups.get(year) || []), item]);
    });
  return [...groups];
}

export type NewRecordInput = { type: HealthRecordType; name: string; person: string; start: string; end: string; ongoing: boolean; notes: string };

// Returns an error message, or the new item.
export function createRecordItem(input: NewRecordInput, now = new Date()): HealthRecordItem | string {
  const name = input.name.trim().slice(0, 80);
  if (!name) return "Add a name first, for example the condition or medicine.";
  if (input.start && !isValidRecordMonth(input.start)) return "Write the start date as year-month, for example 2015-02.";
  const ongoing = input.type !== "reaction" && input.ongoing;
  const end = ongoing || input.type === "reaction" ? "" : input.end;
  if (end && !isValidRecordMonth(end)) return "Write the end date as year-month, for example 2016-01.";
  if (input.start && end && end < input.start) return "The end date is before the start date. Please check the dates.";
  return {
    id: `rec-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    name,
    person: normalizeRecordPerson(input.person),
    start: input.start,
    end,
    ongoing,
    notes: input.notes.trim().slice(0, 400),
    createdAt: now.toISOString()
  };
}

const SAMPLE_HISTORY: Omit<HealthRecordItem, "id" | "person" | "createdAt">[] = [
  { type: "procedure", name: "Appendix removed (appendectomy)", start: "2006-03", end: "2006-03", ongoing: false, notes: "Two nights in hospital, recovered fully." },
  { type: "reaction", name: "Penicillin", start: "2009-07", end: "", ongoing: false, notes: "Itchy rash after 2 days. Doctor advised avoiding penicillin." },
  { type: "habit", name: "Smoking, about 10 a day", start: "2008-01", end: "2018-06", ongoing: false, notes: "Quit in 2018." },
  { type: "condition", name: "High blood pressure", start: "2015-02", end: "", ongoing: true, notes: "Checked every 6 months." },
  { type: "medicine", name: "Lisinopril 10 mg", start: "2015-02", end: "2016-01", ongoing: false, notes: "Stopped because of a dry cough." },
  { type: "reaction", name: "Lisinopril", start: "2016-01", end: "", ongoing: false, notes: "Dry cough that went away after stopping." },
  { type: "medicine", name: "Amlodipine 5 mg, once a day", start: "2016-01", end: "", ongoing: true, notes: "Morning, with food." },
  { type: "habit", name: "Walking 30 minutes, 5 days a week", start: "2019-04", end: "", ongoing: true, notes: "" },
  { type: "condition", name: "Prediabetes (A1C 5.9%)", start: "2021-09", end: "", ongoing: true, notes: "Repeat A1C every year." },
  { type: "procedure", name: "Colonoscopy screening", start: "2024-05", end: "2024-05", ongoing: false, notes: "Normal result. Next in 10 years." }
];

// Synthetic example for demos; not a real person. Replaces any earlier sample for that person.
export function withSampleHistory(items: HealthRecordItem[], person: string, now = new Date()): HealthRecordItem[] {
  const who = normalizeRecordPerson(person);
  const kept = items.filter((item) => !(item.sample && normalizeRecordPerson(item.person) === who));
  const stamp = now.getTime();
  return [
    ...kept,
    ...SAMPLE_HISTORY.map((item, index) => ({ ...item, id: `rec-sample-${stamp}-${index}`, person: who, sample: true, createdAt: now.toISOString() }))
  ];
}

export function serializeRecordBackup(items: HealthRecordItem[], now = new Date()): string {
  return JSON.stringify({ app: "CareWise", kind: "health-record", version: 1, exportedAt: now.toISOString(), items }, null, 2);
}

// Merges a backup (from the phone or the website) into the record, skipping entries already present.
export function mergeRecordBackup(items: HealthRecordItem[], backupText: string): { items: HealthRecordItem[]; added: number } | null {
  let data: unknown;
  try {
    data = JSON.parse(backupText);
  } catch {
    return null;
  }
  const list = Array.isArray(data) ? data : (data as { items?: unknown })?.items;
  if (!Array.isArray(list)) return null;
  const known = new Set(items.map((item) => item.id));
  const added: HealthRecordItem[] = [];
  list.forEach((raw) => {
    const item = raw as Partial<HealthRecordItem>;
    if (!item || !item.id || !item.name || !item.type || !(item.type in HEALTH_RECORD_TYPES)) return;
    const id = String(item.id).slice(0, 80);
    if (known.has(id)) return;
    known.add(id);
    added.push({
      id,
      type: item.type,
      name: String(item.name).slice(0, 80),
      person: normalizeRecordPerson(item.person),
      start: isValidRecordMonth(String(item.start || "")) ? String(item.start) : "",
      end: isValidRecordMonth(String(item.end || "")) ? String(item.end) : "",
      ongoing: Boolean(item.ongoing),
      notes: String(item.notes || "").slice(0, 400),
      sample: Boolean(item.sample),
      createdAt: String(item.createdAt || "")
    });
  });
  return { items: [...items, ...added], added: added.length };
}

export function parseStoredRecord(text: string | null): HealthRecordItem[] {
  if (!text) return [];
  return mergeRecordBackup([], text)?.items ?? [];
}

export function buildHistoryBriefText(items: HealthRecordItem[], person: string): string {
  const summary = buildRecordSummary(getRecordFor(items, normalizeRecordPerson(person)));
  if (!summary.conditions.length && !summary.medicines.length && !summary.reactions.length) return "";
  const lines = (list: HealthRecordItem[]) =>
    list.length
      ? list.map((item) => `- ${item.name}${item.start ? ` (since ${formatRecordMonth(item.start)})` : ""}${item.notes ? `: ${item.notes}` : ""}`).join("\n")
      : "- None recorded";
  return [
    "Health history (entered by the patient):",
    "Ongoing conditions:",
    lines(summary.conditions),
    "Current medicines:",
    lines(summary.medicines),
    "Did not suit me:",
    lines(summary.reactions)
  ].join("\n");
}
