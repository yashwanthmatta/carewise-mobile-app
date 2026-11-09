// AI Health Guide screen: the same original guide as the website, drawn with plain views (no new
// library) and moved with React Native's Animated API. States: idle (breathing, blinking), listening
// (typing), thinking (eyes up, three dots), answering (mouth moves while the answer appears).
// Every state is also written in words; with Reduce Motion on, nothing moves.
// Answers come from guideReply: the same safety pipeline as the help chat and the website.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, type } from "./theme";
import { guideReply, type GuideAnswer, type GuideLanguage, type GuideTurn } from "./guideReply";
import type { ReportAnalysis } from "./reportAnalysis";

type GuideState = "idle" | "listening" | "thinking" | "speaking";
type Entry = { role: "user" | "assistant"; content: string; source?: GuideAnswer["source"]; urgent?: boolean };

const TEXT = {
  en: {
    title: "Meet your AI Health Guide",
    lede: "Ask what a test or a medical word means, get a plain-language explanation, and leave with better questions for your doctor.",
    label: "AI Health Guide — Educational information, not medical diagnosis.",
    hello: "Hello. I'm an AI education guide, not a doctor. Ask me what a lab test means, or how to prepare for your next visit.",
    placeholder: "Ask about a test or a medical word",
    ask: "Ask",
    share: "Include my latest report in the question",
    chips: ["What does eGFR mean?", "Explain A1C in plain words", "What should I ask my doctor about high cholesterol?", "Is the AI Health Guide a real doctor?"],
    states: { idle: "Ready for your question", listening: "Listening to your question", thinking: "Thinking", speaking: "Answering" },
    sources: { online: "Source: an AI answer from our provider, Anthropic, under FollowThrough Health's safety rules.", "built-in": "Source: FollowThrough Health's built-in explanations.", safety: "Source: FollowThrough Health's emergency safety message." },
    fine: "Answers come from FollowThrough Health's built-in explanations, or from our AI provider, Anthropic, when it is available; your question is not saved by our servers. In an emergency, call your local emergency number.",
  },
  es: {
    title: "Conozca su Guía de Salud con IA",
    lede: "Pregunte qué significa una prueba o una palabra médica, reciba una explicación sencilla y salga con mejores preguntas para su médico.",
    label: "Guía de Salud con IA — Información educativa, no un diagnóstico médico.",
    hello: "Hola. Soy una guía educativa con IA, no un médico. Pregúnteme qué significa un análisis o cómo prepararse para su próxima visita.",
    placeholder: "Pregunte por una prueba o una palabra médica",
    ask: "Preguntar",
    share: "Incluir mi último informe en la pregunta",
    chips: ["¿Qué significa eGFR?", "Explique la A1C en palabras sencillas", "¿Qué le pregunto a mi médico sobre el colesterol alto?", "¿La Guía de Salud con IA es un médico?"],
    states: { idle: "Lista para su pregunta", listening: "Escuchando su pregunta", thinking: "Pensando", speaking: "Respondiendo" },
    sources: { online: "Fuente: una respuesta de IA de nuestro proveedor, Anthropic, con las reglas de seguridad de FollowThrough Health.", "built-in": "Fuente: las explicaciones integradas de FollowThrough Health.", safety: "Fuente: el mensaje de seguridad de emergencia de FollowThrough Health." },
    fine: "Las respuestas vienen de las explicaciones integradas de FollowThrough Health o de nuestro proveedor de IA, Anthropic, cuando está disponible; nuestros servidores no guardan su pregunta. En una emergencia, llame al número de emergencias local.",
  },
} as const;

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function loop(value: Animated.Value, toValue: number, duration: number, delay = 0) {
  return Animated.loop(Animated.sequence([
    Animated.delay(delay),
    Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
  ]));
}

// The guide, drawn with views: hair, face, eyes with lids, smile and mouth, a white coat with a teal collar.
function GuideFigure({ state, reduce }: { state: GuideState; reduce: boolean }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const talk = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const breathing = loop(breathe, 1, 2400);
    const blinking = Animated.loop(Animated.sequence([
      Animated.delay(4200),
      Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]));
    breathing.start();
    blinking.start();
    return () => { breathing.stop(); blinking.stop(); };
  }, [reduce, breathe, blink]);

  useEffect(() => {
    if (reduce) {
      talk.setValue(0); dots.setValue(0); tilt.setValue(0);
      return;
    }
    Animated.timing(tilt, { toValue: state === "listening" ? 1 : 0, duration: 300, useNativeDriver: true }).start();
    const talking = loop(talk, 1, 180);
    const thinking = loop(dots, 1, 450);
    if (state === "speaking") talking.start(); else talk.setValue(0);
    if (state === "thinking") thinking.start(); else dots.setValue(0);
    return () => { talking.stop(); thinking.stop(); };
  }, [state, reduce, talk, dots, tilt]);

  const headTilt = tilt.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-5deg"] });
  const lift = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const lidScale = blink.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] });
  const mouthScale = talk.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });
  const dotLift = dots.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const eyeShift = state === "thinking" ? { transform: [{ translateY: -2 }, { translateX: -1 }] } : null;

  return (
    <View style={fig.wrap} accessible accessibilityRole="image" accessibilityLabel="The AI Health Guide: an illustrated health educator in a white coat">
      <View style={fig.halo} />
      <Animated.View style={[fig.person, { transform: [{ translateY: lift }] }]}>
        <View style={fig.coat}>
          <View style={fig.collar} />
          <View style={fig.badge}><Text style={fig.badgeText}>AI</Text></View>
        </View>
        <View style={fig.neck} />
        <Animated.View style={[fig.headGroup, { transform: [{ rotate: headTilt }] }]}>
          <View style={fig.hairBack} />
          <View style={fig.face}>
            <View style={fig.fringe} />
            <View style={[fig.eyes, eyeShift]}>
              {[0, 1].map((index) => (
                <View key={index} style={fig.eye}>
                  <View style={fig.pupil} />
                  <Animated.View style={[fig.lid, { transform: [{ scaleY: lidScale }] }]} />
                </View>
              ))}
            </View>
            <View style={fig.cheeks}><View style={fig.cheek} /><View style={fig.cheek} /></View>
            <View style={fig.smile} />
            <Animated.View style={[fig.mouth, { transform: [{ scaleY: mouthScale }] }, state !== "speaking" && { opacity: 0 }]} />
          </View>
        </Animated.View>
      </Animated.View>
      {state === "thinking" ? (
        <View style={fig.dots}>
          {[0, 1, 2].map((index) => <Animated.View key={index} style={[fig.dot, { transform: [{ translateY: index === 1 ? dotLift : Animated.multiply(dotLift, 0.6) }] }]} />)}
        </View>
      ) : null}
    </View>
  );
}

export function HealthGuide({ baseUrl, language, analysis, reportSummary }: { baseUrl: string; language: GuideLanguage; analysis: ReportAnalysis | null; reportSummary: string }) {
  const t = TEXT[language];
  const reduce = useReduceMotion();
  const [state, setState] = useState<GuideState>("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [share, setShare] = useState(false);
  const busy = state === "thinking" || state === "speaking";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function ask(question: string) {
    const clean = question.trim().slice(0, 1000);
    if (!clean || busy) return;
    const history: GuideTurn[] = entries.map(({ role, content }) => ({ role, content }));
    setEntries((list) => [...list, { role: "user", content: clean }]);
    setDraft("");
    setState("thinking");
    const answer = await guideReply({ question: clean, history, language, baseUrl, analysis, reportSummary, shareReport: share, source: "mobile-guide" });
    setEntries((list) => [...list, { role: "assistant", content: answer.reply, source: answer.source, urgent: answer.urgent }]);
    AccessibilityInfo.announceForAccessibility?.(answer.reply);
    // The guide "speaks" for a moment in proportion to the answer, then is ready again.
    setState("speaking");
    timer.current = setTimeout(() => setState("idle"), reduce ? 0 : Math.min(4000, 600 + answer.reply.length * 12));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">{t.title}</Text>
      <Text style={styles.lede}>{t.lede}</Text>
      <Text style={styles.label}>{t.label}</Text>
      <GuideFigure state={state} reduce={reduce} />
      <Text style={styles.state} accessibilityLiveRegion="polite">{t.states[state]}</Text>
      <View style={styles.log}>
        <Text style={[styles.bubble, styles.guide]}>{t.hello}</Text>
        {entries.map((entry, index) => (
          <View key={index} style={entry.role === "user" ? styles.userRow : null}>
            <Text style={[styles.bubble, entry.role === "user" ? styles.user : styles.guide, entry.urgent && styles.urgent]}>{entry.content}</Text>
            {entry.role === "assistant" && entry.source ? <Text style={styles.source}>{t.sources[entry.source]}</Text> : null}
          </View>
        ))}
      </View>
      <View style={styles.chips}>
        {t.chips.map((chip) => (
          <Pressable key={chip} style={styles.chip} onPress={() => ask(chip)} disabled={busy} accessibilityRole="button">
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}
      </View>
      {reportSummary ? (
        <Pressable style={styles.shareRow} onPress={() => setShare((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: share }}>
          <Text style={styles.checkbox}>{share ? "☑" : "☐"}</Text>
          <Text style={styles.shareText}>{t.share}</Text>
        </Pressable>
      ) : null}
      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={(text) => { setDraft(text); if (!busy) setState(text ? "listening" : "idle"); }}
          onFocus={() => { if (!busy) setState("listening"); }}
          onBlur={() => { if (!busy && !draft) setState("idle"); }}
          placeholder={t.placeholder}
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          maxLength={1000}
          accessibilityLabel={t.placeholder}
          onSubmitEditing={() => ask(draft)}
          returnKeyType="send"
        />
        <Pressable style={[styles.askButton, busy && { opacity: 0.5 }]} onPress={() => ask(draft)} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy }}>
          <Text style={styles.askText}>{t.ask}</Text>
        </Pressable>
      </View>
      <Text style={styles.fine}>{t.fine}</Text>
    </View>
  );
}

const SKIN = "#C08566";
const HAIR = "#2E2622";
const fig = StyleSheet.create({
  wrap: { alignSelf: "center", width: 220, height: 220, marginTop: 16, alignItems: "center", justifyContent: "flex-end" },
  halo: { position: "absolute", top: 6, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.terracottaSoft },
  person: { alignItems: "center", width: 200, height: 210, justifyContent: "flex-end" },
  coat: { width: 168, height: 70, borderTopLeftRadius: 84, borderTopRightRadius: 84, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.line, alignItems: "center" },
  collar: { width: 40, height: 26, marginTop: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: colors.brand },
  badge: { position: "absolute", right: 34, top: 30, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.brand },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  neck: { position: "absolute", bottom: 62, width: 26, height: 22, backgroundColor: "#B57B5D" },
  headGroup: { position: "absolute", bottom: 78, width: 120, height: 128, alignItems: "center" },
  hairBack: { position: "absolute", top: 0, width: 116, height: 118, borderTopLeftRadius: 58, borderTopRightRadius: 58, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: HAIR },
  face: { position: "absolute", top: 14, width: 88, height: 104, borderRadius: 46, backgroundColor: SKIN, alignItems: "center", overflow: "hidden" },
  fringe: { position: "absolute", top: -26, left: -10, width: 112, height: 54, borderBottomLeftRadius: 50, borderBottomRightRadius: 70, backgroundColor: HAIR, transform: [{ rotate: "-8deg" }] },
  eyes: { flexDirection: "row", gap: 22, marginTop: 44 },
  eye: { width: 13, height: 14, borderRadius: 7, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pupil: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2A211D" },
  lid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SKIN },
  cheeks: { flexDirection: "row", gap: 40, marginTop: 6 },
  cheek: { width: 14, height: 8, borderRadius: 7, backgroundColor: "#D98C77", opacity: 0.35 },
  smile: { width: 26, height: 12, marginTop: 2, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderWidth: 3, borderTopWidth: 0, borderColor: "#7A3E2C" },
  mouth: { position: "absolute", bottom: 20, width: 16, height: 10, borderRadius: 8, backgroundColor: "#7A3E2C" },
  dots: { position: "absolute", top: 18, right: 18, flexDirection: "row", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.terracotta },
});

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 },
  title: { fontFamily: fonts.serif, fontSize: type.heading + 4, lineHeight: 34, fontWeight: "600", color: colors.ink },
  lede: { marginTop: 10, fontSize: type.body, lineHeight: 23, color: colors.ink2 },
  label: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, fontSize: type.small, color: colors.ink },
  state: { marginTop: 8, textAlign: "center", fontSize: type.small, color: colors.ink3 },
  log: { marginTop: 16, gap: 10 },
  bubble: { maxWidth: "92%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, fontSize: type.small, lineHeight: 21, overflow: "hidden" },
  guide: { alignSelf: "flex-start", backgroundColor: colors.surface, color: colors.ink, borderBottomLeftRadius: 6 },
  userRow: { alignItems: "flex-end" },
  user: { backgroundColor: colors.brand, color: "#FFFFFF", borderBottomRightRadius: 6 },
  urgent: { backgroundColor: colors.dangerSoft, color: "#7a1b12", fontWeight: "700" },
  source: { marginTop: 4, marginLeft: 4, fontSize: type.caption, color: colors.ink3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.bg },
  chipText: { fontSize: type.small, color: colors.ink },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, marginTop: 8 },
  checkbox: { fontSize: 20, color: colors.brand },
  shareText: { flex: 1, fontSize: type.small, color: colors.ink2 },
  form: { flexDirection: "row", gap: 8, marginTop: 12 },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.bg, fontSize: type.body, color: colors.ink },
  askButton: { minHeight: 48, minWidth: 72, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: colors.ink },
  askText: { color: "#FFFFFF", fontSize: type.body, fontWeight: "700" },
  fine: { marginTop: 12, fontSize: type.caption, lineHeight: 18, color: colors.ink3 },
});
