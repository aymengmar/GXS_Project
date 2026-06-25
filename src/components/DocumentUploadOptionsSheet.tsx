import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SHEET_BG = "#0D1526";
const ORANGE = "#FF6500";

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <View style={{ width: 22, height: 20 }}>
      {/* body */}
      <View
        style={{
          position: "absolute",
          top: 4,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 4,
          borderColor: "#fff",
        }}
      />
      {/* viewfinder bump */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 7,
          width: 8,
          height: 5,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: "#fff",
        }}
      />
      {/* lens */}
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 7,
          width: 8,
          height: 8,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: "#fff",
        }}
      />
    </View>
  );
}

function GalleryIcon() {
  return (
    <View style={{ width: 22, height: 20 }}>
      {/* frame */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 4,
          borderColor: "#fff",
        }}
      />
      {/* mountain left */}
      <View
        style={{
          position: "absolute",
          bottom: 2,
          left: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderBottomWidth: 7,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#fff",
        }}
      />
      {/* mountain right */}
      <View
        style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderBottomWidth: 9,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#fff",
        }}
      />
      {/* sun */}
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 5,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}

function PdfIcon() {
  return (
    <View style={{ width: 18, height: 22 }}>
      {/* page */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: "#fff",
        }}
      />
      {/* folded corner */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 5,
          height: 5,
          borderBottomLeftRadius: 2,
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: "#fff",
          backgroundColor: SHEET_BG,
        }}
      />
      {/* lines */}
      {[8, 12, 16].map((top) => (
        <View
          key={top}
          style={{
            position: "absolute",
            top,
            left: 4,
            right: 4,
            height: 1.5,
            backgroundColor: "#fff",
            borderRadius: 1,
            opacity: 0.8,
          }}
        />
      ))}
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRightWidth: 2,
          borderTopWidth: 2,
          borderColor: "rgba(255,255,255,0.35)",
          transform: [{ rotate: "45deg" }, { translateX: -2 }],
        }}
      />
    </View>
  );
}

// ─── Option Row ───────────────────────────────────────────────────────────────

type OptionRowProps = {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  isLast?: boolean;
};

function OptionRow({ iconBg, icon, title, subtitle, onPress, isLast }: OptionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [or.row, !isLast && or.border, pressed && or.pressed]}
      onPress={onPress}
    >
      <View style={[or.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={or.textCol}>
        <Text style={or.title}>{title}</Text>
        <Text style={or.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

const or = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  textCol: { flex: 1, marginRight: 8 },
  title: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
});

// ─── Sheet ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  documentName: string;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onUploadPdf: () => void;
};

export default function DocumentUploadOptionsSheet({
  visible,
  documentName,
  onClose,
  onTakePhoto,
  onChooseFromGallery,
  onUploadPdf,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={sh.overlay} onPress={onClose}>
        <Pressable style={sh.sheet} onPress={() => {}}>
          {/* handle */}
          <View style={sh.handle} />

          {/* title */}
          <View style={sh.header}>
            <Text style={sh.title}>Upload {documentName}</Text>
            <Text style={sh.subtitle}>
              Choose how you want to upload this document.
            </Text>
          </View>

          {/* options */}
          <View style={sh.optionList}>
            <OptionRow
              iconBg="rgba(255,101,0,0.18)"
              icon={<CameraIcon />}
              title="Take photo"
              subtitle="Use your camera to take a photo"
              onPress={onTakePhoto}
            />
            <OptionRow
              iconBg="rgba(59,130,246,0.18)"
              icon={<GalleryIcon />}
              title="Choose image from phone"
              subtitle="Select an image from your gallery"
              onPress={onChooseFromGallery}
            />
            <OptionRow
              iconBg="rgba(34,197,94,0.18)"
              icon={<PdfIcon />}
              title="Upload PDF file"
              subtitle="Select a PDF file from your device"
              onPress={onUploadPdf}
              isLast
            />
          </View>

          {/* cancel */}
          <Pressable
            style={({ pressed }) => [sh.cancelBtn, pressed && sh.cancelPressed]}
            onPress={onClose}
          >
            <Text style={sh.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sh = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  optionList: {
    marginTop: 4,
  },
  cancelBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 50,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelPressed: { opacity: 0.7 },
  cancelText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
  },
});
