import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const ORANGE = "#FF6500";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.55)";
const MUTED = "rgba(255,255,255,0.30)";
const BORDER_SUBTLE = "rgba(255,255,255,0.08)";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_HEADS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export type DateVal = { year: number; month: number; day: number };

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
function between(d: DateVal, s: DateVal | null, e: DateVal | null) {
  return !!s && !!e && cmp(d, s) > 0 && cmp(d, e) < 0;
}
export function fmtDate(d: DateVal | null) {
  if (!d) return "—";
  return `${MONTHS[d.month]} ${d.day}, ${d.year}`;
}

interface Props {
  visible: boolean;
  initialStart?: DateVal | null;
  initialEnd?: DateVal | null;
  onCancel: () => void;
  onValidate: (start: DateVal, end: DateVal) => void;
}

export default function AdminCustomDateModal({ visible, initialStart, initialEnd, onCancel, onValidate }: Props) {
  const today = new Date();

  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [start, setStart]         = useState<DateVal | null>(null);
  const [end, setEnd]             = useState<DateVal | null>(null);
  const [pickingEnd, setPickingEnd] = useState(false);

  useEffect(() => {
    if (visible) {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setStart(initialStart ?? null);
      setEnd(initialEnd ?? null);
      setPickingEnd(false);
    }
  }, [visible]);

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
    if (!start || (start && end)) {
      setStart(d); setEnd(null); setPickingEnd(true);
    } else if (pickingEnd) {
      if (cmp(d, start) < 0) {
        setStart(d); setEnd(null);
      } else {
        setEnd(d); setPickingEnd(false);
      }
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset    = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const canValidate = start !== null && end !== null;

  let hint = "Tap a start date";
  if (start && !end) hint = "Now tap an end date";
  if (start && end)  hint = "Date range selected";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={m.overlay}>
        <View style={m.sheet}>

          {/* ── header ─────────────────────────── */}
          <View style={m.headerRow}>
            <Text style={m.headerTitle}>Select Custom Period</Text>
            <Pressable hitSlop={14} onPress={onCancel} style={m.closeBtn}>
              <Text style={m.closeX}>✕</Text>
            </Pressable>
          </View>

          <Text style={m.hint} numberOfLines={1}>{hint}</Text>

          {/* ── month navigator ─────────────────── */}
          <View style={m.monthNav}>
            <Pressable hitSlop={14} onPress={prevMonth} style={m.navBtn}>
              <Text style={m.navArrow}>−</Text>
            </Pressable>
            <Text style={m.monthLabel} numberOfLines={1}>{MONTHS[viewMonth]} {viewYear}</Text>
            <Pressable hitSlop={14} onPress={nextMonth} style={m.navBtn}>
              <Text style={m.navArrow}>+</Text>
            </Pressable>
          </View>

          {/* ── weekday headers ─────────────────── */}
          <View style={m.dayHeads}>
            {DAY_HEADS.map(d => (
              <Text key={d} style={m.dayHead}>{d}</Text>
            ))}
          </View>

          {/* ── calendar grid ───────────────────── */}
          <View style={m.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`pad_${idx}`} style={m.cell} />;
              }
              const dv: DateVal = { year: viewYear, month: viewMonth, day };
              const isStart   = same(dv, start);
              const isEnd     = same(dv, end);
              const inRange   = between(dv, start, end);
              const isToday   = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

              return (
                <Pressable
                  key={day}
                  style={[
                    m.cell,
                    inRange  && m.inRange,
                    (isStart || isEnd) && m.selectedCell,
                  ]}
                  onPress={() => handleDay(day)}
                >
                  <Text style={[
                    m.dayText,
                    inRange  && m.inRangeText,
                    (isStart || isEnd) && m.selectedDayText,
                    isToday && !isStart && !isEnd && m.todayText,
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── range display ───────────────────── */}
          <View style={m.rangeRow}>
            <View style={m.rangeBox}>
              <Text style={m.rangeLabel}>Start date</Text>
              <Text style={[m.rangeValue, !start && m.rangeEmpty]} numberOfLines={1} adjustsFontSizeToFit>{fmtDate(start)}</Text>
            </View>
            <View style={m.rangeDivider} />
            <View style={m.rangeBox}>
              <Text style={m.rangeLabel}>End date</Text>
              <Text style={[m.rangeValue, !end && m.rangeEmpty]} numberOfLines={1} adjustsFontSizeToFit>{fmtDate(end)}</Text>
            </View>
          </View>

          {/* ── action buttons ──────────────────── */}
          <View style={m.btnRow}>
            <Pressable style={m.cancelBtn} onPress={onCancel}>
              <Text style={m.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[m.validateBtn, !canValidate && m.validateDisabled]}
              onPress={() => start && end && onValidate(start, end)}
              disabled={!canValidate}
            >
              <Text style={m.validateText}>Validate</Text>
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
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17, color: WHITE },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  closeX: { fontFamily: "Poppins_500Medium", fontSize: 14, color: DIM, lineHeight: 18 },

  hint: { fontFamily: "Poppins_400Regular", fontSize: 12, color: DIM, textAlign: "center" },

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
  inRange:      { backgroundColor: "rgba(255,101,0,0.13)" },
  selectedCell: { backgroundColor: ORANGE, borderRadius: CELL_SIZE / 2 },

  dayText:         { fontFamily: "Poppins_500Medium", fontSize: 13, color: WHITE },
  inRangeText:     { color: ORANGE },
  selectedDayText: { color: WHITE, fontFamily: "Poppins_700Bold" },
  todayText:       { color: ORANGE },

  rangeRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    overflow: "hidden",
  },
  rangeBox:     { flex: 1, padding: 12, gap: 3 },
  rangeDivider: { width: 1, backgroundColor: BORDER_SUBTLE },
  rangeLabel:   { fontFamily: "Poppins_400Regular", fontSize: 10, color: MUTED },
  rangeValue:   { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: WHITE },
  rangeEmpty:   { color: MUTED },

  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: DIM },

  validateBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center", justifyContent: "center",
  },
  validateDisabled: { opacity: 0.38 },
  validateText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: WHITE },
});
