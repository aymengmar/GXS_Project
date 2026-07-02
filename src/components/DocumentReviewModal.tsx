import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DocumentUploadOptionsSheet from "./DocumentUploadOptionsSheet";
import PhotoPreviewModal from "./PhotoPreviewModal";
import {
  AllDocuments,
  DocKey,
  DocumentFile,
  registrationStore,
} from "@/store/registrationStore";

const BG = "#080D1A";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";

// ─── Icons ────────────────────────────────────────────────────────────────────

function XCloseIcon() {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {[45, -45].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: 16,
            height: 2,
            borderRadius: 1,
            backgroundColor: "rgba(255,255,255,0.7)",
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
    </View>
  );
}

function ReplaceIcon() {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          borderTopWidth: 1.6,
          borderLeftWidth: 1.6,
          borderBottomWidth: 1.6,
          borderTopColor: "#fff",
          borderLeftColor: "#fff",
          borderBottomColor: "#fff",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 1,
          width: 0,
          height: 0,
          borderLeftWidth: 3,
          borderRightWidth: 3,
          borderTopWidth: 4,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#fff",
          transform: [{ rotate: "30deg" }],
        }}
      />
    </View>
  );
}

function PdfPreviewIcon() {
  return (
    <View style={{ width: 28, height: 34 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 5,
          borderColor: "rgba(34,197,94,0.75)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 8,
          height: 8,
          borderBottomLeftRadius: 2,
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: "rgba(34,197,94,0.75)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      {[11, 16, 21].map((top) => (
        <View
          key={top}
          style={{
            position: "absolute",
            top,
            left: 5,
            right: 5,
            height: 2,
            backgroundColor: "rgba(34,197,94,0.65)",
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function CheckCircleSmall() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "rgba(34,197,94,0.18)",
        borderWidth: 1.5,
        borderColor: "rgba(34,197,94,0.8)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: 8,
          height: 4.5,
          borderLeftWidth: 1.8,
          borderBottomWidth: 1.8,
          borderColor: "rgba(34,197,94,1)",
          transform: [{ rotate: "-45deg" }, { translateY: -0.5 }],
        }}
      />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Document definitions ──────────────────────────────────────────────────────

type DocDef = {
  key: DocKey;
  title: string;
  showPdf: boolean;
};

const DOC_DEFS: DocDef[] = [
  { key: "driver_photo", title: "Driver photo", showPdf: false },
  { key: "identity_document", title: "Driver ID or Passport", showPdf: true },
  { key: "driving_licence", title: "Driving licence", showPdf: true },
  { key: "health_insurance", title: "Health insurance", showPdf: true },
  { key: "iban_bank_account", title: "IBAN / Bank account", showPdf: true },
  { key: "home_registration", title: "Home registration", showPdf: true },
];

// ─── Document row ─────────────────────────────────────────────────────────────

type DocRowProps = {
  def: DocDef;
  file?: DocumentFile;
  isLast: boolean;
  onReplace: () => void;
};

function DocRow({ def, file, isLast, onReplace }: DocRowProps) {
  const isImage = !!file && file.mimeType.startsWith("image/");
  const isPdf = !!file && file.mimeType === "application/pdf";
  const displayName = file
    ? isImage
      ? file.uri.split("/").pop() ?? "photo.jpg"
      : file.name
    : "—";
  const typeLabel = isImage ? "Photo" : isPdf ? "PDF" : "";
  const sizeLabel = file?.size ? ` · ${formatSize(file.size)}` : "";

  return (
    <View style={[dr.row, !isLast && dr.border]}>
      {/* Preview box */}
      <View style={dr.previewBox}>
        {file && isImage ? (
          <Image source={{ uri: file.uri }} style={dr.thumbnail} resizeMode="cover" />
        ) : file ? (
          <View style={dr.pdfBox}>
            <PdfPreviewIcon />
          </View>
        ) : (
          <View style={dr.emptyBox} />
        )}
      </View>

      {/* Info */}
      <View style={dr.infoCol}>
        <View style={dr.titleRow}>
          <Text style={dr.title} numberOfLines={1}>
            {def.title}
          </Text>
          <View style={dr.readyBadge}>
            <Text style={dr.readyText}>✓ Ready</Text>
          </View>
        </View>
        <Text style={dr.fileName} numberOfLines={1} ellipsizeMode="middle">
          {displayName}
        </Text>
        {typeLabel ? (
          <Text style={dr.fileInfo}>
            {typeLabel}
            {sizeLabel}
          </Text>
        ) : null}
      </View>

      {/* Replace */}
      <Pressable
        style={({ pressed }) => [dr.replaceBtn, pressed && { opacity: 0.7 }]}
        onPress={onReplace}
        hitSlop={6}
      >
        <ReplaceIcon />
        <Text style={dr.replaceText}>Replace</Text>
      </Pressable>
    </View>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  previewBox: {
    width: 58,
    height: 58,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  thumbnail: {
    width: 58,
    height: 58,
  },
  pdfBox: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.07)",
  },
  emptyBox: {
    width: 58,
    height: 58,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  title: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
    flexShrink: 1,
  },
  readyBadge: {
    flexShrink: 0,
  },
  readyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "rgba(34,197,94,0.9)",
  },
  fileName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.50)",
    marginBottom: 2,
  },
  fileInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
    flexShrink: 0,
  },
  replaceText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#fff",
  },
});

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function DocumentReviewModal({ visible, onClose }: Props) {
  const [docs, setDocs] = useState<Partial<Record<DocKey, DocumentFile>>>({});
  const [sheetDocKey, setSheetDocKey] = useState<DocKey | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{
    uri: string;
    key: DocKey;
    source: "camera" | "gallery";
    fileSize?: number;
  } | null>(null);
  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTransY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      const data = registrationStore.get();
      if (data) {
        setDocs({
          driver_photo: data.driver_photo,
          identity_document: data.identity_document,
          driving_licence: data.driving_licence,
          health_insurance: data.health_insurance,
          iban_bank_account: data.iban_bank_account,
          home_registration: data.home_registration,
        });
      }
    }
  }, [visible]);

  function showToast(msg: string) {
    setToastMsg(msg);
    toastOpacity.setValue(0);
    toastTransY.setValue(20);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(toastTransY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(toastTransY, { toValue: 20, duration: 260, useNativeDriver: true }),
      ]).start(() => setToastMsg(null));
    }, 2500);
  }

  function replaceDoc(key: DocKey, file: DocumentFile) {
    setDocs((prev) => ({ ...prev, [key]: file }));
    registrationStore.updateDocument(key, file);
    const title = DOC_DEFS.find((d) => d.key === key)?.title ?? "Document";
    showToast(`${title} replaced successfully`);
  }

  // ── Camera helpers ─────────────────────────────────────────────────────────

  async function launchCamera(key: DocKey) {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in your device settings to take document photos.",
          [{ text: "OK" }]
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
      setPreviewPhoto({ uri: asset.uri, key, source: "camera", fileSize: asset.fileSize ?? undefined });
    }
  }

  async function launchGallery(key: DocKey) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPreviewPhoto({ uri: asset.uri, key, source: "gallery", fileSize: asset.fileSize ?? undefined });
    }
  }

  // ── Sheet action handlers ──────────────────────────────────────────────────

  async function handleTakePhoto() {
    const key = sheetDocKey!;
    setSheetDocKey(null);
    await new Promise((r) => setTimeout(r, 350));
    await launchCamera(key);
  }

  async function handleChooseFromGallery() {
    const key = sheetDocKey!;
    setSheetDocKey(null);
    await new Promise((r) => setTimeout(r, 350));
    await launchGallery(key);
  }

  async function handleUploadPdf() {
    const key = sheetDocKey!;
    setSheetDocKey(null);
    await new Promise((r) => setTimeout(r, 350));

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      replaceDoc(key, {
        uri: asset.uri,
        name: asset.name,
        mimeType: "application/pdf",
        size: asset.size ?? 0,
      });
    }
  }

  // ── Preview handlers ───────────────────────────────────────────────────────

  async function handleRetake() {
    if (!previewPhoto) return;
    const { key, source } = previewPhoto;
    setPreviewPhoto(null);
    await new Promise((r) => setTimeout(r, 300));
    if (source === "gallery") await launchGallery(key);
    else await launchCamera(key);
  }

  function handleUsePhoto() {
    if (!previewPhoto) return;
    replaceDoc(previewPhoto.key, {
      uri: previewPhoto.uri,
      name: previewPhoto.uri.split("/").pop() ?? "photo.jpg",
      mimeType: "image/jpeg",
      size: previewPhoto.fileSize ?? 0,
    });
    setPreviewPhoto(null);
  }

  const sheetDef = sheetDocKey ? DOC_DEFS.find((d) => d.key === sheetDocKey) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <StatusBar style="light" />
      <SafeAreaView style={m.root} edges={["top", "bottom"]}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={m.header}>
          <View style={m.headerLeft} />
          <Text style={m.headerTitle}>Documents</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [m.closeBtn, pressed && { opacity: 0.6 }]}
          >
            <XCloseIcon />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={m.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={m.subtitle}>
            Review your uploaded documents. Tap Replace to swap any file.
          </Text>

          {/* ── Document list ────────────────────────────────────── */}
          <View style={m.card}>
            {DOC_DEFS.map((def, i) => (
              <DocRow
                key={def.key}
                def={def}
                file={docs[def.key]}
                isLast={i === DOC_DEFS.length - 1}
                onReplace={() => setSheetDocKey(def.key)}
              />
            ))}
          </View>

          {/* ── Info note ────────────────────────────────────────── */}
          <View style={m.noteBanner}>
            <Text style={m.noteText}>
              Replaced documents are saved automatically and will be reviewed by
              the admin team after you submit.
            </Text>
          </View>
        </ScrollView>

        {/* ── Done button ──────────────────────────────────────────── */}
        <View style={m.footer}>
          <Pressable
            style={({ pressed }) => [m.doneBtn, pressed && { opacity: 0.88 }]}
            onPress={onClose}
          >
            <Text style={m.doneBtnText}>Done</Text>
          </Pressable>
        </View>

        {/* ── Toast ────────────────────────────────────────────────── */}
        {toastMsg !== null && (
          <Animated.View
            pointerEvents="none"
            style={[
              m.toast,
              { opacity: toastOpacity, transform: [{ translateY: toastTransY }] },
            ]}
          >
            <CheckCircleSmall />
            <Text style={m.toastText}>{toastMsg}</Text>
          </Animated.View>
        )}
      </SafeAreaView>

      {/* ── Upload options sheet ──────────────────────────────────── */}
      <DocumentUploadOptionsSheet
        visible={sheetDocKey !== null}
        documentName={sheetDef?.title ?? ""}
        onClose={() => setSheetDocKey(null)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onUploadPdf={handleUploadPdf}
        showPdf={sheetDef?.showPdf ?? false}
      />

      {/* ── Photo preview modal ───────────────────────────────────── */}
      {previewPhoto && (
        <PhotoPreviewModal
          visible
          documentName={DOC_DEFS.find((d) => d.key === previewPhoto.key)?.title ?? ""}
          photoUri={previewPhoto.uri}
          onRetake={handleRetake}
          onUsePhoto={handleUsePhoto}
        />
      )}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  headerLeft: { width: 40 },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  closeBtn: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  scroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 },

  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.50)",
    lineHeight: 20,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  noteBanner: {
    backgroundColor: "rgba(1,80,181,0.08)",
    borderWidth: 1,
    borderColor: "rgba(1,80,181,0.25)",
    borderRadius: 10,
    padding: 14,
  },
  noteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  doneBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  toast: {
    position: "absolute",
    bottom: 88,
    left: 20,
    right: 20,
    backgroundColor: "#141E35",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.28)",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#fff",
  },
});
