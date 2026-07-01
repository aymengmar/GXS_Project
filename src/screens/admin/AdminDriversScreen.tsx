import {
  CreateDriverResponse,
  CreateWarehouseUserResponse,
  fetchAdminDrivers,
  fetchAdminWarehouseUsers,
  getDriverPhotoProxyUrl,
  WarehouseUserListItem,
} from "@/api/backendClient";
import AddNewUserModal from "@/components/admin/AddNewUserModal";
import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type Driver = {
  kind: "driver";
  id: string;
  name: string;
  extId: string;
  carType: string;
  status: UserStatus;
  photoUri: string | null;
  avatarColor: string;
};

type WarehouseUser = {
  kind: "warehouse";
  id: string;
  name: string;
  extId: string;
  city: string;
  status: UserStatus;
  avatarColor: string;
  // fields forwarded to details screen
  email: string;
  phone: string | null;
  external_id: string | null;
  statusLabel: string;
  statusColor: string;
  createdAt: string | null;
};

type AnyUser = Driver | WarehouseUser;

// ─── avatar color helper ──────────────────────────────────────────────────────
const AVATAR_PALETTE = ["#7C3AED","#2563EB","#059669","#D97706","#DC2626","#0891B2","#FF6500","#0D9488"];

function avatarColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ─── local fallback avatars ───────────────────────────────────────────────────
const fallbackAvatars = [
  require("../../../assets/images/avatars/driver1.jpg"),
  require("../../../assets/images/avatars/driver2.jpg"),
  require("../../../assets/images/avatars/driver3.jpg"),
  require("../../../assets/images/avatars/driver4.jpg"),
  require("../../../assets/images/avatars/driver5.jpg"),
  require("../../../assets/images/avatars/driver6.jpg"),
  require("../../../assets/images/avatars/driver7.jpg"),
  require("../../../assets/images/avatars/driver8.jpg"),
];

function pickFallbackAvatar(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return fallbackAvatars[Math.abs(hash) % fallbackAvatars.length];
}


// ─── helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s: UserStatus) {
  switch (s) {
    case "Active":   return { dot: GREEN, bg: "rgba(34,197,94,0.12)",  text: "#4ADE80" };
    case "Pending":  return { dot: AMBER, bg: "rgba(245,158,11,0.12)", text: "#FCD34D" };
    case "Blocked":  return { dot: RED,   bg: "rgba(239,68,68,0.12)",  text: "#FC8181" };
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
  const subLabel = user.kind === "driver" ? user.carType : user.city;
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, boolean>>({});

  const isDriver = user.kind === "driver";
  const photoUri = isDriver ? (user as Driver).photoUri : null;

  const imageFailureKey = `${user.id}:${photoUri ?? ""}`;

  const hasRemotePhoto =
    typeof photoUri === "string" && photoUri.trim().length > 0;
  const shouldUseRemotePhoto = hasRemotePhoto && !failedImageKeys[imageFailureKey];

  console.log(
    "[Avatar]",
    user.name,
    "| url:", photoUri,
    "| hasRemote:", hasRemotePhoto,
    "| shouldUseRemote:", shouldUseRemotePhoto,
  );

  return (
    <Pressable style={uc.card} onPress={onPress}>
      {/* avatar */}
      <View style={uc.avatarWrap}>
        {isDriver ? (
          <Image
            source={
              shouldUseRemotePhoto
                ? { uri: photoUri! }
                : pickFallbackAvatar(user.id)
            }
            style={uc.avatarImage}
            resizeMode="cover"
            onLoad={() => {
              console.log("Driver photo loaded", user.name, photoUri);
            }}
            onError={(error) => {
              console.log(
                "Driver photo failed",
                user.name,
                photoUri,
                error.nativeEvent
              );
              setFailedImageKeys((prev) => ({
                ...prev,
                [imageFailureKey]: true,
              }));
            }}
          />
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
    width:64,
    height:64,
    flexShrink:0,
    position:"relative",
  },
  avatarImage: {
    width:64,
    height:64,
    borderRadius:32,
    backgroundColor:"rgba(255,255,255,0.06)",
  },
  initialsCircle: {
    width:64,
    height:64,
    borderRadius:32,
    alignItems:"center",
    justifyContent:"center",
  },
  initialsText: {
    fontFamily:"Poppins_700Bold",
    fontSize:20,
    lineHeight:24,
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
  const [addUserVisible, setAddUserVisible] = useState(false);

  const [userType, setUserType]         = useState<UserType>("Drivers");
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");

  // Drivers tab — real data
  const [drivers, setDrivers]           = useState<Driver[]>([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, pending: 0, blocked: 0 });
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError]     = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Warehouse tab — real data
  const [warehouseUsers, setWarehouseUsers] = useState<WarehouseUser[]>([]);
  const [warehouseStatusCounts, setWarehouseStatusCounts] = useState({ all: 0, active: 0, pending: 0, blocked: 0 });
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouseError, setWarehouseError]     = useState<string | null>(null);
  const [warehouseDebouncedSearch, setWarehouseDebouncedSearch] = useState("");
  const [warehouseRefreshKey, setWarehouseRefreshKey] = useState(0);

  // Debounce — drivers
  useEffect(() => {
    if (userType !== "Drivers") return;
    if (!searchQuery) { setDebouncedSearch(""); return; }
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, userType]);

  // Debounce — warehouse
  useEffect(() => {
    if (userType !== "Warehouse") return;
    if (!searchQuery) { setWarehouseDebouncedSearch(""); return; }
    const t = setTimeout(() => setWarehouseDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, userType]);

  const handleDriverCreated = (_driver: CreateDriverResponse) => {
    if (userType === "Drivers") setRefreshKey(k => k + 1);
  };

  const handleWarehouseUserCreated = (_user: CreateWarehouseUserResponse) => {
    if (userType === "Warehouse") setWarehouseRefreshKey(k => k + 1);
  };

  // Fetch drivers from backend
  useEffect(() => {
    if (userType !== "Drivers") return;
    const session = sessionStore.get();
    if (session?.kind !== "admin") return;

    setDriversLoading(true);
    setDriversError(null);

    const statusParam = activeFilter === "All" ? undefined : activeFilter.toLowerCase();

    fetchAdminDrivers(session.access_token, {
      search: debouncedSearch || undefined,
      status: statusParam,
      limit: 20,
      offset: 0,
    })
      .then(data => {
        const mapped: Driver[] = data.items.map(item => ({
          kind: "driver" as const,
          id: item.id,
          name: item.full_name,
          extId: item.display_driver_id,
          carType: item.driver_type_label,
          status: item.status_label,
          photoUri: item.profile_photo_url
            ? getDriverPhotoProxyUrl(item.id, session.access_token)
            : null,
          avatarColor: avatarColorFromId(item.id),
        }));
        setDrivers(mapped);
        setStatusCounts(data.status_counts);
        setDriversLoading(false);
      })
      .catch(err => {
        setDriversError(String(err?.message ?? "Failed to load drivers."));
        setDriversLoading(false);
      });
  }, [userType, debouncedSearch, activeFilter, refreshKey]);

  // Fetch warehouse users from backend
  useEffect(() => {
    if (userType !== "Warehouse") return;
    const session = sessionStore.get();
    if (session?.kind !== "admin") return;

    setWarehouseLoading(true);
    setWarehouseError(null);

    const statusParam = activeFilter === "All" ? undefined : activeFilter.toLowerCase();

    fetchAdminWarehouseUsers(session.access_token, {
      search: warehouseDebouncedSearch || undefined,
      status: statusParam,
      limit: 20,
      offset: 0,
    })
      .then(data => {
        const mapped: WarehouseUser[] = data.items.map((item: WarehouseUserListItem) => ({
          kind: "warehouse" as const,
          id: item.id,
          name: item.full_name,
          extId: item.display_external_id,
          city: item.city ?? "",
          status: item.status_label as UserStatus,
          avatarColor: avatarColorFromId(item.id),
          email: item.email,
          phone: item.phone,
          external_id: item.external_id,
          statusLabel: item.status_label,
          statusColor: item.status_color,
          createdAt: item.created_at,
        }));
        setWarehouseUsers(mapped);
        setWarehouseStatusCounts(data.status_counts);
        setWarehouseLoading(false);
      })
      .catch(() => {
        setWarehouseError("Could not load warehouse users");
        setWarehouseLoading(false);
      });
  }, [userType, warehouseDebouncedSearch, activeFilter, warehouseRefreshKey]);

  const filtered: AnyUser[] = userType === "Drivers" ? drivers : warehouseUsers;

  // Filter chips
  const driverFilters: { label:string; key:FilterKey; count:number }[] = [
    { label:"All",     key:"All",     count:statusCounts.all     },
    { label:"Active",  key:"Active",  count:statusCounts.active  },
    { label:"Pending", key:"Pending", count:statusCounts.pending },
    { label:"Blocked", key:"Blocked", count:statusCounts.blocked },
  ];
  const warehouseFilters: { label:string; key:FilterKey; count:number }[] = [
    { label:"All",     key:"All",     count:warehouseStatusCounts.all     },
    { label:"Active",  key:"Active",  count:warehouseStatusCounts.active  },
    { label:"Pending", key:"Pending", count:warehouseStatusCounts.pending },
    { label:"Blocked", key:"Blocked", count:warehouseStatusCounts.blocked },
  ];
  const filters = userType === "Drivers" ? driverFilters : warehouseFilters;

  const handleUserTypeChange = (t: UserType) => {
    setUserType(t);
    setActiveFilter("All");
    setSearchQuery("");
    setDebouncedSearch("");
    setWarehouseDebouncedSearch("");
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
      router.push({
        pathname: "/admin/warehouse-details" as never,
        params: {
          id: user.id,
          full_name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          city: user.city,
          external_id: user.external_id ?? "",
          display_external_id: user.extId,
          status: user.status,
          status_label: user.statusLabel,
          status_color: user.statusColor,
          created_at: user.createdAt ?? "",
          avatar_color: user.avatarColor,
        },
      } as never);
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
            placeholderTextColor="#8A8F98"
            selectionColor="#FF7A00"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
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
        {/* Drivers: Loading / Error */}
        {userType === "Drivers" && driversLoading && (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        )}
        {userType === "Drivers" && !driversLoading && driversError && (
          <View style={s.centerBox}>
            <Text style={s.errorText}>{driversError}</Text>
          </View>
        )}

        {/* Warehouse: Loading / Error */}
        {userType === "Warehouse" && warehouseLoading && (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        )}
        {userType === "Warehouse" && !warehouseLoading && warehouseError && (
          <View style={s.centerBox}>
            <Text style={s.errorText}>{warehouseError}</Text>
          </View>
        )}

        {/* User list — shown only when not loading and no error */}
        {((userType === "Drivers" && !driversLoading && !driversError) ||
          (userType === "Warehouse" && !warehouseLoading && !warehouseError)) &&
          filtered.map(u => (
            <UserCard
              key={u.id}
              user={u}
              onPress={() => handleCardPress(u)}
            />
          ))}

        {/* Empty state */}
        {((userType === "Drivers" && !driversLoading && !driversError) ||
          (userType === "Warehouse" && !warehouseLoading && !warehouseError)) &&
          filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {userType === "Warehouse" ? "No warehouse users found" : "No users found"}
              </Text>
            </View>
          )}
        <View style={{ height:90 }} />
      </ScrollView>

      {/* FAB */}
      <View style={s.fabWrap} pointerEvents="box-none">
        <Pressable style={s.fab} onPress={() => setAddUserVisible(true)}>
          <Text style={s.fabPlus}>+</Text>
        </Pressable>
      </View>

      <AddNewUserModal
        visible={addUserVisible}
        onClose={() => setAddUserVisible(false)}
        accessToken={sessionStore.get()?.access_token}
        onDriverCreated={handleDriverCreated}
        onWarehouseUserCreated={handleWarehouseUserCreated}
      />

      {/* bottom tabs — absolutely positioned so keyboard cannot push it up */}
      <View style={s.bottomNavWrap}>
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor:TAB_BG }}>
          <BottomTabs onPress={handleTabPress} />
        </SafeAreaView>
      </View>
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
  searchInput:{ flex:1, fontFamily:"Poppins_400Regular", fontSize:16, color:"#FFFFFF" },
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
  centerBox: { alignItems:"center", paddingVertical:40 },
  empty:     { alignItems:"center", paddingVertical:40 },
  emptyText: { fontFamily:"Poppins_400Regular", fontSize:14, color:MUTED },
  errorText: { fontFamily:"Poppins_400Regular", fontSize:14, color:RED, textAlign:"center" },

  // bottom nav
  bottomNavWrap: { position:"absolute", bottom:0, left:0, right:0, zIndex:5 },

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
