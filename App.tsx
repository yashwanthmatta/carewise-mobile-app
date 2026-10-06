import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { buildHistoryBriefText, getRecordFor, normalizeRecordPerson } from "./src/healthRecord";
import { buildPersonalPlan } from "./src/personalPlan";
import { LAB_PANEL_TEXT, labTestInfo } from "./src/labPanel";
import { SCAN_TEXT } from "./src/scanReport";
import { EarlyAccessForm, FeedbackCard } from "./src/FeedbackCard";
import { trackUsage } from "./src/productSignals";
import { HelpChat } from "./src/HelpChat";
import { buildShareSnapshot, shareViewerLink } from "./src/doctorShare";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? "https://carewise-api.onrender.com";
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
  { key: "subscriptions", label: "Plans" },
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

function getCheckoutUrl(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const candidate = value as { checkout_url?: unknown; url?: unknown };
  if (typeof candidate.checkout_url === "string") return candidate.checkout_url;
  if (typeof candidate.url === "string") return candidate.url;
  return "";
}

// Plan codes stay stable on the server; these are the names and prices people see.
const PLAN_LABELS = { basic: "Free", plus: "Plus $7/mo", premium: "Family $12/mo" } as const;

// The four everyday tabs; the rest sit behind "More".
const PRIMARY_SCREENS: Screen[] = ["reports", "record", "labs", "account"];

// One plain next step under the score, matched to how urgent the results are.
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
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
  const [reportPerson, setReportPerson] = useState("");
  const [labTrends, setLabTrends] = useState<LabTrendOut[]>([]);
  const [labTestName, setLabTestName] = useState("LDL cholesterol");
  const [labValue, setLabValue] = useState("");
  const [labUnit, setLabUnit] = useState("mg/dL");
  const [labFlag, setLabFlag] = useState("not_sure");
  const [labNotes, setLabNotes] = useState("");
  const [privacySummary, setPrivacySummary] = useState<PrivacyExportSummaryOut | null>(null);
  const [deletionReason, setDeletionReason] = useState("Please delete my CareWise account data.");
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
  const [planCode, setPlanCode] = useState<"basic" | "plus" | "premium">("basic");
  const [subscriptionResult, setSubscriptionResult] = useState("");
  const [currentPlanLabel, setCurrentPlanLabel] = useState("Free");
  const [canManageBilling, setCanManageBilling] = useState(false);
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
      const response = await api.signup(normalizedEmail, password, "patient");
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
      const response = await api.login(normalizedEmail, password);
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
        setCurrentPlanLabel(`${plan.plan_name}${plan.status === "past_due" ? " (payment due)" : ""}`);
        setCanManageBilling(Boolean(plan.can_manage_billing));
      })
      .catch(() => undefined);
  }, [screen, token]);

  function openBillingPortal() {
    run("Opening billing page", async () => {
      const result = await api.openBillingPortal();
      if (result.portal_url.startsWith("https://billing.stripe.com/")) await Linking.openURL(result.portal_url);
    });
  }

  function startSubscriptionCheckout() {
    run("Starting plan checkout", async () => {
      const result = await api.createSubscriptionCheckout(planCode);
      const checkoutUrl = getCheckoutUrl(result);
      setSubscriptionResult(formatApiResult(result));
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
        setStatus("Checkout opened. Payment processing is handled outside CareWise by the configured provider.");
        return;
      }
      setStatus("Plan request completed. Checkout is not configured yet for this environment.");
    });
  }

  async function pickReportFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/plain", "application/pdf", "image/*"] });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setSelectedReportFile(file);
    setReportName(file.name);
    setStatus(file.mimeType?.startsWith("image/")
      ? `${file.name} selected. To read a photo of a report on your phone, open carewise-frontend.onrender.com in your browser, or type the numbers here.`
      : `${file.name} selected. Add readable text if the file is a scanned PDF.`);
  }

  function useSampleReport() {
    setReportName("sample-blood-work.txt");
    setReportText(SAMPLE_REPORT_TEXT);
    trackUsage(API_BASE_URL, "sample_opened");
    setStatus("Sample report added. Tap Explain on this phone.");
  }

  function explainReportOnDevice() {
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
      await Share.share({ title: "CareWise doctor brief", message: history ? `${brief}\n\n${history}` : brief });
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
        title: "CareWise summary for my doctor",
        message: `A read-only summary of my lab results from CareWise (works until ${until}): ${shareViewerLink(share.token)}`,
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>CareWise</Text>
          <Text style={styles.subtitle}>Understand your health reports in simple English.</Text>
        </View>

        <View style={styles.tabs}>
          {screens.filter((item) => showMoreTabs || PRIMARY_SCREENS.includes(item.key) || item.key === screen).map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setScreen(item.key)}
              style={[styles.tab, screen === item.key && styles.activeTab]}
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} tab`}
              accessibilityState={{ selected: screen === item.key }}
            >
              <Text style={[styles.tabText, screen === item.key && styles.activeTabText]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setShowMoreTabs((value) => !value)} style={styles.tab} accessibilityRole="button" accessibilityLabel={showMoreTabs ? "Fewer tabs" : "More tabs"} accessibilityState={{ expanded: showMoreTabs }}>
            <Text style={styles.tabText}>{showMoreTabs ? "Less" : "More"}</Text>
          </Pressable>
        </View>

        {status ? <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text> : null}

        {screen === "account" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.bodyText}>An account is optional. Reports are explained on this phone without one; sign in to sync history across devices.</Text>
            {session ? (
              <>
                <Text style={styles.bodyText}>Signed in: {session.email} · {session.email_verified ? "verified" : "not verified"}</Text>
                <View style={styles.buttonRow}>
                  <ActionButton label="Logout" onPress={logout} disabled={!token || busy} />
                  <ActionButton label="Refresh" onPress={refreshSession} disabled={!refreshToken || busy} />
                </View>
                {!session.email_verified ? (
                  <View style={styles.list}>
                    <Text style={styles.listTitle}>Verify your email</Text>
                    <ActionButton label="Verify email" onPress={requestEmailVerification} disabled={!token || busy} />
                    <TextInput style={styles.input} value={verificationToken} onChangeText={setVerificationToken} placeholder="Email verification token" accessibilityLabel="Email verification token" autoCapitalize="none" />
                    <ActionButton label="Confirm email" onPress={confirmEmailVerification} disabled={busy || !verificationToken} />
                  </View>
                ) : null}
                <View style={styles.list}>
                  <Text style={styles.listTitle}>Sync with CareWise</Text>
                  <Text style={styles.smallText}>Record consent and create your profile before saving reports and labs to the cloud.</Text>
                  <View style={styles.buttonRow}>
                    <ActionButton label="Record consent" onPress={recordConsent} disabled={!token || busy} />
                    <ActionButton label="Sync profile" onPress={syncProfile} disabled={!token || busy} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" accessibilityLabel="Email address" autoCapitalize="none" keyboardType="email-address" />
                <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" accessibilityLabel="Password" secureTextEntry />
                <Text style={styles.smallText}>Use at least {MIN_PASSWORD_LENGTH} characters. Do not reuse passwords from email, banking, or medical portals.</Text>
                <View style={styles.buttonRow}>
                  <ActionButton label="Sign up" onPress={signup} disabled={busy} />
                  <ActionButton label="Login" onPress={login} disabled={busy} />
                </View>
                <Pressable onPress={() => setShowPasswordReset((value) => !value)} accessibilityRole="button" accessibilityLabel="Forgot password?">
                  <Text style={styles.linkText}>{showPasswordReset ? "Hide password reset" : "Forgot password?"}</Text>
                </Pressable>
                {showPasswordReset ? (
                  <View style={styles.list}>
                    <ActionButton label="Request reset" onPress={requestPasswordReset} disabled={busy} />
                    <TextInput style={styles.input} value={resetToken} onChangeText={setResetToken} placeholder="Reset token from email" accessibilityLabel="Password reset token" autoCapitalize="none" />
                    <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New password" accessibilityLabel="New password" secureTextEntry />
                    <ActionButton label="Confirm reset" onPress={confirmPasswordReset} disabled={busy || !resetToken || !newPassword} />
                  </View>
                ) : null}
              </>
            )}
          </View>
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
            {analysis ? <Text style={styles.bodyText}>Risk: {analysis.risk_level} · Status: {analysis.status}</Text> : null}
          </View>
        ) : null}

        {screen === "reports" && reportView ? (() => {
          const lang = reportLanguage === "es" ? "es" : "en";
          const labText = LAB_PANEL_TEXT[lang];
          const panel = localAnalysis?.panelResults || [];
          const outside = panel.filter((item) => item.status !== "within" && item.status !== "unknown").length;
          const risk = reportView.riskLevel;
          return (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{uiText("eyebrow", "CareWise explanation")}</Text>
            <View style={styles.verdict}>
              <Text style={styles.verdictScore}>
                {localAnalysis?.noData ? "—" : localAnalysis?.scanOnly ? SCAN_TEXT[lang].scoreLabel : String(reportView.score)}
                {localAnalysis?.noData || localAnalysis?.scanOnly ? null : <Text style={styles.verdictOutOf}> /100</Text>}
              </Text>
              <Text style={styles.verdictLabel}>
                {localAnalysis?.noData
                  ? translateReportText("No results found", reportLanguage)
                  : translateReportText(risk === "urgent" ? "Urgent review" : risk === "needs_review" ? "Clinician review" : risk === "attention" ? "Needs attention" : "Routine follow-up", reportLanguage)}
              </Text>
            </View>
            {localAnalysis && !localAnalysis.noData ? (
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
            <Text style={styles.listTitle}>{uiText("questions", "Questions to ask your doctor")}</Text>
            {reportView.questions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <Text style={styles.questionNumber}>{index + 1}</Text>
                <Text style={[styles.bodyText, styles.flex]}>{item}</Text>
              </View>
            ))}
            <Text style={styles.listTitle}>{uiText("keyFindings", "Key findings")}</Text>
            {reportView.findings.map((item) => (
              <View key={`${item.label}-${item.detail}`} style={styles.listItem}>
                <Text style={styles.findingTitle}>{item.label}</Text>
                <Text style={styles.bodyText}>{item.level}. {item.detail}</Text>
              </View>
            ))}
            {reportView.labValues.length ? <Text style={styles.listTitle}>{uiText("detectedValues", "Detected values")}</Text> : null}
            {reportView.labValues.length ? (
              <View style={styles.valueGrid}>
                {reportView.labValues.map((item) => (
                  <View key={item.label} style={styles.valueTile}>
                    <Text style={styles.smallText}>{item.label}</Text>
                    <Text style={styles.valueNumber}>{item.value} <Text style={styles.smallText}>{item.unit}</Text></Text>
                    <Text style={styles.smallText}>{item.flag}</Text>
                  </View>
                ))}
              </View>
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
            {panel.length ? (
              <Expandable title={labText.title} detail={ALL_TESTS[lang](panel.length, outside)}>
                <Text style={styles.smallText}>{labText.note}</Text>
                {panel.map((item) => {
                  const t = labText;
                  const info = labTestInfo(item.key);
                  const flagged = item.status !== "within" && item.status !== "unknown";
                  return (
                    <View key={item.key} style={[styles.listItem, item.status === "critical" && styles.planUrgent]}>
                      <Text style={styles.listTitle}>
                        {reportLanguage === "es" && info ? info.es : item.name}: {`${item.valueText} ${item.unit}`.trim()}
                      </Text>
                      <Text style={[styles.smallText, flagged && styles.labFlagText]}>
                        {t[`status_${item.status}` as keyof typeof t]} · {t.range}: {item.rangeText || t.noRange}
                      </Text>
                      {info ? <Text style={styles.bodyText}>{reportLanguage === "es" ? info.whatEs : info.what}</Text> : null}
                    </View>
                  );
                })}
              </Expandable>
            ) : null}
            {personalPlan ? (
              <Expandable title={personalPlan.title}>
                {personalPlan.sections.map((section) => (
                  <View key={section.key} style={[styles.planCard, section.key === "safety" && styles.planSafety, personalPlan.urgent && section.key === "move" && styles.planUrgent]}>
                    <Text style={styles.listTitle}>{section.title}</Text>
                    {section.items.map((item, index) => {
                      const next = section.items[index + 1];
                      const note = next && next.why === item.why && next.source === item.source
                        ? ""
                        : [item.why ? `${personalPlan.whyLabel}: ${item.why}` : "", item.source ? `${personalPlan.sourceLabel}: ${item.source}` : ""].filter(Boolean).join(" · ");
                      return (
                        <View key={`${section.key}-${index}`}>
                          <Text style={styles.bodyText}>• {item.text}</Text>
                          {note ? <Text style={styles.smallText}>{note}</Text> : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </Expandable>
            ) : null}
            <Expandable title={uiText("suggestions", "Wellness suggestions")}>
              {reportView.suggestions.map((item) => (
                <Text key={item} style={styles.bodyText}>• {item}</Text>
              ))}
            </Expandable>
            {localAnalysis && !localAnalysis.noData ? <FeedbackCard key={localAnalysis.id} baseUrl={API_BASE_URL} language={lang} /> : null}
            <Text style={styles.smallText}>
              {uiText("safetyText", "This is not a diagnosis or treatment plan. A licensed professional should interpret your original report with your full history.")}
            </Text>
          </View>
          );
        })() : null}

        {screen === "record" ? <HealthRecordScreen extraPeople={reportPerson.trim() ? [reportPerson] : []} /> : null}

        {screen === "labs" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Trends</Text>
            <Text style={styles.bodyText}>Save key values for visit preparation. CareWise does not diagnose; a licensed clinician should interpret your original report and reference range.</Text>
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
            <Text style={styles.bodyText}>Search by location and specialty. CareWise can suggest what type of clinician to discuss findings with, but provider details must be verified directly.</Text>
            <TextInput style={styles.input} value={doctorLocation} onChangeText={setDoctorLocation} placeholder="Location, example Austin, TX" accessibilityLabel="Doctor search location" />
            <TextInput style={styles.input} value={doctorSpecialty} onChangeText={setDoctorSpecialty} placeholder="Specialty, example cardiology" accessibilityLabel="Doctor search specialty" />
            <ActionButton label="Search doctors" onPress={searchDoctorList} disabled={!token || busy} />
            {doctorSearchResult ? <Text style={styles.resultBox}>{doctorSearchResult}</Text> : <Text style={styles.smallText}>Results depend on the backend provider data configured for launch.</Text>}
          </View>
        ) : null}
        {screen === "insurance" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Insurance Guidance</Text>
            <Text style={styles.bodyText}>Compare educational coverage fit. CareWise does not guarantee eligibility, coverage, claim approval, or exact out-of-pocket costs.</Text>
            <TextInput style={styles.input} value={insuranceRegion} onChangeText={setInsuranceRegion} placeholder="Region, example US or Texas" accessibilityLabel="Insurance region" />
            <TextInput style={styles.input} value={insuranceConditions} onChangeText={setInsuranceConditions} placeholder="Health context, example high LDL" accessibilityLabel="Insurance health context" />
            <TextInput style={styles.input} value={insuranceBudget} onChangeText={setInsuranceBudget} placeholder="Budget level: low, medium, high" accessibilityLabel="Insurance budget level" autoCapitalize="none" />
            <ActionButton label="Match insurance" onPress={matchInsurancePlan} disabled={!token || busy} />
            {insuranceMatchResult ? <Text style={styles.resultBox}>{insuranceMatchResult}</Text> : <Text style={styles.smallText}>Keep this as education until licensed insurance review is ready.</Text>}
          </View>
        ) : null}
        {screen === "subscriptions" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Plans</Text>
            <Text style={styles.bodyText}>CareWise is free to start. Plus ($7 a month) adds personal plans, reminders and trends; Family ($12 a month) covers up to 5 people. Billed monthly through Stripe; cancel any time.</Text>
            {token ? <Text style={styles.smallText}>Your plan: {currentPlanLabel}</Text> : <Text style={styles.smallText}>Sign in on the Account tab to choose a paid plan.</Text>}
            <View style={styles.buttonRow}>
              {(["basic", "plus", "premium"] as const).map((code) => (
                <Pressable
                  key={code}
                  onPress={() => setPlanCode(code)}
                  style={[styles.planPill, planCode === code && styles.activePlanPill]}
                  accessibilityRole="button"
                  accessibilityLabel={`${PLAN_LABELS[code]} plan`}
                  accessibilityState={{ selected: planCode === code }}
                >
                  <Text style={[styles.tabText, planCode === code && styles.activeTabText]}>{PLAN_LABELS[code]}</Text>
                </Pressable>
              ))}
            </View>
            {planCode === "basic" ? (
              <Text style={styles.smallText}>The Free plan needs no payment. Everything on the Upload, History and Record screens is included.</Text>
            ) : (
              <ActionButton label="Start checkout" onPress={startSubscriptionCheckout} disabled={!token || busy} />
            )}
            {canManageBilling ? <ActionButton label="Manage or cancel plan" onPress={openBillingPortal} variant="secondary" disabled={busy} /> : null}
            {subscriptionResult ? <Text style={styles.resultBox}>{subscriptionResult}</Text> : <Text style={styles.smallText}>Payments are handled by Stripe. CareWise never sees your card number.</Text>}
            <EarlyAccessForm baseUrl={API_BASE_URL} language={reportLanguage === "es" ? "es" : "en"} />
          </View>
        ) : null}
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
              accessibilityLabel="Reason for data deletion request"
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
const INK = "#111314";
const SOFT = "#5d605f";
const LINE = "#e2dcd2";
const PAPER = "#f7f4ef";
const TEAL = "#0f766e";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAPER },
  container: { padding: 16, gap: 14, paddingBottom: 96 },
  header: { paddingTop: 10, paddingBottom: 4, gap: 4 },
  brand: { color: INK, fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  subtitle: { color: SOFT, fontSize: 16, lineHeight: 22 },
  card: { gap: 12, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", padding: 18 },
  eyebrow: { color: SOFT, fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  sectionTitle: { color: INK, fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  bodyText: { color: "#3f4342", fontSize: 15, lineHeight: 22 },
  smallText: { color: SOFT, fontSize: 13, lineHeight: 18 },
  linkText: { color: TEAL, fontSize: 15, fontWeight: "700", paddingVertical: 8, textDecorationLine: "underline" },
  status: { color: TEAL, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: LINE, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#fffdf9", color: INK, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 88, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: { minHeight: 46, justifyContent: "center", borderRadius: 999, backgroundColor: INK, paddingHorizontal: 20, paddingVertical: 10 },
  disabledButton: { backgroundColor: "#b9b4ac" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  secondaryButtonText: { color: INK },
  disabledSecondary: { opacity: 0.45 },
  bigButton: { alignSelf: "stretch", alignItems: "center", minHeight: 52 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 4, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(255,255,255,0.6)" },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  activeTab: { backgroundColor: INK },
  tabText: { color: SOFT, fontWeight: "700", fontSize: 14 },
  activeTabText: { color: "#fff" },
  planPill: { minHeight: 44, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10 },
  activePlanPill: { borderColor: INK, backgroundColor: INK },
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
