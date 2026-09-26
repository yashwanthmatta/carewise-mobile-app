import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import {
  HEALTH_RECORD_STORAGE_KEY,
  HEALTH_RECORD_TYPES,
  buildRecordSummary,
  createRecordItem,
  formatRecordRange,
  getRecordFor,
  getRecordPeople,
  groupRecordByYear,
  mergeRecordBackup,
  normalizeRecordPerson,
  parseStoredRecord,
  serializeRecordBackup,
  withSampleHistory,
  type HealthRecordItem,
  type HealthRecordType
} from "./healthRecord";

const TYPE_KEYS = Object.keys(HEALTH_RECORD_TYPES) as HealthRecordType[];

export async function loadHealthRecord(): Promise<HealthRecordItem[]> {
  try {
    return parseStoredRecord(await AsyncStorage.getItem(HEALTH_RECORD_STORAGE_KEY));
  } catch {
    return [];
  }
}

export default function HealthRecordScreen({ extraPeople = [] }: { extraPeople?: string[] }) {
  const [items, setItems] = useState<HealthRecordItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [person, setPerson] = useState("Me");
  const [filter, setFilter] = useState<HealthRecordType | "">("");
  const [type, setType] = useState<HealthRecordType>("condition");
  const [name, setName] = useState("");
  const [entryPerson, setEntryPerson] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [ongoing, setOngoing] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("CareWise keeps what you enter. It does not check medicine interactions or give medical advice.");

  useEffect(() => {
    loadHealthRecord().then((stored) => {
      setItems(stored);
      setLoaded(true);
    });
  }, []);

  async function persist(next: HealthRecordItem[]) {
    setItems(next);
    try {
      await AsyncStorage.setItem(HEALTH_RECORD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      setStatus("This phone could not save the record. Check free storage.");
    }
  }

  async function save() {
    const result = createRecordItem({ type, name, person: entryPerson, start: start.trim(), end: end.trim(), ongoing, notes });
    if (typeof result === "string") {
      setStatus(result);
      return;
    }
    await persist([...items, result]);
    setName("");
    setNotes("");
    setEnd("");
    setPerson(result.person);
    setStatus(`Saved "${result.name}" to ${result.person === "Me" ? "your" : `${result.person}'s`} health record.`);
  }

  async function addSample() {
    const who = normalizeRecordPerson(entryPerson);
    await persist(withSampleHistory(items, who));
    setPerson(who);
    setStatus(`Added a sample 20-year history for ${who}. It is made-up example data.`);
  }

  async function remove(id: string) {
    await persist(items.filter((item) => item.id !== id));
  }

  async function shareBackup() {
    try {
      await Share.share({ title: "CareWise health record backup", message: serializeRecordBackup(items) });
      setStatus("Backup shared. Keep it somewhere safe; it contains your health history.");
    } catch {
      setStatus("Could not open the share sheet.");
    }
  }

  async function restoreBackup() {
    const picked = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain"], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const text = await (await fetch(picked.assets[0].uri)).text();
      const merged = mergeRecordBackup(items, text);
      if (!merged) {
        setStatus("That file is not a CareWise health record backup.");
        return;
      }
      await persist(merged.items);
      setStatus(`Restored ${merged.added} ${merged.added === 1 ? "entry" : "entries"} from the backup.`);
    } catch {
      setStatus("Could not read that file.");
    }
  }

  const people = getRecordPeople(items, extraPeople);
  const shownPerson = people.includes(person) ? person : "Me";
  const mine = getRecordFor(items, shownPerson);
  const summary = buildRecordSummary(mine);
  const years = groupRecordByYear(mine, filter);

  const summaryCard = (title: string, list: HealthRecordItem[], warn = false) => (
    <View style={[styles.summaryCard, warn && list.length > 0 && styles.summaryWarn]}>
      <Text style={[styles.summaryTitle, warn && list.length > 0 && styles.warnText]}>{title}</Text>
      {list.length ? (
        list.map((item) => (
          <Text key={item.id} style={styles.body}>
            • {item.name}
            {item.notes ? <Text style={styles.small}>{`  ${item.notes}`}</Text> : null}
          </Text>
        ))
      ) : (
        <Text style={styles.small}>None recorded</Text>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>LIFETIME HEALTH RECORD</Text>
      <Text style={styles.title}>My health record</Text>
      <Text style={styles.body}>Past conditions, medicines, what did not suit you, and habits, as far back as you remember. Saved on this phone.</Text>

      <View style={styles.row}>
        {people.map((who) => (
          <Pill key={who} label={who} selected={who === shownPerson} onPress={() => setPerson(who)} accessibilityLabel={`Show record for ${who}`} />
        ))}
      </View>

      {summaryCard("Ongoing conditions", summary.conditions)}
      {summaryCard("Current medicines", summary.medicines)}
      {summaryCard("Did not suit me", summary.reactions, true)}

      <Text style={styles.sectionTitle}>Add to the record</Text>
      <View style={styles.row}>
        {TYPE_KEYS.map((key) => (
          <Pill key={key} label={HEALTH_RECORD_TYPES[key].formLabel} selected={type === key} onPress={() => setType(key)} accessibilityLabel={`Entry type ${HEALTH_RECORD_TYPES[key].formLabel}`} />
        ))}
      </View>
      <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={80} placeholder="Name, for example High blood pressure" accessibilityLabel="Name" />
      <TextInput style={styles.input} value={entryPerson} onChangeText={setEntryPerson} maxLength={40} placeholder="Whose record? Me, Mom, Dad" accessibilityLabel="Whose record" />
      <TextInput style={styles.input} value={start} onChangeText={setStart} maxLength={7} placeholder={type === "reaction" ? "When noticed (year-month, e.g. 2009-07)" : "Started (year-month, e.g. 2015-02)"} accessibilityLabel="Start date, year and month" keyboardType="numbers-and-punctuation" />
      {type !== "reaction" ? (
        <>
          <View style={styles.switchRow}>
            <Switch value={ongoing} onValueChange={setOngoing} accessibilityLabel="Still ongoing" />
            <Text style={styles.body}>Still ongoing</Text>
          </View>
          {!ongoing ? (
            <TextInput style={styles.input} value={end} onChangeText={setEnd} maxLength={7} placeholder="Ended (year-month, e.g. 2016-01)" accessibilityLabel="End date, year and month" keyboardType="numbers-and-punctuation" />
          ) : null}
        </>
      ) : null}
      <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} maxLength={400} multiline placeholder="Notes: dose, what happened, which doctor" accessibilityLabel="Notes" />
      <View style={styles.row}>
        <Button label="Save to record" onPress={save} disabled={!loaded} />
        <Button label="Add sample 20-year history" onPress={addSample} disabled={!loaded} secondary />
      </View>
      <Text style={styles.status}>{status}</Text>

      <Text style={styles.sectionTitle}>Timeline</Text>
      <View style={styles.row}>
        <Pill label="Everything" selected={filter === ""} onPress={() => setFilter("")} accessibilityLabel="Show everything" />
        {TYPE_KEYS.map((key) => (
          <Pill key={key} label={HEALTH_RECORD_TYPES[key].label} selected={filter === key} onPress={() => setFilter(key)} accessibilityLabel={`Show only ${HEALTH_RECORD_TYPES[key].label}`} />
        ))}
      </View>
      {years.length ? (
        years.map(([year, list]) => (
          <View key={year} style={styles.year}>
            <Text style={styles.yearTitle}>{year}</Text>
            {list.map((item) => (
              <View key={item.id} style={[styles.item, { borderLeftColor: TYPE_COLORS[item.type] }]}>
                <View style={styles.itemText}>
                  <Text style={[styles.chip, { color: TYPE_COLORS[item.type] }]}>{HEALTH_RECORD_TYPES[item.type].label.toUpperCase()}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.small}>{formatRecordRange(item)}</Text>
                  {item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}
                </View>
                <Pressable onPress={() => remove(item.id)} style={styles.remove} accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text style={styles.small}>{mine.length ? "Nothing of this type yet." : `No health history saved for ${shownPerson} yet.`}</Text>
      )}

      <View style={styles.row}>
        <Button label="Share backup" onPress={shareBackup} disabled={!items.length} secondary />
        <Button label="Restore backup" onPress={restoreBackup} disabled={!loaded} secondary />
      </View>
      <Text style={styles.small}>Backups work between this app and the CareWise website.</Text>
    </View>
  );
}

const TYPE_COLORS: Record<HealthRecordType, string> = {
  condition: "#0f766e",
  medicine: "#1d4ed8",
  reaction: "#9a3b17",
  habit: "#854d0e",
  procedure: "#4b5563"
};

function Pill({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillActive]} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }}>
      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Button({ label, onPress, disabled = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "#d5e5e1", backgroundColor: "#fff", padding: 16 },
  eyebrow: { color: "#0f766e", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#0b3b36", fontSize: 22, fontWeight: "800" },
  sectionTitle: { color: "#0b3b36", fontSize: 17, fontWeight: "800", marginTop: 6 },
  body: { color: "#3e5450", fontSize: 14, lineHeight: 20 },
  small: { color: "#5b6e6a", fontSize: 12, lineHeight: 17 },
  status: { color: "#0f766e", fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: { borderRadius: 12, borderWidth: 1, borderColor: "#d5e5e1", padding: 12, gap: 4, backgroundColor: "#fbfefd" },
  summaryWarn: { borderColor: "#e7b7a3", backgroundColor: "#fdf5f1" },
  summaryTitle: { color: "#0b3b36", fontSize: 15, fontWeight: "700" },
  warnText: { color: "#9a3b17" },
  input: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: "#cbdcd5", padding: 12, backgroundColor: "#fbfffd", color: "#14302c" },
  notes: { minHeight: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: "#cbdcd5", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { borderColor: "#0f766e", backgroundColor: "#e6f4f1" },
  pillText: { color: "#3e5450", fontWeight: "600" },
  pillTextActive: { color: "#0b3b36" },
  button: { minHeight: 44, justifyContent: "center", borderRadius: 12, backgroundColor: "#0f766e", paddingHorizontal: 16, paddingVertical: 10 },
  buttonSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbdcd5" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonTextSecondary: { color: "#0b3b36" },
  year: { gap: 8 },
  yearTitle: { color: "#0b3b36", fontSize: 17, fontWeight: "800", marginTop: 6 },
  item: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#d5e5e1", borderLeftWidth: 4, padding: 12, backgroundColor: "#fff" },
  itemText: { flex: 1, gap: 2 },
  chip: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  itemName: { color: "#14302c", fontSize: 15, fontWeight: "700" },
  remove: { alignSelf: "center", borderRadius: 10, borderWidth: 1, borderColor: "#cbdcd5", paddingHorizontal: 10, paddingVertical: 8 },
  removeText: { color: "#0b3b36", fontWeight: "600", fontSize: 13 }
});
