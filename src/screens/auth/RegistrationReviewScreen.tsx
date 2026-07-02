import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DocumentReviewModal from "@/components/DocumentReviewModal";
import { registerDriver, uploadDocument } from "@/api/backendClient";
import { DocKey, registrationStore } from "@/store/registrationStore";

const BG = "#080D1A";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrow() {
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

function CarIcon() {
  return (
    <View style={{ width: 22, height: 17 }}>
      <View
        style={{
          position: "absolute",
          top: 5,
          left: 0,
          right: 0,
          height: 11,
          borderRadius: 4,
          borderWidth: 1.8,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          right: 4,
          height: 7,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      {[2, 15].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            bottom: -2,
            left,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "rgba(255,255,255,0.55)",
          }}
        />
      ))}
    </View>
  );
}

function DocReadyIcon() {
  return (
    <View style={{ width: 17, height: 21 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.6,
          borderRadius: 3,
          borderColor: "rgba(34,197,94,0.7)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 5,
          height: 5,
          borderBottomLeftRadius: 2,
          borderLeftWidth: 1.6,
          borderBottomWidth: 1.6,
          borderColor: "rgba(34,197,94,0.7)",
          backgroundColor: BG,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 10,
          left: 3,
          width: 7,
          height: 4,
          borderLeftWidth: 1.6,
          borderBottomWidth: 1.6,
          borderColor: "rgba(34,197,94,0.9)",
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function ShieldCheckIcon() {
  return (
    <View style={{ width: 17, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 12,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: "rgba(34,197,94,0.7)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          bottom: 0,
          borderBottomLeftRadius: 9,
          borderBottomRightRadius: 9,
          borderWidth: 1.6,
          borderTopWidth: 0,
          borderColor: "rgba(34,197,94,0.7)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 8,
          left: 3.5,
          width: 6,
          height: 3.5,
          borderLeftWidth: 1.6,
          borderBottomWidth: 1.6,
          borderColor: "rgba(34,197,94,0.9)",
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function MailIcon() {
  return (
    <View style={{ width: 20, height: 15 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.6,
          borderRadius: 3,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          position: "absolute",
          top: 0,
          left: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 7,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.45)",
        }}
      />
    </View>
  );
}

function PhoneIcon() {
  return (
    <View style={{ width: 14, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.6,
          borderRadius: 4,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          right: 3,
          height: 1.5,
          backgroundColor: "rgba(255,255,255,0.4)",
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 3,
          left: "50%",
          marginLeft: -2.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: "rgba(255,255,255,0.4)",
        }}
      />
    </View>
  );
}

function PinIcon() {
  return (
    <View style={{ width: 14, height: 20, alignItems: "center" }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1.6,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderTopWidth: 7,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.55)",
          marginTop: -2,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 4,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: "rgba(255,255,255,0.45)",
        }}
      />
    </View>
  );
}

function VehicleIcon() {
  return (
    <View style={{ width: 22, height: 17 }}>
      <View
        style={{
          position: "absolute",
          top: 5,
          left: 0,
          right: 0,
          height: 11,
          borderRadius: 4,
          borderWidth: 1.8,
          borderColor: "rgba(250,204,21,0.7)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          right: 4,
          height: 7,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: "rgba(250,204,21,0.7)",
        }}
      />
      {[2, 15].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            bottom: -2,
            left,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "rgba(250,204,21,0.6)",
          }}
        />
      ))}
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={{ width: 18, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.6,
          borderRadius: 3,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          height: 5,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      {[4, 11].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            top: 0,
            left,
            width: 2.5,
            height: 6,
            backgroundColor: "rgba(255,255,255,0.55)",
            borderRadius: 1.5,
          }}
        />
      ))}
      {[10, 14].map((top) =>
        [4, 8, 12].map((left) => (
          <View
            key={`${top}-${left}`}
            style={{
              position: "absolute",
              top,
              left,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.40)",
            }}
          />
        ))
      )}
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: "rgba(255,255,255,0.22)",
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function SendIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: 8,
          borderBottomWidth: 8,
          borderLeftWidth: 14,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: "#fff",
        }}
      />
    </View>
  );
}

// ─── Step progress ────────────────────────────────────────────────────────────

function StepProgress() {
  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>Step 3 of 3 — Registration review</Text>
      <View style={sp.row}>
        <View style={[sp.dot, sp.dotDone]}>
          <Text style={sp.numDone}>1</Text>
        </View>
        <View style={[sp.line, sp.lineDone]} />
        <View style={[sp.dot, sp.dotDone]}>
          <Text style={sp.numDone}>2</Text>
        </View>
        <View style={[sp.line, sp.lineDone]} />
        <View style={[sp.dot, sp.dotActive]}>
          <Text style={sp.numActive}>3</Text>
        </View>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { marginBottom: 24 },
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
  dotDone: { backgroundColor: ORANGE, borderColor: ORANGE },
  dotActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  num: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
  },
  numDone: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  numActive: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginHorizontal: 4,
  },
  lineDone: { backgroundColor: ORANGE },
});

// ─── Icon box colors ──────────────────────────────────────────────────────────

const ICON_COLORS: Record<string, { bg: string; border: string }> = {
  orange: {
    bg: "rgba(255,101,0,0.14)",
    border: "rgba(255,101,0,0.35)",
  },
  green: {
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.30)",
  },
  blue: {
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.28)",
  },
  indigo: {
    bg: "rgba(129,140,248,0.12)",
    border: "rgba(129,140,248,0.28)",
  },
  teal: {
    bg: "rgba(45,212,191,0.12)",
    border: "rgba(45,212,191,0.28)",
  },
  amber: {
    bg: "rgba(250,204,21,0.12)",
    border: "rgba(250,204,21,0.28)",
  },
  slate: {
    bg: "rgba(148,163,184,0.10)",
    border: "rgba(148,163,184,0.22)",
  },
};

// ─── Summary row ──────────────────────────────────────────────────────────────

type SummaryRowProps = {
  icon: React.ReactNode;
  iconColor?: keyof typeof ICON_COLORS;
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
  onPress?: () => void;
};

function SummaryRow({
  icon,
  iconColor = "slate",
  label,
  value,
  valueColor,
  isLast,
  onPress,
}: SummaryRowProps) {
  const colors = ICON_COLORS[iconColor];
  const inner = (
    <>
      <View style={[rw.iconBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        {icon}
      </View>
      <Text style={rw.label}>{label}</Text>
      <View style={rw.right}>
        <Text
          style={[rw.value, valueColor ? { color: valueColor } : undefined]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
        <ChevronRight />
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [rw.wrap, !isLast && rw.border, pressed && { opacity: 0.72 }]}
        onPress={onPress}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View style={[rw.wrap, !isLast && rw.border]}>
      {inner}
    </View>
  );
}

const rw = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: "52%",
  },
  value: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
    textAlign: "right",
  },
});

// ─── Success modal ────────────────────────────────────────────────────────────

const CONFETTI_DOTS: Array<{
  top: number;
  left?: number;
  right?: number;
  size: number;
  color: string;
  rotate?: number;
}> = [
  { top: 4,  left: 18,  size: 7, color: "#FF6500" },
  { top: 10, left: 46,  size: 5, color: "#22C55E" },
  { top: 0,  left: 76,  size: 6, color: "#FACC15" },
  { top: 22, left: 8,   size: 4, color: "#FACC15", rotate: 30 },
  { top: 32, left: 34,  size: 4, color: "#FF6500" },
  { top: 4,  right: 18, size: 7, color: "#FACC15" },
  { top: 12, right: 44, size: 5, color: "#FF6500" },
  { top: 0,  right: 74, size: 6, color: "#22C55E" },
  { top: 24, right: 10, size: 4, color: "#22C55E", rotate: -25 },
  { top: 34, right: 32, size: 4, color: "#FACC15" },
];

function SuccessModal({ visible, onGotIt }: { visible: boolean; onGotIt: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={sm.overlay}>
        <View style={sm.card}>
          {/* Confetti */}
          <View style={sm.confettiWrap}>
            {CONFETTI_DOTS.map((c, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  top: c.top,
                  ...(c.left !== undefined ? { left: c.left } : {}),
                  ...(c.right !== undefined ? { right: c.right } : {}),
                  width: c.size,
                  height: c.size,
                  borderRadius: c.size / 2,
                  backgroundColor: c.color,
                  opacity: 0.85,
                  transform: c.rotate ? [{ rotate: `${c.rotate}deg` }] : [],
                }}
              />
            ))}

            {/* Big green check circle */}
            <View style={sm.outerRing}>
              <View style={sm.innerCircle}>
                <View style={sm.checkWrap}>
                  <View style={sm.checkLong} />
                  <View style={sm.checkShort} />
                </View>
              </View>
            </View>
          </View>

          <Text style={sm.title}>Registration submitted!</Text>

          <View style={sm.subtitleRow}>
            <Text style={sm.subtitleStar}>✦</Text>
            <Text style={sm.subtitle}> You are almost there. </Text>
            <Text style={sm.subtitleStar}>✦</Text>
          </View>

          <Text style={sm.message}>
            Our admin team will review your documents and credentials. You will be notified once your account is approved.
          </Text>

          <Pressable
            style={({ pressed }) => [sm.gotItBtn, pressed && { opacity: 0.88 }]}
            onPress={onGotIt}
          >
            <Text style={sm.gotItBtnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8,13,26,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: "#0F1729",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 0,
    alignItems: "center",
  },

  confettiWrap: {
    width: "100%",
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 2,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34,197,94,0.22)",
    borderWidth: 2,
    borderColor: "rgba(34,197,94,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrap: {
    width: 34,
    height: 26,
    position: "relative",
  },
  checkLong: {
    position: "absolute",
    bottom: 4,
    left: 0,
    width: 32,
    height: 4,
    backgroundColor: GREEN,
    borderRadius: 2,
    transform: [{ rotate: "-45deg" }, { translateX: -4 }, { translateY: 10 }],
  },
  checkShort: {
    position: "absolute",
    bottom: 4,
    left: 0,
    width: 16,
    height: 4,
    backgroundColor: GREEN,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }, { translateX: -2 }, { translateY: 16 }],
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  subtitleStar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FACC15",
  },
  subtitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FACC15",
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  gotItBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 50,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  gotItBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});

// ─── Document keys to upload ──────────────────────────────────────────────────

const ALL_DOC_KEYS: DocKey[] = [
  "driver_photo",
  "identity_document",
  "driving_licence",
  "health_insurance",
  "iban_bank_account",
  "home_registration",
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegistrationReviewScreen() {
  const router = useRouter();
  const data = registrationStore.get();

  const [submittedAt] = useState(() => formatDate(new Date()));
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isOwnCar = data?.car_type === "own_car";
  const driverTypeLabel = isOwnCar ? "Own car driver" : "Company car driver";

  const vehicleLabel = isOwnCar && data?.own_car_details
    ? `${data.own_car_details.plate_number} · ${data.own_car_details.vehicle_make_model}`
    : null;

  async function handleConfirmSubmit() {
    setSubmitError(null);

    if (!data?.email_verified) {
      setSubmitError("Email not verified. Please go back and verify your email.");
      return;
    }
    if (!data?.access_token) {
      setSubmitError("Session expired. Please restart registration.");
      return;
    }
    const missingDocs = ALL_DOC_KEYS.filter((key) => !data[key]);
    if (missingDocs.length > 0) {
      setSubmitError("All 6 documents are required. Please go back and upload the missing documents.");
      return;
    }
    if (!data?.full_name || !data?.phone || !data?.postal_code || !data?.car_type) {
      setSubmitError("Required profile information is missing. Please restart registration.");
      return;
    }

    setIsSubmitting(true);
    try {
      for (const key of ALL_DOC_KEYS) {
        const doc = data[key]!;
        await uploadDocument(
          { uri: doc.uri, name: doc.name, mimeType: doc.mimeType },
          key,
          data.access_token,
        );
      }

      await registerDriver({
        access_token: data.access_token,
        email: data.email,
        postal_code: data.postal_code,
        full_name: data.full_name,
        phone: data.phone,
        car_type: data.car_type,
        own_car_details: data.own_car_details,
      });

      setShowSuccessModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <BackArrow />
          </Pressable>
          <Text style={s.headerTitle}>Registration review</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <StepProgress />

          {/* ── Page heading ─────────────────────────────────────── */}
          <Text style={s.subtitle}>
            Please check your details and credentials before submitting
          </Text>

          {/* ── Summary card ─────────────────────────────────────── */}
          <View style={s.card}>
            <SummaryRow
              icon={<CarIcon />}
              iconColor="orange"
              label="Driver type"
              value={driverTypeLabel}
            />
            <SummaryRow
              icon={<DocReadyIcon />}
              iconColor="green"
              label="Documents"
              value="6 of 6 ready"
              valueColor={GREEN}
              onPress={() => setDocModalVisible(true)}
            />
            <SummaryRow
              icon={<ShieldCheckIcon />}
              iconColor="blue"
              label="Verification"
              value="Email verified"
              valueColor={GREEN}
            />
            <SummaryRow
              icon={<MailIcon />}
              iconColor="orange"
              label="Email"
              value={data?.email ?? "—"}
            />
            <SummaryRow
              icon={<PhoneIcon />}
              iconColor="indigo"
              label="Phone number"
              value={data?.phone ?? "—"}
            />
            <SummaryRow
              icon={<PinIcon />}
              iconColor="teal"
              label="Postal code"
              value={data?.postal_code ?? "—"}
            />
            {isOwnCar && vehicleLabel && (
              <SummaryRow
                icon={<VehicleIcon />}
                iconColor="amber"
                label="Vehicle details"
                value={vehicleLabel}
              />
            )}
            <SummaryRow
              icon={<CalendarIcon />}
              iconColor="slate"
              label="Submitted on"
              value={submittedAt}
              isLast
            />
          </View>

          {/* ── Info banner ──────────────────────────────────────── */}
          <View style={s.infoBanner}>
            <View style={s.infoIconCircle}>
              <Text style={s.infoIconText}>i</Text>
            </View>
            <Text style={s.infoText}>
              After you confirm, our admin team will review your documents and
              credentials. You will be notified once your account is approved.
            </Text>
          </View>
        </ScrollView>

        {/* ── Footer button ────────────────────────────────────────── */}
        <View style={s.footer}>
          {submitError ? (
            <Text style={s.errorText}>{submitError}</Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              s.confirmBtn,
              isSubmitting && s.confirmBtnDisabled,
              pressed && !isSubmitting && { opacity: 0.88 },
            ]}
            onPress={handleConfirmSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <SendIcon />
                <Text style={s.confirmBtnText}>Confirm and submit</Text>
              </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>

      <DocumentReviewModal
        visible={docModalVisible}
        onClose={() => setDocModalVisible(false)}
      />

      <SuccessModal
        visible={showSuccessModal}
        onGotIt={() => {
          setShowSuccessModal(false);
          registrationStore.clear();
          router.replace("/login?registered=1" as any);
        }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },

  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(1,80,181,0.09)",
    borderWidth: 1,
    borderColor: "rgba(1,80,181,0.28)",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(1,80,181,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(96,165,250,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  infoIconText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#60A5FA",
    lineHeight: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.60)",
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#FCA5A5",
    lineHeight: 18,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
