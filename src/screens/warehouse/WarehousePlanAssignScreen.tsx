import {
  addManualAssignmentItem,
  changeAssignmentPlanItemDriver,
  deleteAssignmentPlanItem,
  fetchWarehouseAvailableDrivers,
  fetchWarehouseZipCodes,
  generateWarehouseAssignmentPlan,
  sendWarehouseAssignmentPlan,
  updateAssignmentPlanItemPacketCount,
  type WarehouseAssignmentPlanResponse,
  type WarehouseAssignmentPlanSummary,
  type WarehouseAvailableDriver,
  type WarehouseUnassignedZipItem,
  type WarehouseZipCodeItem,
} from "@/api/backendClient";
import { images } from "@/constants/images";
import { sessionStore } from "@/store/sessionStore";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

// react-native-web stubs out Alert.alert as a no-op, so preview builds in a
// browser need a window.alert/confirm fallback to actually show feedback.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
  }
}

// Mirrors the backend's per-driver daily packet cap (assignment_service.py).
const MAX_DRIVER_PACKETS = 100;

// Caps large Plan & Assign popups so they never exceed the screen on small
// Android devices, leaving room for a fixed header/footer around a ScrollView.
const MODAL_MAX_HEIGHT = Dimensions.get("window").height * 0.85;

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const TEAL = "#2DD4BF";
const PURPLE = "#8B5CF6";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

function withOpacity(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatCount(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("en-US");
}

function getRemainingPackets(item: WarehouseZipCodeItem): number {
  return item.remaining_packets ?? item.packet_count ?? 0;
}

const DRIVER_AVATAR_COLORS: { color: string; bg: string }[] = [
  { color: ORANGE, bg: "rgba(255,101,0,0.15)" },
  { color: BLUE, bg: "rgba(59,130,246,0.15)" },
  { color: GREEN, bg: "rgba(34,197,94,0.15)" },
  { color: PURPLE, bg: "rgba(139,92,246,0.15)" },
  { color: TEAL, bg: "rgba(45,212,191,0.15)" },
];

function getDriverInitials(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "DR";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getDriverTypeLabel(driver: WarehouseAvailableDriver): string {
  if (driver.driver_type_label) return driver.driver_type_label;
  if (driver.car_type === "company_car") return "Company car";
  if (driver.car_type === "own_car") return "Own car";
  return "—";
}

const PLANNING_CRITERIA: string[] = [
  "Match ZIP code with closest driver home ZIP",
  "Use validated packet counts only",
  "Balance packet load between drivers",
  "Prefer available active drivers",
  "Keep assignment clear and simple for drivers",
];

interface DriverPlanZip {
  itemId: string | null;
  zip: string;
  packets: number;
  matchType: string;
  reason: string;
}

interface DriverPlanGroup {
  id: string;
  initials: string;
  color: string;
  bg: string;
  name: string;
  totalPackets: number;
  zips: DriverPlanZip[];
  matchType: string;
}

interface ManagePendingOp {
  packets?: number;
  driverId?: string;
  removed?: boolean;
}

const MATCH_BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  same_zip: { label: "Same ZIP", color: GREEN },
  nearest_zip: { label: "Nearest ZIP", color: TEAL },
  balanced: { label: "Balanced", color: BLUE },
};

function resolveDriverMatchType(matchTypes: Set<string>): string {
  if (matchTypes.has("nearest_zip")) return "nearest_zip";
  if (matchTypes.has("balanced")) return "balanced";
  return "same_zip";
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
function PinIcon({
  size = 18,
  color = GREEN,
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

function BoxIcon({
  size = 18,
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

function PeopleIcon({
  size = 18,
  color = BLUE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

function CheckboxIcon({
  size = 15,
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

function ChevronRight({
  size = 14,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="9 18 15 12 9 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparklesIcon({
  size = 18,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
        fill={color}
      />
      <Path
        d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z"
        fill={color}
      />
    </Svg>
  );
}

function WarningIcon({
  size = 18,
  color = AMBER,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v4M12 17h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon({
  size = 16,
  color = ORANGE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({
  size = 20,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M3 10h18M8 3v4M16 3v4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Polyline
        points="7.5 15 10 17.2 16 12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreDotsIcon({
  size = 16,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="19" cy="12" r="1.8" fill={color} />
    </Svg>
  );
}

function ScaleIcon({
  size = 12,
  color = BLUE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v18M7 21h10M12 6l6.5 3.2M12 6l-6.5 3.2M2.5 12.6a3 3 0 0 0 6 0L5.5 8l-3 4.6zM15.5 12.6a3 3 0 0 0 6 0L18.5 8l-3 4.6z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon({
  size = 20,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CloseIcon({
  size = 16,
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

function SendIcon({
  size = 16,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── small building blocks ───────────────────────────────────────────────────
function OverviewStatCard({
  icon,
  accent,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View
      style={[styles.overviewCard, { borderColor: withOpacity(accent, 0.28) }]}
    >
      <View
        style={[
          styles.overviewCardIcon,
          { backgroundColor: withOpacity(accent, 0.15) },
        ]}
      >
        {icon}
      </View>
      <Text style={styles.overviewCardTitle}>{title}</Text>
      <Text style={[styles.overviewCardValue, { color: accent }]}>{value}</Text>
      <Text style={styles.overviewCardSubtitle}>{subtitle}</Text>
      <View style={[styles.overviewCardBar, { backgroundColor: accent }]} />
    </View>
  );
}

function ZipCountRow({
  entry,
  isLast,
  isSelected,
  onToggle,
}: {
  entry: WarehouseZipCodeItem;
  isLast: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.zipCountRow, !isLast && styles.rowDivider]}>
      <View style={styles.zipCountLeft}>
        <PinIcon size={16} color={ORANGE} />
        <Text style={styles.zipCountNumber}>{entry.zip_code}</Text>
      </View>
      <Text style={styles.zipCountPackets}>
        {formatCount(getRemainingPackets(entry))} packets
      </Text>
      <View style={styles.validatedBadge}>
        <Text style={styles.validatedBadgeText}>Validated</Text>
      </View>
      <Pressable
        style={[styles.checkbox, isSelected && styles.checkboxActive]}
        onPress={onToggle}
        hitSlop={8}
      >
        {isSelected && <CheckboxIcon size={13} />}
      </Pressable>
    </View>
  );
}

function DriverCardAvatar({
  imageUrl,
  fullName,
  color,
  bg,
}: {
  imageUrl: string | null;
  fullName: string;
  color: string;
  bg: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.driverAvatar}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.driverAvatar, { backgroundColor: bg }]}>
      <Text style={[styles.driverInitials, { color }]}>
        {getDriverInitials(fullName)}
      </Text>
    </View>
  );
}

function DriverCardItem({
  driver,
  color,
  bg,
  isSelected,
  onToggle,
}: {
  driver: WarehouseAvailableDriver;
  color: string;
  bg: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const typeLabel = getDriverTypeLabel(driver);
  return (
    <View style={styles.driverCard}>
      <View style={styles.driverCardTopRow}>
        <DriverCardAvatar
          imageUrl={driver.profile_image_url}
          fullName={driver.full_name}
          color={color}
          bg={bg}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driver.full_name}
          </Text>
          <Text style={styles.driverId}>
            {driver.external_driver_id ?? "—"}
          </Text>
        </View>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Home ZIP</Text>
        <Text style={styles.driverDetailValue}>
          {driver.postal_code ?? "—"}
        </Text>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Type</Text>
        <Text
          style={[
            styles.driverDetailValue,
            { color: typeLabel === "Own car" ? ORANGE : BLUE },
          ]}
        >
          {typeLabel}
        </Text>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Status</Text>
        <View style={styles.driverStatusRow}>
          <View style={styles.driverStatusDot} />
          <Text style={styles.driverStatusText}>
            {driver.availability_label || "Available"}
          </Text>
        </View>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Current load</Text>
        <Text style={styles.driverDetailValue}>0 packets</Text>
      </View>
      <View style={styles.driverCardFooter}>
        <Pressable
          style={[styles.checkbox, isSelected && styles.checkboxActive]}
          onPress={onToggle}
          hitSlop={8}
        >
          {isSelected && <CheckboxIcon size={13} />}
        </Pressable>
        <ChevronRight size={16} color={ORANGE} />
      </View>
    </View>
  );
}

function MatchTypeBadge({ type }: { type: string }) {
  const config = MATCH_BADGE_CONFIG[type] ?? MATCH_BADGE_CONFIG.same_zip;
  return (
    <View
      style={[
        styles.matchBadge,
        { backgroundColor: withOpacity(config.color, 0.15) },
      ]}
    >
      {type === "nearest_zip" && <PinIcon size={12} color={config.color} />}
      {type === "balanced" && <ScaleIcon size={12} color={config.color} />}
      {type !== "nearest_zip" && type !== "balanced" && (
        <CheckCircleIcon size={12} color={config.color} />
      )}
      <Text style={[styles.matchBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function DriverPlanCard({
  group,
  onManage,
}: {
  group: DriverPlanGroup;
  onManage: () => void;
}) {
  const pct = Math.round(Math.min(group.totalPackets / 100, 1) * 100);
  return (
    <View style={styles.driverPlanCard}>
      <View style={styles.driverPlanTopRow}>
        <View style={[styles.planAvatar, { backgroundColor: group.bg }]}>
          <Text style={[styles.driverInitials, { color: group.color }]}>
            {group.initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.driverPlanTotalText}>
            {formatCount(group.totalPackets)} / 100 packets
          </Text>
        </View>
        <View style={styles.driverPlanBadgeCol}>
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>Draft</Text>
          </View>
          <MatchTypeBadge type={group.matchType} />
        </View>
        <Pressable style={styles.moreBtn} onPress={onManage} hitSlop={8}>
          <MoreDotsIcon size={16} color={WHITE} />
        </Pressable>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressPctText}>{pct}%</Text>
      </View>

      <View style={styles.zipChipsRow}>
        {group.zips.map((zipEntry, i) => (
          <View key={`${zipEntry.zip}-${i}`} style={styles.zipChip}>
            <PinIcon size={12} color={ORANGE} />
            <Text style={styles.zipChipText}>
              ZIP {zipEntry.zip} · {formatCount(zipEntry.packets)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ManageZipRow({
  zip,
  isLast,
  onEditCount,
  onChangeDriver,
  onRemove,
}: {
  zip: DriverPlanZip;
  isLast: boolean;
  onEditCount: (zip: DriverPlanZip) => void;
  onChangeDriver: (zip: DriverPlanZip) => void;
  onRemove: (zip: DriverPlanZip) => void;
}) {
  return (
    <View style={[styles.manageZipCard, !isLast && { marginBottom: 10 }]}>
      <View style={styles.manageZipTopRow}>
        <View style={styles.manageZipLeft}>
          <View style={styles.manageZipIconBox}>
            <PinIcon size={15} color={ORANGE} />
          </View>
          <View>
            <Text style={styles.manageZipCode}>ZIP {zip.zip}</Text>
            <Text style={styles.manageZipPackets}>
              {formatCount(zip.packets)} packets
            </Text>
          </View>
        </View>
        <MatchTypeBadge type={zip.matchType} />
      </View>
      <View style={styles.manageZipActionsRow}>
        <Pressable
          style={styles.manageActionBtn}
          onPress={() => onEditCount(zip)}
        >
          <Text style={styles.manageActionBtnText}>Edit Count</Text>
        </Pressable>
        <Pressable
          style={styles.manageActionBtn}
          onPress={() => onChangeDriver(zip)}
        >
          <Text style={styles.manageActionBtnText}>Change Driver</Text>
        </Pressable>
        <Pressable
          style={[styles.manageActionBtn, styles.manageActionBtnDanger]}
          onPress={() => onRemove(zip)}
        >
          <Text style={styles.manageActionBtnDangerText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ManageAssignmentModal({
  visible,
  group,
  onClose,
  hasChanges,
  committing,
  onEditCount,
  onChangeDriver,
  onRemove,
  onManageManually,
}: {
  visible: boolean;
  group: DriverPlanGroup | null;
  onClose: () => void;
  hasChanges: boolean;
  committing: boolean;
  onEditCount: (zip: DriverPlanZip) => void;
  onChangeDriver: (zip: DriverPlanZip) => void;
  onRemove: (zip: DriverPlanZip) => void;
  onManageManually: () => void;
}) {
  if (!group) return null;

  const pct = Math.round(Math.min(group.totalPackets / 100, 1) * 100);
  const reasons = group.zips.filter((zip) => !!zip.reason);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.fullScreenModal} edges={["top", "bottom"]}>
        <View style={styles.fullScreenHeader}>
          <Pressable
            style={styles.fullScreenBackBtn}
            onPress={onClose}
            hitSlop={10}
            disabled={committing}
          >
            <CloseIcon size={18} color={WHITE} />
          </Pressable>
          <View style={styles.fullScreenHeaderText}>
            <Text style={styles.fullScreenTitle}>Manage Assignment</Text>
            <Text style={styles.fullScreenSubtitle} numberOfLines={1}>
              {group.name} · {formatCount(group.totalPackets)} packets
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.fullScreenContent}
          contentContainerStyle={styles.fullScreenScrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Driver header */}
          <View style={styles.manageDriverRow}>
            <View style={[styles.planAvatar, { backgroundColor: group.bg }]}>
              <Text style={[styles.driverInitials, { color: group.color }]}>
                {group.initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.manageDriverNameRow}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {group.name}
                </Text>
                <View style={styles.draftBadge}>
                  <Text style={styles.draftBadgeText}>Draft</Text>
                </View>
              </View>
              <Text style={styles.driverPlanTotalText}>
                {formatCount(group.totalPackets)} / 100 packets
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressPctText}>{pct}%</Text>
          </View>

          <View style={styles.manageMatchRow}>
            <MatchTypeBadge type={group.matchType} />
          </View>

          {/* Assigned ZIPs */}
          <Text style={styles.manageSectionTitle}>Assigned ZIPs</Text>
          {group.zips.map((zip, i) => (
            <ManageZipRow
              key={`${zip.zip}-${i}`}
              zip={zip}
              isLast={i === group.zips.length - 1}
              onEditCount={onEditCount}
              onChangeDriver={onChangeDriver}
              onRemove={onRemove}
            />
          ))}

          {reasons.length > 0 && (
            <>
              <Text style={[styles.manageSectionTitle, { marginTop: 20 }]}>
                Why this assignment?
              </Text>
              <View style={styles.whyCard}>
                {reasons.map((zip, i) => (
                  <Text
                    key={`${zip.zip}-reason-${i}`}
                    style={[
                      styles.whyText,
                      i !== reasons.length - 1 && { marginBottom: 8 },
                    ]}
                  >
                    ZIP {zip.zip}: {zip.reason}
                  </Text>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.fullScreenFooter}>
          <Pressable
            style={styles.manageCloseFooterBtn}
            onPress={onClose}
            disabled={committing}
          >
            <Text style={styles.manageCloseFooterBtnText}>Close</Text>
          </Pressable>
          <Pressable
            style={[
              styles.manageManualBtn,
              (!hasChanges || committing) && styles.manageManualBtnDisabled,
            ]}
            onPress={onManageManually}
            disabled={!hasChanges || committing}
          >
            {committing ? (
              <ActivityIndicator size="small" color={ORANGE} />
            ) : (
              <Text
                style={[
                  styles.manageManualBtnText,
                  !hasChanges && styles.manageManualBtnTextDisabled,
                ]}
              >
                Manage Manually
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function EditCountModal({
  visible,
  zipLabel,
  value,
  onChangeValue,
  onCancel,
  onSave,
}: {
  visible: boolean;
  zipLabel: string;
  value: string;
  onChangeValue: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const parsed = parseInt(value, 10);
  const isValid = Number.isFinite(parsed) && parsed > 0;
  const showError = value.trim().length > 0 && !isValid;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.smallModalOverlay} onPress={onCancel}>
          <Pressable style={styles.smallModalCard} onPress={() => {}}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.smallModalScrollContent}
            >
              <Text style={styles.smallModalTitle}>Edit Packet Count</Text>
              <Text style={styles.smallModalSubtitle}>ZIP {zipLabel}</Text>
              <TextInput
                style={[
                  styles.smallModalInput,
                  showError && styles.smallModalInputError,
                ]}
                value={value}
                onChangeText={onChangeValue}
                keyboardType="number-pad"
                placeholder="Packets"
                placeholderTextColor={MUTED}
                autoFocus
              />
              {showError && (
                <Text style={styles.smallModalErrorText}>
                  Enter a packet count greater than 0.
                </Text>
              )}
            </ScrollView>
            <View style={styles.smallModalButtonsRow}>
              <Pressable style={styles.smallModalCancelBtn} onPress={onCancel}>
                <Text style={styles.smallModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.smallModalSaveBtn,
                  !isValid && { opacity: 0.6 },
                ]}
                onPress={onSave}
                disabled={!isValid}
              >
                <Text style={styles.smallModalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface DriverCapacityOption {
  driver: WarehouseAvailableDriver;
  isReady: boolean;
  currentLoad: number;
  remaining: number;
  eligible: boolean;
}

function DriverPickerRow({
  option,
  packetsToAssign,
  isSelected,
  onSelect,
}: {
  option: DriverCapacityOption;
  packetsToAssign: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { driver, isReady, currentLoad, remaining, eligible } = option;
  const ineligibleReason = !isReady
    ? "Not marked ready today."
    : !eligible
      ? `Only ${formatCount(remaining)} left — can't fit ${formatCount(packetsToAssign)} packets.`
      : null;

  return (
    <Pressable
      style={[
        styles.driverPickerRow,
        isSelected && styles.driverPickerRowSelected,
        !eligible && styles.driverPickerRowDisabled,
      ]}
      onPress={onSelect}
      disabled={!eligible}
    >
      <DriverCardAvatar
        imageUrl={driver.profile_image_url}
        fullName={driver.full_name}
        color={ORANGE}
        bg="rgba(255,101,0,0.15)"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName} numberOfLines={1}>
          {driver.full_name}
        </Text>
        <Text style={styles.driverPickerMeta}>
          Home ZIP {driver.postal_code ?? "—"} · {formatCount(currentLoad)} /
          100 packets
        </Text>
        {ineligibleReason && (
          <Text style={styles.driverPickerIneligibleText}>
            {ineligibleReason}
          </Text>
        )}
      </View>
      <View
        style={[styles.checkbox, isSelected && styles.checkboxActive]}
      >
        {isSelected && <CheckboxIcon size={13} />}
      </View>
    </Pressable>
  );
}

function ChangeDriverModal({
  visible,
  zipLabel,
  packetsToAssign,
  options,
  selectedDriverId,
  onSelectDriver,
  onCancel,
  onSave,
}: {
  visible: boolean;
  zipLabel: string;
  packetsToAssign: number;
  options: DriverCapacityOption[];
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const hasEligibleDriver = options.some((o) => o.eligible);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.fullScreenModal} edges={["top", "bottom"]}>
        <View style={styles.fullScreenHeader}>
          <Pressable
            style={styles.fullScreenBackBtn}
            onPress={onCancel}
            hitSlop={10}
          >
            <CloseIcon size={18} color={WHITE} />
          </Pressable>
          <View style={styles.fullScreenHeaderText}>
            <Text style={styles.fullScreenTitle}>Change Driver</Text>
            <Text style={styles.fullScreenSubtitle}>
              ZIP {zipLabel} · {formatCount(packetsToAssign)} packets
            </Text>
          </View>
        </View>

        {options.length > 0 && !hasEligibleDriver && (
          <View style={styles.fullScreenWarningBanner}>
            <WarningIcon size={16} color={AMBER} />
            <Text style={styles.fullScreenWarningText}>
              No driver is currently both ready and has enough remaining
              capacity for {formatCount(packetsToAssign)} packets.
            </Text>
          </View>
        )}

        <View style={styles.fullScreenContent}>
          <FlatList
            data={options}
            keyExtractor={(option) => option.driver.id}
            renderItem={({ item: option }) => (
              <DriverPickerRow
                option={option}
                packetsToAssign={packetsToAssign}
                isSelected={selectedDriverId === option.driver.auth_user_id}
                onSelect={() => onSelectDriver(option.driver.auth_user_id)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.zipEmptyText}>No drivers available.</Text>
            }
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.fullScreenScrollContent}
          />
        </View>

        <View style={styles.fullScreenFooter}>
          <Pressable style={styles.smallModalCancelBtn} onPress={onCancel}>
            <Text style={styles.smallModalCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.smallModalSaveBtn,
              !selectedDriverId && { opacity: 0.6 },
            ]}
            onPress={onSave}
            disabled={!selectedDriverId}
          >
            <Text style={styles.smallModalSaveText}>Save</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface ManualDriverOption {
  driver: WarehouseAvailableDriver;
  currentLoad: number;
  available: number;
}

interface ManualZipOption {
  zip_code: string;
  packets: number;
}

function ManualDriverRow({
  option,
  isSelected,
  onSelect,
}: {
  option: ManualDriverOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { driver, currentLoad, available } = option;
  return (
    <Pressable
      style={[
        styles.driverPickerRow,
        isSelected && styles.driverPickerRowSelected,
      ]}
      onPress={onSelect}
    >
      <DriverCardAvatar
        imageUrl={driver.profile_image_url}
        fullName={driver.full_name}
        color={ORANGE}
        bg="rgba(255,101,0,0.15)"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName} numberOfLines={1}>
          {driver.full_name}
        </Text>
        <Text style={styles.driverPickerMeta}>
          Home ZIP {driver.postal_code ?? "—"} · {formatCount(currentLoad)} /{" "}
          {MAX_DRIVER_PACKETS} packets
        </Text>
        <Text style={styles.manualAvailableText}>
          {formatCount(available)} available
        </Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
        {isSelected && <CheckboxIcon size={13} />}
      </View>
    </Pressable>
  );
}

function ManualZipRow({
  option,
  isSelected,
  onSelect,
}: {
  option: ManualZipOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.driverPickerRow,
        isSelected && styles.driverPickerRowSelected,
      ]}
      onPress={onSelect}
    >
      <View style={styles.manageZipIconBox}>
        <PinIcon size={15} color={ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.manageZipCode}>ZIP {option.zip_code}</Text>
        <Text style={styles.manageZipPackets}>
          {formatCount(option.packets)} unassigned packets
        </Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
        {isSelected && <CheckboxIcon size={13} />}
      </View>
    </Pressable>
  );
}

function WorkZipRow({
  zip,
  isLast,
  onAssignManually,
}: {
  zip: WarehouseUnassignedZipItem;
  isLast: boolean;
  onAssignManually: () => void;
}) {
  return (
    <View style={[styles.workZipRow, !isLast && { marginBottom: 10 }]}>
      <View style={styles.manageZipIconBox}>
        <PinIcon size={15} color={ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.manageZipCode}>ZIP {zip.zip_code}</Text>
        <Text style={styles.manageZipPackets}>
          {formatCount(zip.packets)} packets left
        </Text>
        {!!zip.reason && (
          <Text style={styles.workZipReasonText}>{zip.reason}</Text>
        )}
      </View>
      <Pressable style={styles.workAssignBtn} onPress={onAssignManually}>
        <Text style={styles.workAssignBtnText}>Assign manually</Text>
      </Pressable>
    </View>
  );
}

interface DriverCapacityRowData {
  key: string;
  name: string;
  load: number;
  available: number;
}

function DriverCapacityRow({
  row,
  isLast,
}: {
  row: DriverCapacityRowData;
  isLast: boolean;
}) {
  const isFull = row.available <= 0;
  const statusColor = isFull ? ORANGE : GREEN;
  const pct = Math.round(Math.min(row.load / MAX_DRIVER_PACKETS, 1) * 100);
  return (
    <View style={[styles.capacityRow, !isLast && styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{row.name}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%`, backgroundColor: statusColor },
              ]}
            />
          </View>
          <Text style={styles.capacityLoadText}>
            {formatCount(row.load)} / {MAX_DRIVER_PACKETS} packets
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.capacityBadge,
          { backgroundColor: withOpacity(statusColor, 0.15) },
        ]}
      >
        <Text style={[styles.capacityBadgeText, { color: statusColor }]}>
          {isFull ? "Full" : `${formatCount(row.available)} available`}
        </Text>
      </View>
    </View>
  );
}

function UnassignedWorkModal({
  visible,
  totalUnassigned,
  reason,
  zips,
  driverRows,
  onAssignManually,
  onClose,
}: {
  visible: boolean;
  totalUnassigned: number;
  reason: string;
  zips: WarehouseUnassignedZipItem[];
  driverRows: DriverCapacityRowData[];
  onAssignManually: (zipCode: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"zips" | "capacity">("zips");
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setTab("zips");
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.fullScreenModal} edges={["top", "bottom"]}>
        <View style={styles.fullScreenHeader}>
          <Pressable
            style={styles.fullScreenBackBtn}
            onPress={onClose}
            hitSlop={10}
          >
            <CloseIcon size={18} color={WHITE} />
          </Pressable>
          <View style={styles.fullScreenHeaderText}>
            <Text style={styles.fullScreenTitle}>Unassigned Work</Text>
            <Text style={styles.fullScreenSubtitle}>
              {formatCount(totalUnassigned)} packets unassigned
            </Text>
          </View>
        </View>

        <Text style={styles.workReasonBanner}>{reason}</Text>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, tab === "zips" && styles.tabBtnActive]}
            onPress={() => setTab("zips")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "zips" && styles.tabBtnTextActive,
              ]}
            >
              Unassigned ZIPs
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === "capacity" && styles.tabBtnActive]}
            onPress={() => setTab("capacity")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "capacity" && styles.tabBtnTextActive,
              ]}
            >
              Driver Capacity
            </Text>
          </Pressable>
        </View>

        <View style={styles.fullScreenContent}>
          {tab === "zips" ? (
            <FlatList
              data={zips}
              keyExtractor={(zip, i) => `${zip.zip_code}-${i}`}
              renderItem={({ item: zip, index }) => (
                <WorkZipRow
                  zip={zip}
                  isLast={index === zips.length - 1}
                  onAssignManually={() => onAssignManually(zip.zip_code)}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              ListEmptyComponent={
                <Text style={styles.zipEmptyText}>
                  No unassigned ZIPs. Nice work!
                </Text>
              }
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.fullScreenScrollContent}
            />
          ) : (
            <View style={styles.capacityListWrap}>
              <FlatList
                style={styles.capacityListFlatList}
                data={driverRows}
                keyExtractor={(row) => row.key}
                renderItem={({ item: row, index }) => (
                  <DriverCapacityRow
                    row={row}
                    isLast={index === driverRows.length - 1}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.zipEmptyText}>
                    No ready drivers today.
                  </Text>
                }
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.capacityListCard}
              />
            </View>
          )}
        </View>

        <View style={styles.fullScreenFooter}>
          <Pressable style={styles.manageCloseFooterBtn} onPress={onClose}>
            <Text style={styles.manageCloseFooterBtnText}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function AddManualAssignmentModal({
  visible,
  driverOptions,
  zipOptions,
  selectedDriverId,
  onSelectDriver,
  selectedZipCode,
  onSelectZip,
  packetsValue,
  onChangePackets,
  maxPackets,
  saving,
  onCancel,
  onSave,
}: {
  visible: boolean;
  driverOptions: ManualDriverOption[];
  zipOptions: ManualZipOption[];
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
  selectedZipCode: string | null;
  onSelectZip: (zip: string) => void;
  packetsValue: string;
  onChangePackets: (v: string) => void;
  maxPackets: number;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [step, setStep] = useState(1);
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setStep(1);
  }

  const hasSelection = !!selectedDriverId && !!selectedZipCode;
  const parsedPackets = parseInt(packetsValue, 10);
  const isValid =
    hasSelection &&
    Number.isFinite(parsedPackets) &&
    parsedPackets > 0 &&
    parsedPackets <= maxPackets;
  const showError =
    hasSelection && packetsValue.trim().length > 0 && !isValid;

  const stepLabel =
    step === 1 ? "Select Driver" : step === 2 ? "Select ZIP" : "Packet Count";
  const canGoNext =
    (step === 1 && !!selectedDriverId) || (step === 2 && !!selectedZipCode);

  const handleNext = () => {
    if (step < 3 && canGoNext) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.fullScreenModal} edges={["top", "bottom"]}>
          <View style={styles.fullScreenHeader}>
            <Pressable
              style={styles.fullScreenBackBtn}
              onPress={onCancel}
              hitSlop={10}
              disabled={saving}
            >
              <CloseIcon size={18} color={WHITE} />
            </Pressable>
            <View style={styles.fullScreenHeaderText}>
              <Text style={styles.fullScreenTitle}>
                Add Manual Assignment
              </Text>
              <Text style={styles.fullScreenSubtitle}>
                Step {step} of 3 · {stepLabel}
              </Text>
            </View>
          </View>

          <View style={styles.stepDotsRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotActive,
                  s < step && styles.stepDotDone,
                ]}
              />
            ))}
          </View>

          <View style={styles.fullScreenContent}>
            {step === 1 && (
              <FlatList
                data={driverOptions}
                keyExtractor={(option) => option.driver.auth_user_id}
                renderItem={({ item: option }) => (
                  <ManualDriverRow
                    option={option}
                    isSelected={
                      selectedDriverId === option.driver.auth_user_id
                    }
                    onSelect={() => onSelectDriver(option.driver.auth_user_id)}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.zipEmptyText}>
                    No ready drivers available.
                  </Text>
                }
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.fullScreenScrollContent}
              />
            )}

            {step === 2 && (
              <FlatList
                data={zipOptions}
                keyExtractor={(option) => option.zip_code}
                renderItem={({ item: option }) => (
                  <ManualZipRow
                    option={option}
                    isSelected={selectedZipCode === option.zip_code}
                    onSelect={() => onSelectZip(option.zip_code)}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.zipEmptyText}>
                    No ZIPs with unassigned packets.
                  </Text>
                }
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.fullScreenScrollContent}
              />
            )}

            {step === 3 && (
              <ScrollView
                contentContainerStyle={styles.fullScreenScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.manageSectionTitle}>Packet Count</Text>
                <Text style={styles.manualMaxHintText}>
                  Max allowed: {formatCount(maxPackets)} packets
                </Text>
                <TextInput
                  style={[
                    styles.smallModalInput,
                    { marginTop: 10 },
                    showError && styles.smallModalInputError,
                  ]}
                  value={packetsValue}
                  onChangeText={onChangePackets}
                  keyboardType="number-pad"
                  placeholder={`Max ${formatCount(maxPackets)}`}
                  placeholderTextColor={MUTED}
                  autoFocus
                />
                {showError && (
                  <Text style={styles.smallModalErrorText}>
                    Please enter a valid manual assignment.
                  </Text>
                )}
              </ScrollView>
            )}
          </View>

          <View style={styles.fullScreenFooter}>
            <Pressable
              style={styles.smallModalCancelBtn}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.smallModalCancelText}>Cancel</Text>
            </Pressable>
            {step > 1 && (
              <Pressable
                style={styles.smallModalCancelBtn}
                onPress={handleBack}
                disabled={saving}
              >
                <Text style={styles.smallModalCancelText}>Back</Text>
              </Pressable>
            )}
            {step < 3 ? (
              <Pressable
                style={[
                  styles.smallModalSaveBtn,
                  !canGoNext && { opacity: 0.6 },
                ]}
                onPress={handleNext}
                disabled={!canGoNext}
              >
                <Text style={styles.smallModalSaveText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.smallModalSaveBtn,
                  (!isValid || saving) && { opacity: 0.6 },
                ]}
                onPress={onSave}
                disabled={!isValid || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={styles.smallModalSaveText}>Save</Text>
                )}
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReadySummaryRow({
  label,
  value,
  valueColor = WHITE,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.readySummaryRow}>
      <Text style={styles.readySummaryLabel}>{label}</Text>
      <Text style={[styles.readySummaryValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

function SendConfirmModal({
  visible,
  summary,
  sending,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  summary: WarehouseAssignmentPlanSummary | null;
  sending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!summary) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={sending ? () => {} : onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.smallModalOverlay}
        onPress={sending ? undefined : onCancel}
      >
        <Pressable style={styles.smallModalCard} onPress={() => {}}>
          <Text style={styles.smallModalTitle}>
            Send assignments to drivers?
          </Text>
          <Text style={styles.smallModalSubtitle}>
            This will send today&apos;s assignment plan to drivers and update
            remaining packet counts.
          </Text>
          <View style={styles.readySummaryBlock}>
            <ReadySummaryRow
              label="Drivers assigned"
              value={formatCount(summary.drivers_used)}
            />
            <ReadySummaryRow
              label="Packets assigned"
              value={formatCount(summary.assigned_packets)}
            />
            <ReadySummaryRow
              label="Unassigned packets"
              value={formatCount(summary.unassigned_packets)}
              valueColor={ORANGE}
            />
          </View>
          <View style={styles.smallModalButtonsRow}>
            <Pressable
              style={styles.smallModalCancelBtn}
              onPress={onCancel}
              disabled={sending}
            >
              <Text style={styles.smallModalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.smallModalSaveBtn, sending && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <Text style={styles.smallModalSaveText}>Send</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SendSuccessModal({
  visible,
  summary,
  onDone,
}: {
  visible: boolean;
  summary: WarehouseAssignmentPlanSummary | null;
  onDone: () => void;
}) {
  if (!summary) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDone}
      statusBarTranslucent
    >
      <View style={styles.smallModalOverlay}>
        <View style={styles.successModalCard}>
          <View style={styles.successIconCircle}>
            <CheckCircleIcon size={36} color={GREEN} />
          </View>
          <Text style={styles.successTitle}>Assignments sent!</Text>
          <Text style={styles.successSubtitle}>
            Today&apos;s driver assignments are ready.
          </Text>
          <Text style={styles.successMessage}>
            Drivers can now see their assigned ZIPs and packet counts.
          </Text>
          <View style={styles.successSummaryBlock}>
            <Text style={styles.successSummaryLine}>
              {formatCount(summary.assigned_packets)} packets assigned
            </Text>
            <Text style={styles.successSummaryLine}>
              {formatCount(summary.drivers_used)} drivers
            </Text>
            <Text style={styles.successSummaryLine}>
              {formatCount(summary.unassigned_packets)} packets remaining
            </Text>
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
export default function WarehousePlanAssignScreen() {
  const [selectedZips, setSelectedZips] = useState<Set<string>>(new Set());
  const [planData, setPlanData] = useState<WarehouseAssignmentPlanResponse | null>(
    null,
  );
  const [planLoading, setPlanLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sendConfirmVisible, setSendConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccessVisible, setSendSuccessVisible] = useState(false);
  const [sentSummary, setSentSummary] =
    useState<WarehouseAssignmentPlanSummary | null>(null);
  // Manage Assignment popup: edits made inside it are staged locally
  // (manageDraftZips / managePendingOps) and only sent to the backend when
  // "Manage Manually" is pressed — that's the single point where the
  // Suggested Assignment Plan actually changes.
  const [manageMeta, setManageMeta] = useState<{
    id: string;
    name: string;
    initials: string;
    color: string;
    bg: string;
  } | null>(null);
  // Manage Assignment and Change Driver are both full-screen modals; only one
  // may be visible at a time. manageVisible is toggled off (not cleared) when
  // Change Driver opens, and restored when it closes, so we never stack
  // full-screen modals on top of each other.
  const [manageVisible, setManageVisible] = useState(false);
  const [manageDraftZips, setManageDraftZips] = useState<DriverPlanZip[]>([]);
  const [managePendingOps, setManagePendingOps] = useState<
    Map<string, ManagePendingOp>
  >(new Map());
  const [manageCommitting, setManageCommitting] = useState(false);

  const [editCountZip, setEditCountZip] = useState<DriverPlanZip | null>(
    null,
  );
  const [editCountValue, setEditCountValue] = useState("");

  const [changeDriverZip, setChangeDriverZip] = useState<DriverPlanZip | null>(
    null,
  );
  const [changeDriverSelectedId, setChangeDriverSelectedId] = useState<
    string | null
  >(null);

  const [addManualVisible, setAddManualVisible] = useState(false);
  const [addManualDriverId, setAddManualDriverId] = useState<string | null>(
    null,
  );
  const [addManualZipCode, setAddManualZipCode] = useState<string | null>(
    null,
  );
  const [addManualPacketsValue, setAddManualPacketsValue] = useState("");
  const [addManualSaving, setAddManualSaving] = useState(false);

  const [unassignedWorkVisible, setUnassignedWorkVisible] = useState(false);

  const [overviewZipCodes, setOverviewZipCodes] = useState<
    WarehouseZipCodeItem[] | null
  >(null);
  const [overviewZipCodesLoading, setOverviewZipCodesLoading] = useState(true);
  const [overviewAvailableDrivers, setOverviewAvailableDrivers] = useState<
    number | null
  >(null);
  const [overviewDriversLoading, setOverviewDriversLoading] = useState(true);

  const [availableDrivers, setAvailableDrivers] = useState<
    WarehouseAvailableDriver[] | null
  >(null);
  const [availableDriversError, setAvailableDriversError] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    fetchWarehouseZipCodes(session.access_token)
      .then((data) => setOverviewZipCodes(data.zip_codes))
      .catch(() => setOverviewZipCodes(null))
      .finally(() => setOverviewZipCodesLoading(false));

    fetchWarehouseAvailableDrivers(session.access_token)
      .then((data) => {
        const drivers = data.drivers ?? [];
        const readyDriversCount = drivers.filter(
          (d) => d.availability_status === "ready",
        ).length;
        setAvailableDrivers(drivers);
        setOverviewAvailableDrivers(
          data.summary?.available_drivers ?? readyDriversCount,
        );
      })
      .catch(() => {
        setAvailableDrivers(null);
        setAvailableDriversError(true);
        setOverviewAvailableDrivers(null);
      })
      .finally(() => setOverviewDriversLoading(false));
  }, []);

  const readyDrivers = (availableDrivers ?? []).filter(
    (d) => d.availability_status === "ready",
  );

  useEffect(() => {
    if (availableDrivers) {
      setSelectedDriverIds(
        new Set(
          availableDrivers
            .filter((d) => d.availability_status === "ready")
            .map((d) => d.id),
        ),
      );
    }
  }, [availableDrivers]);

  const allDriversSelected =
    readyDrivers.length > 0 &&
    readyDrivers.every((d) => selectedDriverIds.has(d.id));

  const toggleDriver = (id: string) => {
    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllDrivers = () => {
    setSelectedDriverIds(
      allDriversSelected
        ? new Set()
        : new Set(readyDrivers.map((d) => d.id)),
    );
  };

  const validatedZipCodes = (overviewZipCodes ?? []).filter(
    (z) => z.status === "validated",
  );

  useEffect(() => {
    if (overviewZipCodes) {
      setSelectedZips(
        new Set(
          overviewZipCodes
            .filter((z) => z.status === "validated")
            .map((z) => z.id),
        ),
      );
    }
  }, [overviewZipCodes]);

  const overviewValidatedZips = validatedZipCodes.length;
  const overviewTotalPackets = validatedZipCodes.reduce(
    (sum, z) => sum + getRemainingPackets(z),
    0,
  );
  const overviewDriversCount = overviewAvailableDrivers ?? 0;
  const overviewReadyToPlan =
    overviewValidatedZips > 0 &&
    overviewTotalPackets > 0 &&
    overviewDriversCount > 0;
  const overviewLoading = overviewZipCodesLoading || overviewDriversLoading;

  const allSelected =
    validatedZipCodes.length > 0 &&
    selectedZips.size === validatedZipCodes.length;

  const toggleZip = (id: string) => {
    setSelectedZips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedZips(
      allSelected ? new Set() : new Set(validatedZipCodes.map((z) => z.id)),
    );
  };

  const handleGeneratePlan = async () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setPlanLoading(true);
    try {
      const response = await generateWarehouseAssignmentPlan(
        session.access_token,
      );
      setPlanData(response);
    } catch (err) {
      notify(
        "Error",
        errorMessage(
          err,
          "Unable to generate assignment plan. Please try again.",
        ),
      );
    } finally {
      setPlanLoading(false);
    }
  };

  const upsertPendingOp = (itemId: string, patch: ManagePendingOp) => {
    setManagePendingOps((prev) => {
      const next = new Map(prev);
      next.set(itemId, { ...next.get(itemId), ...patch });
      return next;
    });
  };

  const handleOpenEditCount = (zip: DriverPlanZip) => {
    if (!zip.itemId) return;
    setEditCountZip(zip);
    setEditCountValue(String(zip.packets));
  };

  // Edit Count "Save" only validates and stages the new number inside the
  // Manage Assignment popup — it does not touch the backend or the
  // Suggested Assignment Plan. That only happens on "Manage Manually".
  const handleSaveEditCount = () => {
    if (!editCountZip?.itemId) return;

    const packets = parseInt(editCountValue, 10);
    if (!Number.isFinite(packets) || packets <= 0) {
      notify("Invalid count", "Packet count must be greater than 0.");
      return;
    }

    const itemId = editCountZip.itemId;
    setManageDraftZips((prev) =>
      prev.map((z) => (z.itemId === itemId ? { ...z, packets } : z)),
    );
    upsertPendingOp(itemId, { packets });
    setEditCountZip(null);
  };

  const handleOpenChangeDriver = (zip: DriverPlanZip) => {
    if (!zip.itemId) return;
    setManageVisible(false);
    setChangeDriverZip(zip);
    setChangeDriverSelectedId(null);
  };

  const handleCancelChangeDriver = () => {
    setChangeDriverZip(null);
    setChangeDriverSelectedId(null);
    if (manageMeta) setManageVisible(true);
  };

  // Change Driver "Save" validates against live capacity/readiness, then
  // stages the move (removing the ZIP from this driver's draft list) —
  // it's only committed to the backend on "Manage Manually".
  const handleSaveChangeDriver = () => {
    if (!changeDriverZip?.itemId) return;
    if (!changeDriverSelectedId) {
      notify("Select a driver", "Please select a driver to continue.");
      return;
    }
    const selectedOption = changeDriverOptions.find(
      (o) => o.driver.auth_user_id === changeDriverSelectedId,
    );
    if (selectedOption && !selectedOption.isReady) {
      notify("Driver not ready", "This driver isn't marked ready today.");
      return;
    }
    if (selectedOption && !selectedOption.eligible) {
      notify(
        "Not enough capacity",
        `This driver only has ${selectedOption.remaining} packets of remaining capacity, which isn't enough for the ${changeDriverZip.packets} packets on this ZIP.`,
      );
      return;
    }

    const itemId = changeDriverZip.itemId;
    const driverId = changeDriverSelectedId;
    setManageDraftZips((prev) => prev.filter((z) => z.itemId !== itemId));
    upsertPendingOp(itemId, { driverId });
    setChangeDriverZip(null);
    setChangeDriverSelectedId(null);
    if (manageMeta) setManageVisible(true);
  };

  // Remove stages the removal locally (after the confirm dialog, which is
  // the validation step) — the item disappears from the popup immediately,
  // but the backend delete only happens on "Manage Manually".
  const handleRemoveZip = (zip: DriverPlanZip) => {
    if (!zip.itemId) return;
    const itemId = zip.itemId;
    confirmDestructive(
      "Remove this ZIP assignment?",
      "This will remove the selected ZIP assignment from the draft plan.",
      "Remove",
      () => {
        setManageDraftZips((prev) => prev.filter((z) => z.itemId !== itemId));
        setManagePendingOps((prev) => {
          const next = new Map(prev);
          next.set(itemId, { removed: true });
          return next;
        });
      },
    );
  };

  const closeManagePopup = () => {
    setManageVisible(false);
    setManageMeta(null);
    setManageDraftZips([]);
    setManagePendingOps(new Map());
  };

  // The single commit point: validates the staged draft, then applies every
  // pending edit/driver-change/removal to the backend in order, updating the
  // Suggested Assignment Plan as each one lands, and only celebrates once
  // everything has actually been saved.
  const handleManageManually = async () => {
    const totalPackets = manageDraftZips.reduce((sum, z) => sum + z.packets, 0);
    if (manageDraftZips.length === 0 || totalPackets <= 0) {
      notify(
        "No packets assigned",
        "This driver currently has no packets assigned. Add or restore an assignment before finishing.",
      );
      return;
    }
    if (managePendingOps.size === 0) return;

    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setManageCommitting(true);
    try {
      for (const [itemId, op] of managePendingOps) {
        let response: WarehouseAssignmentPlanResponse | null = null;
        if (op.removed) {
          response = await deleteAssignmentPlanItem(
            session.access_token,
            itemId,
          );
        } else {
          if (op.packets !== undefined) {
            response = await updateAssignmentPlanItemPacketCount(
              session.access_token,
              itemId,
              op.packets,
            );
          }
          if (op.driverId !== undefined) {
            response = await changeAssignmentPlanItemDriver(
              session.access_token,
              itemId,
              op.driverId,
            );
          }
        }
        if (response) setPlanData(response);
        setManagePendingOps((prev) => {
          const next = new Map(prev);
          next.delete(itemId);
          return next;
        });
      }
      notify(
        "Congratulations",
        "Your manual changes have been saved to the Suggested Assignment Plan.",
      );
      closeManagePopup();
    } catch (err) {
      notify("Error", errorMessage(err, "Unable to save changes."));
    } finally {
      setManageCommitting(false);
    }
  };

  const openAddManualModal = (preselectZipCode?: string) => {
    setAddManualDriverId(null);
    setAddManualZipCode(preselectZipCode ?? null);
    setAddManualPacketsValue("");
    setAddManualVisible(true);
  };

  const handleAssignManuallyFromUnassignedWork = (zipCode: string) => {
    setUnassignedWorkVisible(false);
    openAddManualModal(zipCode);
  };

  const closeAddManualModal = () => {
    if (addManualSaving) return;
    setAddManualVisible(false);
    setAddManualDriverId(null);
    setAddManualZipCode(null);
    setAddManualPacketsValue("");
  };

  const handleSaveAddManual = async () => {
    const packets = parseInt(addManualPacketsValue, 10);
    const valid =
      !!addManualDriverId &&
      !!addManualZipCode &&
      Number.isFinite(packets) &&
      packets > 0 &&
      packets <= manualMaxPackets;

    if (!valid) {
      notify("Invalid assignment", "Please enter a valid manual assignment.");
      return;
    }

    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setAddManualSaving(true);
    try {
      const response = await addManualAssignmentItem(
        session.access_token,
        addManualDriverId,
        addManualZipCode,
        packets,
      );
      setPlanData(response);
      setAddManualVisible(false);
      setAddManualDriverId(null);
      setAddManualZipCode(null);
      setAddManualPacketsValue("");
      notify("Success", "Manual assignment added.");
    } catch (err) {
      notify("Error", errorMessage(err, "Unable to add manual assignment."));
    } finally {
      setAddManualSaving(false);
    }
  };

  const handleRegenerate = () => {
    if (!planData || planData.status !== "draft" || regenerating) return;

    confirmDestructive(
      "Regenerate assignment plan?",
      "This will replace the current draft plan.",
      "Regenerate",
      async () => {
        const session = sessionStore.get();
        if (session?.kind !== "warehouse") return;

        setRegenerating(true);
        try {
          const response = await generateWarehouseAssignmentPlan(
            session.access_token,
          );
          setPlanData(response);
        } catch (err) {
          notify(
            "Error",
            errorMessage(
              err,
              "Unable to regenerate assignment plan. Please try again.",
            ),
          );
        } finally {
          setRegenerating(false);
        }
      },
    );
  };

  const handleSendToDriversPress = () => {
    if (
      !planData ||
      planData.assignments.length === 0 ||
      planData.status !== "draft"
    ) {
      notify(
        "Cannot send plan",
        "Generate a draft plan with at least one assignment before sending it to drivers.",
      );
      return;
    }
    setSendConfirmVisible(true);
  };

  const handleConfirmSend = async () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    setSending(true);
    try {
      const response = await sendWarehouseAssignmentPlan(
        session.access_token,
      );
      setPlanData(response);
      setSentSummary(response.summary);
      setSendConfirmVisible(false);
      setSendSuccessVisible(true);
    } catch (err) {
      notify(
        "Error",
        errorMessage(err, "Unable to send assignment plan. Please try again."),
      );
    } finally {
      setSending(false);
    }
  };

  const driverPlanGroups: DriverPlanGroup[] = (() => {
    const order: string[] = [];
    const groups = new Map<
      string,
      {
        name: string;
        zips: DriverPlanZip[];
        matchTypes: Set<string>;
        totalPackets: number;
      }
    >();

    (planData?.assignments ?? []).forEach((a) => {
      let group = groups.get(a.driver_auth_user_id);
      if (!group) {
        group = { name: a.driver_name, zips: [], matchTypes: new Set(), totalPackets: 0 };
        groups.set(a.driver_auth_user_id, group);
        order.push(a.driver_auth_user_id);
      }
      group.zips.push({
        itemId: a.item_id,
        zip: a.zip_code,
        packets: a.packets,
        matchType: a.match_type,
        reason: a.reason,
      });
      group.matchTypes.add(a.match_type);
      group.totalPackets += a.packets;
    });

    return order.map((driverId, i) => {
      const group = groups.get(driverId)!;
      const palette = DRIVER_AVATAR_COLORS[i % DRIVER_AVATAR_COLORS.length];
      return {
        id: driverId,
        initials: getDriverInitials(group.name),
        color: palette.color,
        bg: palette.bg,
        name: group.name,
        totalPackets: group.totalPackets,
        zips: group.zips,
        matchType: resolveDriverMatchType(group.matchTypes),
      };
    });
  })();

  const zipsAssignedCount = new Set(
    (planData?.assignments ?? []).map((a) => a.zip_code),
  ).size;

  const regenerateDisabled =
    !planData || planData.status !== "draft" || regenerating;
  const sendDisabled =
    !planData ||
    planData.status !== "draft" ||
    planData.assignments.length === 0 ||
    sending;

  const changeDriverOptions: DriverCapacityOption[] = (() => {
    const itemId = changeDriverZip?.itemId ?? null;
    const packetsToAssign = changeDriverZip?.packets ?? 0;

    const currentLoadByDriver = new Map<string, number>();
    (planData?.assignments ?? []).forEach((a) => {
      if (a.item_id === itemId) return;
      currentLoadByDriver.set(
        a.driver_auth_user_id,
        (currentLoadByDriver.get(a.driver_auth_user_id) ?? 0) + a.packets,
      );
    });

    return (availableDrivers ?? []).map((driver) => {
      const isReady = driver.availability_status === "ready";
      const currentLoad = currentLoadByDriver.get(driver.auth_user_id) ?? 0;
      const remaining = MAX_DRIVER_PACKETS - currentLoad;
      return {
        driver,
        isReady,
        currentLoad,
        remaining,
        eligible: isReady && remaining >= packetsToAssign,
      };
    });
  })();

  const manualDriverOptions: ManualDriverOption[] = readyDrivers.map(
    (driver) => {
      const currentLoad = (planData?.assignments ?? [])
        .filter((a) => a.driver_auth_user_id === driver.auth_user_id)
        .reduce((sum, a) => sum + a.packets, 0);
      return {
        driver,
        currentLoad,
        available: MAX_DRIVER_PACKETS - currentLoad,
      };
    },
  );

  const manualZipOptions: ManualZipOption[] = (() => {
    const source = planData?.unassigned_zips
      ? planData.unassigned_zips.map((z) => ({
          zip_code: z.zip_code,
          packets: z.packets,
        }))
      : (() => {
          const assignedZipCodes = new Set(
            (planData?.assignments ?? []).map((a) => a.zip_code),
          );
          return validatedZipCodes
            .filter((z) => !assignedZipCodes.has(z.zip_code))
            .map((z) => ({
              zip_code: z.zip_code,
              packets: getRemainingPackets(z),
            }));
        })();
    return source.filter((z) => z.packets > 0);
  })();

  const readyDriversHaveCapacity = manualDriverOptions.some(
    (o) => o.available > 0,
  );
  const unassignedWorkReason = readyDriversHaveCapacity
    ? "Some drivers still have capacity. You can assign packets manually."
    : "All ready drivers are full. Add more ready drivers or leave packets for tomorrow.";

  const driverCapacityRows: DriverCapacityRowData[] = (() => {
    const rows: DriverCapacityRowData[] = manualDriverOptions.map((o) => ({
      key: o.driver.auth_user_id,
      name: o.driver.full_name,
      load: o.currentLoad,
      available: o.available,
    }));
    const seen = new Set(rows.map((r) => r.key));
    (planData?.drivers_without_packets ?? []).forEach((d) => {
      if (seen.has(d.driver_auth_user_id)) return;
      seen.add(d.driver_auth_user_id);
      rows.push({
        key: d.driver_auth_user_id,
        name: d.driver_name,
        load: 0,
        available: MAX_DRIVER_PACKETS,
      });
    });
    return rows;
  })();

  const selectedManualDriver = manualDriverOptions.find(
    (o) => o.driver.auth_user_id === addManualDriverId,
  );
  const selectedManualZip = manualZipOptions.find(
    (z) => z.zip_code === addManualZipCode,
  );
  const manualMaxPackets =
    selectedManualDriver && selectedManualZip
      ? Math.max(
          0,
          Math.min(selectedManualDriver.available, selectedManualZip.packets),
        )
      : 0;

  const manageDraftGroup: DriverPlanGroup | null = manageMeta
    ? {
        id: manageMeta.id,
        initials: manageMeta.initials,
        color: manageMeta.color,
        bg: manageMeta.bg,
        name: manageMeta.name,
        zips: manageDraftZips,
        totalPackets: manageDraftZips.reduce((sum, z) => sum + z.packets, 0),
        matchType: resolveDriverMatchType(
          new Set(manageDraftZips.map((z) => z.matchType)),
        ),
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
        >
          {/* ── Top Header ────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Warehouse</Text>
              <Text style={styles.headerTitle}>Plan & Assign</Text>
              <Text style={styles.headerSubtitle}>
                Match ZIP counts with available drivers and send assignments.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Today's Assignment Plan ──────────────────────────────────── */}
          <View style={styles.overviewSection}>
            <View style={styles.overviewHeaderRow}>
              <View style={styles.overviewIconBox}>
                <CalendarIcon size={22} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.overviewTitle}>
                  Today&apos;s Assignment Plan
                </Text>
                <Text style={styles.overviewSubtitle}>
                  Overview of today&apos;s ZIP assignments and drivers.
                </Text>
              </View>
              <Image
                source={images.warehousePlanAssignHero}
                style={styles.overviewHeroImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.overviewGrid}>
              <OverviewStatCard
                icon={<PinIcon size={20} color={GREEN} />}
                accent={GREEN}
                title="Validated ZIPs"
                value={
                  overviewLoading ? "--" : formatCount(overviewValidatedZips)
                }
                subtitle="ZIPs ready for assignment"
              />
              <OverviewStatCard
                icon={<BoxIcon size={20} color={ORANGE} />}
                accent={ORANGE}
                title="Total Packets"
                value={
                  overviewLoading ? "--" : formatCount(overviewTotalPackets)
                }
                subtitle="Packets to be delivered"
              />
              <OverviewStatCard
                icon={<PeopleIcon size={20} color={BLUE} />}
                accent={BLUE}
                title="Available Drivers"
                value={
                  overviewLoading ? "--" : formatCount(overviewDriversCount)
                }
                subtitle="Drivers available today"
              />
              <OverviewStatCard
                icon={<CheckCircleIcon size={20} color={TEAL} />}
                accent={TEAL}
                title="Ready to Plan"
                value={
                  overviewLoading ? "--" : overviewReadyToPlan ? "Yes" : "No"
                }
                subtitle="All set to assign"
              />
            </View>
          </View>

          {/* ── Validated ZIP Counts ─────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Validated ZIP Counts</Text>
            <Pressable
              style={styles.selectAllRow}
              onPress={toggleSelectAll}
              hitSlop={6}
            >
              <Text style={styles.selectAllText}>Select all</Text>
              <View
                style={[styles.checkbox, allSelected && styles.checkboxActive]}
              >
                {allSelected && <CheckboxIcon size={13} />}
              </View>
            </Pressable>
          </View>
          <View style={styles.card}>
            {overviewZipCodesLoading ? (
              <Text style={styles.zipEmptyText}>
                Loading validated ZIP counts…
              </Text>
            ) : validatedZipCodes.length === 0 ? (
              <Text style={styles.zipEmptyText}>
                No validated ZIP counts ready for assignment.
              </Text>
            ) : (
              validatedZipCodes.map((entry, i) => (
                <ZipCountRow
                  key={entry.id}
                  entry={entry}
                  isLast={i === validatedZipCodes.length - 1}
                  isSelected={selectedZips.has(entry.id)}
                  onToggle={() => toggleZip(entry.id)}
                />
              ))
            )}
          </View>

          {/* ── Available Drivers ────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionLabel}>Available Drivers</Text>
              <View style={styles.availableCountBadge}>
                <Text style={styles.availableCountBadgeText}>
                  {readyDrivers.length} available
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.selectAllRow}
              onPress={toggleSelectAllDrivers}
              hitSlop={6}
            >
              <Text style={styles.selectAllText}>Select all</Text>
              <View
                style={[
                  styles.checkbox,
                  allDriversSelected && styles.checkboxActive,
                ]}
              >
                {allDriversSelected && <CheckboxIcon size={13} />}
              </View>
            </Pressable>
          </View>
          {overviewDriversLoading ? (
            <View style={styles.card}>
              <Text style={styles.zipEmptyText}>
                Loading available drivers…
              </Text>
            </View>
          ) : availableDriversError ? (
            <View style={styles.card}>
              <Text style={styles.zipEmptyText}>
                Unable to load available drivers.
              </Text>
            </View>
          ) : readyDrivers.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.zipEmptyText}>
                No available drivers today.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.driversScroll}
              contentContainerStyle={styles.driversScrollContent}
            >
              {readyDrivers.map((driver, i) => {
                const palette =
                  DRIVER_AVATAR_COLORS[i % DRIVER_AVATAR_COLORS.length];
                return (
                  <DriverCardItem
                    key={driver.id}
                    driver={driver}
                    color={palette.color}
                    bg={palette.bg}
                    isSelected={selectedDriverIds.has(driver.id)}
                    onToggle={() => toggleDriver(driver.id)}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* ── AI Planning Criteria ─────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.aiHeaderRow}>
              <Text style={styles.cardTitle}>AI Planning Criteria</Text>
              <View style={styles.aiIconBox}>
                <SparklesIcon size={20} color={ORANGE} />
              </View>
            </View>
            {PLANNING_CRITERIA.map((criteria, i) => (
              <View
                key={criteria}
                style={[
                  styles.criteriaRow,
                  i === PLANNING_CRITERIA.length - 1 && { marginBottom: 0 },
                ]}
              >
                <View style={styles.criteriaCheck}>
                  <CheckboxIcon size={11} color={ORANGE} />
                </View>
                <Text style={styles.criteriaText}>{criteria}</Text>
              </View>
            ))}
            <Text style={styles.aiNoteText}>
              OpenAI will suggest a plan. Warehouse must review and approve it
              before sending.
            </Text>
            <Pressable
              style={[styles.generateBtn, planLoading && { opacity: 0.6 }]}
              onPress={handleGeneratePlan}
              disabled={planLoading}
            >
              <SparklesIcon size={16} color={WHITE} />
              <Text style={styles.generateBtnText}>
                {planLoading ? "Generating Plan…" : "Generate Plan"}
              </Text>
            </Pressable>
          </View>

          {planData && (
            <>
              {/* ── Suggested Assignment Plan ──────────────────────────────── */}
              <Text style={styles.sectionLabel}>Suggested Assignment Plan</Text>
              <Text style={styles.suggestedPlanSubtitle}>
                AI suggested plan based on ZIP match, capacity and workload.
              </Text>

              {driverPlanGroups.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.zipEmptyText}>
                    No assignments generated yet.
                  </Text>
                </View>
              ) : (
                driverPlanGroups.map((group) => (
                  <DriverPlanCard
                    key={group.id}
                    group={group}
                    onManage={() => {
                      setManageMeta({
                        id: group.id,
                        name: group.name,
                        initials: group.initials,
                        color: group.color,
                        bg: group.bg,
                      });
                      setManageDraftZips(group.zips);
                      setManagePendingOps(new Map());
                      setManageVisible(true);
                    }}
                  />
                ))
              )}

              {/* ── Unassigned Work ────────────────────────────────────────── */}
              <Pressable
                style={styles.workButtonCard}
                onPress={() => setUnassignedWorkVisible(true)}
              >
                <View style={styles.workIconBox}>
                  <WarningIcon size={20} color={ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workTitle}>Unassigned Work</Text>
                  <Text style={styles.workTotalText}>
                    {formatCount(planData.summary.unassigned_packets)} packets
                    unassigned
                  </Text>
                  <Text style={styles.workReasonText} numberOfLines={1}>
                    {planData.summary.unassigned_packets > 0
                      ? unassignedWorkReason
                      : "Tap to review unassigned ZIPs and driver capacity."}
                  </Text>
                </View>
                <ChevronRight size={18} color={ORANGE} />
              </Pressable>

              <Pressable
                style={styles.addManualBtn}
                onPress={() => openAddManualModal()}
              >
                <PlusCircleIcon size={20} color={WHITE} />
                <Text style={styles.addManualBtnText}>
                  Add Manual Assignment
                </Text>
              </Pressable>

              {/* ── Ready to send assignments ─────────────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Ready to send assignments?</Text>
                <View style={styles.readySummaryBlock}>
                  <ReadySummaryRow
                    label="Drivers assigned"
                    value={formatCount(planData.summary.drivers_used)}
                  />
                  <ReadySummaryRow
                    label="ZIPs assigned"
                    value={formatCount(zipsAssignedCount)}
                  />
                  <ReadySummaryRow
                    label="Packets assigned"
                    value={formatCount(planData.summary.assigned_packets)}
                  />
                  <ReadySummaryRow
                    label="Unassigned packets"
                    value={formatCount(planData.summary.unassigned_packets)}
                    valueColor={ORANGE}
                  />
                </View>
                <View style={styles.readyActionsRow}>
                  <Pressable
                    style={[
                      styles.regenerateBtn,
                      regenerateDisabled && styles.regenerateBtnDisabled,
                    ]}
                    onPress={handleRegenerate}
                    disabled={regenerateDisabled}
                  >
                    {regenerating ? (
                      <ActivityIndicator size="small" color={ORANGE} />
                    ) : planData.status === "sent" ? (
                      <Text style={styles.regenerateBtnDisabledText}>
                        Plan already sent
                      </Text>
                    ) : (
                      <>
                        <RefreshIcon size={15} color={ORANGE} />
                        <Text style={styles.regenerateBtnText}>
                          Regenerate Plan
                        </Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]}
                    onPress={handleSendToDriversPress}
                    disabled={sendDisabled}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={WHITE} />
                    ) : planData.status === "sent" ? (
                      <>
                        <CheckCircleIcon size={15} color={WHITE} />
                        <Text style={styles.sendBtnText}>Sent</Text>
                      </>
                    ) : (
                      <>
                        <SendIcon size={15} color={WHITE} />
                        <Text style={styles.sendBtnText}>Send to Drivers</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <ManageAssignmentModal
        visible={manageVisible}
        group={manageDraftGroup}
        onClose={closeManagePopup}
        hasChanges={managePendingOps.size > 0}
        committing={manageCommitting}
        onEditCount={handleOpenEditCount}
        onChangeDriver={handleOpenChangeDriver}
        onRemove={handleRemoveZip}
        onManageManually={handleManageManually}
      />
      <EditCountModal
        visible={!!editCountZip}
        zipLabel={editCountZip?.zip ?? ""}
        value={editCountValue}
        onChangeValue={setEditCountValue}
        onCancel={() => setEditCountZip(null)}
        onSave={handleSaveEditCount}
      />
      <ChangeDriverModal
        visible={!!changeDriverZip}
        zipLabel={changeDriverZip?.zip ?? ""}
        packetsToAssign={changeDriverZip?.packets ?? 0}
        options={changeDriverOptions}
        selectedDriverId={changeDriverSelectedId}
        onSelectDriver={setChangeDriverSelectedId}
        onCancel={handleCancelChangeDriver}
        onSave={handleSaveChangeDriver}
      />
      <AddManualAssignmentModal
        visible={addManualVisible}
        driverOptions={manualDriverOptions}
        zipOptions={manualZipOptions}
        selectedDriverId={addManualDriverId}
        onSelectDriver={setAddManualDriverId}
        selectedZipCode={addManualZipCode}
        onSelectZip={setAddManualZipCode}
        packetsValue={addManualPacketsValue}
        onChangePackets={setAddManualPacketsValue}
        maxPackets={manualMaxPackets}
        saving={addManualSaving}
        onCancel={closeAddManualModal}
        onSave={handleSaveAddManual}
      />
      <UnassignedWorkModal
        visible={unassignedWorkVisible}
        totalUnassigned={planData?.summary.unassigned_packets ?? 0}
        reason={
          (planData?.summary.unassigned_packets ?? 0) > 0
            ? unassignedWorkReason
            : "All packets are assigned."
        }
        zips={planData?.unassigned_zips ?? []}
        driverRows={driverCapacityRows}
        onAssignManually={handleAssignManuallyFromUnassignedWork}
        onClose={() => setUnassignedWorkVisible(false)}
      />
      <SendConfirmModal
        visible={sendConfirmVisible}
        summary={planData?.summary ?? null}
        sending={sending}
        onCancel={() => setSendConfirmVisible(false)}
        onConfirm={handleConfirmSend}
      />
      <SendSuccessModal
        visible={sendSuccessVisible}
        summary={sentSummary}
        onDone={() => setSendSuccessVisible(false)}
      />
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

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
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

  // ── Today's Assignment Plan overview
  overviewSection: { marginBottom: 20 },
  overviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  overviewIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,101,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  overviewTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    lineHeight: 22,
    color: WHITE,
  },
  overviewSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: DIM,
    marginTop: 2,
  },
  overviewHeroImage: {
    width: 100,
    height: 80,
    flexShrink: 0,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  overviewCard: {
    width: "48.5%",
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    paddingBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  overviewCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  overviewCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    lineHeight: 16,
    color: WHITE,
    marginBottom: 4,
  },
  overviewCardValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 2,
  },
  overviewCardSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 15,
    color: DIM,
  },
  overviewCardBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },

  // ── Select all
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  availableCountBadge: {
    backgroundColor: "rgba(255,101,0,0.15)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  availableCountBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: ORANGE,
  },

  // ── Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,101,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Validated ZIP Counts rows
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  zipCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
  },
  zipCountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 90,
  },
  zipCountNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  zipCountPackets: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  validatedBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  validatedBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: GREEN,
  },
  zipEmptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    textAlign: "center",
    paddingVertical: 12,
  },

  // ── Available Drivers cards
  driversScroll: { width: "100%", marginBottom: 18 },
  driversScrollContent: { gap: 12, paddingRight: 4 },
  driverCard: {
    width: 200,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  driverCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
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
  driverId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  driverDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  driverDetailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
  },
  driverDetailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: WHITE,
  },
  driverStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  driverStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  driverStatusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },
  driverCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  // ── AI Planning Criteria
  aiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  criteriaCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,101,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  criteriaText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  aiNoteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  generateBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  generateBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },

  // ── Suggested Assignment Plan
  suggestedPlanSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    lineHeight: 17,
    marginTop: -6,
    marginBottom: 14,
  },
  driverPlanCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  driverPlanTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  planAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverPlanTotalText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  driverPlanBadgeCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: INNER,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  progressPctText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: GREEN,
  },
  zipChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  zipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  zipChipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: WHITE,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  matchBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },
  draftBadge: {
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  draftBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: DIM,
  },
  workButtonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    padding: 16,
    marginBottom: 12,
  },
  workIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  workTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  workTotalText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: ORANGE,
    marginTop: 3,
  },
  workReasonText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    lineHeight: 17,
    marginTop: 5,
  },
  workZipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: INNER,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  workZipReasonText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
    marginTop: 2,
  },
  workAssignBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  workAssignBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: ORANGE,
  },

  // ── Driver Capacity
  capacityListCard: {
    backgroundColor: INNER,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  capacityLoadText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: DIM,
    flexShrink: 0,
  },
  capacityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  capacityBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },
  addManualBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  addManualBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },

  // ── Ready to send assignments
  readySummaryBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  readySummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  readySummaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
  },
  readySummaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
  },
  readyActionsRow: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  regenerateBtn: {
    width: "100%",
    flexDirection: "row",
    gap: 7,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  regenerateBtnDisabled: {
    borderColor: BORDER,
    opacity: 0.7,
  },
  regenerateBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  regenerateBtnDisabledText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: MUTED,
  },
  sendBtn: {
    width: "100%",
    flexDirection: "row",
    gap: 7,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: withOpacity(ORANGE, 0.35),
  },
  sendBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Send success popup
  successModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: "center",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    textAlign: "center",
  },
  successSubtitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DIM,
    textAlign: "center",
    marginTop: 6,
  },
  successMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  successSummaryBlock: {
    width: "100%",
    backgroundColor: INNER,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 6,
  },
  successSummaryLine: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    textAlign: "center",
  },
  successDoneBtn: {
    width: "100%",
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  successDoneBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },

  // ── Full-screen modal shell (Manage / Change Driver / Add Manual / Unassigned Work)
  keyboardAvoidingFill: {
    flex: 1,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: BG,
  },
  fullScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  fullScreenBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fullScreenHeaderText: {
    flex: 1,
  },
  fullScreenTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  fullScreenSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    marginTop: 2,
  },
  fullScreenContent: {
    flex: 1,
    minHeight: 0,
  },
  fullScreenScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  fullScreenFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  fullScreenWarningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: withOpacity(AMBER, 0.12),
    borderWidth: 1,
    borderColor: withOpacity(AMBER, 0.35),
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 14,
  },
  fullScreenWarningText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: AMBER,
    lineHeight: 16,
  },

  // ── Add Manual Assignment step indicator
  stepDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepDotActive: {
    width: 22,
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  stepDotDone: {
    backgroundColor: withOpacity(ORANGE, 0.4),
    borderColor: withOpacity(ORANGE, 0.4),
  },

  // ── Unassigned Work tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: withOpacity(ORANGE, 0.15),
    borderColor: ORANGE,
  },
  tabBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: DIM,
  },
  tabBtnTextActive: {
    color: ORANGE,
  },
  capacityListWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  capacityListFlatList: {
    flex: 1,
  },
  workReasonBanner: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    lineHeight: 17,
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  // ── "Why this assignment?"
  whyCard: {
    backgroundColor: INNER,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginTop: 4,
  },
  whyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
  },

  manageDriverRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  manageDriverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  manageMatchRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 20,
  },
  manageSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
    marginBottom: 10,
  },
  manageZipCard: {
    backgroundColor: INNER,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  manageZipTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  manageZipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  manageZipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  manageZipCode: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  manageZipPackets: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 1,
  },
  manageZipActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  manageActionBtn: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  manageActionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: DIM,
  },
  manageActionBtnDanger: {
    borderColor: "rgba(239,68,68,0.35)",
  },
  manageActionBtnDangerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: "#EF4444",
  },
  manageManualBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  manageManualBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  manageManualBtnDisabled: {
    borderColor: BORDER,
    opacity: 0.5,
  },
  manageManualBtnTextDisabled: {
    color: MUTED,
  },
  manageCloseFooterBtn: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  manageCloseFooterBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Edit Count / Change Driver small modals
  smallModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  smallModalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: MODAL_MAX_HEIGHT,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  smallModalScrollContent: {
    paddingBottom: 4,
  },
  smallModalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
  smallModalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    marginTop: 4,
    marginBottom: 16,
  },
  smallModalInput: {
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: WHITE,
  },
  smallModalInputError: {
    borderColor: "#EF4444",
  },
  smallModalErrorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: "#EF4444",
    marginTop: 6,
  },
  smallModalButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  smallModalCancelBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  smallModalCancelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DIM,
  },
  smallModalSaveBtn: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  smallModalSaveText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Change Driver picker
  driverPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  driverPickerRowSelected: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.1)",
  },
  driverPickerRowDisabled: {
    opacity: 0.45,
  },
  driverPickerMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  driverPickerIneligibleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#EF4444",
    marginTop: 3,
  },
  // ── Add Manual Assignment
  manualAvailableText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: GREEN,
    marginTop: 2,
  },
  manualMaxHintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 6,
  },
});
