// Plain-language report view: summary, result cards, next 3 steps and "All tests".
// Generated from carewise-frontend/script.js (TEST_GUIDE through buildReportView);
// keep the two identical so the website and the app give the same explanation.
import { labTestInfo } from "./labPanel";
import { allTestRows, type ReportAnalysis, type TestRow } from "./reportAnalysis";
import type { PersonalPlan } from "./personalPlan";

// Plain-language guide per test: what it is, what a high or low result can mean, and a
// question for the doctor. Educational wording only: no diagnosis, medicine names or doses.
// Tests not listed here use the LAB_TESTS name and description and the general wording.
const TEST_GUIDE: Record<string, Record<string, string>> = {
  ldl: { name: "LDL (bad cholesterol)", nameEs: "LDL (colesterol malo)", what: "A type of cholesterol that can build up in your blood vessels.", whatEs: "Un tipo de colesterol que se puede acumular en los vasos sanguíneos.", high: "Higher LDL can raise your risk of heart problems over time.", highEs: "Un LDL más alto puede aumentar con el tiempo el riesgo de problemas del corazón.", askHigh: "What should my LDL goal be, and what can I do to lower it?", askHighEs: "¿Cuál debería ser mi meta de LDL y qué puedo hacer para bajarlo?" },
  totalCholesterol: { name: "Total cholesterol", nameEs: "Colesterol total", what: "The overall amount of cholesterol in your blood.", whatEs: "La cantidad total de colesterol en la sangre.", high: "High total cholesterol can raise heart risk, depending on how much is LDL and how much is HDL.", highEs: "Un colesterol total alto puede aumentar el riesgo del corazón, según cuánto sea LDL y cuánto HDL.", askHigh: "How do my LDL and HDL change what my total cholesterol means?", askHighEs: "¿Cómo cambian mi LDL y mi HDL lo que significa mi colesterol total?" },
  triglycerides: { name: "Triglycerides (blood fats)", nameEs: "Triglicéridos (grasas en la sangre)", what: "A type of fat in your blood that comes from food and extra calories.", whatEs: "Un tipo de grasa en la sangre que viene de la comida y de las calorías de más.", high: "High triglycerides can add to heart risk. Sugary food, alcohol and not fasting before the test can raise them.", highEs: "Los triglicéridos altos pueden sumar riesgo para el corazón. El azúcar, el alcohol y no estar en ayunas antes del análisis pueden subirlos.", askHigh: "Was I supposed to fast for this test, and what would help bring my triglycerides down?", askHighEs: "¿Debía estar en ayunas para este análisis y qué me ayudaría a bajar los triglicéridos?" },
  a1c: { name: "A1C (average blood sugar)", nameEs: "A1C (azúcar promedio)", what: "Shows your average blood sugar over the past two to three months.", whatEs: "Muestra su nivel promedio de azúcar en la sangre de los últimos dos o tres meses.", high: "A higher A1C means your blood sugar has been running high. 5.7% to 6.4% is called the prediabetes range; 6.5% or higher is the diabetes range, which a doctor confirms with repeat testing.", highEs: "Un A1C más alto significa que el azúcar ha estado alto. De 5.7% a 6.4% se llama rango de prediabetes; 6.5% o más es el rango de diabetes, que el médico confirma repitiendo el análisis.", askHigh: "What does my A1C mean for me, and when should I test it again?", askHighEs: "¿Qué significa mi A1C para mí y cuándo debo repetirlo?" },
  vitaminD: { name: "Vitamin D", nameEs: "Vitamina D", what: "A vitamin your body needs for healthy bones and muscles.", whatEs: "Una vitamina que el cuerpo necesita para tener huesos y músculos sanos.", low: "Low vitamin D is common, especially with little sun. Over time it can affect bone strength.", lowEs: "La vitamina D baja es común, sobre todo con poco sol. Con el tiempo puede afectar la fuerza de los huesos.", high: "Very high vitamin D usually comes from taking a lot of supplements.", highEs: "La vitamina D muy alta suele venir de tomar muchos suplementos.", askLow: "Do I need a vitamin D supplement? If so, how much should I take and for how long?", askLowEs: "¿Necesito un suplemento de vitamina D? Si es así, ¿cuánto debo tomar y por cuánto tiempo?", askHigh: "Should I change the vitamin D I take?", askHighEs: "¿Debo cambiar la vitamina D que tomo?" },
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
  vitb: { en: "vitamin B12 and folate", es: "vitamina B12 y folato", keys: ["b12", "folate"] },
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
    count: (o: number, t: number) => `${o} of ${t} results ${o === 1 ? "is" : "are"} outside the lab's ranges.`,
    and: "and",
    attentionTitle: "Results to talk about",
    whatIs: "What is it?", whatMeans: "What does this mean?", askDoctor: "Ask your doctor", yourResult: "Your result",
    labRange: "Lab's range", noRangePrinted: "Not printed on your report", generalGuide: "Common guide (no range on your report)",
    labels: { check: "Check this number", high: "High", low: "Low", in: "In range", none: "No range printed", critical: "Critical", abnormal: "Flagged by the lab", goalAbove: "In range, above a common goal", goalBelow: "In range, below a common goal", pre: "High — prediabetes range", diabetes: "High — diabetes range" },
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
    count: (o: number, t: number) => `${o} de ${t} resultados ${o === 1 ? "está" : "están"} fuera de los rangos del laboratorio.`,
    and: "y",
    attentionTitle: "Resultados para hablar con su médico",
    whatIs: "¿Qué es?", whatMeans: "¿Qué significa?", askDoctor: "Pregunte a su médico", yourResult: "Su resultado",
    labRange: "Rango del laboratorio", noRangePrinted: "No aparece en su informe", generalGuide: "Guía común (su informe no trae rango)",
    labels: { check: "Revise este número", high: "Alto", low: "Bajo", in: "En rango", none: "Sin rango impreso", critical: "Crítico", abnormal: "Marcado por el laboratorio", goalAbove: "En rango, por encima de una meta común", goalBelow: "En rango, por debajo de una meta común", pre: "Alto — rango de prediabetes", diabetes: "Alto — rango de diabetes" },
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
  const goal = row.status === "target_above" || row.status === "target_below";
  const meaning = row.status === "check" ? t.checkMeaning : row.status === "critical" ? t.criticalMeaning : row.status === "outside" ? t.abnormalMeaning : goal ? t.goalMeaning
    : dir === "high" ? (es ? guide.highEs : guide.high) || t.genericHigh : dir === "low" ? (es ? guide.lowEs : guide.low) || t.genericLow : "";
  const plainName = name.replace(/\s*\(.*\)$/, "");
  const ask = row.status === "check" ? "" : goal ? t.goalAsk(plainName) : dir === "high" || row.status === "critical" ? (es ? guide.askHighEs : guide.askHigh) || t.genericAsk(plainName)
    : dir === "low" ? (es ? guide.askLowEs : guide.askLow) || t.genericAsk(plainName) : row.status === "outside" ? t.genericAsk(plainName) : "";
  const value = (row.rule ? String(row.valueText) : `${row.valueText} ${row.unit || ""}`.trim()).replace("(about ", es ? "(unos " : "(about ");
  return {
    key: row.key, name, plainName, what, label, meaning, ask, value,
    unit: row.rule ? "" : row.unit || "", unitHint: unitHint(row.rule ? "" : row.unit, language),
    range: row.rangeText || "", rangeLabel: (row as TestRow & { generalRange?: boolean }).generalRange ? t.generalGuide : t.labRange,
    status: row.status, attention: row.status !== "within" && row.status !== "unknown",
    tone: row.status === "check" ? "check" : row.status === "critical" ? "critical" : goal ? "goal" : row.status === "within" ? "in" : row.status === "unknown" ? "none" : "out",
  };
}

// Everything the result screen shows, built from the analysis rows only.
export function buildReportView(analysis: ReportAnalysis, language: string = "en", plan: PersonalPlan | null = null, unsure: string[] = [], fromPhoto = false) {
  const es = language === "es";
  const t = VIEW_TEXT[es ? "es" : "en"];
  const rows = allTestRows(analysis);
  const a1cValue = (analysis.labValues || []).find((item) => item.label === "A1C");
  const a1cPercent = a1cValue ? Number(a1cValue.value) : null;
  // A number read from a photo that may be misread is shown as "check this number" until confirmed.
  const tests = rows.map((row) => describeTestRow(unsure.includes(row.key) ? { ...row, status: "check" } : row, es ? "es" : "en", Number.isFinite(a1cPercent) ? a1cPercent : null));
  const bpValue = (analysis.labValues || []).find((item) => item.label === "Blood pressure");
  const [sys, dia] = String(bpValue?.value || "").split("/").map(Number);
  const bpHigh = Number.isFinite(sys) && (sys >= 130 || dia >= 80);
  const order: Record<string, number> = { check: 0, critical: 1, out: 2, goal: 3 };
  const cards = tests.filter((item) => item.attention && item.tone !== "none").sort((a, b) => order[a.tone] - order[b.tone]);
  if (bpHigh) cards.push({ key: "bp", name: t.bpName, plainName: t.bpName, what: t.bpWhat, label: t.labels.high, meaning: t.bpMeaning, ask: t.bpAsk, value: `${bpValue?.value} mmHg`, unit: "", unitHint: "", range: t.bpRange, rangeLabel: t.bpRangeLabel, status: "above", attention: true, tone: "out" });

  const outside = tests.filter((item) => item.tone === "out" || item.tone === "critical").length;
  const noRange = tests.filter((item) => item.tone === "none").length;
  const goals = tests.filter((item) => item.tone === "goal");
  const critical = tests.filter((item) => item.tone === "critical");
  const urgent = analysis.riskLevel === "urgent" || critical.length > 0;
  const groupNames = [...new Set(cards.filter((item) => item.tone !== "goal" && item.tone !== "check").map((item) => GROUP_OF[item.key] || item.key))]
    .map((group) => TEST_GROUPS[group]?.[es ? "es" : "en"] || cards.find((item) => item.key === group)?.plainName || group);
  const groupText = listWords(groupNames, es ? "es" : "en");
  const criticalNames = listWords(critical.map((item) => item.plainName), es ? "es" : "en");

  let headline = ""; const body: string[] = [];
  if (!tests.length) {
    headline = urgent ? t.prompt : bpHigh ? t.few : "";
    if (bpHigh) body.push(t.discuss(groupText));
  } else if (urgent) {
    headline = t.prompt;
    if (critical.length) body.push(t.promptBody(criticalNames));
    if (groupNames.length) body.push(t.discuss(groupText));
  } else if (!outside && !goals.length && !bpHigh && noRange === tests.length) {
    headline = t.few; body.push(t.noneCompared(tests.length));
  } else if (!outside && !goals.length && !bpHigh) {
    headline = t.allIn; body.push(t.allInBody(tests.length - noRange));
  } else {
    headline = outside > tests.length / 2 ? t.several : t.few;
    if (groupNames.length) body.push(t.discuss(groupText));
    if (goals.length) body.push(t.goal(listWords(goals.map((item) => item.plainName), es ? "es" : "en")));
    if (outside + noRange < tests.length) body.push(t.others);
  }
  if (noRange && noRange < tests.length) body.push(t.noRange(noRange));
  const toCheck = tests.filter((item) => item.tone === "check").length;
  if (toCheck) body.unshift(t.checkFirst(toCheck));
  if (fromPhoto && tests.length) body.push(t.photoNote);

  // Three steps first; the rest of the plan is available under "More ideas".
  const kidney = (analysis.panelResults || []).some((item) => (item.key === "potassium" && (item.status === "above" || item.status === "critical")) || (item.key === "creatinine" && (item.status === "above" || item.status === "critical")) || (item.key === "egfr" && (item.status === "below" || item.status === "critical")));
  const has = (key: string, statuses: string[]) => tests.some((item) => item.key === key && statuses.includes(item.status));
  const food = kidney ? t.food.kidney
    : has("triglycerides", ["above", "target_above"]) || has("a1c", ["above", "target_above"]) || has("glucose", ["above"]) ? t.food.drinks
    : has("ldl", ["above", "target_above"]) || has("totalCholesterol", ["above", "target_above"]) ? t.food.oil
    : bpHigh ? t.food.salt
    : has("vitaminD", ["below", "target_below"]) ? t.food.vitd : t.food.veg;
  const steps = [
    urgent ? { title: t.stepDoctorToday, body: t.stepDoctorTodayBody(criticalNames || groupText) }
      : groupNames.length || goals.length ? { title: t.stepDoctor, body: t.stepDoctorBody(groupText || listWords(goals.map((item) => item.plainName), es ? "es" : "en")) }
      : { title: t.stepCheckup, body: t.stepCheckupBody },
    urgent ? { title: t.stepHold, body: t.stepHoldBody } : { title: t.stepWalk, body: t.stepWalkBody },
    { title: t.stepFood, body: food },
  ];
  const more = [...(cards.length ? [t.repeatTest] : []), ...(plan ? plan.sections.flatMap((section) => section.items.map((item) => item.text)) : [])]
    .filter((text, index, list) => list.indexOf(text) === index && text !== food);

  const questions = [...new Set(cards.map((item) => item.ask).filter(Boolean))];
  return {
    title: t.summaryTitle, headline, body, urgent,
    count: tests.length ? t.count(outside, tests.length) : "",
    outside, total: tests.length, cards, tests, steps, more, questions, text: t,
  };
}
