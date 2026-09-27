// Reads any lab row ("Test  value  unit  reference range  flag") and compares it
// with the range and flags the lab itself printed, so it works for tests whose
// normal range depends on the lab, age or sex. Plain-language glossary for
// common tests in English and draft Spanish. Education only.
// The website runs a JavaScript copy of this file; keep the two identical.

export type LabPanelStatus = "within" | "above" | "below" | "critical" | "outside" | "unknown";
export type LabPanelResult = {
  key: string;
  name: string;
  value: number;
  valueText: string;
  unit: string;
  rangeText: string;
  flag: string;
  status: LabPanelStatus;
};

type LabTest = { key: string; name: string; es: string; aliases: string[]; what: string; whatEs: string };

// Tests handled by the main report reader (LDL, total cholesterol, triglycerides,
// A1C, vitamin D, blood pressure) are deliberately not listed here.
export const LAB_TESTS: LabTest[] = [
  { key: "wbc", name: "White blood cells", es: "Glóbulos blancos", aliases: ["white blood cell count", "white blood cells", "white cell count", "wbc", "leukocytes", "leucocytes"], what: "Cells that fight infection.", whatEs: "Células que combaten las infecciones." },
  { key: "rbc", name: "Red blood cells", es: "Glóbulos rojos", aliases: ["red blood cell count", "red blood cells", "red cell count", "rbc", "erythrocytes"], what: "Cells that carry oxygen around the body.", whatEs: "Células que llevan oxígeno por el cuerpo." },
  { key: "hemoglobin", name: "Hemoglobin", es: "Hemoglobina", aliases: ["hemoglobin(?![\\s(]*(?:hb)?a1c)", "haemoglobin(?![\\s(]*(?:hb)?a1c)", "hgb", "hb(?!a1c)"], what: "The protein in red blood cells that carries oxygen; low levels can mean anemia.", whatEs: "La proteína de los glóbulos rojos que lleva oxígeno; si está baja puede indicar anemia." },
  { key: "hematocrit", name: "Hematocrit", es: "Hematocrito", aliases: ["hematocrit", "haematocrit", "hct", "packed cell volume"], what: "The share of your blood made up of red blood cells.", whatEs: "La parte de la sangre formada por glóbulos rojos." },
  { key: "mcv", name: "MCV (red cell size)", es: "VCM (tamaño de glóbulos rojos)", aliases: ["mean corpuscular volume", "mean cell volume", "mcv"], what: "The average size of your red blood cells.", whatEs: "El tamaño promedio de los glóbulos rojos." },
  { key: "mch", name: "MCH", es: "HCM", aliases: ["mean corpuscular hemoglobin(?! concentration)", "mean cell ha?emoglobin(?! concentration)", "mch(?!c)"], what: "The average amount of hemoglobin in each red blood cell.", whatEs: "La cantidad promedio de hemoglobina en cada glóbulo rojo." },
  { key: "mchc", name: "MCHC", es: "CHCM", aliases: ["mean corpuscular hemoglobin concentration", "mean cell ha?emoglobin concentration", "mchc"], what: "How concentrated the hemoglobin is inside red blood cells.", whatEs: "Qué tan concentrada está la hemoglobina dentro de los glóbulos rojos." },
  { key: "rdw", name: "RDW (red cell size variation)", es: "ADE (variación de tamaño)", aliases: ["red cell distribution width", "red cell distribution", "rdw"], what: "How much your red blood cells vary in size.", whatEs: "Cuánto varía el tamaño de los glóbulos rojos." },
  { key: "platelets", name: "Platelets", es: "Plaquetas", aliases: ["platelet count", "platelets", "plt", "thrombocytes"], what: "Cell pieces that help your blood clot.", whatEs: "Fragmentos de células que ayudan a coagular la sangre." },
  { key: "neutrophils", name: "Neutrophils", es: "Neutrófilos", aliases: ["neutrophils", "neutrophil"], what: "The most common white blood cell; they fight bacteria.", whatEs: "El glóbulo blanco más común; combate bacterias." },
  { key: "lymphocytes", name: "Lymphocytes", es: "Linfocitos", aliases: ["lymphocytes", "lymphs"], what: "White blood cells that fight viruses and make antibodies.", whatEs: "Glóbulos blancos que combaten virus y producen anticuerpos." },
  { key: "monocytes", name: "Monocytes", es: "Monocitos", aliases: ["monocytes"], what: "White blood cells that clean up germs and damaged cells.", whatEs: "Glóbulos blancos que limpian gérmenes y células dañadas." },
  { key: "eosinophils", name: "Eosinophils", es: "Eosinófilos", aliases: ["eosinophils", "eos"], what: "White blood cells involved in allergies and parasites.", whatEs: "Glóbulos blancos relacionados con alergias y parásitos." },
  { key: "basophils", name: "Basophils", es: "Basófilos", aliases: ["basophils", "basos"], what: "A rare white blood cell involved in allergic reactions.", whatEs: "Un glóbulo blanco poco común relacionado con reacciones alérgicas." },
  { key: "glucose", name: "Glucose (blood sugar)", es: "Glucosa (azúcar en sangre)", aliases: ["fasting glucose", "glucose", "blood sugar"], what: "The sugar level in your blood when the sample was taken.", whatEs: "El nivel de azúcar en la sangre cuando se tomó la muestra." },
  { key: "bun", name: "BUN (urea nitrogen)", es: "BUN (nitrógeno ureico)", aliases: ["blood urea nitrogen", "urea nitrogen", "bun", "urea"], what: "A waste product the kidneys remove; used to check kidney function.", whatEs: "Un desecho que eliminan los riñones; ayuda a revisar su función." },
  { key: "creatinine", name: "Creatinine", es: "Creatinina", aliases: ["creatinine"], what: "A muscle waste product the kidneys remove; used to check kidney function.", whatEs: "Un desecho de los músculos que eliminan los riñones; ayuda a revisar su función." },
  { key: "egfr", name: "eGFR (kidney filtering)", es: "TFGe (filtración renal)", aliases: ["estimated gfr", "egfr", "gfr"], what: "An estimate of how well your kidneys filter blood.", whatEs: "Una estimación de qué tan bien filtran la sangre los riñones." },
  { key: "sodium", name: "Sodium", es: "Sodio", aliases: ["sodium"], what: "A salt that helps balance fluids and nerves.", whatEs: "Una sal que ayuda a equilibrar los líquidos y los nervios." },
  { key: "potassium", name: "Potassium", es: "Potasio", aliases: ["potassium"], what: "A mineral important for heart rhythm and muscles.", whatEs: "Un mineral importante para el ritmo del corazón y los músculos." },
  { key: "chloride", name: "Chloride", es: "Cloruro", aliases: ["chloride"], what: "A salt that helps balance fluids and acid in the body.", whatEs: "Una sal que ayuda a equilibrar los líquidos y la acidez del cuerpo." },
  { key: "co2", name: "Bicarbonate (CO2)", es: "Bicarbonato (CO2)", aliases: ["carbon dioxide, total", "carbon dioxide", "bicarbonate", "co2", "hco3"], what: "Shows the acid and base balance in your blood.", whatEs: "Muestra el equilibrio entre ácido y base en la sangre." },
  { key: "calcium", name: "Calcium", es: "Calcio", aliases: ["calcium"], what: "A mineral for bones, muscles and nerves.", whatEs: "Un mineral para los huesos, los músculos y los nervios." },
  { key: "protein", name: "Total protein", es: "Proteína total", aliases: ["protein, total", "total protein"], what: "The total amount of protein in your blood.", whatEs: "La cantidad total de proteína en la sangre." },
  { key: "albumin", name: "Albumin", es: "Albúmina", aliases: ["albumin(?!\\s*\\/)"], what: "A protein made by the liver that keeps fluid in your blood vessels.", whatEs: "Una proteína del hígado que mantiene el líquido dentro de los vasos." },
  { key: "globulin", name: "Globulin", es: "Globulina", aliases: ["globulin, total", "globulin"], what: "A group of proteins that includes antibodies.", whatEs: "Un grupo de proteínas que incluye los anticuerpos." },
  { key: "bilirubin", name: "Bilirubin, total", es: "Bilirrubina total", aliases: ["bilirubin, total", "total bilirubin", "bilirubin(?!,? direct)"], what: "A yellow substance from old red blood cells, cleared by the liver.", whatEs: "Una sustancia amarilla de glóbulos rojos viejos que elimina el hígado." },
  { key: "alp", name: "Alkaline phosphatase", es: "Fosfatasa alcalina", aliases: ["alkaline phosphatase", "alk phos", "alp"], what: "An enzyme from the liver and bones.", whatEs: "Una enzima del hígado y los huesos." },
  { key: "alt", name: "ALT (liver enzyme)", es: "ALT (enzima hepática)", aliases: ["alt \\(sgpt\\)", "alanine aminotransferase", "sgpt", "alt"], what: "A liver enzyme; higher levels can mean the liver is irritated.", whatEs: "Una enzima del hígado; si está alta puede indicar irritación del hígado." },
  { key: "ast", name: "AST (liver enzyme)", es: "AST (enzima hepática)", aliases: ["ast \\(sgot\\)", "aspartate aminotransferase", "sgot", "ast"], what: "An enzyme in the liver and muscles.", whatEs: "Una enzima del hígado y los músculos." },
  { key: "hdl", name: "HDL cholesterol", es: "Colesterol HDL", aliases: ["hdl cholesterol", "cholesterol, hdl", "hdl-c", "hdl"], what: "The 'good' cholesterol that helps remove other cholesterol.", whatEs: "El colesterol 'bueno' que ayuda a eliminar otro colesterol." },
  { key: "nonhdl", name: "Non-HDL cholesterol", es: "Colesterol no HDL", aliases: ["non-hdl cholesterol", "non hdl cholesterol", "non-hdl"], what: "All the cholesterol except HDL.", whatEs: "Todo el colesterol excepto el HDL." },
  { key: "tsh", name: "TSH (thyroid)", es: "TSH (tiroides)", aliases: ["thyroid stimulating hormone", "tsh"], what: "A hormone that tells the thyroid how hard to work.", whatEs: "Una hormona que indica a la tiroides cuánto trabajar." },
  { key: "ft4", name: "Free T4 (thyroid)", es: "T4 libre (tiroides)", aliases: ["free t4", "t4, free", "free thyroxine"], what: "The main thyroid hormone in your blood.", whatEs: "La principal hormona tiroidea en la sangre." },
  { key: "ft3", name: "Free T3 (thyroid)", es: "T3 libre (tiroides)", aliases: ["free t3", "t3, free"], what: "The active form of thyroid hormone.", whatEs: "La forma activa de la hormona tiroidea." },
  { key: "ferritin", name: "Ferritin", es: "Ferritina", aliases: ["ferritin"], what: "Shows how much iron your body has stored.", whatEs: "Muestra cuánto hierro tiene guardado el cuerpo." },
  { key: "tibc", name: "Iron binding capacity (TIBC)", es: "Capacidad de fijación de hierro", aliases: ["iron binding capacity", "tibc"], what: "How much iron your blood could carry.", whatEs: "Cuánto hierro podría transportar la sangre." },
  { key: "iron", name: "Iron", es: "Hierro", aliases: ["iron, total", "serum iron", "iron(?! binding| saturation|,? sat)"], what: "The iron in your blood, needed to make hemoglobin.", whatEs: "El hierro en la sangre, necesario para formar hemoglobina." },
  { key: "b12", name: "Vitamin B12", es: "Vitamina B12", aliases: ["vitamin b12", "vitamin b-12", "b12", "cobalamin"], what: "A vitamin needed for nerves and red blood cells.", whatEs: "Una vitamina necesaria para los nervios y los glóbulos rojos." },
  { key: "folate", name: "Folate", es: "Folato", aliases: ["folate", "folic acid"], what: "A B vitamin needed to make new cells.", whatEs: "Una vitamina B necesaria para formar células nuevas." },
  { key: "uricacid", name: "Uric acid", es: "Ácido úrico", aliases: ["uric acid"], what: "A waste product; high levels can be linked to gout.", whatEs: "Un desecho; si está alto puede relacionarse con la gota." },
  { key: "magnesium", name: "Magnesium", es: "Magnesio", aliases: ["magnesium"], what: "A mineral for muscles, nerves and heart rhythm.", whatEs: "Un mineral para los músculos, los nervios y el ritmo cardíaco." },
  { key: "phosphorus", name: "Phosphorus", es: "Fósforo", aliases: ["phosphorus", "phosphate"], what: "A mineral that works with calcium for bones.", whatEs: "Un mineral que trabaja con el calcio para los huesos." },
  { key: "crp", name: "CRP (inflammation)", es: "PCR (inflamación)", aliases: ["c-reactive protein", "c reactive protein", "hs-crp", "crp"], what: "A marker of inflammation in the body.", whatEs: "Un marcador de inflamación en el cuerpo." },
  { key: "psa", name: "PSA (prostate)", es: "PSA (próstata)", aliases: ["prostate specific antigen", "psa"], what: "A protein made by the prostate.", whatEs: "Una proteína producida por la próstata." }
];

const UNIT_PATTERN = /(?:x\s?10\^?E?\d+\s?\/\s?[uµμ]?l|10\^?\d+\s?\/\s?[uµμ]?l|[km]\/[uµμ]l|thousand\/[uµμ]l|million\/[uµμ]l|cells\/[uµμ]l|ml\/min(?:\/1\.73\s?m2)?|mg\/dl|g\/dl|g\/l|mg\/l|mmol\/l|[uµμ]mol\/l|nmol\/l|pmol\/l|meq\/l|miu\/l|[uµμ]iu\/ml|iu\/l|u\/l|ng\/ml|ng\/dl|pg\/ml|fl|pg|%)/i;
const RANGE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)|(<=?|>=?|≤|≥)\s*(\d+(?:\.\d+)?)/;
const FLAG_PATTERN = /(?:^|[\s(])(HH|LL|H|L|High|Low|HIGH|LOW|Critical|CRITICAL|CRIT|Panic|PANIC|Abnormal|ABNORMAL)(?=[\s*)]|$)/;
const COMPILED = LAB_TESTS.map((test) => ({ test, patterns: test.aliases.map((alias) => new RegExp(`\\b${alias}\\b`, "i")) }));

function statusFrom(value: number, flag: string, low: number | null, high: number | null, bound: string): LabPanelStatus {
  const upper = flag.toUpperCase();
  if (["HH", "LL", "CRITICAL", "CRIT", "PANIC"].includes(upper)) return "critical";
  if (upper === "H" || upper === "HIGH") return "above";
  if (upper === "L" || upper === "LOW") return "below";
  if (upper === "ABNORMAL") return "outside";
  if (low !== null && high !== null) return value < low ? "below" : value > high ? "above" : "within";
  if (bound.startsWith("<") || bound === "≤") return high !== null && value >= high && !bound.includes("=") ? "above" : "within";
  if (bound.startsWith(">") || bound === "≥") return low !== null && value <= low && !bound.includes("=") ? "below" : "within";
  return "unknown";
}

// One result per test; each line is matched to the test named earliest on it.
export function readLabPanel(text: string): LabPanelResult[] {
  const results: LabPanelResult[] = [];
  const seen = new Set<string>();
  String(text || "").split(/\r?\n/).forEach((line) => {
    let best: { test: LabTest; index: number; length: number } | null = null;
    COMPILED.forEach(({ test, patterns }) => {
      if (seen.has(test.key)) return;
      patterns.forEach((pattern) => {
        const match = line.match(pattern);
        if (!match || match.index === undefined) return;
        if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length)) {
          best = { test, index: match.index, length: match[0].length };
        }
      });
    });
    if (!best) return;
    const { test, index, length } = best as { test: LabTest; index: number; length: number };
    const rest = line.slice(index + length);
    if (/ratio/i.test(line.slice(index, index + length + 12))) return;
    const valueMatch = rest.match(/^[^\d<>\n]{0,40}?\s*(?:\b0\d\s+[^\d\n]{0,12}?)?([<>]?)\s*(\d+(?:\.\d+)?)/);
    if (!valueMatch || valueMatch.index === undefined) return;
    const value = Number(valueMatch[2]);
    let after = rest.slice(valueMatch.index + valueMatch[0].length);
    const unitMatch = after.match(UNIT_PATTERN);
    const unit = unitMatch ? unitMatch[0].replace(/\s+/g, "") : "";
    if (unitMatch && unitMatch.index !== undefined) after = after.slice(0, unitMatch.index) + " " + after.slice(unitMatch.index + unitMatch[0].length);
    const flag = after.match(FLAG_PATTERN)?.[1] ?? "";
    const range = after.match(RANGE_PATTERN);
    const low = range ? (range[1] !== undefined ? Number(range[1]) : range[3].startsWith(">") || range[3] === "≥" ? Number(range[4]) : null) : null;
    const high = range ? (range[2] !== undefined ? Number(range[2]) : range[3].startsWith("<") || range[3] === "≤" ? Number(range[4]) : null) : null;
    const rangeText = range ? range[0].replace(/\s+/g, " ").trim() : "";
    seen.add(test.key);
    results.push({
      key: test.key,
      name: test.name,
      value,
      valueText: `${valueMatch[1]}${valueMatch[2]}`,
      unit,
      rangeText,
      flag,
      status: statusFrom(value, flag, low, high, range?.[3] ?? "")
    });
  });
  return results;
}

export function labTestInfo(key: string): LabTest | undefined {
  return LAB_TESTS.find((test) => test.key === key);
}

export const LAB_PANEL_TEXT = {
  en: {
    title: "All tests on your report",
    test: "Test",
    result: "Result",
    range: "Lab range",
    status: "Status",
    meaning: "What it measures",
    noRange: "not printed",
    note: "Compared with the reference range and flags printed by your lab. Ranges differ by lab, age and sex.",
    status_within: "Within the lab's range",
    status_above: "Above the lab's range",
    status_below: "Below the lab's range",
    status_critical: "Marked critical by the lab",
    status_outside: "Marked abnormal by the lab",
    status_unknown: "No range printed"
  },
  es: {
    title: "Todas las pruebas de su informe",
    test: "Prueba",
    result: "Resultado",
    range: "Rango del laboratorio",
    status: "Estado",
    meaning: "Qué mide",
    noRange: "no impreso",
    note: "Comparado con el rango de referencia y las marcas impresas por su laboratorio. Los rangos cambian según el laboratorio, la edad y el sexo.",
    status_within: "Dentro del rango del laboratorio",
    status_above: "Por encima del rango del laboratorio",
    status_below: "Por debajo del rango del laboratorio",
    status_critical: "Marcado como crítico por el laboratorio",
    status_outside: "Marcado como anormal por el laboratorio",
    status_unknown: "Sin rango impreso"
  }
};

// Spanish names for the translation layer: English test name -> Spanish name.
export const LAB_TEST_NAMES_ES: Record<string, string> = Object.fromEntries(LAB_TESTS.map((test) => [test.name, test.es]));
