import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  type ScrollViewInstance,
  AppState,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
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
import { buildReportView } from "./src/reportView";
import { AuthCard, SignedInCard } from "./src/AuthCard";
import { BottomTabBar, type TabItem } from "./src/TabBar";
import { colors } from "./src/theme";
import {
  REPORT_LANGUAGES,
  SAMPLE_REPORT_TEXT,
  analyzeReportTextLocally,
  buildDoctorBriefText,
  reportUiText,
  translateReportAnalysis,
  translateReportText,
  type ReportAnalysis,
  type ReportLanguage
} from "./src/reportAnalysis";
import HealthRecordScreen, { loadHealthRecord } from "./src/HealthRecordScreen";
import RemindersScreen from "./src/RemindersScreen";
import { buildHistoryBriefText, getRecordFor, normalizeRecordPerson } from "./src/healthRecord";
import { buildPersonalPlan } from "./src/personalPlan";
import { LAB_PANEL_TEXT } from "./src/labPanel";
import { SCAN_TEXT } from "./src/scanReport";
import { EarlyAccessForm, FeedbackCard } from "./src/FeedbackCard";
import { trackUsage } from "./src/productSignals";
import { HelpChat } from "./src/HelpChat";
import { buildShareSnapshot, shareViewerLink } from "./src/doctorShare";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? "https://carewise-api.onrender.com";
const PAUSE_KEY = "carewise_explanations_paused";
const ACCESS_TOKEN_KEY = "carewise.accessToken";
const REFRESH_TOKEN_KEY = "carewise.refreshToken";
const MIN_PASSWORD_LENGTH = 12;

type Screen = "dashboard" | "account" | "reports" | "record" | "labs" | "recommendations" | "doctors" | "insurance" | "subscriptions" | "legal";

// Most-used first: explain a report, keep the family record, then the account.
const screens: { key: Screen; label: string }[] = [
  { key: "reports", label: "Reports" },
  { key: "record", label: "Record" },
  { key: "labs", label: "Labs" },
  { key: "account", label: "Account" },
  { key: "recommendations", label: "Care" },
  { key: "doctors", label: "Doctors" },
  { key: "insurance", label: "Insurance" },
  { key: "subscriptions", label: "Your plan" },
  { key: "legal", label: "Legal" }
];

function passwordValidationMessage(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return "";
}

function emailValidationMessage(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Enter a valid email address.";
  }
  return "";
}

function formatApiResult(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

// The four everyday tabs sit in the bottom bar; the rest open from "More".
const PRIMARY_SCREENS: Screen[] = ["reports", "record", "labs", "account"];
const TAB_ICONS: Record<Screen, Pick<TabItem<Screen>, "icon" | "activeIcon">> = {
  reports: { icon: "document-text-outline", activeIcon: "document-text" },
  record: { icon: "heart-outline", activeIcon: "heart" },
  labs: { icon: "pulse-outline", activeIcon: "pulse" },
  account: { icon: "person-circle-outline", activeIcon: "person-circle" },
  recommendations: { icon: "leaf-outline", activeIcon: "leaf" },
  doctors: { icon: "medkit-outline", activeIcon: "medkit" },
  insurance: { icon: "shield-checkmark-outline", activeIcon: "shield-checkmark" },
  subscriptions: { icon: "ribbon-outline", activeIcon: "ribbon" },
  legal: { icon: "reader-outline", activeIcon: "reader" },
  dashboard: { icon: "home-outline", activeIcon: "home" }
};
const TAB_ITEMS: TabItem<Screen>[] = screens.filter((item) => PRIMARY_SCREENS.includes(item.key)).map((item) => ({ ...item, ...TAB_ICONS[item.key] }));
const MORE_ITEMS: TabItem<Screen>[] = screens.filter((item) => !PRIMARY_SCREENS.includes(item.key)).map((item) => ({ ...item, ...TAB_ICONS[item.key] }));

// One plain next step under the score, matched to how urgent the results are.
const NEXT_STEP = {
  en: {
    urgent: "Contact your doctor today. If you feel very unwell, seek emergency care.",
    needs_review: "Some results are well outside the lab's range. Share this report with your doctor and ask how soon they want to talk about it.",
    attention: "Bring these results up at your next visit.",
    routine: "Nothing urgent stands out. Keep this for your next checkup.",
  },
  es: {
    urgent: "Comuníquese hoy con su médico. Si se siente muy mal, busque atención de emergencia.",
    needs_review: "Algunos resultados están bastante fuera del rango del laboratorio. Comparta este informe con su médico y pregúntele cuándo quiere hablar de ello.",
    attention: "Comente estos resultados en su próxima consulta.",
    routine: "No se ve nada urgente. Guárdelo para su próximo chequeo.",
  },
} as const;

const ALL_TESTS = {
  en: (count: number, outside: number) => `${count} test${count === 1 ? "" : "s"}${outside ? ` · ${outside} outside the range` : " · all within range"}`,
  es: (count: number, outside: number) => `${count} prueba${count === 1 ? "" : "s"}${outside ? ` · ${outside} fuera del rango` : " · todas dentro del rango"}`,
};

// Long parts of a result (every test, the plan, tips) open on demand so the answer comes first.
function Expandable({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.expandable}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.expandableHeader} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }}>
        <View style={styles.flex}>
          <Text style={styles.listTitle}>{title}</Text>
          {detail ? <Text style={styles.smallText}>{detail}</Text> : null}
        </View>
        <Text style={styles.chevron}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.expandableBody}>{children}</View> : null}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("reports");
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [status, setStatus] = useState("Try the sample report, or type your results and tap Explain on this phone.");
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [session, setSession] = useState<SessionOut | null>(null);
  const [patientId, setPatientId] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportName, setReportName] = useState("mobile-report.txt");
  const [selectedReportFile, setSelectedReportFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysisOut | null>(null);
  const [localAnalysis, setLocalAnalysis] = useState<ReportAnalysis | null>(null);
  const [planReactions, setPlanReactions] = useState<string[]>([]);
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>("en");
  // Safety switch: the team can pause report explanations from the server (/features).
  // The last answer is remembered, so a phone that is offline keeps a pause in force, and the
  // switch is checked again whenever the app comes back to the foreground or explains a report.
  // Fail closed: until the app has checked the switch at least once, it explains nothing.
  const [pauseReason, setPauseReason] = useState<"" | "server" | "unverified" | "checking">("checking");
  const explanationsPaused = pauseReason !== "";
  async function refreshExplanationsPause() {
    try {
      const controller = new AbortController();
      // The API can take half a minute to wake up on its first request.
      const timer = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(`${API_BASE_URL}/features`, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`features ${response.status}`);
      const paused = (await response.json())?.report_explanations === false;
      setPauseReason(paused ? "server" : "");
      await SecureStore.setItemAsync(PAUSE_KEY, paused ? "1" : "0").catch(() => {});
    } catch {
      const stored = await SecureStore.getItemAsync(PAUSE_KEY).catch(() => null);
      setPauseReason(stored === "0" ? "" : stored === "1" ? "server" : "unverified");
    }
  }
  useEffect(() => {
    SecureStore.getItemAsync(PAUSE_KEY).then((stored) => {
      if (stored === "0") setPauseReason((reason) => (reason === "checking" || reason === "unverified" ? "" : reason));
      if (stored === "1") setPauseReason("server");
    }).catch(() => {});
    refreshExplanationsPause();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshExplanationsPause();
    });
    return () => subscription.remove();
  }, []);
  const [reportPerson, setReportPerson] = useState("");
  const [labTrends, setLabTrends] = useState<LabTrendOut[]>([]);
  const [labTestName, setLabTestName] = useState("LDL cholesterol");
  const [labValue, setLabValue] = useState("");
  const [labUnit, setLabUnit] = useState("mg/dL");
  const [labFlag, setLabFlag] = useState("not_sure");
  const [labNotes, setLabNotes] = useState("");
  const [privacySummary, setPrivacySummary] = useState<PrivacyExportSummaryOut | null>(null);
  const [deletionReason, setDeletionReason] = useState("Please delete my FollowThrough Health account data.");
  const [dietStyle, setDietStyle] = useState("balanced");
  const [careGoals, setCareGoals] = useState("Understand my report, improve daily habits, prepare doctor questions");
  const [carePlanResult, setCarePlanResult] = useState("");
  const [doctorLocation, setDoctorLocation] = useState("Austin, TX");
  const [doctorSpecialty, setDoctorSpecialty] = useState("primary care");
  const [doctorSearchResult, setDoctorSearchResult] = useState("");
  const [insuranceRegion, setInsuranceRegion] = useState("US");
  const [insuranceConditions, setInsuranceConditions] = useState("general wellness");
  const [insuranceBudget, setInsuranceBudget] = useState("medium");
  const [insuranceMatchResult, setInsuranceMatchResult] = useState("");
  const [currentPlanLabel, setCurrentPlanLabel] = useState("Free");
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
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        setStatus("Enter your email and password before creating an account.");
        return;
      }
      const emailIssue = emailValidationMessage(normalizedEmail);
      if (emailIssue) {
        setStatus(emailIssue);
        return;
      }
      const passwordIssue = passwordValidationMessage(password);
      if (passwordIssue) {
        setStatus(passwordIssue);
        return;
      }
      let response;
      try {
        response = await api.signup(normalizedEmail, password, "patient");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (/Status 4\d\d/.test(message)) {
          setStatus("There may already be an account with this email. Try Sign in instead.");
          return;
        }
        throw error;
      }
      await saveTokenPair(response);
    });
  }

  function login() {
    run("Signing in", async () => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        setStatus("Enter your email and password before signing in.");
        return;
      }
      const emailIssue = emailValidationMessage(normalizedEmail);
      if (emailIssue) {
        setStatus(emailIssue);
        return;
      }
      let response;
      try {
        response = await api.login(normalizedEmail, password);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.startsWith("Please sign in again") || /Status 4\d\d/.test(message)) {
          setStatus(message.includes("429") ? "Too many sign-in attempts. Wait a few minutes and try again." : "Email or password is incorrect.");
          return;
        }
        throw error;
      }
      if (response.two_factor_required && response.challenge) {
        setTwoFactorChallenge(response.challenge);
        setStatus("Enter the 6-digit code from your authenticator app to finish signing in.");
        return;
      }
      await saveTokenPair(response);
    });
  }

  function verifyTwoFactor() {
    run("Checking code", async () => {
      const code = twoFactorCode.trim();
      if (code.length < 6) {
        setStatus("Enter the 6-digit code from your authenticator app, or a backup code.");
        return;
      }
      try {
        const response = await api.loginTwoFactor(twoFactorChallenge, code);
        setTwoFactorChallenge("");
        setTwoFactorCode("");
        await saveTokenPair(response);
      } catch {
        setStatus("That code didn't work. Check it, or log in again if it has been more than 5 minutes.");
      }
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
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        setStatus("Enter your account email before requesting a password reset.");
        return;
      }
      const emailIssue = emailValidationMessage(normalizedEmail);
      if (emailIssue) {
        setStatus(emailIssue);
        return;
      }
      const response = await api.requestPasswordReset(normalizedEmail);
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
      const passwordIssue = passwordValidationMessage(newPassword);
      if (passwordIssue) {
        setStatus(passwordIssue);
        return;
      }
      const response = await api.confirmPasswordReset(resetToken.trim(), newPassword);
      if (response.two_factor_required && response.challenge) {
        setTwoFactorChallenge(response.challenge);
        setPassword(newPassword);
        setNewPassword("");
        setResetToken("");
        setStatus("Password changed. Enter the 6-digit code from your authenticator app to finish signing in.");
        return;
      }
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
        notes: labNotes.trim() || "Saved from FollowThrough Health mobile. Verify against the original report.",
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
      "FollowThrough Health will record a deletion request for your account. This does not replace emergency, medical, or billing support.",
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

  // App Store rule 5.1.1(v): people can delete their account from inside the app.
  function deleteAccount() {
    if (!token) {
      setStatus("Sign in to delete your account.");
      return;
    }
    Alert.alert(
      "Delete your account?",
      "This deletes your account and everything saved with it on FollowThrough Health: saved reports, health record, reminders, doctor links and plan. It cannot be undone. A plan bought outside this app is not cancelled by this; cancel it where you bought it first.",
      [
        { text: "Keep my account", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            run("Deleting your account", async () => {
              await api.deleteAccount();
              await clearStoredSession();
              api.setToken(null);
              setToken("");
              setRefreshToken("");
              setSession(null);
              setPatientId("");
              setAnalysis(null);
              setLabTrends([]);
              setPrivacySummary(null);
              setStatus("Your account and the data saved with it were deleted. Anything you kept only on this phone stays here until you remove the app.");
            });
          }
        }
      ]
    );
  }

  async function ensurePatientProfile() {
    if (patientId) return patientId;
    const profile = await api.saveProfile({
      name: "Mobile Patient",
      conditions: "General wellness planning",
      location_region: insuranceRegion.trim() || "US",
      insurance_status: "unknown"
    });
    setPatientId(profile.patient_id);
    return profile.patient_id;
  }

  function generateCarePlan() {
    run("Generating care plan", async () => {
      const activePatientId = await ensurePatientProfile();
      const goals = careGoals
        .split(",")
        .map((goal) => goal.trim())
        .filter(Boolean);
      const contextText = [
        reportText.trim(),
        analysis ? `Latest report risk level: ${analysis.risk_level}. Summary: ${formatApiResult(analysis.summary)}` : "",
        labTrends.length ? `Recent saved labs: ${labTrends.slice(0, 5).map((item) => `${item.test_name} ${item.value} ${item.unit} ${item.flag}`).join("; ")}` : ""
      ].filter(Boolean).join("\n\n") || "General wellness planning. Explain in simple, non-diagnostic language.";
      const result = await api.getRecommendations(activePatientId, contextText, dietStyle.trim() || "balanced", goals);
      setCarePlanResult(formatApiResult(result));
      setStatus("Care plan generated. Review changes with a licensed clinician before acting on medical concerns.");
    });
  }

  function searchDoctorList() {
    run("Searching doctors", async () => {
      const result = await api.searchDoctors(doctorLocation.trim() || "US", doctorSpecialty.trim() || "primary care");
      setDoctorSearchResult(formatApiResult(result));
      setStatus("Doctor search loaded. Verify network status, credentials, location, and availability directly with the provider.");
    });
  }

  function matchInsurancePlan() {
    run("Matching insurance options", async () => {
      const result = await api.matchInsurance(
        insuranceRegion.trim() || "US",
        insuranceConditions.trim() || "general wellness",
        insuranceBudget.trim() || "medium"
      );
      setInsuranceMatchResult(formatApiResult(result));
      setStatus("Insurance guidance loaded. Confirm benefits, exclusions, and costs with the insurer before enrolling.");
    });
  }

  useEffect(() => {
    if (screen !== "subscriptions" || !token) return;
    api.getMySubscription()
      .then((plan) => {
        setCurrentPlanLabel(plan.plan_name);
      })
      .catch(() => undefined);
  }, [screen, token]);

  async function pickReportFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/plain", "application/pdf", "image/*"] });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setSelectedReportFile(file);
    setReportName(file.name);
    setStatus(file.mimeType?.startsWith("image/")
      ? `${file.name} selected. To read a photo of a report on your phone, open followthroughhealth.com in your browser, or type the numbers here.`
      : `${file.name} selected. Add readable text if the file is a scanned PDF.`);
  }

  function useSampleReport() {
    setReportName("sample-blood-work.txt");
    setReportText(SAMPLE_REPORT_TEXT);
    trackUsage(API_BASE_URL, "sample_opened");
    setStatus("Sample report added. Tap Explain on this phone.");
  }

  function explainReportOnDevice() {
    refreshExplanationsPause();
    if (!reportText.trim()) {
      setStatus("Paste report text or use the sample report first.");
      return;
    }
    const analysis = analyzeReportTextLocally(reportText);
    setLocalAnalysis(analysis);
    if (!analysis.noData) trackUsage(API_BASE_URL, "report_explained");
    loadHealthRecord().then((items) =>
      setPlanReactions(getRecordFor(items, normalizeRecordPerson(reportPerson)).filter((item) => item.type === "reaction").map((item) => item.name))
    );
    setStatus("Explained on this phone. Nothing was uploaded.");
  }

  async function shareDoctorBrief() {
    if (!localAnalysis) return;
    trackUsage(API_BASE_URL, "doctor_brief_opened");
    const person = reportPerson.trim() && reportPerson.trim().toLowerCase() !== "me" ? reportPerson.trim() : "Me";
    try {
      const history = buildHistoryBriefText(await loadHealthRecord(), person);
      const brief = buildDoctorBriefText(localAnalysis, person);
      await Share.share({ title: "FollowThrough Health doctor brief", message: history ? `${brief}\n\n${history}` : brief });
    } catch {
      setStatus("Could not open the share sheet.");
    }
  }

  // Private read-only link for the doctor; needs an account so the link can be turned off.
  async function shareWithDoctor() {
    if (!localAnalysis || localAnalysis.noData) return;
    if (!token) {
      setStatus("Sign in on the Account tab to share with your doctor. Then explain the report again and tap Share with my doctor.");
      return;
    }
    const person = reportPerson.trim() && reportPerson.trim().toLowerCase() !== "me" ? reportPerson.trim() : "Me";
    try {
      const share = await api.createDoctorShare(buildShareSnapshot(localAnalysis, person, await loadHealthRecord()), 7);
      const until = new Date(share.expires_at).toLocaleDateString();
      await Share.share({
        title: "FollowThrough Health summary for my doctor",
        message: `A read-only summary of my lab results from FollowThrough Health (works until ${until}): ${shareViewerLink(share.token)}`,
      });
      setStatus(`Doctor link made. It works until ${until}; turn it off any time on the website under Profile, Doctor links.`);
    } catch {
      setStatus("The doctor link could not be made. Check your connection and try again.");
    }
  }

  const reportView = localAnalysis ? translateReportAnalysis(localAnalysis, reportLanguage) : null;
  const personalPlan = localAnalysis && !localAnalysis.scanOnly && !localAnalysis.noData ? buildPersonalPlan(localAnalysis, reportLanguage === "es" ? "es" : "en", planReactions) : null;
  const reportUi = reportUiText(reportLanguage);
  const uiText = (key: string, english: string) => (typeof reportUi?.[key] === "string" ? (reportUi[key] as string) : english);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>FollowThrough Health</Text>
          <Text style={styles.subtitle}>Your health reports, explained clearly.</Text>
        </View>

        {status ? <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text> : null}

        {screen === "account" ? (
          session ? (
            <SignedInCard
              session={session}
              busy={busy}
              onLogout={logout}
              onDeleteAccount={deleteAccount}
              onRequestVerification={requestEmailVerification}
              verificationToken={verificationToken}
              setVerificationToken={setVerificationToken}
              onConfirmVerification={confirmEmailVerification}
              onRecordConsent={recordConsent}
              onSyncProfile={syncProfile}
            />
          ) : (
            <AuthCard
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              busy={busy}
              minPasswordLength={MIN_PASSWORD_LENGTH}
              onSignIn={login}
              onSignUp={signup}
              onRequestReset={requestPasswordReset}
              resetToken={resetToken}
              setResetToken={setResetToken}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              onConfirmReset={confirmPasswordReset}
              twoFactorChallenge={twoFactorChallenge}
              twoFactorCode={twoFactorCode}
              setTwoFactorCode={setTwoFactorCode}
              onVerifyTwoFactor={verifyTwoFactor}
              onExplainWithoutAccount={() => setScreen("reports")}
            />
          )
        ) : null}


        {screen === "reports" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Explain a report</Text>
            <Text style={styles.smallText}>Type or paste the results, or try the sample. Explained on this phone; nothing is uploaded unless you choose to save it.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reportText}
              onChangeText={setReportText}
              placeholder="For example: Hemoglobin 11.2, TSH 6.8, fasting sugar 130, LDL 160"
              accessibilityLabel="Readable report text"
              multiline
            />
            <Text style={styles.listTitle}>Whose report?</Text>
            <View style={styles.buttonRow}>
              {["Me", "Mum", "Dad"].map((name) => {
                const selected = (reportPerson.trim() || "Me").toLowerCase() === name.toLowerCase();
                return (
                  <Pressable key={name} onPress={() => setReportPerson(name === "Me" ? "" : name)} style={[styles.planPill, selected && styles.activePlanPill]} accessibilityRole="button" accessibilityLabel={`Report for ${name}`} accessibilityState={{ selected }}>
                    <Text style={[styles.tabText, selected && styles.activeTabText]}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput style={styles.input} value={["mum", "dad"].includes(reportPerson.trim().toLowerCase()) ? "" : reportPerson} onChangeText={setReportPerson} placeholder="Someone else" accessibilityLabel="Whose report is this" />
            <Pressable onPress={explainReportOnDevice} disabled={busy} style={[styles.button, styles.bigButton, busy && styles.disabledButton]} accessibilityRole="button" accessibilityLabel="Explain on this phone" accessibilityState={{ disabled: busy }}>
              <Text style={styles.buttonText}>Explain on this phone</Text>
            </Pressable>
            <View style={styles.buttonRow}>
              <ActionButton label="Try sample report" onPress={useSampleReport} disabled={busy} variant="secondary" />
              <ActionButton label="Pick file" onPress={pickReportFile} disabled={busy} variant="secondary" />
              {token ? <ActionButton label="Upload + analyze" onPress={uploadAndAnalyzeReport} disabled={busy} variant="secondary" /> : null}
            </View>
            <TextInput style={styles.input} value={reportName} onChangeText={setReportName} placeholder="Report name (optional)" accessibilityLabel="Report name" />
            {selectedReportFile ? (
              <View style={styles.fileBadge}>
                <Text style={styles.listTitle}>{selectedReportFile.name}</Text>
                <Text style={styles.smallText}>
                  {selectedReportFile.mimeType || "Unknown type"} · {selectedReportFile.size ? `${Math.round(selectedReportFile.size / 1024)} KB` : "size unavailable"}
                </Text>
              </View>
            ) : null}
            {analysis ? <Text style={styles.bodyText}>Saved to your account.</Text> : null}
          </View>
        ) : null}

        {screen === "reports" && reportView && explanationsPaused ? (
          <View style={styles.card}>
            <View style={[styles.summaryBox, styles.summaryAttention]}>
              <Text style={styles.summaryHeadline}>
                {pauseReason === "checking"
                  ? reportLanguage === "es" ? "Comprobando la configuración de seguridad…" : "Checking safety settings…"
                  : pauseReason === "unverified"
                  ? reportLanguage === "es" ? "Conéctese a internet una vez" : "Connect to the internet once"
                  : reportLanguage === "es" ? "Las explicaciones están en pausa" : "Explanations are paused"}
              </Text>
              <Text style={styles.bodyText}>
                {pauseReason === "checking"
                  ? reportLanguage === "es" ? "Esto tarda unos segundos la primera vez." : "This takes a few seconds the first time."
                  : pauseReason === "unverified"
                  ? reportLanguage === "es"
                    ? "Antes de explicar informes, FollowThrough Health debe comprobar una vez su configuración de seguridad. Su informe sigue en el cuadro de texto. Conéctese a internet e inténtelo de nuevo."
                    : "Before explaining reports, FollowThrough Health needs to check its safety settings once. Your report is still in the text box. Connect to the internet and try again."
                  : reportLanguage === "es"
                    ? "Pausamos las explicaciones mientras revisamos un problema. Su informe sigue en el cuadro de texto. Hable con su médico sobre sus resultados."
                    : "We have paused explanations while we check a problem. Your report is still in the text box. Please talk to your doctor about your results."}
              </Text>
              {pauseReason === "unverified" ? <ActionButton label={reportLanguage === "es" ? "Intentar de nuevo" : "Try again"} onPress={refreshExplanationsPause} variant="secondary" /> : null}
            </View>
          </View>
        ) : null}

        {screen === "reports" && reportView && !explanationsPaused ? (() => {
          const lang = reportLanguage === "es" ? "es" : "en";
          const labText = LAB_PANEL_TEXT[lang];
          const risk = reportView.riskLevel;
          // Summary, cards, steps and All tests all come from one view built from the report rows.
          const view = localAnalysis && !localAnalysis.noData && !localAnalysis.scanOnly ? buildReportView(localAnalysis, lang, personalPlan) : null;
          const questions = [...(view?.questions || []), ...reportView.questions].filter((item, index, list) => item && list.indexOf(item) === index).slice(0, 6);
          const questionList = questions.map((item, index) => (
            <View key={item} style={styles.questionRow}>
              <Text style={styles.questionNumber}>{index + 1}</Text>
              <Text style={[styles.bodyText, styles.flex]}>{item}</Text>
            </View>
          ));
          return (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{uiText("eyebrow", "FollowThrough Health explanation")}</Text>
            {view && (view.headline || view.body.length) ? (
              <View style={[styles.summaryBox, view.urgent ? styles.summaryUrgent : view.outside || view.cards.length ? styles.summaryAttention : styles.summaryClear]}>
                <Text style={styles.summaryEyebrow}>{view.title.toUpperCase()}</Text>
                <Text style={[styles.summaryHeadline, view.urgent && styles.summaryHeadlineUrgent]}>{view.headline}</Text>
                {view.body.map((line) => <Text key={line} style={styles.bodyText}>{line}</Text>)}
                {localAnalysis && !localAnalysis.noData ? <Text style={[styles.bodyText, styles.summaryNext]}>{view.emergency ? view.text.emergencyNext : NEXT_STEP[lang][risk]}</Text> : null}
              </View>
            ) : (
              <View style={styles.verdict}>
                <Text style={styles.verdictScore}>{localAnalysis?.noData ? "—" : SCAN_TEXT[lang].scoreLabel}</Text>
                <Text style={styles.verdictLabel}>
                  {localAnalysis?.noData
                    ? translateReportText("No results found", reportLanguage)
                    : translateReportText(risk === "urgent" ? "Urgent review" : risk === "needs_review" ? "Clinician review" : risk === "attention" ? "Needs attention" : "Routine follow-up", reportLanguage)}
                </Text>
              </View>
            )}
            {localAnalysis && !localAnalysis.noData && !(view && (view.headline || view.body.length)) ? (
              <Text style={[styles.nextStep, risk === "urgent" ? styles.nextUrgent : risk === "needs_review" ? styles.nextReview : risk === "attention" ? styles.nextAttention : styles.nextRoutine]}>
                {NEXT_STEP[lang][risk]}
              </Text>
            ) : null}
            <View style={styles.buttonRow}>
              <ActionButton label={uiText("doctorBrief", "Doctor brief")} onPress={shareDoctorBrief} />
              <ActionButton label={reportLanguage === "es" ? "Compartir con mi médico" : "Share with my doctor"} onPress={shareWithDoctor} variant="secondary" />
              {(Object.keys(REPORT_LANGUAGES) as ReportLanguage[]).map((code) => (
                <Pressable
                  key={code}
                  onPress={() => {
                    if (code === "es" && reportLanguage !== "es") trackUsage(API_BASE_URL, "spanish_used");
                    setReportLanguage(code);
                  }}
                  style={[styles.planPill, reportLanguage === code && styles.activePlanPill]}
                  accessibilityRole="button"
                  accessibilityLabel={`Show report in ${REPORT_LANGUAGES[code]}`}
                  accessibilityState={{ selected: reportLanguage === code }}
                >
                  <Text style={[styles.tabText, reportLanguage === code && styles.activeTabText]}>{REPORT_LANGUAGES[code]}</Text>
                </Pressable>
              ))}
            </View>
            {uiText("draftNotice", "") ? <Text style={styles.smallText}>{uiText("draftNotice", "")}</Text> : null}
            {view?.cards.length ? <Text style={styles.listTitle}>{view.text.attentionTitle}</Text> : null}
            {view?.cards.map((card) => (
              <View key={card.key} style={[styles.resultCard, card.tone === "critical" ? styles.resultCardCritical : card.tone === "goal" ? styles.resultCardGoal : null]}>
                <View style={styles.resultCardHead}>
                  <Text style={[styles.listTitle, styles.flex]}>{card.name}</Text>
                  <Text style={[styles.resultCardLabel, card.tone === "critical" && styles.resultCardLabelCritical]}>{card.label}</Text>
                </View>
                <Text style={styles.resultCardValue}>{card.value}</Text>
                {card.unitHint ? <Text style={styles.smallText}>{card.unitHint}</Text> : null}
                <Text style={styles.smallText}>{card.rangeLabel}: {card.range || view.text.noRangePrinted}</Text>
                {card.note ? <Text style={styles.smallText}>{card.note}</Text> : null}
                {card.what ? <><Text style={styles.resultCardQuestion}>{view.text.whatIs}</Text><Text style={styles.bodyText}>{card.what}</Text></> : null}
                {card.meaning ? <><Text style={styles.resultCardQuestion}>{view.text.whatMeans}</Text><Text style={styles.bodyText}>{card.meaning}</Text></> : null}
                {card.ask ? <><Text style={styles.resultCardQuestion}>{view.text.askDoctor}</Text><Text style={[styles.bodyText, styles.resultCardAsk]}>“{card.ask}”</Text></> : null}
              </View>
            ))}
            {view?.other.length ? <Text style={styles.listTitle}>{view.text.otherTitle}</Text> : null}
            {view?.other.map((item) => (
              <View key={item.key} style={[styles.resultCard, styles.resultCardOther, item.tone === "out" ? styles.resultCardGoal : item.tone === "critical" ? styles.resultCardCritical : null]}>
                <View style={styles.resultCardHead}>
                  <Text style={[styles.listTitle, styles.flex]}>{item.name}</Text>
                  <Text style={styles.resultCardLabel}>{item.label}</Text>
                </View>
                <Text style={styles.resultCardValue}>{item.value}</Text>
                <Text style={styles.smallText}>{item.note}</Text>
                {item.what ? <><Text style={styles.resultCardQuestion}>{view.text.whatIs}</Text><Text style={styles.bodyText}>{item.what}</Text></> : null}
                {item.meaning ? <><Text style={styles.resultCardQuestion}>{view.text.whatMeans}</Text><Text style={styles.bodyText}>{item.meaning}</Text></> : null}
                {item.ask ? <><Text style={styles.resultCardQuestion}>{view.text.askDoctor}</Text><Text style={[styles.bodyText, styles.resultCardAsk]}>“{item.ask}”</Text></> : null}
              </View>
            ))}
            {view && personalPlan ? (
              <View style={styles.planBox}>
                <Text style={styles.sectionTitle}>{view.text.stepsTitle}</Text>
                {view.steps.map((step, index) => (
                  <View key={step.title} style={styles.questionRow}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                    <View style={styles.flex}>
                      <Text style={styles.listTitle}>{step.title}</Text>
                      <Text style={styles.bodyText}>{step.body}</Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.smallText}>{view.text.stepsNote}</Text>
                {view.more.length ? (
                  <Expandable title={view.text.moreIdeas} detail={String(view.more.reduce((total, group) => total + group.items.length, 0))}>
                    {view.more.map((group) => (
                      <View key={group.title}>
                        <Text style={styles.resultCardQuestion}>{group.title}</Text>
                        {group.items.map((item) => <Text key={item} style={styles.bodyText}>• {item}</Text>)}
                      </View>
                    ))}
                  </Expandable>
                ) : null}
              </View>
            ) : null}
            {view?.cards.length ? (
              <Expandable title={uiText("questions", "Questions to ask your doctor")} detail={String(questions.length)}>{questionList}</Expandable>
            ) : (
              <>
                <Text style={styles.listTitle}>{uiText("questions", "Questions to ask your doctor")}</Text>
                {questionList}
              </>
            )}
            {!view?.tests.length && !localAnalysis?.scanOnly ? (
              <>
                <Text style={styles.listTitle}>{uiText("keyFindings", "Key findings")}</Text>
                {reportView.findings.map((item) => (
                  <View key={`${item.label}-${item.detail}`} style={styles.listItem}>
                    <Text style={styles.findingTitle}>{item.label}</Text>
                    <Text style={styles.bodyText}>{item.level}. {item.detail}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {localAnalysis?.scan ? (() => {
              const scan = localAnalysis.scan[lang];
              const t = SCAN_TEXT[lang];
              return (
                <View style={styles.planBox}>
                  <Text style={styles.sectionTitle}>{t.title}{scan.modality ? ` · ${scan.modality}` : ""}</Text>
                  <Text style={styles.smallText}>{t.notice}</Text>
                  {scan.critical ? (
                    <View style={[styles.planCard, styles.planUrgent]}>
                      <Text style={styles.listTitle}>{t.critical}</Text>
                    </View>
                  ) : null}
                  <View style={styles.planCard}>
                    <Text style={styles.listTitle}>{t.impression}</Text>
                    <Text style={styles.bodyText}>{scan.impression || t.noImpression}</Text>
                  </View>
                  {scan.followUps.length ? (
                    <View style={[styles.planCard, styles.planSafety]}>
                      <Text style={styles.listTitle}>{t.ask}</Text>
                      <Text style={styles.smallText}>{t.askIntro}</Text>
                      {scan.followUps.map((item) => (
                        <Text key={item.sentence} style={styles.bodyText}>• "{item.sentence}"</Text>
                      ))}
                    </View>
                  ) : null}
                  {scan.terms.length ? (
                    <View style={styles.planCard}>
                      <Text style={styles.listTitle}>{t.terms}</Text>
                      {scan.terms.map((item) => (
                        <Text key={item.term} style={styles.bodyText}>
                          <Text style={styles.listTitle}>{item.term}: </Text>
                          {item.meaning}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })() : null}
            {view?.tests.length ? (
              <Expandable title={labText.title} detail={ALL_TESTS[lang](view.tests.length, view.outside)}>
                <Text style={styles.smallText}>{view.text.allTestsNote}</Text>
                {view.tests.map((item) => (
                  <View key={item.key} style={[styles.listItem, item.status === "critical" && styles.planUrgent]}>
                    <Text style={styles.listTitle}>{item.name}: {item.value}</Text>
                    {item.unitHint ? <Text style={styles.smallText}>{item.unitHint}</Text> : null}
                    <Text style={[styles.smallText, item.attention && styles.labFlagText]}>
                      {item.label} · {labText.range}: {item.range || labText.noRange}
                    </Text>
                    {item.what ? <Text style={styles.bodyText}>{item.what}</Text> : null}
                  </View>
                ))}
              </Expandable>
            ) : null}
            {reportView.labValues.length ? (
              <Expandable title={uiText("detectedValues", "Detected values")}>
                <View style={styles.valueGrid}>
                  {reportView.labValues.map((item) => (
                    <View key={item.label} style={styles.valueTile}>
                      <Text style={styles.smallText}>{item.label}</Text>
                      <Text style={styles.valueNumber}>{item.value} <Text style={styles.smallText}>{item.unit}</Text></Text>
                    </View>
                  ))}
                </View>
              </Expandable>
            ) : null}
            {localAnalysis && !localAnalysis.noData ? <FeedbackCard key={localAnalysis.id} baseUrl={API_BASE_URL} language={lang} /> : null}
            <Text style={styles.smallText}>
              {uiText("safetyText", "This is not a diagnosis or treatment plan. A licensed professional should interpret your original report with your full history.")}
            </Text>
          </View>
          );
        })() : null}

        {screen === "record" ? <HealthRecordScreen extraPeople={reportPerson.trim() ? [reportPerson] : []} /> : null}
        {screen === "record" ? <RemindersScreen api={api} signedIn={Boolean(token)} /> : null}

        {screen === "labs" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Trends</Text>
            <Text style={styles.bodyText}>Save key values for visit preparation. FollowThrough Health does not diagnose; a licensed clinician should interpret your original report and reference range.</Text>
            <TextInput style={styles.input} value={labTestName} onChangeText={setLabTestName} placeholder="Test name, example LDL cholesterol" accessibilityLabel="Lab test name" />
            <TextInput style={styles.input} value={labValue} onChangeText={setLabValue} placeholder="Value, example 142" accessibilityLabel="Lab value" keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={labUnit} onChangeText={setLabUnit} placeholder="Unit, example mg/dL" accessibilityLabel="Lab unit" />
            <TextInput style={styles.input} value={labFlag} onChangeText={setLabFlag} placeholder="Flag: high, low, in_range, not_sure" accessibilityLabel="Lab flag" autoCapitalize="none" />
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={labNotes}
              onChangeText={setLabNotes}
              placeholder="Notes or question for your clinician"
              accessibilityLabel="Lab notes or clinician question"
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

        {screen === "recommendations" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Care Plan</Text>
            <Text style={styles.bodyText}>Generate simple wellness suggestions from your report context, saved labs, and goals. This is not a diagnosis or prescription.</Text>
            <TextInput style={styles.input} value={dietStyle} onChangeText={setDietStyle} placeholder="Diet style: balanced, vegetarian, vegan, pescatarian" accessibilityLabel="Diet style" />
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={careGoals}
              onChangeText={setCareGoals}
              placeholder="Goals separated by commas"
              accessibilityLabel="Care goals"
              multiline
            />
            <ActionButton label="Generate care plan" onPress={generateCarePlan} disabled={!token || busy} />
            {carePlanResult ? <Text style={styles.resultBox}>{carePlanResult}</Text> : <Text style={styles.smallText}>Upload a report first for more relevant guidance.</Text>}
          </View>
        ) : null}
        {screen === "doctors" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Doctor Search</Text>
            <Text style={styles.bodyText}>Search by location and specialty. FollowThrough Health can suggest what type of clinician to discuss findings with, but provider details must be verified directly.</Text>
            <TextInput style={styles.input} value={doctorLocation} onChangeText={setDoctorLocation} placeholder="Location, example Austin, TX" accessibilityLabel="Doctor search location" />
            <TextInput style={styles.input} value={doctorSpecialty} onChangeText={setDoctorSpecialty} placeholder="Specialty, example cardiology" accessibilityLabel="Doctor search specialty" />
            <ActionButton label="Search doctors" onPress={searchDoctorList} disabled={!token || busy} />
            {doctorSearchResult ? <Text style={styles.resultBox}>{doctorSearchResult}</Text> : <Text style={styles.smallText}>Results depend on the backend provider data configured for launch.</Text>}
          </View>
        ) : null}
        {screen === "insurance" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Insurance Guidance</Text>
            <Text style={styles.bodyText}>Compare educational coverage fit. FollowThrough Health does not guarantee eligibility, coverage, claim approval, or exact out-of-pocket costs.</Text>
            <TextInput style={styles.input} value={insuranceRegion} onChangeText={setInsuranceRegion} placeholder="Region, example US or Texas" accessibilityLabel="Insurance region" />
            <TextInput style={styles.input} value={insuranceConditions} onChangeText={setInsuranceConditions} placeholder="Health context, example high LDL" accessibilityLabel="Insurance health context" />
            <TextInput style={styles.input} value={insuranceBudget} onChangeText={setInsuranceBudget} placeholder="Budget level: low, medium, high" accessibilityLabel="Insurance budget level" autoCapitalize="none" />
            <ActionButton label="Match insurance" onPress={matchInsurancePlan} disabled={!token || busy} />
            {insuranceMatchResult ? <Text style={styles.resultBox}>{insuranceMatchResult}</Text> : <Text style={styles.smallText}>Keep this as education until licensed insurance review is ready.</Text>}
          </View>
        ) : null}
        {screen === "subscriptions" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your plan</Text>
            <Text style={styles.bodyText}>Everything in this app is free to use: explaining reports, the doctor brief, your health record, reminders and the help chat. Nothing is sold in this app.</Text>
            {token ? <Text style={styles.smallText}>Your account: {currentPlanLabel}</Text> : null}
            <EarlyAccessForm baseUrl={API_BASE_URL} language={reportLanguage === "es" ? "es" : "en"} />
          </View>
        ) : null}
        {screen === "legal" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <Text style={styles.bodyText}>Review policies, check what FollowThrough Health has stored for your account, or request deletion. FollowThrough Health is not a medical diagnosis tool.</Text>
            <ActionButton label="Privacy Policy" onPress={() => Linking.openURL("https://followthroughhealth.com/legal/privacy.html")} />
            <ActionButton label="Terms" onPress={() => Linking.openURL("https://followthroughhealth.com/legal/terms.html")} />
            <ActionButton label="Medical Disclaimer" onPress={() => Linking.openURL("https://followthroughhealth.com/legal/disclaimer.html")} />
            <ActionButton label="Data Deletion" onPress={() => Linking.openURL("https://followthroughhealth.com/legal/data-deletion.html")} />
            <View style={styles.divider} />
            <Text style={styles.listTitle}>Account privacy controls</Text>
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={deletionReason}
              onChangeText={setDeletionReason}
              placeholder="Reason for deletion request"
              accessibilityLabel="Reason for data deletion request"
              multiline
            />
            <View style={styles.buttonRow}>
              <ActionButton label="Export summary" onPress={loadPrivacySummary} disabled={!token || busy} />
              <ActionButton label="Request deletion" onPress={requestDataDeletion} disabled={!token || busy} />
            </View>
            <ActionButton label="Delete my account now" onPress={deleteAccount} disabled={!token || busy} />
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
      <BottomTabBar
        items={TAB_ITEMS}
        moreItems={MORE_ITEMS}
        current={screen}
        onSelect={(next) => {
          setScreen(next);
          scrollRef.current?.scrollTo({ y: 0, animated: false });
        }}
      />
      <HelpChat
        baseUrl={API_BASE_URL}
        language={reportLanguage === "es" ? "es" : "en"}
        reportSummary={localAnalysis && !localAnalysis.noData ? buildDoctorBriefText(localAnalysis, reportPerson.trim() || "Me") : ""}
        analysis={localAnalysis}
      />
    </SafeAreaView>
  );
}

// One primary (black) action per screen; "secondary" buttons are outlined.
function ActionButton({ label, onPress, disabled = false, variant = "primary" }: { label: string; onPress: () => void; disabled?: boolean; variant?: "primary" | "secondary" }) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, secondary && styles.secondaryButton, disabled && (secondary ? styles.disabledSecondary : styles.disabledButton)]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

// Same look as the website: warm paper, white rounded cards, black pill buttons.
const INK = colors.ink;
const SOFT = colors.ink2;
const LINE = colors.line;
const PAPER = colors.bg;
const TEAL = colors.brand;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAPER },
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  header: { paddingTop: 10, paddingBottom: 4, gap: 4 },
  brand: { color: INK, fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: SOFT, fontSize: 15, lineHeight: 21 },
  card: { gap: 14, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: colors.surface, padding: 20 },
  eyebrow: { color: SOFT, fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  sectionTitle: { color: INK, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  bodyText: { color: SOFT, fontSize: 16, lineHeight: 23 },
  smallText: { color: colors.ink3, fontSize: 14, lineHeight: 20 },
  linkText: { color: TEAL, fontSize: 15, fontWeight: "700", paddingVertical: 8, textDecorationLine: "underline" },
  status: { color: INK, fontSize: 14, fontWeight: "600", lineHeight: 20, backgroundColor: colors.infoSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, overflow: "hidden" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, color: INK, fontSize: 16 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 88, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: 999, backgroundColor: TEAL, paddingHorizontal: 20, paddingVertical: 10 },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  secondaryButtonText: { color: INK },
  disabledSecondary: { opacity: 0.45 },
  bigButton: { alignSelf: "stretch", alignItems: "center", minHeight: 52 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 4, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(255,255,255,0.6)" },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  activeTab: { backgroundColor: TEAL },
  tabText: { color: SOFT, fontWeight: "700", fontSize: 14 },
  activeTabText: { color: "#fff" },
  planPill: { minHeight: 44, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10 },
  activePlanPill: { borderColor: TEAL, backgroundColor: TEAL },
  list: { gap: 8 },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 4 },
  fileBadge: { borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: "#fbf9f5", padding: 12 },
  listItem: { gap: 4, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#fbf9f5", padding: 12 },
  resultBox: { color: "#3f4342", fontSize: 13, lineHeight: 19, borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: "#fbf9f5", padding: 12 },
  listTitle: { color: INK, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  findingTitle: { color: TEAL, fontSize: 15, fontWeight: "700" },
  planBox: { gap: 10, marginTop: 6 },
  planCard: { gap: 6, borderRadius: 16, borderWidth: 1, borderColor: LINE, borderTopWidth: 3, borderTopColor: TEAL, padding: 12, backgroundColor: "#fff" },
  planSafety: { borderTopColor: "#c2552d", backgroundColor: "#fdf8f5" },
  planUrgent: { borderTopColor: "#b91c1c", backgroundColor: "#fdf2f2" },
  labFlagText: { color: "#9a3412" },
  flex: { flex: 1 },
  verdict: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: "#fbf9f5", paddingHorizontal: 16, paddingVertical: 12 },
  verdictScore: { color: INK, fontSize: 44, fontWeight: "800", letterSpacing: -1.5 },
  summaryBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, marginBottom: 8 },
  summaryAttention: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  summaryUrgent: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  summaryClear: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  summaryEyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1, color: SOFT },
  summaryHeadline: { fontSize: 21, fontWeight: "700", color: "#14302c", lineHeight: 27 },
  summaryHeadlineUrgent: { color: "#991b1b" },
  summaryNext: { fontWeight: "700", marginTop: 4 },
  resultCardOther: { borderLeftColor: "#64748b" },
  resultCard: { borderWidth: 1, borderColor: "#e5ded3", borderLeftWidth: 5, borderLeftColor: "#d97706", borderRadius: 14, padding: 14, gap: 4, marginBottom: 10, backgroundColor: "#fff" },
  resultCardCritical: { borderLeftColor: "#b91c1c", backgroundColor: "#fffafa" },
  resultCardGoal: { borderLeftColor: "#ca8a04" },
  resultCardHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  resultCardLabel: { fontSize: 14, fontWeight: "700", color: "#9a3b17", flexShrink: 1, textAlign: "right" },
  resultCardLabelCritical: { color: "#b91c1c" },
  resultCardValue: { fontSize: 20, fontWeight: "700", color: "#14302c" },
  resultCardQuestion: { marginTop: 8, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: SOFT, textTransform: "uppercase" },
  resultCardAsk: { fontWeight: "600" },
  verdictOutOf: { color: SOFT, fontSize: 15, fontWeight: "600", letterSpacing: 0 },
  verdictLabel: { color: INK, fontSize: 15, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  nextStep: { borderRadius: 16, borderWidth: 1, padding: 14, fontSize: 16, lineHeight: 22, fontWeight: "700" },
  nextUrgent: { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" },
  nextReview: { backgroundColor: "#fff1e6", borderColor: "#fed7aa", color: "#9a3412" },
  nextAttention: { backgroundColor: "#fefce8", borderColor: "#fde68a", color: "#854d0e" },
  nextRoutine: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" },
  questionRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  questionNumber: { width: 26, height: 26, borderRadius: 13, overflow: "hidden", backgroundColor: INK, color: "#fff", textAlign: "center", lineHeight: 26, fontWeight: "700", fontSize: 13 },
  valueGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  valueTile: { flexGrow: 1, flexBasis: "45%", gap: 2, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", padding: 12 },
  valueNumber: { color: INK, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  expandable: { borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: "#fbf9f5", overflow: "hidden" },
  expandableHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, minHeight: 56 },
  expandableBody: { gap: 10, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff" },
  chevron: { color: INK, fontSize: 22, fontWeight: "600", width: 24, textAlign: "center" }
});
