import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { images } from "@/constants/images";
import {
  closeWarehouseReturnDay,
  fetchWarehouseYesterdayReturnDrivers,
  fetchWarehouseYesterdayReturnsSummary,
  saveWarehouseReturnRecord,
  type SignatureStrokesData,
  type WarehouseReturnDayCloseResponse,
  type WarehouseReturnDriverItem,
  type WarehouseReturnSignatureStatus,
  type WarehouseReturnsYesterdaySummaryResponse,
} from "@/api/backendClient";
import { sessionStore } from "@/store/sessionStore";

// react-native-web stubs out Alert.alert as a no-op, so preview builds in a
// browser need a window.alert/confirm fallback to actually show feedback.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmCloseDay(onConfirm: () => void) {
  const title = "Close return day?";
  const message = "This will send yesterday's return summary to Admin.";
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Close Day", style: "default", onPress: onConfirm },
    ]);
  }
}

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const PURPLE = "#A855F7";
const TEAL = "#06B6D4";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

// Narrow handheld/scanner screens (e.g. SEUIC Android devices) need a
// stacked header instead of the two-column desktop-style layout.
const SMALL_SCREEN_MAX_WIDTH = 380;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function withOpacity(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Yesterday's Returns summary (dynamic, from API) ─────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatAssignmentDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];
  if (!year || !monthName || !day) return isoDate;
  return `${day} ${monthName} ${year}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

const RETURNS_STATUS_LABELS: Record<string, string> = {
  pending_validation: "Pending validation",
  no_assignment: "No assignment",
};

function formatReturnsStatus(status: string | null): string {
  if (!status) return "—";
  return RETURNS_STATUS_LABELS[status] ?? status;
}

type SignatureStatus = WarehouseReturnSignatureStatus | "required";

interface DriverReturn {
  id: string;
  initials: string;
  color: string;
  bg: string;
  name: string;
  driverId: string;
  zip: string;
  assigned: number;
  returned: number;
  signatureStatus: SignatureStatus;
  hasSignature: boolean;
  signaturePaths?: string[];
}

const AVATAR_PALETTE: { color: string; bg: string }[] = [
  { color: ORANGE, bg: "rgba(255,101,0,0.15)" },
  { color: BLUE, bg: "rgba(59,130,246,0.15)" },
  { color: GREEN, bg: "rgba(34,197,94,0.15)" },
  { color: PURPLE, bg: "rgba(168,85,247,0.15)" },
  { color: TEAL, bg: "rgba(6,182,212,0.15)" },
  { color: AMBER, bg: "rgba(245,158,11,0.15)" },
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Backend never returns full signature_data on the list endpoint, so any
// strokes captured locally this session are preserved across refreshes by
// carrying them over from the previous row with the same plan_item_id.
function mapReturnRow(
  row: WarehouseReturnDriverItem,
  index: number,
  previous?: DriverReturn,
): DriverReturn {
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return {
    id: row.plan_item_id,
    initials: getInitials(row.driver_name),
    color: palette.color,
    bg: palette.bg,
    name: row.driver_name,
    driverId: row.driver_external_id ?? "—",
    zip: row.zip_code,
    assigned: row.assigned_packets,
    returned: row.returned_packets,
    signatureStatus: row.signature_status,
    hasSignature: row.has_signature,
    signaturePaths: previous?.id === row.plan_item_id ? previous.signaturePaths : undefined,
  };
}

type CloseDayChecklistItem = { label: string; done: boolean; helperText?: string };

function buildCloseDayChecklist(
  summary: WarehouseReturnsYesterdaySummaryResponse | null
): CloseDayChecklistItem[] {
  const assignedYesterday = summary?.assigned_yesterday ?? 0;
  const pendingSignatures = summary?.pending_signatures ?? 0;
  const isClosed = summary?.is_closed ?? false;

  const totalAssignedReviewed = assignedYesterday > 0;
  const returnedPacketsReviewed = pendingSignatures === 0;
  const signaturesCollected = pendingSignatures === 0;
  const summaryReady = assignedYesterday > 0 && pendingSignatures === 0 && !isClosed;

  return [
    { label: "Total assigned packets reviewed", done: totalAssignedReviewed },
    { label: "Returned packets reviewed", done: returnedPacketsReviewed },
    {
      label: "Driver signatures collected",
      done: signaturesCollected,
      helperText: "Only drivers with returns need signatures",
    },
    { label: "Assignment summary ready for Admin", done: summaryReady },
  ];
}

type CloseDayWarningTone = "amber" | "green" | "neutral";
type CloseDayWarning = { text: string; tone: CloseDayWarningTone };

function buildCloseDayWarning(
  summary: WarehouseReturnsYesterdaySummaryResponse | null
): CloseDayWarning {
  const pendingSignatures = summary?.pending_signatures ?? 0;
  const returnedPackets = summary?.returned_packets ?? 0;
  const isClosed = summary?.is_closed ?? false;

  if (isClosed) {
    return { text: "Return day already sent to Admin", tone: "neutral" };
  }
  if (pendingSignatures > 0) {
    return { text: `${pendingSignatures} return signatures are still pending`, tone: "amber" };
  }
  if (returnedPackets > 0) {
    return { text: "Ready to close day", tone: "green" };
  }
  return { text: "No returned packets today. Ready to close day", tone: "green" };
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
function ClipboardIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 5a2 2 0 0 1 2-2M18 5a2 2 0 0 0-2-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6 4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12h6M9 16h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BoxIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReturnArrowsIcon({ size = 16, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PeopleIcon({ size = 16, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningIcon({ size = 18, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendIcon({ size = 16, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XIcon({ size = 14, color = DIM }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 13, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 2v3M17 2v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── badge helpers ────────────────────────────────────────────────────────────
const SIGNATURE_STATUS_BADGES: Record<string, { color: string; bg: string; label: string }> = {
  not_started: { color: DIM, bg: INNER, label: "No return" },
  required: { color: ORANGE, bg: "rgba(255,101,0,0.15)", label: "Required" },
  confirmed: { color: GREEN, bg: "rgba(34,197,94,0.15)", label: "Confirmed" },
};

function signatureBadgeStyle(status: SignatureStatus) {
  return SIGNATURE_STATUS_BADGES[status] ?? SIGNATURE_STATUS_BADGES.not_started;
}

function ReturnsGridCard({
  icon,
  accent,
  title,
  value,
  unit,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={[styles.gridCard, { borderColor: withOpacity(accent, 0.35) }]}>
      <View style={styles.gridCardTopRow}>
        <View style={[styles.gridCardIcon, { backgroundColor: withOpacity(accent, 0.15) }]}>
          {icon}
        </View>
        <ChevronRight size={16} color={accent} />
      </View>
      <Text style={styles.gridCardTitle}>{title}</Text>
      <Text style={[styles.gridCardValue, { color: accent }]}>{value}</Text>
      <Text style={styles.gridCardUnit}>{unit}</Text>
    </View>
  );
}

function DriverReturnRow({
  driver,
  dayClosed,
  onAddReturn,
  onViewSignature,
}: {
  driver: DriverReturn;
  dayClosed: boolean;
  onAddReturn: () => void;
  onViewSignature: () => void;
}) {
  const badge = signatureBadgeStyle(driver.signatureStatus);
  const isConfirmed = driver.signatureStatus === "confirmed" || driver.hasSignature;

  return (
    <View style={styles.driverRow}>
      <View style={styles.driverRowTop}>
        <View style={[styles.driverAvatar, { backgroundColor: driver.bg }]}>
          <Text style={[styles.driverInitials, { color: driver.color }]}>{driver.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverIdText}>{driver.driverId}</Text>
        </View>
        <Pressable
          style={[styles.actionBtn, dayClosed && styles.actionBtnDisabled]}
          onPress={isConfirmed ? onViewSignature : onAddReturn}
          disabled={dayClosed}
        >
          <Text style={styles.actionBtnText}>
            {isConfirmed ? "View Signature" : "Add Return"}
          </Text>
          <ChevronRight size={12} color={dayClosed ? MUTED : ORANGE} />
        </Pressable>
      </View>

      <View style={styles.driverRowDetails}>
        <View style={styles.driverDetailCell}>
          <Text style={styles.driverDetailLabel}>ZIP</Text>
          <Text style={styles.driverDetailValue}>{driver.zip}</Text>
        </View>
        <View style={styles.driverDetailCell}>
          <Text style={styles.driverDetailLabel}>Assigned</Text>
          <Text style={styles.driverDetailValue}>{driver.assigned} packets</Text>
        </View>
        <View style={styles.driverDetailCell}>
          <Text style={styles.driverDetailLabel}>Returned</Text>
          <View style={styles.returnedChip}>
            <Text style={styles.driverDetailValue}>{driver.returned} packets</Text>
          </View>
        </View>
        <View style={styles.driverDetailCell}>
          <Text style={styles.driverDetailLabel}>Signature</Text>
          <View style={[styles.miniBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.miniBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SentAssignmentCard({ driver }: { driver: DriverReturn }) {
  const badge = signatureBadgeStyle(driver.signatureStatus);
  return (
    <View style={[styles.driverCard, { borderColor: withOpacity(driver.color, 0.35) }]}>
      <View style={styles.sentCardTopRow}>
        <View style={[styles.sentAvatar, { backgroundColor: driver.bg }]}>
          <Text style={[styles.sentAvatarText, { color: driver.color }]}>{driver.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driver.name}
          </Text>
          <Text style={styles.driverIdText}>{driver.driverId}</Text>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.miniBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      <Text style={styles.sentDetailText}>
        ZIP {driver.zip} · {driver.assigned} assigned · {driver.returned} returned
      </Text>
    </View>
  );
}

function FrameSectionHeader({
  icon,
  title,
  badgeLabel,
  isSmallScreen,
}: {
  icon: React.ReactNode;
  title: string;
  badgeLabel: string;
  isSmallScreen: boolean;
}) {
  return (
    <>
      <View style={styles.driverSectionHeaderRow}>
        <View style={styles.driverSectionIconBox}>{icon}</View>
        <Text
          style={[
            isSmallScreen ? styles.returnsTitleSmall : styles.returnsTitle,
            styles.frameHeaderTitle,
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.frameHeaderBadgeRow}>
        <View style={styles.driverCountBadge}>
          <Text style={styles.driverCountBadgeText}>{badgeLabel}</Text>
        </View>
      </View>
    </>
  );
}

// ─── Add Return modal ────────────────────────────────────────────────────────
function AddReturnModal({
  visible,
  driver,
  onCancel,
  onContinue,
}: {
  visible: boolean;
  driver: DriverReturn | null;
  onCancel: () => void;
  onContinue: (returnedPackets: number) => void;
}) {
  const [value, setValue] = useState(
    driver && driver.returned > 0 ? String(driver.returned) : ""
  );
  const [error, setError] = useState("");

  if (!driver) return null;

  const handleContinue = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Returned packets is required.");
      return;
    }
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 0) {
      setError("Returned packets must be a whole number.");
      return;
    }
    if (num === 0) {
      setError("Returned packets must be greater than 0.");
      return;
    }
    if (num > driver.assigned) {
      setError("Returned packets cannot be more than assigned packets.");
      return;
    }
    setError("");
    onContinue(num);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Add Returned Packets</Text>
            <Pressable hitSlop={14} onPress={onCancel}>
              <XIcon />
            </Pressable>
          </View>

          <View style={styles.sheetInfoCard}>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Driver</Text>
              <Text style={styles.sheetInfoValue}>{driver.name}</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Assigned ZIP</Text>
              <Text style={styles.sheetInfoValue}>{driver.zip}</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Assigned yesterday</Text>
              <Text style={styles.sheetInfoValue}>{driver.assigned} packets</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Returned packets</Text>
          <TextInput
            style={[styles.textInput, !!error && styles.inputError]}
            placeholder="Enter returned packets"
            placeholderTextColor={MUTED}
            selectionColor={ORANGE}
            keyboardType="number-pad"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (error) setError("");
            }}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.sheetActionsRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={handleContinue}>
              <Text style={styles.primaryBtnText}>Continue to Signature</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Signature pad (white drawing surface) ───────────────────────────────────
const SIGNATURE_PAD_HEIGHT = 190;
const SIGNATURE_BORDER = "#D9DDE3";
const SIGNATURE_INK = "#1F2937";

function SignatureCanvas({
  paths,
  setPaths,
  editable,
}: {
  paths: string[];
  setPaths: React.Dispatch<React.SetStateAction<string[]>>;
  editable: boolean;
}) {
  // PanResponder's imperative, ref-mutating gesture callbacks aren't
  // something React Compiler can safely analyze/memoize — opt this
  // component out. See https://react.dev/reference/react-compiler/directives/use-no-memo
  "use no memo";

  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const currentPathRef = useRef<string | null>(null);

  const panResponder = useMemo(
    () =>
      // PanResponder handlers only ever run in response to touch gestures,
      // never during render, so reading/writing the ref inside them is safe;
      // the lint rule can't prove that for a generic third-party API.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => editable,
        onMoveShouldSetPanResponder: () => editable,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const path = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          currentPathRef.current = path;
          setCurrentPath(path);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const path = `${currentPathRef.current ?? ""} L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          currentPathRef.current = path;
          setCurrentPath(path);
        },
        onPanResponderRelease: () => {
          const finishedPath = currentPathRef.current;
          currentPathRef.current = null;
          setCurrentPath(null);
          if (finishedPath) {
            setPaths((prevPaths) => [...prevPaths, finishedPath]);
          }
        },
      }),
    [editable, setPaths]
  );

  const hasStrokes = paths.length > 0 || !!currentPath;

  return (
    <View
      style={styles.signatureBoxWrapper}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      {...(editable ? panResponder.panHandlers : {})}
    >
      {size.width > 0 && (
        <Svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
          <Line
            x1={16}
            y1={size.height - 26}
            x2={size.width - 16}
            y2={size.height - 26}
            stroke="rgba(31,41,55,0.15)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={SIGNATURE_INK}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={SIGNATURE_INK}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      )}
      {!editable && !hasStrokes && (
        <Text style={styles.signaturePadEmptyText}>
          Signature saved, but preview data is not available yet.
        </Text>
      )}
    </View>
  );
}

// ─── Signature modal ─────────────────────────────────────────────────────────
function SignatureModal({
  visible,
  driver,
  returnedPackets,
  mode,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  driver: DriverReturn | null;
  returnedPackets: number;
  mode: "confirm" | "view";
  onCancel: () => void;
  onConfirm: (paths: string[]) => Promise<void>;
}) {
  const isView = mode === "view";
  const [paths, setPaths] = useState<string[]>(
    isView && driver?.signaturePaths ? driver.signaturePaths : []
  );
  const [signatureError, setSignatureError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!driver) return null;

  const handleConfirmPress = async () => {
    if (paths.length === 0) {
      setSignatureError("Please ask the driver to sign first.");
      return;
    }
    setSignatureError("");
    setIsSaving(true);
    try {
      await onConfirm(paths);
    } catch (err) {
      setSignatureError(
        err instanceof Error ? err.message : "Unable to save return. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                {isView ? "Driver Signature" : "Driver Confirmation"}
              </Text>
              <Pressable hitSlop={14} onPress={onCancel}>
                <XIcon />
              </Pressable>
            </View>

            {!isView && (
              <Text style={styles.confirmText}>
                I confirm that I returned {returnedPackets} packets to the warehouse for ZIP{" "}
                {driver.zip}.
              </Text>
            )}

            <View style={styles.sheetInfoCard}>
              <View style={styles.sheetInfoRow}>
                <Text style={styles.sheetInfoLabel}>Driver</Text>
                <Text style={styles.sheetInfoValue}>{driver.name}</Text>
              </View>
              <View style={styles.sheetInfoRow}>
                <Text style={styles.sheetInfoLabel}>ZIP</Text>
                <Text style={styles.sheetInfoValue}>{driver.zip}</Text>
              </View>
              {!isView && (
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>Assigned yesterday</Text>
                  <Text style={styles.sheetInfoValue}>{driver.assigned} packets</Text>
                </View>
              )}
              <View style={styles.sheetInfoRow}>
                <Text style={styles.sheetInfoLabel}>Returned {isView ? "" : "today"}</Text>
                <Text style={styles.sheetInfoValue}>{returnedPackets} packets</Text>
              </View>
              {!isView && (
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>Warehouse</Text>
                  <Text style={styles.sheetInfoValue}>Hamburg Main Warehouse</Text>
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>Driver Signature</Text>
            {!isView && (
              <Text style={styles.signatureHelperText}>Driver signs inside the white box</Text>
            )}

            <SignatureCanvas paths={paths} setPaths={setPaths} editable={!isView} />

            {!isView && !!signatureError && (
              <Text style={styles.errorText}>{signatureError}</Text>
            )}

            {isView ? (
              <View style={styles.sheetActionsRow}>
                <Pressable style={styles.primaryBtn} onPress={onCancel}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.sheetActionsRow}>
                <Pressable
                  style={styles.clearBtn}
                  onPress={() => {
                    setPaths([]);
                    setSignatureError("");
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.clearBtnText}>Clear Signature</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={isSaving}>
                  <Text style={styles.cancelBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    (paths.length === 0 || isSaving) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleConfirmPress}
                  disabled={paths.length === 0 || isSaving}
                >
                  <Text style={styles.primaryBtnText}>
                    {isSaving ? "Saving..." : "Confirm Signature"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Close Day success modal ─────────────────────────────────────────────────
type CloseDaySuccessData = {
  returnedPackets: number;
  driversConfirmed: number;
  assignmentDateLabel: string;
};

function CloseDaySuccessModal({
  visible,
  data,
  onDone,
}: {
  visible: boolean;
  data: CloseDaySuccessData | null;
  onDone: () => void;
}) {
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <ShieldIcon size={36} color={GREEN} />
          </View>
          <Text style={styles.successTitle}>Return day closed!</Text>
          <Text style={styles.successSubtitle}>Summary sent to Admin</Text>
          <Text style={styles.successMessage}>
            Yesterday&apos;s returns, returned packets, and driver signatures were saved
            successfully.
          </Text>

          <View style={styles.successSummaryBox}>
            <View style={styles.successSummaryRow}>
              <Text style={styles.successSummaryLabel}>Returned packets</Text>
              <Text style={styles.successSummaryValue}>{data.returnedPackets}</Text>
            </View>
            <View style={styles.successSummaryRow}>
              <Text style={styles.successSummaryLabel}>Drivers with returns</Text>
              <Text style={styles.successSummaryValue}>{data.driversConfirmed}</Text>
            </View>
            <View style={styles.successSummaryRow}>
              <Text style={styles.successSummaryLabel}>Assignment date</Text>
              <Text style={styles.successSummaryValue}>{data.assignmentDateLabel}</Text>
            </View>
          </View>

          <Pressable style={styles.successDoneBtn} onPress={onDone}>
            <Text style={styles.successDoneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehouseReturnsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < SMALL_SCREEN_MAX_WIDTH;

  // The highlight row's icon + text + image must always fit inside the card's
  // inner (padded) width. Sizing the image purely from screenWidth left it
  // wider than the space actually left after the icon and label on real
  // narrow devices, so it visually bled past the card's rounded border.
  // Solve it from the real chrome (content padding, card padding, gaps) instead.
  const highlightRowGap = isSmallScreen ? 8 : 12;
  const returnsCardHPadding = isSmallScreen ? 14 : 16;
  const highlightCardHPadding = 14;
  // Reserve enough width for the "35" number (fontSize 42) and the
  // "Returned Packets" label to read cleanly on 1-2 lines before handing
  // whatever remains to the image — text must win the space fight, not lose it.
  const highlightTextReserve = 92;
  const highlightRowContentWidth =
    screenWidth - 2 * 20 - 2 * returnsCardHPadding - 2 * highlightCardHPadding - 2 * highlightRowGap;

  const highlightIconSize = isSmallScreen ? clamp(highlightRowContentWidth * 0.16, 40, 56) : 44;
  // Source art is nearly square (~1.1:1) now that its transparent margins are trimmed.
  const highlightImageWidth = isSmallScreen
    ? clamp(highlightRowContentWidth - highlightIconSize - highlightTextReserve, 64, 108)
    : 106;
  const highlightImageHeight = isSmallScreen ? clamp(highlightImageWidth * 0.91, 56, 95) : 96;

  const [returns, setReturns] = useState<DriverReturn[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  const [yesterdaySummary, setYesterdaySummary] =
    useState<WarehouseReturnsYesterdaySummaryResponse | null>(null);

  const [closingDay, setClosingDay] = useState(false);
  const [closeSuccessData, setCloseSuccessData] = useState<CloseDaySuccessData | null>(null);

  const loadYesterdaySummary = useCallback((accessToken: string) => {
    return fetchWarehouseYesterdayReturnsSummary(accessToken)
      .then((data) => setYesterdaySummary(data))
      .catch(() => {
        // Keep safe zero/placeholder values on failure instead of crashing the screen.
        setYesterdaySummary(null);
      });
  }, []);

  const loadReturnDrivers = useCallback((accessToken: string) => {
    return fetchWarehouseYesterdayReturnDrivers(accessToken)
      .then((data) => {
        setReturns((prevReturns) => {
          const prevById = new Map(prevReturns.map((d) => [d.id, d]));
          return data.rows.map((row, index) =>
            mapReturnRow(row, index, prevById.get(row.plan_item_id))
          );
        });
        setDriversError(null);
      })
      .catch((err) => {
        setDriversError(
          err instanceof Error ? err.message : "Unable to load returns by driver."
        );
      })
      .finally(() => setDriversLoading(false));
  }, []);

  useEffect(() => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    loadYesterdaySummary(session.access_token);
    loadReturnDrivers(session.access_token);
  }, [loadYesterdaySummary, loadReturnDrivers]);

  const [addReturnDriverId, setAddReturnDriverId] = useState<string | null>(null);
  const [addReturnModalKey, setAddReturnModalKey] = useState(0);

  const [signatureDriverId, setSignatureDriverId] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"confirm" | "view">("confirm");
  const [pendingReturnedPackets, setPendingReturnedPackets] = useState(0);
  const [signatureModalKey, setSignatureModalKey] = useState(0);

  const assignmentDateLabel = formatAssignmentDate(yesterdaySummary?.assignment_date ?? null);
  const returnsStatusLabel = formatReturnsStatus(yesterdaySummary?.status ?? null);
  const assignedYesterdayLabel = formatNumber(yesterdaySummary?.assigned_yesterday ?? 0);
  const driversInvolvedLabel = formatNumber(yesterdaySummary?.drivers_involved ?? 0);
  const returnedPacketsLabel = formatNumber(yesterdaySummary?.returned_packets ?? 0);
  const confirmedSignaturesLabel = formatNumber(yesterdaySummary?.confirmed_signatures ?? 0);
  const pendingSignaturesLabel = formatNumber(yesterdaySummary?.pending_signatures ?? 0);

  const isDayClosed = yesterdaySummary?.is_closed ?? false;
  const closeDayChecklist = useMemo(
    () => buildCloseDayChecklist(yesterdaySummary),
    [yesterdaySummary]
  );
  const closeDayWarning = useMemo(
    () => buildCloseDayWarning(yesterdaySummary),
    [yesterdaySummary]
  );

  const addReturnDriver = returns.find((d) => d.id === addReturnDriverId) ?? null;
  const signatureDriver = returns.find((d) => d.id === signatureDriverId) ?? null;

  const openAddReturn = (driver: DriverReturn) => {
    setAddReturnModalKey((k) => k + 1);
    setAddReturnDriverId(driver.id);
  };

  const openViewSignature = (driver: DriverReturn) => {
    setSignatureModalKey((k) => k + 1);
    setSignatureMode("view");
    setPendingReturnedPackets(driver.returned);
    setSignatureDriverId(driver.id);
  };

  const handleAddReturnContinue = (returnedPackets: number) => {
    setPendingReturnedPackets(returnedPackets);
    setAddReturnDriverId(null);
    setSignatureModalKey((k) => k + 1);
    setSignatureMode("confirm");
    setSignatureDriverId(addReturnDriverId);
  };

  const handleConfirmReturn = async (signaturePaths: string[]) => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") {
      throw new Error("Session expired. Please login again.");
    }
    const planItemId = signatureDriverId;
    if (!planItemId) return;

    const signatureData: SignatureStrokesData = {
      type: "signature_strokes",
      strokes: signaturePaths,
    };

    const saved = await saveWarehouseReturnRecord(
      session.access_token,
      planItemId,
      pendingReturnedPackets,
      signatureData
    );

    setReturns((prev) =>
      prev.map((d) =>
        d.id === planItemId
          ? {
              ...d,
              returned: saved.returned_packets,
              signatureStatus: saved.signature_status,
              hasSignature: saved.has_signature,
              signaturePaths,
            }
          : d
      )
    );
    setSignatureDriverId(null);
    notify("Return saved successfully.", "The driver's returned packets and signature have been recorded.");

    // Refresh the summary tiles in the background; the row itself is already up to date.
    loadYesterdaySummary(session.access_token);
  };

  const performCloseDay = async () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") {
      notify("Session expired", "Please login again.");
      return;
    }
    if (closingDay) return;

    setClosingDay(true);
    try {
      const result: WarehouseReturnDayCloseResponse = await closeWarehouseReturnDay(
        session.access_token
      );

      setCloseSuccessData({
        returnedPackets: result.total_returned_packets,
        driversConfirmed: result.confirmed_signatures,
        assignmentDateLabel: formatAssignmentDate(result.assignment_date),
      });

      // Refresh dynamic data so the checklist/warning/button reflect the closed state.
      await Promise.all([
        loadYesterdaySummary(session.access_token),
        loadReturnDrivers(session.access_token),
      ]);
    } catch (err) {
      notify(
        "Unable to close return day",
        err instanceof Error ? err.message : "Unable to close return day. Please try again."
      );
    } finally {
      setClosingDay(false);
    }
  };

  const handleCloseDayPress = () => {
    const assignedYesterday = yesterdaySummary?.assigned_yesterday ?? 0;
    const pendingSignatures = yesterdaySummary?.pending_signatures ?? 0;

    if (assignedYesterday <= 0) {
      notify("Cannot close day", "No assigned packets found for yesterday.");
      return;
    }
    if (pendingSignatures > 0) {
      notify("Cannot close day", `${pendingSignatures} return signatures are still pending.`);
      return;
    }

    confirmCloseDay(() => {
      void performCloseDay();
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header ────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Warehouse</Text>
              <Text style={styles.headerTitle}>Returns</Text>
              <Text style={styles.headerSubtitle}>
                Record yesterday&apos;s returned packets and driver signatures.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Yesterday's Returns ───────────────────────────────────────── */}
          <View style={[styles.returnsCard, isSmallScreen && styles.returnsCardSmall]}>
            {/* Header */}
            {isSmallScreen ? (
              <View style={styles.returnsHeaderSmall}>
                <View style={styles.returnsHeaderTopRow}>
                  <View style={styles.returnsIconBox}>
                    <ClipboardIcon size={22} color={ORANGE} />
                  </View>
                  <Text style={styles.returnsTitleSmall}>Yesterday&apos;s Returns</Text>
                </View>
                <Text style={styles.returnsSubtitle}>
                  Review and record returned packets from yesterday&apos;s assignments.
                </Text>
                <View style={styles.returnsDateRowSmall}>
                  <Text style={styles.returnsDateLabel}>Assignment date</Text>
                  <View style={styles.returnsDateValueRow}>
                    <CalendarIcon size={13} color={DIM} />
                    <Text style={styles.returnsDateValue}>{assignmentDateLabel}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.returnsHeaderRow}>
                <View style={styles.returnsHeaderLeft}>
                  <View style={styles.returnsIconBox}>
                    <ClipboardIcon size={22} color={ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.returnsTitle}>Yesterday&apos;s Returns</Text>
                    <Text style={styles.returnsSubtitle}>
                      Review and record returned packets from yesterday&apos;s assignments.
                    </Text>
                  </View>
                </View>
                <View style={styles.returnsHeaderDivider} />
                <View style={styles.returnsHeaderRight}>
                  <Text style={styles.returnsDateLabel}>Assignment date</Text>
                  <View style={styles.returnsDateValueRow}>
                    <CalendarIcon size={13} color={DIM} />
                    <Text style={styles.returnsDateValue}>{assignmentDateLabel}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.frameHeaderBadgeRow}>
              <View style={styles.pendingBadge}>
                <View style={styles.pendingBadgeDot} />
                <Text style={styles.pendingBadgeText}>{returnsStatusLabel}</Text>
              </View>
            </View>

            {/* Highlight: Returned Packets */}
            <View style={[styles.highlightCard, isSmallScreen && styles.highlightCardSmall]}>
              <View
                style={[
                  styles.highlightIconCircle,
                  isSmallScreen && {
                    width: highlightIconSize,
                    height: highlightIconSize,
                    borderRadius: highlightIconSize / 2,
                  },
                ]}
              >
                <ReturnArrowsIcon size={isSmallScreen ? 24 : 20} color={GREEN} />
              </View>
              <View style={styles.highlightTextCol}>
                <Text style={styles.highlightLabel} numberOfLines={2}>
                  Returned Packets
                </Text>
                <Text style={[styles.highlightNumber, isSmallScreen && styles.highlightNumberSmall]}>
                  {returnedPacketsLabel}
                </Text>
                <Text style={styles.highlightSubtitle}>Packets recorded today</Text>
              </View>
              <Image
                source={images.warehouseReturnsBoxes}
                style={[
                  styles.highlightImage,
                  isSmallScreen && { width: highlightImageWidth, height: highlightImageHeight },
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Overview grid */}
            <View style={styles.overviewGrid}>
              <ReturnsGridCard
                icon={<BoxIcon size={18} color={BLUE} />}
                accent={BLUE}
                title="Assigned Yesterday"
                value={assignedYesterdayLabel}
                unit="packets"
              />
              <ReturnsGridCard
                icon={<PeopleIcon size={18} color={BLUE} />}
                accent={BLUE}
                title="Drivers Involved"
                value={driversInvolvedLabel}
                unit="drivers"
              />
              <ReturnsGridCard
                icon={<PencilIcon size={18} color={GREEN} />}
                accent={GREEN}
                title="Confirmed Signatures"
                value={confirmedSignaturesLabel}
                unit="drivers"
              />
              <ReturnsGridCard
                icon={<PencilIcon size={18} color={ORANGE} />}
                accent={ORANGE}
                title="Pending Signatures"
                value={pendingSignaturesLabel}
                unit="drivers"
              />
            </View>
          </View>

          {/* ── Returns by Driver ─────────────────────────────────────────── */}
          <View style={[styles.returnsCard, isSmallScreen && styles.returnsCardSmall]}>
            <FrameSectionHeader
              icon={<PeopleIcon size={22} color={BLUE} />}
              title="Returns by Driver"
              badgeLabel={`${returns.length} drivers`}
              isSmallScreen={isSmallScreen}
            />

            {driversLoading && returns.length === 0 ? (
              <View style={styles.driverStateBox}>
                <ActivityIndicator color={ORANGE} />
                <Text style={styles.driverStateText}>Loading drivers…</Text>
              </View>
            ) : driversError && returns.length === 0 ? (
              <View style={styles.driverStateBox}>
                <WarningIcon size={20} />
                <Text style={styles.driverStateText}>{driversError}</Text>
              </View>
            ) : returns.length === 0 ? (
              <View style={styles.driverStateBox}>
                <PeopleIcon size={20} color={DIM} />
                <Text style={styles.driverStateText}>No returns to review yet.</Text>
              </View>
            ) : (
              <View style={styles.driverCardsList}>
                {returns.map((driver) => (
                  <View
                    key={driver.id}
                    style={[styles.driverCard, { borderColor: withOpacity(driver.color, 0.35) }]}
                  >
                    <DriverReturnRow
                      driver={driver}
                      dayClosed={isDayClosed}
                      onAddReturn={() => openAddReturn(driver)}
                      onViewSignature={() => openViewSignature(driver)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Yesterday's Sent Assignments ──────────────────────────────── */}
          <View style={[styles.returnsCard, isSmallScreen && styles.returnsCardSmall]}>
            <FrameSectionHeader
              icon={<SendIcon size={20} color={BLUE} />}
              title="Yesterday's Sent Assignments"
              badgeLabel={`${returns.length} assignments`}
              isSmallScreen={isSmallScreen}
            />

            <View style={styles.driverCardsList}>
              {returns.map((driver) => (
                <SentAssignmentCard key={driver.id} driver={driver} />
              ))}
            </View>
          </View>

          {/* ── Close Day ─────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.accentBar} />
            <View style={styles.closeDayHeaderRow}>
              <View style={styles.summaryIconBox}>
                <ShieldIcon size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Close Day</Text>
                <Text style={styles.cardText}>
                  Close yesterday&apos;s return process and send the summary to Admin.
                </Text>
              </View>
            </View>

            {closeDayChecklist.map((item) => (
              <View key={item.label} style={styles.checklistRow}>
                {item.done ? (
                  <CheckCircleIcon size={16} color={GREEN} />
                ) : (
                  <View style={styles.checklistPendingDot} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checklistText, item.done && styles.checklistTextDone]}>
                    {item.label}
                  </Text>
                  {!!item.helperText && (
                    <Text style={styles.checklistHelperText}>{item.helperText}</Text>
                  )}
                </View>
              </View>
            ))}

            <View
              style={[
                styles.warningBox,
                closeDayWarning.tone === "green" && styles.warningBoxGreen,
                closeDayWarning.tone === "neutral" && styles.warningBoxNeutral,
              ]}
            >
              {closeDayWarning.tone === "amber" && <WarningIcon size={16} />}
              {closeDayWarning.tone === "green" && <CheckCircleIcon size={16} color={GREEN} />}
              {closeDayWarning.tone === "neutral" && <ShieldIcon size={16} color={BLUE} />}
              <Text
                style={[
                  styles.warningText,
                  closeDayWarning.tone === "green" && styles.warningTextGreen,
                  closeDayWarning.tone === "neutral" && styles.warningTextNeutral,
                ]}
              >
                {closeDayWarning.text}
              </Text>
            </View>

            <Pressable
              style={[
                styles.closeDayBtn,
                (isDayClosed || closingDay) && styles.closeDayBtnDisabled,
              ]}
              onPress={handleCloseDayPress}
              disabled={isDayClosed || closingDay}
            >
              {closingDay ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <SendIcon size={15} color={WHITE} />
              )}
              <Text style={styles.closeDayBtnText}>
                {isDayClosed ? "Closed" : closingDay ? "Closing..." : "Close Day & Send to Admin"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <AddReturnModal
          key={`add-${addReturnModalKey}`}
          visible={!!addReturnDriver}
          driver={addReturnDriver}
          onCancel={() => setAddReturnDriverId(null)}
          onContinue={handleAddReturnContinue}
        />

        <SignatureModal
          key={`sig-${signatureModalKey}`}
          visible={!!signatureDriver}
          driver={signatureDriver}
          returnedPackets={pendingReturnedPackets}
          mode={signatureMode}
          onCancel={() => setSignatureDriverId(null)}
          onConfirm={handleConfirmReturn}
        />

        <CloseDaySuccessModal
          visible={!!closeSuccessData}
          data={closeSuccessData}
          onDone={() => setCloseSuccessData(null)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },

  // ── Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: WHITE,
    marginTop: 2,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    marginTop: 4,
    lineHeight: 17,
  },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: ORANGE,
  },
  avatarDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 10,
  },

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: ORANGE,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 4,
  },
  cardText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
  },

  // ── Yesterday's Returns (top section)
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBadge: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,101,0,0.14)",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pendingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },
  pendingBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: ORANGE,
  },

  // ── Yesterday's Returns
  returnsCard: {
    position: "relative",
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  returnsHeaderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  returnsHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    minWidth: "50%",
  },
  returnsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,101,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  returnsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
    marginBottom: 3,
  },
  returnsSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    lineHeight: 16,
  },
  returnsHeaderDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(148,163,184,0.25)",
  },
  returnsHeaderRight: {
    maxWidth: "44%",
    alignItems: "flex-end",
    gap: 7,
  },
  returnsDateLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
  },
  returnsDateValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  returnsDateValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Yesterday's Returns header — small screen (stacked, no divider)
  returnsCardSmall: {
    padding: 14,
  },
  returnsHeaderSmall: {
    marginBottom: 16,
    gap: 10,
  },
  returnsHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  returnsTitleSmall: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  returnsDateRowSmall: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 8,
    columnGap: 10,
  },

  // ── Highlight: Returned Packets
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    padding: 14,
    marginBottom: 14,
    gap: 12,
    overflow: "hidden",
  },
  highlightIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  highlightTextCol: {
    flex: 1,
    minWidth: 52,
  },
  highlightLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: DIM,
    marginBottom: 4,
  },
  highlightNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: GREEN,
    marginBottom: 2,
  },
  highlightSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
  },
  highlightImage: {
    width: 106,
    height: 96,
    flexShrink: 0,
  },

  // ── Highlight: Returned Packets — small screen
  highlightCardSmall: {
    minHeight: 128,
    paddingVertical: 16,
    gap: 8,
  },
  highlightNumberSmall: {
    fontSize: 42,
    lineHeight: 46,
  },

  // ── Overview grid
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridCard: {
    width: "48.5%",
    minHeight: 114,
    backgroundColor: INNER,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  gridCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gridCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    lineHeight: 16,
    color: WHITE,
    marginBottom: 4,
  },
  gridCardValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 2,
  },
  gridCardUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },

  // ── Returns by Driver rows
  driverSectionHeaderRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  frameHeaderTitle: {
    flex: 1,
    marginBottom: 0,
  },
  frameHeaderBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  driverSectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverCountBadge: {
    flexShrink: 0,
    backgroundColor: "rgba(59,130,246,0.14)",
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  driverCountBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: BLUE,
  },
  driverCardsList: {
    gap: 12,
  },
  driverStateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 28,
  },
  driverStateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: DIM,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  driverCard: {
    backgroundColor: INNER,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  driverRow: {
    gap: 16,
  },
  driverRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13.5,
  },
  driverName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14.5,
    color: WHITE,
  },
  driverIdText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 36,
  },
  actionBtnDisabled: {
    borderColor: BORDER,
  },
  actionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },
  driverRowDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  driverDetailCell: { width: "50%", gap: 5 },
  driverDetailLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  driverDetailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  returnedChip: {
    alignSelf: "flex-start",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  miniBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  miniBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  // ── Sent Assignments
  sentCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sentAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  sentDetailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
  },

  // ── Close Day
  closeDayHeaderRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  checklistText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  checklistTextDone: {
    color: WHITE,
  },
  checklistHelperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  checklistPendingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: MUTED,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  warningBoxGreen: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.35)",
  },
  warningBoxNeutral: {
    backgroundColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.35)",
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AMBER,
  },
  warningTextGreen: {
    color: GREEN,
  },
  warningTextNeutral: {
    color: BLUE,
  },
  closeDayBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDayBtnDisabled: {
    backgroundColor: INNER,
  },
  closeDayBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },

  // ── Modals (Add Return / Signature)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetScroll: {
    flexGrow: 0,
    maxHeight: "100%",
  },
  sheetScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  sheetInfoCard: {
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  sheetInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetInfoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  sheetInfoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    marginBottom: 8,
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
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: "#EF4444",
    marginTop: 6,
  },
  confirmText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 19,
    marginBottom: 16,
  },
  signatureHelperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: -4,
    marginBottom: 10,
  },
  signatureBoxWrapper: {
    height: SIGNATURE_PAD_HEIGHT,
    borderWidth: 1,
    borderColor: SIGNATURE_BORDER,
    borderRadius: 16,
    backgroundColor: WHITE,
    overflow: "hidden",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signaturePadEmptyText: {
    position: "absolute",
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: "rgba(31,41,55,0.45)",
    textAlign: "center",
    paddingHorizontal: 28,
  },
  sheetActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  clearBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DIM,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  primaryBtn: {
    flex: 1.4,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: INNER,
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Close Day success modal (dark navy glass)
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(3,7,15,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "rgba(13,26,46,0.92)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    color: WHITE,
    textAlign: "center",
  },
  successSubtitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: GREEN,
    marginTop: 4,
    textAlign: "center",
  },
  successMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 12,
  },
  successSummaryBox: {
    width: "100%",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
  },
  successSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successSummaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  successSummaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  successDoneBtn: {
    width: "100%",
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  successDoneBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
});
