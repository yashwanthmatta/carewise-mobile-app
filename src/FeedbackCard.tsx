import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  EARLY_ACCESS_ROLES,
  isValidEmail,
  joinEarlyAccess,
  sendFeedback,
  sendFeedbackComment,
  trackUsage,
  type EarlyAccessRole,
} from "./productSignals";

const TEXT = {
  en: {
    question: "Was this explanation helpful?",
    yes: "Yes",
    no: "No",
    more: "Thank you. What would make it better? (optional)",
    placeholder: "Please leave out names and medical details.",
    send: "Send",
    sent: "Thank you for helping us improve CareWise.",
    offline: "Thank you. CareWise could not be reached just now, so nothing was sent.",
    earlyTitle: "Want new features first?",
    earlyBody: "Join early access. We are building CareWise with families who look after a parent's health.",
  },
  es: {
    question: "¿Le resultó útil esta explicación?",
    yes: "Sí",
    no: "No",
    more: "Gracias. ¿Qué la mejoraría? (opcional)",
    placeholder: "Por favor, no incluya nombres ni datos médicos.",
    send: "Enviar",
    sent: "Gracias por ayudarnos a mejorar CareWise.",
    offline: "Gracias. No se pudo conectar con CareWise en este momento, así que no se envió nada.",
    earlyTitle: "¿Quiere probar las novedades primero?",
    earlyBody: "Únase al acceso anticipado. Estamos creando CareWise con familias que cuidan la salud de un padre o una madre.",
  },
};

const ROLE_LABELS: Record<EarlyAccessRole, string> = {
  caregiver: "Family caregiver",
  patient: "My own health",
  clinician: "Doctor, nurse or pharmacist",
  other: "Something else",
};

// "Was this helpful?" under an explanation, with the early-access sign-up below it.
export function FeedbackCard({ baseUrl, language }: { baseUrl: string; language: "en" | "es" }) {
  const t = TEXT[language];
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [feedbackId, setFeedbackId] = useState("");
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const [message, setMessage] = useState("");

  async function choose(helpful: boolean) {
    if (answer) return;
    setAnswer(helpful ? "yes" : "no");
    try {
      const result = await sendFeedback(baseUrl, helpful);
      setFeedbackId(result.id || "");
      setMessage(t.sent);
    } catch {
      setMessage(t.offline);
    }
  }

  async function sendComment() {
    if (!comment.trim() || !feedbackId) return;
    try {
      await sendFeedbackComment(baseUrl, feedbackId, comment);
      setCommentSent(true);
      setMessage(t.sent);
    } catch {
      setMessage(t.offline);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t.question}</Text>
      <View style={styles.row}>
        {([true, false] as const).map((helpful) => {
          const selected = answer === (helpful ? "yes" : "no");
          return (
            <Pressable
              key={String(helpful)}
              onPress={() => choose(helpful)}
              disabled={Boolean(answer)}
              style={[styles.choice, selected && styles.choiceSelected]}
              accessibilityRole="button"
              accessibilityLabel={helpful ? t.yes : t.no}
              accessibilityState={{ selected, disabled: Boolean(answer) }}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{helpful ? t.yes : t.no}</Text>
            </Pressable>
          );
        })}
      </View>
      {feedbackId && !commentSent ? (
        <View style={styles.stack}>
          <Text style={styles.small}>{t.more}</Text>
          <TextInput style={styles.input} value={comment} onChangeText={setComment} placeholder={t.placeholder} maxLength={500} multiline accessibilityLabel={t.more} />
          <Pressable onPress={sendComment} style={styles.button} accessibilityRole="button" accessibilityLabel={t.send}>
            <Text style={styles.buttonText}>{t.send}</Text>
          </Pressable>
        </View>
      ) : null}
      {message ? <Text style={styles.small} accessibilityLiveRegion="polite">{message}</Text> : null}
    </View>
  );
}

// Early-access sign-up, also reachable from the Plans screen.
export function EarlyAccessForm({ baseUrl, language }: { baseUrl: string; language: "en" | "es" }) {
  const t = TEXT[language];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EarlyAccessRole>("caregiver");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");

  function markOpened() {
    if (opened) return;
    setOpened(true);
    trackUsage(baseUrl, "early_access_opened");
  }

  async function submit() {
    if (!isValidEmail(email)) return setMessage("Please enter a valid email address.");
    if (!consent) return setMessage("Please turn on the switch so we can email you about early access.");
    setBusy(true);
    setMessage("Joining early access...");
    try {
      await joinEarlyAccess(baseUrl, { email, role, note });
      setEmail("");
      setNote("");
      setConsent(false);
      setMessage("You're on the list. Thank you! We'll email you when there is something new to try.");
    } catch (error) {
      setMessage((error as { status?: number }).status === 429
        ? "Too many tries from this connection. Please try again in 15 minutes."
        : "CareWise could not be reached just now. The server may be waking up; please try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t.earlyTitle}</Text>
      <Text style={styles.small}>{t.earlyBody}</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} onFocus={markOpened} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Email for early access" />
      <View style={styles.row}>
        {EARLY_ACCESS_ROLES.map((code) => (
          <Pressable key={code} onPress={() => setRole(code)} style={[styles.choice, role === code && styles.choiceSelected]} accessibilityRole="button" accessibilityLabel={ROLE_LABELS[code]} accessibilityState={{ selected: role === code }}>
            <Text style={[styles.choiceText, role === code && styles.choiceTextSelected]}>{ROLE_LABELS[code]}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.input} value={note} onChangeText={setNote} onFocus={markOpened} placeholder="What is hardest about lab reports in your family? (optional)" maxLength={500} multiline accessibilityLabel="Optional note" />
      <View style={styles.consent}>
        <Switch value={consent} onValueChange={setConsent} accessibilityLabel="Agree to be emailed about early access" />
        <Text style={[styles.small, styles.flex]}>CareWise can email me about early access. I can ask to be removed at any time.</Text>
      </View>
      <Pressable onPress={submit} disabled={busy} style={[styles.button, busy && styles.disabled]} accessibilityRole="button" accessibilityLabel="Join early access" accessibilityState={{ disabled: busy }}>
        <Text style={styles.buttonText}>Join early access</Text>
      </Pressable>
      {message ? <Text style={styles.small} accessibilityLiveRegion="polite">{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10, borderRadius: 8, borderWidth: 1, borderColor: "#dbe8e4", backgroundColor: "#f4f8f6", padding: 12, marginTop: 10 },
  title: { color: "#14302c", fontSize: 15, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stack: { gap: 8 },
  choice: { borderRadius: 8, borderWidth: 1, borderColor: "#cbdcd5", backgroundColor: "#ffffff", paddingVertical: 9, paddingHorizontal: 14, minHeight: 44, justifyContent: "center" },
  choiceSelected: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  choiceText: { color: "#14302c", fontWeight: "700" },
  choiceTextSelected: { color: "#ffffff" },
  input: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: "#cbdcd5", padding: 12, backgroundColor: "#fbfffd" },
  small: { color: "#3e5450", fontSize: 13 },
  consent: { flexDirection: "row", alignItems: "center", gap: 10 },
  flex: { flex: 1 },
  button: { borderRadius: 8, backgroundColor: "#0b3b36", paddingVertical: 12, alignItems: "center", minHeight: 44, justifyContent: "center" },
  buttonText: { color: "#ffffff", fontWeight: "800" },
  disabled: { opacity: 0.6 },
});
