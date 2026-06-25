import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DocumentUploadOptionsSheet from "@/components/DocumentUploadOptionsSheet";
import PhotoPreviewModal from "@/components/PhotoPreviewModal";
import { registerDriver } from "@/api/backendClient";
import { registrationStore } from "@/store/registrationStore";

const BG = "#080D1A";
const ORANGE = "#FF6500";

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <View style={ic.backWrap}>
      <View style={ic.backChevron} />
    </View>
  );
}

function InfoIcon() {
  return (
    <View style={ic.infoWrap}>
      <View style={ic.infoCircle}>
        <Text style={ic.infoText}>!</Text>
      </View>
    </View>
  );
}

function IDCardIcon({ color = "rgba(255,255,255,0.55)" }: { color?: string }) {
  return (
    <View style={{ width: 22, height: 16 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 4,
          left: 3,
          width: 7,
          height: 7,
          borderRadius: 3.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 3,
          width: 5,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 7,
          right: 3,
          width: 5,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 10,
          right: 3,
          width: 3,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function HeartIcon({ color = "rgba(255,255,255,0.55)" }: { color?: string }) {
  return (
    <View style={{ width: 20, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 10,
          height: 9,
          borderTopLeftRadius: 5,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 10,
          height: 9,
          borderTopRightRadius: 5,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 11,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
        }}
      />
    </View>
  );
}

function BankIcon({ color = "rgba(255,255,255,0.55)" }: { color?: string }) {
  return (
    <View style={{ width: 22, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 9,
          width: 4,
          height: 4,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: color,
        }}
      />
      {[3, 8, 14].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            top: 4,
            left,
            width: 3,
            height: 10,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function HouseIcon({ color = "rgba(255,255,255,0.55)" }: { color?: string }) {
  return (
    <View style={{ width: 20, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 11,
            borderRightWidth: 11,
            borderBottomWidth: 9,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: color,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 1,
          right: 1,
          bottom: 0,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 7,
          width: 6,
          height: 7,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomLeftRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />
    </View>
  );
}

function UploadArrow() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderBottomWidth: 6,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#fff",
        }}
      />
      <View
        style={{
          width: 2,
          height: 5,
          backgroundColor: "#fff",
          marginTop: -1,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 1,
          left: 2,
          right: 2,
          height: 1.5,
          backgroundColor: "#fff",
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function PdfDocIcon() {
  return (
    <View style={{ width: 22, height: 26 }}>
      {/* page outline */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 4,
          borderColor: "rgba(34,197,94,0.8)",
        }}
      />
      {/* folded corner */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 6,
          height: 6,
          borderBottomLeftRadius: 2,
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: "rgba(34,197,94,0.8)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      {/* PDF label lines */}
      {[9, 13, 17].map((top) => (
        <View
          key={top}
          style={{
            position: "absolute",
            top,
            left: 4,
            right: 4,
            height: 1.5,
            backgroundColor: "rgba(34,197,94,0.7)",
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function SendIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: 8,
          borderBottomWidth: 8,
          borderLeftWidth: 14,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: "#fff",
        }}
      />
    </View>
  );
}

function ReplaceIcon() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      {/* circular arc — open on the right side */}
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          borderTopWidth: 1.8,
          borderLeftWidth: 1.8,
          borderBottomWidth: 1.8,
          borderTopColor: "#fff",
          borderLeftColor: "#fff",
          borderBottomColor: "#fff",
        }}
      />
      {/* arrowhead at top-right of the arc pointing downward */}
      <View
        style={{
          position: "absolute",
          top: 1,
          right: 1,
          width: 0,
          height: 0,
          borderLeftWidth: 3,
          borderRightWidth: 3,
          borderTopWidth: 5,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#fff",
          transform: [{ rotate: "30deg" }],
        }}
      />
    </View>
  );
}

function CheckCircleIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
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
          width: 9,
          height: 5,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: "rgba(34,197,94,1)",
          transform: [{ rotate: "-45deg" }, { translateY: -1 }],
        }}
      />
    </View>
  );
}

const ic = StyleSheet.create({
  backWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },
  infoWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  infoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: ORANGE,
    lineHeight: 14,
  },
});

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress({ stepLabel }: { stepLabel: string }) {
  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>{stepLabel}</Text>
      <View style={sp.row}>
        <View style={[sp.dot, sp.dotDone]}>
          <Text style={sp.numDone}>1</Text>
        </View>
        <View style={[sp.line, sp.lineDone]} />
        <View style={[sp.dot, sp.dotActive]}>
          <Text style={sp.numActive}>2</Text>
        </View>
        <View style={sp.line} />
        <View style={sp.dot}>
          <Text style={sp.num}>3</Text>
        </View>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { marginBottom: 24 },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: ORANGE, borderColor: ORANGE },
  dotActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  num: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
  },
  numDone: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  numActive: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginHorizontal: 4,
  },
  lineDone: { backgroundColor: ORANGE },
});

// ─── Document Row helpers ─────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MiniPdfDocIcon() {
  return (
    <View style={{ width: 13, height: 16 }}>
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          borderWidth: 1.2,
          borderRadius: 2.5,
          borderColor: "rgba(34,197,94,0.85)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0, right: 0,
          width: 4, height: 4,
          borderBottomLeftRadius: 1.5,
          borderLeftWidth: 1.2,
          borderBottomWidth: 1.2,
          borderColor: "rgba(34,197,94,0.85)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      {[5, 8, 11].map((top) => (
        <View
          key={top}
          style={{
            position: "absolute",
            top,
            left: 2.5, right: 2.5,
            height: 1.2,
            backgroundColor: "rgba(34,197,94,0.7)",
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function MiniPhotoIcon() {
  return (
    <View style={{ width: 15, height: 13 }}>
      <View
        style={{
          position: "absolute",
          top: 3, left: 0, right: 0, bottom: 0,
          borderWidth: 1.2,
          borderRadius: 2.5,
          borderColor: ORANGE,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0, left: 5,
          width: 5, height: 4,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderTopWidth: 1.2,
          borderLeftWidth: 1.2,
          borderRightWidth: 1.2,
          borderColor: ORANGE,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 5, left: 4.5,
          width: 5, height: 5,
          borderRadius: 2.5,
          borderWidth: 1.2,
          borderColor: ORANGE,
        }}
      />
    </View>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────

type UploadEntry =
  | { type: "photo"; uri: string; size?: number }
  | { type: "pdf"; uri: string; name: string; size?: number };

type DocumentRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onUpload: () => void;
  upload?: UploadEntry;
};

function DocumentRow({ icon, title, subtitle, onUpload, upload }: DocumentRowProps) {
  // ── Selected state ────────────────────────────────────────────────────────
  if (upload) {
    const fileName =
      upload.type === "pdf"
        ? upload.name
        : (upload.uri.split("/").pop() ?? "photo.jpg");
    const fileTypeLabel = upload.type === "pdf" ? "PDF" : "Photo";
    const sizeLabel = upload.size ? ` · ${formatSize(upload.size)}` : "";

    return (
      <View style={dr.row}>
        {/* Left: always the original document icon */}
        <View style={dr.iconBox}>{icon}</View>

        <View style={dr.selectedTextCol}>
          {/* Title + pending badge on same row */}
          <View style={dr.titleRow}>
            <Text style={dr.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={dr.pendingBadge}>
              <Text style={dr.pendingText}>✓ Pending review</Text>
            </View>
          </View>

          {/* Filename */}
          <Text style={dr.fileName} numberOfLines={1} ellipsizeMode="middle">
            {fileName}
          </Text>

          {/* File type/size + Replace button */}
          <View style={dr.bottomRow}>
            <Text style={dr.fileInfo}>
              {fileTypeLabel}
              {sizeLabel}
            </Text>
            <Pressable style={dr.replaceBtn} onPress={onUpload}>
              {upload.type === "pdf" ? <MiniPdfDocIcon /> : <MiniPhotoIcon />}
              <Text style={dr.replaceText}>Replace</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Unselected state ──────────────────────────────────────────────────────
  return (
    <View style={dr.row}>
      <View style={dr.iconBox}>{icon}</View>
      <View style={dr.textCol}>
        <Text style={dr.title}>{title}</Text>
        <Text style={dr.subtitle}>{subtitle}</Text>
      </View>
      <Pressable style={dr.uploadBtn} onPress={onUpload}>
        <UploadArrow />
        <Text style={dr.uploadText}>Upload</Text>
      </Pressable>
    </View>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  iconBox: {
    width: 42,
    height: 42,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
    overflow: "hidden",
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },

  // ── Unselected state ──────────────────────────────────────────────────────
  textCol: { flex: 1, marginRight: 10 },
  title: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#fff",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.42)",
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 5,
    flexShrink: 0,
  },
  uploadText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },

  // ── Selected state ────────────────────────────────────────────────────────
  selectedTextCol: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  pendingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(34,197,94,0.9)",
  },
  fileName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  fileInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 7,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
  },
  replaceText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#fff",
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = {
  isOwnCar?: boolean;
};

export default function UploadDocumentsScreen({ isOwnCar = false }: Props) {
  const router = useRouter();
  const [sheetDoc, setSheetDoc] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadEntry>>({});
  const [previewPhoto, setPreviewPhoto] = useState<{
    uri: string;
    docName: string;
    source: "camera" | "gallery";
    fileSize?: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  function showToast(message: string) {
    setToastMessage(message);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: 20, duration: 280, useNativeDriver: true }),
      ]).start(() => setToastMessage(null));
    }, 2500);
  }

  const stepLabel = "Step 2 of 3 — Required documents";

  function openSheet(documentName: string) {
    setSheetDoc(documentName);
  }

  function closeSheet() {
    setSheetDoc(null);
  }

  async function launchCamera(docName: string) {
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
      setPreviewPhoto({ uri: asset.uri, docName, source: "camera", fileSize: asset.fileSize ?? undefined });
    }
  }

  async function launchGallery(docName: string) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPreviewPhoto({ uri: asset.uri, docName, source: "gallery", fileSize: asset.fileSize ?? undefined });
    }
  }

  async function handleTakePhoto() {
    const docName = sheetDoc!;
    closeSheet();
    // Brief delay so the bottom sheet can dismiss before camera launches
    await new Promise((r) => setTimeout(r, 350));
    await launchCamera(docName);
  }

  async function handleChooseFromGallery() {
    const docName = sheetDoc!;
    closeSheet();
    await new Promise((r) => setTimeout(r, 350));
    await launchGallery(docName);
  }

  async function handleUploadPdf() {
    const docName = sheetDoc!;
    closeSheet();
    await new Promise((r) => setTimeout(r, 350));

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const isReplace = !!uploads[docName];
      setUploads((prev) => ({
        ...prev,
        [docName]: { type: "pdf", uri: asset.uri, name: asset.name, size: asset.size ?? undefined },
      }));
      showToast(`${docName} ${isReplace ? "replaced" : "added"} successfully`);
    }
  }

  async function handleRetake(docName: string) {
    const source = previewPhoto?.source ?? "camera";
    setPreviewPhoto(null);
    await new Promise((r) => setTimeout(r, 300));
    if (source === "gallery") {
      await launchGallery(docName);
    } else {
      await launchCamera(docName);
    }
  }

  function handleUsePhoto() {
    if (!previewPhoto) return;
    const docName = previewPhoto.docName;
    const isReplace = !!uploads[docName];
    setUploads((prev) => ({
      ...prev,
      [docName]: { type: "photo", uri: previewPhoto.uri, size: previewPhoto.fileSize },
    }));
    setPreviewPhoto(null);
    showToast(`${docName} ${isReplace ? "replaced" : "added"} successfully`);
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <BackArrow />
          </Pressable>
          <Text style={s.headerTitle}>Upload documents</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <StepProgress stepLabel={stepLabel} />

          {/* ── Info banner ─────────────────────────────────────── */}
          {!isOwnCar && (
            <View style={s.banner}>
              <View style={s.bannerIconWrap}>
                <InfoIcon />
              </View>
              <Text style={s.bannerText}>
                Company car will be assigned by admin after approval. You do not
                need to provide vehicle details now.
              </Text>
            </View>
          )}

          {/* ── Document list ────────────────────────────────────── */}
          <View style={s.docList}>
            <DocumentRow
              icon={<IDCardIcon />}
              title="Driving licence"
              subtitle="Upload a clear photo or scan"
              onUpload={() => openSheet("Driving licence")}
              upload={uploads["Driving licence"]}
            />
            <DocumentRow
              icon={<HeartIcon />}
              title="Health insurance"
              subtitle="Upload a clear photo or scan"
              onUpload={() => openSheet("Health insurance")}
              upload={uploads["Health insurance"]}
            />
            <DocumentRow
              icon={<BankIcon />}
              title="IBAN / Bank account"
              subtitle="Upload a clear photo or scan"
              onUpload={() => openSheet("IBAN / Bank account")}
              upload={uploads["IBAN / Bank account"]}
            />
            <DocumentRow
              icon={<HouseIcon />}
              title="Home registration"
              subtitle="Upload a clear photo or scan"
              onUpload={() => openSheet("Home registration")}
              upload={uploads["Home registration"]}
            />
          </View>

          {/* ── Submit error ─────────────────────────────────────── */}
          {submitError ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{submitError}</Text>
            </View>
          ) : null}

          {/* ── Submit ───────────────────────────────────────────── */}
          <Pressable
            style={[s.submitBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={async () => {
              setSubmitError(null);
              const data = registrationStore.get();
              if (!data) {
                setSubmitError("Registration data missing. Please go back to step 1.");
                return;
              }
              setSubmitting(true);
              try {
                await registerDriver(data);
                registrationStore.clear();
                router.push("/register/submitted");
              } catch (err: unknown) {
                setSubmitError(
                  err instanceof Error
                    ? err.message
                    : "Registration failed. Please try again."
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <SendIcon />
                <Text style={s.submitBtnText}>Submit registration</Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {/* ── Toast ──────────────────────────────────────────────── */}
        {toastMessage !== null && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.toast,
              { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] },
            ]}
          >
            <CheckCircleIcon />
            <Text style={s.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </SafeAreaView>

      <DocumentUploadOptionsSheet
        visible={sheetDoc !== null}
        documentName={sheetDoc ?? ""}
        onClose={closeSheet}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onUploadPdf={handleUploadPdf}
      />

      {previewPhoto && (
        <PhotoPreviewModal
          visible
          documentName={previewPhoto.docName}
          photoUri={previewPhoto.uri}
          onRetake={handleRetake}
          onUsePhoto={handleUsePhoto}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  headerRight: { width: 40 },

  scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },

  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,101,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  bannerIconWrap: { flexShrink: 0, marginTop: 1 },
  bannerText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
  },

  docList: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 28,
  },

  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.40)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#FCA5A5",
    lineHeight: 18,
  },

  submitBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  toast: {
    position: "absolute",
    bottom: 20,
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
