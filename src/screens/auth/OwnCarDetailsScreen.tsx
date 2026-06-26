import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { registrationStore } from "@/store/registrationStore";
import {
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

const BG = "#080D1A";
const ORANGE = "#FF6500";
const IC = "rgba(255,255,255,0.48)";
const FIELD_BG = "rgba(255,255,255,0.06)";
const FIELD_BORDER = "rgba(255,255,255,0.13)";

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <View style={ic.backWrap}>
      <View style={ic.backChevron} />
    </View>
  );
}

function CarDetailIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 22, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          width: 12,
          height: 8,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 2,
          left: 0,
          right: 0,
          height: 8,
          borderWidth: 1.5,
          borderRadius: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 2,
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 2,
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
    </View>
  );
}

function PlateIcon({ color = IC }: { color?: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 14,
        borderWidth: 1.5,
        borderRadius: 3,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 14,
          height: 3,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function ShieldIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 20, alignItems: "center" }}>
      <View
        style={{
          width: 16,
          height: 14,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 7,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

function ClipboardIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          width: 8,
          height: 5,
          borderWidth: 1.5,
          borderRadius: 2,
          borderColor: color,
          backgroundColor: BG,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 3,
          width: 10,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 3,
          width: 7,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function CalendarIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 18, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          height: 6,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          width: 2,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 4,
          width: 2,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function ChevronDown({ color = IC }: { color?: string }) {
  return (
    <View style={ic.chevWrap}>
      <View style={[ic.chevDown, { borderColor: color }]} />
    </View>
  );
}

const ic = StyleSheet.create({
  backWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },
  chevWrap: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  chevDown: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }, { translateY: -2 }],
  },
});

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress() {
  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>Step 2 of 3 — Your vehicle information</Text>
      <View style={sp.row}>
        <View style={[sp.dot, sp.dotDone]}>
          <Text style={sp.numDone}>1</Text>
        </View>
        <View style={[sp.line, sp.lineDone]} />
        <View style={[sp.dot, sp.dotActive]}>
          <Text style={sp.numActive}>2</Text>
        </View>
        <View style={sp.line} />
        <View style={sp.dot}>
          <Text style={sp.num}>3</Text>
        </View>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { marginBottom: 28 },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  dotActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  num: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
  },
  numDone: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  numActive: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginHorizontal: 4,
  },
  lineDone: {
    backgroundColor: ORANGE,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnCarDetailsScreen() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [plate, setPlate] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
              <BackArrow />
            </Pressable>
            <Text style={s.headerTitle}>Own car details</Text>
            <View style={s.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StepProgress />

            {/* ── Vehicle make & model ────────────────────────────── */}
            <Text style={[s.label, s.labelFirst]}>Vehicle make & model</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <CarDetailIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="e.g. VW Golf 2020"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={make}
                onChangeText={setMake}
                autoCapitalize="words"
              />
            </View>

            {/* ── Plate number ───────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Plate number</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <PlateIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="e.g. HH-AK 1234"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
              />
            </View>

            {/* ── Insurance provider ─────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Insurance provider</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <ShieldIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="e.g. Allianz"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                autoCapitalize="words"
              />
            </View>

            {/* ── Insurance number ────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Insurance number</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <ClipboardIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="Enter insurance number"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                autoCapitalize="none"
              />
            </View>

            {/* ── Vehicle year ────────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Vehicle year</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <CalendarIcon />
              </View>
              <TextInput
                style={[s.inputText, { flex: 1 }]}
                placeholder="e.g. 2020"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={vehicleYear}
                onChangeText={setVehicleYear}
                keyboardType="number-pad"
                maxLength={4}
              />
              <ChevronDown />
            </View>

            {/* ── Continue ────────────────────────────────────────── */}
            <Pressable
              style={s.continueBtn}
              onPress={() => {
                registrationStore.setOwnCarDetails({
                  vehicle_make_model: make.trim(),
                  plate_number: plate.trim(),
                  insurance_provider: insuranceProvider.trim(),
                  insurance_number: insuranceNumber.trim(),
                  vehicle_year: vehicleYear.trim(),
                });
                router.push("/register/upload-documents?from=own-car" as any);
              }}
            >
              <Text style={s.continueBtnText}>Continue to documents →</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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

  scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 7,
  },
  labelFirst: { marginTop: 0 },
  labelGap: { marginTop: 14 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderWidth: 1.5,
    borderColor: FIELD_BORDER,
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

  continueBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  continueBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
