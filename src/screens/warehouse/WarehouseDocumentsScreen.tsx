import { StatusBar } from "expo-status-bar";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

// react-native-web stubs out Alert.alert as a no-op, so preview builds in a
// browser need a window.alert fallback to actually show feedback.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const RED = "#EF4444";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.40)";

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const DOCUMENT_SUMMARY = { total: 6, approved: 3, pending: 2, rejected: 1 };

type DocStatus = "approved" | "pending" | "rejected" | "missing";

interface DocumentItem {
  id: string;
  title: string;
  status: DocStatus;
  uploadedOn?: string;
  lastUpdated?: string;
  note?: string;
  reason?: string;
}

const DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    title: "ID Card / Passport",
    status: "approved",
    uploadedOn: "May 20, 2025",
    lastUpdated: "May 21, 2025",
  },
  {
    id: "2",
    title: "Residence Permit",
    status: "approved",
    uploadedOn: "May 20, 2025",
    lastUpdated: "May 21, 2025",
  },
  {
    id: "3",
    title: "Work Permit",
    status: "pending",
    uploadedOn: "May 19, 2025",
    note: "Waiting for admin review.",
  },
  {
    id: "4",
    title: "Warehouse Contract",
    status: "approved",
    uploadedOn: "May 18, 2025",
    lastUpdated: "May 20, 2025",
  },
  {
    id: "5",
    title: "Safety Training Certificate",
    status: "rejected",
    uploadedOn: "May 18, 2025",
    reason: "The document is blurry. Please upload a clearer file.",
  },
  {
    id: "6",
    title: "Profile Photo",
    status: "missing",
    lastUpdated: "-",
    note: "This document is required.",
  },
];

// ─── SVG icons ────────────────────────────────────────────────────────────────
function FileIcon({ size = 20, color = BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FileXIcon({ size = 20, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 13.5l5 5M14.5 13.5l-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 20, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 12, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ size = 12, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 13, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 2v3M17 2v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 13, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadCloudIcon({ size = 16, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 18a4.5 4.5 0 0 1-1-8.9 5.5 5.5 0 0 1 10.6-2A4.5 4.5 0 0 1 17 18H7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 21v-7M9 17l3-3 3 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── status helpers ───────────────────────────────────────────────────────────
function badgeConfig(status: DocStatus) {
  if (status === "approved") {
    return { color: GREEN, bg: "rgba(34,197,94,0.15)", label: "Approved", Icon: CheckCircleIcon };
  }
  if (status === "pending") {
    return { color: ORANGE, bg: "rgba(255,101,0,0.15)", label: "Pending", Icon: ClockIcon };
  }
  if (status === "rejected") {
    return { color: RED, bg: "rgba(239,68,68,0.15)", label: "Rejected", Icon: XCircleIcon };
  }
  return { color: RED, bg: "rgba(239,68,68,0.15)", label: "Missing", Icon: AlertTriangleIcon };
}

function avatarConfig(status: DocStatus) {
  if (status === "rejected") {
    return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", Icon: FileXIcon, color: RED };
  }
  if (status === "missing") {
    return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", Icon: AlertTriangleIcon, color: RED };
  }
  return { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", Icon: FileIcon, color: BLUE };
}

// ─── small building blocks ───────────────────────────────────────────────────
function SummaryStatCard({
  color,
  tint,
  border,
  icon,
  value,
  label,
}: {
  color: string;
  tint: string;
  border: string;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.summaryStatCard,
        { backgroundColor: tint, borderColor: border },
        pressed && styles.summaryStatCardPressed,
      ]}
    >
      <View style={[styles.summaryStatCircle, { backgroundColor: color }]}>{icon}</View>
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </Pressable>
  );
}

function DocumentCard({
  doc,
  onView,
  onReplace,
  onUpload,
}: {
  doc: DocumentItem;
  onView: () => void;
  onReplace: () => void;
  onUpload: () => void;
}) {
  const badge = badgeConfig(doc.status);
  const avatar = avatarConfig(doc.status);
  const BadgeIcon = badge.Icon;
  const AvatarIcon = avatar.Icon;

  return (
    <View style={styles.docCard}>
      <View style={styles.docTopRow}>
        <View style={[styles.docAvatar, { backgroundColor: avatar.bg, borderColor: avatar.border }]}>
          <AvatarIcon size={22} color={avatar.color} />
        </View>
        <View style={styles.docTitleGroup}>
          <Text style={styles.docTitle}>{doc.title}</Text>
        </View>
        <View style={[styles.docBadge, { backgroundColor: badge.bg }]}>
          <BadgeIcon size={11} color={badge.color} />
          <Text style={[styles.docBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {doc.uploadedOn && (
        <View style={styles.docMetaRow}>
          <CalendarIcon />
          <Text style={styles.docMetaText}>Uploaded on {doc.uploadedOn}</Text>
        </View>
      )}

      {doc.status !== "pending" && doc.status !== "rejected" && doc.lastUpdated && (
        <View style={styles.docMetaRow}>
          <ClockIcon size={13} color={MUTED} />
          <Text style={styles.docMetaText}>Last updated: {doc.lastUpdated}</Text>
        </View>
      )}

      {doc.status === "missing" && (
        <>
          <View style={styles.docMetaRow}>
            <AlertTriangleIcon size={13} color={RED} />
            <Text style={[styles.docMetaText, { color: RED }]}>{doc.note}</Text>
          </View>
          <View style={styles.docMetaRow}>
            <ClockIcon size={13} color={MUTED} />
            <Text style={styles.docMetaText}>Last updated: {doc.lastUpdated}</Text>
          </View>
        </>
      )}

      {doc.status === "pending" && (
        <View style={styles.noteBoxOrange}>
          <ClockIcon size={14} color={ORANGE} />
          <Text style={styles.noteTextOrange}>{doc.note}</Text>
        </View>
      )}

      {doc.status === "rejected" && (
        <View style={styles.noteBoxRed}>
          <XCircleIcon size={14} color={RED} />
          <Text style={styles.noteTextRed}>Reason: {doc.reason}</Text>
        </View>
      )}

      {doc.status === "missing" ? (
        <Pressable style={styles.uploadBtn} onPress={onUpload}>
          <Text style={styles.uploadBtnText}>Upload Document</Text>
        </Pressable>
      ) : doc.status === "rejected" ? (
        <View style={styles.stackedButtons}>
          <Pressable style={styles.viewBtnFull} onPress={onView}>
            <Text style={styles.viewBtnText}>View</Text>
          </Pressable>
          <Pressable style={styles.replaceBtnFull} onPress={onReplace}>
            <Text style={styles.replaceBtnText}>Replace Document</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.sideBySideButtons}>
          <Pressable style={styles.viewBtn} onPress={onView}>
            <Text style={styles.viewBtnText}>View</Text>
          </Pressable>
          <Pressable style={styles.replaceBtn} onPress={onReplace}>
            <Text style={styles.replaceBtnText}>Replace</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehouseDocumentsScreen() {
  const handleView = () => notify("Document preview coming soon.", "");
  const handleReplace = () => notify("Replace document coming soon.", "");
  const handleUpload = () => notify("Upload document coming soon.", "");

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header ────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>My files</Text>
              <Text style={styles.headerTitle}>Documents</Text>
              <Text style={styles.headerSubtitle}>
                Track your warehouse document review status.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Document Summary ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.accentBar} />
            <Text style={styles.cardTitle}>Document Summary</Text>
            <View style={styles.summaryGrid}>
              <SummaryStatCard
                color={BLUE}
                tint="rgba(59,130,246,0.10)"
                border="rgba(59,130,246,0.30)"
                icon={<FileIcon size={20} color={WHITE} />}
                value={String(DOCUMENT_SUMMARY.total)}
                label="Total"
              />
              <SummaryStatCard
                color={GREEN}
                tint="rgba(34,197,94,0.10)"
                border="rgba(34,197,94,0.30)"
                icon={<CheckCircleIcon size={20} color={WHITE} />}
                value={String(DOCUMENT_SUMMARY.approved)}
                label="Approved"
              />
              <SummaryStatCard
                color={ORANGE}
                tint="rgba(255,101,0,0.10)"
                border="rgba(255,101,0,0.30)"
                icon={<ClockIcon size={20} color={WHITE} />}
                value={String(DOCUMENT_SUMMARY.pending)}
                label="Pending"
              />
              <SummaryStatCard
                color={RED}
                tint="rgba(239,68,68,0.10)"
                border="rgba(239,68,68,0.30)"
                icon={<XCircleIcon size={20} color={WHITE} />}
                value={String(DOCUMENT_SUMMARY.rejected)}
                label="Rejected"
              />
            </View>
          </View>

          {/* ── My Documents ──────────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>My Documents</Text>
            <View style={styles.sortRow}>
              <Text style={styles.sortText}>Sort by: Newest</Text>
              <ChevronDownIcon />
            </View>
          </View>

          {DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onView={handleView}
              onReplace={handleReplace}
              onUpload={handleUpload}
            />
          ))}

          {/* ── Upload New Document ──────────────────────────────────────── */}
          <Pressable style={styles.uploadNewBtn} onPress={handleUpload}>
            <UploadCloudIcon size={17} color={WHITE} />
            <Text style={styles.uploadNewBtnText}>Upload New Document</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },

  // ── Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: WHITE,
    marginTop: 2,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    marginTop: 4,
    lineHeight: 17,
  },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: ORANGE,
  },
  avatarDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: ORANGE,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 14,
  },

  // ── Document Summary
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryStatCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.3,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryStatCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  summaryStatCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryStatValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: WHITE,
  },
  summaryStatLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: DIM,
  },

  // ── My Documents header
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: WHITE,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: ORANGE,
  },

  // ── Document card
  docCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  docTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docTitleGroup: { flex: 1, paddingTop: 4 },
  docTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  docBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  docBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  docMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
  },
  noteBoxOrange: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,101,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  noteTextOrange: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
    lineHeight: 16,
  },
  noteBoxRed: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  noteTextRed: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: RED,
    lineHeight: 16,
  },
  sideBySideButtons: {
    flexDirection: "row",
    gap: 10,
  },
  stackedButtons: {
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnFull: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  replaceBtn: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  replaceBtnFull: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  replaceBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  uploadBtn: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },

  // ── Upload New Document
  uploadNewBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  uploadNewBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14.5,
    color: WHITE,
  },
});
