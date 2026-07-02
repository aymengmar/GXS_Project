import type { DriverDocumentListItem } from "@/api/backendClient";
import PdfDocumentViewer from "@/components/admin/PdfDocumentViewer";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#080F1D";
const CARD = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.28)";

function ViewerFallback({ fileName }: { fileName: string | null }) {
  return (
    <View style={fb.wrap}>
      <View style={fb.iconBox}>
        <View style={fb.docShape}>
          <View style={[fb.line, { top: 14 }]} />
          <View style={[fb.line, { top: 21 }]} />
          <View style={[fb.line, { top: 28, right: 12 }]} />
        </View>
      </View>
      <Text style={fb.title}>{fileName ?? "Document"}</Text>
      <Text style={fb.sub}>Preview not available</Text>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  iconBox: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  docShape: { width: 44, height: 54, borderRadius: 6, borderWidth: 2, borderColor: MUTED, position: "relative" },
  line: { position: "absolute", left: 7, right: 7, height: 1.5, borderRadius: 1, backgroundColor: MUTED },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: DIM, textAlign: "center" },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED, textAlign: "center" },
});

type Props = {
  visible: boolean;
  document: DriverDocumentListItem | null;
  onClose: () => void;
};

export default function DriverDocumentPreviewModal({ visible, document: doc, onClose }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [doc?.id]);

  if (!doc) return null;

  const isImage = (doc.mime_type ?? "").startsWith("image/");
  const isPdf =
    doc.mime_type === "application/pdf" || (doc.file_name ?? "").toLowerCase().endsWith(".pdf");

  const showImage = isImage && !!doc.signed_url && !imageFailed;
  const showPdf = isPdf && !!doc.signed_url;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        <View style={s.header}>
          <Text style={s.title} numberOfLines={2}>
            {doc.title}
          </Text>
          <Pressable onPress={onClose} style={s.closeBtn} hitSlop={14}>
            <View style={[s.closeLine, { transform: [{ rotate: "45deg" }] }]} />
            <View style={[s.closeLine, { transform: [{ rotate: "-45deg" }] }]} />
          </Pressable>
        </View>

        <View style={s.viewer}>
          {showImage ? (
            <Image
              source={{ uri: doc.signed_url! }}
              style={s.image}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          ) : showPdf ? (
            <PdfDocumentViewer fileUrl={doc.signed_url!} fileName={doc.file_name} />
          ) : (
            <ViewerFallback fileName={doc.file_name} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
    lineHeight: 22,
  },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  closeLine: { position: "absolute", width: 18, height: 2, backgroundColor: DIM, borderRadius: 1 },
  viewer: { flex: 1, backgroundColor: "#050B15" },
  image: { flex: 1, width: "100%", height: "100%" },
});
