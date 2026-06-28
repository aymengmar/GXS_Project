import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG      = "#080F1D";
const SURFACE = "#0D1A2E";
const CARD    = "#111E33";
const BORDER  = "rgba(255,255,255,0.07)";
const ORANGE  = "#FF6500";
const GREEN   = "#22C55E";
const RED     = "#EF4444";
const AMBER   = "#F59E0B";
const BLUE    = "#3B82F6";
const PURPLE  = "#8B5CF6";
const TEAL    = "#10B981";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.60)";
const MUTED   = "rgba(255,255,255,0.28)";
const FAINT   = "rgba(255,255,255,0.08)";
const TAB_BG  = "#060C18";

// ─── types ────────────────────────────────────────────────────────────────────
type FilterKey   = "All" | "Pending" | "Approved" | "Rejected";
type InvStatus   = "Pending" | "Approved" | "Rejected";
type InvCategory = "fuel" | "toll" | "maintenance" | "parking";

type Invoice = {
  id:       string;
  category: InvCategory;
  title:    string;
  driver:   string;
  driverId: string;
  date:     string;
  litres?:  string;
  amount:   string;
  invNum:   string;
  status:   InvStatus;
};

// ─── mock data ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AVATAR = require("@/assets/images/avatars/driver1.jpg");

const INVOICES_DATA: Invoice[] = [
  { id:"1", category:"fuel",        title:"Diesel",               driver:"Ali Kaya", driverId:"DRIVER-0123", date:"Jun 17, 2025", litres:"48 L", amount:"€82.56", invNum:"INV-2025-0617-001", status:"Pending"  },
  { id:"2", category:"toll",        title:"Toll A7",              driver:"Ali Kaya", driverId:"DRIVER-0123", date:"Jun 14, 2025",               amount:"€22.50", invNum:"INV-2025-0614-003", status:"Pending"  },
  { id:"3", category:"fuel",        title:"Diesel",               driver:"Ali Kaya", driverId:"DRIVER-0123", date:"Jun 12, 2025", litres:"35 L", amount:"€60.30", invNum:"INV-2025-0612-002", status:"Approved" },
  { id:"4", category:"maintenance", title:"Repair & Maintenance",  driver:"Ali Kaya", driverId:"DRIVER-0123", date:"Jun 8, 2025",                amount:"€56.80", invNum:"INV-2025-0608-001", status:"Approved" },
  { id:"5", category:"parking",     title:"Parking",              driver:"Ali Kaya", driverId:"DRIVER-0123", date:"Jun 6, 2025",                amount:"€15.00", invNum:"INV-2025-0606-004", status:"Rejected" },
  { id:"6", category:"fuel",        title:"Diesel",               driver:"Ali Kaya", driverId:"DRIVER-0123", date:"May 30, 2025", litres:"52 L", amount:"€90.12", invNum:"INV-2025-0530-005", status:"Rejected" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s: InvStatus) {
  switch (s) {
    case "Pending":  return { color: AMBER, bg: "rgba(245,158,11,0.15)" };
    case "Approved": return { color: GREEN, bg: "rgba(34,197,94,0.15)"  };
    case "Rejected": return { color: RED,   bg: "rgba(239,68,68,0.15)"  };
  }
}

function catCfg(c: InvCategory) {
  switch (c) {
    case "fuel":        return { bg: "rgba(255,101,0,0.20)",   color: ORANGE };
    case "toll":        return { bg: "rgba(16,185,129,0.20)",  color: TEAL   };
    case "maintenance": return { bg: "rgba(59,130,246,0.20)",  color: BLUE   };
    case "parking":     return { bg: "rgba(139,92,246,0.20)",  color: PURPLE };
  }
}

function receiptLabel(c: InvCategory) {
  switch (c) {
    case "fuel":        return "FUEL\nRECEIPT";
    case "toll":        return "TOLL\nRECEIPT";
    case "maintenance": return "REPAIR\nRECEIPT";
    case "parking":     return "PARKING\nRECEIPT";
  }
}

// ─── category icons ───────────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: InvCategory }) {
  const cfg = catCfg(category);
  const emoji =
    category === "fuel"        ? "⛽" :
    category === "toll"        ? "🛣️" :
    category === "maintenance" ? "🔧" :
                                 "🅿️";
  return (
    <View style={[ic.box, { backgroundColor: cfg.bg }]}>
      <Text style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</Text>
    </View>
  );
}

const ic = StyleSheet.create({
  box: { width:52, height:52, borderRadius:14, alignItems:"center", justifyContent:"center", flexShrink:0 },
});

// ─── receipt thumbnail ────────────────────────────────────────────────────────
function ReceiptCard({ category, amount }: { category: InvCategory; amount: string }) {
  const label = receiptLabel(category);
  return (
    <View style={rt.wrap}>
      <Text style={rt.header}>{label}</Text>
      {["Item A   €10.00", "Item B    €8.00", "Item C   €6.50"].map((l, i) => (
        <Text key={i} style={rt.line} numberOfLines={1}>{l}</Text>
      ))}
      <View style={rt.divider} />
      <Text style={rt.total}>Total  {amount}</Text>
    </View>
  );
}

const rt = StyleSheet.create({
  wrap:    { width:80, backgroundColor:"#F5F5F0", borderRadius:6, padding:5, flexShrink:0 },
  header:  { fontSize:6.5, fontFamily:"Poppins_700Bold",    color:"#222", textAlign:"center", lineHeight:9, marginBottom:3 },
  line:    { fontSize:5,   fontFamily:"Poppins_400Regular", color:"#444", lineHeight:7 },
  divider: { height:0.5, backgroundColor:"#bbb", marginVertical:3 },
  total:   { fontSize:5.5, fontFamily:"Poppins_700Bold", color:"#222" },
});

// ─── dots ⋮ ───────────────────────────────────────────────────────────────────
function DotsV() {
  return (
    <View style={{ gap:3, alignItems:"center", padding:4 }}>
      {[0,1,2].map(i => <View key={i} style={{ width:3, height:3, borderRadius:1.5, backgroundColor:MUTED }} />)}
    </View>
  );
}

// ─── status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InvStatus }) {
  const cfg = statusCfg(status);
  return (
    <View style={[sb.wrap, { backgroundColor:cfg.bg }]}>
      <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:cfg.color, alignItems:"center", justifyContent:"center" }}>
        {status === "Pending"  && <View style={{ width:1.5, height:6, backgroundColor:cfg.color, borderRadius:1 }} />}
        {status === "Approved" && (
          <>
            <View style={{ position:"absolute", width:4, height:1.5, backgroundColor:cfg.color, borderRadius:1, transform:[{rotate:"45deg"},{translateX:-1.5},{translateY:0.5}] }} />
            <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:cfg.color, borderRadius:1, transform:[{rotate:"-50deg"},{translateX:1}] }} />
          </>
        )}
        {status === "Rejected" && (
          <>
            <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:cfg.color, transform:[{rotate:"45deg"}], borderRadius:1 }} />
            <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:cfg.color, transform:[{rotate:"-45deg"}], borderRadius:1 }} />
          </>
        )}
      </View>
      <Text style={[sb.text, { color:cfg.color }]}>{status}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:9, paddingVertical:5, borderRadius:20 },
  text: { fontFamily:"Poppins_600SemiBold", fontSize:11, lineHeight:15 },
});

// ─── action button ────────────────────────────────────────────────────────────
function ActionBtn({ status, onPress }: { status: InvStatus; onPress: () => void }) {
  const isPending = status === "Pending";
  return (
    <Pressable style={[ab.btn, { borderColor: isPending ? ORANGE : BLUE }]} onPress={onPress}>
      <Text style={[ab.text, { color: isPending ? ORANGE : BLUE }]}>
        {isPending ? "Review" : "View"}
      </Text>
    </Pressable>
  );
}

const ab = StyleSheet.create({
  btn:  { paddingHorizontal:18, paddingVertical:7, borderRadius:8, borderWidth:1.5, alignItems:"center" },
  text: { fontFamily:"Poppins_600SemiBold", fontSize:12, lineHeight:17 },
});

// ─── invoice card ─────────────────────────────────────────────────────────────
function InvoiceCard({ inv, onReview }: { inv: Invoice; onReview: () => void }) {
  return (
    <View style={iv.card}>
      <View style={iv.topRow}>
        <CategoryIcon category={inv.category} />

        <View style={iv.info}>
          <View style={iv.nameRow}>
            <Image source={AVATAR} style={iv.avatar} />
            <View style={{ flex:1 }}>
              <Text style={iv.title} numberOfLines={1}>{inv.title}</Text>
              <View style={iv.driverRow}>
                <Text style={iv.driverName}>{inv.driver} · </Text>
                <Text style={iv.driverId}>{inv.driverId}</Text>
              </View>
            </View>
          </View>

          <View style={iv.metaRow}>
            <View style={iv.calDot} />
            <Text style={iv.meta}>{inv.date}</Text>
            {inv.litres && <><Text style={iv.sep}>·</Text><Text style={iv.meta}>{inv.litres}</Text></>}
            <Text style={iv.sep}>·</Text>
            <Text style={iv.amount}>{inv.amount}</Text>
          </View>

          <Text style={iv.invNum}>Invoice # {inv.invNum}</Text>
        </View>

        <View style={iv.rightCol}>
          <DotsV />
          <ReceiptCard category={inv.category} amount={inv.amount} />
        </View>
      </View>

      <View style={iv.bottomRow}>
        <View style={{ flex:1 }} />
        <StatusBadge status={inv.status} />
        <ActionBtn   status={inv.status} onPress={onReview} />
      </View>
    </View>
  );
}

const iv = StyleSheet.create({
  card:       { backgroundColor:CARD, borderRadius:16, borderWidth:1, borderColor:BORDER, padding:14, marginBottom:12, gap:12 },
  topRow:     { flexDirection:"row", gap:10, alignItems:"flex-start" },
  info:       { flex:1, gap:5 },
  nameRow:    { flexDirection:"row", alignItems:"center", gap:8 },
  avatar:     { width:30, height:30, borderRadius:15, backgroundColor:FAINT, flexShrink:0 },
  title:      { fontFamily:"Poppins_600SemiBold", fontSize:13, color:WHITE, lineHeight:18 },
  driverRow:  { flexDirection:"row", alignItems:"center" },
  driverName: { fontFamily:"Poppins_400Regular", fontSize:10.5, color:DIM },
  driverId:   { fontFamily:"Poppins_600SemiBold", fontSize:10.5, color:ORANGE },
  metaRow:    { flexDirection:"row", alignItems:"center", gap:4, flexWrap:"wrap" },
  calDot:     { width:8, height:8, borderWidth:1, borderColor:MUTED, borderRadius:2 },
  meta:       { fontFamily:"Poppins_400Regular", fontSize:10.5, color:DIM },
  sep:        { fontFamily:"Poppins_400Regular", fontSize:10.5, color:MUTED },
  amount:     { fontFamily:"Poppins_600SemiBold", fontSize:10.5, color:WHITE },
  invNum:     { fontFamily:"Poppins_400Regular", fontSize:10, color:MUTED },
  rightCol:   { alignItems:"flex-end", gap:4, flexShrink:0 },
  bottomRow:  { flexDirection:"row", alignItems:"center", gap:8 },
});

// ─── stats row (5 cards, no scroll) ──────────────────────────────────────────
type StatCard = {
  label:      string;
  value:      string;
  sub?:       string;
  subColor?:  string;
  iconColor:  string;
  iconBg:     string;
  iconType:   "doc" | "clock" | "check" | "x" | "wallet";
};

const STATS: StatCard[] = [
  { label:"Total Invoices", value:"24",         iconType:"doc",    iconColor:BLUE,   iconBg:"rgba(59,130,246,0.18)"  },
  { label:"Pending",        value:"8",          iconType:"clock",  iconColor:AMBER,  iconBg:"rgba(245,158,11,0.18)"  },
  { label:"Approved",       value:"12", sub:"€1,920.45", subColor:GREEN,  iconType:"check", iconColor:GREEN,  iconBg:"rgba(34,197,94,0.18)"   },
  { label:"Rejected",       value:"4",  sub:"€287.30",   subColor:RED,    iconType:"x",     iconColor:RED,    iconBg:"rgba(239,68,68,0.18)"   },
  { label:"Total Amount",   value:"€3,840.00",  sub:"This Month",  iconType:"wallet", iconColor:PURPLE, iconBg:"rgba(139,92,246,0.18)" },
];

function StatIcon({ type, color }: { type: StatCard["iconType"]; color: string }) {
  const s = 18; // icon container size
  if (type === "doc") return (
    <View style={{ width:s-2, height:s+2 }}>
      <View style={{ width:s-2, height:s+2, borderWidth:1.8, borderColor:color, borderRadius:3 }} />
      <View style={{ position:"absolute", top:4,  left:3, right:3, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:8,  left:3, right:3, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:12, left:3, width:6,  height:1.5, backgroundColor:color, borderRadius:1 }} />
    </View>
  );
  if (type === "clock") return (
    <View style={{ width:s, height:s, borderRadius:s/2, borderWidth:1.8, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:1.5, height:6, backgroundColor:color, borderRadius:1, bottom:"50%", marginBottom:-0.5 }} />
      <View style={{ position:"absolute", width:5, height:1.5, backgroundColor:color, borderRadius:1, left:"50%", top:"50%", marginTop:-0.75 }} />
    </View>
  );
  if (type === "check") return (
    <View style={{ width:s, height:s, borderRadius:s/2, borderWidth:1.8, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:4, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"45deg"},{translateX:-1.5},{translateY:1}] }} />
      <View style={{ position:"absolute", width:8, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"-50deg"},{translateX:1.5}] }} />
    </View>
  );
  if (type === "x") return (
    <View style={{ width:s, height:s, borderRadius:s/2, borderWidth:1.8, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:9, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"45deg"}] }} />
      <View style={{ position:"absolute", width:9, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"-45deg"}] }} />
    </View>
  );
  // wallet
  return (
    <View style={{ width:s+2, height:s-2 }}>
      <View style={{ width:s+2, height:s-2, borderWidth:1.8, borderColor:color, borderRadius:4 }} />
      <View style={{ position:"absolute", right:3, top:3, width:8, height:8, borderRadius:4, borderWidth:1.8, borderColor:color, backgroundColor:CARD }} />
    </View>
  );
}

function StatCardView({ card }: { card: StatCard }) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor:card.iconBg }]}>
        <StatIcon type={card.iconType} color={card.iconColor} />
      </View>
      <Text style={sc.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{card.value}</Text>
      <Text style={sc.label} numberOfLines={2}>{card.label}</Text>
      {card.sub && <Text style={[sc.sub, card.subColor ? { color:card.subColor } : {}]} numberOfLines={1}>{card.sub}</Text>}
    </View>
  );
}

const sc = StyleSheet.create({
  card:     { flex:1, backgroundColor:CARD, borderRadius:12, borderWidth:1, borderColor:BORDER, padding:9, gap:3 },
  iconWrap: { width:32, height:32, borderRadius:9, alignItems:"center", justifyContent:"center", marginBottom:2 },
  value:    { fontFamily:"Poppins_700Bold",     fontSize:16, color:WHITE, lineHeight:20 },
  label:    { fontFamily:"Poppins_400Regular",  fontSize:9,  color:DIM,   lineHeight:13 },
  sub:      { fontFamily:"Poppins_600SemiBold", fontSize:9,  color:MUTED, lineHeight:13 },
});

// ─── filter chips ─────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; icon: "all" | "clock" | "check" | "x" }[] = [
  { key:"All",      icon:"all"   },
  { key:"Pending",  icon:"clock" },
  { key:"Approved", icon:"check" },
  { key:"Rejected", icon:"x"    },
];

function ChipIcon({ type, color }: { type: "all"|"clock"|"check"|"x"; color: string }) {
  if (type === "all") return null;
  if (type === "clock") return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:1.5, height:4, backgroundColor:color, borderRadius:1, bottom:"50%", marginBottom:-0.5 }} />
      <View style={{ position:"absolute", width:3, height:1.5, backgroundColor:color, borderRadius:1, left:"50%", top:"50%", marginTop:-0.75 }} />
    </View>
  );
  if (type === "check") return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:4, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"45deg"},{translateX:-1},{translateY:1}] }} />
      <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"-50deg"},{translateX:1}] }} />
    </View>
  );
  return (
    <View style={{ width:13, height:13, borderRadius:6.5, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
      <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"45deg"}] }} />
      <View style={{ position:"absolute", width:7, height:1.5, backgroundColor:color, borderRadius:1, transform:[{rotate:"-45deg"}] }} />
    </View>
  );
}

// ─── tab icons ────────────────────────────────────────────────────────────────
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

function ChartIcon({ color }: { color: string }) {
  return (
    <View style={{ width:20, height:18, flexDirection:"row", alignItems:"flex-end", gap:3 }}>
      {[9,16,7,13].map((h,i) => <View key={i} style={{ width:3, height:h, backgroundColor:color, borderRadius:2 }} />)}
    </View>
  );
}

// ─── bottom tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { label:"Dashboard", Icon:GridIcon       },
  { label:"Users",     Icon:PeopleIcon     },
  { label:"Invoices",  Icon:InvoiceTabIcon },
  { label:"Reports",   Icon:ChartIcon      },
] as const;

function BottomTabs({ onPress }: { onPress: (i:number) => void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(({ label, Icon }, i) => {
        const active = i === 2;
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

// ─── header icons ─────────────────────────────────────────────────────────────
function MenuIcon() {
  return (
    <View style={{ gap:4 }}>
      {[18,18,12].map((w,i) => <View key={i} style={{ width:w, height:2, backgroundColor:WHITE, borderRadius:1 }} />)}
    </View>
  );
}

function FilterIcon() {
  return (
    <View style={{ width:17, height:14, gap:4, justifyContent:"center" }}>
      <View style={{ width:17, height:2, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:11, height:2, backgroundColor:WHITE, borderRadius:1, alignSelf:"center" }} />
      <View style={{ width:6,  height:2, backgroundColor:WHITE, borderRadius:1, alignSelf:"center" }} />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={{ width:18, height:18, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:12, height:12, borderRadius:6, borderWidth:2, borderColor:WHITE }} />
      <View style={{ position:"absolute", bottom:0, right:0, width:6, height:2, backgroundColor:WHITE, borderRadius:1, transform:[{rotate:"40deg"}] }} />
    </View>
  );
}

// ─── receipt preview (inside modal) ──────────────────────────────────────────

type ReceiptRow = [string, string];

function ReceiptPreview({ inv }: { inv: Invoice }) {
  const titleMap: Record<InvCategory, string> = {
    fuel:        "FUEL INVOICE",
    toll:        "TOLL INVOICE",
    maintenance: "MAINTENANCE INVOICE",
    parking:     "PARKING INVOICE",
  };
  const brandMap: Record<InvCategory, string> = {
    fuel:        "TotalEnergies",
    toll:        "Autobahn GmbH",
    maintenance: "Auto Service GmbH",
    parking:     "City Parking HH",
  };
  const leftMap: Record<InvCategory, ReceiptRow[]> = {
    fuel:        [["Station:", "TotalEnergies"], ["Location:", "Berlin, Germany"], ["Date:", inv.date], ["Invoice #:", inv.invNum]],
    toll:        [["Route:", "A7 Hamburg-Nord"], ["Date:", inv.date], ["Invoice #:", inv.invNum]],
    maintenance: [["Workshop:", "Auto Service GmbH"], ["Odometer:", "148,320 km"], ["Date:", inv.date], ["Invoice #:", inv.invNum]],
    parking:     [["Location:", "Parkhaus City HH"], ["Duration:", "4h 30min"], ["Date:", inv.date], ["Invoice #:", inv.invNum]],
  };
  const rightMap: Record<InvCategory, ReceiptRow[]> = {
    fuel:        [["Item", "Diesel (L)"], ["Qty", inv.litres ?? "—"], ["Price", "€1.72"], ["Total", inv.amount]],
    toll:        [["Item", "Highway Toll"], ["Section", "A7"], ["Total", inv.amount]],
    maintenance: [["Item", "Repair & Parts"], ["Labour", "€24.80"], ["Parts", "€32.00"], ["Total", inv.amount]],
    parking:     [["Item", "Parking Fee"], ["Rate", "€3.00/h"], ["Total", inv.amount]],
  };

  return (
    <View style={rp.card}>
      <Text style={rp.heading}>{titleMap[inv.category]}</Text>
      <Text style={rp.brand}>{brandMap[inv.category]}</Text>
      <View style={rp.body}>
        <View style={rp.leftCol}>
          {leftMap[inv.category].map(([k, v]) => (
            <View key={k} style={rp.leftRow}>
              <Text style={rp.lKey}>{k}</Text>
              <Text style={rp.lVal}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={rp.vLine} />
        <View style={rp.rightCol}>
          {rightMap[inv.category].map(([k, v], idx) => (
            <View key={k} style={rp.rightRow}>
              <Text style={idx === 0 ? rp.rHdr : rp.rKey}>{k}</Text>
              <Text style={idx === 0 ? rp.rHdr : rp.rVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={rp.line} />
      {([ ["Subtotal", inv.amount], ["VAT (19%)", "€0.00"] ] as ReceiptRow[]).map(([k, v]) => (
        <View key={k} style={rp.sumRow}>
          <Text style={rp.sumKey}>{k}</Text>
          <Text style={rp.sumVal}>{v}</Text>
        </View>
      ))}
      <View style={rp.sumRow}>
        <Text style={rp.sumKeyBold}>Total</Text>
        <Text style={rp.sumValBold}>{inv.amount}</Text>
      </View>
    </View>
  );
}

const rp = StyleSheet.create({
  card:       { backgroundColor:"#F5F5F0", borderRadius:12, padding:14 },
  heading:    { fontFamily:"Poppins_700Bold",    fontSize:13, color:"#111", textAlign:"center", marginBottom:4 },
  brand:      { fontFamily:"Poppins_600SemiBold",fontSize:10, color:"#E30613", marginBottom:10 },
  body:       { flexDirection:"row", gap:8, marginBottom:10 },
  leftCol:    { flex:1.2, gap:3 },
  leftRow:    { flexDirection:"row", gap:3 },
  lKey:       { fontFamily:"Poppins_400Regular", fontSize:9,  color:"#666", width:58 },
  lVal:       { fontFamily:"Poppins_500Medium",  fontSize:9,  color:"#222", flex:1 },
  vLine:      { width:0.5, backgroundColor:"#CCC" },
  rightCol:   { flex:1, gap:3 },
  rightRow:   { flexDirection:"row", justifyContent:"space-between" },
  rHdr:       { fontFamily:"Poppins_600SemiBold",fontSize:9,  color:"#555" },
  rKey:       { fontFamily:"Poppins_400Regular", fontSize:9,  color:"#555" },
  rVal:       { fontFamily:"Poppins_500Medium",  fontSize:9,  color:"#222" },
  line:       { height:0.5, backgroundColor:"#CCC", marginBottom:8 },
  sumRow:     { flexDirection:"row", justifyContent:"flex-end", gap:24, marginBottom:2 },
  sumKey:     { fontFamily:"Poppins_400Regular",  fontSize:10, color:"#555" },
  sumVal:     { fontFamily:"Poppins_400Regular",  fontSize:10, color:"#222", width:55, textAlign:"right" },
  sumKeyBold: { fontFamily:"Poppins_700Bold",     fontSize:11, color:"#111" },
  sumValBold: { fontFamily:"Poppins_700Bold",     fontSize:11, color:"#111", width:55, textAlign:"right" },
});

// ─── review modal ─────────────────────────────────────────────────────────────

type ActionCfg = { color: string; title: string; message: string };
function actionCfg(s: InvStatus): ActionCfg {
  switch (s) {
    case "Approved": return { color: GREEN,  title: "Approve Invoice", message: "Are you sure you want to approve this invoice? This will be recorded in the driver's account." };
    case "Rejected": return { color: RED,    title: "Reject Invoice",  message: "Are you sure you want to reject this invoice? The driver will be notified to resubmit." };
    case "Pending":  return { color: AMBER,  title: "Set to Pending",  message: "Are you sure you want to move this invoice back to pending review?" };
  }
}

function ReviewModal({ inv, onClose, onAction }: {
  inv:      Invoice | null;
  onClose:  () => void;
  onAction: (status: InvStatus) => void;
}) {
  const [confirmAction, setConfirmAction] = useState<InvStatus | null>(null);
  const scfg = inv ? statusCfg(inv.status) : { color: AMBER, bg: "rgba(245,158,11,0.15)" };

  return (
    <Modal visible={inv !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rm.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={rm.sheet}>

          {/* drag handle */}
          <View style={rm.handle} />
          {/* close button */}
          <Pressable style={rm.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={rm.closeX}>✕</Text>
          </Pressable>

          {inv && (
            <ScrollView style={rm.scroll} contentContainerStyle={rm.pad} showsVerticalScrollIndicator={false}>
              <Text style={rm.title}>Review Invoice</Text>
              <Text style={rm.subTitle}>Please review the invoice and take action</Text>

              {/* driver */}
              <View style={rm.driverRow}>
                <Image source={AVATAR} style={rm.driverAvatar} />
                <View style={{ gap:3 }}>
                  <Text style={rm.driverName}>{inv.driver}</Text>
                  <Text style={rm.driverIdLine}>
                    {"ID: "}<Text style={{ color:ORANGE }}>{inv.driverId}</Text>
                  </Text>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
                    <Text style={{ fontSize:13 }}>🚗</Text>
                    <Text style={rm.driverTypeTxt}>Company Car Driver</Text>
                  </View>
                </View>
              </View>

              {/* 3-col info card */}
              <View style={rm.infoCard}>
                {/* Invoice Type */}
                <View style={rm.infoCol}>
                  <View style={[rm.infoBox, { backgroundColor:"rgba(139,92,246,0.15)" }]}>
                    <View style={{ width:14, height:16 }}>
                      <View style={{ width:14, height:16, borderWidth:1.5, borderColor:PURPLE, borderRadius:3 }} />
                      <View style={{ position:"absolute", top:4,  left:2, right:2, height:1.5, backgroundColor:PURPLE, borderRadius:1 }} />
                      <View style={{ position:"absolute", top:8,  left:2, right:2, height:1.5, backgroundColor:PURPLE, borderRadius:1 }} />
                      <View style={{ position:"absolute", top:12, left:2, width:5, height:1.5, backgroundColor:PURPLE, borderRadius:1 }} />
                    </View>
                  </View>
                  <Text style={rm.infoLbl}>Invoice Type</Text>
                  <Text style={rm.infoVal} numberOfLines={2}>{inv.title}</Text>
                </View>
                <View style={rm.infoDivider} />
                {/* Uploaded On */}
                <View style={rm.infoCol}>
                  <View style={[rm.infoBox, { backgroundColor:"rgba(59,130,246,0.15)" }]}>
                    <View style={{ width:16, height:14 }}>
                      <View style={{ position:"absolute", bottom:0, width:16, height:11, borderWidth:1.5, borderColor:BLUE, borderRadius:3 }} />
                      <View style={{ position:"absolute", top:0, left:2,  width:3, height:5, backgroundColor:BLUE, borderRadius:1 }} />
                      <View style={{ position:"absolute", top:0, right:2, width:3, height:5, backgroundColor:BLUE, borderRadius:1 }} />
                      <View style={{ position:"absolute", top:5, left:2, right:2, height:1.5, backgroundColor:BLUE, borderRadius:1 }} />
                    </View>
                  </View>
                  <Text style={rm.infoLbl}>Uploaded On</Text>
                  <Text style={rm.infoVal}>{inv.date}</Text>
                  <Text style={rm.infoVal}>09:15 AM</Text>
                </View>
                <View style={rm.infoDivider} />
                {/* Status */}
                <View style={rm.infoCol}>
                  <View style={[rm.infoBox, { backgroundColor:"rgba(245,158,11,0.15)" }]}>
                    <View style={{ width:16, height:16, borderRadius:8, borderWidth:1.5, borderColor:AMBER, alignItems:"center", justifyContent:"center" }}>
                      <View style={{ position:"absolute", width:1.5, height:5, backgroundColor:AMBER, borderRadius:1, bottom:"50%", marginBottom:-0.5 }} />
                      <View style={{ position:"absolute", width:4, height:1.5, backgroundColor:AMBER, borderRadius:1, left:"50%", top:"50%", marginTop:-0.75 }} />
                    </View>
                  </View>
                  <Text style={rm.infoLbl}>Status</Text>
                  <View style={[rm.statusPill, { borderColor:scfg.color, backgroundColor:scfg.bg }]}>
                    <Text style={[rm.statusPillTxt, { color:scfg.color }]}>
                      {inv.status === "Pending" ? "Pending Review" : inv.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* receipt preview */}
              <Text style={rm.previewLbl}>Invoice Preview</Text>
              <ReceiptPreview inv={inv} />

              {/* page indicator */}
              <View style={{ alignItems:"center", marginTop:10 }}>
                <View style={rm.pagePill}>
                  <Text style={rm.pageText}>1 / 1</Text>
                </View>
              </View>

              {/* note box */}
              <View style={rm.noteBox}>
                <View style={rm.noteRing}>
                  <Text style={rm.noteI}>i</Text>
                </View>
                <Text style={rm.noteText}>Please check if the invoice is readable, valid and matches the driver information.</Text>
              </View>
            </ScrollView>
          )}

          {/* action buttons */}
          <View style={rm.btnRow}>
            <Pressable style={[rm.actionBtn, { borderColor:RED }]} onPress={() => setConfirmAction("Rejected")}>
              <View style={[rm.btnIcon, { borderColor:RED }]}>
                <View style={{ position:"absolute", width:9, height:1.8, backgroundColor:RED,   borderRadius:1, transform:[{rotate:"45deg"}] }} />
                <View style={{ position:"absolute", width:9, height:1.8, backgroundColor:RED,   borderRadius:1, transform:[{rotate:"-45deg"}] }} />
              </View>
              <Text style={[rm.btnLabel, { color:RED }]}>Reject</Text>
            </Pressable>
            <Pressable style={[rm.actionBtn, { borderColor:AMBER }]} onPress={() => setConfirmAction("Pending")}>
              <View style={[rm.btnIcon, { borderColor:AMBER }]}>
                <View style={{ position:"absolute", width:1.5, height:6,   backgroundColor:AMBER, borderRadius:1, bottom:"50%", marginBottom:-0.5 }} />
                <View style={{ position:"absolute", width:4,   height:1.5, backgroundColor:AMBER, borderRadius:1, left:"50%",  top:"50%",   marginTop:-0.75 }} />
              </View>
              <Text style={[rm.btnLabel, { color:AMBER }]}>Pending</Text>
            </Pressable>
            <Pressable style={[rm.actionBtn, { borderColor:GREEN }]} onPress={() => setConfirmAction("Approved")}>
              <View style={[rm.btnIcon, { borderColor:GREEN }]}>
                <View style={{ position:"absolute", width:5, height:1.8, backgroundColor:GREEN, borderRadius:1, transform:[{rotate:"45deg"},{translateX:-2},{translateY:1}] }} />
                <View style={{ position:"absolute", width:9, height:1.8, backgroundColor:GREEN, borderRadius:1, transform:[{rotate:"-50deg"},{translateX:1.5}] }} />
              </View>
              <Text style={[rm.btnLabel, { color:GREEN }]}>Approve</Text>
            </Pressable>
          </View>

          {/* ── confirmation overlay ────────────────────────────── */}
          {confirmAction && (() => {
            const cfg = actionCfg(confirmAction);
            return (
              <View style={cf.overlay}>
                <View style={cf.card}>
                  <View style={[cf.iconRing, { borderColor:cfg.color, backgroundColor:`${cfg.color}20` }]}>
                    {confirmAction === "Approved" && (
                      <>
                        <View style={{ position:"absolute", width:7,  height:2.5, backgroundColor:cfg.color, borderRadius:1.5, transform:[{rotate:"45deg"},{translateX:-3},{translateY:2}] }} />
                        <View style={{ position:"absolute", width:13, height:2.5, backgroundColor:cfg.color, borderRadius:1.5, transform:[{rotate:"-50deg"},{translateX:2}] }} />
                      </>
                    )}
                    {confirmAction === "Rejected" && (
                      <>
                        <View style={{ position:"absolute", width:13, height:2.5, backgroundColor:cfg.color, borderRadius:1.5, transform:[{rotate:"45deg"}] }} />
                        <View style={{ position:"absolute", width:13, height:2.5, backgroundColor:cfg.color, borderRadius:1.5, transform:[{rotate:"-45deg"}] }} />
                      </>
                    )}
                    {confirmAction === "Pending" && (
                      <>
                        <View style={{ position:"absolute", width:2.5, height:9,   backgroundColor:cfg.color, borderRadius:1.5, bottom:"50%", marginBottom:-1 }} />
                        <View style={{ position:"absolute", width:7,   height:2.5, backgroundColor:cfg.color, borderRadius:1.5, left:"50%",  top:"50%",  marginTop:-1.25 }} />
                      </>
                    )}
                  </View>
                  <Text style={[cf.title, { color:cfg.color }]}>{cfg.title}</Text>
                  <Text style={cf.message}>{cfg.message}</Text>
                  <View style={cf.btnRow}>
                    <Pressable style={cf.cancelBtn} onPress={() => setConfirmAction(null)}>
                      <Text style={cf.cancelTxt}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[cf.confirmBtn, { backgroundColor:cfg.color }]}
                      onPress={() => { onAction(confirmAction); setConfirmAction(null); }}
                    >
                      <Text style={cf.confirmTxt}>Confirm</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })()}

        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay:      { flex:1, backgroundColor:"rgba(0,0,0,0.75)", justifyContent:"flex-end" },
  sheet:        { backgroundColor:"#0A1525", borderTopLeftRadius:24, borderTopRightRadius:24, overflow:"hidden" },
  handle:       { width:42, height:4, backgroundColor:"rgba(255,255,255,0.22)", borderRadius:2, alignSelf:"center", marginTop:10, marginBottom:2 },
  closeBtn:     { position:"absolute", top:12, right:16, width:34, height:34, borderRadius:17, backgroundColor:"rgba(255,255,255,0.10)", alignItems:"center", justifyContent:"center", zIndex:10 },
  closeX:       { color:WHITE, fontSize:16, lineHeight:22 },
  scroll:       { maxHeight:"68%" },
  pad:          { paddingHorizontal:20, paddingTop:14, paddingBottom:10, gap:14 },
  title:        { fontFamily:"Poppins_700Bold",    fontSize:24, color:WHITE, lineHeight:30 },
  subTitle:     { fontFamily:"Poppins_400Regular", fontSize:13, color:DIM,   marginTop:-6 },
  driverRow:    { flexDirection:"row", alignItems:"center", gap:14 },
  driverAvatar: { width:64, height:64, borderRadius:32 },
  driverName:   { fontFamily:"Poppins_700Bold",    fontSize:18, color:WHITE },
  driverIdLine: { fontFamily:"Poppins_400Regular", fontSize:13, color:DIM },
  driverTypeTxt:{ fontFamily:"Poppins_400Regular", fontSize:12, color:DIM },
  infoCard:     { flexDirection:"row", backgroundColor:CARD, borderRadius:14, borderWidth:1, borderColor:BORDER, padding:12 },
  infoCol:      { flex:1, alignItems:"center", gap:6 },
  infoDivider:  { width:1, backgroundColor:BORDER, marginVertical:4 },
  infoBox:      { width:38, height:38, borderRadius:10, alignItems:"center", justifyContent:"center" },
  infoLbl:      { fontFamily:"Poppins_400Regular",  fontSize:10, color:DIM,   textAlign:"center" },
  infoVal:      { fontFamily:"Poppins_600SemiBold", fontSize:11, color:WHITE, textAlign:"center", lineHeight:16 },
  statusPill:   { paddingHorizontal:7, paddingVertical:3, borderRadius:20, borderWidth:1.5 },
  statusPillTxt:{ fontFamily:"Poppins_600SemiBold", fontSize:9.5 },
  previewLbl:   { fontFamily:"Poppins_600SemiBold", fontSize:15, color:WHITE },
  pagePill:     { paddingHorizontal:16, paddingVertical:5, backgroundColor:SURFACE, borderRadius:20, borderWidth:1, borderColor:BORDER },
  pageText:     { fontFamily:"Poppins_500Medium", fontSize:12, color:DIM },
  noteBox:      { flexDirection:"row", alignItems:"flex-start", gap:10, backgroundColor:"rgba(59,130,246,0.10)", borderRadius:12, borderWidth:1, borderColor:"rgba(59,130,246,0.25)", padding:13 },
  noteRing:     { width:26, height:26, borderRadius:13, backgroundColor:"rgba(59,130,246,0.3)", alignItems:"center", justifyContent:"center", flexShrink:0 },
  noteI:        { fontFamily:"Poppins_700Bold", fontSize:14, color:BLUE, lineHeight:20 },
  noteText:     { fontFamily:"Poppins_400Regular", fontSize:12, color:DIM, flex:1, lineHeight:18 },
  btnRow:       { flexDirection:"row", gap:8, paddingHorizontal:16, paddingTop:12, paddingBottom:28, borderTopWidth:1, borderTopColor:BORDER },
  actionBtn:    { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, paddingVertical:14, borderRadius:12, borderWidth:1.5 },
  btnIcon:      { width:18, height:18, borderRadius:9, borderWidth:1.8, alignItems:"center", justifyContent:"center" },
  btnLabel:     { fontFamily:"Poppins_600SemiBold", fontSize:13 },
});

const cf = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center", zIndex:20, padding:24 },
  card:       { width:"100%", backgroundColor:"#0D1A2E", borderRadius:20, borderWidth:1, borderColor:BORDER, padding:24, alignItems:"center", gap:12 },
  iconRing:   { width:64, height:64, borderRadius:32, borderWidth:2, alignItems:"center", justifyContent:"center", marginBottom:4 },
  title:      { fontFamily:"Poppins_700Bold",    fontSize:18, textAlign:"center" },
  message:    { fontFamily:"Poppins_400Regular", fontSize:13, color:DIM, textAlign:"center", lineHeight:20 },
  btnRow:     { flexDirection:"row", gap:12, marginTop:8, width:"100%" },
  cancelBtn:  { flex:1, paddingVertical:13, borderRadius:12, borderWidth:1.5, borderColor:BORDER, alignItems:"center" },
  cancelTxt:  { fontFamily:"Poppins_600SemiBold", fontSize:14, color:DIM },
  confirmBtn: { flex:1, paddingVertical:13, borderRadius:12, alignItems:"center" },
  confirmTxt: { fontFamily:"Poppins_700Bold", fontSize:14, color:WHITE },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminInvoicesScreen() {
  const router                          = useRouter();
  const [filter, setFilter]             = useState<FilterKey>("All");
  const [invoices, setInvoices]         = useState<Invoice[]>(INVOICES_DATA);
  const [selectedInv, setSelectedInv]   = useState<Invoice | null>(null);

  const filtered = invoices.filter(inv => filter === "All" || inv.status === filter);

  const handleAction = (newStatus: InvStatus) => {
    if (!selectedInv) return;
    setInvoices(prev => prev.map(inv => inv.id === selectedInv.id ? { ...inv, status: newStatus } : inv));
    setSelectedInv(null);
  };

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"           as any);
    if (i === 1) router.replace("/admin/drivers"   as any);
    if (i === 3) router.replace("/admin/reports"   as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} hitSlop={10}><MenuIcon /></Pressable>
        <View style={s.headerCenter}>
          <Text style={s.title}>Invoices</Text>
          <Text style={s.subtitle}>Review and approve driver invoices</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={s.iconBtn} hitSlop={10}><FilterIcon /></Pressable>
          <Pressable style={s.iconBtn} hitSlop={10}><SearchIcon /></Pressable>
        </View>
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── stats row — all 5 fit on screen, no scrolling ──────── */}
        <View style={s.statsRow}>
          {STATS.map(card => <StatCardView key={card.label} card={card} />)}
        </View>

        {/* ── filter chips ────────────────────────────────────────── */}
        <View style={s.chipRow}>
          {FILTERS.map(({ key, icon }) => {
            const active = filter === key;
            const color  = active ? ORANGE : DIM;
            return (
              <Pressable key={key} style={[s.chip, active && s.chipActive]} onPress={() => setFilter(key)}>
                <ChipIcon type={icon} color={color} />
                <Text style={[s.chipText, { color }]}>{key}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── invoice list ─────────────────────────────────────────── */}
        {filtered.map(inv => <InvoiceCard key={inv.id} inv={inv} onReview={() => setSelectedInv(inv)} />)}

        {/* ── bottom info card ─────────────────────────────────────── */}
        <View style={s.infoCard}>
          <View style={{ alignItems:"center", flexShrink:0 }}>
            <View style={{ width:18, height:16, borderWidth:1.8, borderColor:BLUE, borderRadius:4, borderBottomLeftRadius:0, borderBottomRightRadius:0 }} />
            <View style={{ width:10, height:7, borderWidth:1.8, borderColor:BLUE, borderTopWidth:0, borderBottomLeftRadius:4, borderBottomRightRadius:4, marginTop:-1 }} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.infoTitle}>All invoices are verified for accuracy</Text>
            <Text style={s.infoSub}>Please review the details and receipts before approving or rejecting.</Text>
          </View>
          <View style={{ width:7, height:7, borderRightWidth:1.5, borderTopWidth:1.5, borderColor:MUTED, transform:[{rotate:"45deg"}] }} />
        </View>

        <View style={{ height:20 }} />
      </ScrollView>

      {/* ── tab bar ─────────────────────────────────────────────────── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor:TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>

      {/* ── review modal ────────────────────────────────────────────── */}
      <ReviewModal inv={selectedInv} onClose={() => setSelectedInv(null)} onAction={handleAction} />
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:BG },
  scroll:       { paddingHorizontal:14, paddingBottom:10 },

  header:       { flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingTop:10, paddingBottom:14, gap:10 },
  headerCenter: { flex:1 },
  headerRight:  { flexDirection:"row", gap:8 },
  title:        { fontFamily:"Poppins_700Bold",    fontSize:22, color:WHITE, lineHeight:28 },
  subtitle:     { fontFamily:"Poppins_400Regular", fontSize:11, color:DIM,   lineHeight:16 },
  iconBtn:      { width:40, height:40, borderRadius:20, backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },

  statsRow:     { flexDirection:"row", gap:6, marginBottom:16 },

  chipRow:      { flexDirection:"row", gap:6, marginBottom:16 },
  chip:         { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5, paddingHorizontal:6, paddingVertical:9, borderRadius:10, borderWidth:1, borderColor:BORDER, backgroundColor:SURFACE },
  chipActive:   { borderColor:ORANGE, backgroundColor:"rgba(255,101,0,0.08)" },
  chipText:     { fontFamily:"Poppins_500Medium", fontSize:12, lineHeight:16 },

  infoCard:     { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"rgba(59,130,246,0.08)", borderWidth:1, borderColor:"rgba(59,130,246,0.20)", borderRadius:14, padding:14, marginTop:4 },
  infoTitle:    { fontFamily:"Poppins_600SemiBold", fontSize:12, color:WHITE,  lineHeight:17 },
  infoSub:      { fontFamily:"Poppins_400Regular",  fontSize:10.5, color:DIM, lineHeight:15, marginTop:2 },
});
