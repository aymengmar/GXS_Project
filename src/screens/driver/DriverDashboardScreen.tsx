import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import { images } from "@/constants/images";
import { sessionStore } from "@/store/sessionStore";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

// ─── mock data ─────────────────────────────────────────────────────────────────
const MOCK = {
  name: "John Doe",
  externalId: "DRV-001",
  status: "Active",
  carType: "Own Car Driver",
  phone: "+49 123 456 7890",
  email: "john.doe@email.com",
  warehouse: "Hamburg Main Warehouse",
  city: "Hamburg, Germany",
  docs: { total: 12, approved: 8, pending: 3, rejected: 1 },
  assignment: {
    status: "Assigned",
    warehouse: "Hamburg Main Warehouse",
    startTime: "08:30 AM",
    date: "May 20, 2025",
  },
  vehicle: {
    name: "Toyota Corolla",
    plate: "B-AH-2026",
    insurance: "Allianz",
  },
  stats: {
    delivered: "128",
    returned: "7",
  },
};

// ─── SVG icons ─────────────────────────────────────────────────────────────────

function PersonIcon({ size = 22, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PhoneIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocIconBlue({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function DocIconHeader({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 22, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 22, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ size = 22, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CarIcon({ size = 20, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="11" width="18" height="6" rx="1.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
      <Circle cx="16.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function BarChartIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="20" x2="6" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="18" y1="20" x2="18" y2="14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PackageIcon({ size = 22, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReturnIcon({ size = 22, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 3-6.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="3 4 3 9 8 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CopyIcon({ size = 14, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

// Assignment clipboard + packages illustration
function AssignmentIllustration() {
  return (
    <Svg width={68} height={72} viewBox="0 0 68 72" fill="none">
      {/* Clipboard board */}
      <Rect x="8" y="10" width="38" height="50" rx="5" fill="#0D1A2E" stroke="rgba(255,255,255,0.10)" strokeWidth="1.2" />
      {/* Clip at top */}
      <Rect x="20" y="6" width="14" height="8" rx="3" fill="#111E33" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Lines on clipboard */}
      <Line x1="15" y1="24" x2="38" y2="24" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="15" y1="31" x2="36" y2="31" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="15" y1="38" x2="32" y2="38" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Check marks */}
      <Polyline points="11,24 13,26.5 17,21.5" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="11,31 13,33.5 17,28.5" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Package box */}
      <Rect x="36" y="42" width="26" height="22" rx="4" fill="#1A3050" stroke={ORANGE} strokeWidth="1.2" />
      {/* Package divider */}
      <Line x1="49" y1="42" x2="49" y2="64" stroke={ORANGE} strokeWidth="1" strokeLinecap="round" />
      <Line x1="42" y1="50" x2="56" y2="50" stroke={ORANGE} strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

// ─── DocStatBox ────────────────────────────────────────────────────────────────
function DocStatBox({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <View style={styles.docBox}>
      {icon}
      <Text style={styles.docCount}>{count}</Text>
      <Text style={styles.docLabel}>{label}</Text>
    </View>
  );
}

// ─── StatPreviewBox ────────────────────────────────────────────────────────────
function StatPreviewBox({
  icon,
  value,
  label,
  subtitle,
  trend,
  trendColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  subtitle: string;
  trend: string;
  trendColor: string;
}) {
  return (
    <View style={styles.statPreviewBox}>
      {icon}
      <Text style={styles.statPreviewValue}>{value}</Text>
      <Text style={styles.statPreviewLabel}>{label}</Text>
      <Text style={styles.statPreviewSubtitle}>{subtitle}</Text>
      <Text style={[styles.statPreviewTrend, { color: trendColor }]}>
        {trend}
      </Text>
    </View>
  );
}

// ─── props ─────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

// ─── main component ────────────────────────────────────────────────────────────
export default function DriverDashboardScreen({ onNavigate }: Props) {
  const session = sessionStore.get();
  const driverName =
    session?.kind === "driver" ? session.full_name : MOCK.name;

  function handleCopyId() {
    Alert.alert("Copied", `Driver ID: ${MOCK.externalId}`);
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeSmall}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{driverName} 👋</Text>
              <Text style={styles.welcomeSub}>
                Stay safe and have a productive day!
              </Text>
            </View>
            <View>
              <View style={styles.profileBtn}>
                <PersonIcon size={22} color={WHITE} />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {/* ── Driver Identity Card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.identityRow}>
              {/* Avatar with orange ring */}
              <View style={styles.avatarRing}>
                <Image
                  source={require("@/assets/images/avatars/driver1.jpg")}
                  style={styles.avatar}
                />
                <View style={styles.onlineDot} />
              </View>

              {/* Name + ID */}
              <View style={styles.identityCenter}>
                <Text style={styles.identityName}>{MOCK.name}</Text>
                <Text style={styles.idLabel}>External Driver ID</Text>
                <View style={styles.idRow}>
                  <Text style={styles.idValue}>{MOCK.externalId}</Text>
                  <Pressable onPress={handleCopyId} hitSlop={8}>
                    <CopyIcon size={14} color={MUTED} />
                  </Pressable>
                </View>
              </View>

              {/* Active badge + car type */}
              <View style={styles.identityRight}>
                <View style={styles.activeBadge}>
                  <View style={[styles.statusDot, { backgroundColor: GREEN }]} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
                <View style={styles.carTypeBox}>
                  <View style={styles.carIconCircle}>
                    <CarIcon size={18} color={WHITE} />
                  </View>
                  <Text style={styles.carTypeText}>Own Car Driver</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Statistics Preview Card ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <BarChartIcon size={18} color={ORANGE} />
                <Text style={styles.sectionTitle}>Statistics</Text>
              </View>
              <Pressable
                onPress={() => onNavigate("statistic")}
                style={styles.linkBtn}
                hitSlop={6}
              >
                <Text style={styles.linkText}>View Statistics</Text>
                <ChevronRight size={13} color={ORANGE} />
              </Pressable>
            </View>
            <View style={styles.statPreviewGrid}>
              <StatPreviewBox
                icon={<PackageIcon size={22} color={GREEN} />}
                value={MOCK.stats.delivered}
                label="Delivered Packets"
                subtitle="Today"
                trend="+12.6% vs yesterday"
                trendColor={GREEN}
              />
              <StatPreviewBox
                icon={<ReturnIcon size={22} color={RED} />}
                value={MOCK.stats.returned}
                label="Returned Packets"
                subtitle="Today"
                trend="-2.1% vs yesterday"
                trendColor={RED}
              />
            </View>
          </View>

          {/* ── Contact & Warehouse Card ─────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <PhoneIcon size={18} color={ORANGE} />
              <Text style={styles.sectionTitle}>Contact & Warehouse</Text>
            </View>
            <View style={styles.contactGrid}>
              {/* Left column: phone + email */}
              <View style={styles.contactLeftCol}>
                <View style={styles.contactItem}>
                  <PhoneIcon size={14} color={ORANGE} />
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{MOCK.phone}</Text>
                  </View>
                </View>
                <View style={styles.contactDivider} />
                <View style={styles.contactItem}>
                  <MailIcon size={14} color={ORANGE} />
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{MOCK.email}</Text>
                  </View>
                </View>
              </View>

              {/* Vertical divider */}
              <View style={styles.vertDivider} />

              {/* Right column: warehouse */}
              <View style={styles.contactRightCol}>
                <WarehouseIcon size={18} color={ORANGE} />
                <Text style={styles.contactLabel}>Assigned Warehouse</Text>
                <Text style={styles.warehouseName}>{MOCK.warehouse}</Text>
                <Text style={styles.contactLabel}>{MOCK.city}</Text>
              </View>
            </View>
          </View>

          {/* ── Document Summary Card ────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <DocIconHeader size={18} color={ORANGE} />
                <Text style={styles.sectionTitle}>Document Summary</Text>
              </View>
              <Pressable
                onPress={() => onNavigate("documents")}
                style={styles.linkBtn}
                hitSlop={6}
              >
                <Text style={styles.linkText}>View Documents</Text>
                <ChevronRight size={13} color={ORANGE} />
              </Pressable>
            </View>
            <View style={styles.docBoxRow}>
              <DocStatBox
                icon={<DocIconBlue size={24} />}
                count={MOCK.docs.total}
                label="Total Documents"
              />
              <DocStatBox
                icon={<CheckCircleIcon size={24} color={GREEN} />}
                count={MOCK.docs.approved}
                label="Approved"
              />
              <DocStatBox
                icon={<ClockIcon size={24} color={AMBER} />}
                count={MOCK.docs.pending}
                label="Pending"
              />
              <DocStatBox
                icon={<XCircleIcon size={24} color={RED} />}
                count={MOCK.docs.rejected}
                label="Rejected"
              />
            </View>
          </View>

          {/* ── Today's Assignment Card ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <CalendarIcon size={18} color={ORANGE} />
                <Text style={styles.sectionTitle}>Today's Assignment</Text>
              </View>
              <View style={styles.assignedBadge}>
                <View style={[styles.statusDot, { backgroundColor: GREEN }]} />
                <Text style={styles.assignedText}>Assigned</Text>
              </View>
            </View>

            <View style={styles.assignmentContent}>
              <View style={styles.assignmentLeft}>
                <View style={styles.assignmentWarehouseRow}>
                  <WarehouseIcon size={16} color={DIM} />
                  <Text style={styles.assignmentWarehouseText}>
                    {MOCK.assignment.warehouse}
                  </Text>
                </View>
                <View style={styles.assignmentInfoRow}>
                  <View style={styles.assignmentInfoItem}>
                    <ClockIcon size={14} color={MUTED} />
                    <View>
                      <Text style={styles.infoLabel}>Start Time</Text>
                      <Text style={styles.infoValue}>
                        {MOCK.assignment.startTime}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.assignmentInfoItem}>
                    <CalendarIcon size={14} color={MUTED} />
                    <View>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{MOCK.assignment.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <AssignmentIllustration />
            </View>

            <Pressable
              style={styles.orangeBtn}
              onPress={() => onNavigate("assignment")}
            >
              <Text style={styles.orangeBtnText}>View Assignment</Text>
              <ChevronRight size={15} color={WHITE} />
            </Pressable>
          </View>

          {/* ── My Vehicle Card ──────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <CarIcon size={20} color={ORANGE} />
                <Text style={styles.sectionTitle}>My Vehicle</Text>
              </View>
              <Pressable
                onPress={() => onNavigate("vehicle")}
                style={styles.linkBtn}
                hitSlop={6}
              >
                <Text style={styles.linkText}>View Vehicle</Text>
                <ChevronRight size={13} color={ORANGE} />
              </Pressable>
            </View>

            <View style={styles.vehicleContent}>
              <View style={styles.vehicleImageBox}>
                <Image
                  source={images.ownVehicle}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{MOCK.vehicle.name}</Text>
                <View style={styles.vehicleRow}>
                  <View>
                    <Text style={styles.vehicleLabel}>Plate Number</Text>
                    <Text style={styles.vehicleValue}>{MOCK.vehicle.plate}</Text>
                  </View>
                  <View>
                    <Text style={styles.vehicleLabel}>Insurance Provider</Text>
                    <Text style={styles.vehicleValue}>{MOCK.vehicle.insurance}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────────
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

  // ── Header
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
  welcomeSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
  },
  welcomeName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: WHITE,
    marginTop: 1,
  },
  welcomeSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
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

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // ── Section header variants
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  linkText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
  },

  // ── Identity card
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    borderColor: ORANGE,
    padding: 3,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
  },
  onlineDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GREEN,
    borderWidth: 2.5,
    borderColor: CARD,
  },
  identityCenter: {
    flex: 1,
  },
  identityName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  idLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  idValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: ORANGE,
  },
  identityRight: {
    alignItems: "center",
    gap: 10,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },
  carTypeBox: {
    alignItems: "center",
    gap: 5,
  },
  carIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  carTypeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: MUTED,
    textAlign: "center",
    maxWidth: 62,
  },

  // ── Contact & Warehouse
  contactGrid: {
    flexDirection: "row",
    marginTop: 14,
    backgroundColor: INNER,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  contactLeftCol: {
    flex: 1,
    padding: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  contactTextGroup: {
    flex: 1,
  },
  contactDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 2,
  },
  vertDivider: {
    width: 1,
    backgroundColor: BORDER,
  },
  contactRightCol: {
    flex: 1,
    padding: 12,
    gap: 3,
    justifyContent: "center",
  },
  contactLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  contactValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: WHITE,
  },
  warehouseName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: WHITE,
    marginTop: 2,
    marginBottom: 1,
  },

  // ── Document summary
  docBoxRow: {
    flexDirection: "row",
    gap: 8,
  },
  docBox: {
    flex: 1,
    backgroundColor: INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  docCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
  },
  docLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 2,
  },

  // ── Statistics preview
  statPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statPreviewBox: {
    width: "48%",
    backgroundColor: INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 3,
  },
  statPreviewValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    marginTop: 4,
  },
  statPreviewLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: DIM,
  },
  statPreviewSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: MUTED,
  },
  statPreviewTrend: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    marginTop: 2,
  },

  // ── Assignment
  assignmentContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  assignmentLeft: {
    flex: 1,
    gap: 10,
  },
  assignmentWarehouseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  assignmentWarehouseText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
    flex: 1,
  },
  assignmentInfoRow: {
    flexDirection: "row",
    gap: 14,
  },
  assignmentInfoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  infoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  assignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  assignedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },
  orangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  orangeBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ── Vehicle
  vehicleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleImageBox: {
    width: "40%",
    height: 90,
    backgroundColor: INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  vehicleDetails: {
    flex: 1,
    gap: 6,
  },
  vehicleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  vehicleRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  vehicleLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
    marginBottom: 1,
  },
  vehicleValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: WHITE,
  },
});
