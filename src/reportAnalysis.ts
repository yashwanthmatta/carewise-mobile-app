import { SCAN_TEXT, explainScanReport, type ScanExplanation } from "./scanReport";
import { LAB_TEST_NAMES_ES, normalizeReportText, readLabPanel, type LabPanelResult } from "./labPanel";
// On-device report explanation, shared with the CareWise web app.
// Generated from carewise-frontend/script.js (analyzeReportTextLocally and the
// Spanish report translations); keep the two in sync when either changes.

export type ReportLanguage = "en" | "es";
export type Finding = { label: string; level: string; detail: string };
export type LabValue = { label: string; value: number | string; unit: string; flag: string };
export type ReportAnalysis = {
  id: string;
  score: number;
  riskLevel: "urgent" | "needs_review" | "attention" | "routine";
  findings: Finding[];
  suggestions: string[];
  questions: string[];
  riskAreas: { heart: string; diabetes: string; vitamins: string };
  labValues: LabValue[];
  panelResults: LabPanelResult[];
  scan: { en: ScanExplanation; es: ScanExplanation } | null;
  scanOnly: boolean;
  // No results could be read, so no score is shown.
  noData: boolean;
};
type MarkerValues = {
  ldl: number | null;
  totalCholesterol: number | null;
  triglycerides: number | null;
  a1c: number | null;
  vitaminD: number | null;
  systolic: number | null;
  diastolic: number | null;
};
type Translation = {
  ui: Record<string, string | ((count: number) => string)>;
  phrases: Record<string, string>;
  patterns: [RegExp, string][];
};

export const REPORT_LANGUAGES: Record<ReportLanguage, string> = { en: "English", es: "Español" };

const emergencyTerms: string[] = [
  "chest pain",
  "trouble breathing",
  "shortness of breath",
  "stroke",
  "suicide",
  "severe bleeding",
  "fainting",
  "confusion",
  "face droop",
  "slurred speech",
  "arm weakness",
  "sudden numbness",
  "sudden severe headache",
  "difficulty breathing",
  "difficulty swallowing",
  "swelling of the face",
  "swelling of the tongue",
  "hives",
  "anaphylaxis",
  "wheezing",
  "coughing blood",
  "coughing up blood",
  "severe abdominal pain",
  "right lower abdomen",
  "stiff neck",
  "rash that does not fade",
  "fever and confusion",
  "blue lips",
  "seizure",
  "loss of consciousness",
  "severe dehydration",
  "blood in vomit",
  "black stool",
  "overdose",
  "poison",
  "carbon monoxide",
  "head injury",
  "severe burn",
  "electric shock",
  "near drowning",
  "paralysis",
  "weakness on one side",
  "vaginal bleeding",
  "shoulder pain",
  "high fever",
  "heat stroke",
  "hypothermia",
  "unconscious",
  "cannot wake",
  "severe allergic reaction",
  "bloody diarrhea",
  "severe testicular pain",
  "eye injury",
  "chemical exposure",
  "neck injury",
  "spinal injury",
  "snake bite",
  "animal bite",
  "severe headache",
  "stiff neck",
  "no urine",
  "severe weakness",
];

const REPORT_TRANSLATIONS: Record<string, Translation> = {
  es: {
    ui: {
      eyebrow: "Explicación de CareWise",
      title: "Resumen del informe en lenguaje sencillo",
      found: (count) => `CareWise encontró ${count} punto${count === 1 ? "" : "s"} para comentar en el texto del informe.`,
      detectedValues: "Valores detectados",
      keyFindings: "Hallazgos principales",
      suggestions: "Sugerencias de bienestar",
      questions: "Preguntas para su médico",
      nextStep: "Siguiente paso",
      ask: "Pregunte",
      safetyTitle: "Nota de seguridad",
      safetyText: "Esto no es un diagnóstico ni un plan de tratamiento. Un profesional de salud autorizado debe interpretar su informe original junto con su historial completo.",
      copySummary: "Copiar resumen",
      shareSummary: "Compartir resumen",
      doctorBrief: "Resumen para el médico",
      saveToTrends: "Guardar en tendencias",
      copyQuestions: "Copiar preguntas",
      draftNotice: "Traducción preliminar, pendiente de revisión por un profesional de salud y un traductor médico. El resumen para el médico se genera en inglés.",
    },
    phrases: {
      "LDL cholesterol": "Colesterol LDL",
      "Total cholesterol": "Colesterol total",
      "Triglycerides": "Triglicéridos",
      "Blood pressure": "Presión arterial",
      "Vitamin D": "Vitamina D",
      "Possible urgent symptom": "Posible síntoma urgente",
      "Readable values": "Valores legibles",
      "Readable report text": "Texto legible del informe",
      "Needs immediate attention": "Necesita atención inmediata",
      "High": "Alto",
      "Needs attention": "Necesita atención",
      "In a better range": "En un rango más favorable",
      "Above common reference target": "Por encima del objetivo de referencia habitual",
      "Above common target": "Por encima del objetivo habitual",
      "Clinician review important": "Es importante que lo revise un profesional",
      "Prediabetes range in many guidelines": "Rango de prediabetes según muchas guías",
      "Often considered in range": "Suele considerarse dentro del rango",
      "Urgent if confirmed with symptoms": "Urgente si se confirma con síntomas",
      "Urgent if confirmed": "Urgente si se confirma",
      "Needs tracking": "Necesita seguimiento",
      "No obvious issue in pasted text": "Sin problemas evidentes en el texto",
      "Mentioned": "Mencionado",
      "Not enough structured data": "No hay suficientes datos estructurados",
      "No results found": "No se encontraron resultados",
      "Needed": "Necesario",
      "In range discussion": "Dentro del rango, para comentar",
      "Clinician review": "Revisión profesional",
      "Urgent review": "Revisión urgente",
      "Routine follow-up": "Seguimiento de rutina",
      "The report text includes symptoms that should not wait for routine AI guidance.": "El texto del informe incluye síntomas que no deben esperar a una orientación de rutina.",
      "Vitamin D appears in the report text, but CareWise could not confidently read the value.": "La vitamina D aparece en el informe, pero CareWise no pudo leer el valor con seguridad.",
      "CareWise needs typed or pasted lab values to explain specific results.": "CareWise necesita los valores del laboratorio escritos o pegados para explicar resultados específicos.",
      "If these symptoms are happening now, seek emergency care or call local emergency services.": "Si estos síntomas están ocurriendo ahora, busque atención de emergencia o llame a los servicios de emergencia locales.",
      "Discuss heart-risk context, diet pattern, exercise, family history, and follow-up timing with a clinician.": "Hable con un profesional de salud sobre su riesgo cardíaco, su alimentación, el ejercicio, sus antecedentes familiares y cuándo hacer seguimiento.",
      "Ask whether fasting status, alcohol, refined carbs, medicines, or thyroid/metabolic factors could affect triglycerides.": "Pregunte si el ayuno, el alcohol, los carbohidratos refinados, los medicamentos o factores tiroideos o metabólicos podrían afectar sus triglicéridos.",
      "Track home blood pressure with time, position, cuff size, and symptoms before your visit.": "Antes de su consulta, registre su presión arterial en casa con la hora, la posición, el tamaño del brazalete y los síntomas.",
      "Paste key lab rows, values, units, and reference flags from the report.": "Pegue las filas principales del informe: valores, unidades e indicadores de referencia.",
      "Build meals around vegetables, fiber-rich carbs, lean protein, and unsaturated fats unless your clinician gave different advice.": "Base sus comidas en verduras, carbohidratos ricos en fibra, proteínas magras y grasas insaturadas, salvo que su profesional de salud le haya indicado otra cosa.",
      "Aim for consistent walking or movement you can repeat most days, adjusted for your clinician's guidance.": "Procure caminar o moverse de forma constante la mayoría de los días, según las indicaciones de su profesional de salud.",
      "Type or paste your lab results first, or press Try sample report.": "Escriba o pegue primero sus resultados, o pulse «Try sample report».",
      "Ask a licensed professional to review the original report.": "Pida a un profesional de salud autorizado que revise el informe original.",
      "What LDL goal is appropriate for me based on my age, family history, blood pressure, and other risks?": "¿Qué meta de LDL es adecuada para mí según mi edad, mis antecedentes familiares, mi presión arterial y otros riesgos?",
      "Does my A1C need repeat testing or a diabetes care plan?": "¿Necesito repetir la prueba de A1C o un plan de atención para la diabetes?",
      "What changes would help lower my A1C safely over the next 3 months?": "¿Qué cambios me ayudarían a bajar mi A1C de forma segura en los próximos 3 meses?",
      "Should I repeat Vitamin D testing or discuss supplementation dose and duration?": "¿Debo repetir la prueba de vitamina D o hablar sobre la dosis y la duración de un suplemento?",
      "Which results matter most for me, and when should I repeat labs?": "¿Qué resultados son más importantes para mí y cuándo debo repetir los análisis?",
      "Should I see primary care, a dietitian, or a specialist based on these results?": "Según estos resultados, ¿debo ver a mi médico de cabecera, a un nutricionista o a un especialista?",
      "Which values from my original report should I focus on first?": "¿En qué valores de mi informe original debo fijarme primero?",
      "Should any lab values be repeated or reviewed with more health history?": "¿Se debe repetir algún valor o revisarlo con más antecedentes de salud?",
      "Would primary care, a dietitian, pharmacist, or specialist be the right next step?": "¿El siguiente paso adecuado sería mi médico de cabecera, un nutricionista, un farmacéutico o un especialista?",
      "Marked critical by the lab": "Marcado como crítico por el laboratorio",
      "Above the lab's range": "Por encima del rango del laboratorio",
      "Far above the lab's range": "Muy por encima del rango del laboratorio",
      "Above the usual range": "Por encima del rango habitual",
      "Below the usual range": "Por debajo del rango habitual",
      "Far above the usual range": "Muy por encima del rango habitual",
      "Far below the usual range": "Muy por debajo del rango habitual",
      "Far below the lab's range": "Muy por debajo del rango del laboratorio",
      "Which results are far outside the range, and how soon should I be seen about them?": "¿Qué resultados están muy fuera del rango y qué tan pronto debo consultar por ellos?",
      "Below the lab's range": "Por debajo del rango del laboratorio",
      "Marked abnormal by the lab": "Marcado como anormal por el laboratorio",
      "Within the lab's range": "Dentro del rango del laboratorio",
      "Other tests": "Otras pruebas",
      "Possible danger level": "Posible nivel de peligro",
      "No range to compare": "Sin rango para comparar",
      "Detected (usually negative)": "Detectado (normalmente negativo)",
      "Critical imaging result": "Resultado de imagen crítico",
      "Contact your doctor today": "Comuníquese hoy con su médico",
      "The report says a critical result was communicated to a doctor. If you have not heard from your doctor, contact them today.": "El informe dice que se comunicó un resultado crítico a un médico. Si su médico no le ha contactado, comuníquese hoy.",
      "Imaging report": "Informe de imagen",
      "Explained below": "Explicado abajo",
      "The report mentions a possible next step. What should I do, and how soon?": "El informe menciona un posible siguiente paso. ¿Qué debo hacer y con qué urgencia?",
      "What does the Impression mean for me in everyday terms?": "¿Qué significa la Impresión para mí en palabras sencillas?",
      "Does anything in this report need a follow-up scan or another test, and when?": "¿Algo de este informe necesita otro estudio o prueba de control, y cuándo?",
      "Is any finding related to the symptoms that led to this scan?": "¿Algún hallazgo está relacionado con los síntomas que motivaron este estudio?",
      "Which of my results outside the lab's range matter most, and do any need follow-up?": "¿Cuáles de mis resultados fuera del rango del laboratorio son más importantes y alguno necesita seguimiento?",
      "Bring the full report, and any earlier scans, to your appointment so your doctor can compare them.": "Lleve el informe completo y cualquier estudio anterior a su cita para que su médico pueda compararlos.",
    },
    patterns: [
      [/^LDL appears around (.+) mg\/dL\.$/, "El LDL aparece alrededor de $1 mg/dL."],
      [/^Total cholesterol appears around (.+) mg\/dL\.$/, "El colesterol total aparece alrededor de $1 mg/dL."],
      [/^Triglycerides appear around (.+) mg\/dL\.$/, "Los triglicéridos aparecen alrededor de $1 mg/dL."],
      [/^A1C appears around (.+)%\.$/, "La A1C aparece alrededor de $1 %."],
      [/^Systolic blood pressure appears around (.+)\.$/, "La presión arterial sistólica aparece alrededor de $1."],
      [/^Vitamin D appears around (.+)\.$/, "La vitamina D aparece alrededor de $1."],
      [/^(.+)\. The lab marked this result as critical\. Contact your doctor or the lab today\.$/, "$1. El laboratorio marcó este resultado como crítico. Comuníquese hoy con su médico o con el laboratorio."],
      [/^(.+); no range printed, compared with a general guide: (.+)\. Ask your doctor about this result soon\.$/, "$1; sin rango impreso, comparado con una guía general: $2. Consulte pronto a su médico sobre este resultado."],
      [/^(.+); no range printed, compared with a general guide: (.+)\.$/, "$1; sin rango impreso, comparado con una guía general: $2."],
      [/^(.+); lab range (.+)\. Ask your doctor about this result soon\.$/, "$1; rango del laboratorio $2. Consulte pronto a su médico sobre este resultado."],
      [/^(.+); lab range not printed\.$/, "$1; rango del laboratorio no impreso."],
      [/^(.+); general guide (.+)\. Labs often treat this level as urgent\. Contact your doctor today, or seek emergency care if you feel very unwell\.$/, "$1; guía general $2. Los laboratorios suelen considerar urgente este nivel. Comuníquese hoy con su médico o busque atención de emergencia si se siente muy mal."],
      [/^(.+); lab range not printed\. Labs often treat this level as urgent\. Contact your doctor today, or seek emergency care if you feel very unwell\.$/, "$1; rango del laboratorio no impreso. Los laboratorios suelen considerar urgente este nivel. Comuníquese hoy con su médico o busque atención de emergencia si se siente muy mal."],
      [/^(.+); lab range (.+)\. Labs often treat this level as urgent\. Contact your doctor today, or seek emergency care if you feel very unwell\.$/, "$1; rango del laboratorio $2. Los laboratorios suelen considerar urgente este nivel. Comuníquese hoy con su médico o busque atención de emergencia si se siente muy mal."],
      [/^CareWise read (\d+) results but found no range to compare one of them with\. Ask your doctor what range applies to you\.$/, "CareWise leyó $1 resultados, pero no encontró un rango para comparar uno de ellos. Pregunte a su médico qué rango le corresponde."],
      [/^CareWise read (\d+) results but found no range to compare (\d+) of them with\. Ask your doctor what range applies to you\.$/, "CareWise leyó $1 resultados, pero no encontró un rango para comparar $2 de ellos. Pregunte a su médico qué rango le corresponde."],
      [/^(.+); lab range (.+)\.$/, "$1; rango del laboratorio $2."],
      [/^All (\d+) tests read from your report are within the lab's ranges\.$/, "Las $1 pruebas leídas de su informe están dentro de los rangos del laboratorio."],
      [/^This looks like an? (.+) report\. CareWise explains the radiologist's words; it does not read the images\.$/, "Parece un informe de imagen ($1). CareWise explica las palabras del radiólogo; no lee las imágenes."],
    ],
  },
};

function findEmergencyTerms(text: string): string[] {
  const matches: string[] = [];
  emergencyTerms.forEach((term) => {
    let start = 0;
    while (start < text.length) {
      const index = text.indexOf(term, start);
      if (index === -1) break;
      if (!isNegated(text, index)) {
        matches.push(term);
        break;
      }
      start = index + term.length;
    }
  });
  return matches;
}

function isNegated(text: string, termIndex: number): boolean {
  const windowText = text.slice(Math.max(0, termIndex - 24), termIndex);
  const afterWindow = text.slice(termIndex, termIndex + 48);
  if (afterWindow.includes("recovery") || `${windowText}${afterWindow}`.includes("after stroke")) return true;
  return ["no ", "not ", "without ", "denies ", "denied ", "negative for ", "none of "].some((pattern) => windowText.includes(pattern));
}

function getNonNegatedEmergencyMatches(text: string): string[] {
  return findEmergencyTerms(text).filter((term) => {
    const index = text.indexOf(term);
    const context = text.slice(Math.max(0, index - 18), index + term.length);
    return !/\b(no|denies|without|negative for)\s+[\w\s,;/.-]{0,18}$/i.test(context.slice(0, Math.max(0, context.length - term.length)));
  });
}

function hasHypertensiveCrisis(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const slashMatch = normalized.match(/\b(1[8-9]\d|[2-9]\d{2})\s*(?:\/|over)\s*(1[2-9]\d|[2-9]\d{2})\b/);
  if (slashMatch) return true;

  const systolic = normalized.match(/(?:systolic|blood pressure|bp)[^\d]{0,18}(1[8-9]\d|[2-9]\d{2})/);
  const diastolic = normalized.match(/(?:diastolic|over)[^\d]{0,18}(1[2-9]\d|[2-9]\d{2})/);
  return Boolean(systolic && diastolic);
}

function readReportNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

// Skips a lab footnote code like the "01" in "Cholesterol, Total 01  289 mg/dL".
const LAB_FOOTNOTE = String.raw`(?:\b0\d\s+\D{0,12}?)?`;
const LAB_UNIT = String.raw`\s*(mmol\s*\/\s*mol|mmol\s*\/\s*l|mg\s*\/\s*dl|%)?`;

function readLabMeasure(text: string, namePattern: string, maxGap = 24): { value: number; unit: string } | null {
  const match = text.match(new RegExp(`${namePattern}\\D{0,${maxGap}}?${LAB_FOOTNOTE}(\\d+(?:\\.\\d+)?)${LAB_UNIT}`, "i"));
  if (!match) return null;
  return { value: Number(match[1]), unit: (match[2] || "").replace(/\s+/g, "").toLowerCase() };
}

// UK and European labs report lipids in mmol/L and A1C in mmol/mol (IFCC).
// Convert to the US units the explanations use; a value with no unit that is
// only plausible in the other unit is treated as that unit.
function readCholesterolMgDl(text: string, namePattern: string): number | null {
  const measure = readLabMeasure(text, namePattern);
  if (!measure) return null;
  if (measure.unit === "mmol/l" || (!measure.unit && measure.value < 25)) return Math.round(measure.value * 38.67);
  return measure.value;
}

// Many labs print total cholesterol simply as "Cholesterol". Accept that only
// when it is not part of an LDL, HDL, VLDL or non-HDL name or a ratio.
function readPlainCholesterolMgDl(text: string): number | null {
  const pattern = /\bcholesterol\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const before = text.slice(Math.max(0, match.index - 9), match.index);
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 12);
    if (/(?:ldl|hdl|vldl)[\s-]*$/i.test(before)) continue;
    if (/^\s*[,/(-]?\s*(?:ldl|hdl|vldl|ratio|non)/i.test(after)) continue;
    const value = readCholesterolMgDl(text.slice(match.index), "cholesterol");
    if (value !== null) return value;
  }
  return null;
}

function readTriglyceridesMgDl(text: string): number | null {
  const measure = readLabMeasure(text, "triglycerides");
  if (!measure) return null;
  if (measure.unit === "mmol/l" || (!measure.unit && measure.value < 15)) return Math.round(measure.value * 88.57);
  return measure.value;
}

function readA1cPercent(text: string): number | null {
  // UK reports say "HbA1c level - IFCC standardised 44 mmol/mol", so allow a longer label.
  const measure = readLabMeasure(text, String.raw`(?:hemoglobin\s*)?a1c`, 40);
  if (!measure) return null;
  if (measure.unit === "mmol/mol" || (!measure.unit && measure.value > 20)) return Math.round((0.0915 * measure.value + 2.15) * 10) / 10;
  return measure.value;
}

function buildDetectedReportValues({ ldl, totalCholesterol, triglycerides, a1c, vitaminD, systolic, diastolic }: MarkerValues): LabValue[] {
  const values: (LabValue | null)[] = [
    ldl !== null ? { label: "LDL cholesterol", value: ldl, unit: "mg/dL", flag: ldl >= 160 ? "High" : ldl >= 130 ? "Needs attention" : "In range discussion" } : null,
    totalCholesterol !== null ? { label: "Total cholesterol", value: totalCholesterol, unit: "mg/dL", flag: totalCholesterol >= 200 ? "Above common target" : "In range discussion" } : null,
    triglycerides !== null ? { label: "Triglycerides", value: triglycerides, unit: "mg/dL", flag: triglycerides >= 150 ? "Needs attention" : "In range discussion" } : null,
    a1c !== null ? { label: "A1C", value: a1c, unit: "%", flag: a1c >= 6.5 ? "Clinician review" : a1c >= 5.7 ? "Needs attention" : "In range discussion" } : null,
    vitaminD !== null ? { label: "Vitamin D", value: vitaminD, unit: "ng/mL", flag: vitaminD < 30 ? "Needs attention" : "In range discussion" } : null,
    systolic !== null ? { label: "Blood pressure", value: `${systolic}/${diastolic || "?"}`, unit: "mmHg", flag: systolic >= 180 ? "Urgent if confirmed" : systolic >= 130 ? "Needs tracking" : "In range discussion" } : null,
  ];
  return values.filter((item): item is LabValue => item !== null);
}

export function analyzeReportTextLocally(rawText: string): ReportAnalysis {
  // Decimal commas ("1,4"), thousands commas and common misspellings are fixed first.
  const text = normalizeReportText(rawText);
  const lower = text.toLowerCase();
  const urgentMatches = getNonNegatedEmergencyMatches(lower);
  if (hasHypertensiveCrisis(lower)) urgentMatches.push("blood pressure over 180/120");

  const ldl = readCholesterolMgDl(lower, String.raw`\bldl(?: cholesterol)?`);
  const totalCholesterol = readCholesterolMgDl(lower, String.raw`(?:total cholesterol|cholesterol,?\s*total)`) ?? readPlainCholesterolMgDl(lower);
  const triglycerides = readTriglyceridesMgDl(lower);
  const a1c = readA1cPercent(lower);
  // Skip the "25-hydroxy" / "25-OH" in the test name so it is not read as the value.
  const vitaminD = readReportNumber(lower, [/vitamin d(?:[\s,]*\(?25[\s-]*(?:hydroxy|oh)\)?)?\D{0,24}(\d+(?:\.\d+)?)/i]);
  const systolic = readReportNumber(lower, [/(?:blood pressure|\bbp\b)\D{0,60}(\d{2,3})\s*\/\s*\d{2,3}/i]);
  const diastolic = readReportNumber(lower, [/(?:blood pressure|\bbp\b)\D{0,60}\d{2,3}\s*\/\s*(\d{2,3})/i]);
  const labValues = buildDetectedReportValues({ ldl, totalCholesterol, triglycerides, a1c, vitaminD, systolic, diastolic });

  const findings: Finding[] = [];
  const suggestions: string[] = [];
  const questions: string[] = [];
  let score = 94;

  if (urgentMatches.length) {
    score -= 30;
    findings.push({
      label: "Possible urgent symptom",
      level: "Needs immediate attention",
      detail: "The report text includes symptoms that should not wait for routine AI guidance.",
    });
    suggestions.push("If these symptoms are happening now, seek emergency care or call local emergency services.");
  }

  if (ldl !== null) {
    if (ldl >= 160) {
      score -= 10;
      findings.push({ label: "LDL cholesterol", level: "High", detail: `LDL appears around ${ldl} mg/dL.` });
    } else if (ldl >= 130) {
      score -= 6;
      findings.push({ label: "LDL cholesterol", level: "Needs attention", detail: `LDL appears around ${ldl} mg/dL.` });
    } else {
      findings.push({ label: "LDL cholesterol", level: "In a better range", detail: `LDL appears around ${ldl} mg/dL.` });
    }
    suggestions.push("Discuss heart-risk context, diet pattern, exercise, family history, and follow-up timing with a clinician.");
    questions.push("What LDL goal is appropriate for me based on my age, family history, blood pressure, and other risks?");
  }

  if (totalCholesterol !== null && totalCholesterol >= 200) {
    score -= 3;
    findings.push({ label: "Total cholesterol", level: "Above common reference target", detail: `Total cholesterol appears around ${totalCholesterol} mg/dL.` });
  }

  if (triglycerides !== null && triglycerides >= 150) {
    score -= 3;
    findings.push({ label: "Triglycerides", level: "Needs attention", detail: `Triglycerides appear around ${triglycerides} mg/dL.` });
    suggestions.push("Ask whether fasting status, alcohol, refined carbs, medicines, or thyroid/metabolic factors could affect triglycerides.");
  }

  if (a1c !== null) {
    if (a1c >= 6.5) {
      score -= 12;
      findings.push({ label: "A1C", level: "Clinician review important", detail: `A1C appears around ${a1c}%.` });
      questions.push("Does my A1C need repeat testing or a diabetes care plan?");
    } else if (a1c >= 5.7) {
      score -= 5;
      findings.push({ label: "A1C", level: "Prediabetes range in many guidelines", detail: `A1C appears around ${a1c}%.` });
      questions.push("What changes would help lower my A1C safely over the next 3 months?");
    } else {
      findings.push({ label: "A1C", level: "Often considered in range", detail: `A1C appears around ${a1c}%.` });
    }
  }

  if (systolic !== null && systolic >= 130) {
    score -= systolic >= 180 ? 24 : 4;
    findings.push({ label: "Blood pressure", level: systolic >= 180 ? "Urgent if confirmed with symptoms" : "Needs tracking", detail: `Systolic blood pressure appears around ${systolic}.` });
    suggestions.push("Track home blood pressure with time, position, cuff size, and symptoms before your visit.");
  }

  if (vitaminD !== null) {
    if (vitaminD < 30) {
      score -= 4;
      findings.push({ label: "Vitamin D", level: "Needs attention", detail: `Vitamin D appears around ${vitaminD}.` });
      questions.push("Should I repeat Vitamin D testing or discuss supplementation dose and duration?");
    } else {
      findings.push({ label: "Vitamin D", level: "No obvious issue in pasted text", detail: `Vitamin D appears around ${vitaminD}.` });
    }
  } else if (lower.includes("vitamin d")) {
    findings.push({ label: "Vitamin D", level: "Mentioned", detail: "Vitamin D appears in the report text, but CareWise could not confidently read the value." });
  }

  // Any other lab rows, compared with the range and flags the lab printed.
  const panelResults = readLabPanel(text);
  let panelPenalty = 0;
  let anyFar = false;
  let anyOutside = false;
  panelResults.forEach((item) => {
    const shown = `${item.valueText} ${item.unit}`.trim();
    if (item.danger) {
      urgentMatches.push(`${item.name} at a possible danger level`);
      anyOutside = true;
      anyFar = true;
      score -= 20;
      findings.push({
        label: item.name,
        level: "Possible danger level",
        detail: `${shown}; ${item.rangeText ? `${item.generalRange ? "general guide" : "lab range"} ${item.rangeText}` : "lab range not printed"}. Labs often treat this level as urgent. Contact your doctor today, or seek emergency care if you feel very unwell.`,
      });
    } else if (item.status === "critical") {
      urgentMatches.push(`${item.name} marked critical by the lab`);
      score -= 20;
      findings.push({ label: item.name, level: "Marked critical by the lab", detail: `${shown}. The lab marked this result as critical. Contact your doctor or the lab today.` });
    } else if (item.status === "above" || item.status === "below" || item.status === "outside") {
      anyOutside = true;
      if (item.far) anyFar = true;
      panelPenalty += item.far ? 10 : 4;
      findings.push({
        label: item.name,
        // When the lab printed no range, say honestly that a general guide was used.
        level: item.key.startsWith("urine")
          ? "Detected (usually negative)"
          : item.generalRange
          ? `${item.far ? "Far " : ""}${item.status === "above" ? "above" : "below"} the usual range`.replace(/^./, (c) => c.toUpperCase())
          : item.far
            ? item.status === "above" ? "Far above the lab's range" : "Far below the lab's range"
            : item.status === "above" ? "Above the lab's range" : item.status === "below" ? "Below the lab's range" : "Marked abnormal by the lab",
        detail: `${shown}; ${item.generalRange ? `no range printed, compared with a general guide: ${item.rangeText}` : `lab range ${item.rangeText || "not printed"}`}.${item.far ? " Ask your doctor about this result soon." : ""}`,
      });
    }
  });
  score -= Math.min(30, panelPenalty);
  // A result far outside its range is never "routine", however good the rest looks.
  if (anyFar) {
    score = Math.min(score, 74);
    questions.push("Which results are far outside the range, and how soon should I be seen about them?");
  } else if (anyOutside) {
    score = Math.min(score, 84);
  }
  if (panelResults.some((item) => item.status !== "within" && item.status !== "unknown")) {
    questions.push("Which of my results outside the lab's range matter most, and do any need follow-up?");
  }
  // Radiology reports: explain the radiologist's words; never read images or judge findings.
  const scanEn = explainScanReport(text, "en");
  const scan = scanEn.isScan ? { en: scanEn, es: explainScanReport(text, "es") } : null;
  const scanOnly = Boolean(scan) && !findings.length && !labValues.length && !panelResults.length;
  if (scan) {
    if (scan.en.critical) {
      urgentMatches.push("critical imaging result");
      findings.push({ label: "Critical imaging result", level: "Contact your doctor today", detail: SCAN_TEXT.en.critical });
    }
    if (scanOnly) findings.push({ label: SCAN_TEXT.en.finding, level: SCAN_TEXT.en.findingLevel, detail: SCAN_TEXT.en.findingDetail(scan.en.modality) });
    if (scan.en.followUps.length) questions.push("The report mentions a possible next step. What should I do, and how soon?");
    questions.push(...SCAN_TEXT.en.questions);
  }

  // Results with no range to compare are never presented as normal.
  const unchecked = panelResults.filter((item) => item.status === "unknown");
  if (panelResults.length && !findings.length) {
    if (unchecked.length) {
      score = Math.min(score, 84);
      findings.push({ label: "Other tests", level: "No range to compare", detail: `CareWise read ${panelResults.length} results but found no range to compare ${unchecked.length === 1 ? "one of them" : `${unchecked.length} of them`} with. Ask your doctor what range applies to you.` });
    } else {
      findings.push({ label: "Other tests", level: "Within the lab's range", detail: `All ${panelResults.length} tests read from your report are within the lab's ranges.` });
    }
  }

  const noData = !findings.length;
  if (noData) {
    findings.push({
      label: "Readable values",
      level: "Not enough structured data",
      detail: "CareWise needs typed or pasted lab values to explain specific results.",
    });
    suggestions.push("Paste key lab rows, values, units, and reference flags from the report.");
    score = 72;
  }

  if (!scanOnly) {
    suggestions.push("Build meals around vegetables, fiber-rich carbs, lean protein, and unsaturated fats unless your clinician gave different advice.");
    suggestions.push("Aim for consistent walking or movement you can repeat most days, adjusted for your clinician's guidance.");
    questions.push("Which results matter most for me, and when should I repeat labs?");
    questions.push("Should I see primary care, a dietitian, or a specialist based on these results?");
  } else {
    suggestions.push("Bring the full report, and any earlier scans, to your appointment so your doctor can compare them.");
  }

  const riskAreas = {
    heart: (ldl ?? 0) >= 160 || (systolic ?? 0) >= 140 ? "Medium Risk" : (ldl ?? 0) >= 130 || (totalCholesterol ?? 0) >= 200 || (triglycerides ?? 0) >= 150 || (systolic ?? 0) >= 130 ? "Needs Attention" : "Low Risk",
    diabetes: (a1c ?? 0) >= 6.5 ? "Needs Review" : (a1c ?? 0) >= 5.7 ? "Needs Attention" : "Low Risk",
    vitamins: vitaminD !== null && vitaminD < 30 ? "Needs Attention" : lower.includes("vitamin d") ? "Review Value" : "No clear issue",
  };

  return {
    id: `local-analysis-${Date.now()}`,
    score: Math.max(35, Math.min(96, score)),
    riskLevel: urgentMatches.length ? "urgent" : score < 70 || anyFar ? "needs_review" : score < 82 || anyOutside || unchecked.length ? "attention" : "routine",
    findings,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    questions: [...new Set(questions)].slice(0, 5),
    riskAreas,
    labValues,
    panelResults,
    scan,
    scanOnly,
    noData,
  };
}

export function translateReportText(text: string, language: ReportLanguage): string {
  const table = REPORT_TRANSLATIONS[language];
  if (!table || typeof text !== "string") return text;
  if (table.phrases[text]) return table.phrases[text];
  if (language === "es" && LAB_TEST_NAMES_ES[text]) return LAB_TEST_NAMES_ES[text];
  const pattern = table.patterns.find(([regex]) => regex.test(text));
  return pattern ? text.replace(pattern[0], pattern[1]) : text;
}

export function translateReportAnalysis(analysis: ReportAnalysis, language: ReportLanguage): ReportAnalysis {
  if (!REPORT_TRANSLATIONS[language]) return analysis;
  return {
    ...analysis,
    findings: analysis.findings.map((item) => ({
      label: translateReportText(item.label, language),
      level: translateReportText(item.level, language),
      detail: translateReportText(item.detail, language),
    })),
    suggestions: analysis.suggestions.map((item) => translateReportText(item, language)),
    questions: analysis.questions.map((item) => translateReportText(item, language)),
    labValues: (analysis.labValues || []).map((item) => ({
      ...item,
      label: translateReportText(item.label, language),
      flag: translateReportText(item.flag, language),
    })),
  };
}

export function reportUiText(language: ReportLanguage): Record<string, string | ((count: number) => string)> | null {
  return REPORT_TRANSLATIONS[language]?.ui ?? null;
}

export const SAMPLE_REPORT_TEXT = [
  "Sample lab text for CareWise demo:",
  "Total cholesterol 226 mg/dL.",
  "LDL cholesterol 148 mg/dL.",
  "HDL cholesterol 44 mg/dL.",
  "Triglycerides 168 mg/dL.",
  "Hemoglobin A1C 5.8%.",
  "Blood pressure readings at home often around 138/86.",
  "No chest pain, no shortness of breath, no fainting.",
  "Patient wants simple food, walking, sleep, and follow-up guidance.",
].join("\n");

// Plain-text version of the web app's doctor brief, for the phone's share sheet.
export function buildDoctorBriefText(analysis: ReportAnalysis, person = "Me"): string {
  return [
    person === "Me" ? "Patient lab summary for clinician review" : `Lab summary for clinician review: ${person}`,
    new Date().toLocaleDateString(),
    person === "Me"
      ? "Prepared by the patient with CareWise AI from their own report text."
      : `Prepared by a family caregiver for ${person} with CareWise AI from the report text.`,
    ...(analysis.scanOnly || analysis.noData ? [] : [`Health score ${analysis.score}/100 (educational estimate).`]),
    "",
    ...(analysis.labValues.length ? ["Values detected in the report:", ...analysis.labValues.map((item) => `- ${item.label}: ${item.value} ${item.unit} (${item.flag})`), ""] : []),
    ...((analysis.panelResults || []).length
      ? ["Other tests on the report (compared with the lab's printed range):", ...(analysis.panelResults || []).map((item) => `- ${item.name}: ${item.valueText} ${item.unit}${item.rangeText ? ` (range ${item.rangeText})` : ""}${item.status !== "within" && item.status !== "unknown" ? ` [${item.status}]` : ""}`), ""]
      : []),
    ...(analysis.scan
      ? [
          `Imaging report (${analysis.scan.en.modality || "imaging"}), explained from the radiologist's text only.`,
          ...(analysis.scan.en.followUps.length ? ["Lines the patient would like to discuss:", ...analysis.scan.en.followUps.map((item) => `- "${item.sentence}"`)] : []),
          "",
        ]
      : []),
    "Discussion points:",
    ...analysis.findings.map((item) => `- ${item.label}: ${item.level}. ${item.detail}`),
    "",
    "Patient questions:",
    ...analysis.questions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Educational summary only, not a diagnosis. Values were read automatically from report text; please confirm them against the original report.",
  ].join("\n");
}
