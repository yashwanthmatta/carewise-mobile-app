import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import {
  CareWiseApiClient,
  type LabTrendOut,
  type PrivacyExportSummaryOut,
  type ReportAnalysisOut,
  type SessionOut
} from "./src/apiClient";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? "https://carewise-api.onrender.com";
const ACCESS_TOKEN_KEY = "carewise.accessToken";
const REFRESH_TOKEN_KEY = "carewise.refreshToken";

type Screen = "dashboard" | "reports" | "labs" | "recommendations" | "doctors" | "insurance" | "subscriptions" | "legal";

const screens: { key: Screen; label: string }[] = [
  { key: "dashboard", label: "Home" },
  { key: "reports", label: "Reports" },
  { key: "labs", label: "Labs" },
  { key: "recommendations", label: "Care" },
  { key: "doctors", label: "Doctors" },
  { key: "insurance", label: "Insurance" },
  { key: "subscriptions", label: "Plans" },
  { key: "legal", label: "Legal" }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [email, setEmail] = useState("patient@example.com");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [status, setStatus] = useState("Sign in or create an account to sync with CareWise.");
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [session, setSession] = useState<SessionOut | null>(null);
  const [patientId, setPatientId] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportName, setReportName] = useState("mobile-report.txt");
  const [selectedReportFile, setSelectedReportFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysisOut | null>(null);
  const [labTrends, setLabTrends] = useState<LabTrendOut[]>([]);
  const [labTestName, setLabTestName] = useState("LDL cholesterol");
  const [labValue, setLabValue] = useState("");
  const [labUnit, setLabUnit] = useState("mg/dL");
  const [labFlag, setLabFlag] = useState("not_sure");
  const [labNotes, setLabNotes] = useState("");
  const [privacySummary, setPrivacySummary] = useState<PrivacyExportSummaryOut | null>(null);
  const [deletionReason, setDeletionReason] = useState("Please delete my CareWise account data.");
  const [busy, setBusy] = useState(false);

  const api = useMemo(() => new CareWiseApiClient(API_BASE_URL, token), [token]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const [savedAccessToken, savedRefreshToken] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
        ]);

        if (!savedAccessToken || cancelled) return;

        const restoredApi = new CareWiseApiClient(API_BASE_URL, savedAccessToken);
        const me = await restoredApi.me();

        if (cancelled) return;
        setToken(savedAccessToken);
        setRefreshToken(savedRefreshToken ?? "");
        setSession(me);
        setStatus(`Welcome back, ${me.email}.`);
      } catch {
        await clearStoredSession();
        if (!cancelled) {
          setStatus("Your saved session expired. Please sign in again.");
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(true);
    setStatus(`${label}...`);
    try {
      await action();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTokenPair(response: { access_token: string; refresh_token?: string }) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);
    if (response.refresh_token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refresh_token);
    }
    setToken(response.access_token);
    if (response.refresh_token) setRefreshToken(response.refresh_token);
    api.setToken(response.access_token);
    const me = await api.me();
    setSession(me);
    setStatus(`Signed in as ${me.email}.`);
  }

  async function clearStoredSession() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    ]);
  }

  function signup() {
    run("Creating account", async () => {
      const response = await api.signup(email, password, "patient");
      await saveTokenPair(response);
    });
  }

  function login() {
    run("Signing in", async () => {
      const response = await api.login(email, password);
      await saveTokenPair(response);
    });
  }

  function refreshSession() {
    run("Refreshing session", async () => {
      const response = await api.refresh(refreshToken);
      await saveTokenPair(response);
    });
  }

  function requestPasswordReset() {
    run("Requesting password reset", async () => {
      const response = await api.requestPasswordReset(email);
      if (response.reset_token) {
        setResetToken(response.reset_token);
        setStatus("Reset token received for this non-production environment. Enter a new password and confirm reset.");
        return;
      }
      setStatus(
        response.delivery_status === "email_queued"
          ? "If this email exists, a reset link will be sent. Do not share health details in support messages."
          : "Reset request saved, but email delivery is not configured. Use support if you cannot access your account."
      );
    });
  }

  function confirmPasswordReset() {
    run("Confirming password reset", async () => {
      if (!resetToken.trim() || !newPassword.trim()) {
        setStatus("Enter the reset token and a new password.");
        return;
      }
      const response = await api.confirmPasswordReset(resetToken.trim(), newPassword);
      await saveTokenPair(response);
      setPassword(newPassword);
      setNewPassword("");
      setResetToken("");
      setStatus("Password reset complete. You are signed in with your new password.");
    });
  }

  function requestEmailVerification() {
    run("Requesting email verification", async () => {
      const response = await api.requestEmailVerification();
      if (response.verification_token) {
        setVerificationToken(response.verification_token);
        setStatus("Verification token received for this non-production environment. Confirm it below.");
        return;
      }
      setStatus(
        response.delivery_status === "already_verified"
          ? "Your email is already verified."
          : response.delivery_status === "email_queued"
            ? "If email is configured, a verification link will be sent."
            : "Verification request saved, but email delivery is not configured yet."
      );
    });
  }

  function confirmEmailVerification() {
    run("Confirming email verification", async () => {
      if (!verificationToken.trim()) {
        setStatus("Enter the email verification token.");
        return;
      }
      const verified = await api.confirmEmailVerification(verificationToken.trim());
      setSession(verified);
      setVerificationToken("");
      setStatus("Email verified.");
    });
  }

  function logout() {
    run("Signing out", async () => {
      if (refreshToken) {
        try {
          await api.logout(refreshToken);
        } catch {
          // Still clear local session if the network is down or the token was already invalidated.
        }
      }
      await clearStoredSession();
      api.setToken(null);
      setToken("");
      setRefreshToken("");
      setSession(null);
      setPatientId("");
      setAnalysis(null);
      setLabTrends([]);
      setStatus("Signed out. Your saved mobile session was cleared from this device and the server session was revoked when reachable.");
    });
  }

  function syncProfile() {
    run("Syncing profile", async () => {
      const profile = await api.saveProfile({
        name: "Mobile Patient",
        sex_at_birth: "",
        conditions: "General wellness planning",
        allergies: "",
        location_region: "US",
        insurance_status: "unknown"
      });
      setPatientId(profile.patient_id);
      setStatus(`Patient profile ready: ${profile.patient_id}`);
    });
  }

  function recordConsent() {
    run("Recording consent", async () => {
      await api.recordConsent("2026-06-19", "US");
      setStatus("Consent recorded.");
    });
  }

  function uploadAndAnalyzeReport() {
    run("Uploading report", async () => {
      const activePatientId = patientId || (await api.saveProfile({
        name: "Mobile Patient",
        conditions: "General wellness planning",
        location_region: "US",
        insurance_status: "unknown"
      })).patient_id;
      setPatientId(activePatientId);
      const report = selectedReportFile
        ? await api.uploadReportFile({
          patient_id: activePatientId,
          report_text: reportText,
          file: {
            uri: selectedReportFile.uri,
            name: selectedReportFile.name || reportName || "mobile-report",
            type: selectedReportFile.mimeType || "application/octet-stream"
          }
        })
        : await api.uploadReport({
          patient_id: activePatientId,
          file_name: reportName || "mobile-report.txt",
          content_type: "text/plain",
          report_text: reportText || "No report text entered."
        });
      const result = await api.analyzeReport(report.id);
      setAnalysis(result);
      setStatus(`Report uploaded and analyzed with status: ${result.status}`);
    });
  }

  function saveLabTrend() {
    run("Saving lab value", async () => {
      if (!labValue.trim()) {
        setStatus("Enter a lab value before saving.");
        return;
      }
      const activePatientId = patientId || (await api.saveProfile({
        name: "Mobile Patient",
        conditions: "General wellness planning",
        location_region: "US",
        insurance_status: "unknown"
      })).patient_id;
      setPatientId(activePatientId);
      const trend = await api.saveLabTrend({
        patient_id: activePatientId,
        report_id: analysis?.report_id ?? null,
        test_name: labTestName,
        value: labValue.trim(),
        unit: labUnit.trim(),
        observed_on: new Date().toISOString().slice(0, 10),
        flag: labFlag,
        notes: labNotes.trim() || "Saved from CareWise mobile. Verify against the original report.",
        source: "mobile"
      });
      setLabTrends((items) => [trend, ...items.filter((item) => item.id !== trend.id)].slice(0, 50));
      setLabValue("");
      setLabNotes("");
      setStatus(`${trend.test_name} saved to cloud lab trends. Review with a licensed clinician.`);
    });
  }

  function loadLabTrends() {
    run("Loading cloud lab trends", async () => {
      const activePatientId = patientId || (await api.saveProfile({
        name: "Mobile Patient",
        conditions: "General wellness planning",
        location_region: "US",
        insurance_status: "unknown"
      })).patient_id;
      setPatientId(activePatientId);
      const trends = await api.listLabTrends(activePatientId);
      setLabTrends(trends);
      setStatus(`Loaded ${trends.length} cloud lab value${trends.length === 1 ? "" : "s"}.`);
    });
  }

  function loadPrivacySummary() {
    run("Loading privacy summary", async () => {
      const summary = await api.getPrivacyExportSummary();
      setPrivacySummary(summary);
      setStatus("Privacy export summary loaded. This is a count summary, not medical advice.");
    });
  }

  function requestDataDeletion() {
    if (!token) {
      setStatus("Sign in before requesting data deletion.");
      return;
    }
    Alert.alert(
      "Request data deletion?",
      "CareWise will record a deletion request for your account. This does not replace emergency, medical, or billing support.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          style: "destructive",
          onPress: () => {
            run("Requesting data deletion", async () => {
              const request = await api.requestDataDeletion(deletionReason.trim() || "Mobile app data deletion request.");
              setStatus(`Deletion request saved: ${request.id} (${request.status}).`);
            });
          }
        }
      ]
    );
  }

  async function pickReportFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/plain", "application/pdf", "image/*"] });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setSelectedReportFile(file);
    setReportName(file.name);
    setStatus(`${file.name} selected. Add readable text if the file is an image/PDF that may need OCR help.`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>CareWise AI</Text>
          <Text style={styles.subtitle}>Mobile care navigation starter</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <TextInput style={styles.input} value={resetToken} onChangeText={setResetToken} placeholder="Reset token from email" autoCapitalize="none" />
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New password" secureTextEntry />
          <TextInput style={styles.input} value={verificationToken} onChangeText={setVerificationToken} placeholder="Email verification token" autoCapitalize="none" />
          <View style={styles.buttonRow}>
            <ActionButton label="Sign up" onPress={signup} disabled={busy} />
            <ActionButton label="Login" onPress={login} disabled={busy} />
            <ActionButton label="Refresh" onPress={refreshSession} disabled={!refreshToken || busy} />
            <ActionButton label="Logout" onPress={logout} disabled={!token || busy} />
            <ActionButton label="Request reset" onPress={requestPasswordReset} disabled={busy} />
            <ActionButton label="Confirm reset" onPress={confirmPasswordReset} disabled={busy || !resetToken || !newPassword} />
            <ActionButton label="Verify email" onPress={requestEmailVerification} disabled={!token || busy} />
            <ActionButton label="Confirm email" onPress={confirmEmailVerification} disabled={busy || !verificationToken} />
          </View>
          <Text style={styles.status}>{status}</Text>
          {session ? (
            <Text style={styles.smallText}>Signed in: {session.email} · {session.email_verified ? "verified" : "not verified"}</Text>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {screens.map((item) => (
            <Pressable key={item.key} onPress={() => setScreen(item.key)} style={[styles.tab, screen === item.key && styles.activeTab]}>
              <Text style={[styles.tabText, screen === item.key && styles.activeTabText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {screen === "dashboard" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <Text style={styles.bodyText}>Start with consent and a backend patient profile. High-risk or confusing results must be reviewed by a licensed clinician.</Text>
            <View style={styles.buttonRow}>
              <ActionButton label="Record consent" onPress={recordConsent} disabled={!token || busy} />
              <ActionButton label="Sync profile" onPress={syncProfile} disabled={!token || busy} />
            </View>
          </View>
        ) : null}

        {screen === "reports" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Report Upload</Text>
            <TextInput style={styles.input} value={reportName} onChangeText={setReportName} placeholder="Report name" />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reportText}
              onChangeText={setReportText}
              placeholder="Paste readable lab/report text"
              multiline
            />
            <View style={styles.buttonRow}>
              <ActionButton label="Pick file" onPress={pickReportFile} disabled={busy} />
              <ActionButton label="Upload + analyze" onPress={uploadAndAnalyzeReport} disabled={!token || busy} />
            </View>
            {selectedReportFile ? (
              <View style={styles.fileBadge}>
                <Text style={styles.listTitle}>{selectedReportFile.name}</Text>
                <Text style={styles.smallText}>
                  {selectedReportFile.mimeType || "Unknown type"} · {selectedReportFile.size ? `${Math.round(selectedReportFile.size / 1024)} KB` : "size unavailable"}
                </Text>
              </View>
            ) : null}
            {analysis ? <Text style={styles.bodyText}>Risk: {analysis.risk_level} · Status: {analysis.status}</Text> : null}
          </View>
        ) : null}

        {screen === "labs" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Trends</Text>
            <Text style={styles.bodyText}>Save key values for visit preparation. CareWise does not diagnose; a licensed clinician should interpret your original report and reference range.</Text>
            <TextInput style={styles.input} value={labTestName} onChangeText={setLabTestName} placeholder="Test name, example LDL cholesterol" />
            <TextInput style={styles.input} value={labValue} onChangeText={setLabValue} placeholder="Value, example 142" keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={labUnit} onChangeText={setLabUnit} placeholder="Unit, example mg/dL" />
            <TextInput style={styles.input} value={labFlag} onChangeText={setLabFlag} placeholder="Flag: high, low, in_range, not_sure" autoCapitalize="none" />
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={labNotes}
              onChangeText={setLabNotes}
              placeholder="Notes or question for your clinician"
              multiline
            />
            <View style={styles.buttonRow}>
              <ActionButton label="Save lab" onPress={saveLabTrend} disabled={!token || busy} />
              <ActionButton label="Load cloud labs" onPress={loadLabTrends} disabled={!token || busy} />
            </View>
            {labTrends.length ? (
              <View style={styles.list}>
                {labTrends.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <Text style={styles.listTitle}>{item.test_name}</Text>
                    <Text style={styles.bodyText}>{item.value} {item.unit} · {item.flag} · {item.observed_on || "No date"}</Text>
                    {item.notes ? <Text style={styles.smallText}>{item.notes}</Text> : null}
                  </View>
                ))}
              </View>
            ) : <Text style={styles.smallText}>No cloud lab trends loaded yet.</Text>}
          </View>
        ) : null}

        {screen === "recommendations" ? <InfoCard title="Care Plan" lines={["Diet, habits, and exercise recommendations will use backend care-plan APIs.", "Never show AI output as a diagnosis or prescription."]} /> : null}
        {screen === "doctors" ? <InfoCard title="Doctor Search" lines={["Use location and specialty to call the doctor search API.", "Show disclaimers and let users verify provider details."]} /> : null}
        {screen === "insurance" ? <InfoCard title="Insurance Guidance" lines={["Use the insurance match API for education only.", "Do not promise coverage or exact out-of-pocket cost."]} /> : null}
        {screen === "subscriptions" ? <InfoCard title="Subscriptions" lines={["Plans come from the backend.", "Stripe Checkout opens when Stripe keys are configured."]} /> : null}
        {screen === "legal" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <Text style={styles.bodyText}>Review policies, check what CareWise has stored for your account, or request deletion. CareWise AI is not a medical diagnosis tool.</Text>
            <ActionButton label="Privacy Policy" onPress={() => Linking.openURL("https://carewise-frontend.onrender.com/legal/privacy.html")} />
            <ActionButton label="Terms" onPress={() => Linking.openURL("https://carewise-frontend.onrender.com/legal/terms.html")} />
            <ActionButton label="Medical Disclaimer" onPress={() => Linking.openURL("https://carewise-frontend.onrender.com/legal/disclaimer.html")} />
            <ActionButton label="Data Deletion" onPress={() => Linking.openURL("https://carewise-frontend.onrender.com/legal/data-deletion.html")} />
            <View style={styles.divider} />
            <Text style={styles.listTitle}>Account privacy controls</Text>
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={deletionReason}
              onChangeText={setDeletionReason}
              placeholder="Reason for deletion request"
              multiline
            />
            <View style={styles.buttonRow}>
              <ActionButton label="Export summary" onPress={loadPrivacySummary} disabled={!token || busy} />
              <ActionButton label="Request deletion" onPress={requestDataDeletion} disabled={!token || busy} />
            </View>
            {privacySummary ? (
              <View style={styles.listItem}>
                <Text style={styles.listTitle}>{privacySummary.account.email}</Text>
                <Text style={styles.bodyText}>{privacySummary.message}</Text>
                {Object.entries(privacySummary.counts).map(([key, value]) => (
                  <Text key={key} style={styles.smallText}>{key.replace(/_/g, " ")}: {value}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.disabledButton]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {lines.map((line) => <Text key={line} style={styles.bodyText}>{line}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6fbf9" },
  container: { padding: 18, gap: 14 },
  header: { paddingVertical: 12 },
  brand: { color: "#053f3c", fontSize: 36, fontWeight: "900" },
  subtitle: { color: "#60716d", fontSize: 15, fontWeight: "700" },
  card: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: "#dbe8e4", backgroundColor: "#fff", padding: 16 },
  sectionTitle: { color: "#053f3c", fontSize: 18, fontWeight: "900" },
  bodyText: { color: "#60716d", fontSize: 14, lineHeight: 20 },
  smallText: { color: "#60716d", fontSize: 12, fontWeight: "700" },
  status: { color: "#08766e", fontSize: 13, fontWeight: "800" },
  input: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: "#cbdcd5", padding: 12, backgroundColor: "#fbfffd" },
  textArea: { minHeight: 130, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 88, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { minHeight: 42, justifyContent: "center", borderRadius: 8, backgroundColor: "#08766e", paddingHorizontal: 14, paddingVertical: 8 },
  disabledButton: { backgroundColor: "#9bb8b2" },
  buttonText: { color: "#fff", fontWeight: "900" },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { borderRadius: 999, borderWidth: 1, borderColor: "#cbdcd5", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  activeTab: { borderColor: "#08766e", backgroundColor: "#e8fff8" },
  tabText: { color: "#60716d", fontWeight: "800" },
  activeTabText: { color: "#053f3c" },
  list: { gap: 8 },
  divider: { height: 1, backgroundColor: "#dbe8e4", marginVertical: 4 },
  fileBadge: { borderRadius: 8, borderWidth: 1, borderColor: "#b8e2db", backgroundColor: "#e8fff8", padding: 10 },
  listItem: { borderRadius: 8, borderWidth: 1, borderColor: "#dbe8e4", backgroundColor: "#f8fffc", padding: 10 },
  listTitle: { color: "#053f3c", fontSize: 15, fontWeight: "900" }
});
