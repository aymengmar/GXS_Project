import {
  DriverDocumentItem,
  DriverDocumentsSummary,
  updateDocumentStatus,
} from "@/api/backendClient";
import PdfDocumentViewer from "@/components/admin/PdfDocumentViewer";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG     = "#080F1D";
const CARD   = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const RED    = "#EF4444";
const AMBER  = "#F59E0B";
const WHITE  = "#FFFFFF";
const DIM    = "rgba(255,255,255,0.60)";
const MUTED  = "rgba(255,255,255,0.28)";

// ─── types ────────────────────────────────────────────────────────────────────
export type DocumentPreviewModalProps = {
  visible: boolean;
  document: DriverDocumentItem | null;
  driverId: string;
  accessToken: string;
  onClose: () => void;
  onChangeStatus: (updatedDoc: DriverDocumentItem, newSummary: DriverDocumentsSummary) => void;
};

// ─── ZoomableImage ────────────────────────────────────────────────────────────
function ZoomableImage({ uri, onError }: { uri: string; onError: () => void }) {
  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx         = useSharedValue(0);
  const ty         = useSharedValue(0);
  const savedTx    = useSharedValue(0);
  const savedTy    = useSharedValue(0);

  useEffect(() => {
    scale.value      = 1;
    savedScale.value = 1;
    tx.value         = 0;
    ty.value         = 0;
    savedTx.value    = 0;
    savedTy.value    = 0;
  }, [uri]);

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 6));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        scale.value      = withSpring(1);
        tx.value         = withSpring(0);
        ty.value         = withSpring(0);
        savedScale.value = 1;
        savedTx.value    = 0;
        savedTy.value    = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (savedScale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value      = withSpring(1);
      savedScale.value = 1;
      tx.value         = withSpring(0);
      ty.value         = withSpring(0);
      savedTx.value    = 0;
      savedTy.value    = 0;
    });

  const composed = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View style={zi.container} collapsable={false}>
        <Animated.Image
          source={{ uri }}
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, animStyle]}
          resizeMode="contain"
          onError={onError}
        />
      </View>
    </GestureDetector>
  );
}

const zi = StyleSheet.create({
  container: { flex: 1 },
});

// ─── status badge helpers ─────────────────────────────────────────────────────
function statusCfg(color: string) {
  switch (color) {
    case "green": return { badgeBg: "rgba(34,197,94,0.15)",  badgeText: "#4ADE80", badgeBorder: "rgba(34,197,94,0.25)" };
    case "red":   return { badgeBg: "rgba(239,68,68,0.15)",  badgeText: "#FC8181", badgeBorder: "rgba(239,68,68,0.3)"  };
    default:      return { badgeBg: "rgba(245,158,11,0.15)", badgeText: "#FCD34D", badgeBorder: "rgba(245,158,11,0.3)" };
  }
}

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

function DocBadgeIcon({ color }: { color: string }) {
  if (color === "green") return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 6, height: 4, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#22C55E", transform: [{ rotate: "-45deg" }], marginTop: -1 }} />
    </View>
  );
  if (color === "red") return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: RED, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 7, height: 1.5, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "45deg"  }] }} />
      <View style={{ position: "absolute", width: 7, height: 1.5, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
  return (
    <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: AMBER, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 1.5, height: 5,   backgroundColor: AMBER, borderRadius: 1, bottom: 4.75 }} />
      <View style={{ position: "absolute", width: 3.5, height: 1.5, backgroundColor: AMBER, borderRadius: 1, left: 6.5 }} />
    </View>
  );
}

// ─── generic fallback (non-image, non-PDF) ───────────────────────────────────
function ViewerFallback({ fileName }: { fileName: string | null }) {
  return (
    <View style={fb.wrap}>
      <View style={fb.iconBox}>
        <View style={[fb.docShape, { borderColor: MUTED }]}>
          <View style={[fb.line, { top: 14, backgroundColor: MUTED }]} />
          <View style={[fb.line, { top: 21, backgroundColor: MUTED }]} />
          <View style={[fb.line, { top: 28, right: 12, backgroundColor: MUTED }]} />
        </View>
      </View>
      <Text style={fb.title}>{fileName ?? "File"}</Text>
      <Text style={fb.sub}>Preview is not available for this file type.</Text>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  iconBox:  { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  docShape: { width: 44, height: 54, borderRadius: 6, borderWidth: 2, position: "relative" },
  line:     { position: "absolute", left: 7, right: 7, height: 1.5, borderRadius: 1 },
  title:    { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: DIM,  textAlign: "center" },
  sub:      { fontFamily: "Poppins_400Regular",  fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18 },
});

// ─── main component ───────────────────────────────────────────────────────────
export default function DocumentPreviewModal({
  visible,
  document: doc,
  driverId,
  accessToken,
  onClose,
  onChangeStatus,
}: DocumentPreviewModalProps) {
  const [updating,     setUpdating]     = useState(false);
  const [imageFailed,  setImageFailed]  = useState(false);

  useEffect(() => { setImageFailed(false); }, [doc?.id]);

  if (!doc) return null;

  const isImage  = (doc.mime_type ?? "").startsWith("image/");
  const isPdf    = doc.mime_type === "application/pdf" || (doc.file_name ?? "").toLowerCase().endsWith(".pdf");
  const imageUri = doc.file_url ?? doc.preview_url;
  const cfg      = statusCfg(doc.status_color);

  const showZoomable = isImage && !!imageUri && !imageFailed;
  const showPdf      = isPdf && !!doc.file_url;
  const showFallback = !showZoomable && !showPdf;

  const handleChangeStatus = (newStatus: "approved" | "pending" | "rejected") => {
    const label = newStatus === "approved" ? "Approved" : newStatus === "pending" ? "Pending" : "Rejected";
    Alert.alert(
      "Change document status?",
      `Mark this document as ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await updateDocumentStatus(accessToken, driverId, doc.id, newStatus);
              onChangeStatus(result.document, result.summary);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed to update status.";
              Alert.alert("Error", msg);
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* GestureHandlerRootView inside modal because modals render outside the app root */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={p.root} edges={["top", "bottom"]}>

          {/* ── header ── */}
          <View style={p.header}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={p.title} numberOfLines={2}>{doc.title}</Text>
              <View style={p.metaRow}>
                <View style={[p.badge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
                  <DocBadgeIcon color={doc.status_color} />
                  <Text style={[p.badgeText, { color: cfg.badgeText }]}>{doc.status_label}</Text>
                </View>
                {!!doc.uploaded_at_label && (
                  <View style={p.dateRow}>
                    <CalIcon />
                    <Text style={p.dateText}>{doc.uploaded_at_label}</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable onPress={onClose} style={p.closeBtn} hitSlop={14}>
              <View style={[p.closeLine, { transform: [{ rotate: "45deg"  }] }]} />
              <View style={[p.closeLine, { transform: [{ rotate: "-45deg" }] }]} />
            </Pressable>
          </View>

          {/* ── viewer ── */}
          <View style={p.viewer}>
            {showZoomable ? (
              <ZoomableImage uri={imageUri!} onError={() => setImageFailed(true)} />
            ) : showPdf ? (
              <PdfDocumentViewer fileUrl={doc.file_url!} fileName={doc.file_name} />
            ) : (
              <ViewerFallback fileName={doc.file_name} />
            )}
          </View>

          {/* ── zoom hint ── */}
          {showZoomable && (
            <View style={p.hintRow}>
              <Text style={p.hintText}>Pinch to zoom · Double-tap to reset</Text>
            </View>
          )}

          {/* ── status buttons ── */}
          <View style={p.btnRow}>
            <Pressable
              style={[p.btn, p.btnApproved]}
              onPress={() => handleChangeStatus("approved")}
              disabled={updating}
            >
              <Text style={[p.btnText, { color: "#4ADE80" }]}>Approved</Text>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnPending]}
              onPress={() => handleChangeStatus("pending")}
              disabled={updating}
            >
              <Text style={[p.btnText, { color: "#FCD34D" }]}>Pending</Text>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnRejected]}
              onPress={() => handleChangeStatus("rejected")}
              disabled={updating}
            >
              <Text style={[p.btnText, { color: "#FC8181" }]}>Rejected</Text>
            </Pressable>
          </View>

          {/* ── updating overlay ── */}
          {updating && (
            <View style={p.overlay}>
              <ActivityIndicator color={ORANGE} size="small" />
            </View>
          )}

        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // header
  header:    { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: CARD },
  title:     { fontFamily: "Poppins_700Bold",    fontSize: 16, color: WHITE, lineHeight: 22 },
  metaRow:   { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  badge:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, lineHeight: 14 },
  dateRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText:  { fontFamily: "Poppins_400Regular", fontSize: 11, color: MUTED },
  closeBtn:  { width: 32, height: 32, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  closeLine: { position: "absolute", width: 18, height: 2, backgroundColor: DIM, borderRadius: 1 },

  // viewer
  viewer: { flex: 1, backgroundColor: "#050B15", overflow: "hidden" },

  // zoom hint
  hintRow:  { paddingVertical: 8, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  hintText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: MUTED, textAlign: "center" },

  // status buttons
  btnRow:      { flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  btn:         { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  btnApproved: { backgroundColor: "rgba(34,197,94,0.12)",  borderColor: "rgba(34,197,94,0.35)"  },
  btnPending:  { backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.35)" },
  btnRejected: { backgroundColor: "rgba(239,68,68,0.12)",  borderColor: "rgba(239,68,68,0.35)"  },
  btnText:     { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  // loading overlay
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,15,29,0.65)", alignItems: "center", justifyContent: "center" },
});
