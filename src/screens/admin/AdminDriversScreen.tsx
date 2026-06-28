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
type UserStatus  = "Active" | "Pending" | "Blocked";
type UserType    = "Drivers" | "Warehouse";
type FilterKey   = "All" | UserStatus;

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
  kind: "driver";
  id: string;
  name: string;
  extId: string;
  carType: string;
  status: UserStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photo: any;
};

type WarehouseUser = {
  kind: "warehouse";
  id: string;
  name: string;
  extId: string;
  role: string;
  status: UserStatus;
  avatarColor: string;
};

type AnyUser = Driver | WarehouseUser;

// ─── mock data ────────────────────────────────────────────────────────────────
const DRIVERS: Driver[] = [
  { kind:"driver", id:"1", name:"John Doe",       extId:"DRV-001", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d1 },
  { kind:"driver", id:"2", name:"Michael Smith",  extId:"DRV-002", carType:"Own Car Driver",     status:"Pending", photo:AVATARS.d2 },
  { kind:"driver", id:"3", name:"Sarah Johnson",  extId:"DRV-003", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d3 },
  { kind:"driver", id:"4", name:"David Brown",    extId:"DRV-004", carType:"Own Car Driver",     status:"Blocked", photo:AVATARS.d4 },
  { kind:"driver", id:"5", name:"Lisa Wilson",    extId:"DRV-005", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d5 },
  { kind:"driver", id:"6", name:"Robert Taylor",  extId:"DRV-006", carType:"Own Car Driver",     status:"Pending", photo:AVATARS.d6 },
  { kind:"driver", id:"7", name:"James Anderson", extId:"DRV-007", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d7 },
  { kind:"driver", id:"8", name:"Emma Davis",     extId:"DRV-008", carType:"Company Car Driver", status:"Active",  photo:AVATARS.d8 },
];

const WH_AVATAR_COLORS = ["#7C3AED","#2563EB","#059669","#D97706","#DC2626","#0891B2"];

const WAREHOUSE_USERS: WarehouseUser[] = [
  { kind:"warehouse", id:"w1", name:"Fatima Ben Ali",     extId:"WH-001", role:"Warehouse Supervisor",  status:"Active",  avatarColor:WH_AVATAR_COLORS[0] },
  { kind:"warehouse", id:"w2", name:"Omar Haddad",        extId:"WH-002", role:"Picker",                status:"Active",  avatarColor:WH_AVATAR_COLORS[1] },
  { kind:"warehouse", id:"w3", name:"Lina Müller",        extId:"WH-003", role:"Packer",                status:"Pending", avatarColor:WH_AVATAR_COLORS[2] },
  { kind:"warehouse", id:"w4", name:"Ahmed Trabelsi",     extId:"WH-004", role:"Loading Staff",         status:"Active",  avatarColor:WH_AVATAR_COLORS[3] },
  { kind:"warehouse", id:"w5", name:"Sofia Klein",        extId:"WH-005", role:"Inventory Controller",  status:"Blocked", avatarColor:WH_AVATAR_COLORS[4] },
  { kind:"warehouse", id:"w6", name:"Youssef Mansour",    extId:"WH-006", role:"Shift Leader",          status:"Active",  avatarColor:WH_AVATAR_COLORS[5] },
];

const DRIVER_FILTERS: { label:string; key:FilterKey; count:number }[] = [
  { label:"All",     key:"All",     count:342 },
  { label:"Active",  key:"Active",  count:288 },
  { label:"Pending", key:"Pending", count:24  },
  { label:"Blocked", key:"Blocked", count:6   },
];

const WH_FILTERS: { label:string; key:FilterKey; count:number }[] = [
  { label:"All",     key:"All",     count:18 },
  { label:"Active",  key:"Active",  count:14 },
  { label:"Pending", key:"Pending", count:3  },
  { label:"Blocked", key:"Blocked", count:1  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s: UserStatus) {
  switch (s) {
    case "Active":  return { dot: GREEN, bg: "rgba(34,197,94,0.12)",  text: "#4ADE80" };
    case "Pending": return { dot: AMBER, bg: "rgba(245,158,11,0.12)", text: "#FCD34D" };
    case "Blocked": return { dot: RED,   bg: "rgba(239,68,68,0.12)",  text: "#FC8181" };
  }
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
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

function CarIcon({ color }: { color:string }) {
  return (
    <View style={{ width:22, height:16, alignItems:"center", justifyContent:"center" }}>
      <View style={{ width:20, height:10, borderWidth:1.5, borderColor:color, borderRadius:3, borderBottomLeftRadius:0, borderBottomRightRadius:0 }} />
      <View style={{ width:22, height:7, borderWidth:1.5, borderColor:color, borderRadius:4, marginTop:-1 }} />
      <View style={{ position:"absolute", bottom:-3, left:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
      <View style={{ position:"absolute", bottom:-3, right:2, width:5, height:5, borderRadius:2.5, borderWidth:1.5, borderColor:color, backgroundColor:TAB_BG }} />
    </View>
  );
}

function WarehouseIcon({ color }: { color:string }) {
  return (
    <View style={{ width:22, height:20, alignItems:"center", justifyContent:"flex-end" }}>
      <View style={{ width:22, height:13, borderWidth:1.5, borderColor:color, borderRadius:2 }} />
      <View style={{ position:"absolute", top:0, left:4, right:4, height:8, borderWidth:1.5, borderColor:color, borderRadius:2, borderBottomWidth:0 }} />
      <View style={{ position:"absolute", bottom:0, left:8, width:6, height:8, borderWidth:1.5, borderColor:color, borderBottomWidth:0 }} />
    </View>
  );
}

// ─── tab bar icons ────────────────────────────────────────────────────────────
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

function InvoiceIcon({ color }: { color:string }) {
  return (
    <View style={{ width:18, height:22 }}>
      <View style={{ width:18, height:22, borderWidth:1.8, borderColor:color, borderRadius:4 }} />
      <View style={{ position:"absolute", top:5,  left:4, right:4, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:9,  left:4, right:4, height:1.5, backgroundColor:color, borderRadius:1 }} />
      <View style={{ position:"absolute", top:13, left:4, width:6, height:1.5, backgroundColor:color, borderRadius:1 }} />
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
  { label:"Dashboard", Icon:GridIcon    },
  { label:"Users",     Icon:PeopleIcon  },
  { label:"Invoices",  Icon:InvoiceIcon },
  { label:"Reports",   Icon:ChartIcon   },
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

// ─── user card ────────────────────────────────────────────────────────────────
function UserCard({ user, onPress }: { user:AnyUser; onPress:()=>void }) {
  const cfg = statusCfg(user.status);
  const subLabel = user.kind === "driver" ? user.carType : user.role;

  return (
    <Pressable style={uc.card} onPress={onPress}>
      {/* avatar */}
      <View style={uc.avatarWrap}>
        {user.kind === "driver" ? (
          <Image source={user.photo} style={uc.photo} />
        ) : (
          <View style={[uc.initialsCircle, { backgroundColor: user.avatarColor + "33" }]}>
            <Text style={[uc.initialsText, { color: user.avatarColor }]}>
              {initials(user.name).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[uc.diode, { backgroundColor:cfg.dot }]} />
      </View>

      {/* info */}
      <View style={uc.info}>
        <Text style={uc.name} numberOfLines={1}>{user.name}</Text>
        <View style={uc.metaRow}>
          <Text style={uc.extId}>{user.extId}</Text>
          <View style={uc.sep} />
          <Text style={uc.subLabel} numberOfLines={1}>{subLabel}</Text>
        </View>
      </View>

      {/* status badge */}
      <View style={[uc.badge, { backgroundColor:cfg.bg }]}>
        <Text style={[uc.badgeText, { color:cfg.text }]}>{user.status}</Text>
      </View>

      <ChevronRight />
    </Pressable>
  );
}

const uc = StyleSheet.create({
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
  initialsCircle: {
    width:52,
    height:52,
    borderRadius:26,
    alignItems:"center",
    justifyContent:"center",
  },
  initialsText: {
    fontFamily:"Poppins_700Bold",
    fontSize:18,
    lineHeight:22,
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
  info:     { flex:1, gap:5, minWidth:0 },
  name:     { fontFamily:"Poppins_600SemiBold", fontSize:14, color:WHITE, lineHeight:20 },
  metaRow:  { flexDirection:"row", alignItems:"center", gap:7 },
  extId:    { fontFamily:"Poppins_400Regular", fontSize:11.5, color:DIM, flexShrink:0 },
  sep:      { width:3, height:3, borderRadius:1.5, backgroundColor:MUTED, flexShrink:0 },
  subLabel: { fontFamily:"Poppins_400Regular", fontSize:11.5, color:MUTED, flexShrink:1 },
  badge:    { paddingHorizontal:12, paddingVertical:5, borderRadius:20, flexShrink:0 },
  badgeText:{ fontFamily:"Poppins_600SemiBold", fontSize:11, lineHeight:16 },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminDriversScreen() {
  const router = useRouter();
  const [userType, setUserType]         = useState<UserType>("Drivers");
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");

  const filters  = userType === "Drivers" ? DRIVER_FILTERS : WH_FILTERS;
  const allUsers = userType === "Drivers" ? DRIVERS        : WAREHOUSE_USERS;

  const filtered = (allUsers as AnyUser[]).filter(u => {
    const matchFilter = activeFilter === "All" || u.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.extId.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleUserTypeChange = (t: UserType) => {
    setUserType(t);
    setActiveFilter("All");
    setSearch("");
  };

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"          as any);
    if (i === 2) router.replace("/admin/invoices" as any);
    if (i === 3) router.replace("/admin/reports"  as any);
  };

  const handleCardPress = (user: AnyUser) => {
    if (user.kind === "driver") {
      router.push(`/admin/driver-details?id=${user.id}` as never);
    } else {
      console.log("Warehouse user pressed:", user.name, user.extId);
    }
  };

  const driversActive   = userType === "Drivers";
  const warehouseActive = userType === "Warehouse";

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => router.replace("/admin" as any)} style={s.backBtn} hitSlop={12}>
            <BackIcon />
          </Pressable>
          <Text style={s.title}>Users</Text>
        </View>
        <Pressable style={s.iconBtn} hitSlop={10}>
          <FilterIcon />
        </Pressable>
      </View>

      {/* user type toggle */}
      <View style={s.toggleRow}>
        <Pressable
          style={[s.toggleBtn, driversActive && s.toggleBtnActive]}
          onPress={() => handleUserTypeChange("Drivers")}
        >
          <CarIcon color={driversActive ? WHITE : MUTED} />
          <Text style={[s.toggleLabel, driversActive && s.toggleLabelActive]}>Drivers</Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, warehouseActive && s.toggleBtnActive]}
          onPress={() => handleUserTypeChange("Warehouse")}
        >
          <WarehouseIcon color={warehouseActive ? WHITE : MUTED} />
          <Text style={[s.toggleLabel, warehouseActive && s.toggleLabelActive]}>Warehouse</Text>
        </Pressable>
      </View>

      {/* search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <SearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search users..."
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

      {/* status chips */}
      <View style={s.pillRow}>
        {filters.map(({ label, key, count }) => {
          const active = activeFilter === key;
          return (
            <Pressable
              key={key}
              style={[s.pill, active && s.pillActive]}
              onPress={() => setActiveFilter(key)}
            >
              <Text style={[s.pillLabel, active && s.pillLabelActive]} numberOfLines={1}>
                {`${label} (${count})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* user list */}
      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map(u => (
          <UserCard
            key={u.id}
            user={u}
            onPress={() => handleCardPress(u)}
          />
        ))}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No users found</Text>
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
  header:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:8, paddingBottom:16 },
  headerLeft: { flexDirection:"row", alignItems:"center", gap:12 },
  backBtn:    { width:38, height:38, borderRadius:19, backgroundColor:FAINT, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },
  title:      { fontFamily:"Poppins_700Bold", fontSize:22, color:WHITE, lineHeight:28 },
  iconBtn:    { width:42, height:42, borderRadius:13, backgroundColor:FAINT, borderWidth:1, borderColor:BORDER, alignItems:"center", justifyContent:"center" },

  // user type toggle
  toggleRow: {
    flexDirection:"row",
    paddingHorizontal:16,
    gap:12,
    marginBottom:14,
  },
  toggleBtn: {
    flex:1,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center",
    gap:10,
    paddingVertical:14,
    borderRadius:14,
    backgroundColor:SURFACE,
    borderWidth:1,
    borderColor:BORDER,
  },
  toggleBtnActive: {
    backgroundColor:ORANGE,
    borderColor:ORANGE,
  },
  toggleLabel: {
    fontFamily:"Poppins_600SemiBold",
    fontSize:15,
    color:MUTED,
  },
  toggleLabelActive: {
    color:WHITE,
  },

  // search
  searchWrap: { paddingHorizontal:16, marginBottom:14 },
  searchBox:  { flexDirection:"row", alignItems:"center", backgroundColor:SURFACE, borderRadius:14, borderWidth:1, borderColor:BORDER, paddingHorizontal:14, paddingVertical:13, gap:10 },
  searchInput:{ flex:1, fontFamily:"Poppins_400Regular", fontSize:13, color:WHITE, height:22 },
  clearBtn:   { fontFamily:"Poppins_400Regular", fontSize:13, color:MUTED },

  // filter pills
  pillRow: {
    flexDirection:"row",
    paddingHorizontal:16,
    gap:7,
    marginBottom:14,
  },
  pill: {
    flex:1,
    alignItems:"center",
    justifyContent:"center",
    paddingVertical:9,
    borderRadius:20,
    backgroundColor:FAINT,
    borderWidth:1,
    borderColor:BORDER,
  },
  pillActive:      { backgroundColor:ORANGE, borderColor:ORANGE },
  pillLabel:       { fontFamily:"Poppins_500Medium", fontSize:10.5, color:DIM,  lineHeight:15 },
  pillLabelActive: { color:WHITE },

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
