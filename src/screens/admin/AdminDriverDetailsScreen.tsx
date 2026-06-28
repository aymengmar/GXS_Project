import { useLocalSearchParams, useRouter } from "expo-router";
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

// ─── palette ──────────────────────────────────────────────────────────────────
const BG      = "#080F1D";
const SURFACE = "#0D1A2E";
const CARD    = "#111E33";
const BORDER  = "rgba(255,255,255,0.07)";
const ORANGE  = "#FF6500";
const GREEN   = "#22C55E";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.60)";
const MUTED   = "rgba(255,255,255,0.28)";
const FAINT   = "rgba(255,255,255,0.08)";
const TAB_BG  = "#060C18";

// ─── mock drivers (matches AdminDriversScreen) ────────────────────────────────
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

type DriverStatus = "Active" | "Pending" | "Blocked";

interface MockDriver {
  id: string;
  name: string;
  extId: string;
  externalDriverId: string;
  carType: string;
  status: DriverStatus;
  email: string;
  phone: string;
  joinedDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photo: any;
  stats: { total: number; completed: number; cancelled: number };
  totalPct: string;
  completedPct: string;
  cancelledPct: string;
  cancelledUp: boolean;
}

const MOCK_DRIVERS: MockDriver[] = [
  {
    id: "1",
    name: "John Doe",
    extId: "DRV-001",
    externalDriverId: "EXT-DRV-1001",
    carType: "Company Car Driver",
    status: "Active",
    email: "john.doe@email.com",
    phone: "+49 123 456 7890",
    joinedDate: "May 10, 2025",
    photo: AVATARS.d1,
    stats: { total: 156, completed: 142, cancelled: 14 },
    totalPct: "12.5%",
    completedPct: "10.3%",
    cancelledPct: "2.1%",
    cancelledUp: false,
  },
  {
    id: "2",
    name: "Michael Smith",
    extId: "DRV-002",
    externalDriverId: "EXT-DRV-1002",
    carType: "Own Car Driver",
    status: "Pending",
    email: "michael.smith@email.com",
    phone: "+49 234 567 8901",
    joinedDate: "Jun 3, 2025",
    photo: AVATARS.d2,
    stats: { total: 89, completed: 80, cancelled: 9 },
    totalPct: "8.2%",
    completedPct: "7.1%",
    cancelledPct: "1.4%",
    cancelledUp: false,
  },
  {
    id: "3",
    name: "Sarah Johnson",
    extId: "DRV-003",
    externalDriverId: "EXT-DRV-1003",
    carType: "Company Car Driver",
    status: "Active",
    email: "sarah.j@email.com",
    phone: "+49 345 678 9012",
    joinedDate: "Mar 15, 2025",
    photo: AVATARS.d3,
    stats: { total: 210, completed: 198, cancelled: 12 },
    totalPct: "15.1%",
    completedPct: "14.2%",
    cancelledPct: "0.9%",
    cancelledUp: false,
  },
  {
    id: "4",
    name: "David Brown",
    extId: "DRV-004",
    externalDriverId: "EXT-DRV-1004",
    carType: "Own Car Driver",
    status: "Blocked",
    email: "d.brown@email.com",
    phone: "+49 456 789 0123",
    joinedDate: "Jan 20, 2025",
    photo: AVATARS.d4,
    stats: { total: 45, completed: 38, cancelled: 7 },
    totalPct: "3.1%",
    completedPct: "2.8%",
    cancelledPct: "3.5%",
    cancelledUp: true,
  },
  {
    id: "5",
    name: "Lisa Wilson",
    extId: "DRV-005",
    externalDriverId: "EXT-DRV-1005",
    carType: "Company Car Driver",
    status: "Active",
    email: "l.wilson@email.com",
    phone: "+49 567 890 1234",
    joinedDate: "Apr 8, 2025",
    photo: AVATARS.d5,
    stats: { total: 178, completed: 165, cancelled: 13 },
    totalPct: "11.8%",
    completedPct: "10.9%",
    cancelledPct: "1.2%",
    cancelledUp: false,
  },
  {
    id: "6",
    name: "Robert Taylor",
    extId: "DRV-006",
    externalDriverId: "EXT-DRV-1006",
    carType: "Own Car Driver",
    status: "Pending",
    email: "r.taylor@email.com",
    phone: "+49 678 901 2345",
    joinedDate: "Jun 14, 2025",
    photo: AVATARS.d6,
    stats: { total: 22, completed: 20, cancelled: 2 },
    totalPct: "5.0%",
    completedPct: "4.5%",
    cancelledPct: "0.8%",
    cancelledUp: false,
  },
  {
    id: "7",
    name: "James Anderson",
    extId: "DRV-007",
    externalDriverId: "EXT-DRV-1007",
    carType: "Company Car Driver",
    status: "Active",
    email: "j.anderson@email.com",
    phone: "+49 789 012 3456",
    joinedDate: "Feb 28, 2025",
    photo: AVATARS.d7,
    stats: { total: 300, completed: 285, cancelled: 15 },
    totalPct: "18.4%",
    completedPct: "17.2%",
    cancelledPct: "1.1%",
    cancelledUp: false,
  },
  {
    id: "8",
    name: "Emma Davis",
    extId: "DRV-008",
    externalDriverId: "EXT-DRV-1008",
    carType: "Company Car Driver",
    status: "Active",
    email: "e.davis@email.com",
    phone: "+49 890 123 4567",
    joinedDate: "May 22, 2025",
    photo: AVATARS.d8,
    stats: { total: 134, completed: 126, cancelled: 8 },
    totalPct: "9.7%",
    completedPct: "9.1%",
    cancelledPct: "0.7%",
    cancelledUp: false,
  },
];

const DEFAULT_DRIVER = MOCK_DRIVERS[0];

function statusCfg(s: DriverStatus) {
  switch (s) {
    case "Active":  return { dot: GREEN,    bg: "rgba(34,197,94,0.15)",  text: "#4ADE80" };
    case "Pending": return { dot: "#F59E0B", bg: "rgba(245,158,11,0.15)", text: "#FCD34D" };
    case "Blocked": return { dot: "#EF4444", bg: "rgba(239,68,68,0.15)",  text: "#FC8181" };
  }
}

// ─── icon helpers ─────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <View style={{ width: 16, height: 16, justifyContent: "center", alignItems: "center" }}>
      <View style={{
        width: 9, height: 9,
        borderLeftWidth: 2, borderBottomWidth: 2,
        borderColor: WHITE,
        transform: [{ rotate: "45deg" }],
        marginLeft: 4,
      }} />
    </View>
  );
}

function MessageIcon() {
  return (
    <View style={{ width: 18, height: 16 }}>
      <View style={{
        width: 18, height: 14,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: WHITE,
      }} />
      <View style={{
        position: "absolute", bottom: 0, left: 4,
        width: 6, height: 5,
        borderLeftWidth: 1.5, borderBottomWidth: 1.5,
        borderColor: WHITE,
        transform: [{ rotate: "0deg" }],
      }} />
    </View>
  );
}

function DotsIcon() {
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: WHITE }} />
      ))}
    </View>
  );
}

function PersonIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center" }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: "#60A5FA" }} />
      <View style={{
        width: 16, height: 8,
        borderTopLeftRadius: 8, borderTopRightRadius: 8,
        borderWidth: 1.5, borderColor: "#60A5FA",
        borderBottomWidth: 0,
        marginTop: 1,
      }} />
    </View>
  );
}

function EmailIcon() {
  return (
    <View style={{ width: 18, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: "#60A5FA", justifyContent: "center", alignItems: "center" }}>
      <View style={{
        width: 16, height: 1.5,
        backgroundColor: "transparent",
        borderTopWidth: 6, borderTopColor: "transparent",
        borderLeftWidth: 8, borderLeftColor: "transparent",
        borderRightWidth: 8, borderRightColor: "transparent",
      }} />
      <View style={{
        position: "absolute", top: 0, left: 0,
        width: 0, height: 0,
        borderTopWidth: 7, borderTopColor: "#60A5FA",
        borderLeftWidth: 9, borderLeftColor: "transparent",
        borderRightWidth: 9, borderRightColor: "transparent",
      }} />
    </View>
  );
}

function PhoneIcon() {
  return (
    <View style={{ width: 14, height: 18 }}>
      <View style={{
        width: 14, height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: "#34D399",
      }} />
      <View style={{
        position: "absolute", bottom: 2, left: "50%",
        width: 4, height: 4,
        borderRadius: 2,
        backgroundColor: "#34D399",
        marginLeft: -2,
      }} />
    </View>
  );
}

function CarIcon() {
  return (
    <View style={{ width: 22, height: 14 }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: 22, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: "#A78BFA" }} />
      <View style={{ position: "absolute", bottom: 0, left: 2, width: 5, height: 5, borderRadius: 2.5, borderWidth: 1.5, borderColor: "#A78BFA", backgroundColor: CARD }} />
      <View style={{ position: "absolute", bottom: 0, right: 2, width: 5, height: 5, borderRadius: 2.5, borderWidth: 1.5, borderColor: "#A78BFA", backgroundColor: CARD }} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#FB923C" }} />
      <View style={{ position: "absolute", top: 4, left: 0, right: 0, height: 1.5, backgroundColor: "#FB923C" }} />
      <View style={{ position: "absolute", top: -1, left: 4, width: 2, height: 5, backgroundColor: "#FB923C", borderRadius: 1 }} />
      <View style={{ position: "absolute", top: -1, right: 4, width: 2, height: 5, backgroundColor: "#FB923C", borderRadius: 1 }} />
    </View>
  );
}

function ShieldIcon() {
  return (
    <View style={{ width: 16, height: 20, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: 16, height: 18,
        borderTopLeftRadius: 4, borderTopRightRadius: 4,
        borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
        borderWidth: 1.5,
        borderColor: "#34D399",
      }} />
      <View style={{
        position: "absolute",
        width: 6, height: 4,
        borderLeftWidth: 1.5, borderBottomWidth: 1.5,
        borderColor: "#34D399",
        transform: [{ rotate: "-45deg" }],
        top: 7,
      }} />
    </View>
  );
}

function IdCardIcon() {
  return (
    <View style={{ width: 20, height: 14 }}>
      <View style={{ width: 20, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: "#60A5FA" }} />
      <View style={{ position: "absolute", left: 3, top: 3, width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: "#60A5FA" }} />
      <View style={{ position: "absolute", right: 3, top: 4, width: 5, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
      <View style={{ position: "absolute", right: 3, top: 7, width: 4, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
    </View>
  );
}

function CopyIcon() {
  return (
    <View style={{ width: 16, height: 18 }}>
      <View style={{ position: "absolute", top: 2, left: 2, width: 12, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: DIM }} />
      <View style={{ position: "absolute", top: 0, left: 0, width: 12, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: WHITE, backgroundColor: CARD }} />
    </View>
  );
}

function StatsIcon() {
  return (
    <View style={{ width: 20, height: 18, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      <View style={{ width: 4, height: 10, backgroundColor: "#A78BFA", borderRadius: 2 }} />
      <View style={{ width: 4, height: 16, backgroundColor: "#A78BFA", borderRadius: 2 }} />
      <View style={{ width: 4, height: 7, backgroundColor: "#A78BFA", borderRadius: 2 }} />
      <View style={{ width: 4, height: 13, backgroundColor: "#A78BFA", borderRadius: 2 }} />
    </View>
  );
}

function BoxIcon() {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#60A5FA" }} />
      <View style={{ position: "absolute", top: 4, left: 4, right: 4, height: 1.5, backgroundColor: "#60A5FA" }} />
      <View style={{ position: "absolute", top: 4, left: "50%", marginLeft: -0.75, width: 1.5, height: 10, backgroundColor: "#60A5FA" }} />
    </View>
  );
}

function CheckCircleIcon() {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#22C55E" }} />
      <View style={{
        position: "absolute",
        width: 7, height: 4,
        borderLeftWidth: 2, borderBottomWidth: 2,
        borderColor: "#22C55E",
        transform: [{ rotate: "-45deg" }],
        top: 9,
      }} />
    </View>
  );
}

function XCircleIcon() {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#EF4444" }} />
      <View style={{ position: "absolute", width: 10, height: 1.5, backgroundColor: "#EF4444", borderRadius: 1, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 10, height: 1.5, backgroundColor: "#EF4444", borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

function DocIcon() {
  return (
    <View style={{ width: 22, height: 26 }}>
      <View style={{ width: 22, height: 26, borderRadius: 4, borderWidth: 1.5, borderColor: WHITE }} />
      <View style={{ position: "absolute", top: 6, left: 4, right: 4, height: 1.5, backgroundColor: WHITE, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 11, left: 4, right: 4, height: 1.5, backgroundColor: WHITE, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 16, left: 4, width: 8, height: 1.5, backgroundColor: WHITE, borderRadius: 1 }} />
    </View>
  );
}

// ─── tab icons ────────────────────────────────────────────────────────────────
function GridIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, flexDirection: "row", flexWrap: "wrap", gap: 3, padding: 1 }}>
      {[0, 1, 2, 3].map(i => <View key={i} style={{ width: 5, height: 5, backgroundColor: color, borderRadius: 1 }} />)}
    </View>
  );
}

function PeopleIcon({ color }: { color: string }) {
  const sz = 20;
  return (
    <View style={{ width: sz, height: sz }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: sz * 0.42, height: sz * 0.42, borderRadius: sz * 0.21, borderWidth: 1.5, borderColor: color, opacity: 0.5 }} />
      <View style={{ position: "absolute", left: 0, bottom: 0, width: sz * 0.62, height: sz * 0.36, borderTopLeftRadius: sz * 0.31, borderTopRightRadius: sz * 0.31, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, opacity: 0.5 }} />
      <View style={{ position: "absolute", right: 0, top: sz * 0.04, width: sz * 0.46, height: sz * 0.46, borderRadius: sz * 0.23, borderWidth: 1.5, borderColor: color }} />
      <View style={{ position: "absolute", right: 0, bottom: 0, width: sz * 0.72, height: sz * 0.4, borderTopLeftRadius: sz * 0.36, borderTopRightRadius: sz * 0.36, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0 }} />
    </View>
  );
}

function TruckIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 16 }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: 14, height: 10, borderWidth: 1.5, borderColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", right: 0, top: 3, width: 8, height: 7, borderWidth: 1.5, borderColor: color, borderTopRightRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 0, left: 2, width: 5, height: 5, borderRadius: 2.5, borderWidth: 1.5, borderColor: color, backgroundColor: TAB_BG }} />
      <View style={{ position: "absolute", bottom: 0, right: 2, width: 5, height: 5, borderRadius: 2.5, borderWidth: 1.5, borderColor: color, backgroundColor: TAB_BG }} />
    </View>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      {[9, 16, 7, 13].map((h, i) => <View key={i} style={{ width: 3, height: h, backgroundColor: color, borderRadius: 2 }} />)}
    </View>
  );
}

function MoreIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 1 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
      ))}
    </View>
  );
}

// ─── bottom tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { label: "Dashboard",  Icon: GridIcon   },
  { label: "Drivers",    Icon: PeopleIcon },
  { label: "Deliveries", Icon: TruckIcon  },
  { label: "Reports",    Icon: ChartIcon  },
  { label: "More",       Icon: MoreIcon   },
] as const;

function BottomTabs({ onPress }: { onPress: (i: number) => void }) {
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
  bar:       { flexDirection: "row", backgroundColor: TAB_BG, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10, paddingBottom: 6 },
  item:      { flex: 1, alignItems: "center", gap: 4, position: "relative", paddingTop: 8 },
  indicator: { position: "absolute", top: 0, width: 32, height: 3, borderRadius: 2, backgroundColor: ORANGE },
  label:     { fontFamily: "Poppins_500Medium", fontSize: 10, lineHeight: 14 },
});

// ─── info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  isStatus,
  statusCfgVal,
  isCopy,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isStatus?: boolean;
  statusCfgVal?: ReturnType<typeof statusCfg>;
  isCopy?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[ir.row, last && { borderBottomWidth: 0 }]}>
      <View style={ir.iconWrap}>{icon}</View>
      <Text style={ir.label}>{label}</Text>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {isStatus && statusCfgVal ? (
          <View style={[ir.statusBadge, { backgroundColor: statusCfgVal.bg }]}>
            <View style={[ir.statusDot, { backgroundColor: statusCfgVal.dot }]} />
            <Text style={[ir.statusText, { color: statusCfgVal.text }]}>{value}</Text>
          </View>
        ) : isCopy ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={ir.value}>{value}</Text>
            <Pressable style={ir.copyBtn} hitSlop={8}>
              <CopyIcon />
            </Pressable>
          </View>
        ) : (
          <Text style={ir.value} numberOfLines={1}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 },
  iconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(96,165,250,0.08)", alignItems: "center", justifyContent: "center" },
  label:      { fontFamily: "Poppins_500Medium", fontSize: 13.5, color: WHITE, flex: 1 },
  value:      { fontFamily: "Poppins_400Regular", fontSize: 13, color: DIM, textAlign: "right", flexShrink: 1 },
  statusBadge:{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusDot:  { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  copyBtn:    { width: 32, height: 32, borderRadius: 8, backgroundColor: FAINT, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
});

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  pct,
  pctUp,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: string;
  pctUp: boolean;
  iconBg: string;
}) {
  return (
    <View style={stc.card}>
      <View style={[stc.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={stc.label}>{label}</Text>
      <Text style={stc.value}>{value}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: 4, borderRightWidth: 4,
            borderLeftColor: "transparent", borderRightColor: "transparent",
            ...(pctUp
              ? { borderBottomWidth: 7, borderBottomColor: "#EF4444" }
              : { borderTopWidth: 7, borderTopColor: "#22C55E" }),
          }} />
          <Text style={[stc.pct, { color: pctUp ? "#EF4444" : "#22C55E" }]}>{pct}</Text>
        </View>
      </View>
      <Text style={stc.sub}>vs last 30 days</Text>
    </View>
  );
}

const stc = StyleSheet.create({
  card:    { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 5 },
  iconWrap:{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  label:   { fontFamily: "Poppins_400Regular", fontSize: 11.5, color: DIM },
  value:   { fontFamily: "Poppins_700Bold", fontSize: 26, color: WHITE, lineHeight: 32 },
  pct:     { fontFamily: "Poppins_600SemiBold", fontSize: 11.5 },
  sub:     { fontFamily: "Poppins_400Regular", fontSize: 10, color: MUTED },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminDriverDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const driver = MOCK_DRIVERS.find(d => d.id === id) ?? DEFAULT_DRIVER;
  const cfg    = statusCfg(driver.status);

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin" as never);
    if (i === 1) router.back();
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <Text style={s.headerTitle}>Driver Details</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable style={s.iconBtn} hitSlop={10}>
            <MessageIcon />
          </Pressable>
          <Pressable style={s.iconBtn} hitSlop={10}>
            <DotsIcon />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── profile section ── */}
        <View style={s.profileSection}>
          {/* avatar with status-colored ring */}
          <View style={[s.avatarRing, { borderColor: cfg.dot }]}>
            <Image source={driver.photo} style={s.avatar} />
            <View style={[s.onlineDot, { backgroundColor: cfg.dot }]} />
          </View>

          {/* name + badge + id + type */}
          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.driverName}>{driver.name}</Text>
              <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
                <Text style={[s.statusText, { color: cfg.text }]}>{driver.status}</Text>
              </View>
            </View>
            <Text style={s.driverExtId}>ID: <Text style={{ color: ORANGE }}>{driver.extId}</Text></Text>
            <Text style={s.driverType}>{driver.carType}</Text>
          </View>
        </View>

        {/* ── personal information card ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}>
              <PersonIcon />
            </View>
            <Text style={s.cardTitle}>Personal Information</Text>
          </View>

          <InfoRow
            icon={<EmailIcon />}
            label="Email"
            value={driver.email}
          />
          <InfoRow
            icon={<PhoneIcon />}
            label="Phone"
            value={driver.phone}
          />
          <InfoRow
            icon={<CarIcon />}
            label="Driver Type"
            value={driver.carType}
          />
          <InfoRow
            icon={<CalendarIcon />}
            label="Joined Date"
            value={driver.joinedDate}
          />
          <InfoRow
            icon={<ShieldIcon />}
            label="Status"
            value={driver.status}
            isStatus
            statusCfgVal={cfg}
          />
          <InfoRow
            icon={<IdCardIcon />}
            label="External Driver ID"
            value={driver.externalDriverId}
            isCopy
            last
          />
        </View>

        {/* ── statistics card ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}>
              <StatsIcon />
            </View>
            <Text style={s.cardTitle}>Statistics</Text>
          </View>
          <View style={s.statsRow}>
            <StatCard
              icon={<BoxIcon />}
              label="Total Deliveries"
              value={driver.stats.total}
              pct={driver.totalPct}
              pctUp={false}
              iconBg="rgba(96,165,250,0.12)"
            />
            <StatCard
              icon={<CheckCircleIcon />}
              label="Completed"
              value={driver.stats.completed}
              pct={driver.completedPct}
              pctUp={false}
              iconBg="rgba(34,197,94,0.12)"
            />
            <StatCard
              icon={<XCircleIcon />}
              label="Cancelled"
              value={driver.stats.cancelled}
              pct={driver.cancelledPct}
              pctUp={driver.cancelledUp}
              iconBg="rgba(239,68,68,0.12)"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── view all documents button ── */}
      <View style={s.docBtnWrap}>
        <Pressable style={s.docBtn} onPress={() => router.push(`/admin/driver-documents?id=${driver.id}` as never)}>
          <DocIcon />
          <Text style={s.docBtnText}>View All Documents</Text>
          <View style={{ marginLeft: "auto" }}>
            <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: WHITE, transform: [{ rotate: "45deg" }] }} />
          </View>
        </Pressable>
      </View>

      {/* ── bottom tabs ── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: WHITE },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: FAINT, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },

  // profile
  profileSection: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  avatarRing:     { width: 84, height: 84, borderRadius: 42, borderWidth: 2, position: "relative" },
  avatar:         { width: 80, height: 80, borderRadius: 40, margin: 0 },
  onlineDot:      { position: "absolute", bottom: 3, right: 1, width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: BG },

  profileInfo:  { flex: 1, paddingTop: 4, gap: 4 },
  nameRow:      { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  driverName:   { fontFamily: "Poppins_700Bold", fontSize: 20, color: WHITE },
  statusBadge:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:    { width: 7, height: 7, borderRadius: 3.5 },
  statusText:   { fontFamily: "Poppins_600SemiBold", fontSize: 11.5 },
  driverExtId:  { fontFamily: "Poppins_500Medium", fontSize: 13.5, color: DIM },
  driverType:   { fontFamily: "Poppins_400Regular", fontSize: 13, color: MUTED },

  // cards
  scroll:     { paddingTop: 4 },
  card:       { marginHorizontal: 16, marginBottom: 14, backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  cardIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: FAINT, alignItems: "center", justifyContent: "center" },
  cardTitle:  { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: WHITE },

  // stats
  statsRow: { flexDirection: "row", gap: 10, paddingBottom: 12, paddingTop: 8 },

  // doc button
  docBtnWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  docBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: WHITE, flex: 1 },
});
