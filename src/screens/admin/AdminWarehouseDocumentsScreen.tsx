import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG     = "#080F1D";
const CARD   = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN  = "#22C55E";
const RED    = "#EF4444";
const AMBER  = "#F59E0B";
const WHITE  = "#FFFFFF";
const DIM    = "rgba(255,255,255,0.60)";
const MUTED  = "rgba(255,255,255,0.28)";
const FAINT  = "rgba(255,255,255,0.08)";
const TAB_BG = "#060C18";

// ─── initials helper ──────────────────────────────────────────────────────────
function initials(name: string): string {
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

// ─── status helpers ───────────────────────────────────────────────────────────
function statusCfg(color: string) {
  switch (color) {
    case "green":  return { dot: GREEN, bg: "rgba(34,197,94,0.15)",   text: "#4ADE80" };
    case "yellow": return { dot: AMBER, bg: "rgba(245,158,11,0.15)",  text: "#FCD34D" };
    case "red":    return { dot: RED,   bg: "rgba(239,68,68,0.15)",   text: "#FC8181" };
    default:       return { dot: MUTED, bg: "rgba(255,255,255,0.08)", text: DIM };
  }
}

function docStatusCfg(color: string) {
  switch (color) {
    case "green":  return { badgeBg: "rgba(34,197,94,0.15)",  badgeText: "#4ADE80", badgeBorder: "rgba(34,197,94,0.25)",  btnBorder: "rgba(255,255,255,0.18)", btnText: DIM };
    case "red":    return { badgeBg: "rgba(239,68,68,0.15)",  badgeText: "#FC8181", badgeBorder: "rgba(239,68,68,0.3)",   btnBorder: "rgba(239,68,68,0.6)",    btnText: "#FC8181" };
    default:       return { badgeBg: "rgba(245,158,11,0.15)", badgeText: "#FCD34D", badgeBorder: "rgba(245,158,11,0.3)",  btnBorder: "rgba(245,158,11,0.6)",   btnText: "#FCD34D" };
  }
}

// ─── header icons ─────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 11, height: 11, borderLeftWidth: 2.5, borderBottomWidth: 2.5, borderColor: WHITE, transform: [{ rotate: "45deg" }], marginLeft: 4 }} />
    </View>
  );
}

function FilterFunnelIcon() {
  return (
    <View style={{ width: 16, height: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
      <View style={{ width: 16, height: 2, backgroundColor: WHITE, borderRadius: 1 }} />
      <View style={{ width: 11, height: 2, backgroundColor: WHITE, borderRadius: 1 }} />
      <View style={{ width: 6,  height: 2, backgroundColor: WHITE, borderRadius: 1 }} />
    </View>
  );
}

// ─── stat section icons ───────────────────────────────────────────────────────
function DocPageIcon() {
  return (
    <View style={{ width: 24, height: 30 }}>
      <View style={{ width: 24, height: 30, borderRadius: 4, borderWidth: 1.8, borderColor: "#60A5FA" }}>
        <View style={{ position: "absolute", top: 7,  left: 4, right: 4, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 13, left: 4, right: 4, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 19, left: 4, right: 8, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 25, left: 4, right: 11, height: 1.5, backgroundColor: "#60A5FA", borderRadius: 1 }} />
      </View>
    </View>
  );
}

function ApprovedStatIcon() {
  return (
    <View style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 11, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: "#22C55E", transform: [{ rotate: "-45deg" }], marginTop: -2 }} />
      </View>
    </View>
  );
}

function PendingStatIcon() {
  return (
    <View style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: AMBER, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: 2, height: 9, backgroundColor: AMBER, borderRadius: 1, bottom: 10.5 }} />
        <View style={{ position: "absolute", width: 7, height: 2, backgroundColor: AMBER, borderRadius: 1, left: 14 }} />
      </View>
    </View>
  );
}

function RejectedStatIcon() {
  return (
    <View style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: RED, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: 13, height: 2, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "45deg" }] }} />
        <View style={{ position: "absolute", width: 13, height: 2, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
      </View>
    </View>
  );
}

// ─── document type icon boxes ─────────────────────────────────────────────────
function IdPassportIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 28, height: 22 }}>
      <View style={{ width: 28, height: 22, borderRadius: 4, borderWidth: 1.8, borderColor: tint }}>
        <View style={{ position: "absolute", left: 4, top: 4, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: tint }} />
        <View style={{ position: "absolute", right: 4, top: 5,  width: 8, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", right: 4, top: 9,  width: 8, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", right: 4, top: 13, width: 6, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function WorkContractIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 24, height: 30 }}>
      <View style={{ width: 24, height: 30, borderRadius: 4, borderWidth: 1.8, borderColor: tint }}>
        <View style={{ position: "absolute", top: 7,  left: 4, right: 4, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 12, left: 4, right: 4, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 17, left: 4, right: 8, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", bottom: 6, right: 4, width: 8, height: 1.5, backgroundColor: tint, borderRadius: 1, transform: [{ rotate: "-30deg" }] }} />
        <View style={{ position: "absolute", bottom: 4, right: 3, width: 5, height: 1.5, backgroundColor: tint, borderRadius: 1, transform: [{ rotate: "60deg" }] }} />
      </View>
    </View>
  );
}

function SafetyShieldIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 24, height: 28, alignItems: "center" }}>
      <View style={{ width: 24, height: 28, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1.8, borderColor: tint, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 10, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: tint, transform: [{ rotate: "-45deg" }], marginTop: -3 }} />
      </View>
    </View>
  );
}

function HomeAddressIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 11, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: tint }} />
      <View style={{ width: 22, height: 15, borderWidth: 1.8, borderColor: tint, borderTopWidth: 0, alignItems: "center", justifyContent: "flex-end" }}>
        <View style={{ width: 7, height: 9, borderWidth: 1.5, borderColor: tint, borderBottomWidth: 0, borderRadius: 1 }} />
      </View>
    </View>
  );
}

type WDocIconType = "id_passport" | "work_contract" | "safety_training" | "address_registration";

const WDOC_ICON_CFG: Record<WDocIconType, { bg: string; tint: string }> = {
  id_passport:          { bg: "rgba(124,58,237,0.22)",  tint: "#A78BFA" },
  work_contract:        { bg: "rgba(59,130,246,0.22)",  tint: "#60A5FA" },
  safety_training:      { bg: "rgba(34,197,94,0.20)",   tint: "#4ADE80" },
  address_registration: { bg: "rgba(251,146,60,0.22)",  tint: "#FB923C" },
};

function WDocIconBox({ type }: { type: WDocIconType }) {
  const { bg, tint } = WDOC_ICON_CFG[type];
  return (
    <View style={[dib.box, { backgroundColor: bg, borderRadius: 16 }]}>
      {type === "id_passport"          && <IdPassportIcon tint={tint} />}
      {type === "work_contract"        && <WorkContractIcon tint={tint} />}
      {type === "safety_training"      && <SafetyShieldIcon tint={tint} />}
      {type === "address_registration" && <HomeAddressIcon tint={tint} />}
    </View>
  );
}

const dib = StyleSheet.create({
  box: { width: 58, height: 58, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});

// ─── calendar icon ────────────────────────────────────────────────────────────
function CalIcon() {
  return (
    <View style={{ width: 13, height: 13 }}>
      <View style={{ width: 13, height: 13, borderRadius: 2.5, borderWidth: 1, borderColor: MUTED }} />
      <View style={{ position: "absolute", top: 3, left: 0, right: 0, height: 1, backgroundColor: MUTED }} />
      <View style={{ position: "absolute", top: -1, left: 3,  width: 1.5, height: 4, backgroundColor: MUTED, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: -1, right: 3, width: 1.5, height: 4, backgroundColor: MUTED, borderRadius: 1 }} />
    </View>
  );
}

// ─── static document thumbnail placeholder ────────────────────────────────────
function StaticDocThumbnail() {
  return (
    <View style={[tm.base, { backgroundColor: CARD, alignItems: "center", justifyContent: "center", borderColor: BORDER }]}>
      <View style={{ width: 28, height: 34, borderRadius: 4, borderWidth: 1.5, borderColor: MUTED }}>
        <View style={{ position: "absolute", top: 7,  left: 4, right: 4, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 13, left: 4, right: 4, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 19, left: 4, right: 8, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
      </View>
    </View>
  );
}

const tm = StyleSheet.create({
  base: { width: 84, height: 64, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
});

// ─── doc status badge icon ────────────────────────────────────────────────────
function DocBadgeIcon({ color }: { color: string }) {
  if (color === "green") return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 6, height: 4, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#22C55E", transform: [{ rotate: "-45deg" }], marginTop: -1 }} />
    </View>
  );
  if (color === "red") return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: RED, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 7, height: 1.5, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 7, height: 1.5, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
  return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: AMBER, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 1.5, height: 5, backgroundColor: AMBER, borderRadius: 1, bottom: 4.75 }} />
      <View style={{ position: "absolute", width: 3.5, height: 1.5, backgroundColor: AMBER, borderRadius: 1, left: 6.5 }} />
    </View>
  );
}

// ─── mock document type ───────────────────────────────────────────────────────
type MockDoc = {
  id: string;
  type: WDocIconType;
  title: string;
  description: string;
  uploaded: string;
  statusLabel: string;
  statusColor: string;
};

const MOCK_DOCS: MockDoc[] = [
  {
    id: "1",
    type: "id_passport",
    title: "ID / Passport",
    description: "Government issued ID or Passport",
    uploaded: "Jun 30, 2026",
    statusLabel: "Approved",
    statusColor: "green",
  },
  {
    id: "2",
    type: "work_contract",
    title: "Work Contract",
    description: "Signed warehouse employment contract",
    uploaded: "Jun 30, 2026",
    statusLabel: "Pending",
    statusColor: "yellow",
  },
  {
    id: "3",
    type: "safety_training",
    title: "Safety Training",
    description: "Warehouse safety training certificate",
    uploaded: "Jun 29, 2026",
    statusLabel: "Approved",
    statusColor: "green",
  },
  {
    id: "4",
    type: "address_registration",
    title: "Address Registration",
    description: "Registration certificate or address proof",
    uploaded: "Jun 28, 2026",
    statusLabel: "Rejected",
    statusColor: "red",
  },
];

// ─── document card ────────────────────────────────────────────────────────────
function DocumentCard({ doc }: { doc: MockDoc }) {
  const cfg      = docStatusCfg(doc.statusColor);
  const btnLabel = doc.statusLabel === "Pending" ? "Review" : "View";

  return (
    <View style={dc.card}>
      <WDocIconBox type={doc.type} />

      <View style={dc.info}>
        <Text style={dc.title}>{doc.title}</Text>
        <Text style={dc.desc} numberOfLines={2}>{doc.description}</Text>
        <View style={dc.dateRow}>
          <CalIcon />
          <Text style={dc.dateText}>{doc.uploaded}</Text>
        </View>
      </View>

      <View style={dc.right}>
        <StaticDocThumbnail />
        <View style={[dc.badge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
          <DocBadgeIcon color={doc.statusColor} />
          <Text style={[dc.badgeText, { color: cfg.badgeText }]}>{doc.statusLabel}</Text>
        </View>
        <Pressable
          style={[dc.btn, { borderColor: cfg.btnBorder }]}
          onPress={() => Alert.alert("Preview", "Warehouse document preview coming soon")}
        >
          <Text style={[dc.btnText, { color: cfg.btnText }]}>{btnLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card:      { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  info:      { flex: 1, gap: 4, paddingTop: 2 },
  title:     { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: WHITE, lineHeight: 20 },
  desc:      { fontFamily: "Poppins_400Regular",  fontSize: 11.5, color: DIM, lineHeight: 16 },
  dateRow:   { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  dateText:  { fontFamily: "Poppins_400Regular",  fontSize: 10, color: MUTED },
  right:     { width: 88, gap: 7, alignItems: "stretch" },
  badge:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, lineHeight: 14 },
  btn:       { borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  btnText:   { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
});

// ─── stat column ──────────────────────────────────────────────────────────────
function StatCol({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <View style={sc.col}>
      {icon}
      <Text style={sc.count}>{count}</Text>
      <Text style={sc.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  col:   { flex: 1, alignItems: "center", gap: 8, paddingHorizontal: 4 },
  count: { fontFamily: "Poppins_700Bold", fontSize: 30, color: WHITE, lineHeight: 36 },
  label: { fontFamily: "Poppins_400Regular", fontSize: 11, color: DIM, textAlign: "center" },
});

// ─── shield icon (security footer) ───────────────────────────────────────────
function ShieldCheckIcon() {
  return (
    <View style={{ width: 26, height: 30, alignItems: "center" }}>
      <View style={{ width: 26, height: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderWidth: 1.8, borderColor: "#60A5FA", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 11, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: "#60A5FA", transform: [{ rotate: "-45deg" }], marginTop: -2 }} />
      </View>
    </View>
  );
}

// ─── bottom tab icons ─────────────────────────────────────────────────────────
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
        const color  = active ? ORANGE : MUTED;
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

// ─── screen ───────────────────────────────────────────────────────────────────
export default function AdminWarehouseDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id:                  string;
    full_name:           string;
    email:               string;
    phone:               string;
    city:                string;
    external_id:         string;
    display_external_id: string;
    status:              string;
    status_label:        string;
    status_color:        string;
    avatar_color:        string;
  }>();

  const fullName          = params.full_name          || "Warehouse Staff";
  const displayExternalId = params.display_external_id || "Not assigned";
  const statusLabel       = params.status_label        || "Unknown";
  const statusColor       = params.status_color        || "gray";
  const avatarColor       = params.avatar_color        || "#7C3AED";

  const sCfg = statusCfg(statusColor);

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"          as any);
    if (i === 1) router.replace("/admin/drivers"  as any);
    if (i === 2) router.replace("/admin/invoices" as any);
    if (i === 3) router.replace("/admin/reports"  as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Warehouse Documents</Text>
          <Text style={s.headerSub}>Review and approve warehouse documents</Text>
        </View>
        <Pressable style={s.filterBtn} hitSlop={10}>
          <FilterFunnelIcon />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── warehouse profile card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={[s.avatarRing, { borderColor: sCfg.dot }]}>
              <View style={[s.avatarCircle, { backgroundColor: avatarColor + "33" }]}>
                <Text style={[s.initialsText, { color: avatarColor }]}>
                  {initials(fullName)}
                </Text>
              </View>
            </View>
            <View style={[s.onlineDot, { backgroundColor: sCfg.dot }]} />
          </View>

          <View style={s.profileInfo}>
            <Text style={s.driverName}>{fullName}</Text>
            <Text style={s.driverExtId}>
              ID: <Text style={{ color: ORANGE }}>{displayExternalId}</Text>
            </Text>
            <Text style={s.roleSubtitle}>Warehouse Staff</Text>
          </View>

          <View style={[s.statusBadge, { backgroundColor: sCfg.bg }]}>
            <View style={[s.statusDot, { backgroundColor: sCfg.dot }]} />
            <Text style={[s.statusText, { color: sCfg.text }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* ── doc stats card ── */}
        <View style={s.statsCard}>
          <StatCol icon={<DocPageIcon />}      count={4} label="Total Documents" />
          <View style={s.divider} />
          <StatCol icon={<ApprovedStatIcon />} count={2} label="Approved" />
          <View style={s.divider} />
          <StatCol icon={<PendingStatIcon />}  count={1} label="Pending" />
          <View style={s.divider} />
          <StatCol icon={<RejectedStatIcon />} count={1} label="Rejected" />
        </View>

        {/* ── documents section ── */}
        <Text style={s.sectionTitle}>Documents</Text>
        {MOCK_DOCS.map(doc => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}

        {/* ── security footer ── */}
        <View style={s.secCard}>
          <View style={s.secIconWrap}>
            <ShieldCheckIcon />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.secTitle}>All warehouse documents are securely stored</Text>
            <Text style={s.secSub}>We ensure secure access and compliance standards.</Text>
          </View>
          <View style={{ width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: MUTED, transform: [{ rotate: "45deg" }] }} />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

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
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 14 },
  backBtn:      { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle:  { fontFamily: "Poppins_700Bold",    fontSize: 22, color: WHITE,  lineHeight: 28 },
  headerSub:    { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED,  marginTop: -1 },
  filterBtn:    { width: 44, height: 44, borderRadius: 14, backgroundColor: FAINT, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  // profile card
  profileCard:  { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14, gap: 14 },
  avatarWrap:   { width: 68, height: 68, position: "relative", flexShrink: 0 },
  avatarRing:   { width: 68, height: 68, borderRadius: 34, borderWidth: 2 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  initialsText: { fontFamily: "Poppins_700Bold", fontSize: 22, lineHeight: 26 },
  onlineDot:    { position: "absolute", bottom: 2, right: 1, width: 15, height: 15, borderRadius: 7.5, borderWidth: 2.5, borderColor: CARD },
  profileInfo:  { flex: 1, gap: 3 },
  driverName:   { fontFamily: "Poppins_700Bold",    fontSize: 17, color: WHITE },
  driverExtId:  { fontFamily: "Poppins_500Medium",  fontSize: 13, color: DIM  },
  roleSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },
  statusBadge:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  statusDot:    { width: 7, height: 7, borderRadius: 3.5 },
  statusText:   { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  // stats card
  statsCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, paddingVertical: 22, marginBottom: 22 },
  divider:   { width: 1, height: 52, backgroundColor: BORDER },

  // section
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: WHITE, marginBottom: 14 },

  // security card
  secCard:    { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 14, marginTop: 2 },
  secIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(96,165,250,0.1)", alignItems: "center", justifyContent: "center" },
  secTitle:   { fontFamily: "Poppins_600SemiBold", fontSize: 13.5, color: WHITE, lineHeight: 20 },
  secSub:     { fontFamily: "Poppins_400Regular",  fontSize: 11.5, color: MUTED,  lineHeight: 17, marginTop: 1 },
});
