import {
  fetchAdminDriverDocuments,
  getDriverPhotoProxyUrl,
  DriverDocumentItem,
  DriverDocumentsResponse,
  DriverDocumentsSummary,
} from "@/api/backendClient";
import DocumentPreviewModal from "@/components/admin/DocumentPreviewModal";
import { sessionStore } from "@/store/sessionStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

// ─── fallback avatar ──────────────────────────────────────────────────────────
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
function driverStatusCfg(color: string) {
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

// ─── doc type icon boxes ──────────────────────────────────────────────────────
type DocIconType = "passport" | "driving_licence" | "health" | "bank" | "home" | "generic";

const DOC_ICON_CFG: Record<DocIconType, { bg: string; tint: string }> = {
  passport:       { bg: "rgba(124,58,237,0.22)",  tint: "#A78BFA" },
  driving_licence:{ bg: "rgba(251,146,60,0.22)",  tint: "#FB923C" },
  health:         { bg: "rgba(14,165,233,0.22)",   tint: "#38BDF8" },
  bank:           { bg: "rgba(20,184,166,0.22)",   tint: "#2DD4BF" },
  home:           { bg: "rgba(245,158,11,0.22)",   tint: "#FCD34D" },
  generic:        { bg: "rgba(96,165,250,0.15)",   tint: "#60A5FA" },
};

function docIconType(documentType: string): DocIconType {
  switch (documentType) {
    case "identity_document": return "passport";
    case "driving_licence":   return "driving_licence";
    case "health_insurance":  return "health";
    case "iban_bank_account": return "bank";
    case "home_registration": return "home";
    default:                  return "generic";
  }
}

function PassportIcon({ tint }: { tint: string }) {
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

function LicenceIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 28, height: 20 }}>
      <View style={{ width: 28, height: 20, borderRadius: 4, borderWidth: 1.8, borderColor: tint }}>
        <View style={{ position: "absolute", left: 3, top: 3, width: 10, height: 7, borderRadius: 2, borderWidth: 1.3, borderColor: tint }} />
        <View style={{ position: "absolute", right: 4, top: 4,  width: 8, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", right: 4, top: 8,  width: 6, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", left: 3, bottom: 4, right: 3, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function HealthIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 22, height: 26, alignItems: "center" }}>
      <View style={{ width: 22, height: 26, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, borderWidth: 1.8, borderColor: tint, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 11, height: 2, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", width: 2, height: 11, backgroundColor: tint, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function BankIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 26, height: 24, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 9, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: tint, marginBottom: 1 }} />
      <View style={{ flexDirection: "row", gap: 3, marginBottom: 1 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ width: 3, height: 10, backgroundColor: tint, borderRadius: 1 }} />)}
      </View>
      <View style={{ width: 24, height: 2.5, backgroundColor: tint, borderRadius: 1 }} />
    </View>
  );
}

function HomeIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 26, height: 24, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 11, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: tint }} />
      <View style={{ width: 22, height: 13, borderWidth: 1.8, borderColor: tint, borderTopWidth: 0, alignItems: "center", justifyContent: "flex-end" }}>
        <View style={{ width: 7, height: 9, borderWidth: 1.5, borderColor: tint, borderBottomWidth: 0, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function GenericDocIcon({ tint }: { tint: string }) {
  return (
    <View style={{ width: 22, height: 28 }}>
      <View style={{ width: 22, height: 28, borderRadius: 4, borderWidth: 1.8, borderColor: tint }}>
        <View style={{ position: "absolute", top: 7,  left: 4, right: 4, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 12, left: 4, right: 4, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
        <View style={{ position: "absolute", top: 17, left: 4, right: 8, height: 1.5, backgroundColor: tint, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function DocTypeIconBox({ documentType }: { documentType: string }) {
  const iconType = docIconType(documentType);
  const { bg, tint } = DOC_ICON_CFG[iconType];
  return (
    <View style={[dib.box, { backgroundColor: bg, borderRadius: 16 }]}>
      {iconType === "passport"        && <PassportIcon tint={tint} />}
      {iconType === "driving_licence" && <LicenceIcon tint={tint} />}
      {iconType === "health"          && <HealthIcon tint={tint} />}
      {iconType === "bank"            && <BankIcon tint={tint} />}
      {iconType === "home"            && <HomeIcon tint={tint} />}
      {iconType === "generic"         && <GenericDocIcon tint={tint} />}
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

// ─── document thumbnail ───────────────────────────────────────────────────────
function DocumentThumbnail({ previewUrl, mimeType }: { previewUrl: string | null; mimeType: string | null }) {
  const [failed, setFailed] = useState(false);
  const isPdf = mimeType === "application/pdf";

  if (!previewUrl || failed || isPdf) {
    return (
      <View style={[tm.base, { backgroundColor: CARD, alignItems: "center", justifyContent: "center", borderColor: BORDER }]}>
        <View style={{ width: 28, height: 34, borderRadius: 4, borderWidth: 1.5, borderColor: MUTED }}>
          <View style={{ position: "absolute", top: 7,  left: 4, right: 4, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
          <View style={{ position: "absolute", top: 13, left: 4, right: 4, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
          <View style={{ position: "absolute", top: 19, left: 4, right: 8, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
          {isPdf && <Text style={{ position: "absolute", bottom: 3, right: 3, fontSize: 5, color: MUTED }}>PDF</Text>}
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: previewUrl }}
      style={tm.base}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
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

// ─── document card ────────────────────────────────────────────────────────────
function DocumentCard({ doc, onPress }: { doc: DriverDocumentItem; onPress: () => void }) {
  const cfg      = docStatusCfg(doc.status_color);
  const btnLabel = doc.status_label === "Pending" ? "Review" : "View";

  return (
    <View style={dc.card}>
      <DocTypeIconBox documentType={doc.document_type} />

      <View style={dc.info}>
        <Text style={dc.title}>{doc.title}</Text>
        <Text style={dc.desc} numberOfLines={2}>{doc.description}</Text>
        <View style={dc.dateRow}>
          <CalIcon />
          <Text style={dc.dateText}>{doc.uploaded_at_label || "—"}</Text>
        </View>
      </View>

      <View style={dc.right}>
        <DocumentThumbnail previewUrl={doc.preview_url} mimeType={doc.mime_type} />
        <View style={[dc.badge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
          <DocBadgeIcon color={doc.status_color} />
          <Text style={[dc.badgeText, { color: cfg.badgeText }]}>{doc.status_label}</Text>
        </View>
        <Pressable style={[dc.btn, { borderColor: cfg.btnBorder }]} onPress={onPress}>
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
export default function AdminDriverDocumentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData]               = useState<DriverDocumentsResponse | null>(null);
  const [docs, setDocs]               = useState<DriverDocumentItem[]>([]);
  const [summary, setSummary]         = useState<DriverDocumentsSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [photoError, setPhotoError]   = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [selectedDoc, setSelectedDoc]   = useState<DriverDocumentItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const session = sessionStore.get();
    if (!session) return;

    setAccessToken(session.access_token);
    setLoading(true);
    setError(null);
    setPhotoError(false);

    fetchAdminDriverDocuments(session.access_token, id)
      .then(d => {
        setData(d);
        setDocs(d.documents);
        setSummary(d.summary);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDocUpdated = (updatedDoc: DriverDocumentItem, newSummary: DriverDocumentsSummary) => {
    setDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setSummary(newSummary);
    setModalVisible(false);
  };

  const openDocModal = (doc: DriverDocumentItem) => {
    setSelectedDoc(doc);
    setModalVisible(true);
  };

  const handleTabPress = (i: number) => {
    if (i === 0) router.replace("/admin"          as any);
    if (i === 1) router.replace("/admin/drivers"  as any);
    if (i === 2) router.replace("/admin/invoices" as any);
    if (i === 3) router.replace("/admin/reports"  as any);
  };

  const driver = data?.driver;
  const dCfg   = driver ? driverStatusCfg(driver.status_color) : driverStatusCfg("gray");

  const photoSource =
    driver?.profile_photo_url && accessToken && !photoError
      ? { uri: getDriverPhotoProxyUrl(driver.id, accessToken) }
      : pickFallbackAvatar(id ?? "0");

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Driver Documents</Text>
          <Text style={s.headerSub}>Review and approve driver documents</Text>
        </View>
        <Pressable style={s.filterBtn} hitSlop={10}>
          <FilterFunnelIcon />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : data ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── driver profile card ── */}
          <View style={s.profileCard}>
            <View style={s.avatarWrap}>
              <Image
                source={photoSource}
                style={s.avatar}
                onError={() => setPhotoError(true)}
              />
              <View style={[s.onlineDot, { backgroundColor: dCfg.dot }]} />
            </View>
            <View style={s.profileInfo}>
              <Text style={s.driverName}>{driver!.full_name}</Text>
              <Text style={s.driverExtId}>
                ID: <Text style={{ color: ORANGE }}>{driver!.display_driver_id}</Text>
              </Text>
              <View style={s.carRow}>
                <View style={{ width: 15, height: 10 }}>
                  <View style={{ position: "absolute", left: 0, top: 0, width: 15, height: 7, borderRadius: 2, borderWidth: 1.2, borderColor: MUTED }} />
                  <View style={{ position: "absolute", bottom: 0, left: 1.5, width: 4, height: 4, borderRadius: 2, borderWidth: 1.2, borderColor: MUTED, backgroundColor: CARD }} />
                  <View style={{ position: "absolute", bottom: 0, right: 1.5, width: 4, height: 4, borderRadius: 2, borderWidth: 1.2, borderColor: MUTED, backgroundColor: CARD }} />
                </View>
                <Text style={s.carType}>{driver!.driver_type_label}</Text>
              </View>
            </View>
            <View style={[s.statusBadge, { backgroundColor: dCfg.bg }]}>
              <View style={[s.statusDot, { backgroundColor: dCfg.dot }]} />
              <Text style={[s.statusText, { color: dCfg.text }]}>{driver!.status_label}</Text>
            </View>
          </View>

          {/* ── doc stats card ── */}
          {summary && (
            <View style={s.statsCard}>
              <StatCol icon={<DocPageIcon />}      count={summary.total}    label="Total Documents" />
              <View style={s.divider} />
              <StatCol icon={<ApprovedStatIcon />} count={summary.approved} label="Approved" />
              <View style={s.divider} />
              <StatCol icon={<PendingStatIcon />}  count={summary.pending}  label="Pending" />
              <View style={s.divider} />
              <StatCol icon={<RejectedStatIcon />} count={summary.rejected} label="Rejected" />
            </View>
          )}

          {/* ── documents section ── */}
          <Text style={s.sectionTitle}>Documents</Text>
          {docs.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No documents uploaded yet.</Text>
            </View>
          ) : (
            docs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onPress={() => openDocModal(doc)} />
            ))
          )}

          {/* ── security footer ── */}
          <Pressable style={s.secCard}>
            <View style={s.secIconWrap}>
              <ShieldCheckIcon />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.secTitle}>All documents are securely stored</Text>
              <Text style={s.secSub}>We ensure the highest security and compliance standards.</Text>
            </View>
            <View style={{ width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: MUTED, transform: [{ rotate: "45deg" }] }} />
          </Pressable>

          <View style={{ height: 20 }} />
        </ScrollView>
      ) : null}

      {/* ── bottom tabs ── */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: TAB_BG }}>
        <BottomTabs onPress={handleTabPress} />
      </SafeAreaView>

      {/* ── document preview modal ── */}
      {accessToken && id && (
        <DocumentPreviewModal
          visible={modalVisible}
          document={selectedDoc}
          driverId={id}
          accessToken={accessToken}
          onClose={() => setModalVisible(false)}
          onChangeStatus={handleDocUpdated}
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  centered:  { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#EF4444", textAlign: "center", paddingHorizontal: 24 },

  // header
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 14 },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:{ flex: 1 },
  headerTitle: { fontFamily: "Poppins_700Bold",    fontSize: 22, color: WHITE,  lineHeight: 28 },
  headerSub:   { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED,  marginTop: -1 },
  filterBtn:   { width: 44, height: 44, borderRadius: 14, backgroundColor: FAINT, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  // profile card
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14, gap: 14 },
  avatarWrap:  { width: 62, height: 62, position: "relative", flexShrink: 0 },
  avatar:      { width: 62, height: 62, borderRadius: 31 },
  onlineDot:   { position: "absolute", bottom: 2, left: 2, width: 15, height: 15, borderRadius: 7.5, borderWidth: 2.5, borderColor: CARD },
  profileInfo: { flex: 1, gap: 3 },
  driverName:  { fontFamily: "Poppins_700Bold",    fontSize: 17, color: WHITE },
  driverExtId: { fontFamily: "Poppins_500Medium",  fontSize: 13, color: DIM  },
  carRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 },
  carType:     { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  statusDot:   { width: 7, height: 7, borderRadius: 3.5 },
  statusText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  // stats card
  statsCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, paddingVertical: 22, marginBottom: 22 },
  divider:   { width: 1, height: 52, backgroundColor: BORDER },

  // section
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: WHITE, marginBottom: 14 },

  // empty state
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText:  { fontFamily: "Poppins_400Regular", fontSize: 14, color: MUTED },

  // security card
  secCard:    { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 14, marginTop: 2 },
  secIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(96,165,250,0.1)", alignItems: "center", justifyContent: "center" },
  secTitle:   { fontFamily: "Poppins_600SemiBold", fontSize: 13.5, color: WHITE, lineHeight: 20 },
  secSub:     { fontFamily: "Poppins_400Regular",  fontSize: 11.5, color: MUTED,  lineHeight: 17, marginTop: 1 },
});
