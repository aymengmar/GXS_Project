import { Pressable, StyleSheet, Text, View } from "react-native";

const ORANGE = "#FF6500";
const BORDER = "rgba(255,255,255,0.07)";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.38)";
const DIM = "rgba(255,255,255,0.55)";

export type Period = "today" | "week" | "month" | "custom";

const LABELS: { key: Period; label: string }[] = [
  { key: "today",  label: "Today"  },
  { key: "week",   label: "Week"   },
  { key: "month",  label: "Month"  },
  { key: "custom", label: "Custom" },
];

interface Props {
  active: Period;
  onSelect: (p: Period) => void;
  customDateRange?: string | null;
}

export default function AdminPeriodSelector({ active, onSelect, customDateRange }: Props) {
  return (
    <View style={ps.wrap}>
      <View style={ps.row}>
        {LABELS.map(({ key, label }) => {
          const on = active === key;
          return (
            <Pressable
              key={key}
              style={[ps.btn, on && ps.btnActive]}
              onPress={() => onSelect(key)}
            >
              <Text style={[ps.text, on && ps.textActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {active === "custom" && customDateRange ? (
        <View style={ps.rangeRow}>
          <View style={ps.rangeDot} />
          <Text style={ps.rangeText} numberOfLines={1}>{customDateRange}</Text>
        </View>
      ) : null}
    </View>
  );
}

const ps = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },

  row: {
    flexDirection: "row",
    backgroundColor: "#0A1525",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    gap: 4,
  },

  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: {
    backgroundColor: "rgba(255,101,0,0.14)",
    borderWidth: 1,
    borderColor: ORANGE,
  },

  text: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: MUTED },
  textActive: { color: ORANGE },

  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  rangeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE, flexShrink: 0 },
  rangeText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: DIM, flexShrink: 1 },
});
