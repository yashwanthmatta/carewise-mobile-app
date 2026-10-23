// Plain-language report view: summary, result cards, next 3 steps and "All tests".
// Generated from carewise-frontend/script.js (TEST_GUIDE through buildReportView);
// keep the two identical so the website and the app give the same explanation.
import { labTestInfo } from "./labPanel";
import { allTestRows, type ReportAnalysis, type TestRow } from "./reportAnalysis";
import { PLAN_TEXT, type PersonalPlan } from "./personalPlan";

// Version of the interpretation rules and wording below. Change it whenever a rule, threshold or
// explanation changes, so every output can be traced to the rules that produced it.
export const EXPLANATION_RULES_VERSION = "2026-10-20.5";

// Plain-language guide per test: what it is, what a high or low result can mean, and a
// question for the doctor. Educational wording only: no diagnosis, medicine names or doses.
// Tests not listed here use the LAB_TESTS name and description and the general wording.
const TEST_GUIDE: Record<string, Record<string, string>> = {
  ldl: { name: "LDL (bad cholesterol)", nameEs: "LDL (colesterol malo)", what: "A type of cholesterol that can build up in your blood vessels.", whatEs: "Un tipo de colesterol que se puede acumular en los vasos sanguíneos.", high: "Higher LDL can raise your risk of heart problems over time.", highEs: "Un LDL más alto puede aumentar con el tiempo el riesgo de problemas del corazón.", askHigh: "What should my LDL goal be, and what can I do to lower it?", askHighEs: "¿Cuál debería ser mi meta de LDL y qué puedo hacer para bajarlo?" },
  totalCholesterol: { name: "Total cholesterol", nameEs: "Colesterol total", what: "The overall amount of cholesterol in your blood.", whatEs: "La cantidad total de colesterol en la sangre.", high: "High total cholesterol can raise heart risk, depending on how much is LDL and how much is HDL.", highEs: "Un colesterol total alto puede aumentar el riesgo del corazón, según cuánto sea LDL y cuánto HDL.", askHigh: "How do my LDL and HDL change what my total cholesterol means?", askHighEs: "¿Cómo cambian mi LDL y mi HDL lo que significa mi colesterol total?" },
  triglycerides: { name: "Triglycerides (blood fats)", nameEs: "Triglicéridos (grasas en la sangre)", what: "A type of fat in your blood that comes from food and extra calories.", whatEs: "Un tipo de grasa en la sangre que viene de la comida y de las calorías de más.", high: "High triglycerides can add to heart risk. Sugary food, alcohol and not fasting before the test can raise them.", highEs: "Los triglicéridos altos pueden sumar riesgo para el corazón. El azúcar, el alcohol y no estar en ayunas antes del análisis pueden subirlos.", askHigh: "Was I supposed to fast for this test, and what would help bring my triglycerides down?", askHighEs: "¿Debía estar en ayunas para este análisis y qué me ayudaría a bajar los triglicéridos?" },
  a1c: { name: "A1C (average blood sugar)", nameEs: "A1C (azúcar promedio)", what: "Shows your average blood sugar over the past two to three months.", whatEs: "Muestra su nivel promedio de azúcar en la sangre de los últimos dos o tres meses.", high: "A higher A1C means your blood sugar has been running high. 5.7% to 6.4% is called the prediabetes range; 6.5% or higher is the diabetes range, which a doctor confirms with repeat testing.", highEs: "Un A1C más alto significa que el azúcar ha estado alto. De 5.7% a 6.4% se llama rango de prediabetes; 6.5% o más es el rango de diabetes, que el médico confirma repitiendo el análisis.", askHigh: "What does my A1C mean for me, and when should I test it again?", askHighEs: "¿Qué significa mi A1C para mí y cuándo debo repetirlo?" },
  vitaminD: { name: "Vitamin D", nameEs: "Vitamina D", what: "A vitamin your body needs for healthy bones and muscles.", whatEs: "Una vitamina que el cuerpo necesita para tener huesos y músculos sanos.", low: "Your result is below this lab's range. Guidelines don't all use the same cutoff for low vitamin D, so this result alone doesn't confirm a deficiency.", lowEs: "Su resultado está por debajo del rango de este laboratorio. Las guías no usan todas el mismo límite para la vitamina D baja, así que este resultado por sí solo no confirma una deficiencia.", high: "Very high vitamin D usually comes from taking a lot of supplements.", highEs: "La vitamina D muy alta suele venir de tomar muchos suplementos.", askLow: "Is my vitamin D level a concern for me, and should I do anything about it?", askLowEs: "¿Mi nivel de vitamina D es motivo de preocupación para mí y debo hacer algo al respecto?", askHigh: "Should I change the vitamin D I take?", askHighEs: "¿Debo cambiar la vitamina D que tomo?" },
  hdl: { name: "HDL (good cholesterol)", nameEs: "HDL (colesterol bueno)", what: "The type of cholesterol that helps remove other cholesterol from your blood.", whatEs: "El tipo de colesterol que ayuda a quitar otro colesterol de la sangre.", low: "Low HDL can add to heart risk. Activity and not smoking can help raise it.", lowEs: "Un HDL bajo puede sumar riesgo para el corazón. La actividad física y no fumar pueden ayudar a subirlo.", askLow: "What would help raise my HDL?", askLowEs: "¿Qué me ayudaría a subir el HDL?" },
  nonhdl: { high: "Higher non-HDL cholesterol can raise your risk of heart problems over time.", highEs: "Un colesterol no HDL más alto puede aumentar con el tiempo el riesgo de problemas del corazón.", askHigh: "What should my cholesterol goals be?", askHighEs: "¿Cuáles deberían ser mis metas de colesterol?" },
  glucose: { high: "Blood sugar can be high after eating, with stress or illness, or with diabetes. Whether you had fasted matters.", highEs: "El azúcar puede estar alto después de comer, con estrés o enfermedad, o con diabetes. Importa si estaba en ayunas.", low: "Low blood sugar can cause shakiness, sweating or confusion.", lowEs: "El azúcar bajo puede causar temblores, sudor o confusión.", askHigh: "Was this a fasting test, and do I need an A1C or a repeat test?", askHighEs: "¿Fue un análisis en ayunas y necesito un A1C o repetir la prueba?", askLow: "What could cause my low blood sugar, and what should I do if I feel shaky?", askLowEs: "¿Qué puede causar mi azúcar bajo y qué hago si me siento tembloroso?" },
  creatinine: { high: "Higher creatinine can mean the kidneys are filtering less well. Muscle mass, hydration and some medicines also affect it.", highEs: "Una creatinina más alta puede indicar que los riñones filtran menos. La masa muscular, la hidratación y algunos medicamentos también influyen.", low: "Low creatinine is usually not a concern and can reflect lower muscle mass.", lowEs: "La creatinina baja no suele preocupar y puede reflejar menos masa muscular.", askHigh: "How are my kidneys working, and do I need a repeat test?", askHighEs: "¿Cómo funcionan mis riñones y necesito repetir el análisis?" },
  egfr: { low: "A lower eGFR means the kidneys may be filtering less well. One result is not a diagnosis; doctors look at repeat tests.", lowEs: "Un TFGe más bajo indica que los riñones podrían filtrar menos. Un solo resultado no es un diagnóstico; el médico mira análisis repetidos.", askLow: "What does my eGFR mean for my kidneys, and when should it be checked again?", askLowEs: "¿Qué significa mi TFGe para mis riñones y cuándo debo repetirlo?" },
  bun: { high: "Higher BUN can come from dehydration, a high-protein diet or the kidneys filtering less well.", highEs: "Un BUN más alto puede deberse a deshidratación, mucha proteína en la dieta o a que los riñones filtran menos.", askHigh: "Could I have been dehydrated, and do my kidney tests look okay together?", askHighEs: "¿Podría haber estado deshidratado y cómo se ven juntos mis análisis de riñón?" },
  potassium: { high: "High potassium can affect heart rhythm. It can also read high if the blood sample was handled roughly.", highEs: "El potasio alto puede afectar el ritmo del corazón. También puede salir alto si la muestra se manipuló mal.", low: "Low potassium can cause weakness or cramps and can affect heart rhythm.", lowEs: "El potasio bajo puede causar debilidad o calambres y afectar el ritmo del corazón.", askHigh: "Does my potassium need a repeat test soon, and should I change what I eat?", askHighEs: "¿Debo repetir pronto el potasio y cambiar lo que como?", askLow: "What could be lowering my potassium, and does it need a repeat test?", askLowEs: "¿Qué podría estar bajando mi potasio y debo repetir el análisis?" },
  sodium: { high: "High sodium often means the body is low on water.", highEs: "El sodio alto a menudo indica falta de agua en el cuerpo.", low: "Low sodium can come from drinking a lot of water, some medicines or other conditions, and can cause tiredness or confusion.", lowEs: "El sodio bajo puede venir de tomar mucha agua, algunos medicamentos u otras condiciones, y puede causar cansancio o confusión.", askHigh: "Could I be dehydrated?", askHighEs: "¿Podría estar deshidratado?", askLow: "What could be lowering my sodium?", askLowEs: "¿Qué podría estar bajando mi sodio?" },
  calcium: { high: "High calcium can have several causes, including the glands that control calcium.", highEs: "El calcio alto puede tener varias causas, incluidas las glándulas que lo controlan.", low: "Low calcium can come from low vitamin D or low albumin.", lowEs: "El calcio bajo puede venir de vitamina D baja o albúmina baja.", askHigh: "What could be raising my calcium, and does it need more tests?", askHighEs: "¿Qué podría estar subiendo mi calcio y necesito más análisis?", askLow: "Could my vitamin D or albumin explain my calcium?", askLowEs: "¿Podrían mi vitamina D o mi albúmina explicar mi calcio?" },
  alt: { high: "Higher ALT can mean the liver is irritated, for example from fatty liver, alcohol, some medicines or an infection.", highEs: "Un ALT más alto puede indicar que el hígado está irritado, por ejemplo por hígado graso, alcohol, algunos medicamentos o una infección.", askHigh: "What could be irritating my liver, and should this be re-checked?", askHighEs: "¿Qué podría estar irritando mi hígado y debo repetir el análisis?" },
  ast: { high: "Higher AST can come from the liver or from muscles, for example after hard exercise.", highEs: "Un AST más alto puede venir del hígado o de los músculos, por ejemplo después de mucho ejercicio.", askHigh: "Is my AST from my liver or my muscles, and should it be re-checked?", askHighEs: "¿Mi AST viene del hígado o de los músculos, y debo repetirlo?" },
  alp: { high: "Higher alkaline phosphatase can come from the liver or the bones.", highEs: "Una fosfatasa alcalina más alta puede venir del hígado o de los huesos.", askHigh: "Is this coming from my liver or my bones?", askHighEs: "¿Esto viene del hígado o de los huesos?" },
  ggt: { high: "Higher GGT can come from the liver, alcohol or some medicines.", highEs: "Un GGT más alto puede venir del hígado, del alcohol o de algunos medicamentos.", askHigh: "What could be raising my GGT?", askHighEs: "¿Qué podría estar subiendo mi GGT?" },
  bilirubin: { high: "Higher bilirubin can come from the liver, from red blood cells breaking down, or from a common harmless condition called Gilbert's.", highEs: "Una bilirrubina más alta puede venir del hígado, de la ruptura de glóbulos rojos o de una condición común e inofensiva llamada Gilbert.", askHigh: "What could explain my bilirubin?", askHighEs: "¿Qué podría explicar mi bilirrubina?" },
  albumin: { low: "Low albumin can come from not eating enough protein, liver or kidney problems, or illness.", lowEs: "La albúmina baja puede venir de comer poca proteína, problemas del hígado o del riñón, o una enfermedad.", askLow: "What could be lowering my albumin?", askLowEs: "¿Qué podría estar bajando mi albúmina?" },
  hemoglobin: { low: "Low hemoglobin is called anemia. It can cause tiredness and has many causes, such as low iron.", lowEs: "La hemoglobina baja se llama anemia. Puede causar cansancio y tiene muchas causas, como el hierro bajo.", high: "High hemoglobin can come from dehydration, smoking, living at altitude or other conditions.", highEs: "La hemoglobina alta puede venir de deshidratación, fumar, vivir en altura u otras condiciones.", askLow: "Do I have anemia, and what could be causing it?", askLowEs: "¿Tengo anemia y qué podría estar causándola?", askHigh: "What could be raising my hemoglobin?", askHighEs: "¿Qué podría estar subiendo mi hemoglobina?" },
  hematocrit: { low: "A low hematocrit usually goes with low hemoglobin (anemia).", lowEs: "Un hematocrito bajo suele ir con hemoglobina baja (anemia).", high: "A high hematocrit can come from dehydration or other conditions.", highEs: "Un hematocrito alto puede venir de deshidratación u otras condiciones.", askLow: "Do my blood count results point to anemia?", askLowEs: "¿Mis resultados del hemograma indican anemia?" },
  wbc: { high: "A high white cell count often means the body is fighting an infection or inflammation. Stress and some medicines can raise it too.", highEs: "Un recuento alto de glóbulos blancos suele indicar que el cuerpo combate una infección o inflamación. El estrés y algunos medicamentos también lo suben.", low: "A low white cell count can make it harder to fight infections. It can come from viruses, medicines or other causes.", lowEs: "Un recuento bajo de glóbulos blancos puede dificultar combatir infecciones. Puede venir de virus, medicamentos u otras causas.", askHigh: "Could I have an infection, and should this be re-checked?", askHighEs: "¿Podría tener una infección y debo repetir el análisis?", askLow: "What could be lowering my white cells, and should this be re-checked?", askLowEs: "¿Qué podría estar bajando mis glóbulos blancos y debo repetirlo?" },
  platelets: { low: "Low platelets can make you bruise or bleed more easily.", lowEs: "Las plaquetas bajas pueden hacer que le salgan moretones o sangre con más facilidad.", high: "High platelets often follow infection, inflammation or low iron.", highEs: "Las plaquetas altas suelen aparecer tras una infección, inflamación o hierro bajo.", askLow: "Do I need to watch for bleeding, and should this be re-checked?", askLowEs: "¿Debo vigilar sangrados y repetir el análisis?", askHigh: "What could be raising my platelets?", askHighEs: "¿Qué podría estar subiendo mis plaquetas?" },
  tsh: { high: "A high TSH can mean the thyroid is underactive (working too slowly).", highEs: "Una TSH alta puede indicar que la tiroides trabaja muy despacio (hipotiroidismo).", low: "A low TSH can mean the thyroid is overactive (working too fast).", lowEs: "Una TSH baja puede indicar que la tiroides trabaja muy rápido (hipertiroidismo).", askHigh: "Is my thyroid underactive, and do I need more thyroid tests?", askHighEs: "¿Mi tiroides trabaja lento y necesito más análisis de tiroides?", askLow: "Is my thyroid overactive, and do I need more thyroid tests?", askLowEs: "¿Mi tiroides trabaja rápido y necesito más análisis de tiroides?" },
  ft4: { high: "A high free T4 can mean the thyroid is making too much hormone.", highEs: "Una T4 libre alta puede indicar que la tiroides produce demasiada hormona.", low: "A low free T4 can mean the thyroid is making too little hormone.", lowEs: "Una T4 libre baja puede indicar que la tiroides produce poca hormona.", askHigh: "What do my TSH and free T4 mean together?", askHighEs: "¿Qué significan juntas mi TSH y mi T4 libre?", askLow: "What do my TSH and free T4 mean together?", askLowEs: "¿Qué significan juntas mi TSH y mi T4 libre?" },
  ferritin: { low: "Low ferritin means your iron stores are low, a common cause of tiredness and anemia.", lowEs: "La ferritina baja indica que sus reservas de hierro están bajas, una causa común de cansancio y anemia.", high: "High ferritin can come from inflammation, liver problems or too much iron.", highEs: "La ferritina alta puede venir de inflamación, problemas del hígado o exceso de hierro.", askLow: "Why might my iron be low, and do I need iron?", askLowEs: "¿Por qué podría estar bajo mi hierro y necesito hierro?", askHigh: "What could be raising my ferritin?", askHighEs: "¿Qué podría estar subiendo mi ferritina?" },
  iron: { low: "Low iron can lead to anemia and tiredness.", lowEs: "El hierro bajo puede causar anemia y cansancio.", high: "High iron can come from supplements or conditions that store too much iron.", highEs: "El hierro alto puede venir de suplementos o de condiciones que acumulan demasiado hierro.", askLow: "Why might my iron be low?", askLowEs: "¿Por qué podría estar bajo mi hierro?" },
  b12: { low: "Low vitamin B12 can cause tiredness, numbness or memory problems.", lowEs: "La vitamina B12 baja puede causar cansancio, adormecimiento o problemas de memoria.", askLow: "Do I need vitamin B12, and how should I take it?", askLowEs: "¿Necesito vitamina B12 y cómo debo tomarla?" },
  uricacid: { high: "High uric acid can lead to gout (painful joints) or kidney stones in some people.", highEs: "El ácido úrico alto puede causar gota (articulaciones dolorosas) o cálculos renales en algunas personas.", askHigh: "Am I at risk of gout, and what can lower my uric acid?", askHighEs: "¿Tengo riesgo de gota y qué puede bajar mi ácido úrico?" },
  crp: { high: "A higher CRP means there is inflammation somewhere in the body, for example from an infection or injury.", highEs: "Una PCR más alta indica inflamación en alguna parte del cuerpo, por ejemplo por una infección o una lesión.", askHigh: "What could be causing inflammation, and should this be re-checked?", askHighEs: "¿Qué podría causar la inflamación y debo repetir el análisis?" },
  esr: { high: "A higher ESR is a general sign of inflammation; it rises with age and many conditions.", highEs: "Una VSG más alta es una señal general de inflamación; sube con la edad y con muchas condiciones.", askHigh: "What could be causing inflammation?", askHighEs: "¿Qué podría causar la inflamación?" },
  inr: { high: "A higher INR means the blood takes longer to clot. It is expected for people on some blood thinners.", highEs: "Un INR más alto significa que la sangre tarda más en coagular. Es esperado en personas que toman algunos anticoagulantes.", askHigh: "Is my INR where it should be for me?", askHighEs: "¿Mi INR está donde debería estar para mí?" },
  psa: { high: "A higher PSA can come from an enlarged prostate, inflammation or, less often, prostate cancer.", highEs: "Un PSA más alto puede venir de una próstata agrandada, inflamación o, con menos frecuencia, cáncer de próstata.", askHigh: "What could be raising my PSA, and what are the next steps?", askHighEs: "¿Qué podría estar subiendo mi PSA y cuáles son los siguientes pasos?" },
  troponin: { high: "Troponin rises when the heart muscle is stressed or damaged.", highEs: "La troponina sube cuando el músculo del corazón está bajo estrés o dañado.", askHigh: "Do I need to be seen today about my troponin?", askHighEs: "¿Necesito que me vean hoy por mi troponina?" },
};

// Spanish names for the emergency-care symptoms used in the emergency message.
const SYMPTOM_NAMES_ES: Record<string, string> = { "chest pain": "dolor de pecho", "trouble breathing": "dificultad para respirar", "shortness of breath": "falta de aire", "difficulty breathing": "dificultad para respirar", "stroke": "señales de derrame cerebral", "face droop": "la cara caída de un lado", "slurred speech": "dificultad para hablar", "arm weakness": "debilidad en un brazo", "weakness on one side": "debilidad en un lado del cuerpo", "sudden numbness": "adormecimiento repentino", "paralysis": "parálisis", "suicide": "pensamientos de suicidio", "overdose": "una sobredosis", "poison": "un envenenamiento", "severe bleeding": "sangrado fuerte", "loss of consciousness": "pérdida del conocimiento", "unconscious": "pérdida del conocimiento", "cannot wake": "dificultad para despertar", "seizure": "una convulsión", "anaphylaxis": "una reacción alérgica grave", "severe allergic reaction": "una reacción alérgica grave", "swelling of the face": "hinchazón de la cara", "swelling of the tongue": "hinchazón de la lengua", "blue lips": "labios azulados", "coughing blood": "tos con sangre", "coughing up blood": "tos con sangre", "blood in vomit": "vómito con sangre", "sudden severe headache": "un dolor de cabeza repentino y muy fuerte", "carbon monoxide": "exposición a monóxido de carbono", "severe burn": "una quemadura grave", "electric shock": "una descarga eléctrica", "near drowning": "casi ahogamiento", "head injury": "un golpe en la cabeza", "neck injury": "una lesión en el cuello", "spinal injury": "una lesión en la columna", "heat stroke": "un golpe de calor", "fever and confusion": "fiebre con confusión", "rash that does not fade": "un sarpullido que no se aclara al presionar", "confusion": "confusión", "severe testicular pain": "dolor testicular fuerte", "snake bite": "una mordedura de serpiente" };

// Groups used to say which results are worth discussing, in plain words.
const TEST_GROUPS: Record<string, { en: string; es: string; keys: string[] }> = {
  cholesterol: { en: "cholesterol", es: "colesterol", keys: ["ldl", "totalCholesterol", "triglycerides", "hdl", "nonhdl"] },
  sugar: { en: "blood sugar", es: "azúcar en la sangre", keys: ["a1c", "glucose", "urineglucose"] },
  vitd: { en: "vitamin D", es: "vitamina D", keys: ["vitaminD"] },
  kidney: { en: "kidney", es: "riñón", keys: ["creatinine", "egfr", "bun", "urineprotein"] },
  salts: { en: "blood salts and minerals", es: "sales y minerales de la sangre", keys: ["sodium", "potassium", "chloride", "co2", "calcium", "magnesium", "phosphorus"] },
  liver: { en: "liver", es: "hígado", keys: ["alt", "ast", "alp", "ggt", "bilirubin", "albumin", "protein", "globulin"] },
  blood: { en: "blood count", es: "hemograma", keys: ["wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "mch", "mchc", "rdw", "platelets", "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils"] },
  thyroid: { en: "thyroid", es: "tiroides", keys: ["tsh", "ft4", "ft3"] },
  iron: { en: "iron", es: "hierro", keys: ["ferritin", "iron", "tibc"] },
  b12: { en: "vitamin B12", es: "vitamina B12", keys: ["b12"] },
  folate: { en: "folate", es: "folato", keys: ["folate"] },
  uric: { en: "uric acid", es: "ácido úrico", keys: ["uricacid"] },
  inflammation: { en: "inflammation", es: "inflamación", keys: ["crp", "esr"] },
  clotting: { en: "blood clotting", es: "coagulación", keys: ["inr", "pt"] },
  heart: { en: "heart (troponin)", es: "corazón (troponina)", keys: ["troponin"] },
  urine: { en: "urine", es: "orina", keys: ["urineblood", "urineketones"] },
  prostate: { en: "PSA (prostate)", es: "PSA (próstata)", keys: ["psa"] },
  bp: { en: "blood pressure", es: "presión arterial", keys: ["bp"] },
};
const GROUP_OF: Record<string, string> = Object.fromEntries(Object.entries(TEST_GROUPS).flatMap(([group, { keys }]) => keys.map((key) => [key, group])));

// Units printed as powers of ten, explained in words. The original unit is still shown.
export function unitHint(unit: string, language: string = "en"): string {
  const u = String(unit || "").toLowerCase().replace(/\s/g, "");
  const es = language === "es";
  if (/(x10\^?e?3|10\^?3|thousand|k)\/[uµμ]l|10\^?9\/l/.test(u)) return es ? "miles de células por microlitro de sangre" : "thousands of cells per microliter of blood";
  if (/(x10\^?e?6|10\^?6|million|m)\/[uµμ]l|10\^?12\/l/.test(u)) return es ? "millones de células por microlitro de sangre" : "millions of cells per microliter of blood";
  if (/lakhs?\/cumm/.test(u)) return es ? "cientos de miles por microlitro de sangre" : "hundreds of thousands per microliter of blood";
  if (/\/cumm|cells\/[uµμ]l/.test(u)) return es ? "células por microlitro de sangre" : "cells per microliter of blood";
  return "";
}

export const VIEW_TEXT = {
  en: {
    summaryTitle: "Your lab report summary",
    allInLabs: "Your lab results are within the lab's ranges",
    dangerLabel: (label: string) => `${label} — a level labs often treat as urgent`,
    dangerMeaning: "Labs often treat a result at this level as urgent, even when it is not flagged. Contact your doctor today, or get emergency care if you feel very unwell.",
    checkDanger: (name: string) => `If the ${name} number is right, it is at a level labs often treat as urgent: confirm it against your report now. If it matches, or you cannot check, contact your doctor today, and get emergency care if you feel very unwell.`,
    emergencyHeadline: "Your report mentions symptoms that may need emergency care",
    emergencyBody: (terms: string) => `If you have ${terms} now, call 911 or your local emergency number. Do not wait for a doctor's appointment.`,
    emergencyNext: "If these symptoms are happening now, call 911 or your local emergency number.",
    stepEmergency: "Get emergency help if this is happening now",
    guideMeaning: "Your report didn't print a range for this test, so it was compared with a common general guide. Your lab's own range may differ.",
    guideSentence: (names: string) => `${names} had no range on your report and ${names.includes(" and ") ? "are" : "is"} outside a common guide; ask your doctor what range applies to you.`,
    count: (o: number, t: number, c = 0) => `${o} of your ${t} lab results ${o === 1 ? "is" : "are"} outside the lab's ranges${c ? `, not counting ${c === 1 ? "1 number" : `${c} numbers`} still to confirm` : ""}.`,
    discussLabs: (groups: string) => `Your ${groups} results deserve a conversation with your doctor.`,
    othersLabs: "The other lab results are within the lab's ranges.",
    bpMention: (value: string | number, home: boolean) => `Your report also mentions ${home ? "home blood pressure readings" : "a blood pressure reading"} around ${value}, which ${home ? "are" : "is"} worth discussing.`,
    bpMentionOk: (value: string | number, home: boolean) => `Your report also mentions ${home ? "home blood pressure readings" : "a blood pressure reading"} around ${value}.`,
    otherTitle: "Other health information found in your report",
    bpTitle: (home: boolean) => home ? "Blood pressure (home readings in your report)" : "Blood pressure (mentioned in your report)",
    bpNotLab: "Not a lab test result.",
    bpCategory: { normal: "Normal range", elevated: "Elevated range", stage1: "Stage 1 high blood pressure range", stage2: "Stage 2 high blood pressure range", severe: "Very high — get medical care now" },
    bpMeaningCat: (category: string) => `Readings like this fall in the American Heart Association's "${category}" category when they are repeated and measured correctly. One reading is not a diagnosis; your doctor looks at several readings over time.`,
    bpAskLog: "Should I keep a log of my blood pressure, and how do I measure it correctly at home?",
    fasting: { yes: "Taken while fasting", no: "Not a fasting test", unknown: "Your report doesn't say if this was a fasting test" },
    glucoseMeaning: { yes: "This was a fasting test, so a result above the lab's range can be an early sign of high blood sugar. A doctor confirms it with repeat tests or an A1C.", no: "This was not a fasting test, and blood sugar rises after eating, so a result above a fasting range may not mean much on its own.", unknown: "Blood sugar depends on whether you had eaten. Your report doesn't say if this was a fasting test, so this result alone doesn't show prediabetes." },
    glucoseAsk: { withA1c: "Was this a fasting test, and how does my glucose fit with my A1C?", noA1cUnknown: "Was this a fasting test, and do I need an A1C test?", noA1c: "Do I need an A1C test to look at this further?", withA1cKnown: "How do my glucose and A1C fit together?" },
    totalAskAlone: "What does my total cholesterol mean for my heart, and do I need a full cholesterol test?",
    thyroidTogether: "What do my TSH and free T4 mean together?",
    ft4Alone: "What could explain my free T4 result, and do I need other thyroid tests?",
    moreGroups: { kidney: "Kidney and potassium", cholesterol: "Cholesterol", sugar: "Blood sugar", bp: "Blood pressure", vitd: "Vitamin D", habits: "Everyday habits" },
    reminderLabel: "Did your doctor give a date for your next test? Add it to your calendar (optional).",
    reminderNeedDate: "Enter the date your doctor gave you first.",
    allIn: "Your results are within the lab's ranges",
    allInBody: (n: number) => `All ${n} results are inside the ranges printed on your report. Bring the report to your next regular visit.`,
    few: "A few results need attention",
    several: "Several results need attention",
    prompt: "Some results need prompt attention",
    promptBody: (names: string) => `Contact your doctor today about ${names}. If you feel very unwell, get emergency care.`,
    discuss: (groups: string) => `Your ${groups} results are worth discussing with your doctor.`,
    others: "The other results are within the lab's ranges.",
    goal: (names: string) => `${names} ${names.includes(" and ") ? "are" : "is"} within the lab's range but above a common health goal.`,
    noRange: (n: number) => `${n === 1 ? "One result has" : `${n} results have`} no range printed; ask your doctor what ${n === 1 ? "it means" : "they mean"}.`,
    noneCompared: (n: number) => `We read ${n} result${n === 1 ? "" : "s"}, but your report printed no ranges to compare with. Ask your doctor what they mean for you.`,
    and: "and",
    attentionTitle: "Results to talk about",
    whatIs: "What is it?", whatMeans: "What does this mean?", askDoctor: "Ask your doctor", yourResult: "Your result",
    labRange: "Lab's range", noRangePrinted: "Not printed on your report", generalGuide: "Common guide (no range on your report)",
    labels: { guideHigh: "High compared with a common guide", guideLow: "Low compared with a common guide", lowLab: "Low — below this lab's range", farHigh: "Far above the lab's range", farLow: "Far below the lab's range", check: "Check this number", high: "High", low: "Low", in: "In range", none: "No range printed", critical: "Critical", abnormal: "Flagged by the lab", goalAbove: "In range, above a common goal", goalBelow: "In range, below a common goal", pre: "High — prediabetes range", diabetes: "High — diabetes range" },
    photoNote: "These numbers were read from a photo, which can misread a decimal point. Check each one against your report before relying on this summary.",
    checkMeaning: "This number may have been misread from the photo, for example a missing decimal point. Compare it with your report and confirm it in the box above the result.",
    checkFirst: (n: number) => `${n === 1 ? "One number" : `${n} numbers`} from your photo may be misread. Please confirm ${n === 1 ? "it" : "them"} against the report first.`,
    goalMeaning: "It is inside your lab's range, but many guidelines suggest a different goal for some people, depending on your other health risks. Your lab's range is not the same as your personal goal.",
    criticalMeaning: "Your lab marked this result as critical. Call your doctor today, or get urgent care if you feel unwell.",
    abnormalMeaning: "Your lab flagged this result as outside its usual values.",
    genericHigh: "A result above the lab's range can have many causes. Your doctor can tell you if it matters for you.",
    genericLow: "A result below the lab's range can have many causes. Your doctor can tell you if it matters for you.",
    genericAsk: (name: string) => `What could explain my ${name} result, and do I need any follow-up?`,
    goalAsk: (name: string) => `Is my ${name} where it should be for me, given my other health risks?`,
    bpName: "Blood pressure", bpWhat: "The force of blood against the walls of your arteries.", bpRangeLabel: "Usual goal", bpRange: "below 120/80", bpMeaning: "Higher blood pressure over time can strain the heart and blood vessels. One reading is not a diagnosis.", bpAsk: "Should I check my blood pressure at home, and what should my goal be?",
    stepsTitle: "Your next 3 steps", stepsNote: "General ideas based on your results, not a prescription. Check with your doctor first.",
    stepDoctor: "Talk to your doctor", stepDoctorBody: (groups: string) => `Ask about your ${groups} results.`,
    stepDoctorToday: "Contact your doctor today", stepDoctorTodayBody: (names: string) => `Your report has a result that needs prompt attention: ${names}.`,
    stepCheckup: "Keep your regular check-ups", stepCheckupBody: "Bring this report to your next visit.",
    stepWalk: "Take a daily walk", stepWalkBody: "Try a 15–20 minute walk if it is safe for you.",
    stepHold: "Hold off on new exercise", stepHoldBody: "Wait until your doctor has looked at these results.",
    stepFood: "Make one food change",
    food: { kidney: "Before changing what you eat, ask your doctor which fruits, vegetables and beans are right for you, because your potassium or kidney result is outside the range.", drinks: "Try replacing sugary drinks with water.", oil: "Try cooking with olive oil instead of butter.", salt: "Try cutting back on salty foods like chips, canned soups and processed meat.", vitd: "Try adding a food with vitamin D, like eggs, fatty fish or fortified milk.", veg: "Try adding vegetables to one meal each day." },
    moreIdeas: "More ideas", showLess: "Show less",
    repeatTest: "Ask your doctor whether you need a repeat blood test.",
    allTestsNote: "Compared with the range printed by your lab. Ranges differ by lab, age and sex.",
  },
  es: {
    summaryTitle: "Resumen de su análisis",
    allInLabs: "Sus resultados de laboratorio están dentro de los rangos del laboratorio",
    dangerLabel: (label: string) => `${label} — un nivel que los laboratorios suelen tratar como urgente`,
    dangerMeaning: "Los laboratorios suelen tratar un resultado a este nivel como urgente, aunque no esté marcado. Comuníquese hoy con su médico o busque atención de emergencia si se siente muy mal.",
    checkDanger: (name: string) => `Si el número de ${name} es correcto, está a un nivel que los laboratorios suelen tratar como urgente: compárelo ahora con su informe. Si coincide, o no puede comprobarlo, comuníquese hoy con su médico y busque atención de emergencia si se siente muy mal.`,
    emergencyHeadline: "Su informe menciona síntomas que podrían necesitar atención de emergencia",
    emergencyBody: (terms: string) => `Si tiene ${terms} ahora, llame al 911 o al número de emergencias local. No espere a una cita médica.`,
    emergencyNext: "Si estos síntomas están ocurriendo ahora, llame al 911 o al número de emergencias local.",
    stepEmergency: "Busque ayuda de emergencia si esto ocurre ahora",
    guideMeaning: "Su informe no trae un rango para esta prueba, así que se comparó con una guía general común. El rango de su laboratorio puede ser distinto.",
    guideSentence: (names: string) => `${names} no ${names.includes(" y ") ? "tienen" : "tiene"} rango en su informe y ${names.includes(" y ") ? "están" : "está"} fuera de una guía común; pregunte a su médico qué rango le corresponde.`,
    count: (o: number, t: number, c = 0) => `${o} de sus ${t} resultados de laboratorio ${o === 1 ? "está" : "están"} fuera de los rangos del laboratorio${c ? `, sin contar ${c === 1 ? "1 número" : `${c} números`} por confirmar` : ""}.`,
    discussLabs: (groups: string) => `Conviene hablar con su médico sobre sus resultados de ${groups}.`,
    othersLabs: "Los demás resultados de laboratorio están dentro de los rangos del laboratorio.",
    bpMention: (value: string | number, home: boolean) => `Su informe también menciona ${home ? "mediciones de presión arterial en casa" : "una presión arterial"} de alrededor de ${value}, que conviene comentar.`,
    bpMentionOk: (value: string | number, home: boolean) => `Su informe también menciona ${home ? "mediciones de presión arterial en casa" : "una presión arterial"} de alrededor de ${value}.`,
    otherTitle: "Otra información de salud en su informe",
    bpTitle: (home: boolean) => home ? "Presión arterial (mediciones en casa de su informe)" : "Presión arterial (mencionada en su informe)",
    bpNotLab: "No es un resultado de laboratorio.",
    bpCategory: { normal: "Rango normal", elevated: "Rango elevado", stage1: "Rango de presión alta en etapa 1", stage2: "Rango de presión alta en etapa 2", severe: "Muy alta: busque atención médica ahora" },
    bpMeaningCat: (category: string) => `Mediciones así están en la categoría "${category}" de la Asociación Americana del Corazón cuando se repiten y se toman correctamente. Una sola medición no es un diagnóstico; su médico mira varias mediciones con el tiempo.`,
    bpAskLog: "¿Debo llevar un registro de mi presión arterial y cómo la mido correctamente en casa?",
    fasting: { yes: "Tomada en ayunas", no: "No fue en ayunas", unknown: "Su informe no dice si fue en ayunas" },
    glucoseMeaning: { yes: "Fue un análisis en ayunas, así que un resultado por encima del rango puede ser una señal temprana de azúcar alto. El médico lo confirma repitiendo el análisis o con un A1C.", no: "No fue en ayunas, y el azúcar sube después de comer, así que un resultado por encima de un rango en ayunas puede no significar mucho por sí solo.", unknown: "El azúcar depende de si había comido. Su informe no dice si fue en ayunas, así que este resultado por sí solo no indica prediabetes." },
    glucoseAsk: { withA1c: "¿Fue un análisis en ayunas y cómo encaja mi glucosa con mi A1C?", noA1cUnknown: "¿Fue un análisis en ayunas y necesito un A1C?", noA1c: "¿Necesito un A1C para revisar esto mejor?", withA1cKnown: "¿Cómo encajan mi glucosa y mi A1C?" },
    totalAskAlone: "¿Qué significa mi colesterol total para mi corazón y necesito un análisis completo de colesterol?",
    thyroidTogether: "¿Qué significan juntas mi TSH y mi T4 libre?",
    ft4Alone: "¿Qué podría explicar mi resultado de T4 libre y necesito otros análisis de tiroides?",
    moreGroups: { kidney: "Riñón y potasio", cholesterol: "Colesterol", sugar: "Azúcar en la sangre", bp: "Presión arterial", vitd: "Vitamina D", habits: "Hábitos diarios" },
    reminderLabel: "¿Su médico le dio una fecha para el próximo análisis? Añádala a su calendario (opcional).",
    reminderNeedDate: "Primero escriba la fecha que le dio su médico.",
    allIn: "Sus resultados están dentro de los rangos del laboratorio",
    allInBody: (n: number) => `Los ${n} resultados están dentro de los rangos impresos en su informe. Lleve el informe a su próxima consulta de rutina.`,
    few: "Algunos resultados necesitan atención",
    several: "Varios resultados necesitan atención",
    prompt: "Algunos resultados necesitan atención pronto",
    promptBody: (names: string) => `Comuníquese hoy con su médico sobre ${names}. Si se siente muy mal, busque atención de emergencia.`,
    discuss: (groups: string) => `Conviene hablar con su médico sobre sus resultados de ${groups}.`,
    others: "Los demás resultados están dentro de los rangos del laboratorio.",
    goal: (names: string) => `${names} ${names.includes(" y ") ? "están" : "está"} dentro del rango del laboratorio, pero por encima de una meta de salud común.`,
    noRange: (n: number) => `${n === 1 ? "Un resultado no tiene" : `${n} resultados no tienen`} rango impreso; pregunte a su médico qué ${n === 1 ? "significa" : "significan"}.`,
    noneCompared: (n: number) => `Leímos ${n} resultado${n === 1 ? "" : "s"}, pero su informe no trae rangos para comparar. Pregunte a su médico qué significan para usted.`,
    and: "y",
    attentionTitle: "Resultados para hablar con su médico",
    whatIs: "¿Qué es?", whatMeans: "¿Qué significa?", askDoctor: "Pregunte a su médico", yourResult: "Su resultado",
    labRange: "Rango del laboratorio", noRangePrinted: "No aparece en su informe", generalGuide: "Guía común (su informe no trae rango)",
    labels: { guideHigh: "Alto según una guía común", guideLow: "Bajo según una guía común", lowLab: "Bajo — por debajo del rango de este laboratorio", farHigh: "Muy por encima del rango del laboratorio", farLow: "Muy por debajo del rango del laboratorio", check: "Revise este número", high: "Alto", low: "Bajo", in: "En rango", none: "Sin rango impreso", critical: "Crítico", abnormal: "Marcado por el laboratorio", goalAbove: "En rango, por encima de una meta común", goalBelow: "En rango, por debajo de una meta común", pre: "Alto — rango de prediabetes", diabetes: "Alto — rango de diabetes" },
    photoNote: "Estos números se leyeron de una foto, que puede confundir el punto decimal. Compare cada uno con su informe antes de confiar en este resumen.",
    checkMeaning: "Es posible que este número se haya leído mal en la foto, por ejemplo sin el punto decimal. Compárelo con su informe y confírmelo en el recuadro de arriba.",
    checkFirst: (n: number) => `${n === 1 ? "Un número" : `${n} números`} de su foto ${n === 1 ? "podría estar mal leído" : "podrían estar mal leídos"}. Confírme${n === 1 ? "lo" : "los"} primero con el informe.`,
    goalMeaning: "Está dentro del rango de su laboratorio, pero muchas guías sugieren otra meta para algunas personas, según sus otros riesgos de salud. El rango del laboratorio no es lo mismo que su meta personal.",
    criticalMeaning: "Su laboratorio marcó este resultado como crítico. Llame hoy a su médico o busque atención urgente si se siente mal.",
    abnormalMeaning: "Su laboratorio marcó este resultado como fuera de sus valores habituales.",
    genericHigh: "Un resultado por encima del rango puede tener muchas causas. Su médico puede decirle si es importante para usted.",
    genericLow: "Un resultado por debajo del rango puede tener muchas causas. Su médico puede decirle si es importante para usted.",
    genericAsk: (name: string) => `¿Qué podría explicar mi resultado de ${name} y necesito algún seguimiento?`,
    goalAsk: (name: string) => `¿Mi ${name} está donde debería estar para mí, según mis otros riesgos de salud?`,
    bpName: "Presión arterial", bpWhat: "La fuerza de la sangre contra las paredes de las arterias.", bpRangeLabel: "Meta habitual", bpRange: "menos de 120/80", bpMeaning: "Una presión más alta con el tiempo puede forzar el corazón y los vasos sanguíneos. Una sola medición no es un diagnóstico.", bpAsk: "¿Debo medirme la presión en casa y cuál debería ser mi meta?",
    stepsTitle: "Sus próximos 3 pasos", stepsNote: "Ideas generales según sus resultados, no una receta. Consulte primero con su médico.",
    stepDoctor: "Hable con su médico", stepDoctorBody: (groups: string) => `Pregunte por sus resultados de ${groups}.`,
    stepDoctorToday: "Comuníquese hoy con su médico", stepDoctorTodayBody: (names: string) => `Su informe tiene un resultado que necesita atención pronto: ${names}.`,
    stepCheckup: "Siga con sus chequeos de rutina", stepCheckupBody: "Lleve este informe a su próxima consulta.",
    stepWalk: "Camine todos los días", stepWalkBody: "Intente caminar de 15 a 20 minutos si es seguro para usted.",
    stepHold: "Espere antes de empezar ejercicio nuevo", stepHoldBody: "Espere a que su médico revise estos resultados.",
    stepFood: "Haga un cambio en su comida",
    food: { kidney: "Antes de cambiar lo que come, pregunte a su médico qué frutas, verduras y frijoles le convienen, porque su resultado de potasio o de riñón está fuera del rango.", drinks: "Cambie las bebidas azucaradas por agua.", oil: "Cocine con aceite de oliva en lugar de mantequilla.", salt: "Coma menos alimentos salados, como papitas, sopas enlatadas y carnes procesadas.", vitd: "Agregue un alimento con vitamina D, como huevos, pescado graso o leche fortificada.", veg: "Agregue verduras a una comida cada día." },
    moreIdeas: "Más ideas", showLess: "Mostrar menos",
    repeatTest: "Pregunte a su médico si necesita repetir el análisis de sangre.",
    allTestsNote: "Comparado con el rango impreso por su laboratorio. Los rangos cambian según el laboratorio, la edad y el sexo.",
  },
};

function listWords(items: string[], language: "en" | "es"): string {
  const and = VIEW_TEXT[language].and;
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

// The one place that decides how each test row is named, labelled and explained.
// The summary, cards, "All tests" and doctor share all read from this.
export function describeTestRow(row: TestRow, language: "en" | "es", a1cPercent: number | null) {
  const es = language === "es";
  const t = VIEW_TEXT[es ? "es" : "en"];
  const guide: Record<string, string> = TEST_GUIDE[row.key] || {};
  const info = labTestInfo(row.key);
  const name = (es ? guide.nameEs : guide.name) || (info ? (es ? info.es : info.name) : row.name);
  const what = (es ? guide.whatEs : guide.what) || (info ? (es ? info.whatEs : info.what) : "");
  const dir = row.status === "above" || row.status === "target_above" ? "high" : row.status === "below" || row.status === "target_below" ? "low" : "";
  let label = row.status === "above" ? t.labels.high : row.status === "below" ? t.labels.low : row.status === "within" ? t.labels.in : row.status === "critical" ? t.labels.critical : row.status === "outside" ? t.labels.abnormal : row.status === "target_above" ? t.labels.goalAbove : row.status === "target_below" ? t.labels.goalBelow : t.labels.none;
  if (row.key === "a1c" && row.status === "above" && a1cPercent !== null) label = a1cPercent >= 6.5 ? t.labels.diabetes : a1cPercent >= 5.7 ? t.labels.pre : label;
  if (row.status === "check") label = t.labels.check;
  if (row.key === "vitaminD" && row.status === "below") label = t.labels.lowLab;
  // Well beyond the lab's printed range (rule 3): say so, without claiming urgency.
  const a1cBand = row.key === "a1c" && a1cPercent !== null && a1cPercent >= 5.7;
  if (row.far && !row.danger && !row.generalRange && !a1cBand && (row.status === "above" || row.status === "below")) label = row.status === "above" ? t.labels.farHigh : t.labels.farLow;
  // No range printed: compared with a common guide, which is not the lab's own range.
  const byGuide = Boolean((row as TestRow & { generalRange?: boolean }).generalRange) && (row.status === "above" || row.status === "below");
  if (byGuide) label = row.status === "above" ? t.labels.guideHigh : t.labels.guideLow;
  const goal = row.status === "target_above" || row.status === "target_below";
  const meaning = row.status === "check" ? t.checkMeaning : row.status === "critical" ? t.criticalMeaning : row.status === "outside" ? t.abnormalMeaning : goal ? t.goalMeaning
    : dir === "high" ? (es ? guide.highEs : guide.high) || t.genericHigh : dir === "low" ? (es ? guide.lowEs : guide.low) || t.genericLow : "";
  const plainName = name.replace(/\s*\(.*\)$/, "");
  const ask = row.status === "check" ? "" : goal ? t.goalAsk(plainName) : dir === "high" || row.status === "critical" ? (es ? guide.askHighEs : guide.askHigh) || t.genericAsk(plainName)
    : dir === "low" ? (es ? guide.askLowEs : guide.askLow) || t.genericAsk(plainName) : row.status === "outside" ? t.genericAsk(plainName) : "";
  // A value at a level labs often phone through as critical, whether or not the lab flagged it.
  const danger = Boolean(row.danger) && row.status !== "check";
  if (danger) label = t.dangerLabel(label);
  const shownMeaning = danger ? t.dangerMeaning : byGuide && meaning ? `${t.guideMeaning} ${meaning}` : meaning;
  const value = (row.rule ? String(row.valueText) : `${row.valueText} ${row.unit || ""}`.trim()).replace("(about ", es ? "(unos " : "(about ");
  return {
    key: row.key, name, plainName, what, label, meaning: shownMeaning, ask, value, note: "", guide: Boolean((row as TestRow & { generalRange?: boolean }).generalRange),
    unit: row.rule ? "" : row.unit || "", unitHint: unitHint(row.rule ? "" : row.unit, language),
    range: row.rangeText || "", rangeLabel: (row as TestRow & { generalRange?: boolean }).generalRange ? t.generalGuide : t.labRange,
    status: row.status, attention: row.status !== "within" && row.status !== "unknown",
    tone: row.status === "check" ? "check" : row.status === "critical" || danger ? "critical" : byGuide ? "guide" : goal ? "goal" : row.status === "within" ? "in" : row.status === "unknown" ? "none" : "out",
  };
}

// Everything the result screen shows, built from the analysis rows only.
// American Heart Association blood pressure categories, for a reading found in the report text.
function bloodPressureCategory(systolic: number, diastolic: number): "normal" | "elevated" | "stage1" | "stage2" | "severe" {
  if (systolic > 180 || diastolic > 120) return "severe";
  if (systolic >= 140 || diastolic >= 90) return "stage2";
  if (systolic >= 130 || diastolic >= 80) return "stage1";
  if (systolic >= 120) return "elevated";
  return "normal";
}

// Plan tips shown under "More ideas", grouped and limited so the list stays short.
const MORE_IDEA_GROUPS: [string, string[]][] = [
  ["kidney", ["kidneyPotassium"]],
  ["cholesterol", ["heartFat", "heartFiber", "trigSugar", "trigAlcohol"]],
  ["sugar", ["a1cPlate", "a1cDrinks", "a1cWeight", "moveMeals"]],
  ["bp", ["bpSalt", "bpDash", "trackBp"]],
  ["vitd", ["vitdFood", "safetyVitd"]],
];
const FOOD_STEP_TIP: Record<string, string> = { drinks: "a1cDrinks", oil: "heartFat", salt: "bpSalt", vitd: "vitdFood", kidney: "kidneyPotassium" };

// Everything the result screen shows, built from the analysis rows only.
export function buildReportView(analysis: ReportAnalysis, language: string = "en", plan: PersonalPlan | null = null, unsure: string[] = [], fromPhoto = false) {
  const es = language === "es";
  const lang = es ? "es" : "en";
  const t = VIEW_TEXT[lang];
  const rows = allTestRows(analysis);
  const present = new Set(rows.map((row) => row.key));
  const a1cValue = (analysis.labValues || []).find((item) => item.label === "A1C");
  const a1cPercent = a1cValue ? Number(a1cValue.value) : null;
  // A number read from a photo that may be misread is shown as "check this number" until confirmed.
  const tests = rows.map((row) => describeTestRow(unsure.includes(row.key) ? { ...row, status: "check" } : row, lang, Number.isFinite(a1cPercent) ? a1cPercent : null));
  // Questions and meanings that depend on what else is on the report.
  const fasting = analysis.glucoseFasting === true ? "yes" : analysis.glucoseFasting === false ? "no" : "unknown";
  tests.forEach((item) => {
    if (item.key === "glucose") {
      item.note = t.fasting[fasting];
      if (item.status === "above" || item.status === "target_above") {
        item.meaning = t.glucoseMeaning[fasting];
        item.ask = present.has("a1c") ? (fasting === "unknown" ? t.glucoseAsk.withA1c : t.glucoseAsk.withA1cKnown) : fasting === "unknown" ? t.glucoseAsk.noA1cUnknown : t.glucoseAsk.noA1c;
      }
    }
    if (item.key === "totalCholesterol" && item.ask && !present.has("ldl") && !present.has("hdl")) item.ask = t.totalAskAlone;
    if (item.key === "tsh" && item.ask && present.has("ft4")) item.ask = t.thyroidTogether;
    if (item.key === "ft4" && item.ask) item.ask = present.has("tsh") ? t.thyroidTogether : t.ft4Alone;
  });
  const order: Record<string, number> = { check: 0, critical: 1, out: 2, guide: 3, goal: 4 };
  const cards = tests.filter((item) => item.attention && item.tone !== "none").sort((a, b) => order[a.tone] - order[b.tone]);

  // Blood pressure is not a lab result: it goes in its own section, labelled by its source.
  const bpValue = (analysis.labValues || []).find((item) => item.label === "Blood pressure");
  const [sys, dia] = String(bpValue?.value || "").split("/").map(Number);
  const bpKnown = Number.isFinite(sys) && Number.isFinite(dia);
  const bpCategory = bpKnown ? bloodPressureCategory(sys, dia) : "normal";
  const bpHigh = bpKnown && (bpCategory === "stage1" || bpCategory === "stage2" || bpCategory === "severe");
  const home = Boolean(analysis.bpAtHome);
  const other = bpKnown ? [{
    key: "bp", name: t.bpTitle(home), value: `${bpValue?.value} mmHg`, label: t.bpCategory[bpCategory], note: t.bpNotLab,
    what: t.bpWhat, meaning: bpCategory === "normal" ? "" : t.bpMeaningCat(t.bpCategory[bpCategory]), ask: bpHigh ? t.bpAskLog : "",
    tone: bpCategory === "severe" ? "critical" : bpHigh ? "out" : "in",
  }] : [];

  // Only results judged against the lab's own printed range count as "outside the lab's ranges".
  const outside = tests.filter((item) => (item.tone === "out" || item.tone === "critical") && !item.guide).length;
  const noRange = tests.filter((item) => item.tone === "none").length;
  const goals = tests.filter((item) => item.tone === "goal");
  const guided = tests.filter((item) => item.tone === "guide");
  const critical = tests.filter((item) => item.tone === "critical");
  const urgent = analysis.riskLevel === "urgent" || critical.length > 0 || (analysis.emergencySymptoms || []).length > 0;
  const groupNames = [...new Set(cards.filter((item) => item.tone !== "goal" && item.tone !== "check").map((item) => GROUP_OF[item.key] || item.key))]
    .map((group) => TEST_GROUPS[group]?.[lang] || cards.find((item) => item.key === group)?.plainName || group);
  const groupText = listWords(groupNames, lang);
  const criticalNames = listWords(critical.map((item) => item.plainName), lang);
  const goalNames = listWords(goals.map((item) => item.plainName), lang);
  const bpSentence = bpKnown ? (bpHigh ? t.bpMention(String(bpValue?.value), home) : "") : "";

  // Numbers waiting to be confirmed are never counted as in range or outside it.
  const toCheck = tests.filter((item) => item.tone === "check").length;
  let headline = ""; const body: string[] = [];
  if (!tests.length) {
    headline = urgent ? t.prompt : bpHigh ? t.few : "";
    if (bpSentence) body.push(bpSentence);
  } else if (!outside && !goals.length && noRange + guided.length === tests.length && !guided.length) {
    headline = urgent ? t.prompt : t.few;
    body.push(t.noneCompared(tests.length));
    if (bpSentence) body.push(bpSentence);
  } else if (!urgent && !outside && !goals.length && !guided.length && !toCheck) {
    headline = t.allInLabs;
    body.push(t.allInBody(tests.length - noRange));
    if (bpSentence) body.push(bpSentence);
  } else {
    headline = urgent ? t.prompt : outside > tests.length / 2 ? t.several : t.few;
    if (critical.length) body.push(t.promptBody(criticalNames));
    body.push(t.count(outside, tests.length, toCheck));
    if (groupNames.length) body.push(t.discussLabs(groupText));
    if (goals.length) body.push(t.goal(goalNames));
    if (guided.length) body.push(t.guideSentence(listWords(guided.map((item) => item.plainName), lang)));
    if (bpSentence) body.push(bpSentence);
    if (outside + noRange + goals.length + guided.length + toCheck < tests.length) body.push(t.othersLabs);
  }
  if (noRange && noRange < tests.length) body.push(t.noRange(noRange));
  if (toCheck) body.unshift(t.checkFirst(toCheck));
  rows.filter((row) => row.danger && unsure.includes(row.key)).forEach((row) => {
    const item = tests.find((test) => test.key === row.key);
    body.unshift(t.checkDanger(item ? item.plainName : row.name));
  });
  if (fromPhoto && tests.length) body.push(t.photoNote);
  // Current emergency symptoms in the report text come first and point to emergency care.
  const symptoms = analysis.emergencySymptoms || [];
  const emergency = symptoms.length > 0;
  if (emergency) {
    headline = t.emergencyHeadline;
    body.unshift(t.emergencyBody(listWords(symptoms.map((term) => (es ? SYMPTOM_NAMES_ES[term] || term : term)), lang)));
  }

  // Three steps first; a short, grouped list of other ideas under "More ideas".
  const kidney = (analysis.panelResults || []).some((item) => (item.key === "potassium" && (item.status === "above" || item.status === "critical")) || (item.key === "creatinine" && (item.status === "above" || item.status === "critical")) || (item.key === "egfr" && (item.status === "below" || item.status === "critical")));
  const has = (key: string, statuses: string[]) => tests.some((item) => item.key === key && statuses.includes(item.status));
  const foodKey = kidney ? "kidney"
    : has("triglycerides", ["above", "target_above"]) || has("a1c", ["above", "target_above"]) || has("glucose", ["above"]) ? "drinks"
    : has("ldl", ["above", "target_above"]) || has("totalCholesterol", ["above", "target_above"]) ? "oil"
    : bpHigh ? "salt"
    : has("vitaminD", ["below", "target_below"]) ? "vitd" : "veg";
  const discussText = [...(groupNames.length ? groupNames : goals.map((item) => item.plainName)), ...(bpHigh ? [TEST_GROUPS.bp[lang]] : [])];
  const steps = [
    emergency ? { title: t.stepEmergency, body: t.emergencyNext } : urgent ? { title: t.stepDoctorToday, body: t.stepDoctorTodayBody(criticalNames || groupText || TEST_GROUPS.bp[lang]) }
      : discussText.length ? { title: t.stepDoctor, body: t.stepDoctorBody(listWords(discussText, lang)) }
      : { title: t.stepCheckup, body: t.stepCheckupBody },
    urgent ? { title: t.stepHold, body: t.stepHoldBody } : { title: t.stepWalk, body: t.stepWalkBody },
    { title: t.stepFood, body: t.food[foodKey] },
  ];
  const planText = (PLAN_TEXT[lang] || PLAN_TEXT.en) as unknown as Record<string, string>;
  const inPlan = new Set(plan ? plan.sections.flatMap((section) => section.items.map((item) => item.text)) : []);
  const more: { title: string; items: string[] }[] = [];
  let count = 0;
  MORE_IDEA_GROUPS.forEach(([group, keys]) => {
    const items = keys.filter((key) => key !== FOOD_STEP_TIP[foodKey] && inPlan.has(planText[key])).map((key) => planText[key]).slice(0, 2);
    const room = Math.max(0, 6 - count);
    if (items.length && room) { more.push({ title: (t.moreGroups as Record<string, string>)[group], items: items.slice(0, room) }); count += Math.min(items.length, room); }
  });
  if (plan) more.push({ title: t.moreGroups.habits, items: [planText.safetyAsk, cards.length ? t.repeatTest : planText.move150].filter((text) => text && (text === t.repeatTest || inPlan.has(text))) });

  const questions = [...new Set([...cards, ...other].map((item) => item.ask).filter(Boolean))];
  return {
    title: t.summaryTitle, headline, body, urgent,
    count: tests.length ? t.count(outside, tests.length) : "",
    outside, total: tests.length, cards, other, tests, steps, more: more.filter((group) => group.items.length), questions, text: t,
    rulesVersion: EXPLANATION_RULES_VERSION,
    emergency, urgentReasons: analysis.urgentReasons || [],
  };
}
