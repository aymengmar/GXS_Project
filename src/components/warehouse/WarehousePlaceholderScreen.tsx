import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#080F1D";
const CARD = "#0D1A2E";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";

interface Props {
  label: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function WarehousePlaceholderScreen({ label, title, subtitle, icon }: Props) {
  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>{label}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>{icon}</View>
          <Text style={styles.emptyTitle}>Coming soon</Text>
          <Text style={styles.emptyBody}>{subtitle}</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },
  header: { marginTop: 12, marginBottom: 8 },
  headerLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: ORANGE,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: WHITE,
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    textAlign: "center",
    lineHeight: 20,
  },
});
