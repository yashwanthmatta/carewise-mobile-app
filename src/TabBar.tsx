// Bottom navigation: the four everyday screens and "More", which opens a sheet with the rest.
// Thumb-reachable, 56px targets, icon plus label, and the selected tab announced to screen readers.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, type } from "./theme";

type IconName = keyof typeof Ionicons.glyphMap;

export type TabItem<Key extends string> = { key: Key; label: string; icon: IconName; activeIcon: IconName };

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export function BottomTabBar<Key extends string>({
  items,
  moreItems,
  current,
  onSelect,
  bottomInset = 0
}: {
  items: TabItem<Key>[];
  moreItems: TabItem<Key>[];
  current: Key;
  onSelect: (key: Key) => void;
  bottomInset?: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const reduceMotion = useReduceMotion();
  const moreSelected = moreItems.some((item) => item.key === current);
  const choose = (key: Key) => {
    setMoreOpen(false);
    onSelect(key);
  };

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 8) }]} accessibilityRole="tablist">
        {items.map((item) => {
          const selected = item.key === current;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Ionicons name={selected ? item.activeIcon : item.icon} size={22} color={selected ? colors.brandStrong : colors.ink2} />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setMoreOpen(true)}
          style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="More"
          accessibilityHint="Opens Care, Doctors, Insurance, Your plan and Legal"
          accessibilityState={{ selected: moreSelected, expanded: moreOpen }}
        >
          <View style={[styles.iconWrap, moreSelected && styles.iconWrapSelected]}>
            <Ionicons name={moreSelected ? "grid" : "grid-outline"} size={21} color={moreSelected ? colors.brandStrong : colors.ink2} />
          </View>
          <Text style={[styles.label, moreSelected && styles.labelSelected]}>More</Text>
        </Pressable>
      </View>

      <Modal visible={moreOpen} transparent animationType={reduceMotion ? "none" : "slide"} onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setMoreOpen(false)} accessibilityRole="button" accessibilityLabel="Close menu" />
        <View style={[styles.sheet, { paddingBottom: Math.max(bottomInset, 16) + 8 }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle} accessibilityRole="header">More</Text>
          {moreItems.map((item) => {
            const selected = item.key === current;
            return (
              <Pressable
                key={item.key}
                onPress={() => choose(item.key)}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
              >
                <Ionicons name={selected ? item.activeIcon : item.icon} size={22} color={selected ? colors.brandStrong : colors.ink2} />
                <Text style={[styles.rowText, selected && styles.labelSelected]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingTop: 6,
    paddingHorizontal: 6
  },
  tab: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 2 },
  pressed: { opacity: 0.7 },
  iconWrap: { width: 56, height: 30, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  iconWrapSelected: { backgroundColor: colors.brandSoft },
  label: { color: colors.ink2, fontSize: 12, fontWeight: "600" },
  labelSelected: { color: colors.brandStrong, fontWeight: "800" },
  scrim: { flex: 1, backgroundColor: "rgba(21, 25, 26, 0.35)" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, gap: 4 },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 8 },
  sheetTitle: { color: colors.ink, fontSize: type.cardHeading, fontWeight: "800", marginBottom: 6, paddingHorizontal: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 56, paddingHorizontal: 12, borderRadius: radius.md },
  rowSelected: { backgroundColor: colors.brandSoft },
  rowText: { flex: 1, color: colors.ink, fontSize: type.body, fontWeight: "600" }
});
