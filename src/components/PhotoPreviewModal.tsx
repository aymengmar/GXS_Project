import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const BG = "#080D1A";
const ORANGE = "#FF6500";

function BackChevron() {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderLeftWidth: 2.5,
          borderBottomWidth: 2.5,
          borderColor: "#fff",
          transform: [{ rotate: "45deg" }, { translateX: 2 }],
        }}
      />
    </View>
  );
}

function RetakeIcon() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 13,
          height: 13,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: "#fff",
          borderRightColor: "transparent",
          transform: [{ rotate: "30deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderBottomWidth: 5,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#fff",
          transform: [{ rotate: "40deg" }],
        }}
      />
    </View>
  );
}

type Props = {
  visible: boolean;
  documentName: string;
  photoUri: string;
  onRetake: (docName: string) => void;
  onUsePhoto: () => void;
};

export default function PhotoPreviewModal({
  visible,
  documentName,
  photoUri,
  onRetake,
  onUsePhoto,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => onRetake(documentName)}
    >
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => onRetake(documentName)} hitSlop={12} style={s.backBtn}>
            <BackChevron />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>
            Preview {documentName}
          </Text>
          <View style={s.headerRight} />
        </View>

        {/* Photo */}
        <View style={s.photoContainer}>
          <Image source={{ uri: photoUri }} style={s.photo} resizeMode="contain" />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Pressable
            style={({ pressed }) => [s.retakeBtn, pressed && s.pressed]}
            onPress={() => onRetake(documentName)}
          >
            <RetakeIcon />
            <Text style={s.retakeText}>Retake</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.useBtn, pressed && s.pressed]}
            onPress={onUsePhoto}
          >
            <Text style={s.useText}>Use this photo</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
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

  photoContainer: {
    flex: 1,
    backgroundColor: "#000",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    flex: 1,
    width: "100%",
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    gap: 8,
  },
  retakeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  useBtn: {
    flex: 1.4,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  useText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  pressed: { opacity: 0.75 },
});
