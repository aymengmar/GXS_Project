import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

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
const GRID_CLR = "rgba(255,255,255,0.06)";
const TAB_BG = "#0A1525";

const SW = Dimensions.get("window").width;

// ─── tiny icon primitives ─────────────────────────────────────────────────────

/** Two overlapping person silhouettes */
function UsersIcon({
  size = 18,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  const h = size * 0.55,
    hs = size * 0.45,
    bw = size * 0.7,
    bs = size * 0.6;
  return (
    <View style={{ width: size, height: size, justifyContent: "flex-end" }}>
      {/* back person */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: hs,
          height: hs,
          borderRadius: hs / 2,
          borderWidth: 1.5,
          borderColor: color,
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: bs,
          height: size * 0.38,
          borderTopLeftRadius: bs / 2,
          borderTopRightRadius: bs / 2,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
          opacity: 0.5,
        }}
      />
      {/* front person */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: size * 0.05,
          width: h,
          height: h,
          borderRadius: h / 2,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: bw,
          height: size * 0.42,
          borderTopLeftRadius: bw / 2,
          borderTopRightRadius: bw / 2,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

/** Shield with checkmark */
function ShieldIcon({
  size = 18,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  const w = size * 0.82,
    h = size;
  return (
    <View style={{ width: w, height: h, alignItems: "center" }}>
      <View
        style={{
          width: w,
          height: h * 0.82,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: size * 0.28,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <View
        style={{
          width: w * 0.55,
          height: h * 0.22,
          borderBottomLeftRadius: w * 0.28,
          borderBottomRightRadius: w * 0.28,
          borderWidth: 1.5,
          borderTopWidth: 0,
          borderColor: color,
          marginTop: -1,
        }}
      />
      {/* tiny check */}
      <View
        style={{
          position: "absolute",
          top: h * 0.28,
          left: w * 0.22,
          width: size * 0.14,
          height: size * 0.07,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: h * 0.22,
          left: w * 0.32,
          width: size * 0.26,
          height: size * 0.07,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

/** Box / package */
function BoxIcon({
  size = 18,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.85,
          height: size * 0.85,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 3,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: 0,
          right: 0,
          height: size * 0.24,
          borderBottomWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          width: 1.5,
          height: size * 0.24,
          backgroundColor: color,
          alignSelf: "center",
        }}
      />
    </View>
  );
}

/** Circle with checkmark */
function CircleCheckIcon({
  size = 18,
  color = WHITE,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.28,
          height: size * 0.14,
          backgroundColor: color,
          borderRadius: 1,
          transform: [
            { rotate: "45deg" },
            { translateX: -size * 0.05 },
            { translateY: size * 0.04 },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.46,
          height: size * 0.14,
          backgroundColor: color,
          borderRadius: 1,
          transform: [
            { rotate: "-50deg" },
            { translateX: size * 0.08 },
            { translateY: -size * 0.03 },
          ],
        }}
      />
    </View>
  );
}

/** Three dots (⋮) */
function DotsVIcon({ color = DIM }: { color?: string }) {
  return (
    <View style={{ gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

/** Arrow up/down for delta */
function DeltaArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: 13, lineHeight: 16, marginRight: 2 }}>
      {up ? "↑" : "↓"}
    </Text>
  );
}

/** Sparkline chart for stat cards — matches screenshot style */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 38;
  const linePath = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = W / (data.length - 1);
    const pts = data.map(
      (v, i) => [i * stepX, H - ((v - min) / range) * (H - 6) - 3] as [number, number],
    );
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
        <LinearGradient id={`sg_${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#sg_${color})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── tab icons ───────────────────────────────────────────────────────────────

function TabGrid({ color }: { color: string }) {
  const s = 5;
  return (
    <View
      style={{
        width: 18,
        height: 18,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 3,
        padding: 1,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: s,
            height: s,
            backgroundColor: color,
            borderRadius: 1.5,
          }}
        />
      ))}
    </View>
  );
}

function TabPeople({ color }: { color: string }) {
  return <UsersIcon size={18} color={color} />;
}

function TabTruck({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 16 }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 14,
          height: 10,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 3,
          width: 8,
          height: 7,
          borderWidth: 1.5,
          borderColor: color,
          borderTopRightRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 2,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: TAB_BG,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 2,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: TAB_BG,
        }}
      />
    </View>
  );
}

function TabChart({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 20,
        height: 18,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 3,
      }}
    >
      {[9, 16, 7, 13].map((h, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: h,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

// ─── SVG area chart ───────────────────────────────────────────────────────────

const CHART_H = 148;
// chart inner drawing area — leave room for y-axis labels
const Y_LABEL_W = 36;
const CHART_W = SW - 40 - 28 - Y_LABEL_W; // screen - outer padding - card padding - y-label

// normalized data points [x_fraction, y_fraction] (y=1 is peak/top)
const DATA_NORM: [number, number][] = [
  [0.0, 0.02],
  [0.1, 0.08],
  [0.2, 0.18],
  [0.3, 0.34],
  [0.4, 0.5],
  [0.5, 0.62],
  [0.6, 0.74],
  [0.7, 0.88],
  [0.8, 0.94],
  [0.88, 0.96],
  [1.0, 0.82],
];

function toSvgPt(nx: number, ny: number): [number, number] {
  return [nx * CHART_W, CHART_H * (1 - ny)];
}

function buildSmoothPath(): string {
  const pts = DATA_NORM.map(([nx, ny]) => toSvgPt(nx, ny));
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  // close area downwards
  d += ` L ${pts[pts.length - 1][0]} ${CHART_H} L ${pts[0][0]} ${CHART_H} Z`;
  return d;
}

function buildLinePath(): string {
  const pts = DATA_NORM.map(([nx, ny]) => toSvgPt(nx, ny));
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

const Y_LABELS = ["1k", "750", "500", "250", "0"];
const X_LABELS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

function DeliveryChart() {
  const areaPath = useMemo(() => buildSmoothPath(), []);
  const linePath = useMemo(() => buildLinePath(), []);

  return (
    <View style={ch.wrap}>
      {/* Y-axis labels + grid */}
      <View style={ch.yLabels}>
        {Y_LABELS.map((l) => (
          <Text key={l} style={ch.axisLabel}>
            {l}
          </Text>
        ))}
      </View>

      {/* Chart SVG area */}
      <View style={{ flex: 1 }}>
        <Svg width={CHART_W} height={CHART_H}>
          <Defs>
            <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={PURPLE} stopOpacity="0.55" />
              <Stop offset="0.6" stopColor="#3B82F6" stopOpacity="0.18" />
              <Stop offset="1" stopColor={PURPLE} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* horizontal grid lines at 0%, 25%, 50%, 75%, 100% */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = CHART_H * frac;
            return (
              <Line
                key={frac}
                x1={0}
                y1={y}
                x2={CHART_W}
                y2={y}
                stroke={GRID_CLR}
                strokeWidth={1}
              />
            );
          })}

          {/* filled area */}
          <Path d={areaPath} fill="url(#chartGrad)" />

          {/* line */}
          <Path
            d={linePath}
            fill="none"
            stroke={PURPLE}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {/* X-axis labels below chart */}
        <View style={ch.xLabels}>
          {X_LABELS.map((l) => (
            <Text key={l} style={ch.axisLabel}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  wrap: { flexDirection: "row", marginTop: 12 },
  yLabels: {
    width: Y_LABEL_W,
    height: CHART_H,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 6,
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  axisLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: MUTED,
  },
});

// ─── summary card ─────────────────────────────────────────────────────────────

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

const CARDS: CardDef[] = [
  {
    label: "Total Drivers",
    value: "342",
    iconType: "users",
    iconColor: GREEN,
    iconBg: "rgba(34,197,94,0.15)",
    delta: "+8.1% vs yesterday",
    deltaUp: true,
    spark: [10, 14, 12, 18, 22, 26, 28, 33, 38, 42],
  },
  {
    label: "Pending Verifications",
    value: "24",
    iconType: "shield",
    iconColor: AMBER,
    iconBg: "rgba(245,158,11,0.15)",
    delta: "-4.3% vs yesterday",
    deltaUp: false,
    spark: [40, 36, 38, 30, 28, 32, 26, 24, 28, 24],
  },
  {
    label: "Total Deliveries",
    value: "1,248",
    iconType: "box",
    iconColor: BLUE,
    iconBg: "rgba(59,130,246,0.15)",
    delta: "+12.5% vs yesterday",
    deltaUp: true,
    spark: [200, 300, 380, 450, 550, 640, 720, 850, 980, 1100],
  },
  {
    label: "Completed Today",
    value: "892",
    iconType: "check-circle",
    iconColor: PURPLE,
    iconBg: "rgba(139,92,246,0.15)",
    delta: "+15.3% vs yesterday",
    deltaUp: true,
    spark: [100, 180, 260, 350, 440, 550, 640, 730, 810, 892],
  },
];

function CardIcon({
  type,
  color,
}: {
  type: CardDef["iconType"];
  color: string;
}) {
  if (type === "users") return <UsersIcon size={20} color={color} />;
  if (type === "shield") return <ShieldIcon size={20} color={color} />;
  if (type === "box") return <BoxIcon size={20} color={color} />;
  return <CircleCheckIcon size={20} color={color} />;
}

function SummaryCard(c: CardDef) {
  const deltaColor = c.deltaUp ? GREEN : RED;
  return (
    <View style={sc.card}>
      {/* top row: icon + dots */}
      <View style={sc.topRow}>
        <View style={[sc.iconCircle, { backgroundColor: c.iconBg }]}>
          <CardIcon type={c.iconType} color={c.iconColor} />
        </View>
        <DotsVIcon />
      </View>
      {/* value first, then label */}
      <Text style={sc.value}>{c.value}</Text>
      <Text style={sc.label} numberOfLines={2}>
        {c.label}
      </Text>
      {/* delta + sparkline */}
      <View style={sc.bottomRow}>
        <View style={sc.deltaRow}>
          <DeltaArrow up={c.deltaUp} color={deltaColor} />
          <Text style={[sc.deltaText, { color: deltaColor }]}>{c.delta}</Text>
        </View>
        <MiniSparkline data={c.spark} color={c.iconColor} />
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: WHITE,
    lineHeight: 32,
  },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  deltaText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    lineHeight: 14,
    flexShrink: 1,
  },
});

// ─── recent activity ──────────────────────────────────────────────────────────

type ActivityIcon = "doc" | "person-add" | "check" | "truck";

const ACTIVITY: { icon: ActivityIcon; text: string; time: string }[] = [
  { icon: "doc", text: "John Doe submitted documents", time: "2m ago" },
  {
    icon: "person-add",
    text: "New driver Sarah Johnson registered",
    time: "10m ago",
  },
  { icon: "check", text: "Driver Michael Smith approved", time: "15m ago" },
  { icon: "truck", text: "Delivery #GR-0821 completed", time: "25m ago" },
];

function ActivityIconView({ type }: { type: ActivityIcon }) {
  const color =
    type === "doc"
      ? BLUE
      : type === "person-add"
        ? AMBER
        : type === "check"
          ? GREEN
          : BLUE;
  const bg =
    type === "doc"
      ? "rgba(59,130,246,0.15)"
      : type === "person-add"
        ? "rgba(245,158,11,0.15)"
        : type === "check"
          ? "rgba(34,197,94,0.15)"
          : "rgba(59,130,246,0.15)";
  return (
    <View style={[ai.circle, { backgroundColor: bg }]}>
      {type === "doc" && <BoxIcon size={16} color={color} />}
      {type === "person-add" && <UsersIcon size={16} color={color} />}
      {type === "check" && <CircleCheckIcon size={16} color={color} />}
      {type === "truck" && <TabTruck color={color} />}
    </View>
  );
}

function ActivityRow({ item }: { item: (typeof ACTIVITY)[0] }) {
  return (
    <View style={ai.row}>
      <ActivityIconView type={item.icon} />
      <Text style={ai.text} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={ai.time}>{item.time}</Text>
      {/* chevron > */}
      <View style={ai.chevron} />
    </View>
  );
}

const ai = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: WHITE,
    lineHeight: 18,
  },
  time: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
    flexShrink: 0,
  },
  chevron: {
    width: 6,
    height: 6,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: MUTED,
    transform: [{ rotate: "45deg" }],
    flexShrink: 0,
  },
});

// ─── bottom tab bar ───────────────────────────────────────────────────────────

const TABS = [
  { label: "Dashboard", Icon: TabGrid },
  { label: "Drivers", Icon: TabPeople },
  { label: "Deliveries", Icon: TabTruck },
  { label: "Reports", Icon: TabChart },
] as const;

function BottomTabs({
  active = 0,
  onPress,
}: {
  active?: number;
  onPress?: (i: number) => void;
}) {
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
  bar: {
    flexDirection: "row",
    backgroundColor: TAB_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    paddingBottom: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    position: "relative",
    paddingTop: 6,
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    lineHeight: 14,
  },
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const router = useRouter();
  const session = sessionStore.get();
  const firstName =
    session?.kind === "admin" ? session.user.full_name.split(" ")[0] : "Admin";
  const greet = useMemo(() => greeting(), []);

  const handleLogout = () => {
    sessionStore.clear();
    router.replace("/login" as any);
  };

  const handleTabPress = (i: number) => {
    if (i === 1) router.replace("/admin/drivers" as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>GXS Delivery</Text>
            <Text style={s.headerSub}>Admin Dashboard</Text>
          </View>
          {/* avatar — tap to log out */}
          <Pressable style={s.avatar} onPress={handleLogout} hitSlop={8}>
            <Text style={s.avatarLetter}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        {/* ── greeting ───────────────────────────────────────────── */}
        <View style={s.greetWrap}>
          <Text style={s.greetTitle}>{greet}, Admin 👋</Text>
          <Text style={s.greetSub}>Here's what's happening today.</Text>
        </View>

        {/* ── date badge ─────────────────────────────────────────── */}
        <View style={s.dateBadge}>
          {/* calendar icon */}
          <View style={s.calIcon}>
            <View style={s.calTop} />
            <View style={s.calBody}>
              <View style={s.calGrid}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={s.calDot} />
                ))}
              </View>
            </View>
            <View style={s.calPinL} />
            <View style={s.calPinR} />
          </View>
          <Text style={s.dateText}>May 25, 2025</Text>
          <Text style={s.dateCaret}> ▾</Text>
        </View>

        {/* ── 2×2 card grid ──────────────────────────────────────── */}
        <View style={s.cardGrid}>
          {CARDS.map((c) => (
            <SummaryCard key={c.label} {...c} />
          ))}
        </View>

        {/* ── deliveries overview chart ───────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Deliveries Overview</Text>
            <View style={s.todayBadge}>
              <Text style={s.todayText}>Today ▾</Text>
            </View>
          </View>
          <View style={s.chartCard}>
            <DeliveryChart />
          </View>
        </View>

        {/* ── recent activity ────────────────────────────────────── */}
        <View style={[s.section, { marginTop: 20 }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <Pressable hitSlop={8}>
              <Text style={s.viewAll}>View all →</Text>
            </Pressable>
          </View>
          <View style={s.actCard}>
            {ACTIVITY.map((item, i) => (
              <ActivityRow key={i} item={item} />
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── tab bar ────────────────────────────────────────────────── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: TAB_BG }}>
        <BottomTabs active={0} onPress={handleTabPress} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ─── layout styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 10 },

  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: WHITE,
    lineHeight: 28,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    lineHeight: 17,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },

  // greeting
  greetWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  greetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    lineHeight: 28,
  },
  greetSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 20,
    marginTop: 2,
  },

  // date badge
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 6,
  },
  calIcon: {
    width: 14,
    height: 14,
    position: "relative",
  },
  calTop: {
    position: "absolute",
    top: 0,
    left: 1,
    right: 1,
    height: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: DIM,
  },
  calBody: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: DIM,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 1,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1.5,
    width: 9,
  },
  calDot: { width: 2, height: 2, backgroundColor: DIM, borderRadius: 0.5 },
  calPinL: {
    position: "absolute",
    top: -2,
    left: 3,
    width: 1.5,
    height: 4,
    backgroundColor: DIM,
    borderRadius: 1,
  },
  calPinR: {
    position: "absolute",
    top: -2,
    right: 3,
    width: 1.5,
    height: 4,
    backgroundColor: DIM,
    borderRadius: 1,
  },
  dateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: WHITE,
  },
  dateCaret: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: DIM,
  },

  // card grid
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // section
  section: { paddingHorizontal: 20 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  viewAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
  },
  todayBadge: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  todayText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: DIM,
  },

  // chart card
  chartCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    paddingBottom: 10,
  },

  // activity card
  actCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
  },
});
