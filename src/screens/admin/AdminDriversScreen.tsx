import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.60)";
const MUTED   = "rgba(255,255,255,0.28)";
const FAINT   = "rgba(255,255,255,0.08)";
const TAB_BG  = "#060C18";

// ─── types ────────────────────────────────────────────────────────────────────
type DriverStatus = "Active" | "Pending" | "Blocked";
type CarType      = "Company Car" | "Own Car";
type FilterKey    = "All" | DriverStatus;

// ─── local avatar photos ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AVATARS = {
  d1: require("@/assets/images/avatars/driver1.jpg"),
  d2: require("@/assets/images/avatars/driver2.jpg"),
  d3: require("@/assets/images/avatars/driver3.jpg"),
  d4: require("@/assets/images/avatars/driver4.jpg"),
  d5: require("@/assets/images/avatars/driver5.jpg"),
  d6: require("@/assets/images/avatars/driver6.jpg"),
  d7: require("@/assets/images/avatars/driver7.jpg"),
  d8: require("@/assets/images/avatars/driver8.jpg"),
};

type Driver = {
  id: string;
  name: string;
  extId: string;
  carType: CarType;
  status: DriverStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photo: any;
};

// ─── mock data ────────────────────────────────────────────────────────────────
const DRIVERS: Driver[] = [
  { id:"1", name:"John Doe",       extId:"DRV-001", carType:"Company Car", status:"Active",  photo:AVATARS.d1 },
  { id:"2", name:"Michael Smith",  extId:"DRV-002", carType:"Own Car",     status:"Pending", photo:AVATARS.d2 },
  { id:"3", name:"Sarah Johnson",  extId:"DRV-003", carType:"Company Car", status:"Active",  photo:AVATARS.d3 },
  { id:"4", name:"David Brown",    extId:"DRV-004", carType:"Own Car",     status:"Blocked", photo:AVATARS.d4 },
  { id:"5", name:"Lisa Wilson",    extId:"DRV-005", carType:"Company Car", status:"Active",  photo:AVATARS.d5 },
  { id:"6", name:"Robert Taylor",  extId:"DRV-006", carType:"Own Car",     status:"Pending", photo:AVATARS.d6 },
  { id:"7", name:"James Anderson", extId:"DRV-007", carType:"Company Car", status:"Active",  photo:AVATARS.d7 },
  { id:"8", name:"Emma Davis",     extId:"DRV-008", carType:"Company Car", status:"Active",  photo:AVATARS.d8 },
];

const FILTERS: { label: string; key: FilterKey; count: number }[] = [
  { label:"All",     key:"All",     count:342 },
  { label:"Active",  key:"Active",  count:288 },
  { label:"Pending", key:"Pending", count:24  },
  { label:"Blocked", key:"Blocked", count:6   },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s: DriverStatus) {
  switch (s) {
    case "Active":  return { dot: GREEN, bg: "rgba(34,197,94,0.12)",  text: "#4ADE80" };
    case "Pending": return { dot: AMBER, bg: "rgba(245,158,11,0.12)", text: "#FCD34D" };
    case "Blocked": return { dot: RED,   bg: "rgba(239,68,68,0.12)",  text: "#FC8181" };
  }
}

// ─── icons ────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <View style={{ width:14, height:14, justifyContent:"center", alignItems:"center" }}>
      <View style={{ width:8, height:8, borderLeftWidth:2, borderBottomWidth:2, borderColor:WHITE, transform:[{ rotate:"45deg" }], marginLeft:3 }} />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={{ width:16, height:16, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:11, height:11, borderRadius:5.5, borderWidth:1.5, borderColor:MUTED }} />
      <View style={{ position:"absolute", bottom:0, right:0, width:5, height:2, backgroundColor:MUTED, borderRadius:1, transform:[{ rotate:"40deg" }] }} />
    </View>
  );
}

function FilterIcon() {
  return (
    <View style={{ width:16, height:13, alignItems:"flex-start", justifyContent:"space-between" }}>
      <View style={{ width:16, height:1.8, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:11, height:1.8, backgroundColor:WHITE, borderRadius:1 }} />
      <View style={{ width:7,  height:1.8, backgroundColor:WHITE, borderRadius:1 }} />
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width:6, height:6, borderRightWidth:1.5, borderTopWidth:1.5, borderColor:MUTED, transform:[{ rotate:"45deg" }] }} />
  );
}

// ─── tab icons ────────────────────────────────────────────────────────────────
function GridIcon({ color }: { color:string }) {
  return (
    <View style={{ width:18, height:18, flexDirection:"row", flexWrap:"wrap", gap:3, padding:1 }}>
      {[0,1,2,3].map(i => <View key={i} style={{ width:5, height:5, backgroundColor:color, borderRadius:1 }} />)}
    </View>
  );
}

function PeopleIcon({ color }: { color:string }) {
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

function TruckIcon({ color }: { color:string }) {
  return (
    <View style={{ width:22, height:16 }}>
      <View style={{ position:"absolute", left:0, top:0, width:14, height:10, borderWidth:1.5, borderColor:color, borderRadius:2 }} />
      <View style={{ position:"absolute", right:0, top:3, width:8, height:7, borderWidth:1.5, borderColor:color, borderTopRightRadius:2 }} />
      <View style={{ position:"absolute", bottom:0, left:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
      <View style={{ position:"absolute", bottom:0, right:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
    </View>
  );
}

function ChartIcon({ color }: { color:string }) {
  return (
    <View style={{ width:20, height:18, flexDirection:"row", alignItems:"flex-end", gap:3 }}>
      {[9,16,7,13].map((h,i) => <View key={i} style={{ width:3, height:h, backgroundColor:color, borderRadius:2 }} />)}
    </View>
  );
}

// ─── bottom tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { label:"Dashboard",  Icon:GridIcon   },
  { label:"Drivers",    Icon:PeopleIcon },
  { label:"Deliveries", Icon:TruckIcon  },
  { label:"Reports",    Icon:ChartIcon  },
] as const;

function BottomTabs({ onPress }: { onPress:(i:number)=>void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(({ label, Icon }, i) => {
        const active = i === 1;
        const color = active ? ORANGE : MUTED;
        return (
          <Pressable key={label} style={tb.item} hitSlop={8} onPress={() => onPress(i)}>
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
  indicator: { position:"absolute", top:0, width:32, height:3, borderRadius:2, backgroundColor:ORANGE },
  label:     { fontFamily:"Poppins_500Medium", fontSize:10, lineHeight:14 },
});

// ─── stat cards ───────────────────────────────────────────────────────────────
function StatCard({ count, label, color }: { count:number; label:string; color:string }) {
  return (
    <View style={[sc.card, { borderColor: color + "30" }]}>
      <View style={[sc.dot, { backgroundColor:color }]} />
      <Text style={[sc.count, { color }]}>{count}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card:  { flex:1, backgroundColor:CARD, borderRadius:14, borderWidth:1, padding:14, alignItems:"center", gap:5 },
  dot:   { width:8, height:8, borderRadius:4 },
  count: { fontFamily:"Poppins_700Bold", fontSize:22, lineHeight:28 },
  label: { fontFamily:"Poppins_500Medium", fontSize:11, color:DIM },
});

// ─── driver row ───────────────────────────────────────────────────────────────
function DriverRow({ driver }: { driver:Driver }) {
  const cfg = statusCfg(driver.status);

  return (
    <Pressable style={dr.card}>
      {/* avatar photo + status diode */}
      <View style={dr.avatarWrap}>
        <Image source={driver.photo} style={dr.photo} />
        <View style={[dr.diode, { backgroundColor:cfg.dot }]} />
      </View>

      {/* info */}
      <View style={dr.info}>
        <Text style={dr.name} numberOfLines={1}>{driver.name}</Text>
        <View style={dr.metaRow}>
          <Text style={dr.extId}>{driver.extId}</Text>
          <View style={dr.sep} />
          <Text style={dr.carType}>{driver.carType}</Text>
        </View>
      </View>

      {/* status badge */}
      <View style={[dr.badge, { backgroundColor:cfg.bg }]}>
        <Text style={[dr.badgeText, { color:cfg.text }]}>{driver.status}</Text>
      </View>

      <ChevronRight />
    </Pressable>
  );
}

const dr = StyleSheet.create({
  card: {
    flexDirection:"row",
    alignItems:"center",
    backgroundColor:CARD,
    borderRadius:16,
    borderWidth:1,
    borderColor:BORDER,
    paddingHorizontal:14,
    paddingVertical:13,
    marginBottom:10,
    gap:12,
  },
  avatarWrap: {
    width:52,
    height:52,
    flexShrink:0,
    position:"relative",
  },
  photo: {
    width:52,
    height:52,
    borderRadius:26,
    backgroundColor:"rgba(255,255,255,0.06)",
  },
  diode: {
    position:"absolute",
    bottom:1,
    left:1,
    width:13,
    height:13,
    borderRadius:6.5,
    borderWidth:2.5,
    borderColor:CARD,
  },
  info:     { flex:1, gap:5 },
  name:     { fontFamily:"Poppins_600SemiBold", fontSize:14, color:WHITE, lineHeight:20 },
  metaRow:  { flexDirection:"row", alignItems:"center", gap:7 },
  extId:    { fontFamily:"Poppins_400Regular", fontSize:11.5, color:DIM },
  sep:      { width:3, height:3, borderRadius:1.5, backgroundColor:MUTED },
  carType:  { fontFamily:"Poppins_400Regular", fontSize:11.5, color:MUTED },
  badge:    { paddingHorizontal:12, paddingVertical:5, borderRadius:20, flexShrink:0 },
  badgeText:{ fontFamily:"Poppins_600SemiBold", fontSize:11, lineHeight:16 },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminDriversScreen() {
  const router = useRouter();
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");

  const filtered = DRIVERS.filter(d => {
    const matchFilter = activeFilter === "All" || d.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.extId.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin" as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => router.replace("/admin" as any)} style={s.backBtn} hitSlop={12}>
            <BackIcon />
          </Pressable>
          <View>
            <Text style={s.title}>Drivers</Text>
            <Text style={s.subtitle}>342 registered drivers</Text>
          </View>
        </View>
        <Pressable style={s.iconBtn} hitSlop={10}>
          <FilterIcon />
        </Pressable>
      </View>

      {/* search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <SearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Text style={s.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* stat cards */}
      <View style={s.statsRow}>
        <StatCard count={288} label="Active"  color={GREEN} />
        <StatCard count={24}  label="Pending" color={AMBER} />
        <StatCard count={6}   label="Blocked" color={RED}   />
      </View>

      {/* filter pills — plain View row so all 4 are visible without scrolling */}
      <View style={s.pillRow}>
        {FILTERS.map(({ label, key, count }) => {
          const active = activeFilter === key;
          return (
            <Pressable
              key={key}
              style={[s.pill, active && s.pillActive]}
              onPress={() => setActiveFilter(key)}
            >
              <Text style={[s.pillLabel, active && s.pillLabelActive]} numberOfLines={1}>
                {label}
              </Text>
              <Text style={[s.pillCount, active && s.pillCountActive]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* driver list */}
      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map(d => <DriverRow key={d.id} driver={d} />)}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No drivers found</Text>
          </View>
        )}
        <View style={{ height:90 }} />
      </ScrollView>

      {/* FAB */}
      <View style={s.fabWrap} pointerEvents="box-none">
        <Pressable style={s.fab}>
          <Text style={s.fabPlus}>+</Text>
        </Pressable>
      </View>

      {/* bottom tabs */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor:TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor:BG },

  // header
  header:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:8, paddingBottom:18 },
  headerLeft: { flexDirection:"row", alignItems:"center", gap:12 },
  backBtn:    { width:38, height:38, borderRadius:19, backgroundColor:FAINT, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },
  title:      { fontFamily:"Poppins_700Bold", fontSize:22, color:WHITE, lineHeight:28 },
  subtitle:   { fontFamily:"Poppins_400Regular", fontSize:12, color:MUTED, lineHeight:17, marginTop:-1 },
  iconBtn:    { width:42, height:42, borderRadius:13, backgroundColor:FAINT, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },

  // search
  searchWrap: { paddingHorizontal:16, marginBottom:14 },
  searchBox:  { flexDirection:"row", alignItems:"center", backgroundColor:SURFACE, borderRadius:14, borderWidth:1, borderColor:BORDER, paddingHorizontal:14, paddingVertical:13, gap:10 },
  searchInput:{ flex:1, fontFamily:"Poppins_400Regular", fontSize:13, color:WHITE, height:22 },
  clearBtn:   { fontFamily:"Poppins_400Regular", fontSize:13, color:MUTED },

  // stat cards
  statsRow: { flexDirection:"row", gap:10, paddingHorizontal:16, marginBottom:14 },

  // filter pills — all visible in one row
  pillRow: {
    flexDirection:"row",
    paddingHorizontal:16,
    gap:7,
    marginBottom:14,
  },
  pill: {
    flex:1,
    alignItems:"center",
    paddingVertical:8,
    borderRadius:20,
    backgroundColor:FAINT,
    borderWidth:1,
    borderColor:BORDER,
  },
  pillActive:       { backgroundColor:ORANGE, borderColor:ORANGE },
  pillLabel:        { fontFamily:"Poppins_600SemiBold", fontSize:11, color:DIM,  lineHeight:16 },
  pillLabelActive:  { color:WHITE },
  pillCount:        { fontFamily:"Poppins_400Regular",  fontSize:10, color:MUTED, lineHeight:14 },
  pillCountActive:  { color:"rgba(255,255,255,0.85)" },

  // list
  list:      { paddingHorizontal:16 },
  empty:     { alignItems:"center", paddingVertical:40 },
  emptyText: { fontFamily:"Poppins_400Regular", fontSize:14, color:MUTED },

  // fab
  fabWrap: { position:"absolute", bottom:90, right:20, zIndex:10 },
  fab: {
    width:56, height:56,
    borderRadius:28,
    backgroundColor:ORANGE,
    alignItems:"center",
    justifyContent:"center",
    shadowColor:ORANGE,
    shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.5,
    shadowRadius:12,
    elevation:10,
  },
  fabPlus: { fontFamily:"Poppins_700Bold", fontSize:30, color:WHITE, lineHeight:36, marginTop:-2 },
});
