import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG       = "#080F1D";
const SURFACE  = "#0D1A2E";
const CARD     = "#111E33";
const BORDER   = "rgba(255,255,255,0.07)";
const ORANGE   = "#FF6500";
const GREEN    = "#22C55E";
const RED      = "#EF4444";
const AMBER    = "#F59E0B";
const BLUE     = "#3B82F6";
const WHITE    = "#FFFFFF";
const DIM      = "rgba(255,255,255,0.60)";
const MUTED    = "rgba(255,255,255,0.28)";
const GRID_CLR = "rgba(255,255,255,0.06)";
const TAB_BG   = "#060C18";

const SW = Dimensions.get("window").width;

// ─── chart constants ──────────────────────────────────────────────────────────
const Y_LABEL_W = 36;
const CHART_H   = 180;
// content padding 14*2 + card padding 16*2 + y-label
const CHART_W   = SW - 14 * 2 - 16 * 2 - Y_LABEL_W;
const Y_MAX     = 600;

const DELIVERED = [280, 312, 265, 298, 345, 403, 412];
const RETURNED  = [18,  21,  17,  19,  25,  29,  31 ];
const DAYS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cToX(i: number) { return (i / (DELIVERED.length - 1)) * CHART_W; }
function cToY(v: number) { return CHART_H * (1 - v / Y_MAX); }

function buildSmoothPath(pts: [number, number][]): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

const DELIV_PTS: [number, number][] = DELIVERED.map((v, i) => [cToX(i), cToY(v)]);
const RETURN_PTS: [number, number][] = RETURNED.map((v, i) => [cToX(i), cToY(v)]);
const DELIV_LINE  = buildSmoothPath(DELIV_PTS);
const RETURN_LINE = buildSmoothPath(RETURN_PTS);
const DELIV_AREA  = DELIV_LINE +
  ` L ${DELIV_PTS[DELIV_PTS.length - 1][0]} ${CHART_H}` +
  ` L ${DELIV_PTS[0][0]} ${CHART_H} Z`;

// ─── mock drivers ─────────────────────────────────────────────────────────────
type DriverData = {
  rank: number; name: string; type: "Company Car" | "Own Car";
  delivered: number; delivPct: string;
  returned: number;  retPct: string;
  success: string;   earnings: string;
  avatarBg: string;
};

const DRIVERS: DriverData[] = [
  { rank:1, name:"Ali Kaya",    type:"Company Car", delivered:684, delivPct:"+15%", returned:18, retPct:"+5%",  success:"97.4%", earnings:"€1,245.60", avatarBg:"#3B82F6" },
  { rank:2, name:"Sara Chen",   type:"Own Car",     delivered:612, delivPct:"+12%", returned:15, retPct:"+3%",  success:"97.6%", earnings:"€1,102.30", avatarBg:"#8B5CF6" },
  { rank:3, name:"John Miller", type:"Company Car", delivered:598, delivPct:"+8%",  returned:22, retPct:"+10%", success:"96.4%", earnings:"€1,023.80", avatarBg:"#22C55E" },
  { rank:4, name:"Maria Diaz",  type:"Own Car",     delivered:489, delivPct:"+6%",  returned:16, retPct:"+6%",  success:"96.8%", earnings:"€897.40",   avatarBg:"#F59E0B" },
  { rank:5, name:"Tom Wilson",  type:"Company Car", delivered:465, delivPct:"+4%",  returned:13, retPct:"+2%",  success:"97.3%", earnings:"€765.20",   avatarBg:"#EF4444" },
];

const TREND_DATA = [
  [5, 6, 5, 7, 6, 8, 7, 9],
  [6, 5, 7, 6, 8, 7, 9, 8],
  [4, 5, 4, 6, 5, 7, 6, 8],
  [5, 4, 6, 5, 7, 6, 8, 7],
  [4, 5, 4, 6, 5, 7, 6, 7],
];

const METRIC_SPARK = {
  delivered: [35, 38, 34, 40, 36, 42, 38, 44, 40, 46, 42, 48],
  returned:  [22, 20, 25, 18, 22, 20, 24, 18, 22, 19, 20, 18],
  earnings:  [30, 33, 28, 36, 40, 37, 43, 40, 46, 48, 45, 52],
  success:   [44, 47, 43, 49, 51, 47, 53, 55, 51, 57, 58, 60],
};

// ─── sparkline ────────────────────────────────────────────────────────────────
function SparkLine({ data, color, W = 70, H = 28 }: { data: number[]; color: string; W?: number; H?: number }) {
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = max - min || 1;
  const pts: [number, number][] = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 2 - ((v - min) / range) * (H - 4),
  ]);
  const path = buildSmoothPath(pts);
  return (
    <Svg width={W} height={H}>
      <Path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── icon primitives ──────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <View style={{ width:14, height:14, justifyContent:"center", alignItems:"center" }}>
      <View style={{ width:8, height:8, borderLeftWidth:2, borderBottomWidth:2, borderColor:WHITE, transform:[{rotate:"45deg"}], marginLeft:3 }} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={{ width:18, height:18, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:16, height:13, borderWidth:1.5, borderColor:WHITE, borderRadius:3, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:5,  left:2, right:2, height:1, backgroundColor:MUTED }} />
        <View style={{ position:"absolute", top:8,  left:2, width:3, height:3, backgroundColor:WHITE, opacity:0.6, borderRadius:0.5 }} />
        <View style={{ position:"absolute", top:8,  left:7, width:3, height:3, backgroundColor:WHITE, opacity:0.6, borderRadius:0.5 }} />
        <View style={{ position:"absolute", top:8, right:2, width:3, height:3, backgroundColor:WHITE, opacity:0.6, borderRadius:0.5 }} />
      </View>
      <View style={{ position:"absolute", top:0, left:4, width:2, height:5, backgroundColor:CARD, borderWidth:1.5, borderColor:WHITE, borderRadius:1 }} />
      <View style={{ position:"absolute", top:0, right:4, width:2, height:5, backgroundColor:CARD, borderWidth:1.5, borderColor:WHITE, borderRadius:1 }} />
    </View>
  );
}

function FunnelIcon() {
  return (
    <View style={{ width:16, height:16, alignItems:"center", justifyContent:"center", gap:2.5 }}>
      <View style={{ width:14, height:1.5, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:9,  height:1.5, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:4,  height:1.5, backgroundColor:WHITE, borderRadius:1 }} />
    </View>
  );
}

function RefreshIcon({ color = WHITE }: { color?: string }) {
  // Classic double-arc sync icon: top half arc + bottom half arc, each with an arrowhead
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {/* top arc: left → right over the top (clockwise) */}
      <Path d="M 4 12 A 8 8 0 0 1 20 12"
        fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      {/* arrowhead at (20,12) pointing downward */}
      <Path d="M 17.5 9.5 L 20.5 12.5 L 23 9.5"
        fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      {/* bottom arc: right → left under the bottom (clockwise) */}
      <Path d="M 20 12 A 8 8 0 0 1 4 12"
        fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      {/* arrowhead at (4,12) pointing upward */}
      <Path d="M 6.5 14.5 L 3.5 11.5 L 1 14.5"
        fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDown({ color = DIM }: { color?: string }) {
  return (
    <View style={{ width:10, height:6, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:6, height:6, borderRightWidth:1.5, borderBottomWidth:1.5, borderColor:color, transform:[{rotate:"45deg"},{translateY:-2}] }} />
    </View>
  );
}

// metric card icons
function IconBox({ color }: { color: string }) {
  return (
    <View style={{ width:20, height:20 }}>
      <View style={{ position:"absolute", bottom:0, width:20, height:13, borderWidth:1.5, borderColor:color, borderRadius:3 }} />
      <View style={{ position:"absolute", top:0, width:20, height:9, borderWidth:1.5, borderColor:color, borderTopLeftRadius:3, borderTopRightRadius:3, borderBottomWidth:0 }} />
      <View style={{ position:"absolute", top:2, left:7, width:6, height:1.5, backgroundColor:color, borderRadius:1 }} />
    </View>
  );
}

function IconReturn({ color }: { color: string }) {
  return (
    <View style={{ width:20, height:20, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:14, height:14, borderRadius:7, borderWidth:1.5, borderColor:color, borderTopColor:"transparent", transform:[{rotate:"135deg"}] }} />
      <View style={{ position:"absolute", top:2, right:3, width:0, height:0, borderLeftWidth:4, borderRightWidth:4, borderBottomWidth:6, borderLeftColor:"transparent", borderRightColor:"transparent", borderBottomColor:color, transform:[{rotate:"45deg"}] }} />
    </View>
  );
}

function IconWallet({ color }: { color: string }) {
  return (
    <View style={{ width:22, height:16 }}>
      <View style={{ width:22, height:16, borderWidth:1.5, borderColor:color, borderRadius:4 }} />
      <View style={{ position:"absolute", right:3, top:4, width:8, height:8, borderRadius:4, borderWidth:1.5, borderColor:color, backgroundColor:CARD }} />
      <View style={{ position:"absolute", right:6.5, top:7, width:2, height:2, borderRadius:1, backgroundColor:color }} />
    </View>
  );
}

function IconShield({ color }: { color: string }) {
  return (
    <View style={{ width:18, height:20, alignItems:"center" }}>
      <View style={{ width:18, height:16, borderWidth:1.5, borderColor:color, borderTopLeftRadius:4, borderTopRightRadius:4, borderBottomLeftRadius:10, borderBottomRightRadius:10 }} />
      <View style={{ position:"absolute", top:5, left:4, width:4, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"45deg"},{translateY:1}] }} />
      <View style={{ position:"absolute", top:6, left:7, width:7, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"-50deg"}] }} />
    </View>
  );
}

// ─── tab bar icons ────────────────────────────────────────────────────────────
function GridIcon({ color }: { color: string }) {
  return (
    <View style={{ width:18, height:18, flexDirection:"row", flexWrap:"wrap", gap:3, padding:1 }}>
      {[0,1,2,3].map(i => <View key={i} style={{ width:5, height:5, backgroundColor:color, borderRadius:1 }} />)}
    </View>
  );
}

function PeopleIcon({ color }: { color: string }) {
  const sz = 20;
  return (
    <View style={{ width:sz, height:sz }}>
      <View style={{ position:"absolute", left:0, top:0, width:sz*0.42, height:sz*0.42, borderRadius:sz*0.21, borderWidth:1.5, borderColor:color, opacity:0.5 }} />
      <View style={{ position:"absolute", left:0, bottom:0, width:sz*0.62, height:sz*0.36, borderTopLeftRadius:sz*0.31, borderTopRightRadius:sz*0.31, borderWidth:1.5, borderColor:color, borderBottomWidth:0, opacity:0.5 }} />
      <View style={{ position:"absolute", right:0, top:sz*0.04, width:sz*0.46, height:sz*0.46, borderRadius:sz*0.23, borderWidth:1.5, borderColor:color }} />
      <View style={{ position:"absolute", right:0, bottom:0, width:sz*0.72, height:sz*0.4, borderTopLeftRadius:sz*0.36, borderTopRightRadius:sz*0.36, borderWidth:1.5, borderColor:color, borderBottomWidth:0 }} />
    </View>
  );
}

function InvoiceTabIcon({ color }: { color: string }) {
  return (
    <View style={{ width:18, height:22 }}>
      <View style={{ width:18, height:22, borderWidth:1.8, borderColor:color, borderRadius:4 }} />
      <View style={{ position:"absolute", top:5,  left:4, right:4, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:9,  left:4, right:4, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:13, left:4, width:6, height:1.5, backgroundColor:color, borderRadius:1 }} />
    </View>
  );
}

function ChartTabIcon({ color }: { color: string }) {
  return (
    <View style={{ width:20, height:18, flexDirection:"row", alignItems:"flex-end", gap:3 }}>
      {[9, 16, 7, 13].map((h, i) => (
        <View key={i} style={{ width:3, height:h, backgroundColor:color, borderRadius:2 }} />
      ))}
    </View>
  );
}

// ─── bottom tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { label:"Dashboard", Icon:GridIcon       },
  { label:"Users",     Icon:PeopleIcon     },
  { label:"Invoices",  Icon:InvoiceTabIcon },
  { label:"Reports",   Icon:ChartTabIcon   },
] as const;

function BottomTabs({ onPress }: { onPress: (i: number) => void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(({ label, Icon }, i) => {
        const active = i === 3;
        const color  = active ? ORANGE : MUTED;
        return (
          <Pressable key={label} style={tb.item} hitSlop={6} onPress={() => onPress(i)}>
            {active && <View style={tb.indicator} />}
            <Icon color={color} />
            <Text style={[tb.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar:       { flexDirection:"row", backgroundColor:TAB_BG, borderTopWidth:1, borderTopColor:BORDER, paddingTop:10, paddingBottom:6 },
  item:      { flex:1, alignItems:"center", gap:4, position:"relative", paddingTop:8 },
  indicator: { position:"absolute", top:0, width:28, height:3, borderRadius:2, backgroundColor:ORANGE },
  label:     { fontFamily:"Poppins_500Medium", fontSize:10, lineHeight:14 },
});

// ─── metric card ──────────────────────────────────────────────────────────────
type MetricCfg = {
  icon:       React.ReactNode;
  value:      string;
  label:      string;
  change:     string;
  valueColor: string;
  sparkData:  number[];
  sparkColor: string;
};

function MetricCard({ icon, value, label, change, valueColor, sparkData, sparkColor }: MetricCfg) {
  return (
    <View style={mc.card}>
      <View style={mc.top}>
        {icon}
        <View style={mc.vals}>
          <Text style={[mc.value, { color:valueColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {value}
          </Text>
          <Text style={mc.label}>{label}</Text>
        </View>
      </View>
      <View style={mc.changeRow}>
        <Text style={[mc.change, { color:valueColor }]}>{change} ↑</Text>
        <Text style={mc.vs}>vs yesterday</Text>
      </View>
      <SparkLine data={sparkData} color={sparkColor} W={70} H={26} />
    </View>
  );
}

const mc = StyleSheet.create({
  card:      { flex:1, backgroundColor:CARD, borderRadius:14, borderWidth:1, borderColor:BORDER, padding:12, gap:8 },
  top:       { flexDirection:"row", alignItems:"flex-start", gap:10 },
  vals:      { flex:1, gap:2 },
  value:     { fontFamily:"Poppins_700Bold",    fontSize:20, lineHeight:26, letterSpacing:-0.3 },
  label:     { fontFamily:"Poppins_400Regular", fontSize:10, color:DIM, lineHeight:14 },
  changeRow: { flexDirection:"row", alignItems:"center", gap:6 },
  change:    { fontFamily:"Poppins_600SemiBold", fontSize:11, lineHeight:15 },
  vs:        { fontFamily:"Poppins_400Regular",  fontSize:10, color:DIM, lineHeight:14 },
});

// ─── delivery chart ───────────────────────────────────────────────────────────
function DeliveryChart() {
  const Y_LABELS = ["600", "450", "300", "150", "0"];
  return (
    <View>
      {/* legend */}
      <View style={ch.legend}>
        <View style={ch.legendItem}>
          <View style={{ width:8, height:8, borderRadius:4, backgroundColor:GREEN }} />
          <Text style={ch.legendTxt}>Delivered</Text>
        </View>
        <View style={ch.legendItem}>
          <View style={{ width:8, height:8, borderRadius:4, backgroundColor:RED }} />
          <Text style={ch.legendTxt}>Returned</Text>
        </View>
      </View>

      {/* y-labels + svg */}
      <View style={{ flexDirection:"row", alignItems:"flex-start" }}>
        <View style={{ width:Y_LABEL_W, height:CHART_H, justifyContent:"space-between", paddingRight:4 }}>
          {Y_LABELS.map(l => (
            <Text key={l} style={ch.yLabel}>{l}</Text>
          ))}
        </View>

        <View style={{ width:CHART_W, height:CHART_H, position:"relative" }}>
          <Svg width={CHART_W} height={CHART_H} style={{ position:"absolute", top:0, left:0 }}>
            <Defs>
              <LinearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"   stopColor={GREEN} stopOpacity="0.30" />
                <Stop offset="0.7" stopColor={GREEN} stopOpacity="0.05" />
                <Stop offset="1"   stopColor={GREEN} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {[0, 0.25, 0.5, 0.75, 1].map(f => (
              <Line key={f} x1={0} y1={CHART_H * f} x2={CHART_W} y2={CHART_H * f} stroke={GRID_CLR} strokeWidth={1} />
            ))}

            <Path d={DELIV_AREA} fill="url(#delivGrad)" />
            <Path d={RETURN_LINE} fill="none" stroke={RED}   strokeWidth={2}   strokeLinecap="round" strokeLinejoin="round" />
            <Path d={DELIV_LINE}  fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {DELIV_PTS.map(([x, y], i) => (
              <Circle key={`d${i}`} cx={x} cy={y} r={4} fill={GREEN} />
            ))}
            {RETURN_PTS.map(([x, y], i) => (
              <Circle key={`r${i}`} cx={x} cy={y} r={3.5} fill={RED} />
            ))}
          </Svg>

          {DELIV_PTS.map(([x, y], i) => (
            <View key={`dl${i}`} style={{ position:"absolute", left:x - 14, top:y - 18, width:28, alignItems:"center" }}>
              <Text style={ch.dataLabelWhite}>{DELIVERED[i]}</Text>
            </View>
          ))}

          {RETURN_PTS.map(([x, y], i) => (
            <View key={`rl${i}`} style={{ position:"absolute", left:x - 10, top:y + 6, width:20, alignItems:"center" }}>
              <Text style={ch.dataLabelRed}>{RETURNED[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* x-axis labels */}
      <View style={{ flexDirection:"row", marginLeft:Y_LABEL_W, marginTop:8 }}>
        {DAYS.map((d, i) => (
          <View key={d} style={{ flex:1, alignItems:"center" }}>
            <Text style={[ch.xLabel, i === 6 && { color:ORANGE, fontFamily:"Poppins_600SemiBold" }]}>
              {d}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  legend:        { flexDirection:"row", gap:14, marginBottom:12 },
  legendItem:    { flexDirection:"row", alignItems:"center", gap:5 },
  legendTxt:     { fontFamily:"Poppins_400Regular", fontSize:11, color:DIM },
  yLabel:        { fontFamily:"Poppins_400Regular", fontSize:9,  color:MUTED, lineHeight:13, textAlign:"right" },
  xLabel:        { fontFamily:"Poppins_400Regular", fontSize:10, color:MUTED, lineHeight:14 },
  dataLabelWhite:{ fontFamily:"Poppins_600SemiBold", fontSize:9, color:WHITE },
  dataLabelRed:  { fontFamily:"Poppins_600SemiBold", fontSize:9, color:RED   },
});

// ─── driver table ─────────────────────────────────────────────────────────────
function DriverTableHeader() {
  return (
    <View style={dt.headerRow}>
      <Text style={[dt.hTxt, { width:16 }]}>#</Text>
      <View style={{ flex:2.4 }}><Text style={dt.hTxt}>Driver</Text></View>
      <View style={{ flex:1.6 }}><Text style={dt.hTxt}>Type</Text></View>
      <View style={{ flex:1.3, alignItems:"flex-end" }}><Text style={dt.hTxt}>Del.</Text></View>
      <View style={{ flex:1.1, alignItems:"flex-end" }}><Text style={dt.hTxt}>Ret.</Text></View>
      <View style={{ flex:1.4, alignItems:"flex-end" }}><Text style={dt.hTxt}>Rate</Text></View>
      <View style={{ flex:1.8, alignItems:"flex-end" }}><Text style={dt.hTxt}>Earnings</Text></View>
      <View style={{ flex:1.2, alignItems:"flex-end" }}><Text style={dt.hTxt}>Trend</Text></View>
    </View>
  );
}

function DriverTableRow({ driver, trendData }: { driver: DriverData; trendData: number[] }) {
  const initials = driver.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <View style={dt.row}>
      <Text style={dt.rank}>{driver.rank}</Text>

      <View style={dt.driverCol}>
        <View style={[dt.avatar, { backgroundColor: driver.avatarBg + "30" }]}>
          <Text style={[dt.initials, { color: driver.avatarBg }]}>{initials}</Text>
        </View>
        <Text style={dt.name} numberOfLines={1}>{driver.name}</Text>
      </View>

      <View style={{ flex:1.6 }}>
        <Text style={dt.typeText} numberOfLines={1}>
          {driver.type === "Company Car" ? "Co. Car" : "Own Car"}
        </Text>
      </View>

      <View style={{ flex:1.3, alignItems:"flex-end" }}>
        <Text style={dt.numVal}>{driver.delivered}</Text>
        <Text style={dt.greenPct}>{driver.delivPct}</Text>
      </View>

      <View style={{ flex:1.1, alignItems:"flex-end" }}>
        <Text style={dt.numVal}>{driver.returned}</Text>
        <Text style={dt.greenPct}>{driver.retPct}</Text>
      </View>

      <View style={{ flex:1.4, alignItems:"flex-end" }}>
        <Text style={[dt.numVal, { color:GREEN }]}>{driver.success}</Text>
      </View>

      <View style={{ flex:1.8, alignItems:"flex-end" }}>
        <Text style={dt.earningVal} numberOfLines={1}>{driver.earnings}</Text>
      </View>

      <View style={{ flex:1.2, alignItems:"flex-end" }}>
        <SparkLine data={trendData} color={GREEN} W={42} H={18} />
      </View>
    </View>
  );
}

const dt = StyleSheet.create({
  headerRow: { flexDirection:"row", alignItems:"center", paddingVertical:8, borderBottomWidth:1, borderBottomColor:BORDER },
  hTxt:      { fontFamily:"Poppins_400Regular", fontSize:8.5, color:MUTED, lineHeight:12 },
  row:       { flexDirection:"row", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:BORDER },
  rank:      { fontFamily:"Poppins_500Medium", fontSize:10, color:MUTED, width:16 },
  driverCol: { flex:2.4, flexDirection:"row", alignItems:"center", gap:6 },
  avatar:    { width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center", flexShrink:0 },
  initials:  { fontFamily:"Poppins_700Bold", fontSize:9, lineHeight:13 },
  name:      { fontFamily:"Poppins_500Medium", fontSize:9.5, color:WHITE, flex:1 },
  typeText:  { fontFamily:"Poppins_400Regular", fontSize:9, color:DIM },
  numVal:    { fontFamily:"Poppins_600SemiBold", fontSize:9.5, color:WHITE },
  greenPct:  { fontFamily:"Poppins_400Regular",  fontSize:8, color:GREEN, lineHeight:12 },
  earningVal:{ fontFamily:"Poppins_600SemiBold", fontSize:9, color:WHITE },
});

// ─── export section ───────────────────────────────────────────────────────────
function CheckItem({ label }: { label: string }) {
  return (
    <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:6 }}>
      <View style={{ width:14, height:14, borderRadius:7, backgroundColor:"rgba(34,197,94,0.15)", borderWidth:1, borderColor:GREEN, alignItems:"center", justifyContent:"center" }}>
        <View style={{ position:"absolute", width:4, height:1.5, backgroundColor:GREEN, borderRadius:1, transform:[{rotate:"45deg"},{translateX:-1},{translateY:1}] }} />
        <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:GREEN, borderRadius:1, transform:[{rotate:"-50deg"},{translateX:1}] }} />
      </View>
      <Text style={{ fontFamily:"Poppins_400Regular", fontSize:12, color:DIM }}>{label}</Text>
    </View>
  );
}

function XlsxVisual() {
  return (
    <View style={xl.card}>
      <View style={xl.corner} />
      <Text style={xl.label}>XLSX</Text>
      <View style={xl.dlBadge}>
        <View style={{ width:1.5, height:7, backgroundColor:WHITE, borderRadius:1 }} />
        <View style={{ width:0, height:0, borderLeftWidth:4, borderRightWidth:4, borderTopWidth:5, borderLeftColor:"transparent", borderRightColor:"transparent", borderTopColor:WHITE, marginTop:1 }} />
        <View style={{ width:10, height:1.5, backgroundColor:WHITE, borderRadius:1, marginTop:2 }} />
      </View>
    </View>
  );
}

const xl = StyleSheet.create({
  card:    { width:64, height:72, backgroundColor:"#16A34A", borderRadius:8, alignItems:"center", justifyContent:"center", gap:4, overflow:"hidden", position:"relative" },
  corner:  { position:"absolute", top:0, right:0, width:16, height:16, backgroundColor:"rgba(0,0,0,0.20)", borderBottomLeftRadius:6 },
  label:   { fontFamily:"Poppins_700Bold", fontSize:16, color:WHITE, letterSpacing:1 },
  dlBadge: { width:26, height:26, borderRadius:13, backgroundColor:"rgba(0,0,0,0.25)", alignItems:"center", justifyContent:"center", padding:4 },
});

// ─── screen ───────────────────────────────────────────────────────────────────
type TimeTab = "Today" | "Week" | "Month" | "Custom";
const TIME_TABS: TimeTab[] = ["Today", "Week", "Month", "Custom"];

export default function AdminReportsScreen() {
  const router               = useRouter();
  const [timeTab, setTimeTab]= useState<TimeTab>("Today");

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"           as never);
    if (i === 1) router.replace("/admin/drivers"   as never);
    if (i === 2) router.replace("/admin/invoices"  as never);
  };

  const iconBoxStyle = (bg: string) => ({
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: bg,
    alignItems: "center" as const, justifyContent: "center" as const,
  });

  const METRICS: MetricCfg[] = [
    {
      icon:       <View style={iconBoxStyle("rgba(34,197,94,0.15)")}><IconBox    color={GREEN} /></View>,
      value:      "5,842",   label:"Delivered",      change:"+12.6%",
      valueColor: GREEN,     sparkData:METRIC_SPARK.delivered, sparkColor:GREEN,
    },
    {
      icon:       <View style={iconBoxStyle("rgba(239,68,68,0.15)")}><IconReturn color={RED}   /></View>,
      value:      "312",     label:"Returned",        change:"+6.3%",
      valueColor: RED,       sparkData:METRIC_SPARK.returned,  sparkColor:RED,
    },
    {
      icon:       <View style={iconBoxStyle("rgba(245,158,11,0.15)")}><IconWallet color={AMBER}  /></View>,
      value:      "€8,742",  label:"Total Earnings",  change:"+9.1%",
      valueColor: AMBER,     sparkData:METRIC_SPARK.earnings,  sparkColor:AMBER,
    },
    {
      icon:       <View style={iconBoxStyle("rgba(59,130,246,0.15)")}><IconShield color={BLUE}   /></View>,
      value:      "94.6%",   label:"Success Rate",    change:"+3.4%",
      valueColor: BLUE,      sparkData:METRIC_SPARK.success,   sparkColor:BLUE,
    },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} hitSlop={10} onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.title}>Reports</Text>
          <Text style={s.subtitle}>Overview of your delivery operations</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={s.iconBtn} hitSlop={10}><CalendarIcon /></Pressable>
          <Pressable style={s.iconBtn} hitSlop={10}><FunnelIcon /></Pressable>
        </View>
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── time tabs + refresh ─────────────────────────────────── */}
        <View style={s.timebar}>
          <View style={s.timeTabs}>
            {TIME_TABS.map(t => {
              const active = t === timeTab;
              return (
                <Pressable
                  key={t}
                  style={[s.timeTab, active && s.timeTabActive]}
                  onPress={() => setTimeTab(t)}
                >
                  <Text style={[s.timeTabText, active && s.timeTabTextActive]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={s.refreshBtn} hitSlop={8}>
            <RefreshIcon color={DIM} />
          </Pressable>
        </View>

        {/* ── metric cards 2×2 ────────────────────────────────────── */}
        <View style={s.metricsRow}>
          <MetricCard {...METRICS[0]} />
          <MetricCard {...METRICS[1]} />
        </View>
        <View style={s.metricsRow}>
          <MetricCard {...METRICS[2]} />
          <MetricCard {...METRICS[3]} />
        </View>

        {/* ── deliveries overview ──────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Deliveries Overview</Text>
            <Pressable style={s.dailyBtn}>
              <Text style={s.dailyText}>Daily</Text>
              <ChevronDown />
            </Pressable>
          </View>
          <DeliveryChart />
        </View>

        {/* ── top drivers performance ──────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Top Drivers Performance</Text>
            <Pressable hitSlop={8}>
              <Text style={s.viewAll}>View all</Text>
            </Pressable>
          </View>
          <DriverTableHeader />
          {DRIVERS.map((d, idx) => (
            <DriverTableRow key={d.rank} driver={d} trendData={TREND_DATA[idx]} />
          ))}
        </View>

        {/* ── export card ──────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.exportTop}>
            {/* icon + doc icon row */}
            <View style={s.exportLeft}>
              <View style={s.exportIconBox}>
                <View style={{ width:22, height:24 }}>
                  <View style={{ width:22, height:24, borderWidth:1.5, borderColor:GREEN, borderRadius:4 }} />
                  <View style={{ position:"absolute", top:6,  left:4, right:4, height:1.5, backgroundColor:GREEN, borderRadius:1 }} />
                  <View style={{ position:"absolute", top:10, left:4, right:4, height:1.5, backgroundColor:GREEN, borderRadius:1 }} />
                  <View style={{ position:"absolute", top:14, left:4, width:8, height:1.5, backgroundColor:GREEN, borderRadius:1 }} />
                </View>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.exportTitle}>Export Excel Report</Text>
                <Text style={s.exportSub}>Download full report data in Excel format.</Text>
                <View style={{ marginTop:8 }}>
                  <CheckItem label="All deliveries data" />
                  <CheckItem label="Driver performance" />
                  <CheckItem label="Earnings summary" />
                  <CheckItem label="And more..." />
                </View>
              </View>
            </View>
            <XlsxVisual />
          </View>

          <Pressable style={s.exportBtn} android_ripple={{ color:"rgba(255,255,255,0.1)" }}>
            <View style={{ width:18, height:18, alignItems:"center", justifyContent:"center", gap:1 }}>
              <View style={{ width:1.5, height:8, backgroundColor:WHITE, borderRadius:1 }} />
              <View style={{ width:0, height:0, borderLeftWidth:4, borderRightWidth:4, borderTopWidth:5, borderLeftColor:"transparent", borderRightColor:"transparent", borderTopColor:WHITE }} />
              <View style={{ width:12, height:1.5, backgroundColor:WHITE, borderRadius:1, marginTop:2 }} />
            </View>
            <Text style={s.exportBtnText}>Export Excel Report</Text>
          </Pressable>
        </View>

        <View style={{ height:20 }} />
      </ScrollView>

      {/* ── bottom tabs ──────────────────────────────────────────────── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor:TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:BG },
  scroll: { paddingHorizontal:14, paddingBottom:10 },

  header:       { flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingTop:10, paddingBottom:14, gap:10 },
  headerCenter: { flex:1 },
  headerRight:  { flexDirection:"row", gap:8 },
  title:        { fontFamily:"Poppins_700Bold",    fontSize:22, color:WHITE, lineHeight:28 },
  subtitle:     { fontFamily:"Poppins_400Regular", fontSize:11, color:DIM,   lineHeight:16 },
  iconBtn:      { width:40, height:40, borderRadius:20, backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },

  timebar:          { flexDirection:"row", alignItems:"center", marginBottom:14, gap:8 },
  timeTabs:         { flex:1, flexDirection:"row", gap:4 },
  refreshBtn:       { width:34, height:34, borderRadius:10, backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },
  timeTab:          { paddingHorizontal:10, paddingVertical:6, borderRadius:20, borderWidth:1.5, borderColor:BORDER },
  timeTabActive:    { borderColor:ORANGE, backgroundColor:"rgba(255,101,0,0.08)" },
  timeTabText:      { fontFamily:"Poppins_500Medium", fontSize:12, color:MUTED },
  timeTabTextActive:{ color:ORANGE },

  metricsRow: { flexDirection:"row", gap:8, marginBottom:8 },

  card:       { backgroundColor:CARD, borderRadius:16, borderWidth:1, borderColor:BORDER, padding:16, marginBottom:12 },
  cardHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  cardTitle:  { fontFamily:"Poppins_700Bold",    fontSize:16, color:WHITE },
  viewAll:    { fontFamily:"Poppins_500Medium",  fontSize:12, color:BLUE  },
  dailyBtn:   { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:BORDER, backgroundColor:SURFACE },
  dailyText:  { fontFamily:"Poppins_500Medium",  fontSize:12, color:DIM   },

  exportTop:     { flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 },
  exportLeft:    { flex:1, flexDirection:"row", gap:12 },
  exportIconBox: { width:44, height:44, borderRadius:12, backgroundColor:"rgba(34,197,94,0.12)", borderWidth:1, borderColor:"rgba(34,197,94,0.25)", alignItems:"center", justifyContent:"center" },
  exportTitle:   { fontFamily:"Poppins_700Bold",    fontSize:15, color:WHITE, lineHeight:20 },
  exportSub:     { fontFamily:"Poppins_400Regular", fontSize:11, color:DIM,   lineHeight:16, marginTop:2 },
  exportBtn:     { backgroundColor:"#16A34A", borderRadius:12, paddingVertical:15, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 },
  exportBtnText: { fontFamily:"Poppins_700Bold", fontSize:15, color:WHITE },
});
