import { changePassword } from "@/api/backendClient";
import { images } from "@/constants/images";
import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#FF6500";
const IC = "rgba(255,255,255,0.55)";

function LockIcon({ color = IC }: { color?: string }) {
  return (
    <View style={ic.lockWrap}>
      <View style={[ic.lockShackle, { borderColor: color }]} />
      <View style={[ic.lockBody, { borderColor: color }]}>
        <View style={[ic.lockDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function EyeIcon({ color = IC, off = false }: { color?: string; off?: boolean }) {
  return (
    <View style={ic.eyeWrap}>
      <View style={[ic.eyeOval, { borderColor: color }]}>
        <View style={[ic.eyePupil, { backgroundColor: color }]} />
      </View>
      {off && <View style={[ic.eyeStrike, { backgroundColor: color }]} />}
    </View>
  );
}

const ic = StyleSheet.create({
  lockWrap: { width: 18, height: 18, alignItems: "center", justifyContent: "flex-end" },
  lockShackle: {
    width: 10,
    height: 7,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 16,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  lockDot: { width: 4, height: 4, borderRadius: 2 },
  eyeWrap: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  eyeOval: {
    width: 18,
    height: 11,
    borderWidth: 1.5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  eyePupil: { width: 5, height: 5, borderRadius: 3 },
  eyeStrike: {
    position: "absolute",
    width: 22,
    height: 1.5,
    borderRadius: 1,
    transform: [{ rotate: "-38deg" }],
  },
});

function routeAfterPasswordChange(router: ReturnType<typeof useRouter>) {
  const session = sessionStore.get();
  if (!session) {
    router.replace("/login" as any);
    return;
  }
  if (session.kind === "admin") {
    router.replace("/admin" as any);
    return;
  }
  if (session.kind === "driver") {
    if (session.status === "approved") {
      router.replace("/driver" as any);
    } else {
      router.replace("/login" as any);
    }
  }
}

export default function CreateNewPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [btnPressed, setBtnPressed] = useState(false);

  const handleSave = async () => {
    if (!newPassword) {
      setErrorMsg("New password is required.");
      return;
    }
    if (newPassword.length < 12) {
      setErrorMsg("Password must be at least 12 characters.");
      return;
    }
    if (!confirmPassword) {
      setErrorMsg("Please confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const session = sessionStore.get();
      if (!session) throw new Error("Session expired. Please log in again.");

      await changePassword(session.access_token, newPassword);

      // Clear must_change_password flag in local session
      if (session.kind === "driver") {
        sessionStore.setDriver({
          access_token: session.access_token,
          id: session.id,
          email: session.email,
          full_name: session.full_name,
          car_type: session.car_type,
          status: session.status,
          external_driver_id: session.external_driver_id,
          must_change_password: false,
        });
      }

      routeAfterPasswordChange(router);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={images.truckHero1}
        style={styles.root}
        resizeMode="cover"
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMid} />
        </View>

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Brand */}
              <View style={styles.brand}>
                <Text style={styles.gxs}>GXS</Text>
                <Text style={styles.delivery}>DELIVERY</Text>
              </View>

              {/* Title block */}
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  For your security, please set a new password before continuing.
                </Text>
              </View>

              {/* Error banner */}
              {errorMsg && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* New password */}
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <LockIcon />
                  </View>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255,255,255,0.38)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                    <EyeIcon off={!showNew} />
                  </Pressable>
                </View>

                {/* Confirm password */}
                <Text style={[styles.label, styles.labelGap]}>Confirm New Password</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <LockIcon />
                  </View>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255,255,255,0.38)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                    <EyeIcon off={!showConfirm} />
                  </Pressable>
                </View>

                {/* Save button */}
                <Pressable
                  style={[
                    styles.saveBtn,
                    (btnPressed || loading) && styles.saveBtnPressed,
                    { marginTop: 28 },
                  ]}
                  onPressIn={() => setBtnPressed(true)}
                  onPressOut={() => setBtnPressed(false)}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveBtnText}>
                    {loading ? "Saving…" : "Save New Password"}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.domain}>gxs-delivery.app</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#001232" },

  overlayTop: { flex: 0.62, backgroundColor: "rgba(0,12,36,0.82)" },
  overlayMid: { flex: 0.38, backgroundColor: "rgba(0,12,36,0.44)" },

  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },

  brand: { alignItems: "center", marginTop: 32, marginBottom: 28 },
  gxs: {
    fontFamily: "Poppins_700Bold",
    fontSize: 46,
    color: "#fff",
    lineHeight: 52,
    letterSpacing: 1,
  },
  delivery: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
    letterSpacing: 5,
    lineHeight: 20,
    marginTop: 1,
  },

  titleBlock: { marginBottom: 24 },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 20,
  },

  form: { width: "100%" },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
    marginBottom: 8,
  },
  labelGap: { marginTop: 18 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: { opacity: 0.87 },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.40)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#FCA5A5",
    lineHeight: 18,
  },

  domain: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.32)",
    textAlign: "center",
    paddingTop: 36,
    paddingBottom: 12,
  },
});
