import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Send", style: "default", onPress: onConfirm },
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
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const PLAN_SUMMARY = {
  validatedZips: "4",
  totalPackets: "1,240",
  availableDrivers: "6",
  readyToPlan: "Yes",
};

interface ZipRow {
  zip: string;
  packets: number;
}

const ZIP_COUNTS: ZipRow[] = [
  { zip: "12345", packets: 400 },
  { zip: "14725", packets: 280 },
  { zip: "36945", packets: 320 },
  { zip: "12536", packets: 240 },
];

interface DriverCard {
  id: string;
  initials: string;
  color: string;
  bg: string;
  name: string;
  driverId: string;
  homeZip: string;
  carType: string;
  load: number;
}

const DRIVERS: DriverCard[] = [
  {
    id: "1",
    initials: "AK",
    color: ORANGE,
    bg: "rgba(255,101,0,0.15)",
    name: "Ali Kaya",
    driverId: "DRV-2026-001",
    homeZip: "20099",
    carType: "Company car",
    load: 0,
  },
  {
    id: "2",
    initials: "MÖ",
    color: BLUE,
    bg: "rgba(59,130,246,0.15)",
    name: "Mehmet Öztürk",
    driverId: "DRV-2026-002",
    homeZip: "22087",
    carType: "Own car",
    load: 0,
  },
  {
    id: "3",
    initials: "SC",
    color: GREEN,
    bg: "rgba(34,197,94,0.15)",
    name: "Sara Chen",
    driverId: "DRV-2026-003",
    homeZip: "20355",
    carType: "Own car",
    load: 0,
  },
];

const PLANNING_CRITERIA: string[] = [
  "Match ZIP code with closest driver home ZIP",
  "Use validated packet counts only",
  "Balance packet load between drivers",
  "Prefer available active drivers",
  "Keep assignment clear and simple for drivers",
];

interface PlanRow {
  id: string;
  initials: string;
  color: string;
  bg: string;
  name: string;
  zip: string;
  packets: number;
  reason: string;
}

const SUGGESTED_PLAN: PlanRow[] = [
  {
    id: "1",
    initials: "AK",
    color: ORANGE,
    bg: "rgba(255,101,0,0.15)",
    name: "Ali Kaya",
    zip: "12345",
    packets: 400,
    reason: "Closest available driver to this ZIP area.",
  },
  {
    id: "2",
    initials: "MÖ",
    color: BLUE,
    bg: "rgba(59,130,246,0.15)",
    name: "Mehmet Öztürk",
    zip: "14725",
    packets: 280,
    reason: "Good match based on driver home ZIP and workload.",
  },
  {
    id: "3",
    initials: "SC",
    color: GREEN,
    bg: "rgba(34,197,94,0.15)",
    name: "Sara Chen",
    zip: "36945",
    packets: 320,
    reason: "Balanced packet load with available driver capacity.",
  },
];

const PLAN_WARNINGS: string[] = [
  "ZIP 12536 is not assigned yet",
  "Driver Ali Kaya has the highest packet load",
  "1 ZIP still needs manual assignment",
];

const READY_SUMMARY = {
  driversAssigned: "3",
  zipsAssigned: "3 of 4",
  packetsAssigned: "1,000 of 1,240",
  unassignedPackets: "240",
};

interface SentRow {
  name: string;
  zip: string;
  packets: number;
  time: string;
}

const SENT_ASSIGNMENTS: SentRow[] = [
  { name: "Ali Kaya", zip: "12345", packets: 400, time: "Today, 10:45 AM" },
  { name: "Mehmet Öztürk", zip: "14725", packets: 280, time: "Today, 10:45 AM" },
  { name: "Sara Chen", zip: "36945", packets: 320, time: "Today, 10:45 AM" },
];

// ─── SVG icons ────────────────────────────────────────────────────────────────
function PinIcon({ size = 18, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function BoxIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PeopleIcon({ size = 18, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

function CheckboxIcon({ size = 15, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
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

function SparklesIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
        fill={color}
      />
      <Path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z" fill={color} />
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

function RefreshIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

// ─── small building blocks ───────────────────────────────────────────────────
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
      <View style={styles.statIconRow}>
        {icon}
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function ZipCountRow({
  entry,
  isLast,
  isSelected,
  onToggle,
}: {
  entry: ZipRow;
  isLast: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.zipCountRow, !isLast && styles.rowDivider]}>
      <View style={styles.zipCountLeft}>
        <PinIcon size={16} color={ORANGE} />
        <Text style={styles.zipCountNumber}>{entry.zip}</Text>
      </View>
      <Text style={styles.zipCountPackets}>{entry.packets} packets</Text>
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

function DriverCardItem({ driver }: { driver: DriverCard }) {
  return (
    <View style={styles.driverCard}>
      <View style={styles.driverCardTopRow}>
        <View style={[styles.driverAvatar, { backgroundColor: driver.bg }]}>
          <Text style={[styles.driverInitials, { color: driver.color }]}>{driver.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driver.name}
          </Text>
          <Text style={styles.driverId}>{driver.driverId}</Text>
        </View>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Home ZIP</Text>
        <Text style={styles.driverDetailValue}>{driver.homeZip}</Text>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Type</Text>
        <Text
          style={[
            styles.driverDetailValue,
            { color: driver.carType === "Own car" ? ORANGE : BLUE },
          ]}
        >
          {driver.carType}
        </Text>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Status</Text>
        <View style={styles.driverStatusRow}>
          <View style={styles.driverStatusDot} />
          <Text style={styles.driverStatusText}>Available</Text>
        </View>
      </View>
      <View style={styles.driverDetailRow}>
        <Text style={styles.driverDetailLabel}>Current load</Text>
        <Text style={styles.driverDetailValue}>{driver.load} packets</Text>
      </View>
      <View style={styles.driverCardFooter}>
        <View style={styles.checkboxActive}>
          <CheckboxIcon size={13} />
        </View>
        <ChevronRight size={16} color={ORANGE} />
      </View>
    </View>
  );
}

function ActionLinks({ onAction }: { onAction: (action: string) => void }) {
  const actions = ["Change Driver", "Change ZIP", "Edit Count", "Remove"];
  return (
    <View style={styles.actionLinksRow}>
      {actions.map((action, i) => (
        <View key={action} style={styles.actionLinkWrap}>
          <Pressable onPress={() => onAction(action)} hitSlop={6}>
            <Text style={styles.actionLinkText}>{action}</Text>
          </Pressable>
          {i < actions.length - 1 && <Text style={styles.actionLinkDivider}>|</Text>}
        </View>
      ))}
    </View>
  );
}

function SuggestedPlanRow({
  row,
  isLast,
  onAction,
}: {
  row: PlanRow;
  isLast: boolean;
  onAction: (action: string) => void;
}) {
  return (
    <View style={[styles.planRow, !isLast && styles.rowDivider]}>
      <View style={styles.planRowTop}>
        <View style={[styles.driverAvatar, { backgroundColor: row.bg }]}>
          <Text style={[styles.driverInitials, { color: row.color }]}>{row.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>{row.name}</Text>
          <Text style={styles.planZipText}>
            ZIP {row.zip} · {row.packets} packets
          </Text>
        </View>
        <View style={styles.draftBadge}>
          <Text style={styles.draftBadgeText}>Draft</Text>
        </View>
      </View>
      <Text style={styles.planReasonText}>Reason: {row.reason}</Text>
      <ActionLinks onAction={onAction} />
    </View>
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
      <Text style={[styles.readySummaryValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function SentRowItem({ item, isLast }: { item: SentRow; isLast: boolean }) {
  return (
    <View style={[styles.sentRow, !isLast && styles.rowDivider]}>
      <CheckCircleIcon size={18} color={GREEN} />
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.planZipText}>
          ZIP {item.zip} · {item.packets} packets
        </Text>
      </View>
      <View style={styles.sentRight}>
        <View style={styles.sentBadge}>
          <Text style={styles.sentBadgeText}>Sent</Text>
        </View>
        <Text style={styles.sentTime}>{item.time}</Text>
      </View>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehousePlanAssignScreen() {
  const [selectedZips, setSelectedZips] = useState<Set<string>>(
    new Set(ZIP_COUNTS.map((z) => z.zip))
  );
  const [planGenerated, setPlanGenerated] = useState(false);
  const [plansSent, setPlansSent] = useState(false);

  const allSelected = selectedZips.size === ZIP_COUNTS.length;

  const toggleZip = (zip: string) => {
    setSelectedZips((prev) => {
      const next = new Set(prev);
      if (next.has(zip)) next.delete(zip);
      else next.add(zip);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedZips(allSelected ? new Set() : new Set(ZIP_COUNTS.map((z) => z.zip)));
  };

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
  };

  const handleRowAction = (action: string) => {
    notify(action, "This action is not available in the preview.");
  };

  const handleAddManual = () => {
    notify("Add Manual Assignment", "Manual assignment editing is not available in the preview.");
  };

  const handleRegenerate = () => {
    notify("Regenerate Plan", "A new suggested plan would be generated here.");
  };

  const handleSendToDrivers = () => {
    confirmAction(
      "Send to Drivers",
      "Send this assignment plan to all matched drivers?",
      () => setPlansSent(true)
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today&apos;s Assignment Plan</Text>
            <View style={styles.statsGrid}>
              <StatItem icon={<PinIcon size={16} />} label="Validated ZIPs" value={PLAN_SUMMARY.validatedZips} />
              <StatItem icon={<BoxIcon size={16} />} label="Total Packets" value={PLAN_SUMMARY.totalPackets} />
              <StatItem icon={<PeopleIcon size={16} />} label="Available Drivers" value={PLAN_SUMMARY.availableDrivers} />
              <StatItem
                icon={<CheckCircleIcon size={16} />}
                label="Ready to Plan"
                value={PLAN_SUMMARY.readyToPlan}
                valueColor={GREEN}
              />
            </View>
            <Text style={styles.cardText}>
              All validated ZIP counts are ready to be matched with drivers.
            </Text>
          </View>

          {/* ── Validated ZIP Counts ─────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Validated ZIP Counts</Text>
            <Pressable style={styles.selectAllRow} onPress={toggleSelectAll} hitSlop={6}>
              <Text style={styles.selectAllText}>Select all</Text>
              <View style={[styles.checkbox, allSelected && styles.checkboxActive]}>
                {allSelected && <CheckboxIcon size={13} />}
              </View>
            </Pressable>
          </View>
          <View style={styles.card}>
            {ZIP_COUNTS.map((entry, i) => (
              <ZipCountRow
                key={entry.zip}
                entry={entry}
                isLast={i === ZIP_COUNTS.length - 1}
                isSelected={selectedZips.has(entry.zip)}
                onToggle={() => toggleZip(entry.zip)}
              />
            ))}
          </View>

          {/* ── Available Drivers ────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Available Drivers</Text>
            <Text style={styles.availableCountText}>{DRIVERS.length} available</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.driversScroll}
            contentContainerStyle={styles.driversScrollContent}
          >
            {DRIVERS.map((driver) => (
              <DriverCardItem key={driver.id} driver={driver} />
            ))}
          </ScrollView>

          {/* ── AI Planning Criteria ─────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.aiHeaderRow}>
              <Text style={styles.cardTitle}>AI Planning Criteria</Text>
              <View style={styles.aiIconBox}>
                <SparklesIcon size={20} color={ORANGE} />
              </View>
            </View>
            {PLANNING_CRITERIA.map((criteria, i) => (
              <View key={criteria} style={[styles.criteriaRow, i === PLANNING_CRITERIA.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.criteriaCheck}>
                  <CheckboxIcon size={11} color={ORANGE} />
                </View>
                <Text style={styles.criteriaText}>{criteria}</Text>
              </View>
            ))}
            <Text style={styles.aiNoteText}>
              OpenAI will suggest a plan. Warehouse must review and approve it before sending.
            </Text>
            <Pressable style={styles.generateBtn} onPress={handleGeneratePlan}>
              <SparklesIcon size={16} color={WHITE} />
              <Text style={styles.generateBtnText}>Generate Plan</Text>
            </Pressable>
          </View>

          {planGenerated && (
            <>
              {/* ── Suggested Assignment Plan ──────────────────────────────── */}
              <Text style={styles.sectionLabel}>Suggested Assignment Plan</Text>
              <View style={styles.card}>
                {SUGGESTED_PLAN.map((row, i) => (
                  <SuggestedPlanRow
                    key={row.id}
                    row={row}
                    isLast={i === SUGGESTED_PLAN.length - 1}
                    onAction={handleRowAction}
                  />
                ))}
                <Pressable style={styles.addManualBtn} onPress={handleAddManual}>
                  <Text style={styles.addManualBtnText}>+ Add Manual Assignment</Text>
                </Pressable>
              </View>

              {/* ── Plan Review ────────────────────────────────────────────── */}
              <View style={[styles.card, styles.warningCard]}>
                <View style={styles.warningHeaderRow}>
                  <WarningIcon size={18} color={AMBER} />
                  <Text style={styles.warningTitle}>Plan Review</Text>
                </View>
                {PLAN_WARNINGS.map((warning) => (
                  <View key={warning} style={styles.warningRow}>
                    <View style={styles.warningDot} />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>

              {/* ── Ready to send assignments ─────────────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Ready to send assignments?</Text>
                <View style={styles.readySummaryBlock}>
                  <ReadySummaryRow label="Drivers assigned" value={READY_SUMMARY.driversAssigned} />
                  <ReadySummaryRow label="ZIPs assigned" value={READY_SUMMARY.zipsAssigned} />
                  <ReadySummaryRow label="Packets assigned" value={READY_SUMMARY.packetsAssigned} />
                  <ReadySummaryRow
                    label="Unassigned packets"
                    value={READY_SUMMARY.unassignedPackets}
                    valueColor={ORANGE}
                  />
                </View>
                <View style={styles.readyActionsRow}>
                  <Pressable style={styles.regenerateBtn} onPress={handleRegenerate}>
                    <RefreshIcon size={15} color={ORANGE} />
                    <Text style={styles.regenerateBtnText}>Regenerate Plan</Text>
                  </Pressable>
                  <Pressable style={styles.sendBtn} onPress={handleSendToDrivers}>
                    <SendIcon size={15} color={WHITE} />
                    <Text style={styles.sendBtnText}>Send to Drivers</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {plansSent && (
            <>
              {/* ── Sent Assignments ──────────────────────────────────────── */}
              <Text style={styles.sectionLabel}>Sent Assignments</Text>
              <View style={styles.card}>
                {SENT_ASSIGNMENTS.map((item, i) => (
                  <SentRowItem key={item.name} item={item} isLast={i === SENT_ASSIGNMENTS.length - 1} />
                ))}
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

  // ── Today's Assignment Plan stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
    marginTop: 10,
    marginBottom: 12,
  },
  statItem: { width: "50%", gap: 4 },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    flexShrink: 1,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    marginLeft: 22,
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
  availableCountText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
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
  planRow: {
    paddingVertical: 14,
    gap: 6,
  },
  planRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planZipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
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
  planReasonText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    lineHeight: 16,
  },
  actionLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  actionLinkWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionLinkText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: ORANGE,
  },
  actionLinkDivider: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    marginHorizontal: 8,
  },
  addManualBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,101,0,0.5)",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  addManualBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },

  // ── Plan Review
  warningCard: {
    borderColor: "rgba(245,158,11,0.35)",
  },
  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AMBER,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  warningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AMBER,
    marginTop: 6,
  },
  warningText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
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
    flexDirection: "row",
    gap: 10,
  },
  regenerateBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  regenerateBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  sendBtn: {
    flex: 1.2,
    flexDirection: "row",
    gap: 7,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Sent Assignments
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  sentRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  sentBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sentBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: GREEN,
  },
  sentTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
  },
});
