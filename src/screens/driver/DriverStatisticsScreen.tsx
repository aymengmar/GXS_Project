import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import { StatusBar } from "expo-status-bar";
import { Fragment, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const BLUE = "#3B82F6";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.35)";

// ─── mock data ─────────────────────────────────────────────────────────────────
const PERIODS = ["Today", "Week", "Month", "Custom"] as const;
type Period = (typeof PERIODS)[number];

const STATS = {
  delivered: "128",
  returned: "7",
  earnings: "€115.20",
  successRate: "94.8%",
  lastUpdated: "May 20, 2025 09:30 AM",
};

const SUMMARY = {
  warehouse: "Hamburg Main Warehouse",
  zip: "22111",
  delivered: "128",
  returned: "7",
  earnings: "€115.20",
  driverType: "Own Car Driver",
};

const CHART_POINTS = [
  { label: "08:00", delivered: 20, returned: 0 },
  { label: "10:00", delivered: 35, returned: 2 },
  { label: "12:00", delivered: 48, returned: 3 },
  { label: "14:00", delivered: 72, returned: 4 },
  { label: "16:00", delivered: 98, returned: 5 },
  { label: "18:00", delivered: 128, returned: 7 },
];
const CHART_MAX = 150;
const CHART_Y_TICKS = [0, 50, 100, 150];

// ─── SVG icons ─────────────────────────────────────────────────────────────────
function ChevronLeftIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
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

function EuroIcon({ size = 22, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 7a7 7 0 1 0 0 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3" y1="10" x2="14" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="3" y1="14" x2="12" y2="14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function TargetIcon({ size = 22, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.8} />
      <Circle cx="12" cy="12" r="1.4" fill={color} />
    </Svg>
  );
}

function BarChartIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="20" x2="6" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="18" y1="20" x2="18" y2="14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 1 1-2.64-6.36" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="21 3 21 9 15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CarIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="11" width="18" height="6" rx="1.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
      <Circle cx="16.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
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

function InfoIcon({ size = 18, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── chart geometry ─────────────────────────────────────────────────────────
const CHART_W = 300;
const CHART_H = 210;
const PLOT_LEFT = 30;
const PLOT_RIGHT = 292;
const PLOT_TOP = 26;
const PLOT_BOTTOM = 160;

function xForIndex(i: number) {
  const step = (PLOT_RIGHT - PLOT_LEFT) / (CHART_POINTS.length - 1);
  return PLOT_LEFT + i * step;
}
function yForValue(value: number) {
  return PLOT_BOTTOM - (value / CHART_MAX) * (PLOT_BOTTOM - PLOT_TOP);
}

function PacketLineChart() {
  const deliveredPoints = CHART_POINTS.map((p, i) => ({
    x: xForIndex(i),
    y: yForValue(p.delivered),
  }));
  const returnedPoints = CHART_POINTS.map((p, i) => ({
    x: xForIndex(i),
    y: yForValue(p.returned),
  }));

  const deliveredLine = deliveredPoints
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  const returnedLine = returnedPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${deliveredPoints[0].x},${PLOT_BOTTOM} L${deliveredLine
    .split(" ")
    .join(" L")} L${deliveredPoints[deliveredPoints.length - 1].x},${PLOT_BOTTOM} Z`;

  return (
    <Svg
      width="100%"
      height={220}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      preserveAspectRatio="none"
    >
      {/* gridlines + y-axis labels */}
      {CHART_Y_TICKS.map((tick) => {
        const y = yForValue(tick);
        return (
          <Fragment key={tick}>
            <Line
              x1={PLOT_LEFT}
              y1={y}
              x2={PLOT_RIGHT}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <SvgText
              x={PLOT_LEFT - 8}
              y={y + 3}
              fontSize={10}
              fill={MUTED}
              textAnchor="end"
            >
              {tick}
            </SvgText>
          </Fragment>
        );
      })}

      {/* delivered area fill */}
      <Path d={areaPath} fill="rgba(34,197,94,0.14)" stroke="none" />

      {/* delivered line */}
      <Polyline
        points={deliveredLine}
        fill="none"
        stroke={GREEN}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* returned line */}
      <Polyline
        points={returnedLine}
        fill="none"
        stroke={RED}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {CHART_POINTS.map((p, i) => (
        <Fragment key={p.label}>
          <Circle cx={deliveredPoints[i].x} cy={deliveredPoints[i].y} r={4} fill={GREEN} />
          <SvgText
            x={deliveredPoints[i].x}
            y={deliveredPoints[i].y - 10}
            fontSize={11}
            fontWeight="700"
            fill={GREEN}
            textAnchor="middle"
          >
            {p.delivered}
          </SvgText>

          <Circle cx={returnedPoints[i].x} cy={returnedPoints[i].y} r={3.5} fill={RED} />
          <SvgText
            x={returnedPoints[i].x}
            y={returnedPoints[i].y - 9}
            fontSize={10}
            fontWeight="700"
            fill={RED}
            textAnchor="middle"
          >
            {p.returned}
          </SvgText>

          <SvgText
            x={xForIndex(i)}
            y={PLOT_BOTTOM + 22}
            fontSize={10}
            fill={MUTED}
            textAnchor="middle"
          >
            {p.label}
          </SvgText>
        </Fragment>
      ))}
    </Svg>
  );
}

// ─── small building blocks ──────────────────────────────────────────────────
function StatCard({
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
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
      <Text style={[styles.statTrend, { color: trendColor }]}>{trend}</Text>
    </View>
  );
}

function SummaryItem({
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
    <View style={styles.summaryItem}>
      <View style={styles.summaryIconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── props ─────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

// ─── main component ────────────────────────────────────────────────────────────
export default function DriverStatisticsScreen({ onNavigate }: Props) {
  const [activePeriod, setActivePeriod] = useState<Period>("Today");

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => onNavigate("dashboard")}
              hitSlop={8}
            >
              <ChevronLeftIcon size={18} color={WHITE} />
            </Pressable>

            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>My performance</Text>
              <Text style={styles.headerTitle}>Statistics</Text>
              <Text style={styles.headerSub}>
                Track your packet summary and earnings
              </Text>
            </View>

            <View>
              <View style={styles.avatarRing}>
                <Image
                  source={require("@/assets/images/avatars/driver1.jpg")}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {/* ── Period filter ────────────────────────────────────────────────── */}
          <View style={styles.periodRow}>
            {PERIODS.map((period) => {
              const active = period === activePeriod;
              return (
                <Pressable
                  key={period}
                  onPress={() => setActivePeriod(period)}
                  style={[styles.periodPill, active && styles.periodPillActive]}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      active && styles.periodPillTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Last updated row ─────────────────────────────────────────────── */}
          <View style={styles.updatedRow}>
            <Text style={styles.updatedText}>
              Updated: {STATS.lastUpdated}
            </Text>
            <Pressable hitSlop={8}>
              <RefreshIcon size={16} color={ORANGE} />
            </Pressable>
          </View>

          {/* ── Main stat cards ──────────────────────────────────────────────── */}
          <View style={styles.statGrid}>
            <StatCard
              icon={<PackageIcon size={22} color={GREEN} />}
              value={STATS.delivered}
              label="Delivered Packets"
              subtitle="Today"
              trend="+12.6% vs yesterday"
              trendColor={GREEN}
            />
            <StatCard
              icon={<ReturnIcon size={22} color={RED} />}
              value={STATS.returned}
              label="Returned Packets"
              subtitle="Today"
              trend="-2.1% vs yesterday"
              trendColor={RED}
            />
            <StatCard
              icon={<EuroIcon size={22} color={AMBER} />}
              value={STATS.earnings}
              label="Estimated Earnings"
              subtitle="Today"
              trend="Based on packet rate"
              trendColor={AMBER}
            />
            <StatCard
              icon={<TargetIcon size={22} color={BLUE} />}
              value={STATS.successRate}
              label="Success Rate"
              subtitle="Today"
              trend="Delivered vs assigned"
              trendColor={GREEN}
            />
          </View>

          {/* ── Packet Overview card ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.overviewHeaderRow}>
              <View style={styles.cardTitleRow}>
                <BarChartIcon size={20} color={ORANGE} />
                <Text style={styles.cardTitle}>Packet Overview</Text>
              </View>
              <View style={styles.dailyDropdown}>
                <Text style={styles.dailyDropdownText}>Daily</Text>
                <ChevronDownIcon size={12} color={ORANGE} />
              </View>
            </View>

            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
                <Text style={styles.legendText}>Delivered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: RED }]} />
                <Text style={styles.legendText}>Returned</Text>
              </View>
            </View>

            <PacketLineChart />
          </View>

          {/* ── Today's Summary card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <CalendarIcon size={20} color={ORANGE} />
              <Text style={styles.cardTitle}>Today's Summary</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCol}>
                <SummaryItem
                  icon={<WarehouseIcon size={16} color={ORANGE} />}
                  label="Assigned Warehouse"
                  value={SUMMARY.warehouse}
                />
                <SummaryItem
                  icon={<PackageIcon size={16} color={GREEN} />}
                  label="Delivered Packets"
                  value={SUMMARY.delivered}
                  valueColor={GREEN}
                />
                <SummaryItem
                  icon={<EuroIcon size={16} color={AMBER} />}
                  label="Estimated Earnings"
                  value={SUMMARY.earnings}
                  valueColor={AMBER}
                />
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <SummaryItem
                  icon={<MapPinIcon size={16} color={ORANGE} />}
                  label="Assigned ZIP Code"
                  value={SUMMARY.zip}
                />
                <SummaryItem
                  icon={<ReturnIcon size={16} color={RED} />}
                  label="Returned Packets"
                  value={SUMMARY.returned}
                  valueColor={RED}
                />
                <SummaryItem
                  icon={<CarIcon size={16} color={ORANGE} />}
                  label="Driver Type"
                  value={SUMMARY.driverType}
                />
              </View>
            </View>
          </View>

          {/* ── Data Source note card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <InfoIcon size={18} color={BLUE} />
              <Text style={styles.cardTitle}>Data Source</Text>
            </View>
            <Text style={styles.noteText}>
              Packet totals and earnings are calculated from warehouse or
              external delivery data.{" "}
              <Text style={styles.noteHighlight}>
                This app does not scan packets.
              </Text>
            </Text>
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
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    lineHeight: 34,
    marginTop: 2,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: BORDER,
    padding: 2,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
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

  // ── Period filter
  periodRow: {
    flexDirection: "row",
    backgroundColor: INNER,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  periodPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodPillActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.10)",
  },
  periodPillText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: MUTED,
  },
  periodPillTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },

  // ── Last updated
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  updatedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ── Stat grid
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 3,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    marginTop: 6,
  },
  statLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: DIM,
  },
  statSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  statTrend: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    marginTop: 2,
  },

  // ── Packet Overview
  overviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  dailyDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dailyDropdownText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
  },
  chartLegendRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: DIM,
  },

  // ── Today's Summary
  summaryGrid: {
    flexDirection: "row",
    gap: 4,
  },
  summaryCol: {
    flex: 1,
    gap: 14,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: BORDER,
    marginHorizontal: 10,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    marginTop: 2,
  },

  // ── Data Source note
  noteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    marginTop: 12,
  },
  noteHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
});
