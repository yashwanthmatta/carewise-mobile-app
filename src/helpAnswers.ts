import { LAB_TESTS, labTestInfo } from "./labPanel";
import { translateReportAnalysis, type ReportAnalysis } from "./reportAnalysis";
import { buildPersonalPlan, type PlanSection } from "./personalPlan";

// Built-in help answers, used when the online helper is off or unreachable. They come
// from CareWise's own test explanations, the person's latest result and app how-tos.
// Keep in step with help.js on the website.
type Language = "en" | "es";

const COMPILED = LAB_TESTS.map((test) => ({ test, patterns: test.aliases.map((alias) => new RegExp(`\\b${alias}\\b`, "i")) }));

const EXTRA_TESTS = [
  { pattern: /\bldl\b|bad cholesterol|colesterol malo/i, name: "LDL cholesterol", es: "Colesterol LDL", what: "The \"bad\" cholesterol that can build up in blood vessels over time. Lower is usually better for the heart.", whatEs: "El colesterol \"malo\" que puede acumularse en los vasos sanguíneos con el tiempo. Más bajo suele ser mejor para el corazón.", finding: "LDL cholesterol" },
  { pattern: /total cholesterol|\bcholesterol\b|colesterol total/i, name: "Total cholesterol", es: "Colesterol total", what: "All the cholesterol in your blood: LDL, HDL and others together.", whatEs: "Todo el colesterol de la sangre: LDL, HDL y otros juntos.", finding: "Total cholesterol" },
  { pattern: /triglycer|triglicér/i, name: "Triglycerides", es: "Triglicéridos", what: "A type of fat in the blood. It goes up with sugar, alcohol and large meals, and is often checked after fasting.", whatEs: "Un tipo de grasa en la sangre. Sube con el azúcar, el alcohol y las comidas grandes; suele medirse en ayunas.", finding: "Triglycerides" },
  { pattern: /\b(hb)?a1c\b|hemoglobin a1c|glycated|glucosilada/i, name: "A1C (HbA1c)", es: "A1C (HbA1c)", what: "Your average blood sugar over the last 2 to 3 months. It is used to check for diabetes and prediabetes.", whatEs: "El promedio de azúcar en la sangre de los últimos 2 a 3 meses. Se usa para detectar diabetes y prediabetes.", finding: "A1C" },
  { pattern: /blood pressure|\bbp\b|presión arterial/i, name: "Blood pressure", es: "Presión arterial", what: "How hard blood pushes on your artery walls. The top number is when the heart beats, the bottom when it rests.", whatEs: "La fuerza con la que la sangre empuja las arterias. El número de arriba es cuando late el corazón; el de abajo, cuando descansa.", finding: "Blood pressure" },
  { pattern: /vitamin d|vitamina d/i, name: "Vitamin D", es: "Vitamina D", what: "A vitamin that helps keep bones and muscles strong. Levels are often low in winter or with little sun.", whatEs: "Una vitamina que ayuda a mantener fuertes los huesos y músculos. Suele estar baja en invierno o con poco sol.", finding: "Vitamin D" },
];

const NEXT_STEP = {
  en: {
    urgent: "Contact your doctor today. If you feel very unwell, seek emergency care.",
    needs_review: "Ask your doctor about these results soon.",
    attention: "Bring these results up at your next visit.",
    routine: "Nothing urgent stands out. Keep this for your next checkup.",
  },
  es: {
    urgent: "Comuníquese hoy con su médico. Si se siente muy mal, busque atención de emergencia.",
    needs_review: "Pregunte pronto a su médico sobre estos resultados.",
    attention: "Comente estos resultados en su próxima consulta.",
    routine: "No se ve nada urgente. Guárdelo para su próximo chequeo.",
  },
} as const;

const STATUS_WORDS: Record<Language, Record<string, string>> = {
  en: { above: "above the lab's range", below: "below the lab's range", within: "within the lab's range", unknown: "with no range printed" },
  es: { above: "por encima del rango del laboratorio", below: "por debajo del rango del laboratorio", within: "dentro del rango del laboratorio", unknown: "sin rango impreso" },
};

const TOPICS: Record<Language, [RegExp, string][]> = {
  en: [
    [/^(hi|hello|hey|good (morning|afternoon|evening))\b/i, "Hello! I can explain a test on your report, tell you what to do next, or help with adding a report, the doctor brief, your account and plans. What would you like to know?"],
    [/thank|thanks|great|perfect|ok(ay)?\b|got it/i, "You're welcome. Ask me anything else about your report or CareWise."],
    [/who are you|what are you|what can you do|^help$|how does (this|it|the app|carewise) work|what is carewise|how (do i|to) use/i, "I'm the CareWise helper. CareWise explains lab and scan reports in plain words, shows what needs attention first, gives you questions for the doctor and a doctor brief, and keeps a health record for you or a family member. Try \"What does my result mean?\" or a test name, like \"What is eGFR?\""],
    [/upload|photo|picture|pdf|add .*report|new report|how.*start|paste/i, "Open the Reports tab, paste the report text or pick a file, choose whose report it is, then tap Explain. It is explained on this phone."],
    [/plan|price|pay|cost|cancel|subscri|\bplus\b|family plan|stripe|card|refund|billing|free/i, "Free covers explaining reports, the doctor brief and your health record. Plus is $7 a month for personal plans, reminders and trends. Family is $12 a month for up to 5 people. See Plans under More; you can cancel any time with \"Manage or cancel plan\"."],
    [/brief|print|share with (my )?doctor|appointment|visit/i, "Under your result, tap \"Doctor brief\" to share a one-page summary of the values, what needs attention and your questions."],
    [/ask (my |the )?doctor|questions? (for|to ask)/i, "Good questions to start with: Which result matters most for me? Does anything need a repeat test, and when? Is any of this linked to how I have been feeling?"],
    [/mom|mum|dad|father|mother|parent|family member|caregiver|someone else/i, "Type whose report it is (Me, Mom, Dad or another name) before you tap Explain. CareWise keeps each person's reports and record apart."],
    [/record|allerg|condition|timeline/i, "Open the Record tab to keep conditions, allergies, visits and what did not suit you. It is saved on this phone."],
    [/account|sign ?up|log ?in|password|save|sync|email/i, "Open the Account tab to create a free account with your email and keep your reports."],
    [/privacy|delete|data|safe|secure|who can see/i, "Reports are explained on this phone. Saved report text is encrypted, and you can request deletion under Legal."],
    [/\b(mri|ct|x-?ray|ultrasound|scan|mammogram|radiolog)/i, "For a scan, paste the written report from the radiologist. CareWise explains the words in it; it does not look at the images themselves."],
    [/medicine|medication|drug|pill|dose|supplement|treat|cure|prescri|\b(can|should) i take\b|aspirin|ibuprofen|tylenol|acetaminophen|statin|metformin|insulin|antibiotic/i, "I can't suggest medicines, supplements or doses. Please ask your doctor or pharmacist, and write the question down so you remember it at the visit."],
  ],
  es: [
    [/^(hola|buenas|buenos días)/i, "¡Hola! Puedo explicar una prueba de tu informe, decirte qué hacer después o ayudarte con el resumen para el médico, tu cuenta y los planes."],
    [/gracias|perfecto|vale|de acuerdo/i, "De nada. Pregúntame lo que quieras sobre tu informe o CareWise."],
    [/quién eres|qué puedes hacer|ayuda|cómo funciona|qué es carewise/i, "Soy el asistente de CareWise. CareWise explica informes con palabras simples, muestra primero lo que necesita atención y te da preguntas para el médico. Prueba con \"¿Qué significa mi resultado?\" o el nombre de una prueba."],
    [/subir|foto|pdf|agregar|nuevo informe|empez|pegar/i, "Abre la pestaña Reports, pega el texto del informe o elige un archivo, indica de quién es y toca Explain."],
    [/plan|precio|pag|costo|cancel|suscri|tarjeta|gratis/i, "Gratis incluye explicar informes, el resumen para el médico y tu historial. Plus cuesta $7 al mes y Familia $12 al mes para hasta 5 personas."],
    [/resumen|cita|consulta/i, "Debajo de tu resultado toca \"Doctor brief\" para compartir un resumen de una página."],
    [/mamá|papá|madre|padre|familia|cuidador/i, "Escribe de quién es el informe (Yo, Mamá, Papá u otro nombre) antes de tocar Explain."],
    [/cuenta|contraseña|guardar|iniciar|correo/i, "Abre la pestaña Account para crear una cuenta gratis con tu correo."],
    [/medicina|medicamento|pastilla|dosis|suplemento|tratamiento|puedo tomar|receta/i, "No puedo sugerir medicamentos, suplementos ni dosis. Pregunta a tu médico o farmacéutico."],
  ],
};

const RESULT_QUESTION = /(my|the) (result|report|score|numbers|values)|what does (it|this|my).*mean|what (should i do )?next|next step|what now|anything wrong|is (it|this|my).*(bad|ok|okay|normal|serious|fine)|explain (it|this|my)|summar|resultado|mi informe|qué hago|siguiente paso|qué significa/i;

function formatList(items: string[], es: boolean) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${es ? "y" : "and"} ${items[items.length - 1]}`;
}

function resultAnswer(analysis: ReportAnalysis | null, es: boolean): string {
  if (!analysis || analysis.noData) {
    return es
      ? "Todavía no hay un informe explicado. Abre la pestaña Reports, agrega tu informe (o toca \"Try sample report\") y toca Explain. Luego pregúntame de nuevo."
      : "There's no explained report yet. Open the Reports tab, add your report (or tap \"Try sample report\"), and tap Explain. Then ask me again and I'll sum it up for you.";
  }
  const view = es ? translateReportAnalysis(analysis, "es") : analysis;
  const lines: string[] = [];
  lines.push(analysis.scanOnly
    ? (es ? "Es un informe de imagen. CareWise explica las palabras del radiólogo; no mira las imágenes." : "This is a scan report. CareWise explains the radiologist's words; it does not look at the images.")
    : (es ? `Puntuación de salud: ${analysis.score}/100 (estimación educativa).` : `Health score: ${analysis.score}/100 (an educational estimate).`));
  const flagged = view.findings.filter((item) => !/better range|within|mejor rango|dentro/i.test(item.level)).slice(0, 3);
  if (flagged.length) lines.push((es ? "Lo que necesita atención: " : "What needs attention: ") + flagged.map((item) => `${item.label} (${item.level.toLowerCase()})`).join("; ") + ".");
  const outside = analysis.panelResults.filter((item) => item.status === "above" || item.status === "below");
  if (outside.length) {
    const names = outside.slice(0, 4).map((item) => {
      const name = es ? labTestInfo(item.key)?.es ?? item.name : item.name;
      const word = es ? (item.status === "above" ? "alto" : "bajo") : (item.status === "above" ? "high" : "low");
      return `${name} ${item.valueText}${item.unit ? ` ${item.unit}` : ""} (${word})`;
    });
    lines.push((es ? "Fuera del rango del laboratorio: " : "Outside the lab's range: ") + formatList(names, es) + (outside.length > 4 ? (es ? ", y más." : ", and more.") : "."));
  } else if (analysis.panelResults.length) {
    const count = analysis.panelResults.length;
    lines.push(es
      ? (count === 1 ? "La prueba con rango impreso está dentro del rango del laboratorio." : `Las ${count} pruebas con rango impreso están dentro del rango del laboratorio.`)
      : (count === 1 ? "The test with a printed range is within the lab's range." : `All ${count} tests with a printed range are within the lab's range.`));
  }
  lines.push((es ? "Siguiente paso: " : "Next step: ") + NEXT_STEP[es ? "es" : "en"][analysis.riskLevel]);
  if (view.questions.length) lines.push((es ? "Pregunta para su médico: " : "A question for your doctor: ") + view.questions[0]);
  lines.push(es ? "Escríbeme el nombre de una prueba para saber qué mide." : "Type the name of any test to learn what it measures.");
  return lines.join("\n");
}

function testAnswer(question: string, analysis: ReportAnalysis | null, es: boolean): string {
  const doctor = es ? "Su médico puede decir qué significa para usted." : "Your doctor can tell you what it means for you.";
  const hit = COMPILED.find(({ patterns }) => patterns.some((pattern) => pattern.test(question)));
  if (hit) {
    const { test } = hit;
    const lines = [`${es ? test.es : test.name}: ${es ? test.whatEs : test.what}`];
    const mine = analysis?.panelResults.find((item) => item.key === test.key);
    if (mine) {
      const value = `${mine.valueText}${mine.unit ? ` ${mine.unit}` : ""}${mine.rangeText ? ` (${es ? "rango" : "range"} ${mine.rangeText})` : ""}`;
      lines.push(`${es ? "En su informe" : "On your report"}: ${value}, ${STATUS_WORDS[es ? "es" : "en"][mine.status] ?? ""}.`);
    }
    lines.push(doctor);
    return lines.join("\n");
  }
  const extra = EXTRA_TESTS.find((test) => test.pattern.test(question));
  if (extra) {
    const lines = [`${es ? extra.es : extra.name}: ${es ? extra.whatEs : extra.what}`];
    const finding = analysis?.findings.find((item) => item.label === extra.finding);
    if (finding) lines.push(`${es ? "En su informe" : "On your report"}: ${finding.detail.replace(/\.$/, "")} (${finding.level.toLowerCase()}).`);
    lines.push(doctor);
    return lines.join("\n");
  }
  return "";
}

function fallbackAnswer(es: boolean): string {
  return es
    ? "Puedo ayudarte con esto:\n• Qué significa tu resultado y qué hacer después\n• Qué mide una prueba (escribe su nombre, por ejemplo \"TSH\")\n• Agregar un informe, el resumen para el médico, tu cuenta y los planes\nElige una opción abajo o escribe tu pregunta de otra forma."
    : "Here's what I can help with:\n• What your result means and what to do next\n• What a test measures (type its name, like \"TSH\" or \"eGFR\")\n• Adding a report, the doctor brief, your account and plans\nPick one below or ask in a different way.";
}

// Food, movement and lifestyle questions get the same guideline-based plan the
// result shows, built from the person's own values.
const LIFESTYLE_QUESTION = /\b(eat|eating|food|foods|diet|meal|meals|recipe|breakfast|lunch|dinner|snack|cook|nutrition|fruit|vegetable|salt|exercise|exercises|workout|walk|walking|gym|yoga|activity|active|fitness|weight|lose|losing|lower|reduce|improve|bring down|control|lifestyle|habit|habits|naturally)\b|comer|comida|dieta|ejercicio|caminar|peso|bajar|mejorar|hábitos|saludable/i;
const SLEEP_QUESTION = /\b(sleep|insomnia|tired|fatigue|stress|anxious|anxiety)\b|dormir|sueño|cansad|estrés/i;
const MEDICINE_QUESTION = /medicine|medication|meds\b|drug|pill|tablet|dose|dosage|supplement|prescri|\b(can|should) i take\b|aspirin|ibuprofen|tylenol|acetaminophen|statin|metformin|insulin|antibiotic|medicina|medicamento|pastilla|dosis|suplemento|receta|puedo tomar/i;

function planItems(section: PlanSection, limit: number, said: Set<string>): string[] {
  return section.items.slice(0, limit).map((item) => {
    const why = item.why && !said.has(item.why) ? ` (${item.why})` : "";
    if (item.why) said.add(item.why);
    return `• ${item.text}${why}`;
  });
}

function lifestyleAnswer(question: string, analysis: ReportAnalysis | null, es: boolean): string {
  const wantsMove = /exercise|workout|walk|gym|yoga|activity|active|fitness|ejercicio|caminar/i.test(question);
  const wantsFood = /eat|food|diet|meal|recipe|breakfast|lunch|dinner|snack|cook|nutrition|fruit|vegetable|salt|sugar|comer|comida|dieta/i.test(question);
  const both = wantsMove === wantsFood;
  if (!analysis || analysis.scanOnly) {
    return (es
      ? ["Consejos generales basados en guías públicas (AHA, CDC):",
        "• Verduras y fruta en la mayoría de las comidas, cereales integrales, y proteína de pescado, legumbres, frutos secos o pollo.",
        "• Menos bebidas azucaradas, dulces, sal y carnes procesadas.",
        "• 150 minutos por semana de actividad moderada (por ejemplo, caminar rápido 30 minutos, 5 días) y ejercicios de fuerza 2 días.",
        "• Si no haces ejercicio ahora, empieza con 10 minutos al día.",
        "Explica tu informe y te daré un plan según tus propios valores."]
      : ["General guidance from public guidelines (AHA, CDC):",
        "• Vegetables and fruit at most meals, whole grains, and protein from fish, beans, nuts or poultry.",
        "• Fewer sugary drinks, sweets, salty and processed foods.",
        "• 150 minutes a week of moderate activity (for example a brisk 30-minute walk on 5 days) plus strength exercises on 2 days.",
        "• If you're not active now, start with 10 minutes a day and add a little each week.",
        "Explain your report and I'll tailor this to your own results."]).join("\n");
  }
  const plan = buildPersonalPlan(analysis, es ? "es" : "en");
  const section = (key: PlanSection["key"]) => plan.sections.find((item) => item.key === key)!;
  const lines = [es ? "Según tu informe, esto es lo que recomiendan las guías:" : "Based on your report, here's what the guidelines suggest:"];
  if (plan.urgent) return [...lines, `• ${section("move").items[0].text}`].join("\n");
  const said = new Set<string>();
  if (both || wantsFood) lines.push(es ? "Comida:" : "Food:", ...planItems(section("food"), both ? 4 : 6, said));
  if (both || wantsMove) lines.push(es ? "Movimiento:" : "Movement:", ...planItems(section("move"), both ? 3 : 5, said));
  const track = section("track").items[0];
  if (track) lines.push((es ? "Seguimiento: " : "Track: ") + track.text);
  lines.push(section("safety").items[0].text);
  return lines.join("\n");
}

function sleepAnswer(es: boolean): string {
  return es
    ? "Consejos generales (CDC):\n• Los adultos necesitan 7 horas o más de sueño.\n• Acuéstate y levántate a la misma hora, también los fines de semana.\n• Evita pantallas, cafeína y comidas grandes antes de dormir.\n• Muévete durante el día y sal a la luz del sol por la mañana.\nSi el cansancio o el estrés duran semanas, coméntalo con tu médico: algunas pruebas (como hierro, tiroides o B12) pueden estar relacionadas."
    : "General guidance (CDC):\n• Adults need 7 or more hours of sleep.\n• Go to bed and get up at the same time, weekends too.\n• Avoid screens, caffeine and big meals close to bedtime.\n• Move during the day and get morning daylight.\nIf tiredness or stress lasts for weeks, tell your doctor: some lab results (such as iron, thyroid or B12) can be linked to tiredness.";
}

function medicineAnswer(analysis: ReportAnalysis | null, es: boolean): string {
  const lines = es
    ? ["No puedo recomendar ni nombrar medicamentos, suplementos o dosis; eso lo decide tu médico, que conoce tu historial completo.",
      "Preguntas útiles para tu médico o farmacéutico:",
      "• ¿Mis resultados indican que debería considerar un medicamento, o primero cambios de hábitos?",
      "• ¿Qué beneficios y efectos secundarios tendría, y cuándo repetimos la prueba?",
      "• ¿Interactúa con lo que ya tomo?"]
    : ["I can't recommend or name medicines, supplements or doses. That decision is your doctor's, because it depends on your whole history.",
      "Useful questions to ask your doctor or pharmacist:",
      "• Do my results mean I should consider a medicine, or try lifestyle changes first?",
      "• What are the benefits and side effects, and when should I repeat the test?",
      "• Does it interact with anything I already take?"];
  if (analysis && !analysis.scanOnly) lines.push(es ? "Mientras tanto, pregúntame \"¿qué debo comer?\" o \"¿qué ejercicio me conviene?\"." : "Meanwhile, ask me \"what should I eat?\" or \"what exercise is good for me?\" to see what the guidelines suggest for your results.");
  return lines.join("\n");
}

export function builtInHelpAnswer(question: string, language: Language, analysis: ReportAnalysis | null): { reply: string; showTopics: boolean } {
  const es = language === "es";
  const clean = question.trim();
  const usable = analysis && !analysis.noData ? analysis : null;
  if (MEDICINE_QUESTION.test(clean)) return { reply: medicineAnswer(usable, es), showTopics: false };
  if (LIFESTYLE_QUESTION.test(clean)) return { reply: lifestyleAnswer(clean, usable, es), showTopics: false };
  if (SLEEP_QUESTION.test(clean)) return { reply: sleepAnswer(es), showTopics: false };
  // A test name wins over a general topic ("what is my LDL" is about LDL).
  const test = testAnswer(clean, usable, es);
  if (test) return { reply: test, showTopics: false };
  if (RESULT_QUESTION.test(clean)) return { reply: resultAnswer(usable, es), showTopics: false };
  const topic = TOPICS[language].find(([pattern]) => pattern.test(clean));
  if (topic) return { reply: topic[1], showTopics: false };
  if (/\b(what|why|how|mean|result|report|qué|significa)\b/i.test(clean) && usable) return { reply: resultAnswer(usable, es), showTopics: false };
  return { reply: fallbackAnswer(es), showTopics: true };
}
