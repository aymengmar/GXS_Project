import {
  DriverInvoiceItem,
  DriverInvoiceReviewStatus,
  DriverInvoiceType,
  DriverInvoicesListResponse,
  fetchDriverInvoices,
  uploadDriverInvoice,
} from "@/api/backendClient";
import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import DriverDocumentPreviewModal from "@/components/driver/DriverDocumentPreviewModal";
import { sessionStore } from "@/store/sessionStore";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const PURPLE = "#8B5CF6";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.35)";
const DIM = "rgba(255,255,255,0.55)";
const MODAL_BG = "#0F1C30";
const MODAL_BORDER = "rgba(255,255,255,0.10)";

// ─── invoice type + status config ──────────────────────────────────────────────
type InvoiceStatus = DriverInvoiceReviewStatus;
type FilterId = "all" | InvoiceStatus;

interface UploadInvoiceErrors {
  type?: string;
  date?: string;
  amount?: string;
  receipt?: string;
}

const INVOICE_TYPE_META: Record<DriverInvoiceType, { label: string; emoji: string; bg: string }> = {
  fuel: { label: "Diesel / Fuel", emoji: "⛽", bg: "rgba(255,101,0,0.20)" },
  parking: { label: "Parking", emoji: "🅿️", bg: "rgba(139,92,246,0.20)" },
  toll: { label: "Toll", emoji: "🛣️", bg: "rgba(16,185,129,0.20)" },
  repair_maintenance: { label: "Repair & Maintenance", emoji: "🔧", bg: "rgba(59,130,246,0.20)" },
  car_wash: { label: "Car Wash", emoji: "🧼", bg: "rgba(6,182,212,0.20)" },
  other: { label: "Other", emoji: "🧾", bg: "rgba(245,158,11,0.20)" },
};

const INVOICE_TYPE_OPTIONS: { id: DriverInvoiceType; label: string }[] = (
  Object.keys(INVOICE_TYPE_META) as DriverInvoiceType[]
).map((id) => ({ id, label: INVOICE_TYPE_META[id].label }));

// ─── upload invoice form types ─────────────────────────────────────────────────
type ReceiptSource = "photo" | "gallery" | "pdf";

interface ReceiptFileState {
  name: string;
  uri: string;
  mimeType: string;
  source: ReceiptSource;
}

// ─── calendar helpers ───────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarDate = { year: number; month: number; day: number };

function daysInCalendarMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstWeekdayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function compareCalendarDates(a: CalendarDate, b: CalendarDate) {
  const da = new Date(a.year, a.month, a.day);
  const db = new Date(b.year, b.month, b.day);
  return da < db ? -1 : da > db ? 1 : 0;
}
function isSameCalendarDate(a: CalendarDate | null, b: CalendarDate | null) {
  return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}
function calendarDateToIso(d: CalendarDate): string {
  const mm = String(d.month + 1).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}
function isoToCalendarDate(iso: string | null | undefined): CalendarDate | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
}
function formatCalendarDateLabel(iso: string): string {
  const d = isoToCalendarDate(iso);
  if (!d) return "";
  return `${MONTHS[d.month]} ${d.day}, ${d.year}`;
}

// ─── icons ────────────────────────────────────────────────────────────────────
function PersonIcon({ size = 22, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.8} />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ListIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="9" y1="6" x2="20" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="12" x2="20" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="18" x2="20" y2="18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="4.5" cy="6" r="1.4" fill={color} />
      <Circle cx="4.5" cy="12" r="1.4" fill={color} />
      <Circle cx="4.5" cy="18" r="1.4" fill={color} />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 16, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ size = 16, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function DocFileIcon({ size = 22, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 22, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="17" cy="13.5" r="1.4" fill={color} />
    </Svg>
  );
}

function UploadCloudIcon({ size = 20, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 16l-4-4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ size = 20, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XIcon({ size = 16, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="3.2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ImageIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="9.5" r="1.6" stroke={color} strokeWidth={1.6} />
      <Path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L5 19" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CategoryIcon({ type }: { type: DriverInvoiceType }) {
  const cfg = INVOICE_TYPE_META[type];
  return (
    <View style={[styles.invoiceIconBox, { backgroundColor: cfg.bg }]}>
      <Text style={styles.categoryEmoji}>{cfg.emoji}</Text>
    </View>
  );
}

const FILTERS: { id: FilterId; label: string; icon?: (color: string) => React.ReactNode; color: string }[] = [
  { id: "all", label: "All", icon: (c) => <ListIcon color={c} />, color: ORANGE },
  { id: "pending", label: "Pending", icon: (c) => <ClockIcon color={c} />, color: AMBER },
  { id: "approved", label: "Approved", icon: (c) => <CheckCircleIcon color={c} />, color: GREEN },
  { id: "rejected", label: "Rejected", icon: (c) => <XCircleIcon color={c} />, color: RED },
];

// ─── building blocks ────────────────────────────────────────────────────────
function SummaryCard({
  icon,
  iconBg,
  value,
  valueColor,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  valueColor: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.summaryValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function TotalAmountCard({ value, subtitle }: { value: string; subtitle: string }) {
  return (
    <View style={styles.totalAmountCard}>
      <View style={[styles.summaryIconBox, { backgroundColor: "rgba(139,92,246,0.15)" }]}>
        <WalletIcon size={20} color={PURPLE} />
      </View>
      <View style={styles.totalAmountTextCol}>
        <Text style={styles.totalAmountLabel}>Total Amount</Text>
        <Text style={styles.totalAmountSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.totalAmountValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "approved") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
        <CheckCircleIcon size={13} color={GREEN} />
        <Text style={[styles.badgeText, { color: GREEN }]}>Approved</Text>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
        <XCircleIcon size={13} color={RED} />
        <Text style={[styles.badgeText, { color: RED }]}>Rejected</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
      <ClockIcon size={13} color={AMBER} />
      <Text style={[styles.badgeText, { color: AMBER }]}>Pending</Text>
    </View>
  );
}

function ReceiptThumbnail() {
  return (
    <View style={styles.receiptThumb}>
      <View style={styles.receiptLine} />
      <View style={[styles.receiptLine, { width: "70%" }]} />
      <View style={[styles.receiptLine, { width: "85%" }]} />
      <View style={[styles.receiptLine, { width: "60%" }]} />
    </View>
  );
}

function InvoiceCard({
  invoice,
  onView,
}: {
  invoice: DriverInvoiceItem;
  onView: (invoice: DriverInvoiceItem) => void;
}) {
  const isRejected = invoice.review_status === "rejected";
  const meta = INVOICE_TYPE_META[invoice.invoice_type];

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceTopRow}>
        <CategoryIcon type={invoice.invoice_type} />

        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceTitle}>{meta?.label ?? invoice.invoice_type}</Text>
          <Text style={styles.invoiceDate}>{formatCalendarDateLabel(invoice.invoice_date)}</Text>
          {invoice.details ? <Text style={styles.invoiceDetail}>{invoice.details}</Text> : null}
        </View>

        <View style={styles.invoiceAmountCol}>
          <Text style={styles.invoiceAmount}>€{invoice.amount.toFixed(2)}</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        </View>
      </View>

      <View style={styles.invoiceBottomRow}>
        <ReceiptThumbnail />
        <View style={styles.invoiceBottomRight}>
          <StatusBadge status={invoice.review_status} />
          <Pressable
            style={isRejected ? styles.replaceBtn : styles.viewBtn}
            onPress={isRejected ? undefined : () => onView(invoice)}
          >
            <Text style={isRejected ? styles.replaceBtnText : styles.viewBtnText}>
              {isRejected ? "Replace Invoice" : "View"}
            </Text>
          </Pressable>
        </View>
      </View>

      {isRejected ? (
        <Text style={styles.rejectedNote}>
          Invoice was rejected. Please replace it if requested.
        </Text>
      ) : null}
    </View>
  );
}

// ─── upload invoice modal building blocks ──────────────────────────────────────
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>
        {label}
        {required ? <Text style={styles.requiredStar}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.formError}>{error}</Text> : null}
    </View>
  );
}

function ReceiptSourceCard({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.receiptSourceCard, active && styles.receiptSourceCardActive]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.receiptSourceLabel}>{label}</Text>
    </Pressable>
  );
}

function InvoiceTypeSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: DriverInvoiceType | null;
  onSelect: (id: DriverInvoiceType) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.typeSheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Select Invoice Type</Text>
          {INVOICE_TYPE_OPTIONS.map((opt) => {
            const active = selected === opt.id;
            const cfg = INVOICE_TYPE_META[opt.id];
            return (
              <Pressable
                key={opt.id}
                style={[styles.typeOptionRow, active && styles.typeOptionRowActive]}
                onPress={() => onSelect(opt.id)}
              >
                <View style={[styles.typeOptionIconBox, { backgroundColor: cfg.bg }]}>
                  <Text style={styles.typeOptionEmoji}>{cfg.emoji}</Text>
                </View>
                <Text style={[styles.typeOptionText, active && styles.typeOptionTextActive]}>
                  {opt.label}
                </Text>
                {active ? <CheckCircleIcon size={16} color={ORANGE} /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InvoiceDateModal({
  visible,
  selectedIso,
  onCancel,
  onSave,
}: {
  visible: boolean;
  selectedIso: string | null;
  onCancel: () => void;
  onSave: (iso: string) => void;
}) {
  const today = new Date();
  const todayVal: CalendarDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  const initialSelected = isoToCalendarDate(selectedIso);

  // Parent remounts this component (via `key`) each time it is opened, so
  // these initial values only need to be computed once, at mount.
  const [viewYear, setViewYear] = useState(initialSelected?.year ?? todayVal.year);
  const [viewMonth, setViewMonth] = useState(initialSelected?.month ?? todayVal.month);
  const [selected, setSelected] = useState<CalendarDate | null>(initialSelected);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function handleDayPress(day: number) {
    const d: CalendarDate = { year: viewYear, month: viewMonth, day };
    if (compareCalendarDates(d, todayVal) > 0) return;
    setSelected(d);
  }

  const totalDays = daysInCalendarMonth(viewYear, viewMonth);
  const offset = firstWeekdayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.sheetOverlay}>
        <View style={styles.calendarSheet}>
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.sheetTitle}>Select Invoice Date</Text>
            <Pressable hitSlop={14} onPress={onCancel} style={styles.uploadCloseBtn}>
              <XIcon size={14} color={DIM} />
            </Pressable>
          </View>

          <View style={styles.monthNavRow}>
            <Pressable hitSlop={14} onPress={prevMonth} style={styles.monthNavBtn}>
              <Text style={styles.monthNavArrow}>−</Text>
            </Pressable>
            <Text style={styles.monthNavLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable hitSlop={14} onPress={nextMonth} style={styles.monthNavBtn}>
              <Text style={styles.monthNavArrow}>+</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((d) => (
              <Text key={d} style={styles.weekdayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`pad_${idx}`} style={styles.calendarCell} />;
              }
              const dv: CalendarDate = { year: viewYear, month: viewMonth, day };
              const active = isSameCalendarDate(dv, selected);
              const future = compareCalendarDates(dv, todayVal) > 0;
              const isToday = isSameCalendarDate(dv, todayVal);

              return (
                <Pressable
                  key={day}
                  disabled={future}
                  style={[styles.calendarCell, active && styles.calendarCellActive]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      future && styles.calendarDayDisabled,
                      active && styles.calendarDayActiveText,
                      isToday && !active && styles.calendarDayToday,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.uploadBtnRow}>
            <Pressable style={styles.uploadCancelBtn} onPress={onCancel}>
              <Text style={styles.uploadCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.uploadSaveBtn, !selected && styles.uploadSaveDisabled]}
              disabled={!selected}
              onPress={() => selected && onSave(calendarDateToIso(selected))}
            >
              <Text style={styles.uploadSaveText}>Select</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReceiptPreviewModal({
  receipt,
  onRetake,
  onValidate,
  onClose,
}: {
  receipt: ReceiptFileState | null;
  onRetake: () => void;
  onValidate: () => void;
  onClose: () => void;
}) {
  if (!receipt) return null;
  const isImage = receipt.mimeType.startsWith("image/");

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.previewSheet}>
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.sheetTitle}>Receipt Preview</Text>
            <Pressable hitSlop={14} onPress={onClose} style={styles.uploadCloseBtn}>
              <XIcon size={14} color={DIM} />
            </Pressable>
          </View>

          <View style={styles.previewBox}>
            {isImage ? (
              <Image source={{ uri: receipt.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewPdfBox}>
                <DocFileIcon size={40} color={ORANGE} />
                <Text style={styles.previewPdfLabel}>PDF Document</Text>
              </View>
            )}
          </View>
          <Text style={styles.previewFileName} numberOfLines={1}>
            {receipt.name}
          </Text>

          <View style={styles.uploadBtnRow}>
            <Pressable style={styles.uploadCancelBtn} onPress={onRetake}>
              <Text style={styles.uploadCancelText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.uploadSaveBtn} onPress={onValidate}>
              <Text style={styles.uploadSaveText}>Validate</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UploadInvoiceModal({
  visible,
  accessToken,
  onCancel,
  onUploaded,
}: {
  visible: boolean;
  accessToken: string;
  onCancel: () => void;
  onUploaded: () => void;
}) {
  const [invoiceType, setInvoiceType] = useState<DriverInvoiceType | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [receiptFile, setReceiptFile] = useState<ReceiptFileState | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<ReceiptFileState | null>(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<UploadInvoiceErrors>({});
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalKey, setDateModalKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  function openDateModal() {
    // Force a remount of InvoiceDateModal so its calendar re-derives the
    // selected day from the latest invoiceDate instead of a stale render.
    setDateModalKey((k) => k + 1);
    setDateModalVisible(true);
  }

  async function handleTakePhoto() {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in your device settings to take a receipt photo.",
        );
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPendingReceipt({
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "receipt.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        source: "photo",
      });
    }
  }

  async function handleChooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPendingReceipt({
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "receipt.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        source: "gallery",
      });
    }
  }

  async function handleUploadPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPendingReceipt({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/pdf",
        source: "pdf",
      });
    }
  }

  function handleRetakeReceipt() {
    const source = pendingReceipt?.source;
    setPendingReceipt(null);
    if (source === "photo") handleTakePhoto();
    else if (source === "gallery") handleChooseImage();
    else if (source === "pdf") handleUploadPdf();
  }

  function handleValidateReceipt() {
    if (!pendingReceipt) return;
    setReceiptFile(pendingReceipt);
    setPendingReceipt(null);
    setErrors((prev) => ({ ...prev, receipt: undefined }));
  }

  async function handleSave() {
    const nextErrors: UploadInvoiceErrors = {};
    if (!invoiceType) nextErrors.type = "Please select invoice type.";
    if (!invoiceDate) nextErrors.date = "Please select invoice date.";
    let numericAmount = 0;
    if (!amount.trim()) {
      nextErrors.amount = "Please enter invoice amount.";
    } else {
      numericAmount = Number(amount.replace(",", "."));
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        nextErrors.amount = "Please enter a valid amount.";
      }
    }
    if (!receiptFile) nextErrors.receipt = "Please add a receipt file.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!invoiceType || !invoiceDate || !receiptFile) return;

    setSubmitting(true);
    try {
      await uploadDriverInvoice(
        {
          invoiceType,
          invoiceDate,
          amount: numericAmount,
          details: details.trim() || undefined,
          notes: notes.trim() || undefined,
          file: { uri: receiptFile.uri, name: receiptFile.name, mimeType: receiptFile.mimeType },
        },
        accessToken,
      );
      onUploaded();
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Could not upload invoice. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.uploadSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.uploadScrollContent}
            >
              <View style={styles.uploadHeaderRow}>
                <View style={styles.uploadHeaderTextCol}>
                  <Text style={styles.uploadTitle}>Upload Invoice</Text>
                  <Text style={styles.uploadSubtitle}>Add your company car invoice details.</Text>
                </View>
                <Pressable hitSlop={14} onPress={onCancel} style={styles.uploadCloseBtn}>
                  <XIcon size={14} color={DIM} />
                </Pressable>
              </View>

              <FormField label="Invoice Type" required error={errors.type}>
                <Pressable
                  style={[styles.selectInput, errors.type && styles.inputError]}
                  onPress={() => setTypeSheetVisible(true)}
                >
                  {invoiceType ? (
                    <View
                      style={[
                        styles.selectedTypeIconBox,
                        { backgroundColor: INVOICE_TYPE_META[invoiceType].bg },
                      ]}
                    >
                      <Text style={styles.typeOptionEmoji}>{INVOICE_TYPE_META[invoiceType].emoji}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.selectInputText, !invoiceType && styles.placeholderText]}>
                    {invoiceType ? INVOICE_TYPE_META[invoiceType].label : "Select invoice type"}
                  </Text>
                  <ChevronDownIcon size={16} color={MUTED} />
                </Pressable>
              </FormField>

              <FormField label="Invoice Date" required error={errors.date}>
                <Pressable
                  style={[styles.selectInput, errors.date && styles.inputError]}
                  onPress={openDateModal}
                >
                  <Text style={[styles.selectInputText, !invoiceDate && styles.placeholderText]}>
                    {invoiceDate ? formatCalendarDateLabel(invoiceDate) : "Select date"}
                  </Text>
                  <CalendarIcon size={16} color={MUTED} />
                </Pressable>
              </FormField>

              <FormField label="Amount" required error={errors.amount}>
                <TextInput
                  style={[styles.textInput, errors.amount && styles.inputError]}
                  placeholder="€0.00"
                  placeholderTextColor={MUTED}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v);
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                />
              </FormField>

              <FormField label="Details">
                <TextInput
                  style={styles.textInput}
                  placeholder="Example: 48 L, Toll A7, Parking ticket"
                  placeholderTextColor={MUTED}
                  value={details}
                  onChangeText={setDetails}
                />
              </FormField>

              <FormField label="Receipt" required error={errors.receipt}>
                <Text style={styles.receiptInstruction}>Add receipt file</Text>
                <View style={styles.receiptCardsRow}>
                  <ReceiptSourceCard
                    icon={<CameraIcon size={20} color={ORANGE} />}
                    label="Take Photo"
                    active={receiptFile?.source === "photo"}
                    onPress={handleTakePhoto}
                  />
                  <ReceiptSourceCard
                    icon={<ImageIcon size={20} color={ORANGE} />}
                    label="Choose Image"
                    active={receiptFile?.source === "gallery"}
                    onPress={handleChooseImage}
                  />
                  <ReceiptSourceCard
                    icon={<DocFileIcon size={20} color={ORANGE} />}
                    label="Upload PDF File"
                    active={receiptFile?.source === "pdf"}
                    onPress={handleUploadPdf}
                  />
                </View>
                {receiptFile ? (
                  <View style={styles.receiptFileChip}>
                    {receiptFile.mimeType.startsWith("image/") ? (
                      <Image source={{ uri: receiptFile.uri }} style={styles.receiptFileThumb} />
                    ) : (
                      <DocFileIcon size={16} color={ORANGE} />
                    )}
                    <Text style={styles.receiptFileName} numberOfLines={1}>
                      {receiptFile.name}
                    </Text>
                    <Pressable hitSlop={10} onPress={() => setReceiptFile(null)}>
                      <XIcon size={12} color={MUTED} />
                    </Pressable>
                  </View>
                ) : null}
              </FormField>

              <FormField label="Notes">
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add a short note if needed"
                  placeholderTextColor={MUTED}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </FormField>

              <View style={styles.uploadBtnRow}>
                <Pressable style={styles.uploadCancelBtn} onPress={onCancel} disabled={submitting}>
                  <Text style={styles.uploadCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.uploadSaveBtn, submitting && styles.uploadSaveDisabled]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={WHITE} />
                  ) : (
                    <Text style={styles.uploadSaveText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <InvoiceTypeSheet
        visible={typeSheetVisible}
        selected={invoiceType}
        onSelect={(id) => {
          setInvoiceType(id);
          setErrors((prev) => ({ ...prev, type: undefined }));
          setTypeSheetVisible(false);
        }}
        onClose={() => setTypeSheetVisible(false)}
      />

      <InvoiceDateModal
        key={dateModalKey}
        visible={dateModalVisible}
        selectedIso={invoiceDate}
        onCancel={() => setDateModalVisible(false)}
        onSave={(iso) => {
          setInvoiceDate(iso);
          setErrors((prev) => ({ ...prev, date: undefined }));
          setDateModalVisible(false);
        }}
      />

      <ReceiptPreviewModal
        receipt={pendingReceipt}
        onRetake={handleRetakeReceipt}
        onValidate={handleValidateReceipt}
        onClose={() => setPendingReceipt(null)}
      />
    </>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

export default function DriverInvoicesScreen({ onNavigate: _onNavigate }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadModalKey, setUploadModalKey] = useState(0);
  const [data, setData] = useState<DriverInvoicesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<DriverInvoiceItem | null>(null);

  const session = sessionStore.get();
  const accessToken = session?.kind === "driver" ? session.access_token : "";

  const load = useCallback(async (isRefresh: boolean) => {
    const s = sessionStore.get();
    if (s?.kind !== "driver") return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchErr(null);

    try {
      const result = await fetchDriverInvoices(s.access_token);
      setData(result);
    } catch (err: unknown) {
      setFetchErr(err instanceof Error ? err.message : "Could not load invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  function openUploadModal() {
    // Force a remount of UploadInvoiceModal so every open starts with empty fields.
    setUploadModalKey((k) => k + 1);
    setUploadModalVisible(true);
  }

  const summary = data?.summary ?? {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_amount_this_month: 0,
  };

  const visibleInvoices =
    activeFilter === "all"
      ? (data?.items ?? [])
      : (data?.items ?? []).filter((inv) => inv.review_status === activeFilter);

  const previewDoc = previewInvoice
    ? {
        id: previewInvoice.id,
        document_type: "invoice_receipt",
        title: previewInvoice.invoice_number,
        description: "",
        review_status: previewInvoice.review_status,
        review_status_label: "",
        review_status_color: "",
        uploaded_at: null,
        updated_at: null,
        last_updated_label: "",
        file_name: previewInvoice.file_name,
        mime_type: previewInvoice.mime_type,
        signed_url: previewInvoice.receipt_preview_url,
      }
    : null;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={ORANGE} />
          }
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>Company car</Text>
              <Text style={styles.headerTitle}>Invoices</Text>
              <Text style={styles.headerSub}>Upload and track your company car invoices</Text>
            </View>
            <View style={styles.headerRight}>
              <View>
                <View style={styles.profileBtn}>
                  <PersonIcon size={22} color={WHITE} />
                </View>
                <View style={styles.notifDot} />
              </View>
              <View style={styles.headerIconRow}>
                <Pressable style={styles.headerIconBtn}>
                  <SearchIcon size={17} color={WHITE} />
                </Pressable>
                <Pressable style={styles.headerIconBtn}>
                  <FilterIcon size={17} color={WHITE} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── Summary cards ────────────────────────────────────────────────── */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryGridRow}>
              <SummaryCard
                icon={<DocFileIcon size={15} color={BLUE} />}
                iconBg="rgba(59,130,246,0.15)"
                value={String(summary.total)}
                valueColor={WHITE}
                label="Total Invoices"
              />
              <SummaryCard
                icon={<ClockIcon size={15} color={AMBER} />}
                iconBg="rgba(245,158,11,0.15)"
                value={String(summary.pending)}
                valueColor={AMBER}
                label="Pending"
              />
            </View>
            <View style={styles.summaryGridRow}>
              <SummaryCard
                icon={<CheckCircleIcon size={15} color={GREEN} />}
                iconBg="rgba(34,197,94,0.15)"
                value={String(summary.approved)}
                valueColor={GREEN}
                label="Approved"
              />
              <SummaryCard
                icon={<XCircleIcon size={15} color={RED} />}
                iconBg="rgba(239,68,68,0.15)"
                value={String(summary.rejected)}
                valueColor={RED}
                label="Rejected"
              />
            </View>
          </View>

          <TotalAmountCard
            value={`€${summary.total_amount_this_month.toFixed(2)}`}
            subtitle="Approved, this month"
          />

          {/* ── Upload button ─────────────────────────────────────────────────── */}
          <Pressable style={styles.uploadBtn} onPress={openUploadModal}>
            <UploadCloudIcon size={20} color={WHITE} />
            <Text style={styles.uploadBtnText}>Upload Invoice</Text>
          </Pressable>

          {/* ── My Invoices ───────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>My Invoices</Text>

          {/* ── Filter tabs ───────────────────────────────────────────────────── */}
          <View style={styles.filterCard}>
            {FILTERS.map((f) => {
              const active = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  style={styles.filterTab}
                  onPress={() => setActiveFilter(f.id)}
                >
                  {f.icon ? f.icon(active ? f.color : MUTED) : null}
                  <Text style={[styles.filterTabText, { color: active ? f.color : MUTED }]}>
                    {f.label}
                  </Text>
                  {active ? <View style={[styles.filterUnderline, { backgroundColor: f.color }]} /> : null}
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : fetchErr ? (
            <View style={styles.errorBox}>
              <XCircleIcon size={32} color={RED} />
              <Text style={styles.errorTitle}>Could not load invoices</Text>
              <Pressable style={styles.retryBtn} onPress={() => load(false)}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : visibleInvoices.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No invoices yet</Text>
            </View>
          ) : (
            visibleInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onView={setPreviewInvoice} />
            ))
          )}

          {/* ── Invoice review info card ──────────────────────────────────────── */}
          <View style={styles.infoCard}>
            <InfoIcon size={20} color={BLUE} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Invoice review</Text>
              <Text style={styles.infoText}>
                Your uploaded invoices will be reviewed by the admin team. Approved invoices are
                included in your company car cost summary.
              </Text>
            </View>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>

      <UploadInvoiceModal
        key={uploadModalKey}
        visible={uploadModalVisible}
        accessToken={accessToken}
        onCancel={() => setUploadModalVisible(false)}
        onUploaded={() => {
          setUploadModalVisible(false);
          Alert.alert("Invoice uploaded and sent for review.");
          load(false);
        }}
      />

      <DriverDocumentPreviewModal
        visible={!!previewInvoice}
        document={previewDoc}
        onClose={() => setPreviewInvoice(null)}
      />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    marginTop: 1,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },
  headerIconRow: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  // Summary cards
  summaryGrid: {
    marginBottom: 8,
  },
  summaryGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 3,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  summaryLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
  },

  // Total amount card
  totalAmountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  totalAmountTextCol: {
    flex: 1,
    gap: 2,
  },
  totalAmountLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  totalAmountSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
  },
  totalAmountValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
  },

  // Filter tabs
  filterCard: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    position: "relative",
  },
  filterTabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  filterUnderline: {
    position: "absolute",
    bottom: 0,
    width: "70%",
    height: 2,
    borderRadius: 2,
  },

  // Upload button
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    marginBottom: 20,
  },
  uploadBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // Section title
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
    marginBottom: 12,
  },

  // Loading / error / empty states
  loadingBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // Invoice card
  invoiceCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  invoiceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  invoiceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  invoiceInfo: {
    flex: 1,
    gap: 2,
  },
  invoiceTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  invoiceDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  invoiceDetail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  invoiceAmountCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  invoiceAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  invoiceNumber: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  invoiceBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  invoiceBottomRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: 8,
  },
  receiptThumb: {
    width: 44,
    height: 56,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    justifyContent: "center",
    gap: 4,
  },
  receiptLine: {
    height: 2,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 1,
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  // Buttons
  viewBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  viewBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },
  replaceBtn: {
    borderWidth: 1.5,
    borderColor: RED,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  replaceBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: RED,
  },
  rejectedNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: -4,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginTop: 6,
  },
  infoTextCol: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },

  // ── Upload Invoice modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  uploadSheet: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: MODAL_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: MODAL_BORDER,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  uploadScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  uploadHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  uploadHeaderTextCol: {
    flex: 1,
    paddingRight: 12,
    gap: 3,
  },
  uploadTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    color: WHITE,
  },
  uploadSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  uploadCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Form fields
  formField: {
    gap: 8,
  },
  formLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: MUTED,
  },
  requiredStar: {
    color: ORANGE,
  },
  formError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: RED,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectInputText: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  placeholderText: {
    color: MUTED,
    fontFamily: "Poppins_400Regular",
  },
  textInput: {
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: RED,
  },

  // Receipt
  receiptInstruction: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: WHITE,
  },
  receiptCardsRow: {
    flexDirection: "row",
    gap: 8,
  },
  receiptSourceCard: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  receiptSourceCardActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.12)",
  },
  receiptSourceLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: WHITE,
    textAlign: "center",
  },
  receiptFileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,101,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  receiptFileName: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: WHITE,
  },
  receiptFileThumb: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },

  // Receipt preview modal
  previewSheet: {
    width: "100%",
    backgroundColor: MODAL_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MODAL_BORDER,
    padding: 20,
    gap: 14,
  },
  previewBox: {
    height: 240,
    borderRadius: 14,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPdfBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewPdfLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: MUTED,
  },
  previewFileName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },

  // Buttons row (shared by upload modal + date modal)
  uploadBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  uploadCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadCancelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DIM,
  },
  uploadSaveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadSaveDisabled: {
    opacity: 0.38,
  },
  uploadSaveText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },

  // Sheet overlay (invoice type + date sub-modals)
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheetTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 10,
  },

  // Invoice type sheet
  typeSheet: {
    width: "100%",
    backgroundColor: MODAL_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MODAL_BORDER,
    padding: 18,
  },
  typeOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  typeOptionRowActive: {
    backgroundColor: "rgba(255,101,0,0.12)",
  },
  typeOptionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeOptionEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  typeOptionText: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  typeOptionTextActive: {
    color: ORANGE,
    fontFamily: "Poppins_600SemiBold",
  },
  selectedTypeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  // Invoice date calendar
  calendarSheet: {
    width: "100%",
    backgroundColor: MODAL_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MODAL_BORDER,
    padding: 20,
    gap: 14,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,101,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavArrow: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: ORANGE,
    lineHeight: 28,
  },
  monthNavLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekdayLabel: {
    width: 40,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: MUTED,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  calendarCell: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: ORANGE,
    borderRadius: 20,
  },
  calendarDayText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: WHITE,
  },
  calendarDayDisabled: {
    color: "rgba(255,255,255,0.15)",
  },
  calendarDayActiveText: {
    color: WHITE,
    fontFamily: "Poppins_700Bold",
  },
  calendarDayToday: {
    color: ORANGE,
  },
});
