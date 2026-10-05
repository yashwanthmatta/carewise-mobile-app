import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { builtInHelpAnswer } from "./helpAnswers";
import type { ReportAnalysis } from "./reportAnalysis";

type Turn = { role: "user" | "assistant"; content: string };
type Language = "en" | "es";

const TEXT = {
  en: {
    open: "Need help?",
    title: "CareWise helper",
    sub: "Ask about your report or how to use CareWise.",
    hello: "Hi, I'm the CareWise helper. Ask me what a test on your report means, how to use the app, or about plans.",
    placeholder: "Type a question",
    send: "Send",
    close: "Close",
    thinking: "Thinking…",
    share: "Share my latest result with the helper",
    fine: "General help, not medical advice. In an emergency call 911.",
    chips: ["What does my result mean?", "How do I add a report?", "What should I ask my doctor?", "How do plans work?"],
    emergency: "This sounds urgent. Please call 911 or your local emergency number now, or go to the nearest emergency room. Do not wait for an app.",
    busy: "The helper is busy right now. Please try again in a minute.",
  },
  es: {
    open: "¿Ayuda?",
    title: "Asistente de CareWise",
    sub: "Pregunta sobre tu informe o cómo usar CareWise.",
    hello: "Hola, soy el asistente de CareWise. Pregúntame qué significa una prueba de tu informe, cómo usar la app o sobre los planes.",
    placeholder: "Escribe una pregunta",
    send: "Enviar",
    close: "Cerrar",
    thinking: "Pensando…",
    share: "Compartir mi último resultado con el asistente",
    fine: "Ayuda general, no consejo médico. En una emergencia llama al 911.",
    chips: ["¿Qué significa mi resultado?", "¿Cómo agrego un informe?", "¿Qué le pregunto a mi médico?", "¿Cómo funcionan los planes?"],
    emergency: "Esto suena urgente. Llama al 911 o al número de emergencias local ahora, o ve a la sala de emergencias más cercana. No esperes a una app.",
    busy: "El asistente está ocupado. Inténtalo de nuevo en un minuto.",
  },
};

export const EMERGENCY_PATTERN = /(chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|stroke|face droop|slurred speech|passed out|unconscious|fainted|seizure|severe bleeding|bleeding (a lot|heavily)|overdose|suicid|kill myself|end my life|self[- ]harm|dolor (de|en el) pecho|no puedo respirar|derrame|desmay|convulsi|sangrado (fuerte|abundante)|quitarme la vida)/i;

// Floating help button with a chat sheet. Nothing typed here is stored.
export function HelpChat({ baseUrl, language, reportSummary, analysis }: { baseUrl: string; language: Language; reportSummary: string; analysis: ReportAnalysis | null }) {
  const t = TEXT[language];
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [share, setShare] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const scroller = useRef<ScrollView>(null);

  async function ask(question: string) {
    const clean = question.trim().slice(0, 1000);
    if (!clean || waiting) return;
    const next: Turn[] = [...turns, { role: "user", content: clean }];
    setTurns(next);
    setDraft("");
    setShowTopics(false);
    if (EMERGENCY_PATTERN.test(clean)) {
      setTurns([...next, { role: "assistant", content: t.emergency }]);
      return;
    }
    setWaiting(true);
    let reply = "";
    const builtIn = () => {
      const answer = builtInHelpAnswer(clean, language, analysis);
      setShowTopics(answer.showTopics);
      return answer.reply;
    };
    try {
      const response = await fetch(`${baseUrl}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-12),
          report_summary: share ? reportSummary.slice(0, 4000) : "",
          language,
          source: "mobile",
        }),
      });
      if (response.status === 429) reply = t.busy;
      else if (!response.ok) reply = builtIn();
      else reply = String((await response.json()).reply || "") || builtIn();
    } catch {
      reply = builtIn();
    }
    setTurns([...next, { role: "assistant", content: reply }]);
    setWaiting(false);
  }

  return (
    <>
      <Pressable style={styles.launcher} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Open CareWise help">
        <Text style={styles.launcherMark}>?</Text>
        <Text style={styles.launcherText}>{t.open}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.sheet}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.sub}>{t.sub}</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} style={styles.close} accessibilityRole="button" accessibilityLabel={t.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView ref={scroller} style={styles.log} contentContainerStyle={{ padding: 14, gap: 10 }} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
              <Text style={[styles.bubble, styles.assistant]}>{t.hello}</Text>
              {turns.map((turn, index) => (
                <Text key={index} style={[styles.bubble, turn.role === "user" ? styles.user : styles.assistant, turn.content === t.emergency && styles.urgent]}>
                  {turn.content}
                </Text>
              ))}
              {waiting ? <Text style={[styles.bubble, styles.assistant, styles.pending]}>{t.thinking}</Text> : null}
              {!turns.length || showTopics ? (
                <View style={styles.chips}>
                  {t.chips.map((chip) => (
                    <Pressable key={chip} style={styles.chip} onPress={() => ask(chip)} accessibilityRole="button">
                      <Text style={styles.chipText}>{chip}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            {reportSummary ? (
              <Pressable style={styles.shareRow} onPress={() => setShare((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: share }}>
                <Text style={styles.checkbox}>{share ? "☑" : "☐"}</Text>
                <Text style={styles.shareText}>{t.share}</Text>
              </Pressable>
            ) : null}
            <View style={styles.form}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t.placeholder}
                style={styles.input}
                maxLength={1000}
                multiline
                accessibilityLabel={t.placeholder}
                onSubmitEditing={() => ask(draft)}
              />
              <Pressable style={[styles.send, waiting && { opacity: 0.5 }]} onPress={() => ask(draft)} disabled={waiting} accessibilityRole="button">
                <Text style={styles.sendText}>{t.send}</Text>
              </Pressable>
            </View>
            <Text style={styles.fine}>{t.fine}</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcher: { position: "absolute", right: 16, bottom: 24, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 16, borderRadius: 999, backgroundColor: "#111314", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  launcherMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#0f766e", color: "#fff", textAlign: "center", lineHeight: 34, fontSize: 18, fontWeight: "700", overflow: "hidden" },
  launcherText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,19,20,0.35)" },
  sheet: { height: "82%", backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, backgroundColor: "#111314" },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#fff", fontSize: 22, lineHeight: 24 },
  log: { flex: 1, backgroundColor: "#f7f4ef" },
  bubble: { maxWidth: "86%", paddingVertical: 10, paddingHorizontal: 13, borderRadius: 16, fontSize: 15, lineHeight: 21, overflow: "hidden" },
  assistant: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2dcd2", color: "#111314" },
  user: { alignSelf: "flex-end", backgroundColor: "#0f766e", color: "#fff" },
  urgent: { backgroundColor: "#fdecea", borderColor: "#f2b8b0", color: "#7a1d12", fontWeight: "600" },
  pending: { color: "#6b6f72", fontStyle: "italic" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#e2dcd2", backgroundColor: "#fff" },
  chipText: { fontSize: 14, color: "#111314" },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: "#e2dcd2" },
  checkbox: { fontSize: 18, color: "#0f766e" },
  shareText: { fontSize: 14, color: "#111314", flex: 1 },
  form: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderColor: "#e2dcd2" },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#e2dcd2", borderRadius: 14, fontSize: 16 },
  send: { minHeight: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#111314", justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  fine: { fontSize: 12, color: "#6b6f72", paddingHorizontal: 16, paddingBottom: 16 },
});
