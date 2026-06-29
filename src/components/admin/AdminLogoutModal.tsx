import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const CARD_BG   = "#111E33";
const RED       = "#EF4444";
const ICON_BG   = "rgba(239,68,68,0.12)";
const CANCEL_BG = "rgba(255,255,255,0.07)";
const WHITE     = "#FFFFFF";
const DIM       = "rgba(255,255,255,0.60)";
const BORDER    = "rgba(255,255,255,0.09)";

const SW = Dimensions.get("window").width;

function LogoutIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={RED} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17l5-5-5-5M21 12H9" stroke={RED} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type Props = { visible: boolean; onClose: () => void };

export default function AdminLogoutModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.dialog}>
          <View style={s.iconCircle}>
            <LogoutIcon />
          </View>

          <Text style={s.title}>Sign Out</Text>
          <Text style={s.body}>
            {"Are you sure you want to\nsign out from your admin account?"}
          </Text>

          <View style={s.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [s.cancelBtn, pressed && s.cancelBtnPressed]}
            >
              <Text style={s.cancelLabel}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [s.logoutBtn, pressed && s.logoutBtnPressed]}
            >
              <Text style={s.logoutLabel}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ICON_BG,
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    marginBottom: 10,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: DIM,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: CANCEL_BG,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cancelBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cancelLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  logoutBtn: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnPressed: {
    backgroundColor: "#C93333",
  },
  logoutLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: WHITE,
  },
});
