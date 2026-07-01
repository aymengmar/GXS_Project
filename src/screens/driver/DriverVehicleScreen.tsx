import type { DriverTab } from "@/components/driver/DriverBottomTabs";
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
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.35)";

// ─── mock data ─────────────────────────────────────────────────────────────────
const VEHICLE = {
  warehouse: "Hamburg Main Warehouse",
  currentMonth: "July 2026",
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

function CarFrontIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="11" width="18" height="6" rx="1.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
      <Circle cx="16.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function IdCardIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={1.6} />
      <Circle cx="8" cy="12" r="2.2" stroke={color} strokeWidth={1.4} />
      <Line x1="13" y1="9.5" x2="19" y2="9.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="13" y1="14.5" x2="17" y2="14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

function DocIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

function BarChartIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="20" x2="6" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="18" y1="20" x2="18" y2="14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function FuelIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="10" height="18" rx="1.5" stroke={color} strokeWidth={1.6} />
      <Line x1="6" y1="8" x2="10" y2="8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M13 8h3l3 3v6a1.5 1.5 0 0 1-3 0v-2a1.5 1.5 0 0 0-1.5-1.5H15" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ParkingIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.6} />
      <Path d="M9 16V8h3.5a2.5 2.5 0 0 1 0 5H9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OtherCostsIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.6" stroke={color} strokeWidth={1.6} fill={color} />
      <Circle cx="12" cy="12" r="1.6" stroke={color} strokeWidth={1.6} fill={color} />
      <Circle cx="19" cy="12" r="1.6" stroke={color} strokeWidth={1.6} fill={color} />
    </Svg>
  );
}

// ─── small building blocks ──────────────────────────────────────────────────
function IconBox({ children }: { children: React.ReactNode }) {
  return <View style={styles.iconBox}>{children}</View>;
}

function AssignmentField({
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
    <View style={styles.assignmentField}>
      <IconBox>{icon}</IconBox>
      <View style={styles.assignmentFieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function InvoiceStatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.invoiceStatBox}>
      <IconBox>{icon}</IconBox>
      <Text style={styles.invoiceStatLabel}>{label}</Text>
      <Text style={styles.invoiceStatValue}>{value}</Text>
    </View>
  );
}

function CostRow({
  icon,
  label,
  value,
  valueColor = MUTED,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.costRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.costRowLeft}>
        {icon}
        <Text style={styles.costLabel}>{label}</Text>
      </View>
      <Text style={[styles.costValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── props ─────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

export default function DriverVehicleScreen({ onNavigate: _onNavigate }: Props) {
  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>My vehicle</Text>
              <Text style={styles.headerTitle}>Vehicle</Text>
              <Text style={styles.headerSub}>
                Your company vehicle and invoice area
              </Text>
            </View>
            <View>
              <View style={styles.profileBtn}>
                <PersonIcon size={22} color={WHITE} />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {/* ── Company Vehicle card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Company Vehicle</Text>
              <View style={styles.activeBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.vehicleImageBox}>
              <Image
                source={images.companyVehicle}
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.driverTypeBadge}>
              <PersonIcon size={16} color={ORANGE} />
              <Text style={styles.driverTypeBadgeText}>Company Car Driver</Text>
            </View>

            <Text style={styles.companyVehicleText}>
              You are registered as a company-car driver.
            </Text>
            <Text style={styles.companyVehicleDesc}>
              Company car details and invoice information will appear here.
            </Text>
          </View>

          {/* ── Vehicle Assignment card ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <CarFrontIcon size={20} color={ORANGE} />
              <Text style={styles.cardTitle}>Vehicle Assignment</Text>
            </View>

            <View style={styles.assignmentGrid}>
              <View style={styles.assignmentCol}>
                <AssignmentField
                  icon={<CarFrontIcon size={16} color={ORANGE} />}
                  label="Assigned Vehicle"
                  value="Company vehicle details will appear here."
                />
                <AssignmentField
                  icon={<ClockIcon size={16} color={ORANGE} />}
                  label="Vehicle Status"
                  value="Pending assignment"
                  valueColor={ORANGE}
                />
              </View>
              <View style={styles.assignmentCol}>
                <AssignmentField
                  icon={<IdCardIcon size={16} color={ORANGE} />}
                  label="Plate Number"
                  value="Not assigned yet"
                />
                <AssignmentField
                  icon={<WarehouseIcon size={16} color={ORANGE} />}
                  label="Assigned Warehouse"
                  value={VEHICLE.warehouse}
                />
              </View>
            </View>
          </View>

          {/* ── Company Car Invoices card ────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <DocIcon size={20} color={ORANGE} />
              <Text style={styles.cardTitle}>Company Car Invoices</Text>
            </View>
            <Text style={styles.invoicesDesc}>
              Upload fuel, parking, repair, or other company car invoices when
              required.
            </Text>

            <View style={styles.divider} />

            <View style={styles.invoiceStatRow}>
              <InvoiceStatBox
                icon={<CalendarIcon size={18} color={ORANGE} />}
                label="Current Month"
                value={VEHICLE.currentMonth}
              />
              <InvoiceStatBox
                icon={<DocIcon size={18} color={ORANGE} />}
                label="Submitted Invoices"
                value="0 submitted"
              />
              <InvoiceStatBox
                icon={<InfoIcon size={18} color={ORANGE} />}
                label="Review Status"
                value="No invoices submitted yet"
              />
            </View>

            <Pressable style={styles.orangeBtn}>
              <UploadCloudIcon size={18} color={WHITE} />
              <Text style={styles.orangeBtnText}>Upload Invoice</Text>
            </Pressable>
          </View>

          {/* ── Monthly Cost Summary card ────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <BarChartIcon size={20} color={ORANGE} />
              <Text style={styles.cardTitle}>Monthly Cost Summary</Text>
            </View>

            <View style={styles.monthRow}>
              <IconBox>
                <CalendarIcon size={18} color={ORANGE} />
              </IconBox>
              <View>
                <Text style={styles.fieldLabel}>Month</Text>
                <Text style={styles.fieldValue}>{VEHICLE.currentMonth}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <CostRow
              icon={<FuelIcon size={16} color={ORANGE} />}
              label="Fuel Invoices"
              value="Coming soon"
            />
            <CostRow
              icon={<ParkingIcon size={16} color={ORANGE} />}
              label="Parking Invoices"
              value="Coming soon"
            />
            <CostRow
              icon={<OtherCostsIcon size={16} color={ORANGE} />}
              label="Other Costs"
              value="Coming soon"
            />
            <CostRow
              icon={<InfoIcon size={16} color={ORANGE} />}
              label="Status"
              value="Not submitted"
              valueColor={ORANGE}
              last
            />
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },

  // ── Company Vehicle card
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  greenDot: {
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
  vehicleImageBox: {
    width: "100%",
    height: 150,
    backgroundColor: INNER,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  vehicleImage: {
    width: "85%",
    height: "85%",
  },
  driverTypeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  driverTypeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  companyVehicleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
    marginBottom: 6,
  },
  companyVehicleDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },

  // ── Vehicle Assignment card
  assignmentGrid: {
    flexDirection: "row",
    gap: 12,
  },
  assignmentCol: {
    flex: 1,
    gap: 12,
  },
  assignmentField: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  assignmentFieldText: {
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Invoices card
  invoicesDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 14,
  },
  invoiceStatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  invoiceStatBox: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  invoiceStatLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
  },
  invoiceStatValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: WHITE,
    textAlign: "center",
  },
  orangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  orangeBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ── Monthly Cost Summary card
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  costRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  costLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: DIM,
  },
  costValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
});
