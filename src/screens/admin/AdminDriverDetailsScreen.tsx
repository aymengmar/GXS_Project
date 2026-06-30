import { assignExternalDriverId, changeDriverStatus, fetchAdminDriverDetail, getDriverPhotoProxyUrl, DriverDetailResponse } from "@/api/backendClient";
import { sessionStore } from "@/store/sessionStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
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
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.60)";
const MUTED   = "rgba(255,255,255,0.28)";
const FAINT   = "rgba(255,255,255,0.08)";
const TAB_BG  = "#060C18";

// ─── fallback avatars ─────────────────────────────────────────────────────────
const FALLBACK_AVATARS = [
  require("@/assets/images/avatars/driver1.jpg"),
  require("@/assets/images/avatars/driver2.jpg"),
  require("@/assets/images/avatars/driver3.jpg"),
  require("@/assets/images/avatars/driver4.jpg"),
  require("@/assets/images/avatars/driver5.jpg"),
  require("@/assets/images/avatars/driver6.jpg"),
  require("@/assets/images/avatars/driver7.jpg"),
  require("@/assets/images/avatars/driver8.jpg"),
];

function pickFallbackAvatar(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return FALLBACK_AVATARS[Math.abs(hash) % FALLBACK_AVATARS.length];
}

// ─── status config ────────────────────────────────────────────────────────────
function statusCfg(statusColor: string) {
  switch (statusColor) {
    case "green":  return { dot: GREEN,     bg: "rgba(34,197,94,0.15)",   text: "#4ADE80" };
    case "yellow": return { dot: "#F59E0B", bg: "rgba(245,158,11,0.15)",  text: "#FCD34D" };
    case "red":    return { dot: "#EF4444", bg: "rgba(239,68,68,0.15)",   text: "#FC8181" };
    default:       return { dot: MUTED,    bg: "rgba(255,255,255,0.08)", text: DIM };
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
      <View style={{ width: 18, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: WHITE }} />
      <View style={{ position: "absolute", bottom: 0, left: 4, width: 6, height: 5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: WHITE }} />
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
      <View style={{ width: 16, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1.5, borderColor: "#60A5FA", borderBottomWidth: 0, marginTop: 1 }} />
    </View>
  );
}

function EmailIcon() {
  return (
    <View style={{ width: 18, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: "#60A5FA", justifyContent: "center", alignItems: "center" }}>
      <View style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, borderTopWidth: 7, borderTopColor: "#60A5FA", borderLeftWidth: 9, borderLeftColor: "transparent", borderRightWidth: 9, borderRightColor: "transparent" }} />
    </View>
  );
}

function PhoneIcon() {
  return (
    <View style={{ width: 14, height: 18 }}>
      <View style={{ width: 14, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#34D399" }} />
      <View style={{ position: "absolute", bottom: 2, left: "50%", width: 4, height: 4, borderRadius: 2, backgroundColor: "#34D399", marginLeft: -2 }} />
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
      <View style={{ width: 16, height: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1.5, borderColor: "#34D399" }} />
      <View style={{ position: "absolute", width: 6, height: 4, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#34D399", transform: [{ rotate: "-45deg" }], top: 7 }} />
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

function EditIcon() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: WHITE, borderRadius: 2, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", bottom: 0, right: 0, width: 5, height: 1.5, backgroundColor: WHITE, borderRadius: 1 }} />
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
      <View style={{ position: "absolute", width: 7, height: 4, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: "#22C55E", transform: [{ rotate: "-45deg" }], top: 9 }} />
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

function InvoiceIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 22 }}>
      <View style={{ width: 18, height: 22, borderWidth: 1.8, borderColor: color, borderRadius: 4 }} />
      <View style={{ position: "absolute", top: 5,  left: 4, right: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 9,  left: 4, right: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 13, left: 4, width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
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

// ─── bottom tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { label: "Dashboard", Icon: GridIcon    },
  { label: "Users",     Icon: PeopleIcon  },
  { label: "Invoices",  Icon: InvoiceIcon },
  { label: "Reports",   Icon: ChartIcon   },
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
  isEdit,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isStatus?: boolean;
  statusCfgVal?: ReturnType<typeof statusCfg>;
  isCopy?: boolean;
  isEdit?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  const inner = (
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
        ) : isEdit ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={ir.value}>{value}</Text>
            <Pressable style={ir.copyBtn} hitSlop={8} onPress={onPress}>
              <EditIcon />
            </Pressable>
          </View>
        ) : (
          <Text style={ir.value} numberOfLines={1}>{value}</Text>
        )}
      </View>
    </View>
  );

  if (onPress && (isEdit || !isCopy)) {
    return (
      <Pressable onPress={isEdit ? onPress : undefined}>
        {inner}
      </Pressable>
    );
  }
  return inner;
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

  const [driver, setDriver] = useState<DriverDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [extIdModalVisible, setExtIdModalVisible] = useState(false);
  const [extIdInput, setExtIdInput] = useState("");
  const [extIdSaving, setExtIdSaving] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const session = sessionStore.get();
    if (!session) return;

    setAccessToken(session.access_token);
    setLoading(true);
    setError(null);
    setPhotoError(false);

    fetchAdminDriverDetail(session.access_token, id)
      .then(setDriver)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const openExtIdModal = () => {
    setExtIdInput(driver?.external_driver_id ?? "");
    setExtIdModalVisible(true);
  };

  const handleSaveExtId = async () => {
    const trimmed = extIdInput.trim();
    if (!trimmed) {
      Alert.alert("External Driver ID required", "Please enter an External Driver ID.");
      return;
    }
    if (!accessToken || !driver) return;
    setExtIdSaving(true);
    try {
      await assignExternalDriverId(accessToken, driver.id, trimmed);
      setExtIdModalVisible(false);
      const updated = await fetchAdminDriverDetail(accessToken, driver.id);
      setDriver(updated);
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setExtIdSaving(false);
    }
  };

  const handleOpenStatusModal = () => {
    const extId = driver?.external_driver_id?.trim();
    if (!extId || extId === "Not assigned") {
      Alert.alert(
        "External Driver ID required",
        "Assign External Driver ID before changing status.",
      );
      return;
    }
    setStatusModalVisible(true);
  };

  const handleSelectStatus = (selected: "active" | "pending" | "blocked") => {
    const labels: Record<string, string> = { active: "Active", pending: "Pending", blocked: "Blocked" };
    Alert.alert(
      "Change status?",
      `Do you want to change this driver status to ${labels[selected]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            if (!accessToken || !driver) return;
            setStatusSaving(true);
            try {
              await changeDriverStatus(accessToken, driver.id, selected);
              setStatusModalVisible(false);
              const updated = await fetchAdminDriverDetail(accessToken, driver.id);
              setDriver(updated);
            } catch (err) {
              Alert.alert("Error", (err as Error).message);
            } finally {
              setStatusSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleCallDriver = () => {
    const phone = driver?.phone?.trim();
    if (!phone) {
      Alert.alert("No phone number", "No phone number available for this driver.");
      return;
    }
    Alert.alert(
      "Call driver?",
      `Do you want to call ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"          as any);
    if (i === 1) router.replace("/admin/drivers"  as any);
    if (i === 2) router.replace("/admin/invoices" as any);
    if (i === 3) router.replace("/admin/reports"  as any);
  };

  const cfg = driver ? statusCfg(driver.status_color) : statusCfg("gray");

  // Use the backend proxy so Android can resolve the Supabase storage hostname.
  // Fall back to a local avatar when no photo is in DB or if the proxy request fails.
  const photoSource =
    driver?.profile_photo_url && accessToken && !photoError
      ? { uri: getDriverPhotoProxyUrl(driver.id, accessToken) }
      : pickFallbackAvatar(id ?? "0");

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

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : driver ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── profile section ── */}
            <View style={s.profileSection}>
              <View style={[s.avatarRing, { borderColor: cfg.dot }]}>
                <Image
                  source={photoSource}
                  style={s.avatar}
                  onError={() => setPhotoError(true)}
                />
                <View style={[s.onlineDot, { backgroundColor: cfg.dot }]} />
              </View>

              <View style={s.profileInfo}>
                <View style={s.nameRow}>
                  <Text style={s.driverName}>{driver.full_name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
                    <Text style={[s.statusText, { color: cfg.text }]}>{driver.status_label}</Text>
                  </View>
                </View>
                <Text style={s.driverExtId}>
                  ID: <Text style={{ color: ORANGE }}>{driver.display_driver_id}</Text>
                </Text>
                <Text style={s.driverType}>{driver.driver_type_label}</Text>
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

              <InfoRow icon={<EmailIcon />} label="Email" value={driver.email} />
              <Pressable onPress={handleCallDriver}>
                <InfoRow icon={<PhoneIcon />} label="Phone" value={driver.phone ?? "—"} />
              </Pressable>
              <InfoRow icon={<CarIcon />} label="Driver Type" value={driver.driver_type_label} />
              <InfoRow icon={<CalendarIcon />} label="Joined Date" value={driver.joined_date_label || "—"} />
              <Pressable onPress={handleOpenStatusModal}>
                <InfoRow
                  icon={<ShieldIcon />}
                  label="Status"
                  value={driver.status_label}
                  isStatus
                  statusCfgVal={cfg}
                />
              </Pressable>
              <InfoRow
                icon={<IdCardIcon />}
                label="External Driver ID"
                value={driver.display_driver_id}
                isEdit
                onPress={openExtIdModal}
                last
              />
            </View>

            {/* ── statistics card (static) ── */}
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
                  value={156}
                  pct="12.5%"
                  pctUp={false}
                  iconBg="rgba(96,165,250,0.12)"
                />
                <StatCard
                  icon={<CheckCircleIcon />}
                  label="Completed"
                  value={142}
                  pct="10.3%"
                  pctUp={false}
                  iconBg="rgba(34,197,94,0.12)"
                />
                <StatCard
                  icon={<XCircleIcon />}
                  label="Cancelled"
                  value={14}
                  pct="2.1%"
                  pctUp={false}
                  iconBg="rgba(239,68,68,0.12)"
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── view all documents button ── */}
          <View style={s.docBtnWrap}>
            <Pressable
              style={s.docBtn}
              onPress={() => router.push(`/admin/driver-documents?id=${driver.id}` as never)}
            >
              <DocIcon />
              <Text style={s.docBtnText}>View All Documents</Text>
              <View style={{ marginLeft: "auto" }}>
                <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: WHITE, transform: [{ rotate: "45deg" }] }} />
              </View>
            </Pressable>
          </View>
          {/* spacer so docBtnWrap clears the absolutely-positioned bottom nav */}
          <View style={{ height: 90 }} />
        </>
      ) : null}

      {/* ── bottom tabs — absolutely positioned so keyboard cannot push it up ── */}
      <View style={s.bottomNavWrap}>
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: TAB_BG }}>
          <BottomTabs onPress={handleTabPress} />
        </SafeAreaView>
      </View>

      {/* ── Assign External Driver ID modal ── */}
      <Modal visible={extIdModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={md.backdrop}>
          <View style={md.box}>
            <Text style={md.title}>Assign External Driver ID</Text>
            <TextInput
              style={md.input}
              value={extIdInput}
              onChangeText={setExtIdInput}
              placeholder="e.g. EXT-001"
              placeholderTextColor={MUTED}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!extIdSaving}
            />
            <View style={md.btnRow}>
              <Pressable
                style={[md.btn, md.cancelBtn]}
                onPress={() => setExtIdModalVisible(false)}
                disabled={extIdSaving}
              >
                <Text style={md.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[md.btn, md.saveBtn, extIdSaving && { opacity: 0.7 }]}
                onPress={handleSaveExtId}
                disabled={extIdSaving}
              >
                {extIdSaving
                  ? <ActivityIndicator color={WHITE} size="small" />
                  : <Text style={md.saveText}>Save</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Driver Status modal ── */}
      <Modal visible={statusModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={md.backdrop}>
          <View style={md.box}>
            <Text style={md.title}>Change driver status</Text>
            {(["pending", "active", "blocked"] as const).map((opt) => {
              const optCfg = statusCfg(
                opt === "active" ? "green" : opt === "pending" ? "yellow" : "red",
              );
              const optLabel = opt === "active" ? "Active" : opt === "pending" ? "Pending" : "Blocked";
              const currentDbStatus = driver?.status ?? "";
              const isSelected =
                (opt === "active"  && currentDbStatus === "approved") ||
                (opt === "pending" && currentDbStatus === "pending")  ||
                (opt === "blocked" && currentDbStatus === "rejected");
              return (
                <Pressable
                  key={opt}
                  style={[sm.option, isSelected && { borderColor: optCfg.dot, backgroundColor: optCfg.bg }]}
                  onPress={() => !statusSaving && handleSelectStatus(opt)}
                  disabled={statusSaving}
                >
                  <View style={[sm.dot, { backgroundColor: optCfg.dot }]} />
                  <Text style={[sm.optLabel, { color: isSelected ? optCfg.text : WHITE }]}>{optLabel}</Text>
                  {isSelected && <View style={sm.checkMark} />}
                </Pressable>
              );
            })}
            <Pressable
              style={[md.btn, md.cancelBtn, { marginTop: 4 }]}
              onPress={() => setStatusModalVisible(false)}
              disabled={statusSaving}
            >
              {statusSaving
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={md.cancelText}>Cancel</Text>
              }
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#EF4444", textAlign: "center", paddingHorizontal: 24 },

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

  // bottom nav
  bottomNavWrap: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5 },

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

// ─── status modal option styles ───────────────────────────────────────────────
const sm = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: FAINT,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  optLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, flex: 1 },
  checkMark: {
    width: 7,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: WHITE,
    transform: [{ rotate: "45deg" }],
    marginTop: -3,
  },
});

// ─── modal styles ─────────────────────────────────────────────────────────────
const md = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  box: {
    width: "100%",
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 18,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: WHITE,
    textAlign: "center",
  },
  input: {
    backgroundColor: FAINT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: WHITE,
  },
  btnRow: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { backgroundColor: FAINT, borderWidth: 1, borderColor: BORDER },
  saveBtn:   { backgroundColor: ORANGE },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: DIM },
  saveText:   { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: WHITE },
});
