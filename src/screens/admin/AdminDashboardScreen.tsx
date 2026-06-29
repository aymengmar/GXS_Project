import AdminCustomDateModal, { DateVal, fmtDate } from "@/components/admin/AdminCustomDateModal";
import AdminPeriodSelector, { Period } from "@/components/admin/AdminPeriodSelector";
import AdminProfileDrawer from "@/components/admin/AdminProfileDrawer";
import { fetchAdminDashboardSummary, AdminDashboardSummary } from "@/api/backendClient";
import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

// ─── palette ─────────────────────────────────────────────────────────────────
const BG = "#0B1628";
const CARD_BG = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const PURPLE = "#8B5CF6";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.55)";
const MUTED = "rgba(255,255,255,0.30)";
const TAB_BG = "#0A1525";

const SW = Dimensions.get("window").width;

// ─── icon primitives ─────────────────────────────────────────────────────────

function UsersIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  const h = size * 0.55, hs = size * 0.45, bw = size * 0.7, bs = size * 0.6;
  return (
    <View style={{ width: size, height: size, justifyContent: "flex-end" }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: hs, height: hs, borderRadius: hs / 2, borderWidth: 1.5, borderColor: color, opacity: 0.5 }} />
      <View style={{ position: "absolute", left: 0, bottom: 0, width: bs, height: size * 0.38, borderTopLeftRadius: bs / 2, borderTopRightRadius: bs / 2, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, opacity: 0.5 }} />
      <View style={{ position: "absolute", right: 0, top: size * 0.05, width: h, height: h, borderRadius: h / 2, borderWidth: 1.5, borderColor: color }} />
      <View style={{ position: "absolute", right: 0, bottom: 0, width: bw, height: size * 0.42, borderTopLeftRadius: bw / 2, borderTopRightRadius: bw / 2, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0 }} />
    </View>
  );
}

function ShieldIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  const w = size * 0.82, h = size;
  return (
    <View style={{ width: w, height: h, alignItems: "center" }}>
      <View style={{ width: w, height: h * 0.82, borderWidth: 1.5, borderColor: color, borderRadius: size * 0.28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
      <View style={{ width: w * 0.55, height: h * 0.22, borderBottomLeftRadius: w * 0.28, borderBottomRightRadius: w * 0.28, borderWidth: 1.5, borderTopWidth: 0, borderColor: color, marginTop: -1 }} />
      <View style={{ position: "absolute", top: h * 0.28, left: w * 0.22, width: size * 0.14, height: size * 0.07, backgroundColor: color, borderRadius: 1, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", top: h * 0.22, left: w * 0.32, width: size * 0.26, height: size * 0.07, backgroundColor: color, borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

function BoxIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.85, height: size * 0.85, borderWidth: 1.5, borderColor: color, borderRadius: 3 }} />
      <View style={{ position: "absolute", top: size * 0.08, left: 0, right: 0, height: size * 0.24, borderBottomWidth: 1.5, borderColor: color }} />
      <View style={{ position: "absolute", top: size * 0.08, width: 1.5, height: size * 0.24, backgroundColor: color, alignSelf: "center" }} />
    </View>
  );
}

function CircleCheckIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.28, height: size * 0.14, backgroundColor: color, borderRadius: 1, transform: [{ rotate: "45deg" }, { translateX: -size * 0.05 }, { translateY: size * 0.04 }] }} />
      <View style={{ position: "absolute", width: size * 0.46, height: size * 0.14, backgroundColor: color, borderRadius: 1, transform: [{ rotate: "-50deg" }, { translateX: size * 0.08 }, { translateY: -size * 0.03 }] }} />
    </View>
  );
}

function DotsVIcon({ color = DIM }: { color?: string }) {
  return (
    <View style={{ gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
      ))}
    </View>
  );
}

function WarningIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeltaArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: 17, lineHeight: 20, marginRight: 3, fontFamily: "Poppins_700Bold" }}>
      {up ? "↑" : "↓"}
    </Text>
  );
}

// ─── mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const W = 72, H = 34;
  const linePath = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = W / (data.length - 1);
    const pts = data.map((v, i) => [i * stepX, H - ((v - min) / range) * (H - 6) - 3] as [number, number]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0} ${cpx} ${y1} ${x1} ${y1}`;
    }
    return d;
  }, [data]);
  const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id={`sg_${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#sg_${color.replace("#", "")})`} />
      <Path d={linePath} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── donut chart helpers ──────────────────────────────────────────────────────

function donutArc(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s = toRad(startDeg - 90);
  const e = toRad(endDeg - 90);
  const x1 = cx + outerR * Math.cos(s), y1 = cy + outerR * Math.sin(s);
  const x2 = cx + outerR * Math.cos(e), y2 = cy + outerR * Math.sin(e);
  const x3 = cx + innerR * Math.cos(e), y3 = cy + innerR * Math.sin(e);
  const x4 = cx + innerR * Math.cos(s), y4 = cy + innerR * Math.sin(s);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
}

const FALLBACK_DRIVER_STATUS = { active: 228, pending: 58, blocked: 32 };

type DonutSeg = { color: string; label: string; count: number; pct: string; start: number; end: number };

function computeDonutSegments(status: { active: number; pending: number; blocked: number }): DonutSeg[] {
  const total = status.active + status.pending + status.blocked;
  const raw = [
    { color: GREEN, label: "Active",         count: status.active  },
    { color: AMBER, label: "Pending",        count: status.pending },
    { color: RED,   label: "Blocked Driver", count: status.blocked },
  ];
  if (total === 0) return raw.map(s => ({ ...s, pct: "0%", start: 0, end: 0 }));
  const GAP = 3;
  const nonZero = raw.filter(s => s.count > 0).length;
  const totalSweep = 360 - GAP * nonZero;
  let current = 2;
  return raw.map(seg => {
    if (seg.count === 0) return { ...seg, pct: "0%", start: current, end: current };
    const pct = seg.count / total;
    const sweep = pct * totalSweep;
    const start = current;
    const end = start + sweep;
    current = end + GAP;
    return { ...seg, pct: `${(pct * 100).toFixed(1)}%`, start, end };
  });
}

function DriverStatusCard({ summary }: { summary: AdminDashboardSummary | null }) {
  const driverStatus = summary?.driver_status ?? FALLBACK_DRIVER_STATUS;
  const segments = computeDonutSegments(driverStatus);
  const totalInChart = driverStatus.active + driverStatus.pending + driverStatus.blocked;
  const DSIZE = 140;
  const CX = 70, CY = 70, OR = 60, IR = 41;
  const LegendItem = ({ seg }: { seg: DonutSeg }) => (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 7 }}>
      <View style={[ds.dot, { backgroundColor: seg.color }]} />
      <View style={{ alignItems: "center" }}>
        <Text style={ds.legendLabel}>{seg.label}</Text>
        <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
          <Text style={ds.legendCount}>{seg.count}</Text>
          <Text style={ds.legendPct}>{seg.pct}</Text>
        </View>
      </View>
    </View>
  );
  return (
    <View style={ds.card}>
      <View style={ds.header}>
        <Text style={ds.title}>Driver Status</Text>
        <Pressable hitSlop={8}>
          <Text style={ds.viewAll}>View all →</Text>
        </Pressable>
      </View>
      {/* donut centered on top */}
      <View style={ds.donutWrap}>
        <Svg width={DSIZE} height={DSIZE} viewBox={`0 0 ${DSIZE} ${DSIZE}`}>
          {segments.map((seg) => (
            <Path key={seg.label} d={donutArc(CX, CY, OR, IR, seg.start, seg.end)} fill={seg.color} />
          ))}
        </Svg>
        <View style={ds.donutCenter} pointerEvents="none">
          <Text style={ds.donutSub}>Total Drivers</Text>
          <Text style={ds.donutNum}>{totalInChart}</Text>
        </View>
      </View>
      {/* legend grid below donut */}
      <View style={ds.legend}>
        <View style={ds.legendRow}>
          <LegendItem seg={segments[0]} />
          <LegendItem seg={segments[1]} />
        </View>
        <View style={ds.legendRow}>
          <LegendItem seg={segments[2]} />
        </View>
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 16, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: WHITE },
  viewAll: { fontFamily: "Poppins_500Medium", fontSize: 12, color: BLUE },
  donutWrap: { alignSelf: "center", width: 140, height: 140, position: "relative", marginBottom: 16 },
  donutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  donutNum: { fontFamily: "Poppins_700Bold", fontSize: 24, color: WHITE, lineHeight: 30 },
  donutSub: { fontFamily: "Poppins_400Regular", fontSize: 10, color: DIM, textAlign: "center" },
  legend: { gap: 12, alignItems: "center" },
  legendRow: { flexDirection: "row", gap: 28, justifyContent: "center" },
  dot: { width: 9, height: 9, borderRadius: 4.5, flexShrink: 0, marginTop: 3 },
  legendLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: WHITE, lineHeight: 17 },
  legendCount: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: WHITE },
  legendPct: { fontFamily: "Poppins_400Regular", fontSize: 11, color: DIM },
});

// ─── needs attention card ─────────────────────────────────────────────────────

const ATTENTION_ITEMS = [
  { iconType: "users",   iconColor: GREEN,  label: "New registrations",   badge: "2 pending",   badgeBg: "rgba(255,101,0,0.22)",  badgeColor: ORANGE },
  { iconType: "doc",     iconColor: ORANGE, label: "Documents to review", badge: "4 documents", badgeBg: "rgba(255,101,0,0.22)",  badgeColor: ORANGE },
  { iconType: "invoice", iconColor: PURPLE, label: "Invoices to approve", badge: "7 pending",   badgeBg: "rgba(255,101,0,0.22)",  badgeColor: ORANGE },
  { iconType: "warning", iconColor: RED,    label: "High return rate",    badge: "1 flagged",   badgeBg: "rgba(239,68,68,0.22)",  badgeColor: RED    },
] as const;

function AttentionRowIcon({ type, color }: { type: string; color: string }) {
  if (type === "users")   return <UsersIcon size={18} color={color} />;
  if (type === "warning") return <WarningIcon size={18} color={color} />;
  if (type === "invoice") return <TabInvoice color={color} />;
  // doc — same document shape, different color
  return <TabInvoice color={color} />;
}

function NeedsAttentionCard() {
  return (
    <View style={na.card}>
      <View style={na.header}>
        <Text style={na.title}>Needs Attention</Text>
        <Pressable hitSlop={8}>
          <Text style={na.viewAll}>View all  ›</Text>
        </Pressable>
      </View>
      {ATTENTION_ITEMS.map((item, idx) => (
        <Pressable key={item.label} style={[na.row, idx < ATTENTION_ITEMS.length - 1 && na.rowBorder]}>
          <View style={[na.iconBox, { backgroundColor: item.iconColor + "28" }]}>
            <AttentionRowIcon type={item.iconType} color={item.iconColor} />
          </View>
          <Text style={na.label}>{item.label}</Text>
          <View style={[na.badge, { backgroundColor: item.badgeBg }]}>
            <Text style={[na.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>
          <Text style={na.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const na = StyleSheet.create({
  card:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16 },
  header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title:     { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: ORANGE },
  viewAll:   { fontFamily: "Poppins_500Medium", fontSize: 12, color: ORANGE },
  row:       { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  iconBox:   { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  label:     { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 13, color: WHITE },
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  chevron:   { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: DIM, marginLeft: 2 },
});

// ─── metric summary cards ─────────────────────────────────────────────────────

type CardDef = {
  label: string;
  value: string;
  iconType: "users" | "shield" | "box" | "check-circle";
  iconColor: string;
  iconBg: string;
  delta: string;
  deltaUp: boolean;
  spark: number[];
};

function buildCards(summary: AdminDashboardSummary | null): CardDef[] {
  return [
    { label: "Total Drivers",         value: summary ? String(summary.total_drivers)         : "—", iconType: "users",        iconColor: GREEN,  iconBg: "rgba(34,197,94,0.15)",   delta: "↑ 8.1%",  deltaUp: true,  spark: [10,14,12,18,22,26,28,33,38,42] },
    { label: "Pending Verifications", value: summary ? String(summary.pending_verifications) : "—", iconType: "shield",       iconColor: AMBER,  iconBg: "rgba(245,158,11,0.15)",  delta: "↓ 4.3%",  deltaUp: false, spark: [40,36,38,30,28,32,26,24,28,24] },
    { label: "Total Deliveries",      value: "1,248",                                               iconType: "box",          iconColor: BLUE,   iconBg: "rgba(59,130,246,0.15)",  delta: "↑ 12.5%", deltaUp: true,  spark: [200,300,380,450,550,640,720,850,980,1100] },
    { label: "Active Drivers",        value: summary ? String(summary.active_drivers)        : "—", iconType: "check-circle", iconColor: PURPLE, iconBg: "rgba(139,92,246,0.15)",  delta: "↑ 15.3%", deltaUp: true,  spark: [100,130,155,175,188,198,210,218,224,228] },
  ];
}

function CardIcon({ type, color }: { type: CardDef["iconType"]; color: string }) {
  if (type === "users") return <UsersIcon size={20} color={color} />;
  if (type === "shield") return <ShieldIcon size={20} color={color} />;
  if (type === "box") return <BoxIcon size={20} color={color} />;
  return <CircleCheckIcon size={20} color={color} />;
}

function SummaryCard(c: CardDef & { compLabel: string }) {
  const deltaColor = c.deltaUp ? GREEN : RED;
  return (
    <View style={sc.card}>
      <View style={sc.topRow}>
        <View style={[sc.iconCircle, { backgroundColor: c.iconBg }]}>
          <CardIcon type={c.iconType} color={c.iconColor} />
        </View>
        <DotsVIcon />
      </View>
      <Text style={sc.label} numberOfLines={2}>{c.label}</Text>
      <Text style={sc.value}>{c.value}</Text>
      <View style={sc.bottomRow}>
        <View style={sc.deltaBlock}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <DeltaArrow up={c.deltaUp} color={deltaColor} />
            <Text style={[sc.deltaVal, { color: deltaColor }]}>{c.delta.replace(/^[↑↓] /, "")}</Text>
          </View>
          <Text style={sc.deltaSub} numberOfLines={1} adjustsFontSizeToFit>{c.compLabel}</Text>
        </View>
        <MiniSparkline data={c.spark} color={c.iconColor} />
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { width: (SW - 52) / 2, backgroundColor: CARD_BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 3 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Poppins_400Regular", fontSize: 11, color: DIM, lineHeight: 15 },
  value: { fontFamily: "Poppins_700Bold", fontSize: 24, color: WHITE, lineHeight: 30 },
  bottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  deltaBlock: { flex: 1, minWidth: 0, marginRight: 4 },
  deltaVal: { fontFamily: "Poppins_600SemiBold", fontSize: 12, lineHeight: 16 },
  deltaSub: { fontFamily: "Poppins_400Regular", fontSize: 10, color: MUTED, lineHeight: 14 },
});

// ─── bottom tab icons ─────────────────────────────────────────────────────────

function TabHome({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabPeople({ color }: { color: string }) {
  return <UsersIcon size={18} color={color} />;
}

function TabInvoice({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 22 }}>
      <View style={{ width: 18, height: 22, borderWidth: 1.8, borderColor: color, borderRadius: 4 }} />
      <View style={{ position: "absolute", top: 5, left: 4, right: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 9, left: 4, right: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 13, left: 4, width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function TabChart({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      {[9, 16, 7, 13].map((h, i) => (
        <View key={i} style={{ width: 3, height: h, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

// ─── bottom tab bar ───────────────────────────────────────────────────────────

const TABS = [
  { label: "Dashboard", Icon: TabHome    },
  { label: "Users",     Icon: TabPeople  },
  { label: "Invoices",  Icon: TabInvoice },
  { label: "Reports",   Icon: TabChart   },
] as const;

function BottomTabs({ active = 0, onPress }: { active?: number; onPress?: (i: number) => void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(({ label, Icon }, i) => {
        const on = i === active;
        const color = on ? ORANGE : MUTED;
        return (
          <Pressable key={label} style={tb.item} hitSlop={6} onPress={() => onPress?.(i)}>
            {on && <View style={tb.activeBar} />}
            <Icon color={color} />
            <Text style={[tb.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: TAB_BG, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10, paddingBottom: 6 },
  item: { flex: 1, alignItems: "center", gap: 4, position: "relative", paddingTop: 6 },
  activeBar: { position: "absolute", top: 0, width: 28, height: 3, borderRadius: 2, backgroundColor: ORANGE },
  label: { fontFamily: "Poppins_500Medium", fontSize: 10, lineHeight: 14 },
});

// ─── notification bell ────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <View style={bell.wrap}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={bell.badge}>
        <Text style={bell.badgeText}>3</Text>
      </View>
    </View>
  );
}

const bell = StyleSheet.create({
  wrap: { width: 42, height: 42, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 21, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: WHITE, lineHeight: 13 },
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// ─── screen ───────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtShort(d: DateVal) {
  return `${MONTHS_SHORT[d.month]} ${d.day}`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const session = sessionStore.get();
  const firstName = session?.kind === "admin" ? session.user.full_name.split(" ")[0] : "Admin";
  useMemo(() => greeting(), []);

  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [period,       setPeriod]       = useState<Period>("today");
  const [showModal,    setShowModal]    = useState(false);
  const [customStart,  setCustomStart]  = useState<DateVal | null>(null);
  const [customEnd,    setCustomEnd]    = useState<DateVal | null>(null);

  const [summary,  setSummary]  = useState<AdminDashboardSummary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStore.get();
    if (s?.kind !== "admin") { setLoading(false); return; }
    fetchAdminDashboardSummary(s.access_token)
      .then(data => { setSummary(data); setLoading(false); })
      .catch(err  => { setFetchErr(String(err?.message ?? "Failed to load dashboard data.")); setLoading(false); });
  }, []);

  const cards = useMemo(() => buildCards(summary), [summary]);

  const compLabel = useMemo(() => {
    if (period === "today")  return "vs yesterday";
    if (period === "week")   return "vs previous week";
    if (period === "month")  return "vs previous month";
    if (period === "custom" && customStart && customEnd) {
      const start = new Date(customStart.year, customStart.month, customStart.day);
      const end   = new Date(customEnd.year,   customEnd.month,   customEnd.day);
      const days  = Math.round((end.getTime() - start.getTime()) / 86_400_000);
      return days === 0 ? "vs previous day" : "vs previous period";
    }
    return "vs previous period";
  }, [period, customStart, customEnd]);

  const customDateRange = useMemo(() => {
    if (!customStart || !customEnd) return null;
    const sameYear = customStart.year === customEnd.year;
    if (sameYear) return `${fmtShort(customStart)} – ${fmtShort(customEnd)}, ${customStart.year}`;
    return `${fmtDate(customStart)} – ${fmtDate(customEnd)}`;
  }, [customStart, customEnd]);

  function handlePeriodSelect(p: Period) {
    if (p === "custom") {
      setShowModal(true);
    } else {
      setPeriod(p);
    }
  }

  function handleValidate(start: DateVal, end: DateVal) {
    setCustomStart(start);
    setCustomEnd(end);
    setPeriod("custom");
    setShowModal(false);
  }

  const handleTabPress = (i: number) => {
    if (i === 1) router.replace("/admin/drivers"  as any);
    if (i === 2) router.replace("/admin/invoices" as any);
    if (i === 3) router.replace("/admin/reports"  as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            
            <Text style={s.headerSub}>Admin Dashboard</Text>
          </View>
          <View style={s.headerRight}>
            <BellIcon />
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8} style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.onlineDot} />
            </Pressable>
          </View>
        </View>

        {/* ── period selector ────────────────────────────────────── */}
        <AdminPeriodSelector
          active={period}
          onSelect={handlePeriodSelect}
          customDateRange={customDateRange}
        />

        {/* ── error banner ───────────────────────────────────────── */}
        {fetchErr && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{fetchErr}</Text>
          </View>
        )}

        {/* ── metric cards (2×2 grid) ────────────────────────────── */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        ) : (
          <>
            <View style={s.cardsGrid}>
              {cards.map((c) => (
                <SummaryCard key={c.label} {...c} compLabel={compLabel} />
              ))}
            </View>

            {/* ── driver status donut card ──────────────────────────── */}
            <DriverStatusCard summary={summary} />
          </>
        )}

        {/* ── needs attention card ────────────────────────────────── */}
        <NeedsAttentionCard />

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* ── tab bar ────────────────────────────────────────────────── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: TAB_BG }}>
        <BottomTabs active={0} onPress={handleTabPress} />
      </SafeAreaView>

      <AdminProfileDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <AdminCustomDateModal
        visible={showModal}
        initialStart={customStart}
        initialEnd={customEnd}
        onCancel={() => setShowModal(false)}
        onValidate={handleValidate}
      />
    </SafeAreaView>
  );
}

// ─── layout styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 10 },

  // header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerGXS: { fontFamily: "Poppins_700Bold", fontSize: 22, color: ORANGE, lineHeight: 28 },
  headerDelivery: { fontFamily: "Poppins_700Bold", fontSize: 22, color: WHITE, lineHeight: 28 },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: DIM, lineHeight: 17 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1E3A5F", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarLetter: { fontFamily: "Poppins_700Bold", fontSize: 18, color: WHITE },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN, borderWidth: 2, borderColor: BG },

  // hero section
  heroSection: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 14, alignItems: "flex-end" },
  heroLeft: { flex: 1, paddingRight: 8 },
  heroRight: { width: SW * 0.4, alignItems: "center", position: "relative" },
  greetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: WHITE, lineHeight: 28, marginBottom: 4 },
  greetSub: { fontFamily: "Poppins_400Regular", fontSize: 13, color: DIM, lineHeight: 20, marginBottom: 14 },

  // date badge
  dateBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, gap: 6 },
  dateText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: WHITE },
  dateCaret: { fontFamily: "Poppins_400Regular", fontSize: 10, color: DIM },

  // truck hero
  pinWrap: { position: "absolute", top: 0, left: "50%", transform: [{ translateX: -8 }], zIndex: 2 },
  truckImg: { width: SW * 0.42, height: 130, marginTop: 18 },

  // cards grid
  cardsGrid: { paddingHorizontal: 20, flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },

  // loading / error
  loadingBox:  { height: 220, alignItems: "center", justifyContent: "center" },
  errorBanner: { marginHorizontal: 20, marginBottom: 12, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", paddingHorizontal: 14, paddingVertical: 10 },
  errorText:   { fontFamily: "Poppins_400Regular", fontSize: 12, color: RED, lineHeight: 18 },
});
