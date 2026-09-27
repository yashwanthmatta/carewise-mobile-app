// Explains the words in a radiology report (CT, MRI, X-ray, ultrasound,
// mammogram and similar). It reads only the radiologist's written text: it never
// looks at images and never judges a finding as better or worse than written.
// The website runs a JavaScript copy of this file; keep the two identical.

export type ScanLanguage = "en" | "es";
export type ScanTerm = { term: string; meaning: string };
export type ScanFollowUp = { phrase: string; sentence: string };
export type ScanExplanation = {
  isScan: boolean;
  modality: string;
  impression: string;
  findings: string;
  terms: ScanTerm[];
  followUps: ScanFollowUp[];
  critical: boolean;
};

const MODALITIES: [RegExp, string][] = [
  [/\b(?:ct|cat scan|computed tomography)\b/i, "CT scan"],
  [/\b(?:mri|mr imaging|magnetic resonance)\b/i, "MRI"],
  [/\b(?:pet[\s/-]?ct|pet scan)\b/i, "PET scan"],
  [/\b(?:mammogra(?:m|phy))\b/i, "Mammogram"],
  [/\b(?:ultrasound|sonogra(?:m|phy)|us abdomen|doppler)\b/i, "Ultrasound"],
  [/\b(?:dexa|dxa|bone density)\b/i, "Bone density scan"],
  [/\b(?:x-?ray|radiograph|chest pa|pa and lateral)\b/i, "X-ray"]
];

// [pattern, English meaning, Spanish meaning]
const TERMS: [string, string, string, string][] = [
  ["unremarkable", "unremarkable", "Looks normal; nothing of concern was seen.", "Se ve normal; no se vio nada preocupante."],
  ["no acute", "no acute (findings/abnormality)", "Nothing sudden or urgent was seen.", "No se vio nada repentino ni urgente."],
  ["within normal limits", "within normal limits", "Normal for this test.", "Normal para esta prueba."],
  ["nodule", "nodule", "A small, round spot. Most are harmless; the report says whether to recheck it.", "Una mancha pequeña y redonda. La mayoría son inofensivas; el informe indica si hay que revisarla."],
  ["mass", "mass", "A lump or area of tissue that stands out; the report describes what it may be.", "Un bulto o zona de tejido que destaca; el informe describe qué podría ser."],
  ["lesion", "lesion", "A general word for any area that looks different from the tissue around it.", "Palabra general para cualquier zona que se ve distinta al tejido que la rodea."],
  ["cyst", "cyst", "A fluid-filled sac; simple cysts are usually harmless.", "Una bolsa con líquido; los quistes simples suelen ser inofensivos."],
  ["benign", "benign", "Not cancer.", "No es cáncer."],
  ["incidental", "incidental finding", "Something seen by chance that was not the reason for the scan.", "Algo que se vio por casualidad y no era el motivo del estudio."],
  ["opacit", "opacity", "An area that looks whiter or denser on the image; it has many possible causes.", "Una zona que se ve más blanca o densa en la imagen; tiene muchas causas posibles."],
  ["consolidation", "consolidation", "Part of the lung filled with fluid or material instead of air, often seen with pneumonia.", "Parte del pulmón llena de líquido o material en vez de aire, a menudo por neumonía."],
  ["effusion", "effusion", "Extra fluid collected in a space, such as around the lung or in a joint.", "Líquido acumulado en un espacio, como alrededor del pulmón o en una articulación."],
  ["atelectasis", "atelectasis", "A small part of the lung that is not fully inflated; often minor.", "Una pequeña parte del pulmón que no está totalmente inflada; a menudo es leve."],
  ["calcifi", "calcification", "A small deposit of calcium; often from old, healed changes.", "Un pequeño depósito de calcio; a menudo por cambios antiguos ya curados."],
  ["degenerative", "degenerative changes", "Wear and tear that is common with age.", "Desgaste común con la edad."],
  ["osteophyte", "osteophyte", "A bone spur from wear and tear.", "Un espolón óseo por desgaste."],
  ["spondylosis", "spondylosis", "Age-related wear of the spine.", "Desgaste de la columna relacionado con la edad."],
  ["disc bulge", "disc bulge", "A spinal disc that extends slightly beyond its normal edge; common and often painless.", "Un disco de la columna que sobresale un poco de su borde; es común y a menudo no duele."],
  ["herniat", "herniation", "Part of a disc or organ pushing through where it normally sits.", "Parte de un disco u órgano que se sale de su lugar normal."],
  ["stenosis", "stenosis", "Narrowing of a space, such as a blood vessel or the spinal canal.", "Estrechamiento de un espacio, como un vaso sanguíneo o el canal de la columna."],
  ["edema", "edema", "Swelling caused by extra fluid.", "Hinchazón por exceso de líquido."],
  ["fracture", "fracture", "A break or crack in a bone.", "Una rotura o grieta en un hueso."],
  ["hypodens", "hypodense", "Looks darker than nearby tissue on CT; describes appearance, not a diagnosis.", "Se ve más oscuro que el tejido cercano en la TC; describe el aspecto, no es un diagnóstico."],
  ["hyperdens", "hyperdense", "Looks brighter than nearby tissue on CT.", "Se ve más brillante que el tejido cercano en la TC."],
  ["hyperintens", "hyperintense", "Looks brighter on MRI; describes appearance, not a diagnosis.", "Se ve más brillante en la RM; describe el aspecto, no es un diagnóstico."],
  ["hypoechoic", "hypoechoic", "Looks darker on ultrasound; describes appearance, not a diagnosis.", "Se ve más oscuro en la ecografía; describe el aspecto, no es un diagnóstico."],
  ["enhanc", "enhancement", "An area that lights up after contrast dye.", "Una zona que se resalta después del medio de contraste."],
  ["contrast", "contrast", "A dye given to make some structures easier to see.", "Un medio que se administra para ver mejor algunas estructuras."],
  ["lymphadenopathy", "lymphadenopathy", "Enlarged lymph nodes, often from infection or inflammation.", "Ganglios linfáticos agrandados, a menudo por infección o inflamación."],
  ["lymph node", "lymph node", "Small glands that are part of the immune system.", "Pequeñas glándulas que forman parte del sistema inmunitario."],
  ["hepatomegaly", "hepatomegaly", "An enlarged liver.", "Hígado agrandado."],
  ["splenomegaly", "splenomegaly", "An enlarged spleen.", "Bazo agrandado."],
  ["steatosis", "hepatic steatosis", "Fatty liver: extra fat stored in the liver.", "Hígado graso: exceso de grasa en el hígado."],
  ["fatty liver", "fatty liver", "Extra fat stored in the liver.", "Exceso de grasa en el hígado."],
  ["cardiomegaly", "cardiomegaly", "The heart looks larger than usual on the image.", "El corazón se ve más grande de lo habitual en la imagen."],
  ["pneumothorax", "pneumothorax", "Air outside the lung, which can make the lung collapse.", "Aire fuera del pulmón, que puede hacer que el pulmón se colapse."],
  ["emphysema", "emphysema", "Damage to the air sacs of the lungs, often linked to smoking.", "Daño en los sacos de aire de los pulmones, a menudo relacionado con fumar."],
  ["granuloma", "granuloma", "A small area of healed inflammation, often from an old infection; usually harmless.", "Una pequeña zona de inflamación curada, a menudo por una infección antigua; suele ser inofensiva."],
  ["artifact", "artifact", "Something on the image caused by the scan itself, not by the body.", "Algo en la imagen causado por el propio estudio, no por el cuerpo."],
  ["clinical correlation", "clinical correlation", "The radiologist asks your doctor to compare this with your symptoms and exam.", "El radiólogo pide a su médico que lo compare con sus síntomas y su examen."],
  ["consistent with", "consistent with", "The appearance matches the condition named.", "El aspecto coincide con la condición mencionada."],
  ["cannot be excluded", "cannot be excluded", "The radiologist cannot fully rule it out from the images alone.", "El radiólogo no puede descartarlo del todo solo con las imágenes."],
  ["bi-?rads", "BI-RADS", "A 0 to 6 scale radiologists use to report breast imaging results.", "Una escala de 0 a 6 que usan los radiólogos para informar los estudios de mama."],
  ["lung-?rads", "Lung-RADS", "A scale radiologists use to report lung cancer screening CT results.", "Una escala que usan los radiólogos para informar la TC de detección de cáncer de pulmón."]
];

// Official BI-RADS assessment categories (American College of Radiology).
const BIRADS: Record<string, [string, string]> = {
  "0": ["BI-RADS 0: more images are needed before a result can be given.", "BI-RADS 0: se necesitan más imágenes antes de dar un resultado."],
  "1": ["BI-RADS 1: negative, nothing to comment on.", "BI-RADS 1: negativo, nada que comentar."],
  "2": ["BI-RADS 2: benign (not cancer) finding.", "BI-RADS 2: hallazgo benigno (no es cáncer)."],
  "3": ["BI-RADS 3: probably benign; a short-term follow-up is usually advised.", "BI-RADS 3: probablemente benigno; suele aconsejarse un control a corto plazo."],
  "4": ["BI-RADS 4: suspicious; a biopsy is usually recommended.", "BI-RADS 4: sospechoso; suele recomendarse una biopsia."],
  "5": ["BI-RADS 5: highly suggestive of cancer; a biopsy is recommended.", "BI-RADS 5: muy sugestivo de cáncer; se recomienda una biopsia."],
  "6": ["BI-RADS 6: cancer already confirmed by biopsy.", "BI-RADS 6: cáncer ya confirmado por biopsia."]
};

const FOLLOW_UP_PATTERNS: [RegExp, string][] = [
  [/suspicious for|suspicious\b|concerning for|worrisome for/i, "suspicious"],
  [/malignan|neoplasm|metasta/i, "malignancy"],
  [/cannot be excluded|cannot exclude|not excluded|differential (?:diagnosis )?includes/i, "not excluded"],
  [/recommend(?:ed|s)?\b[^.]{0,80}?(?:follow[- ]?up|biopsy|further evaluation|correlation|repeat|mri|ct|ultrasound|referral)|follow[- ]?up (?:ct|mri|imaging|ultrasound|exam) (?:is |in )|(?:biopsy|follow[- ]?up|further evaluation|correlation|repeat|referral)[^.]{0,60}?\b(?:is |are )?(?:recommended|advised|suggested)\b/i, "recommendation"],
  [/bi-?rads\s*(?:category\s*)?[3-5]/i, "birads"]
];

const NEGATION = /\b(?:no|not|without|negative for|free of|absence of|resolved)\b[^.;:]{0,40}$/i;
const CRITICAL = /critical (?:result|finding)|(?:discussed with|communicated to|called to|notified)\s+(?:dr\.?|doctor|the ordering|the referring)/i;

function splitSentences(text: string): string[] {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z0-9])|\s(?=\d+\.\s)/).map((s) => s.trim()).filter(Boolean);
}

function section(text: string, names: string): string {
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${names})\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:impression|conclusion|findings|technique|comparison|indication|history|clinical history|exam|procedure|signed|electronically signed|recommendation)s?\\s*:|$)`, "i"));
  return match ? match[1].trim() : "";
}

export function explainScanReport(text: string, language: ScanLanguage = "en"): ScanExplanation {
  const raw = String(text || "");
  const lower = raw.toLowerCase();
  // Prefer the exam title (the first lines or an "Exam:" line) over later mentions such as "follow-up CT".
  const title = (raw.match(/(?:^|\n)\s*(?:exam(?:ination)?|procedure|study)\s*:\s*([^\n]+)/i)?.[1] ?? raw.split(/\n/).slice(0, 2).join(" "));
  const modality = (MODALITIES.find(([pattern]) => pattern.test(title)) ?? MODALITIES.find(([pattern]) => pattern.test(raw)))?.[1] ?? "";
  const hasSections = /(?:^|\n)\s*(?:impression|findings|conclusion)\s*:/i.test(raw);
  const isScan = Boolean(modality && (hasSections || /radiolog|imaging|scan|views?\b/i.test(raw))) || (hasSections && /radiolog|imaging/i.test(raw));
  const impression = section(raw, "impression|conclusion|summary");
  const findings = section(raw, "findings");
  const es = language === "es";

  const terms: ScanTerm[] = [];
  const sentences = splitSentences(raw);
  TERMS.forEach(([pattern, term, en, spanish]) => {
    const regex = new RegExp(`\\b${pattern}`, "i");
    if (!regex.test(lower) || terms.some((item) => item.term === term)) return;
    // Say so when every mention is negated ("no pleural effusion", "without contrast").
    const mentions = sentences.map((sentence) => sentence.match(regex) && sentence.slice(0, sentence.match(regex)?.index ?? 0)).filter((prefix): prefix is string => typeof prefix === "string");
    const allNegated = mentions.length > 0 && mentions.every((prefix) => NEGATION.test(prefix));
    const note = allNegated ? (es ? " Su informe dice que esto no se vio o no se usó." : " Your report says this was not seen or not used.") : "";
    terms.push({ term, meaning: (es ? spanish : en) + note });
  });
  const birads = raw.match(/bi-?rads\s*(?:category\s*|assessment\s*)?:?\s*([0-6])/i)?.[1];
  if (birads && BIRADS[birads]) terms.unshift({ term: `BI-RADS ${birads}`, meaning: BIRADS[birads][es ? 1 : 0] });

  const followUps: ScanFollowUp[] = [];
  splitSentences(impression || raw).forEach((sentence) => {
    FOLLOW_UP_PATTERNS.forEach(([pattern, kind]) => {
      const match = sentence.match(pattern);
      if (!match || match.index === undefined) return;
      if (kind !== "recommendation" && kind !== "birads" && NEGATION.test(sentence.slice(0, match.index))) return;
      if (kind === "recommendation" && /\b(?:not (?:needed|necessary|required|recommended|indicated)|no (?:further|additional|follow[- ]?up))\b/i.test(sentence)) return;
      if (kind === "birads" && !/[3-5]/.test(match[0].slice(-1))) return;
      if (!followUps.some((item) => item.sentence === sentence)) followUps.push({ phrase: kind, sentence });
    });
  });

  return { isScan, modality, impression, findings, terms: terms.slice(0, 14), followUps: followUps.slice(0, 6), critical: isScan && CRITICAL.test(raw) };
}

export const SCAN_TEXT = {
  en: {
    title: "Your scan report explained",
    notice: "CareWise explains the words in the radiologist's report. It does not look at the images, and it does not change what the radiologist concluded.",
    impression: "The radiologist's summary (Impression)",
    noImpression: "No 'Impression' section was found. Read the whole report with your doctor.",
    terms: "Words in your report",
    ask: "Ask your doctor about these lines",
    askIntro: "The report uses words that usually mean a next step is needed. Ask your doctor what it means for you and how soon:",
    critical: "The report says a critical result was communicated to a doctor. If you have not heard from your doctor, contact them today.",
    scoreLabel: "Scan",
    finding: "Imaging report",
    findingLevel: "Explained below",
    findingDetail: (modality: string) => `This looks like a${/^[AEIOU]/.test(modality) ? "n" : ""} ${modality || "imaging"} report. CareWise explains the radiologist's words; it does not read the images.`,
    questions: [
      "What does the Impression mean for me in everyday terms?",
      "Does anything in this report need a follow-up scan or another test, and when?",
      "Is any finding related to the symptoms that led to this scan?"
    ]
  },
  es: {
    title: "Su informe de imagen explicado",
    notice: "CareWise explica las palabras del informe del radiólogo. No mira las imágenes ni cambia lo que concluyó el radiólogo.",
    impression: "El resumen del radiólogo (Impresión)",
    noImpression: "No se encontró la sección 'Impresión'. Revise el informe completo con su médico.",
    terms: "Palabras de su informe",
    ask: "Pregunte a su médico por estas frases",
    askIntro: "El informe usa palabras que suelen indicar que hace falta un siguiente paso. Pregunte a su médico qué significa para usted y con qué urgencia:",
    critical: "El informe dice que se comunicó un resultado crítico a un médico. Si su médico no le ha contactado, comuníquese hoy.",
    scoreLabel: "Imagen",
    finding: "Informe de imagen",
    findingLevel: "Explicado abajo",
    findingDetail: (modality: string) => `Parece un informe de ${modality || "imagen"}. CareWise explica las palabras del radiólogo; no lee las imágenes.`,
    questions: [
      "¿Qué significa la Impresión para mí en palabras sencillas?",
      "¿Algo de este informe necesita otro estudio o prueba de control, y cuándo?",
      "¿Algún hallazgo está relacionado con los síntomas que motivaron este estudio?"
    ]
  }
};
