import { images } from "@/constants/images";
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

// ── Inline icon components ──────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <View style={ic.backWrap}>
      <View style={ic.backChevron} />
    </View>
  );
}

function MailIcon({ color = IC }: { color?: string }) {
  return (
    <View style={[ic.mailBody, { borderColor: color }]}>
      {/* Two diagonal inner lines forming the envelope "V" */}
      <View style={[ic.mailFlapL, { borderColor: color }]} />
      <View style={[ic.mailFlapR, { borderColor: color }]} />
    </View>
  );
}

function LockIcon({ color = IC }: { color?: string }) {
  return (
    <View style={ic.lockWrap}>
      {/* Shackle arc */}
      <View
        style={[
          ic.lockShackle,
          { borderColor: color },
        ]}
      />
      {/* Body */}
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
  // Back arrow – left-pointing chevron
  backWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },

  // Envelope
  mailBody: {
    width: 18,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 2,
    overflow: "hidden",
  },
  mailFlapL: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 13,
    height: 10,
    borderRightWidth: 1.5,
    transform: [{ rotate: "22deg" }],
  },
  mailFlapR: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 13,
    height: 10,
    borderLeftWidth: 1.5,
    transform: [{ rotate: "-22deg" }],
  },

  // Padlock
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

  // Eye
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

// ── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginPressed, setLoginPressed] = useState(false);

  return (
    <>
      <StatusBar style="light" />

      <ImageBackground
        source={images.truckHero1}
        style={styles.root}
        resizeMode="cover"
      >
        {/* Dark overlay – heavier at top so form stays legible */}
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
              {/* ── Back arrow ─────────────────────────────────────── */}
              <Pressable
                style={styles.back}
                onPress={() => router.back()}
                hitSlop={12}
              >
                <BackArrowIcon />
              </Pressable>

              {/* ── Brand ──────────────────────────────────────────── */}
              <View style={styles.brand}>
                <Text style={styles.gxs}>GXS</Text>
                <Text style={styles.delivery}>DELIVERY</Text>
                <Text style={styles.brandSub}>
                  Internal Delivery Management{"\n"}Hamburg, Germany
                </Text>
              </View>

              {/* ── Form ───────────────────────────────────────────── */}
              <View style={styles.form}>
                {/* Email */}
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <MailIcon />
                  </View>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.38)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password */}
                <Text style={[styles.label, styles.labelGap]}>Password</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <LockIcon />
                  </View>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.38)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                  >
                    <EyeIcon off={!showPassword} />
                  </Pressable>
                </View>

                {/* Forgot Password */}
                <Pressable style={styles.forgotWrap}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                {/* Login button */}
                <Pressable
                  style={[
                    styles.loginBtn,
                    loginPressed && styles.loginBtnPressed,
                  ]}
                  onPressIn={() => setLoginPressed(true)}
                  onPressOut={() => setLoginPressed(false)}
                  onPress={() => {}}
                >
                  <Text style={styles.loginBtnText}>Login</Text>
                </Pressable>

                {/* Register link */}
                <View style={styles.registerRow}>
                  <Text style={styles.registerText}>
                    {"Don't have an account? "}
                  </Text>
                  <Pressable>
                    <Text style={styles.registerLink}>Register as Driver</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Domain footer ──────────────────────────────────── */}
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

  back: { marginTop: 8, marginBottom: 20, alignSelf: "flex-start" },

  // ── Brand ──────────────────────────────────────────────────────────
  brand: { alignItems: "center", marginBottom: 28 },
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
  brandSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },

  // ── Form ───────────────────────────────────────────────────────────
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
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },

  forgotWrap: { alignSelf: "flex-end", marginTop: 10, marginBottom: 22 },
  forgotText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
  },

  loginBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  loginBtnPressed: { opacity: 0.87 },
  loginBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  registerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
  },
  registerLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
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
