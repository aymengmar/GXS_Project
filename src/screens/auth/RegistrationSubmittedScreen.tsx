import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#080D1A";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const GREEN_DIM = "rgba(34,197,94,0.18)";
const GREEN_BORDER = "rgba(34,197,94,0.45)";

// ─── Confetti dots ────────────────────────────────────────────────────────────

const CONFETTI: Array<{
  top: number;
  left?: number;
  right?: number;
  size: number;
  color: string;
  rotate?: number;
  borderRadius?: number;
}> = [
  { top: 4, left: 22, size: 7, color: "#FF6500" },
  { top: 10, left: 50, size: 5, color: "#22C55E" },
  { top: 0, left: 80, size: 6, color: "#FACC15" },
  { top: 20, left: 12, size: 4, color: "#FACC15", rotate: 30 },
  { top: 30, left: 38, size: 4, color: "#FF6500", borderRadius: 1 },
  { top: 2, right: 22, size: 7, color: "#FACC15" },
  { top: 12, right: 48, size: 5, color: "#FF6500" },
  { top: 0, right: 78, size: 6, color: "#22C55E" },
  { top: 22, right: 14, size: 4, color: "#22C55E", rotate: -25 },
  { top: 32, right: 36, size: 4, color: "#FACC15", borderRadius: 1 },
  { top: 60, left: 8, size: 5, color: "#22C55E" },
  { top: 60, right: 10, size: 5, color: "#FF6500" },
];

function Confetti() {
  return (
    <>
      {CONFETTI.map((c, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            ...(c.left !== undefined ? { left: c.left } : {}),
            ...(c.right !== undefined ? { right: c.right } : {}),
            width: c.size,
            height: c.size,
            borderRadius: c.borderRadius ?? c.size / 2,
            backgroundColor: c.color,
            opacity: 0.85,
            transform: c.rotate ? [{ rotate: `${c.rotate}deg` }] : [],
          }}
        />
      ))}
    </>
  );
}

// ─── Big checkmark circle ─────────────────────────────────────────────────────

function SuccessCircle() {
  return (
    <View style={hero.outerRing}>
      <View style={hero.innerCircle}>
        {/* Checkmark */}
        <View style={hero.checkWrap}>
          <View style={hero.checkLong} />
          <View style={hero.checkShort} />
        </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  outerRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 2,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34,197,94,0.22)",
    borderWidth: 2,
    borderColor: "rgba(34,197,94,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrap: {
    width: 38,
    height: 28,
    position: "relative",
  },
  checkLong: {
    position: "absolute",
    bottom: 4,
    left: 0,
    width: 36,
    height: 4,
    backgroundColor: GREEN,
    borderRadius: 2,
    transform: [{ rotate: "-45deg" }, { translateX: -4 }, { translateY: 10 }],
  },
  checkShort: {
    position: "absolute",
    bottom: 4,
    left: 0,
    width: 18,
    height: 4,
    backgroundColor: GREEN,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }, { translateX: -2 }, { translateY: 16 }],
  },
});

// ─── Back arrow ───────────────────────────────────────────────────────────────

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

// ─── Inline icons ─────────────────────────────────────────────────────────────

function CarIcon() {
  return (
    <View style={{ width: 20, height: 16 }}>
      <View
        style={{
          position: "absolute",
          top: 4,
          left: 0,
          right: 0,
          height: 10,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.15)",
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          right: 4,
          height: 6,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      {[2, 14].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            bottom: -2,
            left,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "rgba(255,255,255,0.5)",
          }}
        />
      ))}
    </View>
  );
}

function DocIcon() {
  return (
    <View style={{ width: 16, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: "rgba(255,255,255,0.35)",
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
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      {[7, 11, 15].map((top) => (
        <View
          key={top}
          style={{
            position: "absolute",
            top,
            left: 3,
            right: 3,
            height: 1.5,
            backgroundColor: "rgba(255,255,255,0.35)",
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function ShieldIcon() {
  return (
    <View style={{ width: 16, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 12,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          bottom: 0,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          borderWidth: 1.5,
          borderTopWidth: 0,
          borderColor: "rgba(255,255,255,0.35)",
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
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 7,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -2,
            left: -2,
            right: -2,
            height: 9,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            borderWidth: 1.5,
            borderColor: "transparent",
          }}
        />
        {/* V chevron for envelope flap */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 7,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            position: "absolute",
            top: 0,
            left: 2,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderTopWidth: 6,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: "rgba(255,255,255,0.35)",
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            position: "absolute",
            top: 0,
            right: 2,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderTopWidth: 6,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: "rgba(255,255,255,0.35)",
          }}
        />
      </View>
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
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: "rgba(255,255,255,0.35)",
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
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />
      {[4, 10].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            top: 0,
            left,
            width: 2.5,
            height: 6,
            backgroundColor: "rgba(255,255,255,0.35)",
            borderRadius: 1.5,
          }}
        />
      ))}
      {[11, 14].map((top) =>
        [4, 9, 14].map((left) => (
          <View
            key={`${top}-${left}`}
            style={{
              position: "absolute",
              top,
              left,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.35)",
            }}
          />
        ))
      )}
    </View>
  );
}

function ChevronRight() {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: "rgba(255,255,255,0.25)",
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function LoginIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      {/* Door frame */}
      <View
        style={{
          position: "absolute",
          top: 1,
          left: 1,
          bottom: 1,
          width: 13,
          borderWidth: 2,
          borderRadius: 3,
          borderColor: "#fff",
        }}
      />
      {/* Arrow pointing right into the door */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 7,
          width: 10,
          height: 2,
          backgroundColor: "#fff",
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 4,
          width: 0,
          height: 0,
          borderTopWidth: 4,
          borderBottomWidth: 4,
          borderLeftWidth: 5,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: "#fff",
        }}
      />
    </View>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────

type SummaryRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
};

function SummaryRow({ icon, label, value, valueColor, isLast }: SummaryRowProps) {
  return (
    <View style={[row.wrap, !isLast && row.border]}>
      <View style={row.iconBox}>{icon}</View>
      <Text style={row.label}>{label}</Text>
      <View style={row.right}>
        <Text style={[row.value, valueColor ? { color: valueColor } : undefined]} numberOfLines={1}>
          {value}
        </Text>
        <ChevronRight />
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 10,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
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
    maxWidth: "55%",
  },
  value: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
    textAlign: "right",
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = {
  driverType?: "own-car" | "company-car";
  documentsUploaded?: number;
  totalDocuments?: number;
  email?: string;
  submittedAt?: string;
};

export default function RegistrationSubmittedScreen({
  driverType = "company-car",
  documentsUploaded = 4,
  totalDocuments = 4,
  email = "john.doe@email.com",
  submittedAt = "25 Jun 2026, 09:41 AM",
}: Props) {
  const router = useRouter();

  const driverTypeLabel =
    driverType === "own-car" ? "Own car driver" : "Company car driver";

  const docsLabel = `${documentsUploaded} of ${totalDocuments} uploaded`;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <BackArrow />
          </Pressable>
          <View style={s.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────────── */}
          <View style={s.heroWrap}>
            <Confetti />
            <SuccessCircle />
          </View>

          <Text style={s.title}>Registration submitted!</Text>

          {/* "You are almost there" tag */}
          <View style={s.tagRow}>
            <Text style={s.tagStar}>✦</Text>
            <Text style={s.tagText}> You are almost there. </Text>
            <Text style={s.tagStar}>✦</Text>
          </View>

          <Text style={s.body}>
            We've received your documents and credentials. Our team will review
            them and get back to you soon via email and in-app notification.
          </Text>

          {/* ── Registration summary ─────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Registration summary</Text>
            <View style={s.pendingBadge}>
              <View style={s.pendingDot} />
              <Text style={s.pendingText}>Pending review</Text>
            </View>
          </View>

          <View style={s.card}>
            <SummaryRow
              icon={<CarIcon />}
              label="Driver type"
              value={driverTypeLabel}
            />
            <SummaryRow
              icon={<DocIcon />}
              label="Documents"
              value={docsLabel}
              valueColor={GREEN}
            />
            <SummaryRow
              icon={<ShieldIcon />}
              label="Verification"
              value="Pending review"
              valueColor={ORANGE}
            />
            <SummaryRow
              icon={<MailIcon />}
              label="Email"
              value={email}
            />
            <SummaryRow
              icon={<CalendarIcon />}
              label="Submitted on"
              value={submittedAt}
              isLast
            />
          </View>

          {/* ── What happens next ─────────────────────────────────────── */}
          <View style={s.nextCard}>
            <View style={s.nextLeft}>
              <View style={s.nextIconCircle}>
                <Text style={s.nextIconText}>i</Text>
              </View>
              <View style={s.nextTextCol}>
                <Text style={s.nextTitle}>What happens next?</Text>
                <Text style={s.nextBody}>
                  Our admin team will review your documents.{"\n"}You will be
                  notified once your account is approved.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Go to login button ──────────────────────────────────────── */}
        <View style={s.footer}>
          <Pressable
            style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.88 }]}
            onPress={() => router.replace("/login")}
          >
            <LoginIcon />
            <Text style={s.loginBtnText}>Go to login</Text>
          </Pressable>
        </View>
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
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerRight: { flex: 1 },

  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },

  // Hero
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginBottom: 8,
  },

  // Title
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },

  // Tag row
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  tagStar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FACC15",
  },
  tagText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FACC15",
  },

  // Body
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.30)",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    gap: 5,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },
  pendingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: ORANGE,
  },

  // Summary card
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  // What happens next card
  nextCard: {
    backgroundColor: "rgba(1,80,181,0.10)",
    borderWidth: 1,
    borderColor: "rgba(1,80,181,0.30)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  nextLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  nextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(1,80,181,0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(1,80,181,0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nextIconText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#60A5FA",
    lineHeight: 18,
  },
  nextTextCol: { flex: 1 },
  nextTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  nextBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  loginBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loginBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
