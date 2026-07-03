import type { WarehouseTab } from "@/components/warehouse/WarehouseBottomTabs";
import { images } from "@/constants/images";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const WAREHOUSE = {
  name: "Hamburg Main Warehouse",
  status: "Active",
  id: "WH-2026-001",
  staff: "Warehouse User",
  location: "Billstraße 45, 20539 Hamburg",
  today: "02 July 2026",
};

const OVERVIEW = {
  driversAvailable: "5",
  totalPackets: "1,240",
  returnsYesterday: "1,200",
};

const DRIVERS: {
  initials: string;
  color: string;
  bg: string;
  name: string;
  zip: string;
  carType: string;
}[] = [
  { initials: "AK", color: ORANGE, bg: "rgba(255,101,0,0.15)", name: "Ali Kaya", zip: "20099", carType: "Company car" },
  { initials: "MO", color: BLUE, bg: "rgba(59,130,246,0.15)", name: "Mehmet Öztürk", zip: "22087", carType: "Own car" },
  { initials: "SC", color: GREEN, bg: "rgba(34,197,94,0.15)", name: "Sara Chen", zip: "20355", carType: "Own car" },
];

const ZIP_CODES: { zip: string; packets: number }[] = [
  { zip: "22111", packets: 240 },
  { zip: "22113", packets: 180 },
  { zip: "22115", packets: 150 },
  { zip: "22041", packets: 320 },
  { zip: "22043", packets: 310 },
];

const RETURNS: {
  name: string;
  packets: number;
  status: "signature" | "confirmed";
  label: string;
}[] = [
  { name: "Aymouna Gmar", packets: 5, status: "signature", label: "Signature required" },
  { name: "Ahmed Driver", packets: 3, status: "confirmed", label: "Confirmed" },
];

const DOCUMENTS_SUMMARY = { total: 4, approved: 3, pending: 1 };

// ─── SVG icons ────────────────────────────────────────────────────────────────
function ChevronRight({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PersonIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PinIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ size = 22, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 12, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── small building blocks ───────────────────────────────────────────────────
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconChip}>{icon}</View>
      <View style={styles.infoTextGroup}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function WarehouseIconBadge() {
  return (
    <View style={styles.warehouseIconBadge}>
      <Svg width="100%" height="100%" viewBox="0 0 110 110">
        <Circle cx={55} cy={55} r={52} stroke="rgba(255,101,0,0.18)" strokeWidth={1.5} />
        <Circle cx={55} cy={55} r={40} stroke="rgba(255,101,0,0.4)" strokeWidth={1.5} />
        <Circle cx={55} cy={4} r={3} fill={ORANGE} />
        <Circle cx={106} cy={55} r={3} fill={ORANGE} />
        <Circle cx={55} cy={106} r={3} fill={ORANGE} />
        <Circle cx={4} cy={55} r={3} fill={ORANGE} />
      </Svg>
      <Image
        source={images.warehouseMainIcon}
        style={styles.warehouseIconImg}
        resizeMode="contain"
      />
    </View>
  );
}

function OverviewCard({
  iconBg,
  icon,
  label,
  value,
  subtitle,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewSubtitle}>{subtitle}</Text>
    </View>
  );
}

function DriverRow({
  driver,
  isLast,
}: {
  driver: (typeof DRIVERS)[number];
  isLast: boolean;
}) {
  return (
    <View style={[styles.driverRow, !isLast && styles.rowDivider]}>
      <View style={[styles.driverAvatar, { backgroundColor: driver.bg }]}>
        <Text style={[styles.driverInitials, { color: driver.color }]}>{driver.initials}</Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverMeta}>
          Home ZIP {driver.zip} · {driver.carType}
        </Text>
      </View>
      <View style={styles.readyBadge}>
        <Text style={styles.readyBadgeText}>Ready</Text>
      </View>
      <ChevronRight size={16} color={ORANGE} />
    </View>
  );
}

function ZipCard({ zip, packets }: { zip: string; packets: number }) {
  return (
    <View style={styles.zipCard}>
      <View style={styles.zipDotRow}>
        <View style={styles.zipDot} />
        <Text style={styles.zipNumber}>{zip}</Text>
      </View>
      <Text style={styles.zipPackets}>{packets} packets</Text>
    </View>
  );
}

function ReturnRow({
  item,
  isLast,
}: {
  item: (typeof RETURNS)[number];
  isLast: boolean;
}) {
  const isSignature = item.status === "signature";
  const statusColor = isSignature ? AMBER : GREEN;
  return (
    <View style={[styles.returnRow, !isLast && styles.rowDivider]}>
      <View style={styles.returnAvatar}>
        <PersonIcon size={16} color={ORANGE} />
      </View>
      <View style={styles.returnInfo}>
        <Text style={styles.returnName}>{item.name}</Text>
        <Text style={styles.returnMeta}>
          Returned: <Text style={styles.returnMetaValue}>{item.packets} packets</Text>
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: isSignature ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)" }]}>
        {isSignature ? <ClockIcon color={statusColor} /> : <CheckCircleIcon color={statusColor} />}
        <Text style={[styles.statusPillText, { color: statusColor }]}>{item.label}</Text>
      </View>
    </View>
  );
}

// ─── props ────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate?: (tab: WarehouseTab) => void;
}

export default function WarehouseDashboardScreen({ onNavigate }: Props) {
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
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Manage today&apos;s packet count, returns, and assignments.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Warehouse info card ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.warehouseTopRow}>
              <WarehouseIconBadge />
              <View style={styles.warehouseTitleGroup}>
                <View style={styles.warehouseTitleRow}>
                  <Text style={styles.warehouseOverviewTitle}>Warehouse Overview</Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.activeBadgeText}>{WAREHOUSE.status}</Text>
                  </View>
                </View>
                <Text style={styles.warehouseSubtitle}>{WAREHOUSE.name}</Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <InfoItem icon={<ClipboardIcon />} label="Warehouse ID" value={WAREHOUSE.id} />
              <InfoItem icon={<PinIcon />} label="Location" value={WAREHOUSE.location} />
              <InfoItem icon={<PersonIcon />} label="Staff" value={WAREHOUSE.staff} />
              <InfoItem icon={<CalendarIcon />} label="Today" value={WAREHOUSE.today} />
            </View>
          </View>

          {/* ── Today Overview ───────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Today Overview</Text>
          <View style={styles.overviewRow}>
            <OverviewCard
              iconBg="rgba(59,130,246,0.15)"
              icon={<PinIcon size={20} color={BLUE} />}
              label="Drivers available"
              value={OVERVIEW.driversAvailable}
              subtitle="Today"
            />
            <OverviewCard
              iconBg="rgba(34,197,94,0.15)"
              icon={<BoxIcon size={20} color={GREEN} />}
              label="Total Packets"
              value={OVERVIEW.totalPackets}
              subtitle="Counted today"
            />
            <OverviewCard
              iconBg="rgba(255,101,0,0.15)"
              icon={<RefreshIcon size={20} color={ORANGE} />}
              label="Return yesterday"
              value={OVERVIEW.returnsYesterday}
              subtitle="From yesterday"
            />
          </View>

          {/* ── Drivers available ────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Drivers available</Text>
          <View style={styles.card}>
            {DRIVERS.map((driver, i) => (
              <DriverRow key={driver.name} driver={driver} isLast={i === DRIVERS.length - 1} />
            ))}
          </View>

          {/* ── Driver's ZIP Code ────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Driver’s ZIP Code</Text>
            <Pressable
              style={styles.outlinePill}
              onPress={() => onNavigate?.("zipCount")}
              hitSlop={6}
            >
              <Text style={styles.outlinePillText}>View all</Text>
              <ChevronRight size={13} color={ORANGE} />
            </Pressable>
          </View>
          <View style={styles.zipGrid}>
            {ZIP_CODES.map((z) => (
              <ZipCard key={z.zip} zip={z.zip} packets={z.packets} />
            ))}
          </View>

          {/* ── Returned Packets ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Returned Packets</Text>
          <View style={styles.card}>
            <View style={styles.returnsHeaderRow}>
              <View style={styles.returnsHeaderIcon}>
                <RefreshIcon size={16} color={RED} />
              </View>
              <Text style={styles.returnsHeaderText}>Returns waiting for validation</Text>
            </View>
            {RETURNS.map((item, i) => (
              <ReturnRow key={item.name} item={item} isLast={i === RETURNS.length - 1} />
            ))}
            <Pressable
              style={styles.openReturnsBtn}
              onPress={() => onNavigate?.("returns")}
            >
              <Text style={styles.outlinePillText}>Open Returns</Text>
              <ChevronRight size={14} color={ORANGE} />
            </Pressable>
          </View>

          {/* ── Warehouse Documents ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.docsHeaderRow}>
              <DocumentIcon />
              <Text style={styles.docsTitle}>Warehouse Documents</Text>
            </View>
            <Text style={styles.docsText}>
              View your warehouse documents and review status.
            </Text>
            <View style={styles.docsFooterRow}>
              <Text style={styles.docsStatus}>
                Documents: {DOCUMENTS_SUMMARY.total} total ·{" "}
                <Text style={{ color: GREEN }}>{DOCUMENTS_SUMMARY.approved} approved</Text> ·{" "}
                <Text style={{ color: AMBER }}>{DOCUMENTS_SUMMARY.pending} pending</Text>
              </Text>
              <Pressable
                style={styles.outlinePill}
                onPress={() => onNavigate?.("documents")}
              >
                <Text style={styles.outlinePillText}>View Documents</Text>
                <ChevronRight size={13} color={ORANGE} />
              </Pressable>
            </View>
          </View>
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

  outlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlinePillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },

  // ── Warehouse info card
  warehouseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  warehouseIconBadge: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  warehouseIconImg: {
    position: "absolute",
    width: 38,
    height: 38,
  },
  warehouseTitleGroup: { flex: 1, gap: 4 },
  warehouseTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  warehouseOverviewTitle: {
    flexShrink: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  warehouseSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    marginBottom: 8,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREEN,
  },
  activeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
  },
  infoItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 10,
  },
  infoIconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTextGroup: { flex: 1 },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },
  infoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    marginTop: 1,
  },

  // ── Today overview
  overviewRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 4,
  },
  overviewIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  overviewLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: DIM,
  },
  overviewValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  overviewSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9.5,
    color: MUTED,
  },

  // ── Drivers available
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  driverMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  readyBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: GREEN,
  },

  // ── ZIP cards
  zipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 18,
  },
  zipCard: {
    width: "31%",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  zipDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ORANGE,
  },
  zipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  zipPackets: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },

  // ── Returned packets
  returnsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  returnsHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  returnsHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  returnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  returnAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  returnInfo: { flex: 1 },
  returnName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  returnMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  returnMetaValue: {
    color: WHITE,
    fontFamily: "Poppins_500Medium",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },
  openReturnsBtn: {
    flexDirection: "row",
    alignSelf: "flex-end",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },

  // ── Warehouse documents
  docsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  docsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  docsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
    marginBottom: 12,
  },
  docsFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  docsStatus: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 11.5,
    color: DIM,
    flexShrink: 1,
  },
});
