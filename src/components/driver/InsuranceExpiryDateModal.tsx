import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const ORANGE = "#FF6500";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.55)";
const MUTED = "rgba(255,255,255,0.30)";
const BORDER_SUBTLE = "rgba(255,255,255,0.08)";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_HEADS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

type DateVal = { year: number; month: number; day: number };

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstWeekday(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function cmp(a: DateVal, b: DateVal) {
  const da = new Date(a.year, a.month, a.day);
  const db = new Date(b.year, b.month, b.day);
  return da < db ? -1 : da > db ? 1 : 0;
}
function same(a: DateVal | null, b: DateVal | null) {
  return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}
function toIsoDate(d: DateVal): string {
  const mm = String(d.month + 1).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}
function parseIsoDate(iso: string | null | undefined): DateVal | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
}

interface Props {
  visible: boolean;
  initialDate?: string | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (isoDate: string) => void;
}

export default function InsuranceExpiryDateModal({
  visible,
  initialDate,
  saving = false,
  onCancel,
  onSave,
}: Props) {
  const today = new Date();
  const todayVal: DateVal = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

  const [viewYear, setViewYear] = useState(todayVal.year);
  const [viewMonth, setViewMonth] = useState(todayVal.month);
  const [selected, setSelected] = useState<DateVal | null>(null);

  useEffect(() => {
    if (visible) {
      const parsed = parseIsoDate(initialDate);
      setViewYear(parsed?.year ?? todayVal.year);
      setViewMonth(parsed?.month ?? todayVal.month);
      setSelected(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialDate]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDay(day: number) {
    const d: DateVal = { year: viewYear, month: viewMonth, day };
    if (cmp(d, todayVal) < 0) return;
    setSelected(d);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canSave = selected !== null && !saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.headerRow}>
            <Text style={m.headerTitle}>Select Insurance Expiry Date</Text>
            <Pressable hitSlop={14} onPress={onCancel} style={m.closeBtn}>
              <Text style={m.closeX}>✕</Text>
            </Pressable>
          </View>

          <View style={m.monthNav}>
            <Pressable hitSlop={14} onPress={prevMonth} style={m.navBtn}>
              <Text style={m.navArrow}>−</Text>
            </Pressable>
            <Text style={m.monthLabel} numberOfLines={1}>{MONTHS[viewMonth]} {viewYear}</Text>
            <Pressable hitSlop={14} onPress={nextMonth} style={m.navBtn}>
              <Text style={m.navArrow}>+</Text>
            </Pressable>
          </View>

          <View style={m.dayHeads}>
            {DAY_HEADS.map(d => (
              <Text key={d} style={m.dayHead}>{d}</Text>
            ))}
          </View>

          <View style={m.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`pad_${idx}`} style={m.cell} />;
              }
              const dv: DateVal = { year: viewYear, month: viewMonth, day };
              const isSelected = same(dv, selected);
              const isPast = cmp(dv, todayVal) < 0;
              const isToday = same(dv, todayVal);

              return (
                <Pressable
                  key={day}
                  disabled={isPast}
                  style={[m.cell, isSelected && m.selectedCell]}
                  onPress={() => handleDay(day)}
                >
                  <Text style={[
                    m.dayText,
                    isPast && m.pastDayText,
                    isSelected && m.selectedDayText,
                    isToday && !isSelected && m.todayText,
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={m.selectedRow}>
            <Text style={m.selectedLabel}>Expiry date</Text>
            <Text style={[m.selectedValue, !selected && m.selectedEmpty]} numberOfLines={1}>
              {selected ? `${MONTHS[selected.month]} ${selected.day}, ${selected.year}` : "—"}
            </Text>
          </View>

          <View style={m.btnRow}>
            <Pressable style={m.cancelBtn} onPress={onCancel}>
              <Text style={m.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[m.saveBtn, !canSave && m.saveDisabled]}
              onPress={() => selected && onSave(toIsoDate(selected))}
              disabled={!canSave}
            >
              <Text style={m.saveText}>{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 40;

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#0F1C30",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 20,
    gap: 14,
  },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 16, color: WHITE, paddingRight: 8 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  closeX: { fontFamily: "Poppins_500Medium", fontSize: 14, color: DIM, lineHeight: 18 },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,101,0,0.18)",
    borderWidth: 1, borderColor: "rgba(255,101,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  navArrow: { fontFamily: "Poppins_700Bold", fontSize: 22, color: ORANGE, lineHeight: 28 },
  monthLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: WHITE, flexShrink: 1, textAlign: "center" },

  dayHeads: { flexDirection: "row", justifyContent: "space-around" },
  dayHead: {
    width: CELL_SIZE, textAlign: "center",
    fontFamily: "Poppins_500Medium", fontSize: 11, color: MUTED,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around" },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: "center", justifyContent: "center" },
  selectedCell: { backgroundColor: ORANGE, borderRadius: CELL_SIZE / 2 },

  dayText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: WHITE },
  pastDayText: { color: "rgba(255,255,255,0.15)" },
  selectedDayText: { color: WHITE, fontFamily: "Poppins_700Bold" },
  todayText: { color: ORANGE },

  selectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },
  selectedValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: WHITE },
  selectedEmpty: { color: MUTED },

  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: DIM },

  saveBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center", justifyContent: "center",
  },
  saveDisabled: { opacity: 0.38 },
  saveText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: WHITE },
});
