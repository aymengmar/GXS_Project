import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const PURPLE = "#8B5CF6";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.30)";

// ─── types ────────────────────────────────────────────────────────────────────
type ReviewStatus = "approved" | "pending" | "rejected" | "missing";
type FileStatus = "uploaded" | "replaced" | "missing";

interface DocItem {
  id: string;
  name: string;
  uploadedDate: string | null;
  updatedDate: string | null;
  reviewStatus: ReviewStatus;
  fileStatus: FileStatus;
  note?: string;
  rejectionReason?: string;
  iconColor: string;
}

// ─── mock data ────────────────────────────────────────────────────────────────
const DOCS: DocItem[] = [
  {
    id: "driving-license",
    name: "Driving License",
    uploadedDate: "May 20, 2025",
    updatedDate: "May 21, 2025",
    reviewStatus: "approved",
    fileStatus: "uploaded",
    iconColor: BLUE,
  },
  {
    id: "id-passport",
    name: "ID Card / Passport",
    uploadedDate: "May 20, 2025",
    updatedDate: "May 21, 2025",
    reviewStatus: "approved",
    fileStatus: "uploaded",
    iconColor: PURPLE,
  },
  {
    id: "residence-permit",
    name: "Residence Permit",
    uploadedDate: "May 19, 2025",
    updatedDate: "May 21, 2025",
    reviewStatus: "pending",
    fileStatus: "uploaded",
    note: "Waiting for admin review.",
    iconColor: AMBER,
  },
  {
    id: "work-permit",
    name: "Work Permit",
    uploadedDate: null,
    updatedDate: null,
    reviewStatus: "missing",
    fileStatus: "missing",
    note: "This document is required.",
    iconColor: RED,
  },
  {
    id: "vehicle-insurance",
    name: "Vehicle Insurance",
    uploadedDate: "May 18, 2025",
    updatedDate: "May 20, 2025",
    reviewStatus: "approved",
    fileStatus: "replaced",
    iconColor: GREEN,
  },
  {
    id: "vehicle-registration",
    name: "Vehicle Registration",
    uploadedDate: "May 18, 2025",
    updatedDate: "May 19, 2025",
    reviewStatus: "rejected",
    fileStatus: "replaced",
    rejectionReason: "The document is blurry. Please upload a clearer file.",
    iconColor: RED,
  },
];

// ─── doc type icons ───────────────────────────────────────────────────────────
function IdCardIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={1.6} />
      <Circle cx="8" cy="12" r="2.5" stroke={color} strokeWidth={1.4} />
      <Line x1="13" y1="9.5" x2="20" y2="9.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="13" y1="12" x2="20" y2="12" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="13" y1="14.5" x2="17" y2="14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function PassportIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={1.6} />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.4} />
      <Line x1="8" y1="16" x2="16" y2="16" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="9" y1="19" x2="15" y2="19" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WorkBagIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth={1.6} />
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="10" y1="14" x2="14" y2="14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function DocAlertIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="12" x2="12" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function DocTypeIcon({ id, color }: { id: string; color: string }) {
  switch (id) {
    case "driving-license":
      return <IdCardIcon color={color} />;
    case "id-passport":
      return <PassportIcon color={color} />;
    case "residence-permit":
      return <IdCardIcon color={color} />;
    case "work-permit":
      return <WorkBagIcon color={color} />;
    case "vehicle-insurance":
      return <ShieldCheckIcon color={color} />;
    case "vehicle-registration":
      return <DocAlertIcon color={color} />;
    default:
      return <IdCardIcon color={color} />;
  }
}

// ─── summary & UI icons ───────────────────────────────────────────────────────
function PersonIcon({ size = 22, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function DocFileIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 22, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockCircleIcon({ size = 22, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ size = 22, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 13, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function ClockSmIcon({ size = 13, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadCloudIcon({ size = 20, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 16l-4-4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── ReviewStatusBadge ────────────────────────────────────────────────────────
function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "approved") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
        <CheckCircleIcon size={13} color={GREEN} />
        <Text style={[styles.badgeText, { color: GREEN }]}>Approved</Text>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
        <ClockSmIcon size={13} color={AMBER} />
        <Text style={[styles.badgeText, { color: AMBER }]}>Pending</Text>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
        <XCircleIcon size={13} color={RED} />
        <Text style={[styles.badgeText, { color: RED }]}>Rejected</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
      <AlertTriangleIcon size={12} color={RED} />
      <Text style={[styles.badgeText, { color: RED }]}>Missing</Text>
    </View>
  );
}

// ─── SummaryBox ───────────────────────────────────────────────────────────────
function SummaryBox({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.summaryBox}>
      {icon}
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ─── DocumentCard ─────────────────────────────────────────────────────────────
function DocumentCard({ doc }: { doc: DocItem }) {
  const { reviewStatus, fileStatus } = doc;
  const isMissing = reviewStatus === "missing";
  const isRejected = reviewStatus === "rejected";
  const fileStatusColor = fileStatus === "missing" ? ORANGE : GREEN;

  return (
    <View style={styles.docCard}>
      {/* Header row: icon + info + badge */}
      <View style={styles.docCardHeader}>
        <View style={[styles.docIconBox, { backgroundColor: `${doc.iconColor}18` }]}>
          <DocTypeIcon id={doc.id} color={doc.iconColor} />
        </View>
        <View style={styles.docCardInfo}>
          <Text style={styles.docName}>{doc.name}</Text>
          {doc.uploadedDate ? (
            <Text style={styles.docUploadDate}>Uploaded on {doc.uploadedDate}</Text>
          ) : null}
          {reviewStatus === "pending" && doc.note ? (
            <View style={styles.pendingNoteRow}>
              <ClockSmIcon size={12} color={AMBER} />
              <Text style={styles.pendingNoteText}>{doc.note}</Text>
            </View>
          ) : null}
          {isMissing && doc.note ? (
            <Text style={styles.missingNoteText}>{doc.note}</Text>
          ) : null}
        </View>
        <ReviewStatusBadge status={reviewStatus} />
      </View>

      {/* Rejection reason box */}
      {isRejected && doc.rejectionReason ? (
        <View style={styles.reasonBox}>
          <AlertTriangleIcon size={13} color={RED} />
          <Text style={styles.reasonText}>
            <Text style={styles.reasonLabel}>Reason: </Text>
            {doc.rejectionReason}
          </Text>
        </View>
      ) : null}

      {/* Footer meta */}
      <Text style={styles.docMeta}>
        {"Last updated: "}
        {doc.updatedDate ?? "–"}
        {"  •  File status: "}
        <Text style={[styles.fileStatusText, { color: fileStatusColor }]}>
          {fileStatus}
        </Text>
      </Text>

      {/* Action buttons */}
      {isMissing ? (
        <Pressable style={styles.orangeFullBtn}>
          <Text style={styles.orangeFullBtnText}>Upload Document</Text>
        </Pressable>
      ) : isRejected ? (
        <View style={styles.btnRow}>
          <Pressable style={[styles.outlineBtn, { flex: 1 }]}>
            <Text style={styles.outlineBtnText}>View</Text>
          </Pressable>
          <Pressable style={[styles.orangeFilledBtn, { flex: 2 }]}>
            <Text style={styles.orangeFilledBtnText}>Replace Document</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.btnRow}>
          <Pressable style={[styles.outlineBtn, { flex: 1 }]}>
            <Text style={styles.outlineBtnText}>View</Text>
          </Pressable>
          <Pressable style={[styles.orangeFilledBtn, { flex: 1 }]}>
            <Text style={styles.orangeFilledBtnText}>Replace</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

export default function DriverDocumentsScreen({ onNavigate: _onNavigate }: Props) {
  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>My files</Text>
              <Text style={styles.headerTitle}>Documents</Text>
              <Text style={styles.headerSub}>Track your document review status</Text>
            </View>
            <View>
              <View style={styles.profileBtn}>
                <PersonIcon size={22} color={WHITE} />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {/* ── Document Summary Card ────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Document Summary</Text>
            <View style={styles.summaryRow}>
              <SummaryBox icon={<DocFileIcon size={24} />} count={12} label="Total" color={BLUE} />
              <SummaryBox icon={<CheckCircleIcon size={24} color={GREEN} />} count={8} label="Approved" color={GREEN} />
              <SummaryBox icon={<ClockCircleIcon size={24} color={AMBER} />} count={3} label="Pending" color={AMBER} />
              <SummaryBox icon={<XCircleIcon size={24} color={RED} />} count={1} label="Rejected" color={RED} />
            </View>
          </View>

          {/* ── My Documents section ─────────────────────────────────────────── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Documents</Text>
            <Pressable style={styles.sortRow}>
              <Text style={styles.sortText}>Sort by: Newest</Text>
              <ChevronDownIcon size={14} color={ORANGE} />
            </Pressable>
          </View>

          {/* ── Document Cards ───────────────────────────────────────────────── */}
          {DOCS.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}

          {/* ── Upload New Document ──────────────────────────────────────────── */}
          <Pressable style={styles.uploadNewBtn}>
            <UploadCloudIcon size={20} color={WHITE} />
            <Text style={styles.uploadNewBtnText}>Upload New Document</Text>
          </Pressable>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    marginTop: 1,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },

  // Summary card
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  summaryCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: MUTED,
    textAlign: "center",
  },

  // Section header
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },

  // Document card
  docCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  docCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docCardInfo: {
    flex: 1,
    gap: 3,
  },
  docName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  docUploadDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  pendingNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  pendingNoteText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AMBER,
  },
  missingNoteText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: ORANGE,
    marginTop: 2,
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  // Reason box
  reasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    padding: 10,
  },
  reasonText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: RED,
    flex: 1,
    lineHeight: 18,
  },
  reasonLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: RED,
  },

  // Meta
  docMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
  },
  fileStatusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },

  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  orangeFilledBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  orangeFilledBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  orangeFullBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orangeFullBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },

  // Upload new button
  uploadNewBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  uploadNewBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});
