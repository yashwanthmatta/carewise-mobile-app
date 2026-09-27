// Personal plan built from a person's own report values, using published public
// guidelines. Education only: it never names medicines or doses, and it gives
// no exercise plan when the report suggests urgent care.
// The website runs a JavaScript copy of this file; keep the two identical.

export type PlanLanguage = "en" | "es";
export type PlanItem = { text: string; why?: string; source?: string };
export type PlanSection = { key: "food" | "move" | "track" | "safety"; title: string; items: PlanItem[] };
export type PersonalPlan = { title: string; urgent: boolean; sections: PlanSection[]; whyLabel: string; sourceLabel: string };
type PlanValue = { label: string; value: number | string };
type PlanInput = { labValues?: PlanValue[]; riskLevel?: string };

const PLAN_TEXT = {
  en: {
    title: "Your plan for the next 4 weeks",
    whyLabel: "Why",
    sourceLabel: "Source",
    food: "Food",
    move: "Movement",
    track: "Track",
    safety: "Before you start",
    heartFat: "Swap saturated fats: use olive or canola oil instead of butter, and choose fish, beans, skinless poultry or low-fat dairy more often than fatty red or processed meat.",
    heartFiber: "Add soluble fiber every day: oats, beans, lentils, barley, apples or citrus fruit.",
    heartFish: "Eat fish such as salmon or sardines about twice a week.",
    trigSugar: "Cut back on sugary drinks, sweets and white bread, rice or pasta; choose whole grains instead.",
    trigAlcohol: "Limit alcohol, which can raise triglycerides.",
    a1cPlate: "Use the plate method: half non-starchy vegetables, a quarter lean protein and a quarter whole grains or starchy food.",
    a1cDrinks: "Drink water or unsweetened tea or coffee instead of soda and juice.",
    a1cWeight: "If you are overweight, losing 5 to 7% of your body weight can lower your chance of type 2 diabetes.",
    bpDash: "Follow a DASH-style eating pattern: plenty of fruit, vegetables, beans, nuts, whole grains and low-fat dairy.",
    bpSalt: "Keep salt (sodium) under 2,300 mg a day; check labels on bread, soups, sauces and restaurant food.",
    vitdFood: "Include vitamin D foods such as fatty fish, eggs, and fortified milk or cereal.",
    balanced: "Keep a balanced pattern: vegetables and fruit at most meals, whole grains, and protein from fish, beans, nuts or poultry.",
    move150: "Aim for 150 minutes a week of moderate activity, such as brisk walking for 30 minutes on 5 days.",
    moveStrength: "Add muscle-strengthening activity, like bodyweight exercises or resistance bands, on 2 days a week.",
    moveStart: "If you are not active now, start with 10 minutes a day and add a few minutes each week.",
    moveMeals: "A short walk after meals can help keep blood sugar steadier.",
    moveAsk: "Ask your clinician what level of activity is safe for you, especially if you have chest pain, dizziness or heart disease.",
    urgentMove: "Do not start a new exercise plan now. The report mentions urgent symptoms or very high blood pressure: get medical care first.",
    trackBp: "Check your blood pressure at home a few times a week and bring the readings to your visit.",
    trackA1c: "Ask your doctor when to repeat your A1C test.",
    trackLipids: "Ask your doctor when to repeat your cholesterol test.",
    trackDiary: "Write down what you eat and how much you move for one week before your next visit.",
    safetyAsk: "If you take medicines, are pregnant, or have kidney disease, diabetes or an eating disorder, ask your clinician before changing your diet or exercise.",
    safetyVitd: "Ask your clinician before starting a vitamin D supplement or choosing a dose.",
    safetyGeneral: "This plan is general education based on public guidelines, not a prescription.",
    reactions: (names: string) => `Your health record says these did not suit you: ${names}. Check new foods and supplements against it.`,
    whyLdl: (v: number) => `Your LDL is ${v} mg/dL (130 or higher).`,
    whyTotal: (v: number) => `Your total cholesterol is ${v} mg/dL (200 or higher).`,
    whyTrig: (v: number) => `Your triglycerides are ${v} mg/dL (150 or higher).`,
    whyA1c: (v: number) => `Your A1C is ${v}% (${v >= 6.5 ? "6.5" : "5.7"}% or higher).`,
    whyBp: (v: string) => `Your blood pressure is ${v} (130/80 or higher).`,
    whyVitd: (v: number) => `Your vitamin D is ${v} ng/mL (below 30).`,
    whyAdults: "Recommended for most adults."
  },
  es: {
    title: "Su plan para las próximas 4 semanas",
    whyLabel: "Por qué",
    sourceLabel: "Fuente",
    food: "Comida",
    move: "Actividad física",
    track: "Seguimiento",
    safety: "Antes de empezar",
    heartFat: "Cambie las grasas saturadas: use aceite de oliva o de canola en vez de mantequilla, y elija pescado, frijoles, pollo sin piel o lácteos bajos en grasa más a menudo que carnes rojas grasas o procesadas.",
    heartFiber: "Añada fibra soluble cada día: avena, frijoles, lentejas, cebada, manzanas o cítricos.",
    heartFish: "Coma pescado, como salmón o sardinas, unas dos veces por semana.",
    trigSugar: "Reduzca las bebidas azucaradas, los dulces y el pan, arroz o pasta blancos; elija granos integrales.",
    trigAlcohol: "Limite el alcohol, que puede subir los triglicéridos.",
    a1cPlate: "Use el método del plato: la mitad verduras sin almidón, un cuarto proteína magra y un cuarto granos integrales o alimentos con almidón.",
    a1cDrinks: "Tome agua, o té o café sin azúcar, en lugar de refrescos y jugos.",
    a1cWeight: "Si tiene sobrepeso, perder del 5 al 7 % de su peso puede reducir la probabilidad de diabetes tipo 2.",
    bpDash: "Siga un patrón de alimentación tipo DASH: muchas frutas, verduras, frijoles, nueces, granos integrales y lácteos bajos en grasa.",
    bpSalt: "Mantenga la sal (sodio) por debajo de 2,300 mg al día; revise las etiquetas del pan, sopas, salsas y comida de restaurante.",
    vitdFood: "Incluya alimentos con vitamina D, como pescado graso, huevos y leche o cereal fortificados.",
    balanced: "Mantenga un patrón equilibrado: verduras y fruta en la mayoría de las comidas, granos integrales y proteína de pescado, frijoles, nueces o pollo.",
    move150: "Intente hacer 150 minutos a la semana de actividad moderada, como caminar a paso rápido 30 minutos 5 días.",
    moveStrength: "Añada ejercicios para fortalecer los músculos, con su propio peso o bandas elásticas, 2 días a la semana.",
    moveStart: "Si ahora no hace actividad, empiece con 10 minutos al día y añada unos minutos cada semana.",
    moveMeals: "Una caminata corta después de comer puede ayudar a mantener el azúcar en sangre más estable.",
    moveAsk: "Pregunte a su profesional de salud qué nivel de actividad es seguro para usted, sobre todo si tiene dolor en el pecho, mareos o enfermedad del corazón.",
    urgentMove: "No empiece ahora un nuevo plan de ejercicio. El informe menciona síntomas urgentes o presión arterial muy alta: busque atención médica primero.",
    trackBp: "Mida su presión arterial en casa algunas veces por semana y lleve las lecturas a su cita.",
    trackA1c: "Pregunte a su médico cuándo repetir su prueba de A1C.",
    trackLipids: "Pregunte a su médico cuándo repetir su prueba de colesterol.",
    trackDiary: "Anote lo que come y cuánto se mueve durante una semana antes de su próxima cita.",
    safetyAsk: "Si toma medicamentos, está embarazada o tiene enfermedad renal, diabetes o un trastorno alimentario, consulte a su profesional de salud antes de cambiar su dieta o ejercicio.",
    safetyVitd: "Consulte a su profesional de salud antes de empezar un suplemento de vitamina D o elegir una dosis.",
    safetyGeneral: "Este plan es educación general basada en guías públicas, no una receta médica.",
    reactions: (names: string) => `Su historial dice que esto no le sentó bien: ${names}. Revise los alimentos y suplementos nuevos con esa lista.`,
    whyLdl: (v: number) => `Su LDL es ${v} mg/dL (130 o más).`,
    whyTotal: (v: number) => `Su colesterol total es ${v} mg/dL (200 o más).`,
    whyTrig: (v: number) => `Sus triglicéridos son ${v} mg/dL (150 o más).`,
    whyA1c: (v: number) => `Su A1C es ${v} % (${v >= 6.5 ? "6.5" : "5.7"} % o más).`,
    whyBp: (v: string) => `Su presión arterial es ${v} (130/80 o más).`,
    whyVitd: (v: number) => `Su vitamina D es ${v} ng/mL (menos de 30).`,
    whyAdults: "Recomendado para la mayoría de los adultos."
  }
};

const SOURCES = {
  aha: "American Heart Association",
  ada: "American Diabetes Association",
  cdcDpp: "CDC National Diabetes Prevention Program",
  dash: "NHLBI DASH eating plan",
  nih: "NIH Office of Dietary Supplements",
  dga: "Dietary Guidelines for Americans",
  cdcActivity: "CDC Physical Activity Guidelines"
};

function planNumber(values: PlanValue[], label: string): number | null {
  const found = values.find((item) => item.label === label);
  const value = found ? Number(found.value) : NaN;
  return Number.isFinite(value) ? value : null;
}

export function buildPersonalPlan(analysis: PlanInput, language: PlanLanguage = "en", reactions: string[] = []): PersonalPlan {
  const t = PLAN_TEXT[language] || PLAN_TEXT.en;
  const values = analysis.labValues || [];
  const ldl = planNumber(values, "LDL cholesterol");
  const total = planNumber(values, "Total cholesterol");
  const trig = planNumber(values, "Triglycerides");
  const a1c = planNumber(values, "A1C");
  const vitd = planNumber(values, "Vitamin D");
  const bpText = String(values.find((item) => item.label === "Blood pressure")?.value ?? "");
  const [systolic, diastolic] = bpText.split("/").map(Number);
  const highBp = (Number.isFinite(systolic) && systolic >= 130) || (Number.isFinite(diastolic) && diastolic >= 80);
  const urgent = analysis.riskLevel === "urgent" || (Number.isFinite(systolic) && systolic >= 180);
  const heart = (ldl !== null && ldl >= 130) || (total !== null && total >= 200);
  const heartWhy = ldl !== null && ldl >= 130 ? t.whyLdl(ldl) : total !== null ? t.whyTotal(total) : "";

  const food: PlanItem[] = [];
  if (heart) {
    food.push({ text: t.heartFat, why: heartWhy, source: SOURCES.aha });
    food.push({ text: t.heartFiber, why: heartWhy, source: SOURCES.aha });
    food.push({ text: t.heartFish, why: heartWhy, source: SOURCES.aha });
  }
  if (trig !== null && trig >= 150) {
    food.push({ text: t.trigSugar, why: t.whyTrig(trig), source: SOURCES.aha });
    food.push({ text: t.trigAlcohol, why: t.whyTrig(trig), source: SOURCES.aha });
  }
  if (a1c !== null && a1c >= 5.7) {
    food.push({ text: t.a1cPlate, why: t.whyA1c(a1c), source: SOURCES.ada });
    food.push({ text: t.a1cDrinks, why: t.whyA1c(a1c), source: SOURCES.ada });
    if (a1c < 6.5) food.push({ text: t.a1cWeight, why: t.whyA1c(a1c), source: SOURCES.cdcDpp });
  }
  if (highBp) {
    food.push({ text: t.bpDash, why: t.whyBp(bpText), source: SOURCES.dash });
    food.push({ text: t.bpSalt, why: t.whyBp(bpText), source: SOURCES.aha });
  }
  if (vitd !== null && vitd < 30) food.push({ text: t.vitdFood, why: t.whyVitd(vitd), source: SOURCES.nih });
  if (!food.length) food.push({ text: t.balanced, source: SOURCES.dga });

  const move: PlanItem[] = urgent
    ? [{ text: t.urgentMove }]
    : [
        { text: t.move150, why: t.whyAdults, source: SOURCES.cdcActivity },
        { text: t.moveStrength, why: t.whyAdults, source: SOURCES.cdcActivity },
        { text: t.moveStart, source: SOURCES.cdcActivity },
        ...(a1c !== null && a1c >= 5.7 ? [{ text: t.moveMeals, why: t.whyA1c(a1c), source: SOURCES.ada }] : []),
        ...(heart || highBp ? [{ text: t.moveAsk }] : [])
      ];

  const track: PlanItem[] = [];
  if (highBp) track.push({ text: t.trackBp, why: t.whyBp(bpText), source: SOURCES.aha });
  if (a1c !== null && a1c >= 5.7) track.push({ text: t.trackA1c, why: t.whyA1c(a1c) });
  if (heart || (trig !== null && trig >= 150)) track.push({ text: t.trackLipids, why: heartWhy || (trig !== null ? t.whyTrig(trig) : "") });
  track.push({ text: t.trackDiary });

  const safety: PlanItem[] = [{ text: t.safetyAsk }];
  if (vitd !== null && vitd < 30) safety.push({ text: t.safetyVitd });
  const reactionNames = reactions.map((name) => String(name).trim()).filter(Boolean).slice(0, 8);
  if (reactionNames.length) safety.push({ text: t.reactions(reactionNames.join(", ")) });
  safety.push({ text: t.safetyGeneral });

  return {
    title: t.title,
    urgent,
    whyLabel: t.whyLabel,
    sourceLabel: t.sourceLabel,
    sections: [
      { key: "food", title: t.food, items: food },
      { key: "move", title: t.move, items: move },
      { key: "track", title: t.track, items: track },
      { key: "safety", title: t.safety, items: safety }
    ]
  };
}
