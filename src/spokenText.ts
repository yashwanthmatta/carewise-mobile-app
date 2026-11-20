// Read aloud: the words a voice says for a report. Same rules as spokenText in the website's
// script.js (keep the two in step; scripts/speech_cases_check.js pins both behaviours).
// Lab values are written for the eye ("12 x10^3/uL", "<0.04", "3.5-5.1"); a voice reads such text
// letter by letter or drops the symbols. spokenText rewrites only numbers, units and symbols that
// sit next to a number, into words with the same meaning. Words are never changed, so "not",
// "may" or "urgent" stay exactly as written. A unit it does not know is left as written.
type Lang = "en" | "es";

const SPOKEN_UNITS: Record<Lang, Record<string, string>> = {
  en: {
    "mL/min/1.73m2": "milliliters per minute per 1.73 square meters", "mL/min/1.73m²": "milliliters per minute per 1.73 square meters",
    "mg/dL": "milligrams per deciliter", "g/dL": "grams per deciliter", "ng/dL": "nanograms per deciliter",
    "ug/dL": "micrograms per deciliter", "µg/dL": "micrograms per deciliter", "mcg/dL": "micrograms per deciliter",
    "mg/L": "milligrams per liter", "g/L": "grams per liter", "mg/g": "milligrams per gram",
    "mmol/mol": "millimoles per mole", "mmol/L": "millimoles per liter", "umol/L": "micromoles per liter", "µmol/L": "micromoles per liter",
    "nmol/L": "nanomoles per liter", "pmol/L": "picomoles per liter", "mEq/L": "milliequivalents per liter",
    "uIU/mL": "micro international units per milliliter", "µIU/mL": "micro international units per milliliter",
    "mIU/mL": "milli international units per milliliter", "mIU/L": "milli international units per liter",
    "IU/L": "international units per liter", "U/L": "units per liter",
    "ng/mL": "nanograms per milliliter", "pg/mL": "picograms per milliliter",
    "mm/hr": "millimeters per hour", "mmHg": "millimeters of mercury", "fL": "femtoliters", "pg": "picograms",
    "%": "percent",
  },
  es: {
    "mL/min/1.73m2": "mililitros por minuto por 1.73 metros cuadrados", "mL/min/1.73m²": "mililitros por minuto por 1.73 metros cuadrados",
    "mg/dL": "miligramos por decilitro", "g/dL": "gramos por decilitro", "ng/dL": "nanogramos por decilitro",
    "ug/dL": "microgramos por decilitro", "µg/dL": "microgramos por decilitro", "mcg/dL": "microgramos por decilitro",
    "mg/L": "miligramos por litro", "g/L": "gramos por litro", "mg/g": "miligramos por gramo",
    "mmol/mol": "milimoles por mol", "mmol/L": "milimoles por litro", "umol/L": "micromoles por litro", "µmol/L": "micromoles por litro",
    "nmol/L": "nanomoles por litro", "pmol/L": "picomoles por litro", "mEq/L": "miliequivalentes por litro",
    "uIU/mL": "microunidades internacionales por mililitro", "µIU/mL": "microunidades internacionales por mililitro",
    "mIU/mL": "miliunidades internacionales por mililitro", "mIU/L": "miliunidades internacionales por litro",
    "IU/L": "unidades internacionales por litro", "U/L": "unidades por litro",
    "ng/mL": "nanogramos por mililitro", "pg/mL": "picogramos por mililitro",
    "mm/hr": "milímetros por hora", "mmHg": "milímetros de mercurio", "fL": "femtolitros", "pg": "picogramos",
    "%": "por ciento",
  },
};
// "x10^9/L" is a billion per liter in English but "mil millones" in Spanish ("billón" is 10^12).
const SPOKEN_POWERS: Record<Lang, Record<string, string>> = {
  en: { 3: "thousand", 6: "million", 9: "billion", 12: "trillion" },
  es: { 3: "mil", 6: "millones", 9: "mil millones", 12: "billones" },
};
const SPOKEN_WORDS: Record<Lang, Record<string, string>> = {
  en: { point: "point", to: "to", minus: "minus", lt: "less than", gt: "more than", le: "less than or equal to", ge: "more than or equal to", per: "per", microliter: "microliter", liter: "liter" },
  es: { point: "punto", to: "a", minus: "menos", lt: "menos de", gt: "más de", le: "menor o igual a", ge: "mayor o igual a", per: "por", microliter: "microlitro", liter: "litro" },
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function spokenText(text: string, lang: string = "en"): string {
  const key: Lang = lang === "es" ? "es" : "en";
  const words = SPOKEN_WORDS[key];
  const units = SPOKEN_UNITS[key];
  const num = "\\d+(?:\\.\\d+)?";
  let out = String(text || "");
  // Powers of ten written as "x10^3/uL" or "x 10^9/L".
  out = out.replace(new RegExp(`(${num})\\s*[x×]\\s*10\\^(\\d+)\\s*/\\s*(uL|µL|L)(?![A-Za-z])`, "g"), (match: string, value: string, power: string, per: string) => {
    const size = SPOKEN_POWERS[key][power];
    if (!size) return match;
    return `${value} ${size} ${words.per} ${per === "L" ? words.liter : words.microliter}`;
  });
  // Comparisons before a number: "<0.04", ">= 60", "≤5".
  out = out.replace(new RegExp(`(<=|≤|>=|≥|<|>)\\s*(?=\\d)`, "g"), (sign: string) => {
    const s = sign.trim();
    const word = s === "<" ? words.lt : s === ">" ? words.gt : s === "<=" || s === "≤" ? words.le : words.ge;
    return `${word} `;
  });
  // Ranges "3.5-5.1" or "3.5 – 5.1" become "3.5 to 5.1"; a lone "-2" becomes "minus 2".
  out = out.replace(new RegExp(`(${num})\\s*[-–]\\s*(?=\\d)`, "g"), `$1 ${words.to} `);
  out = out.replace(new RegExp(`(^|[\\s(])-(?=\\d)`, "g"), `$1${words.minus} `);
  // Units right after a number, longest first so "mIU/mL" wins over "IU/L".
  const names = Object.keys(units).sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
  out = out.replace(new RegExp(`(\\d)\\s*(${names})(?![A-Za-z0-9/²])`, "g"), (match: string, digit: string, unit: string) => `${digit} ${units[unit]}`);
  // Decimals said digit by digit after the point ("0.04" is "0 point 0 4"), so no voice can drop
  // the point, read it as a thousands mark, or turn "0.04" into "point four".
  out = out.replace(/(\d)\.(\d+)/g, (match: string, whole: string, decimals: string) => `${whole} ${words.point} ${decimals.split("").join(" ")}`);
  return out.replace(/\s+/g, " ").trim();
}

type SpokenCard = { name: string; value: string; label: string; rangeLabel: string; range?: string; what?: string; meaning?: string; ask?: string };
type SpokenView = { headline: string; body: string[]; cards: SpokenCard[]; text: { noRangePrinted: string } };

// What the Listen button says, in the order it is shown: the summary, then each result card.
// Nothing here runs until the person presses Listen.
export function listenParts(view: SpokenView, nextStep: string, lang: string): string[] {
  const parts = [view.headline, ...view.body, nextStep];
  for (const card of view.cards) {
    parts.push(`${card.name}: ${card.value}. ${card.label}.`);
    parts.push(`${card.rangeLabel}: ${card.range || view.text.noRangePrinted}`);
    parts.push(card.what || "", card.meaning || "", card.ask ? `“${card.ask}”` : "");
  }
  return parts.map((part) => spokenText(part, lang)).filter(Boolean);
}
