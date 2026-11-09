// One answer pipeline for the help chat and the AI Health Guide, mirrored from the website's help.js:
// emergency words first (answered on the phone, never sent), then fixed answers for "are you a
// real doctor?" and diagnosis questions, then the online helper (/assistant/chat), and the
// built-in answers when it cannot be reached.
import { builtInHelpAnswer } from "./helpAnswers";
import type { ReportAnalysis } from "./reportAnalysis";

export type GuideLanguage = "en" | "es";
export type GuideTurn = { role: "user" | "assistant"; content: string };
export type GuideSource = "safety" | "built-in" | "online";
export type GuideAnswer = { reply: string; source: GuideSource; urgent?: boolean; showTopics?: boolean; busy?: boolean };

export const EMERGENCY_PATTERN = /(chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|stroke|face droop|slurred speech|passed out|unconscious|fainted|seizure|severe bleeding|bleeding (a lot|heavily)|overdose|suicid|kill myself|end my life|self[- ]harm|dolor (de|en el) pecho|no puedo respirar|derrame|desmay|convulsi|sangrado (fuerte|abundante)|quitarme la vida)/i;
export const IDENTITY_QUESTION = /\b(are|r) (you|u) (a |an )?(real |actual |human |licensed )?(doctor|physician|nurse|human|person|md)\b|\bis (this|the (ai )?(health )?guide) (a )?(real )?(doctor|physician|human)\b|eres (un |una )?(médico|medico|doctor|doctora|humano|persona)/i;
export const DIAGNOSIS_QUESTION = /\b(diagnose|diagnosis)\b|\bdo i have\b|\bam i (sick|diabetic|anemic|dying)\b|\bwhat (disease|condition|illness) do i have\b|diagn[oó]stic|¿?tengo (diabetes|anemia|cáncer|cancer)/i;

export const GUIDE_TEXT = {
  en: {
    emergency: "This sounds urgent. Please call 911 or your local emergency number now, or go to the nearest emergency room. Do not wait for an app.",
    busy: "The helper is busy right now. Please try again in a minute.",
    identity: "No. I'm FollowThrough Health's AI Health Guide: an education tool, not a doctor or a person. I explain terms and results in plain words and help you prepare questions for your doctor, who is the one who interprets your results.",
    diagnosis: "I can't diagnose. Only your doctor can say what your results mean for your health, using your history and an exam. I can explain what each test measures and help you prepare questions, for example: \"Do my results point to anything we should check or repeat?\"",
  },
  es: {
    emergency: "Esto suena urgente. Llama al 911 o al número de emergencias local ahora, o ve a la sala de emergencias más cercana. No esperes a una app.",
    busy: "El asistente está ocupado. Inténtalo de nuevo en un minuto.",
    identity: "No. Soy la Guía de Salud con IA de FollowThrough Health: una herramienta de educación, no un médico ni una persona. Explico términos y resultados en palabras sencillas y le ayudo a preparar preguntas para su médico, que es quien interpreta sus resultados.",
    diagnosis: "No puedo diagnosticar. Solo su médico puede decir qué significan sus resultados para su salud, con su historial y un examen. Puedo explicar qué mide cada prueba y ayudarle a preparar preguntas, por ejemplo: \"¿Mis resultados indican algo que debamos revisar o repetir?\"",
  },
} as const;

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export async function guideReply(options: {
  question: string;
  history: GuideTurn[];
  language: GuideLanguage;
  baseUrl: string;
  analysis: ReportAnalysis | null;
  reportSummary?: string;
  shareReport?: boolean;
  source?: string;
  fetcher?: FetchLike;
}): Promise<GuideAnswer> {
  const { language, analysis } = options;
  const t = GUIDE_TEXT[language];
  const clean = options.question.trim().slice(0, 1000);
  if (EMERGENCY_PATTERN.test(clean)) return { reply: t.emergency, source: "safety", urgent: true };
  if (IDENTITY_QUESTION.test(clean)) return { reply: t.identity, source: "built-in" };
  if (DIAGNOSIS_QUESTION.test(clean)) return { reply: t.diagnosis, source: "built-in" };
  const builtIn = (): GuideAnswer => {
    const answer = builtInHelpAnswer(clean, language, analysis);
    return { reply: answer.reply, source: "built-in", showTopics: answer.showTopics };
  };
  const fetcher: FetchLike = options.fetcher || ((url, init) => fetch(url, init));
  try {
    const response = await fetcher(`${options.baseUrl}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...options.history, { role: "user", content: clean }].slice(-12),
        report_summary: options.shareReport ? String(options.reportSummary || "").slice(0, 4000) : "",
        language,
        source: options.source || "mobile",
      }),
    });
    if (response.status === 429) return { reply: t.busy, source: "built-in", busy: true };
    if (!response.ok) return builtIn();
    const reply = String(((await response.json()) as { reply?: unknown })?.reply || "");
    return reply ? { reply, source: "online" } : builtIn();
  } catch {
    return builtIn();
  }
}
