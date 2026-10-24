import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { CareWiseApiClient, ReminderOut } from "./apiClient";
import { deviceTimeZone, reminderZoneChoices } from "./reminderZones";

// Medicine reminders, the same ones as on the website (saved to the account). FollowThrough Health
// can phone the person at each time; the call never says what the medicine is.

const DAYS: [string, string][] = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const DOSE_TEXT: Record<string, string> = { upcoming: "Upcoming", due: "Due now", calling: "Calling", taken: "Taken", missed: "Not confirmed", past: "Earlier", stopped: "Calls stopped" };
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseReminderTimes(text: string): string[] {
  return [...new Set(text.split(/[,\s]+/).map((value) => value.trim()).filter(Boolean).map((value) => (/^\d:\d\d$/.test(value) ? `0${value}` : value)))];
}

function callLine(item: ReminderOut): string {
  if (!item.call) return "";
  const number = item.phone_last4 ? `••${item.phone_last4}` : "their phone";
  if (item.call_status === "pending_consent") return `Waiting for ${item.person} to press 1 on the first call to ${number}.`;
  if (item.call_status === "active") return `Calls to ${number} at each time. ${item.person} presses 1 once it's taken.`;
  if (item.call_status === "stopped") return `${item.person} pressed 9 to stop calls.`;
  return "";
}

export default function RemindersScreen({ api, signedIn }: { api: CareWiseApiClient; signedIn: boolean }) {
  const [items, setItems] = useState<ReminderOut[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [person, setPerson] = useState("Me");
  const [label, setLabel] = useState("");
  const [times, setTimes] = useState("08:00");
  const [days, setDays] = useState<string[]>(DAYS.map(([value]) => value));
  const [zone, setZone] = useState(deviceTimeZone());
  const [call, setCall] = useState(false);
  const [phone, setPhone] = useState("");
  const [callerName, setCallerName] = useState("");
  const [consent, setConsent] = useState(false);
  const [alertOnMiss, setAlertOnMiss] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  async function load() {
    if (!signedIn) {
      setItems([]);
      return;
    }
    try {
      setItems(await api.listReminders());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Reminders could not load.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, api]);

  async function save() {
    const list = parseReminderTimes(times);
    if (!list.length || list.length > 4 || !list.every((value) => TIME_PATTERN.test(value))) {
      setStatus("Enter up to 4 times like 08:00, 20:30.");
      return;
    }
    if (!days.length) {
      setStatus("Pick at least one day.");
      return;
    }
    let number = phone.trim();
    if (call && !number.startsWith("+")) number = `+1${number.replace(/\D/g, "")}`;
    if (call && !/^\+[1-9]\d{7,14}$/.test(number.replace(/[\s().-]/g, ""))) {
      setStatus("Enter their phone number with the country code, like +1 555 123 4567.");
      return;
    }
    if (call && !consent) {
      setStatus("Turn on the switch to confirm they agreed to get these calls.");
      return;
    }
    setBusy(true);
    try {
      await api.createReminder({
        person: person.trim() || "Me",
        label: label.trim(),
        times: list,
        days: days.length === 7 ? [] : days,
        timezone: zone,
        language: "en",
        call,
        phone: call ? number : "",
        caller_name: callerName.trim(),
        consent_confirmed: consent,
        alert_on_miss: alertOnMiss,
      });
      setShowForm(false);
      setLabel("");
      setPhone("");
      setConsent(false);
      setStatus(call ? `Reminder saved. FollowThrough Health will first call ${person.trim() || "them"} to ask them to press 1 and agree.` : "Reminder saved.");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The reminder could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function markTaken(item: ReminderOut) {
    try {
      await api.markReminderTaken(item.id);
      setStatus(`Marked as taken for ${item.person}.`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "That didn't work.");
    }
  }

  async function remove(item: ReminderOut) {
    if (confirmDelete !== item.id) {
      setConfirmDelete(item.id);
      return;
    }
    try {
      await api.deleteReminder(item.id);
      setConfirmDelete("");
      setStatus("Reminder deleted. No more calls will go out for it.");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "That didn't work.");
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Reminders</Text>
      <Text style={styles.title}>Medicine reminders</Text>
      <Text style={styles.body}>Set medicine times for yourself or a parent. FollowThrough Health can phone them at each time and ask them to press 1 once it's taken, and email you if a reminder isn't confirmed.</Text>
      {!signedIn ? (
        <Text style={styles.note}>Sign in on the Account tab to set reminders. They are saved to your account so calls go out even when the app is closed.</Text>
      ) : (
        <>
          {!showForm ? <Button label="Add a reminder" onPress={() => setShowForm(true)} /> : null}
          {showForm ? (
            <View style={styles.form}>
              <TextInput style={styles.input} value={person} onChangeText={setPerson} maxLength={40} placeholder="Who is it for? Me, Mom, Dad" accessibilityLabel="Who is it for" />
              <TextInput style={styles.input} value={label} onChangeText={setLabel} maxLength={60} placeholder="Reminder name, e.g. Morning tablets" accessibilityLabel="Reminder name" />
              <Text style={styles.small}>Shown only in FollowThrough Health. The phone call never says what the medicine is.</Text>
              <TextInput style={styles.input} value={times} onChangeText={setTimes} maxLength={30} placeholder="Times, e.g. 08:00, 20:00" accessibilityLabel="Reminder times" keyboardType="numbers-and-punctuation" />
              <View style={styles.row}>
                {DAYS.map(([value, name]) => {
                  const selected = days.includes(value);
                  return (
                    <Pressable key={value} onPress={() => setDays(selected ? days.filter((day) => day !== value) : [...days, value])} style={[styles.pill, selected && styles.pillActive]} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${name} reminders`}>
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.small}>Their time zone: reminders and calls happen at these times where the person lives.</Text>
              <View style={styles.row}>
                {reminderZoneChoices().map((choice) => {
                  const selected = zone === choice.value;
                  return (
                    <Pressable key={choice.value} onPress={() => setZone(choice.value)} style={[styles.pill, selected && styles.pillActive]} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${choice.label} time zone`}>
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{choice.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.switchRow}>
                <Switch value={call} onValueChange={setCall} accessibilityLabel="Phone them at these times" />
                <Text style={styles.body}>Phone them at these times</Text>
              </View>
              {call ? (
                <View style={styles.callBox}>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} maxLength={20} placeholder="Their phone, e.g. +1 555 123 4567" accessibilityLabel="Their phone number" keyboardType="phone-pad" />
                  <TextInput style={styles.input} value={callerName} onChangeText={setCallerName} maxLength={40} placeholder="Your first name (said on the call)" accessibilityLabel="Your first name" />
                  <View style={styles.switchRow}>
                    <Switch value={consent} onValueChange={setConsent} accessibilityLabel="This person agreed to get automated reminder calls at this number" />
                    <Text style={[styles.body, styles.flex]}>This person agreed to get automated reminder calls at this number. The first call asks them to press 1 to confirm; 9 stops calls.</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.switchRow}>
                <Switch value={alertOnMiss} onValueChange={setAlertOnMiss} accessibilityLabel="Email me if a reminder isn't confirmed" />
                <Text style={styles.body}>Email me if a reminder isn't confirmed</Text>
              </View>
              <View style={styles.row}>
                <Button label="Save reminder" onPress={save} disabled={busy} />
                <Button label="Cancel" onPress={() => setShowForm(false)} secondary />
              </View>
            </View>
          ) : null}
          {items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemName}>{item.label ? `${item.person} · ${item.label}` : item.person}</Text>
                <Text style={styles.small}>{item.times.join(", ")} · {item.days.length ? item.days.map((day) => day.slice(0, 1).toUpperCase() + day.slice(1)).join(", ") : "Every day"}</Text>
                <View style={styles.row}>
                  {item.today.map((dose) => (
                    <Text key={dose.time} style={[styles.dose, dose.status === "taken" && styles.doseTaken, dose.status === "missed" && styles.doseMissed]}>
                      {dose.time} · {DOSE_TEXT[dose.status] || dose.status}
                    </Text>
                  ))}
                </View>
                {callLine(item) ? <Text style={styles.small}>{callLine(item)}</Text> : null}
                <View style={styles.row}>
                  <Button label="Mark taken" onPress={() => markTaken(item)} secondary />
                  <Button label={confirmDelete === item.id ? "Tap again to delete" : "Delete"} onPress={() => remove(item)} secondary />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.small}>No reminders yet.</Text>
          )}
        </>
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Text style={styles.small}>A reminder service, not a medical alert. In an emergency, call your local emergency number.</Text>
    </View>
  );
}

function Button({ label, onPress, disabled, secondary }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled]} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, borderRadius: 24, borderWidth: 1, borderColor: "#e2dcd2", backgroundColor: "#fff", padding: 18 },
  eyebrow: { color: "#5d605f", fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: "#111314", fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  body: { color: "#3e5450", fontSize: 14, lineHeight: 20 },
  small: { color: "#5b6e6a", fontSize: 12, lineHeight: 17 },
  note: { color: "#5b4a1f", fontSize: 13, lineHeight: 19, backgroundColor: "#fff7e6", borderColor: "#f1d9a6", borderWidth: 1, borderRadius: 12, padding: 10 },
  status: { color: "#0f766e", fontSize: 13, fontWeight: "600" },
  form: { gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "#e2dcd2", padding: 12, backgroundColor: "#fbf9f5" },
  callBox: { gap: 10, borderRadius: 12, backgroundColor: "#f7f4ef", padding: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flex: { flex: 1 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#e2dcd2", padding: 12, backgroundColor: "#fffdf9", color: "#14302c" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: "#e2dcd2", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { borderColor: "#111314", backgroundColor: "#111314" },
  pillText: { color: "#3e5450", fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  item: { gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#e2dcd2", padding: 12, backgroundColor: "#fff" },
  itemName: { color: "#14302c", fontSize: 15, fontWeight: "700" },
  dose: { fontSize: 12, color: "#3d4442", backgroundColor: "#eef1f0", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
  doseTaken: { backgroundColor: "#e3f4ee", color: "#0f766e" },
  doseMissed: { backgroundColor: "#fdeee6", color: "#b4400e" },
  button: { minHeight: 46, justifyContent: "center", borderRadius: 999, backgroundColor: "#111314", paddingHorizontal: 20, paddingVertical: 10 },
  buttonSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2dcd2" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonTextSecondary: { color: "#111314" }
});
