import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const SHEET_BG  = "#0F1A2E";
const INPUT_BG  = "#111E33";
const BORDER    = "rgba(255,255,255,0.09)";
const ORANGE    = "#FF6500";
const WHITE     = "#FFFFFF";
const DIM       = "rgba(255,255,255,0.40)";
const DIVIDER   = "rgba(255,255,255,0.07)";
const HANDLE    = "rgba(255,255,255,0.18)";

const SH = Dimensions.get("window").height;

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 1l22 22" stroke={DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type FieldProps = {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  showValue: boolean;
  onToggle: () => void;
};

function PasswordField({ placeholder, value, onChangeText, showValue, onToggle }: FieldProps) {
  return (
    <View style={f.wrap}>
      <View style={f.iconLeft}><LockIcon /></View>
      <TextInput
        style={f.input}
        placeholder={placeholder}
        placeholderTextColor={DIM}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showValue}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable onPress={onToggle} hitSlop={10} style={f.iconRight}>
        {showValue ? <EyeIcon /> : <EyeOffIcon />}
      </Pressable>
    </View>
  );
}

const f = StyleSheet.create({
  wrap:     { flexDirection: "row", alignItems: "center", backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 12, paddingHorizontal: 14, height: 52 },
  iconLeft: { marginRight: 12, justifyContent: "center" },
  input:    { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: WHITE, height: "100%" },
  iconRight:{ marginLeft: 10, justifyContent: "center" },
});

type Props = { visible: boolean; onClose: () => void };

export default function AdminChangePasswordModal({ visible, onClose }: Props) {
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);

  function handleClose() {
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setShowCur(false); setShowNew(false); setShowConf(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Change Password</Text>
            <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
              <CloseIcon />
            </Pressable>
          </View>

          <View style={s.content}>
            <PasswordField
              placeholder="Current Password"
              value={currentPw}
              onChangeText={setCurrentPw}
              showValue={showCur}
              onToggle={() => setShowCur((v) => !v)}
            />
            <PasswordField
              placeholder="New Password"
              value={newPw}
              onChangeText={setNewPw}
              showValue={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
            <PasswordField
              placeholder="Confirm New Password"
              value={confirmPw}
              onChangeText={setConfirmPw}
              showValue={showConf}
              onToggle={() => setShowConf((v) => !v)}
            />
          </View>

          <View style={s.footer}>
            <Pressable style={({ pressed }) => [s.updateBtn, pressed && s.updateBtnPressed]}>
              <Text style={s.updateBtnLabel}>Update Password</Text>
            </Pressable>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: SH * 0.70,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  updateBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBtnPressed: {
    backgroundColor: "#E55A00",
  },
  updateBtnLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
    letterSpacing: 0.3,
  },
});
