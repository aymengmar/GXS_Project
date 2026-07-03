import { sessionStore } from "@/store/sessionStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#080F1D";
const CARD = "#0D1A2E";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";

export default function WarehouseDashboardScreen() {
  const router = useRouter();
  const session = sessionStore.get();
  const user = session?.kind === "warehouse" ? session.user : null;

  const handleLogout = () => {
    sessionStore.clear();
    router.replace("/login" as any);
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.brand}>GXS DELIVERY</Text>
          <Text style={styles.title}>Warehouse Dashboard</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ACTIVE</Text>
          </View>
          <Text style={styles.name}>{user?.full_name ?? "Warehouse Staff"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Welcome</Text>
          <Text style={styles.body}>
            You are signed in as Warehouse Staff. Daily ZIP setup, assignments,
            and counts will appear here.
          </Text>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },
  header: { marginTop: 12, marginBottom: 20 },
  brand: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
    letterSpacing: 3,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: WHITE,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: GREEN,
    letterSpacing: 1,
  },
  name: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  email: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 8,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 20,
  },
  logoutBtn: {
    marginTop: "auto",
    marginBottom: 20,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FCA5A5",
  },
});
