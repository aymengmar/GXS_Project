import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

// react-native-web stubs out Alert.alert as a no-op, so preview builds in a
// browser need a window.alert/confirm fallback to actually show feedback.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmClose(onConfirm: () => void) {
  const title = "Close Day?";
  const message =
    "This will lock the return records and send the summary to Admin. You cannot edit returns after closing the day.";
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

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const RETURNS_SUMMARY = {
  date: "01 July 2026",
  assignedPackets: "1,240",
  returnedPackets: "35",
  drivers: "6",
  pendingSignatures: "2",
};

const RETURN_SUMMARY_CARDS = {
  totalAssigned: "1,240 packets",
  totalReturned: "35 packets",
  confirmedDrivers: "4 drivers",
  pendingDrivers: "2 drivers",
  sentAssignments: "6 assignments",
};

type SignatureStatus = "required" | "confirmed" | "notStarted";

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
  signature: SignatureStatus;
}

const INITIAL_RETURNS: DriverReturn[] = [
  {
    id: "1",
    initials: "AG",
    color: ORANGE,
    bg: "rgba(255,101,0,0.15)",
    name: "Aymouna Gmar",
    driverId: "DRV-2026-001",
    zip: "12345",
    assigned: 100,
    returned: 5,
    signature: "required",
  },
  {
    id: "2",
    initials: "AD",
    color: BLUE,
    bg: "rgba(59,130,246,0.15)",
    name: "Ahmed Driver",
    driverId: "DRV-2026-002",
    zip: "14725",
    assigned: 80,
    returned: 3,
    signature: "confirmed",
  },
  {
    id: "3",
    initials: "SC",
    color: GREEN,
    bg: "rgba(34,197,94,0.15)",
    name: "Sara Chen",
    driverId: "DRV-2026-003",
    zip: "36945",
    assigned: 120,
    returned: 0,
    signature: "confirmed",
  },
  {
    id: "4",
    initials: "MK",
    color: PURPLE,
    bg: "rgba(168,85,247,0.15)",
    name: "Mehmet Kaya",
    driverId: "DRV-2026-004",
    zip: "12536",
    assigned: 60,
    returned: 2,
    signature: "confirmed",
  },
  {
    id: "5",
    initials: "LH",
    color: TEAL,
    bg: "rgba(6,182,212,0.15)",
    name: "Lina Hossain",
    driverId: "DRV-2026-005",
    zip: "20099",
    assigned: 110,
    returned: 0,
    signature: "notStarted",
  },
  {
    id: "6",
    initials: "JB",
    color: AMBER,
    bg: "rgba(245,158,11,0.15)",
    name: "John Becker",
    driverId: "DRV-2026-006",
    zip: "22087",
    assigned: 70,
    returned: 0,
    signature: "notStarted",
  },
];

const CLOSE_DAY_CHECKLIST: string[] = [
  "Total assigned packets reviewed",
  "Returned packets entered",
  "Driver signatures collected",
  "Assignment summary ready for Admin",
];

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
function signatureBadgeStyle(status: SignatureStatus) {
  if (status === "confirmed") return { color: GREEN, bg: "rgba(34,197,94,0.15)", label: "Confirmed" };
  if (status === "required") return { color: ORANGE, bg: "rgba(255,101,0,0.15)", label: "Required" };
  return { color: DIM, bg: INNER, label: "Not started" };
}

function sentSignatureLabel(status: SignatureStatus) {
  if (status === "confirmed") return { color: GREEN, label: "Confirmed" };
  if (status === "required") return { color: ORANGE, label: "Signature Required" };
  return { color: DIM, label: "Not Started" };
}

// ─── small building blocks ───────────────────────────────────────────────────
function IconChip({
  children,
  size = 34,
}: {
  children: React.ReactNode;
  bg?: string;
  size?: number;
}) {
  return <View style={[styles.iconChip, { width: size, height: size }]}>{children}</View>;
}

function StatItem({
  icon,
  label,
  value,
  valueColor = WHITE,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statItem}>
      <IconChip size={36}>{icon}</IconChip>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <IconChip size={36}>{icon}</IconChip>
      <Text style={styles.summaryCardLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.summaryCardValue}>{value}</Text>
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
  const badge = signatureBadgeStyle(driver.signature);
  const isConfirmed = driver.signature === "confirmed";

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

function SentAssignmentRow({ driver, isLast }: { driver: DriverReturn; isLast: boolean }) {
  const sig = sentSignatureLabel(driver.signature);
  return (
    <View style={[styles.sentRow, !isLast && styles.rowDivider]}>
      <View style={[styles.sentAvatar, { backgroundColor: driver.bg }]}>
        <Text style={[styles.sentAvatarText, { color: driver.color }]}>{driver.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName} numberOfLines={1}>
          {driver.name}
        </Text>
        <Text style={styles.sentDetailText}>
          ZIP {driver.zip} · {driver.assigned} assigned · {driver.returned} returned
        </Text>
      </View>
      <Text style={[styles.sentSignatureText, { color: sig.color }]}>{sig.label}</Text>
    </View>
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
    if (!Number.isFinite(num) || num < 0) {
      setError("Returned packets cannot be negative.");
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
  onConfirm: () => void;
}) {
  const [signed, setSigned] = useState(mode === "view");

  if (!driver) return null;

  const isView = mode === "view";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Driver Confirmation</Text>
            <Pressable hitSlop={14} onPress={onCancel}>
              <XIcon />
            </Pressable>
          </View>

          <Text style={styles.confirmText}>
            I confirm that I returned {returnedPackets} packets to the warehouse for ZIP{" "}
            {driver.zip}.
          </Text>

          <View style={styles.sheetInfoCard}>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Driver</Text>
              <Text style={styles.sheetInfoValue}>{driver.name}</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Assigned yesterday</Text>
              <Text style={styles.sheetInfoValue}>{driver.assigned} packets</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Returned today</Text>
              <Text style={styles.sheetInfoValue}>{returnedPackets} packets</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoLabel}>Warehouse</Text>
              <Text style={styles.sheetInfoValue}>Hamburg Main Warehouse</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Driver signature</Text>
          <Pressable
            style={styles.signaturePad}
            onPress={() => !isView && setSigned((prev) => !prev)}
            disabled={isView}
          >
            {signed ? (
              <>
                <CheckCircleIcon size={22} color={GREEN} />
                <Text style={styles.signaturePadSignedText}>
                  {isView ? "Signed by driver" : "Signature captured"}
                </Text>
              </>
            ) : (
              <Text style={styles.signaturePadPlaceholder}>Tap to sign · Driver signature</Text>
            )}
          </Pressable>

          {isView ? (
            <View style={styles.sheetActionsRow}>
              <Pressable style={styles.primaryBtn} onPress={onCancel}>
                <Text style={styles.primaryBtnText}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.sheetActionsRow}>
                <Pressable style={styles.clearBtn} onPress={() => setSigned(false)}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={onConfirm}>
                  <Text style={styles.primaryBtnText}>Confirm Return</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehouseReturnsScreen() {
  const [returns, setReturns] = useState<DriverReturn[]>(INITIAL_RETURNS);
  const [dayClosed, setDayClosed] = useState(false);

  const [addReturnDriverId, setAddReturnDriverId] = useState<string | null>(null);
  const [addReturnModalKey, setAddReturnModalKey] = useState(0);

  const [signatureDriverId, setSignatureDriverId] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"confirm" | "view">("confirm");
  const [pendingReturnedPackets, setPendingReturnedPackets] = useState(0);
  const [signatureModalKey, setSignatureModalKey] = useState(0);

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

  const handleConfirmReturn = () => {
    setReturns((prev) =>
      prev.map((d) =>
        d.id === signatureDriverId
          ? { ...d, returned: pendingReturnedPackets, signature: "confirmed" }
          : d
      )
    );
    setSignatureDriverId(null);
    notify("Return confirmed.", "The driver's returned packets and signature have been recorded.");
  };

  const handleCloseDay = () => {
    confirmClose(() => {
      setDayClosed(true);
      notify("Day closed and summary sent to Admin.", "Return records for yesterday are now locked.");
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
          <View style={styles.card}>
            <View style={styles.accentBar} />
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryTitleRow}>
                <View style={styles.summaryIconBox}>
                  <ClipboardIcon size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Yesterday&apos;s Returns</Text>
                  <Text style={styles.cardText}>
                    Record returned packets from yesterday&apos;s driver assignments.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryMetaRow}>
              <View style={styles.summaryDateRow}>
                <CalendarIcon />
                <Text style={styles.summaryMetaText}>
                  Assignment date: <Text style={styles.summaryMetaValue}>{RETURNS_SUMMARY.date}</Text>
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending validation</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatItem
                icon={<BoxIcon size={26} />}
                label="Assigned Packets"
                value={RETURNS_SUMMARY.assignedPackets}
              />
              <StatItem
                icon={<ReturnArrowsIcon size={26} />}
                label="Returned Packets"
                value={RETURNS_SUMMARY.returnedPackets}
              />
              <StatItem
                icon={<PeopleIcon size={26} />}
                label="Drivers"
                value={RETURNS_SUMMARY.drivers}
              />
              <StatItem
                icon={<PencilIcon size={26} />}
                label="Pending Signatures"
                value={RETURNS_SUMMARY.pendingSignatures}
                valueColor={ORANGE}
              />
            </View>
          </View>

          {/* ── Returns by Driver ─────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Returns by Driver</Text>
            <Text style={styles.sectionCountText}>{returns.length} drivers</Text>
          </View>
          <View style={styles.card}>
            {returns.map((driver, i) => (
              <View key={driver.id} style={i !== returns.length - 1 ? styles.rowDivider : undefined}>
                <DriverReturnRow
                  driver={driver}
                  dayClosed={dayClosed}
                  onAddReturn={() => openAddReturn(driver)}
                  onViewSignature={() => openViewSignature(driver)}
                />
              </View>
            ))}
          </View>

          {/* ── Return Summary ────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Return Summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon={<BoxIcon size={24} />}
              label="Total Assigned Yesterday"
              value={RETURN_SUMMARY_CARDS.totalAssigned}
            />
            <SummaryCard
              icon={<ReturnArrowsIcon size={24} />}
              label="Total Returned Today"
              value={RETURN_SUMMARY_CARDS.totalReturned}
            />
            <SummaryCard
              icon={<PeopleIcon size={24} />}
              label="Confirmed Returns"
              value={RETURN_SUMMARY_CARDS.confirmedDrivers}
            />
            <SummaryCard
              icon={<PencilIcon size={24} />}
              label="Pending Signatures"
              value={RETURN_SUMMARY_CARDS.pendingDrivers}
            />
            <SummaryCard
              icon={<SendIcon size={24} color={BLUE} />}
              label="Sent Assignments"
              value={RETURN_SUMMARY_CARDS.sentAssignments}
            />
          </View>

          {/* ── Yesterday's Sent Assignments ──────────────────────────────── */}
          <Text style={styles.sectionLabel}>Yesterday&apos;s Sent Assignments</Text>
          <View style={styles.card}>
            {returns.map((driver, i) => (
              <SentAssignmentRow key={driver.id} driver={driver} isLast={i === returns.length - 1} />
            ))}
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

            {CLOSE_DAY_CHECKLIST.map((item) => (
              <View key={item} style={styles.checklistRow}>
                <CheckCircleIcon size={16} color={GREEN} />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}

            <View style={styles.warningBox}>
              <WarningIcon size={16} />
              <Text style={styles.warningText}>2 driver signatures are still pending</Text>
            </View>

            <Pressable
              style={[styles.closeDayBtn, dayClosed && styles.closeDayBtnDisabled]}
              onPress={handleCloseDay}
              disabled={dayClosed}
            >
              <SendIcon size={15} color={WHITE} />
              <Text style={styles.closeDayBtnText}>
                {dayClosed ? "Day Closed" : "Close Day & Send to Admin"}
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
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },

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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionCountText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: ORANGE,
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

  // ── Yesterday's Returns
  summaryHeaderRow: { marginBottom: 12 },
  summaryTitleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
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
  summaryMetaRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  summaryDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
  },
  summaryMetaValue: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
  pendingBadge: {
    flexShrink: 0,
    backgroundColor: "rgba(255,101,0,0.14)",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pendingBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: ORANGE,
  },

  // ── Icon wrapper (used by stats + summary cards) — transparent, icon only
  iconChip: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "transparent",
  },

  // ── Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  statItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingRight: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: DIM,
    lineHeight: 13,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    marginTop: 2,
  },

  // ── Returns by Driver rows
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  driverRow: {
    paddingVertical: 14,
    gap: 12,
  },
  driverRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  driverName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  driverIdText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnDisabled: {
    borderColor: BORDER,
  },
  actionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: ORANGE,
  },
  driverRowDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  driverDetailCell: { width: "50%", gap: 3 },
  driverDetailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
  },
  driverDetailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  returnedChip: {
    alignSelf: "flex-start",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  miniBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  miniBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },

  // ── Return Summary cards
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryCardLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
    lineHeight: 14,
  },
  summaryCardValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },

  // ── Sent Assignments
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  sentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sentAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11.5,
  },
  sentDetailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
    marginTop: 1,
  },
  sentSignatureText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    textAlign: "right",
    flexShrink: 0,
    maxWidth: 90,
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
  warningText: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AMBER,
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
  signaturePad: {
    height: 110,
    borderWidth: 1.5,
    borderColor: "rgba(255,101,0,0.4)",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: INNER,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 18,
  },
  signaturePadPlaceholder: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: MUTED,
  },
  signaturePadSignedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: GREEN,
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
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
});
