import {
  addWarehouseZipCode,
  deleteWarehouseZipCode,
  fetchWarehouseZipCodes,
  updateWarehouseZipPacketCount,
  validateWarehouseZipCode,
  type WarehouseZipCodeItem,
  type WarehouseZipCodeSummary,
} from "@/api/backendClient";
import { sessionStore } from "@/store/sessionStore";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

function confirmRemoveZip(zip: string, onConfirm: () => void) {
  const title = "Remove ZIP Code?";
  const message = `Do you want to remove ZIP ${zip} from today’s list?`;
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: onConfirm },
    ]);
  }
}

function confirmUpdatePacketCount(
  zip: string,
  oldCount: number,
  newCount: number,
  onConfirm: () => void,
) {
  const title = "Update Packet Count?";
  const message = `Change ZIP ${zip} from ${oldCount} packets to ${newCount} packets?`;
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Update", onPress: onConfirm },
    ]);
  }
}

function confirmValidateZips(entries: ZipEntry[], onConfirm: () => void) {
  const title = "Validate ZIP?";
  const totalPackets = entries.reduce((sum, e) => sum + e.packets, 0);
  const message =
    entries.length === 1
      ? `Validate ZIP ${entries[0].zip} with ${formatNumber(totalPackets)} packets?`
      : `Validate ${entries.length} ZIP codes (${entries
          .map((e) => e.zip)
          .join(", ")}) with ${formatNumber(totalPackets)} packets total?`;
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Validate", onPress: onConfirm },
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
const BLUE = "#38BDF8";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";
const CARRIED_OVER = "#94A3B8";

// ─── helpers ──────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function placeholderAlert(title: string, message?: string) {
  Alert.alert(title, message);
}

function formatScanTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

// ─── static data (frontend UI only) ──────────────────────────────────────────
type ZipStatus = "validated" | "in_progress" | "not_counted";

const STATUS_META: Record<
  ZipStatus,
  {
    label: string;
    color: string;
    badgeBg: string;
    border: string;
    dotColor: string;
  }
> = {
  validated: {
    label: "Validated",
    color: GREEN,
    badgeBg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.45)",
    dotColor: GREEN,
  },
  in_progress: {
    label: "In progress",
    color: ORANGE,
    badgeBg: "rgba(255,101,0,0.15)",
    border: "rgba(255,101,0,0.45)",
    dotColor: ORANGE,
  },
  not_counted: {
    label: "Not counted",
    color: DIM,
    badgeBg: INNER,
    border: BORDER,
    dotColor: MUTED,
  },
};

type ZipEntry = {
  id: string;
  zip: string;
  packets: number;
  status: ZipStatus;
  carriedOverPackets: number;
  remainingPackets: number;
};

// Business rule: a ZIP with packets already counted, or with carried-over
// inventory, should read as "in progress" even if the backend hasn't flipped
// its status yet — carried-over ZIPs must never display as "Not counted".
function getDisplayStatus(item: WarehouseZipCodeItem): ZipStatus {
  if (item.status === "validated") return "validated";
  if (item.carried_over_packets > 0) return "in_progress";
  if (item.status === "not_counted" && item.packet_count > 0) return "in_progress";
  return item.status;
}

type IntakeScanStatus = "registered" | "duplicate";

const INTAKE_SCANS: {
  code: string;
  zip: string;
  status: IntakeScanStatus;
  time: string;
}[] = [
  {
    code: "JTDE100006341725",
    zip: "12689",
    status: "registered",
    time: "09:41",
  },
  {
    code: "BG-2605319634B7WF4N",
    zip: "14725",
    status: "registered",
    time: "09:41",
  },
  {
    code: "JTDE100006341725",
    zip: "12689",
    status: "duplicate",
    time: "09:40",
  },
];

const INTAKE_STATUS_META: Record<
  IntakeScanStatus,
  { label: string; color: string; bg: string }
> = {
  registered: { label: "Registered", color: GREEN, bg: "rgba(34,197,94,0.15)" },
  duplicate: { label: "Duplicate", color: ORANGE, bg: "rgba(255,101,0,0.15)" },
};

type CountMode = "zipCount" | "intakeScan";

const LAST_SCANNED_CODE = "JTDE100006341725";
const CURRENT_TIME = "09:41:23";

// ─── SVG icons ────────────────────────────────────────────────────────────────
function CheckCircleIcon({
  size = 18,
  color = GREEN,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="22 4 12 14.01 9 11.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DashedCircleIcon({
  size = 18,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="3 3.5"
      />
    </Svg>
  );
}

function RingIcon({
  size = 18,
  color = MUTED,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function CloseIcon({
  size = 14,
  color = DIM,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6 6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckMarkIcon({
  size = 11,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="20 6 9 17 4 12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({
  size = 14,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="6 9 12 15 18 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BoxIcon({
  size = 16,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8l-9-5-9 5v8l9 5 9-5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 8l9 5 9-5M12 13v8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScanIcon({
  size = 40,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 8V6a2 2 0 0 0-2-2h-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 16v2a2 2 0 0 0 2 2h2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 16v2a2 2 0 0 1-2 2h-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 9v6M10 9v6M13 9v6M16 9v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PinIcon({
  size = 15,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function LockIcon({
  size = 13,
  color = MUTED,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 11V7a6 6 0 0 1 12 0v4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({
  size = 13,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 5v14l12-7z" fill={color} />
    </Svg>
  );
}

function PauseIcon({
  size = 13,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 5h3v14H7zM14 5h3v14h-3z" fill={color} />
    </Svg>
  );
}

function PackageScanIcon({
  size = 40,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 8V6a2 2 0 0 0-2-2h-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 16v2a2 2 0 0 0 2 2h2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 16v2a2 2 0 0 1-2 2h-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.5 8 10.5v4l4 2 4-2v-4z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 10.5 12 12.5 16 10.5M12 12.5V17"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function KeyboardIcon({
  size = 14,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 6h20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M5 10h.01M8.5 10h.01M12 10h.01M15.5 10h.01M19 10h.01M7 14h10"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function DuplicateIcon({
  size = 14,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M5 15V5a2 2 0 0 1 2-2h10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WarningIcon({
  size = 14,
  color = "#EF4444",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 2 21h20L12 3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M12 10v4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="17" r="0.9" fill={color} />
    </Svg>
  );
}

// ─── small building blocks ───────────────────────────────────────────────────
function ZipCodesState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={ORANGE} />
        <Text style={styles.stateBoxText}>Loading today’s ZIP codes...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateBoxText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateBoxText}>No ZIP codes added today.</Text>
      <Text style={styles.stateBoxSubtitle}>
        Add the first ZIP code to start counting.
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: ZipStatus }) {
  const meta = STATUS_META[status];
  return (
    <View style={[styles.miniBadge, { backgroundColor: meta.badgeBg }]}>
      <Text
        style={[styles.miniBadgeText, { color: meta.color }]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
    </View>
  );
}

function CarriedOverBadge() {
  return (
    <View style={styles.carriedOverBadge}>
      <BoxIcon size={10} color={CARRIED_OVER} />
      <Text style={styles.carriedOverBadgeText} numberOfLines={1}>
        Carried over
      </Text>
    </View>
  );
}

function ScanStatusPill({ active }: { active: boolean }) {
  const color = active ? ORANGE : GREEN;
  const bg = active ? "rgba(255,101,0,0.15)" : "rgba(34,197,94,0.15)";
  const border = active ? "rgba(255,101,0,0.4)" : "rgba(34,197,94,0.4)";
  return (
    <View
      style={[
        styles.scanStatusPill,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View style={[styles.scanStatusDot, { backgroundColor: color }]} />
      <Text style={[styles.scanStatusText, { color }]} numberOfLines={1}>
        {active ? "Scanning..." : "Ready to scan"}
      </Text>
    </View>
  );
}

function ZipCountCard({ entry }: { entry: ZipEntry }) {
  const meta = STATUS_META[entry.status];
  return (
    <View style={[styles.countCard, { borderColor: meta.border }]}>
      <View style={styles.countCardTopRow}>
        {entry.status === "validated" ? (
          <CheckCircleIcon size={16} color={meta.color} />
        ) : entry.status === "in_progress" ? (
          <DashedCircleIcon size={16} color={meta.color} />
        ) : (
          <RingIcon size={16} color={meta.color} />
        )}
        <Text style={styles.countCardZip} numberOfLines={1}>
          {entry.zip}
        </Text>
      </View>
      <Text style={styles.countCardSub} numberOfLines={1}>
        {formatNumber(entry.remainingPackets)} packets
      </Text>
      <StatusBadge status={entry.status} />
      {/* Always reserve this row's space so every card is the same height,
          whether or not it carries a "Carried over" badge. */}
      <View style={{ opacity: entry.carriedOverPackets > 0 ? 1 : 0 }}>
        <CarriedOverBadge />
      </View>
    </View>
  );
}

function ZipChip({
  entry,
  onRemove,
}: {
  entry: ZipEntry;
  onRemove: () => void;
}) {
  const meta = STATUS_META[entry.status];
  const isLocked = entry.carriedOverPackets > 0 || entry.status === "validated";
  return (
    <View style={styles.zipChip}>
      <View style={styles.zipChipTopRow}>
        <Text style={styles.zipChipNumber}>{entry.zip}</Text>
        {isLocked ? (
          <LockIcon size={13} color={MUTED} />
        ) : (
          <Pressable onPress={onRemove} hitSlop={8}>
            <CloseIcon />
          </Pressable>
        )}
      </View>
      <Text style={styles.zipChipPackets}>
        {formatNumber(entry.remainingPackets)} packets
      </Text>
      <View style={styles.zipChipStatusRow}>
        <View style={[styles.zipChipDot, { backgroundColor: meta.dotColor }]} />
        <Text style={[styles.zipChipStatusText, { color: meta.color }]}>
          {meta.label}
        </Text>
      </View>
      {isLocked && <CarriedOverBadge />}
    </View>
  );
}

function ZipListRow({
  entry,
  isLast,
  checked,
  onToggleCheck,
}: {
  entry: ZipEntry;
  isLast: boolean;
  checked: boolean;
  onToggleCheck: () => void;
}) {
  // Only fully validated ZIPs are locked. Carried-over and in-progress
  // ZIPs still have packets that need validating, so they stay checkable
  // just like a fresh not_counted ZIP.
  const isLocked = entry.status === "validated";
  return (
    <View
      style={[
        styles.zipListRow,
        !isLast && styles.rowDivider,
        checked && styles.zipListRowSelected,
      ]}
    >
      <View style={styles.zipListTopRow}>
        <View style={styles.zipListLeft}>
          <PinIcon />
          <Text style={styles.zipListNumber}>ZIP {entry.zip}</Text>
        </View>
        <Text style={styles.zipListPackets} numberOfLines={1}>
          {formatNumber(entry.remainingPackets)} packets
        </Text>
      </View>
      <View style={styles.zipListBottomRow}>
        <View style={styles.zipListBadges}>
          <StatusBadge status={entry.status} />
          {entry.carriedOverPackets > 0 && <CarriedOverBadge />}
        </View>
        {isLocked ? (
          <Pressable
            style={styles.viewBtn}
            onPress={() =>
              placeholderAlert(
                "ZIP already validated",
                `ZIP ${entry.zip} is locked for viewing only.`,
              )
            }
          >
            <LockIcon />
            <Text style={styles.viewBtnText}>View</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.checkboxHit}
            onPress={onToggleCheck}
            hitSlop={8}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <CheckMarkIcon size={11} color={WHITE} />}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function IntakeScanRow({
  scan,
  isLast,
}: {
  scan: (typeof INTAKE_SCANS)[number];
  isLast: boolean;
}) {
  const meta = INTAKE_STATUS_META[scan.status];
  return (
    <View style={[styles.intakeRow, !isLast && styles.rowDivider]}>
      <View style={styles.intakeInfo}>
        <Text style={styles.intakeCode} numberOfLines={1}>
          {scan.code}
        </Text>
        <Text style={styles.intakeMeta}>
          ZIP {scan.zip} • {scan.time}
        </Text>
      </View>
      <View style={[styles.intakeStatusPill, { backgroundColor: meta.bg }]}>
        <Text style={[styles.intakeStatusText, { color: meta.color }]}>
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

function ZipPickerModal({
  visible,
  entries,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  entries: ZipEntry[];
  selectedId: string | null;
  onSelect: (entry: ZipEntry) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Select ZIP to Count</Text>
            <Pressable hitSlop={14} onPress={onClose}>
              <CloseIcon size={16} />
            </Pressable>
          </View>
          <Text style={styles.pickerSubtitle}>
            Validated and carried-over ZIP codes can’t be selected.
          </Text>

          {entries.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>
                No ZIP codes available to select.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
            >
              {entries.map((entry) => {
                const isSelected = entry.id === selectedId;
                return (
                  <Pressable
                    key={entry.id}
                    style={[
                      styles.pickerRow,
                      isSelected && styles.pickerRowSelected,
                    ]}
                    onPress={() => onSelect(entry)}
                  >
                    <View style={styles.pickerRowLeft}>
                      <PinIcon size={14} />
                      <Text style={styles.pickerZipText}>ZIP {entry.zip}</Text>
                    </View>
                    <Text style={styles.pickerPacketsText}>
                      {formatNumber(entry.packets)} packets
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function isValidPacketCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 0 || num > 1000000) return null;
  return num;
}

function ManualPacketCountModal({
  visible,
  zip,
  currentCount,
  saving,
  onSave,
  onClose,
}: {
  visible: boolean;
  zip: string | null;
  currentCount: number;
  saving: boolean;
  onSave: (packetCount: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(
    currentCount > 0 ? String(currentCount) : "",
  );
  const [error, setError] = useState("");

  const handleSave = () => {
    const num = isValidPacketCount(value);
    if (num == null) {
      setError("Please enter a valid packet count.");
      return;
    }
    setError("");
    onSave(num);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.manualSheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Manual Packet Count</Text>
            <Pressable hitSlop={14} onPress={onClose} disabled={saving}>
              <CloseIcon size={16} />
            </Pressable>
          </View>
          <Text style={styles.pickerSubtitle}>
            Enter packet count for ZIP {zip ?? "—"}
          </Text>

          <View style={styles.manualZipBadge}>
            <View style={styles.manualZipIconRing}>
              <PinIcon size={16} color={ORANGE} />
            </View>
            <View>
              <Text style={styles.manualZipBadgeLabel}>ZIP Code</Text>
              <Text style={styles.manualZipBadgeText}>
                ZIP {zip ?? "Not selected"}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Number of packets</Text>
          <TextInput
            style={[styles.manualInput, !!error && styles.inputError]}
            placeholder="Enter packet count"
            placeholderTextColor={MUTED}
            selectionColor={ORANGE}
            keyboardType="numeric"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (error) setError("");
            }}
            editable={!saving}
            autoFocus
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.manualButtonsRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.manualSaveBtn,
                saving && styles.manualSaveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <>
                  <BoxIcon size={15} color={WHITE} />
                  <Text style={styles.manualConfirmBtnText}>Save Count</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ScanResult = "success" | "exception" | "unknown";

function PacketCountedModal({
  visible,
  zip,
  time,
  onClose,
}: {
  visible: boolean;
  zip: string | null;
  time: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconRing}>
            <CheckCircleIcon size={30} color={GREEN} />
          </View>
          <Text style={styles.confirmTitle}>Packet Counted</Text>
          <Text style={styles.confirmMessage} numberOfLines={1}>
            Packet counted for ZIP {zip ?? "—"}
          </Text>
          <Text style={styles.confirmTime}>{time ?? "--:--:--"}</Text>
          <Pressable style={styles.confirmCloseBtn} onPress={onClose}>
            <Text style={styles.confirmCloseBtnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ZipValidatedModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconRing}>
            <CheckCircleIcon size={30} color={GREEN} />
          </View>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.validatedMessage}>{message}</Text>
          <Pressable style={styles.confirmCloseBtn} onPress={onClose}>
            <Text style={styles.confirmCloseBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ContinuousScanModal({
  visible,
  zip,
  isActive,
  inputValue,
  onChangeInput,
  onScan,
  onToggleActive,
  onClose,
  lastScannedValue,
  lastScanResult,
  lastScanMessage,
  lastScanTime,
  lastCountedZip,
  scanCount,
  exceptionCount,
}: {
  visible: boolean;
  zip: string | null;
  isActive: boolean;
  inputValue: string;
  onChangeInput: (text: string) => void;
  onScan: (value: string) => void;
  onToggleActive: () => void;
  onClose: () => void;
  lastScannedValue: string | null;
  lastScanResult: ScanResult | null;
  lastScanMessage: string | null;
  lastScanTime: string | null;
  lastCountedZip: string | null;
  scanCount: number;
  exceptionCount: number;
}) {
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus the hidden text field whenever the modal opens or scanning resumes,
  // since the hardware scanner only "types" into whatever field is focused.
  useEffect(() => {
    if (!visible || !isActive) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [visible, isActive]);

  // Most scanners suffix a barcode with Enter, but some don't — fall back to
  // processing after a short pause so a scan is never silently dropped.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!visible || !isActive || !inputValue.trim()) return;
    debounceRef.current = setTimeout(() => onScan(inputValue), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, visible, isActive, onScan]);

  const handleSubmitEditing = () => {
    if (inputValue.trim()) onScan(inputValue);
  };

  const handleManualRegisterPress = () => {
    if (inputValue.trim()) {
      onScan(inputValue);
    } else {
      notify("Please scan or enter a barcode first.");
    }
  };

  const bannerMeta =
    lastScanResult === "success"
      ? {
          bg: "rgba(34,197,94,0.15)",
          border: "rgba(34,197,94,0.4)",
          color: GREEN,
        }
      : lastScanResult === "exception"
        ? {
            bg: "rgba(255,101,0,0.15)",
            border: "rgba(255,101,0,0.4)",
            color: ORANGE,
          }
        : { bg: INNER, border: BORDER, color: DIM };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.scannerRoot} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scannerContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scannerHeaderRow}>
            <View style={styles.scannerHeaderTextGroup}>
              <Text style={styles.scannerTitle}>Continuous ZIP Scan</Text>
              <Text style={styles.scannerSubtitle}>
                Scan packets for ZIP {zip ?? "—"}
              </Text>
            </View>
            <Pressable
              style={styles.scannerCloseIconBtn}
              onPress={onClose}
              hitSlop={10}
            >
              <CloseIcon size={16} />
            </Pressable>
          </View>

          <View style={styles.scannerZipRow}>
            <View style={styles.scannerZipLeft}>
              <PinIcon size={14} />
              <Text style={styles.scannerZipText}>
                Current ZIP: {zip ?? "—"}
              </Text>
            </View>
            <View
              style={[
                styles.scannerActiveBadge,
                {
                  backgroundColor: isActive
                    ? "rgba(255,101,0,0.15)"
                    : INNER,
                  borderColor: isActive ? "rgba(255,101,0,0.4)" : BORDER,
                },
              ]}
            >
              <View
                style={[
                  styles.scannerActiveDot,
                  { backgroundColor: isActive ? ORANGE : MUTED },
                ]}
              />
              <Text
                style={[
                  styles.scannerActiveBadgeText,
                  { color: isActive ? ORANGE : DIM },
                ]}
              >
                {isActive ? "Scanner Active" : "Paused"}
              </Text>
            </View>
          </View>

          <Text style={styles.scannerStatusText}>
            {isActive ? "Ready for next barcode" : "Scanning paused"}
          </Text>

          <View style={styles.scannerFrame}>
            <ScanIcon size={48} color={ORANGE} />
          </View>

          <TextInput
            ref={inputRef}
            style={styles.scannerInputField}
            placeholder="Waiting for hardware scan..."
            placeholderTextColor={MUTED}
            selectionColor={ORANGE}
            value={inputValue}
            onChangeText={onChangeInput}
            onSubmitEditing={handleSubmitEditing}
            editable={isActive}
            autoFocus
            blurOnSubmit={false}
          />
          <Text style={styles.scannerHelperText}>
            Press the scanner button on your device. The barcode will be
            captured automatically.
          </Text>

          {lastScanResult != null && (
            <View
              style={[
                styles.scannerResultBanner,
                {
                  backgroundColor: bannerMeta.bg,
                  borderColor: bannerMeta.border,
                },
              ]}
            >
              {lastScanResult === "success" ? (
                <CheckCircleIcon size={16} color={bannerMeta.color} />
              ) : (
                <WarningIcon size={16} color={bannerMeta.color} />
              )}
              <View style={styles.successBannerTextGroup}>
                <Text
                  style={[styles.successBannerText, { color: bannerMeta.color }]}
                >
                  {lastScanResult === "success"
                    ? `Packet counted for ${lastCountedZip ?? ""}`
                    : lastScanMessage}
                </Text>
                {lastScanResult === "success" && (
                  <Text style={styles.successBannerSubText}>
                    Matching packet. Counted successfully.
                  </Text>
                )}
              </View>
              <Text
                style={[styles.successBannerTime, { color: bannerMeta.color }]}
              >
                {lastScanTime}
              </Text>
            </View>
          )}

          <View style={styles.scannerStatsRow}>
            <View style={styles.scannerStatBox}>
              <Text style={styles.scannerStatValue}>{scanCount}</Text>
              <Text style={styles.scannerStatLabel}>Scanned this session</Text>
            </View>
            <View style={styles.scannerStatBox}>
              <Text style={styles.scannerStatValue}>{exceptionCount}</Text>
              <Text style={styles.scannerStatLabel}>Exceptions</Text>
            </View>
            <View style={[styles.scannerStatBox, styles.scannerStatBoxFull]}>
              <Text style={styles.scannerStatValue} numberOfLines={1}>
                {lastScannedValue ?? "None"}
              </Text>
              <Text style={styles.scannerStatLabel}>Last scanned</Text>
            </View>
          </View>

          <View style={styles.scannerButtonsRow}>
            <Pressable style={styles.scannerPauseBtn} onPress={onToggleActive}>
              {isActive ? <PauseIcon /> : <PlayIcon />}
              <Text style={styles.scannerPauseBtnText}>
                {isActive ? "Pause Scan" : "Resume Scan"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.scannerManualBtn}
              onPress={handleManualRegisterPress}
            >
              <KeyboardIcon size={13} color={ORANGE} />
              <Text style={styles.scannerManualBtnText}>Manual Register</Text>
            </Pressable>
          </View>
          <Pressable style={styles.scannerCloseBtn} onPress={onClose}>
            <Text style={styles.scannerCloseBtnText}>Close</Text>
          </Pressable>

          <Text style={styles.scannerBottomText}>
            Each scan is processed automatically.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehouseZipCountScreen() {
  const [zipItems, setZipItems] = useState<WarehouseZipCodeItem[]>([]);
  const [zipSummary, setZipSummary] = useState<WarehouseZipCodeSummary | null>(
    null,
  );
  const [zipLoading, setZipLoading] = useState(true);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipInput, setZipInput] = useState("");
  const [addingZip, setAddingZip] = useState(false);
  const [mode, setMode] = useState<CountMode>("zipCount");
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [checkedZipIds, setCheckedZipIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [zipPickerVisible, setZipPickerVisible] = useState(false);
  const [manualRegisterVisible, setManualRegisterVisible] = useState(false);
  const [manualRegisterKey, setManualRegisterKey] = useState(0);
  const [manualRegisterSaving, setManualRegisterSaving] = useState(false);

  const [validatingZips, setValidatingZips] = useState(false);
  const [zipValidatedModalVisible, setZipValidatedModalVisible] = useState(false);
  const [validatedSummary, setValidatedSummary] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isScannerModalVisible, setIsScannerModalVisible] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(
    null,
  );
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(
    null,
  );
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [lastCountedZip, setLastCountedZip] = useState<string | null>(null);
  const [packetConfirmVisible, setPacketConfirmVisible] = useState(false);
  const [scanCountInSession, setScanCountInSession] = useState(0);
  const [exceptionCountInSession, setExceptionCountInSession] = useState(0);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [isIntakeScanning, setIsIntakeScanning] = useState(false);

  const zipEntries: ZipEntry[] = useMemo(
    () =>
      zipItems.map((item) => ({
        id: item.id,
        zip: item.zip_code,
        packets: item.packet_count,
        status: getDisplayStatus(item),
        carriedOverPackets: item.carried_over_packets,
        remainingPackets: item.remaining_packets ?? item.packet_count,
      })),
    [zipItems],
  );

  // selectedZip drives the "Current ZIP" scan/manual-register workflow and
  // is only ever set via the ZIP picker modal (handlePickZipFromModal),
  // which restricts it to non-validated, non-carried-over ZIPs.
  const currentEntry = zipEntries.find((z) => z.id === selectedZip) ?? null;

  // ZIPs eligible for the Today's ZIP List checkboxes / bulk validation —
  // anything not already validated, matching ZipListRow's own lock rule.
  const validatableEntries = useMemo(
    () => zipEntries.filter((entry) => entry.status !== "validated"),
    [zipEntries],
  );

  // ZIPs eligible for the Current ZIP picker — carried-over ZIPs already
  // have inventory from previous work and shouldn't be offered here.
  const pickableEntries = useMemo(
    () =>
      validatableEntries.filter((entry) => entry.carriedOverPackets === 0),
    [validatableEntries],
  );
  const allChecked =
    validatableEntries.length > 0 &&
    validatableEntries.every((entry) => checkedZipIds.has(entry.id));

  const loadZipCodes = useCallback((accessToken: string) => {
    return fetchWarehouseZipCodes(accessToken)
      .then((data) => {
        setZipItems(data.zip_codes);
        setZipSummary(data.summary);
        setZipError(null);
      })
      .catch((err) => {
        setZipError(
          err instanceof Error ? err.message : "Unable to load ZIP codes.",
        );
      })
      .finally(() => setZipLoading(false));
  }, []);

  useEffect(() => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    loadZipCodes(session.access_token);
  }, [loadZipCodes]);

  // Auto-dismiss the confirmation popup so it never blocks fast, repeated scanning.
  useEffect(() => {
    if (!packetConfirmVisible) return;
    const t = setTimeout(() => setPacketConfirmVisible(false), 1500);
    return () => clearTimeout(t);
  }, [packetConfirmVisible, lastScanTime]);

  const handleRetryZipCodes = () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    setZipLoading(true);
    setZipError(null);
    loadZipCodes(session.access_token);
  };

  const handleAddZip = () => {
    const trimmed = zipInput.trim();
    if (!/^\d{4,10}$/.test(trimmed)) {
      notify("Please enter a valid ZIP code.");
      return;
    }
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setAddingZip(true);
    addWarehouseZipCode(session.access_token, trimmed)
      .then(() => {
        setZipInput("");
        return loadZipCodes(session.access_token).then(() => {
          notify("ZIP code added.");
        });
      })
      .catch((err) => {
        notify(
          err instanceof Error
            ? err.message
            : "Unable to add ZIP code. Please try again.",
        );
      })
      .finally(() => setAddingZip(false));
  };

  const performRemoveZip = (entry: ZipEntry) => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    deleteWarehouseZipCode(session.access_token, entry.id)
      .then(() => {
        if (selectedZip === entry.id) setSelectedZip(null);
        setCheckedZipIds((prev) => {
          if (!prev.has(entry.id)) return prev;
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
        return loadZipCodes(session.access_token).then(() => {
          notify("ZIP code removed.");
        });
      })
      .catch((err) => {
        notify(
          err instanceof Error ? err.message : "Unable to remove ZIP code.",
        );
      });
  };

  const handleRemoveZip = (entry: ZipEntry) => {
    confirmRemoveZip(entry.zip, () => performRemoveZip(entry));
  };

  const handleToggleCheckZip = (entry: ZipEntry) => {
    if (entry.status === "validated") return;
    setCheckedZipIds((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) next.delete(entry.id);
      else next.add(entry.id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setCheckedZipIds(
      allChecked ? new Set() : new Set(validatableEntries.map((e) => e.id)),
    );
  };

  const handleOpenZipPicker = () => {
    if (pickableEntries.length === 0) {
      placeholderAlert(
        "No ZIP codes available",
        "There are no ZIP codes to select right now.",
      );
      return;
    }
    setZipPickerVisible(true);
  };

  const handlePickZipFromModal = (entry: ZipEntry) => {
    if (entry.status === "validated" || entry.carriedOverPackets > 0) return;
    setSelectedZip(entry.id);
    setZipPickerVisible(false);
  };

  const handleScannedValue = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return;

      setScannerInput("");
      setLastScannedValue(trimmed);
      setLastScanTime(formatScanTime());

      const zip = currentEntry?.zip ?? "";
      if (!/^\d+$/.test(trimmed)) {
        setLastScanResult("unknown");
        setLastScanMessage(
          "Barcode scanned. ZIP lookup will be connected later.",
        );
        return;
      }

      if (trimmed === zip) {
        setLastScanResult("success");
        setLastScanMessage(`Packet counted for ${zip}`);
        setLastCountedZip(zip);
        setScanCountInSession((c) => c + 1);
        setPacketConfirmVisible(true);
      } else {
        setLastScanResult("exception");
        setLastScanMessage(
          `ZIP Exception detected. Scanned ZIP ${trimmed} does not match current ZIP ${zip}.`,
        );
        setExceptionCountInSession((c) => c + 1);
      }
    },
    [currentEntry],
  );

  const handleStartScannerModal = () => {
    if (!currentEntry) {
      notify("Please select a Not counted ZIP first.");
      return;
    }
    setScannerInput("");
    setLastScannedValue(null);
    setLastScanResult(null);
    setLastScanMessage(null);
    setLastScanTime(null);
    setLastCountedZip(null);
    setPacketConfirmVisible(false);
    setScanCountInSession(0);
    setExceptionCountInSession(0);
    setIsScannerActive(true);
    setIsScannerModalVisible(true);
    setIsScanning(true);
  };

  const handleToggleScannerActive = () => {
    setIsScannerActive((prev) => !prev);
  };

  const handleCloseScannerModal = () => {
    setIsScannerModalVisible(false);
    setIsScannerActive(false);
    setScannerInput("");
    setIsScanning(false);
  };

  const handleOpenManualRegister = () => {
    if (!currentEntry) {
      notify("Please select a ZIP code first.");
      return;
    }
    setManualRegisterKey((k) => k + 1);
    setManualRegisterVisible(true);
  };

  const handleManualPacketCountSave = (packetCount: number) => {
    if (!currentEntry) return;
    const zipId = currentEntry.id;
    const zip = currentEntry.zip;
    const previousCount = currentEntry.packets;

    const commit = () => {
      const session = sessionStore.get();
      if (session?.kind !== "warehouse") return;
      setManualRegisterSaving(true);
      updateWarehouseZipPacketCount(session.access_token, zipId, packetCount)
        .then(() => loadZipCodes(session.access_token))
        .then(() => {
          setManualRegisterVisible(false);
          setLastScanResult("success");
          setLastScanMessage(`Packet counted for ${zip}`);
          setLastScanTime(formatScanTime());
          setLastCountedZip(zip);
          setPacketConfirmVisible(true);
        })
        .catch((err) => {
          notify(
            err instanceof Error
              ? err.message
              : "Unable to save packet count. Please try again.",
          );
        })
        .finally(() => setManualRegisterSaving(false));
    };

    if (previousCount > 0 && packetCount !== previousCount) {
      confirmUpdatePacketCount(zip, previousCount, packetCount, commit);
    } else {
      commit();
    }
  };

  const handleCancel = () => {
    setIsScanning(false);
    placeholderAlert("Cancelled", "No changes were made.");
  };

  const performValidateSelectedZips = async (entries: ZipEntry[]) => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setValidatingZips(true);
    try {
      for (const entry of entries) {
        await validateWarehouseZipCode(session.access_token, entry.id);
      }
      await loadZipCodes(session.access_token);
      setCheckedZipIds(new Set());
      setIsScanning(false);

      const totalPackets = entries.reduce((sum, e) => sum + e.packets, 0);
      setValidatedSummary(
        entries.length === 1
          ? {
              title: "ZIP Validated Successfully!",
              message: `ZIP ${entries[0].zip} has been validated with ${formatNumber(totalPackets)} packets.`,
            }
          : {
              title: "ZIPs Validated Successfully!",
              message: `${entries.length} ZIP codes have been validated with ${formatNumber(totalPackets)} packets in total.`,
            },
      );
      setZipValidatedModalVisible(true);
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Unable to validate ZIP. Please try again.",
      );
    } finally {
      setValidatingZips(false);
    }
  };

  const handleValidateSelectedZips = () => {
    if (checkedZipIds.size === 0) {
      placeholderAlert(
        "Select ZIP codes",
        "Check at least one ZIP from the list below to validate it.",
      );
      return;
    }
    const entries = validatableEntries.filter((entry) =>
      checkedZipIds.has(entry.id),
    );
    const zeroPacketEntry = entries.find((entry) => entry.packets === 0);
    if (zeroPacketEntry) {
      notify(`Cannot validate ZIP ${zeroPacketEntry.zip} with 0 packets.`);
      return;
    }
    confirmValidateZips(entries, () => performValidateSelectedZips(entries));
  };

  const handleToggleIntakeScan = () => {
    setIsIntakeScanning((prev) => !prev);
    setBarcodeInput("");
  };

  const handleManualRegister = () => {
    placeholderAlert(
      "Manual Register",
      "This would open a form to register a packet manually.",
    );
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
              <Text style={styles.headerTitle}>ZIP Count</Text>
              <Text style={styles.headerSubtitle}>
                Add ZIP codes manually and count packets one ZIP at a time.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Today's ZIP Counts ───────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Today&apos;s ZIP Counts</Text>
          {zipLoading || zipError || zipEntries.length === 0 ? (
            <View style={styles.card}>
              <ZipCodesState
                loading={zipLoading}
                error={zipError}
                onRetry={handleRetryZipCodes}
              />
            </View>
          ) : (
            <View style={styles.countRow}>
              {zipEntries.map((entry) => (
                <ZipCountCard key={entry.id} entry={entry} />
              ))}
            </View>
          )}

          {/* ── Today's ZIP Codes ────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today&apos;s ZIP Codes</Text>
            <Text style={styles.cardText}>
              Enter the ZIP codes available in the warehouse today.
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputWithIcon}>
                <View style={styles.inputIcon}>
                  <PinIcon size={14} color={MUTED} />
                </View>
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="Enter ZIP code"
                  placeholderTextColor={MUTED}
                  selectionColor={ORANGE}
                  value={zipInput}
                  onChangeText={setZipInput}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!addingZip}
                />
              </View>
              <Pressable
                style={[styles.primaryBtn, addingZip && styles.primaryBtnDisabled]}
                onPress={handleAddZip}
                disabled={addingZip}
              >
                {addingZip ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={styles.primaryBtnText}>Add ZIP</Text>
                )}
              </Pressable>
            </View>

            {zipLoading || zipError || zipEntries.length === 0 ? (
              <ZipCodesState
                loading={zipLoading}
                error={zipError}
                onRetry={handleRetryZipCodes}
              />
            ) : (
              <View style={styles.chipGrid}>
                {zipEntries.map((entry) => (
                  <ZipChip
                    key={entry.id}
                    entry={entry}
                    onRemove={() => handleRemoveZip(entry)}
                  />
                ))}
              </View>
            )}

            {!!zipSummary && zipSummary.carried_over_packets > 0 && (
              <View style={styles.carriedOverSummaryRow}>
                <BoxIcon size={13} color={ORANGE} />
                <Text style={styles.carriedOverSummaryText}>
                  {formatNumber(zipSummary.carried_over_packets)} packets
                  carried over from previous work
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <BoxIcon />
              <Text style={styles.infoRowText}>
                {zipEntries.length} ZIP codes added today
              </Text>
            </View>
          </View>

          {/* ── Mode switch ───────────────────────────────────────────────── */}
          <View style={styles.modeSwitchRow}>
            <Pressable
              style={[
                styles.modeTab,
                mode === "intakeScan" && styles.modeTabActive,
              ]}
              onPress={() => setMode("intakeScan")}
            >
              <BoxIcon size={16} color={mode === "intakeScan" ? WHITE : DIM} />
              <Text
                style={[
                  styles.modeTabText,
                  mode === "intakeScan" && styles.modeTabTextActive,
                ]}
              >
                Intake Scan
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                mode === "zipCount" && styles.modeTabActive,
              ]}
              onPress={() => setMode("zipCount")}
            >
              <ScanIcon size={16} color={mode === "zipCount" ? WHITE : DIM} />
              <Text
                style={[
                  styles.modeTabText,
                  mode === "zipCount" && styles.modeTabTextActive,
                ]}
              >
                ZIP Count
              </Text>
            </Pressable>
          </View>

          {mode === "zipCount" ? (
            <>
              {/* ── ZIP Count Scan ───────────────────────────────────────── */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>ZIP Count Scan</Text>
                  <ScanStatusPill active={isScanning} />
                </View>
                <Text style={styles.cardText}>
                  Select a ZIP code, start continuous scan, then scan packets
                  nonstop.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.currentZipPanel,
                    pressed && styles.currentZipPanelPressed,
                  ]}
                  onPress={handleOpenZipPicker}
                  hitSlop={4}
                >
                  <View style={styles.currentZipIconRing}>
                    <ScanIcon size={22} />
                  </View>
                  <View style={styles.currentZipPanelInfo}>
                    <Text style={styles.currentZipPanelLabel}>
                      Current ZIP
                    </Text>
                    <Text style={styles.currentZipPanelValue} numberOfLines={1}>
                      {currentEntry ? `ZIP ${currentEntry.zip}` : "Not selected"}
                    </Text>
                  </View>
                  <ChevronDownIcon size={16} />
                </Pressable>
                <Text style={styles.countingText}>
                  {currentEntry
                    ? `Counting packets for ZIP ${currentEntry.zip}`
                    : "Select a Not counted ZIP to start counting."}
                </Text>

                <View style={styles.scanActionsCol}>
                  <Pressable
                    style={styles.scanPrimaryBtn}
                    onPress={handleStartScannerModal}
                  >
                    {isScanning ? (
                      <PauseIcon size={13} />
                    ) : (
                      <PlayIcon size={13} />
                    )}
                    <Text style={styles.scanPrimaryBtnText}>
                      {isScanning ? "Pause Scan" : "Start Continuous Scan"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.scanSecondaryBtn}
                    onPress={handleOpenManualRegister}
                  >
                    <KeyboardIcon size={13} color={ORANGE} />
                    <Text style={styles.scanSecondaryBtnText}>
                      Manual Register
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.scanMetaRow}>
                  <View style={styles.hwActiveRow}>
                    <View style={styles.hwActiveDot} />
                    <Text style={styles.hwActiveText}>
                      Hardware scanner input active
                    </Text>
                  </View>
                  <Text style={styles.manualEntryText}>
                    For manual entry only
                  </Text>
                </View>

                {lastScanResult === "success" && lastCountedZip && (
                  <View style={styles.successBannerWrap}>
                    <View style={styles.successBanner}>
                      <CheckCircleIcon size={16} color={GREEN} />
                      <View style={styles.successBannerTextGroup}>
                        <Text style={styles.successBannerText}>
                          Packet counted for {lastCountedZip}
                        </Text>
                        <Text style={styles.successBannerSubText}>
                          Matching packet. Counted successfully.
                        </Text>
                      </View>
                      <Text style={styles.successBannerTime}>
                        {lastScanTime}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <ZipPickerModal
                visible={zipPickerVisible}
                entries={pickableEntries}
                selectedId={selectedZip}
                onSelect={handlePickZipFromModal}
                onClose={() => setZipPickerVisible(false)}
              />

              <ManualPacketCountModal
                key={`manual-${manualRegisterKey}`}
                visible={manualRegisterVisible}
                zip={currentEntry?.zip ?? null}
                currentCount={currentEntry?.packets ?? 0}
                saving={manualRegisterSaving}
                onSave={handleManualPacketCountSave}
                onClose={() => {
                  if (!manualRegisterSaving) setManualRegisterVisible(false);
                }}
              />

              <ContinuousScanModal
                visible={isScannerModalVisible}
                zip={currentEntry?.zip ?? null}
                isActive={isScannerActive}
                inputValue={scannerInput}
                onChangeInput={setScannerInput}
                onScan={handleScannedValue}
                onToggleActive={handleToggleScannerActive}
                onClose={handleCloseScannerModal}
                lastScannedValue={lastScannedValue}
                lastScanResult={lastScanResult}
                lastScanMessage={lastScanMessage}
                lastScanTime={lastScanTime}
                lastCountedZip={lastCountedZip}
                scanCount={scanCountInSession}
                exceptionCount={exceptionCountInSession}
              />

              <PacketCountedModal
                visible={packetConfirmVisible}
                zip={lastCountedZip}
                time={lastScanTime}
                onClose={() => setPacketConfirmVisible(false)}
              />

              <ZipValidatedModal
                visible={zipValidatedModalVisible}
                title={validatedSummary?.title ?? "ZIP Validated Successfully!"}
                message={validatedSummary?.message ?? ""}
                onClose={() => setZipValidatedModalVisible(false)}
              />

              {/* ── Today's ZIP List ─────────────────────────────────────── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                  Today&apos;s ZIP List
                </Text>
                {validatableEntries.length > 0 && (
                  <Pressable
                    style={styles.selectAllRow}
                    onPress={handleToggleSelectAll}
                    hitSlop={8}
                  >
                    <View
                      style={[styles.checkbox, allChecked && styles.checkboxChecked]}
                    >
                      {allChecked && <CheckMarkIcon size={11} color={WHITE} />}
                    </View>
                    <Text style={styles.selectAllText}>Select all</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.card}>
                {zipLoading || zipError || zipEntries.length === 0 ? (
                  <ZipCodesState
                    loading={zipLoading}
                    error={zipError}
                    onRetry={handleRetryZipCodes}
                  />
                ) : (
                  zipEntries.map((entry, i) => (
                    <ZipListRow
                      key={entry.id}
                      entry={entry}
                      isLast={i === zipEntries.length - 1}
                      checked={checkedZipIds.has(entry.id)}
                      onToggleCheck={() => handleToggleCheckZip(entry)}
                    />
                  ))
                )}
              </View>

              {/* ── Bottom actions ───────────────────────────────────────── */}
              <View style={styles.actionsRow}>
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.validateBtn,
                    validatingZips && styles.validateBtnDisabled,
                  ]}
                  onPress={handleValidateSelectedZips}
                  disabled={validatingZips}
                >
                  {validatingZips ? (
                    <ActivityIndicator size="small" color={WHITE} />
                  ) : (
                    <>
                      <CheckCircleIcon size={13} color={WHITE} />
                      <Text style={styles.validateBtnText} numberOfLines={1}>
                        {checkedZipIds.size > 0
                          ? `Validate Selected (${checkedZipIds.size})`
                          : "Validate Selected ZIPs"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* ── Packet Intake Scan ───────────────────────────────────── */}
              <View style={styles.card}>
                <View style={styles.scanRow}>
                  <PackageScanIcon size={56} />
                  <View style={styles.scanTextGroup}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Packet Intake Scan</Text>
                      <ScanStatusPill active={isIntakeScanning} />
                    </View>
                    <Text style={[styles.cardText, styles.cardTextTight]}>
                      Scan incoming packet barcodes continuously.
                    </Text>
                    <Text style={styles.helperText}>
                      Scan packets one by one. Each scan is registered
                      automatically.
                    </Text>
                  </View>
                </View>

                <View style={styles.stackedInputGroup}>
                  <TextInput
                    style={styles.intakeScanInput}
                    placeholder="Waiting for barcode scan..."
                    placeholderTextColor={MUTED}
                    selectionColor={BLUE}
                    value={barcodeInput}
                    onChangeText={setBarcodeInput}
                  />

                  <View style={styles.hwActiveRow}>
                    <View style={styles.hwActiveDot} />
                    <Text style={styles.hwActiveText}>
                      Hardware scanner input active
                    </Text>
                  </View>

                  <View style={styles.intakeBtnRow}>
                    <Pressable
                      style={styles.scanActionBtnFlex}
                      onPress={handleToggleIntakeScan}
                    >
                      {isIntakeScanning ? <PauseIcon /> : <PlayIcon />}
                      <Text style={styles.intakeScanBtnText}>
                        {isIntakeScanning
                          ? "Pause Scan"
                          : "Start Continuous Scan"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.manualRegisterBtn}
                      onPress={handleManualRegister}
                    >
                      <KeyboardIcon size={13} color={ORANGE} />
                      <Text style={styles.manualRegisterBtnText}>
                        Manual Register
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.manualEntryTextCenter}>
                    For manual entry only
                  </Text>
                </View>

                <View style={styles.successBanner}>
                  <CheckCircleIcon size={16} color={GREEN} />
                  <View style={styles.successBannerTextGroup}>
                    <Text style={styles.successBannerText}>Registered</Text>
                    <Text style={styles.successBannerSubText} numberOfLines={1}>
                      {LAST_SCANNED_CODE}
                    </Text>
                  </View>
                  <Text style={styles.successBannerTime}>{CURRENT_TIME}</Text>
                </View>
              </View>

              {/* ── Recent Scans ──────────────────────────────────────────── */}
              <Text style={styles.sectionLabel}>Recent Scans</Text>
              <View style={styles.card}>
                {INTAKE_SCANS.map((scan, i) => (
                  <IntakeScanRow
                    key={`${scan.code}-${scan.time}-${i}`}
                    scan={scan}
                    isLast={i === INTAKE_SCANS.length - 1}
                  />
                ))}
              </View>

              {/* ── Continue action ──────────────────────────────────────── */}
              <View style={styles.continueRow}>
                <Pressable
                  style={styles.continueBtn}
                  onPress={() => setMode("zipCount")}
                >
                  <Text style={styles.validateBtnText}>
                    Continue to ZIP Count
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: ORANGE,
  },

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    rowGap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    flexShrink: 1,
    minWidth: 0,
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
    marginBottom: 14,
  },
  cardTextTight: {
    marginBottom: 4,
  },

  // ── Today's ZIP Counts (2x2 grid, always fits one screen — no horizontal scroll)
  countRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 18,
  },
  countCard: {
    width: "47%",
    minWidth: 0,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  countCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countCardZip: {
    flexShrink: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
  countCardSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },
  miniBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 1,
    maxWidth: "100%",
  },
  miniBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },
  carriedOverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(148,163,184,0.16)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "100%",
  },
  carriedOverBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9.5,
    color: CARRIED_OVER,
  },
  carriedOverSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  carriedOverSummaryText: {
    flexShrink: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 11.5,
    color: DIM,
  },

  // ── ZIP codes state (loading / error / empty)
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 6,
  },
  stateBoxText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: DIM,
    textAlign: "center",
  },
  stateBoxSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },

  // ── Inputs
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  stackedInputGroup: {
    gap: 10,
    marginBottom: 14,
  },
  inputWithIcon: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  textInputWithIcon: {
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingLeft: 36,
    paddingRight: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  primaryBtn: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 18,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: WHITE,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  scanActionBtnFlex: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },

  // ── ZIP chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 14,
  },
  zipChip: {
    width: "47%",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  zipChipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zipChipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  zipChipPackets: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },
  zipChipStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zipChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zipChipStatusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },

  // ── Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRowText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: ORANGE,
  },

  // ── Mode switch
  modeSwitchRow: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 5,
    gap: 5,
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: ORANGE,
  },
  modeTabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DIM,
  },
  modeTabTextActive: {
    color: WHITE,
  },

  // ── Scan status pill
  scanStatusPill: {
    flexDirection: "row",
    flexShrink: 0,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scanStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scanStatusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  // ── Scan card
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  scanTextGroup: {
    flex: 1,
  },
  currentZipPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  currentZipPanelPressed: {
    opacity: 0.7,
  },
  currentZipIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  currentZipPanelInfo: {
    flex: 1,
    minWidth: 0,
  },
  currentZipPanelLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10.5,
    color: DIM,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentZipPanelValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: ORANGE,
    marginTop: 2,
  },
  countingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
    marginTop: 8,
    marginBottom: 16,
  },

  // ── Scan meta row (hardware active / manual entry)
  scanMetaRow: {
    gap: 6,
    marginBottom: 14,
  },
  hwActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hwActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  hwActiveText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: BLUE,
  },
  manualEntryText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
  },
  manualEntryTextCenter: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
  },
  intakeScanInput: {
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: WHITE,
  },

  // ── Intake buttons row
  intakeBtnRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  manualRegisterBtn: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  manualRegisterBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: ORANGE,
  },
  intakeScanBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: WHITE,
    flexShrink: 1,
    textAlign: "center",
  },

  // ── ZIP Count Scan action buttons (side by side, equal width)
  scanActionsCol: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  scanPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  scanPrimaryBtnText: {
    flexShrink: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    textAlign: "center",
  },
  scanSecondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  scanSecondaryBtnText: {
    flexShrink: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: ORANGE,
    textAlign: "center",
  },

  // ── Success banner
  successBannerWrap: {
    marginTop: 4,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successBannerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  successBannerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: GREEN,
  },
  successBannerSubText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: "rgba(34,197,94,0.75)",
    marginTop: 1,
  },
  successBannerTime: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: DIM,
  },

  intakeStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 14,
  },
  intakeStatBox: {
    width: "47%",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  intakeStatBoxFull: {
    width: "100%",
  },

  // ── Today's ZIP List
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  zipListRow: {
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  zipListRowSelected: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    paddingHorizontal: 10,
    marginVertical: 2,
  },
  zipListTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zipListLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zipListNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  zipListPackets: {
    flexShrink: 1,
    marginLeft: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    textAlign: "right",
  },
  zipListBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zipListBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  checkboxHit: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: ORANGE,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: DIM,
  },

  // ── Bottom actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: ORANGE,
  },
  validateBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  validateBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: WHITE,
  },
  validateBtnDisabled: {
    opacity: 0.6,
  },

  // ── Intake Scan
  helperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    lineHeight: 16,
  },

  intakeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
  },
  intakeInfo: { flex: 1 },
  intakeCode: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  intakeMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
    marginTop: 2,
  },
  intakeStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  intakeStatusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  continueRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  continueBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── ZIP picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  confirmIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  confirmTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
    marginBottom: 6,
  },
  confirmMessage: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: GREEN,
    textAlign: "center",
  },
  validatedMessage: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: DIM,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 22,
  },
  confirmTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    marginTop: 6,
    marginBottom: 20,
  },
  confirmCloseBtn: {
    alignSelf: "stretch",
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmCloseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  pickerSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: BORDER,
    maxHeight: "75%",
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  pickerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    marginBottom: 16,
  },
  pickerList: {
    gap: 10,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  pickerRowSelected: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.1)",
  },
  pickerRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerZipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  pickerPacketsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
  },
  pickerEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  pickerEmptyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: DIM,
    textAlign: "center",
  },

  // ── Manual register modal
  manualSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  manualZipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  manualZipIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  manualZipBadgeLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10.5,
    color: DIM,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  manualZipBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: ORANGE,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: WHITE,
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: WHITE,
    textAlign: "center",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11.5,
    color: "#EF4444",
    marginTop: 6,
  },
  manualConfirmBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: WHITE,
  },
  manualButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  manualSaveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: ORANGE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  manualSaveBtnDisabled: {
    opacity: 0.6,
  },

  // ── Continuous ZIP scan modal
  scannerRoot: { flex: 1, backgroundColor: BG },
  scannerContent: { padding: 20, paddingBottom: 32 },
  scannerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  scannerHeaderTextGroup: { flex: 1, paddingRight: 12 },
  scannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
  },
  scannerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    marginTop: 4,
  },
  scannerCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerZipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  scannerZipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scannerZipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  scannerActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scannerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scannerActiveBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  scannerStatusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: ORANGE,
    textAlign: "center",
    marginBottom: 16,
  },
  scannerFrame: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  scannerInputField: {
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    textAlign: "center",
    marginBottom: 10,
  },
  scannerHelperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
  },
  scannerResultBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  scannerResultTime: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    marginLeft: 10,
  },
  scannerStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 20,
  },
  scannerStatBox: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  scannerStatBoxFull: {
    width: "100%",
  },
  scannerStatValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
  scannerStatLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: DIM,
  },
  scannerButtonsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 10,
  },
  scannerPauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
  },
  scannerPauseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: WHITE,
  },
  scannerManualBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
  },
  scannerManualBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: ORANGE,
  },
  scannerCloseBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  scannerCloseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: DIM,
  },
  scannerBottomText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
  },
});
