import {
  DriverDocumentListItem,
  fetchDriverDocuments,
  uploadDocument,
} from "@/api/backendClient";
import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import DriverDocumentPreviewModal from "@/components/driver/DriverDocumentPreviewModal";
import DocumentUploadOptionsSheet from "@/components/DocumentUploadOptionsSheet";
import { sessionStore } from "@/store/sessionStore";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

function BankIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 10 12 3 21 10" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="6" y1="10" x2="6" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="10" y1="10" x2="10" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="14" y1="10" x2="14" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="18" y1="10" x2="18" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="4" y1="19" x2="20" y2="19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function HouseIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-8 9 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocTypeIcon({ documentType, color }: { documentType: string; color: string }) {
  switch (documentType) {
    case "identity_document":
      return <PassportIcon color={color} />;
    case "driving_licence":
      return <IdCardIcon color={color} />;
    case "health_insurance":
      return <ShieldCheckIcon color={color} />;
    case "iban_bank_account":
      return <BankIcon color={color} />;
    case "home_registration":
      return <HouseIcon color={color} />;
    default:
      return <IdCardIcon color={color} />;
  }
}

const DOC_ICON_COLOR: Record<string, string> = {
  identity_document: PURPLE,
  driving_licence: BLUE,
  health_insurance: GREEN,
  iban_bank_account: AMBER,
  home_registration: ORANGE,
};

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

// ─── ReviewStatusBadge ────────────────────────────────────────────────────────
function ReviewStatusBadge({ status }: { status: DriverDocumentListItem["review_status"] }) {
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
function DocumentCard({
  doc,
  uploading,
  onView,
  onReplace,
}: {
  doc: DriverDocumentListItem;
  uploading: boolean;
  onView: () => void;
  onReplace: () => void;
}) {
  const isMissing = doc.review_status === "missing";
  const iconColor = DOC_ICON_COLOR[doc.document_type] ?? BLUE;

  return (
    <View style={styles.docCard}>
      {/* Header row: icon + info + badge */}
      <View style={styles.docCardHeader}>
        <View style={[styles.docIconBox, { backgroundColor: `${iconColor}18` }]}>
          <DocTypeIcon documentType={doc.document_type} color={iconColor} />
        </View>
        <View style={styles.docCardInfo}>
          <Text style={styles.docName}>{doc.title}</Text>
          <Text style={styles.docUploadDate}>{doc.description}</Text>
          {isMissing ? (
            <Text style={styles.missingNoteText}>This document is required.</Text>
          ) : null}
        </View>
        <ReviewStatusBadge status={doc.review_status} />
      </View>

      {/* Footer meta */}
      {!isMissing ? (
        <Text style={styles.docMeta}>Last updated: {doc.last_updated_label}</Text>
      ) : null}

      {/* Action buttons */}
      {isMissing ? (
        <Pressable
          style={styles.orangeFullBtn}
          onPress={onReplace}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Text style={styles.orangeFullBtnText}>Upload Document</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.btnRow}>
          <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={onView}>
            <Text style={styles.outlineBtnText}>View</Text>
          </Pressable>
          <Pressable
            style={[styles.orangeFilledBtn, { flex: 1 }]}
            onPress={onReplace}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <Text style={styles.orangeFilledBtnText}>Replace</Text>
            )}
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
  const [documents, setDocuments] = useState<DriverDocumentListItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const [previewDoc, setPreviewDoc] = useState<DriverDocumentListItem | null>(null);
  const [uploadSheetDocType, setUploadSheetDocType] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const load = useCallback(async (isRefresh: boolean) => {
    const session = sessionStore.get();
    if (session?.kind !== "driver") return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchErr(null);

    try {
      const data = await fetchDriverDocuments(session.access_token);
      setDocuments(data.documents);
      setSummary(data.summary);
    } catch (err: unknown) {
      setFetchErr(err instanceof Error ? err.message : "Could not load documents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  function handleViewPress(doc: DriverDocumentListItem) {
    setPreviewDoc(doc);
  }

  function handleReplacePress(doc: DriverDocumentListItem) {
    if (doc.review_status === "missing") {
      setUploadSheetDocType(doc.document_type);
      return;
    }
    Alert.alert(
      "Replace document?",
      "Do you want to replace this document?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Replace", onPress: () => setUploadSheetDocType(doc.document_type) },
      ],
    );
  }

  function closeUploadSheet() {
    setUploadSheetDocType(null);
  }

  async function doUpload(file: { uri: string; name: string; mimeType: string }) {
    const session = sessionStore.get();
    if (session?.kind !== "driver" || !uploadSheetDocType) return;

    const documentType = uploadSheetDocType;
    setUploadingType(documentType);
    try {
      await uploadDocument(file, documentType, session.access_token);
      await load(true);
    } catch (err: unknown) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadingType(null);
    }
  }

  async function handleTakePhoto() {
    closeUploadSheet();
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in your device settings to take document photos.",
        );
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      await doUpload({
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "photo.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  }

  async function handleChooseImage() {
    closeUploadSheet();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      await doUpload({
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "photo.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  }

  async function handleUploadPdf() {
    closeUploadSheet();
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      await doUpload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/pdf",
      });
    }
  }

  const uploadSheetDocTitle =
    documents.find((d) => d.document_type === uploadSheetDocType)?.title ?? "Document";

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={ORANGE} />
          }
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

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : fetchErr ? (
            <View style={styles.errorBox}>
              <XCircleIcon size={32} color={RED} />
              <Text style={styles.errorTitle}>Could not load documents</Text>
              <Pressable style={styles.retryBtn} onPress={() => load(false)}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : documents.length === 0 ? (
            <View style={styles.errorBox}>
              <DocFileIcon size={32} />
              <Text style={styles.errorTitle}>No documents yet</Text>
            </View>
          ) : (
            <>
              {/* ── Document Summary Card ────────────────────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Document Summary</Text>
                <View style={styles.summaryRow}>
                  <SummaryBox icon={<DocFileIcon size={24} />} count={summary.total} label="Total" color={BLUE} />
                  <SummaryBox icon={<CheckCircleIcon size={24} color={GREEN} />} count={summary.approved} label="Approved" color={GREEN} />
                  <SummaryBox icon={<ClockCircleIcon size={24} color={AMBER} />} count={summary.pending} label="Pending" color={AMBER} />
                  <SummaryBox icon={<XCircleIcon size={24} color={RED} />} count={summary.rejected} label="Rejected" color={RED} />
                </View>
              </View>

              {/* ── My Documents section ─────────────────────────────────────── */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>My Documents</Text>
              </View>

              {/* ── Document Cards ───────────────────────────────────────────── */}
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  uploading={uploadingType === doc.document_type}
                  onView={() => handleViewPress(doc)}
                  onReplace={() => handleReplacePress(doc)}
                />
              ))}
            </>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>

      <DriverDocumentPreviewModal
        visible={previewDoc !== null}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <DocumentUploadOptionsSheet
        visible={uploadSheetDocType !== null}
        documentName={uploadSheetDocTitle}
        onClose={closeUploadSheet}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseImage}
        onUploadPdf={handleUploadPdf}
      />
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

  // Loading / error / empty states
  loadingBox: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
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

  // Meta
  docMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
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
});
