// Account screen: the sign-in card (Sign in / Create account / reset) and the signed-in view.
// The account requests stay in App.tsx; these components only lay out the screen around them.
import { type ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SessionOut } from "./apiClient";
import { colors, radius, type } from "./theme";

type Mode = "signin" | "signup" | "forgot";

const TITLES: Record<Mode, { title: string; sub: string }> = {
  signin: { title: "Welcome back", sub: "Sign in to see your saved reports on any device." },
  signup: { title: "Create your free account", sub: "Save reports and open them on any device. Free, and you can delete it any time." },
  forgot: { title: "Reset your password", sub: "Enter your account email and we'll send you a link to set a new password." }
};

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function animateNext(reduceMotion: boolean) {
  if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.create(200, "easeInEaseOut", "opacity"));
}

export function PrimaryButton({ label, onPress, busy = false, disabled = false }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.primary, off && !busy && styles.primaryDisabled, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }}
    >
      {busy ? <ActivityIndicator color="#fff" style={styles.spinner} /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled = false, danger = false }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.secondary, danger && styles.danger, disabled && styles.secondaryDisabled, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.secondaryText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function PasswordInput({ value, onChangeText, label, isNew, onSubmit }: { value: string; onChangeText: (value: string) => void; label: string; isNew: boolean; onSubmit?: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.passwordWrap}>
      <TextInput
        style={[styles.input, styles.passwordInput]}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={isNew ? "newPassword" : "password"}
        autoComplete={isNew ? "new-password" : "current-password"}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <Pressable
        onPress={() => setShow((current) => !current)}
        style={styles.showButton}
        accessibilityRole="button"
        accessibilityLabel={show ? "Hide password" : "Show password"}
        hitSlop={8}
      >
        <Text style={styles.showText}>{show ? "Hide" : "Show"}</Text>
      </Pressable>
    </View>
  );
}

export function AuthCard(props: {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  busy: boolean;
  minPasswordLength: number;
  onSignIn: () => void;
  onSignUp: () => void;
  onRequestReset: () => void;
  resetToken: string;
  setResetToken: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  onConfirmReset: () => void;
  twoFactorChallenge: string;
  twoFactorCode: string;
  setTwoFactorCode: (value: string) => void;
  onVerifyTwoFactor: () => void;
  onExplainWithoutAccount: () => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [showCode, setShowCode] = useState(false);
  const reduceMotion = useReduceMotion();
  const go = (next: Mode) => {
    animateNext(reduceMotion);
    setMode(next);
  };
  const { title, sub } = TITLES[mode];
  const submit = mode === "signup" ? props.onSignUp : mode === "forgot" ? props.onRequestReset : props.onSignIn;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      {mode !== "forgot" && !props.twoFactorChallenge ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {(["signin", "signup"] as const).map((tab) => {
            const selected = mode === tab;
            return (
              <Pressable key={tab} onPress={() => go(tab)} style={[styles.tab, selected && styles.tabSelected]} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab === "signin" ? "Sign in" : "Create account"}>
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab === "signin" ? "Sign in" : "Create account"}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {props.twoFactorChallenge ? (
        <View style={styles.codeBox}>
          <Field label="Code from your authenticator app">
            <TextInput style={styles.input} value={props.twoFactorCode} onChangeText={props.setTwoFactorCode} placeholder="6-digit code, or a backup code" accessibilityLabel="Authenticator code" autoCapitalize="none" textContentType="oneTimeCode" autoComplete="one-time-code" returnKeyType="go" onSubmitEditing={props.onVerifyTwoFactor} />
          </Field>
          <PrimaryButton label="Verify and sign in" onPress={props.onVerifyTwoFactor} busy={props.busy} />
        </View>
      ) : (
        <View style={styles.form}>
          <Field label="Email">
            <TextInput style={styles.input} value={props.email} onChangeText={props.setEmail} placeholder="you@example.com" accessibilityLabel="Email address" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" returnKeyType={mode === "forgot" ? "send" : "next"} onSubmitEditing={mode === "forgot" ? submit : undefined} />
          </Field>
          {mode !== "forgot" ? (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {mode === "signin" ? (
                  <Pressable onPress={() => go("forgot")} accessibilityRole="button" accessibilityLabel="Forgot password?" hitSlop={10}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                ) : null}
              </View>
              <PasswordInput value={props.password} onChangeText={props.setPassword} label="Password" isNew={mode === "signup"} onSubmit={submit} />
              {mode === "signup" ? <Text style={styles.hint}>At least {props.minPasswordLength} characters. Do not reuse passwords from email, banking or medical portals.</Text> : null}
            </View>
          ) : null}
          <PrimaryButton label={mode === "signup" ? "Create free account" : mode === "forgot" ? "Email me a reset link" : "Sign in"} onPress={submit} busy={props.busy} />
          {mode === "signup" ? <Text style={styles.terms}>By creating an account you agree to the Terms and Privacy policy.</Text> : null}
          {mode === "forgot" ? (
            <View style={styles.form}>
              <Pressable onPress={() => { animateNext(reduceMotion); setShowCode((value) => !value); }} accessibilityRole="button" accessibilityState={{ expanded: showCode }} style={styles.disclosure}>
                <Text style={styles.disclosureText}>{showCode ? "▾" : "▸"}  I have a reset code</Text>
              </Pressable>
              {showCode ? (
                <View style={styles.form}>
                  <Field label="Reset code from the email">
                    <TextInput style={styles.input} value={props.resetToken} onChangeText={props.setResetToken} placeholder="Paste the code" accessibilityLabel="Reset code" autoCapitalize="none" autoCorrect={false} />
                  </Field>
                  <Field label="New password" hint={`At least ${props.minPasswordLength} characters.`}>
                    <PasswordInput value={props.newPassword} onChangeText={props.setNewPassword} label="New password" isNew onSubmit={props.onConfirmReset} />
                  </Field>
                  <SecondaryButton label="Set new password" onPress={props.onConfirmReset} disabled={props.busy || !props.resetToken || !props.newPassword} />
                </View>
              ) : null}
              <Pressable onPress={() => go("signin")} accessibilityRole="button" hitSlop={10}>
                <Text style={styles.link}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.aside}>
        <Text style={styles.asideTitle}>An account is optional</Text>
        <Text style={styles.asideText}>Reports are explained on this phone without one. Create an account to keep reports on all your devices.</Text>
        <Pressable onPress={props.onExplainWithoutAccount} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>Explain a report without an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SignedInCard(props: {
  session: SessionOut;
  busy: boolean;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onRequestVerification: () => void;
  verificationToken: string;
  setVerificationToken: (value: string) => void;
  onConfirmVerification: () => void;
  onRecordConsent: () => void;
  onSyncProfile: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const reduceMotion = useReduceMotion();
  const toggle = (setter: (fn: (value: boolean) => boolean) => void) => { animateNext(reduceMotion); setter((value) => !value); };
  const initial = (props.session.email || "·").charAt(0).toUpperCase();
  return (
    <View style={styles.card}>
      <View style={styles.idRow}>
        <View style={styles.avatar} accessible={false}><Text style={styles.avatarText}>{initial}</Text></View>
        <View style={styles.flex}>
          <Text style={styles.name} accessibilityRole="header">Signed in as {props.session.email}</Text>
          <Text style={styles.sub}>{props.session.email_verified ? "Email confirmed. Reports you save appear on all your devices." : "Please confirm your email: open the link we sent you."}</Text>
        </View>
      </View>

      {!props.session.email_verified ? (
        <View style={styles.verifyBox}>
          <Text style={styles.verifyText}><Text style={styles.bold}>Confirm your email</Text> so we can help you get back in if you forget your password.</Text>
          <SecondaryButton label="Send the email again" onPress={props.onRequestVerification} disabled={props.busy} />
          <Pressable onPress={() => toggle(setShowCode)} accessibilityRole="button" accessibilityState={{ expanded: showCode }} style={styles.disclosure}>
            <Text style={styles.disclosureText}>{showCode ? "▾" : "▸"}  I have a confirmation code</Text>
          </Pressable>
          {showCode ? (
            <View style={styles.form}>
              <Field label="Email confirmation code">
                <TextInput style={styles.input} value={props.verificationToken} onChangeText={props.setVerificationToken} placeholder="Paste the code from the email" accessibilityLabel="Email confirmation code" autoCapitalize="none" autoCorrect={false} />
              </Field>
              <SecondaryButton label="Confirm email" onPress={props.onConfirmVerification} disabled={props.busy || !props.verificationToken} />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.asideTitle}>Save reports to your account</Text>
        <Text style={styles.asideText}>Before saving reports and lab values to your account, record your consent and save your profile.</Text>
        <View style={styles.row}>
          <SecondaryButton label="Record my consent" onPress={props.onRecordConsent} disabled={props.busy} />
          <SecondaryButton label="Save my profile" onPress={props.onSyncProfile} disabled={props.busy} />
        </View>
      </View>

      <View style={styles.divider} />
      <SecondaryButton label="Log out" onPress={props.onLogout} disabled={props.busy} />
      <Pressable onPress={() => toggle(setShowControls)} accessibilityRole="button" accessibilityState={{ expanded: showControls }} style={styles.disclosure}>
        <Text style={styles.disclosureText}>{showControls ? "▾" : "▸"}  Privacy and data controls</Text>
      </Pressable>
      {showControls ? (
        <View style={styles.form}>
          <Text style={styles.asideText}>Delete your account and everything saved in it. This can't be undone.</Text>
          <SecondaryButton label="Delete my account" onPress={props.onDeleteAccount} disabled={props.busy} danger />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 20 },
  head: { gap: 6 },
  title: { color: colors.ink, fontSize: type.heading + 2, fontWeight: "800", letterSpacing: -0.6 },
  sub: { color: colors.ink2, fontSize: type.small + 1, lineHeight: 21 },
  tabs: { flexDirection: "row", padding: 4, borderRadius: radius.pill, backgroundColor: colors.surface2 },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  tabSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  tabText: { color: colors.ink2, fontWeight: "700", fontSize: type.small + 1 },
  tabTextSelected: { color: colors.ink },
  form: { gap: 14 },
  field: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { color: colors.ink, fontWeight: "700", fontSize: type.small },
  hint: { color: colors.ink3, fontSize: type.caption, lineHeight: 18 },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, color: colors.ink, fontSize: type.body },
  passwordWrap: { justifyContent: "center" },
  passwordInput: { paddingRight: 74 },
  showButton: { position: "absolute", right: 6, minHeight: 40, minWidth: 60, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  showText: { color: colors.brand, fontWeight: "700", fontSize: type.small },
  link: { color: colors.brand, fontWeight: "700", fontSize: type.small, textDecorationLine: "underline", paddingVertical: 4 },
  primary: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.pill, backgroundColor: colors.brand, paddingHorizontal: 20 },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: type.body },
  spinner: { marginRight: 2 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  secondary: { minHeight: 46, alignItems: "center", justifyContent: "center", alignSelf: "flex-start", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 18 },
  secondaryDisabled: { opacity: 0.5 },
  secondaryText: { color: colors.ink, fontWeight: "700", fontSize: type.small + 1 },
  danger: { borderColor: "#f1c3bd", backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger },
  terms: { color: colors.ink3, fontSize: type.caption, textAlign: "center" },
  codeBox: { gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors.surfaceBrand, borderWidth: 1, borderColor: "#c9e4de" },
  disclosure: { minHeight: 44, justifyContent: "center" },
  disclosureText: { color: colors.ink2, fontWeight: "700", fontSize: type.small + 1 },
  aside: { gap: 8, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  asideTitle: { color: colors.ink, fontWeight: "800", fontSize: type.cardHeading - 1 },
  asideText: { color: colors.ink2, fontSize: type.small + 1, lineHeight: 21 },
  idRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft },
  avatarText: { color: colors.brandStrong, fontSize: 22, fontWeight: "800" },
  name: { color: colors.ink, fontSize: type.cardHeading, fontWeight: "800" },
  flex: { flex: 1, gap: 2 },
  verifyBox: { gap: 10, padding: 16, borderRadius: radius.md, backgroundColor: colors.attentionSoft, borderWidth: 1, borderColor: "#f1dcbc" },
  verifyText: { color: colors.ink, fontSize: type.small + 1, lineHeight: 21 },
  bold: { fontWeight: "800" },
  section: { gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  divider: { height: 1, backgroundColor: colors.line }
});
