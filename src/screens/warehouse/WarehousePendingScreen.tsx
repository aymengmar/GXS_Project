import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#080F1D";
const CARD = "#0D1A2E";
const BORDER = "rgba(255,255,255,0.07)";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";

export default function WarehousePendingScreen() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStore.clear();
    router.replace("/login" as any);
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Account Pending</Text>
          <Text style={styles.body}>
            Your warehouse account is waiting for Admin activation. You will be
            able to sign in once your account is set to active.
          </Text>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Back to Login</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(245,158,11,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AMBER,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    marginBottom: 10,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: DIM,
    textAlign: "center",
    lineHeight: 21,
  },
  logoutBtn: {
    marginBottom: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
});
