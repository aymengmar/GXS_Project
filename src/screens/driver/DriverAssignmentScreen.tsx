import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import { images } from "@/constants/images";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.35)";

// ─── mock data ─────────────────────────────────────────────────────────────────
const ASSIGNMENT = {
  warehouse: "Hamburg Main Warehouse",
  address: "Billstraße 45, 20539 Hamburg",
  date: "May 20, 2025",
  startTime: "08:30 AM",
  zip: "22111",
  phone: "+49 123 456 7890",
  email: "warehouse@gxs-delivery.com",
};

// ─── SVG icons ─────────────────────────────────────────────────────────────────
function PersonIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={WHITE}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={WHITE} strokeWidth={1.8} />
    </Svg>
  );
}

function CalendarIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 15.5l1.5 1.5 3.5-3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PhoneIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NotesIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── props ─────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

// ─── main component ────────────────────────────────────────────────────────────
export default function DriverAssignmentScreen({ onNavigate: _onNavigate }: Props) {
  function handleContactWarehouse() {
    Alert.alert("Contact Warehouse", `Phone: ${ASSIGNMENT.phone}\nEmail: ${ASSIGNMENT.email}`);
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>Today's plan</Text>
              <Text style={styles.headerTitle}>Assignment</Text>
              <Text style={styles.headerSub}>Warehouse and assigned postcode area</Text>
            </View>
            <View>
              <View style={styles.profileBtn}>
                <PersonIcon />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {/* ── Today's Assignment card ────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Card header row */}
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardTitleRow, { flex: 1, marginBottom: 0 }]}>
                <CalendarIcon size={24} color={ORANGE} />
                <Text style={[styles.cardTitle, { flex: 1 }]}>Today's Assignment</Text>
              </View>
              <View style={styles.assignedBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.assignedText}>Assigned</Text>
              </View>
            </View>

            <View style={styles.assignmentBody}>
              {/* Left info */}
              <View style={styles.assignmentLeft}>
                {/* Warehouse name */}
                <View style={styles.infoRow}>
                  <WarehouseIcon size={18} color={DIM} />
                  <View>
                    <Text style={styles.infoSmallLabel}>Assigned Warehouse</Text>
                    <Text style={styles.warehouseName}>{ASSIGNMENT.warehouse}</Text>
                    <Text style={styles.warehouseAddress}>{ASSIGNMENT.address}</Text>
                  </View>
                </View>

                {/* Date + Start Time */}
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <CalendarIcon size={15} color={DIM} />
                    <View>
                      <Text style={styles.infoSmallLabel}>Date</Text>
                      <Text style={styles.infoValue}>{ASSIGNMENT.date}</Text>
                    </View>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <ClockIcon size={15} color={DIM} />
                    <View>
                      <Text style={styles.infoSmallLabel}>Start Time</Text>
                      <Text style={styles.infoValue}>{ASSIGNMENT.startTime}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Warehouse image */}
              <Image
                source={images.assignmentWarehouse}
                style={styles.warehouseImage}
                resizeMode="contain"
              />
            </View>

            {/* Instruction strip */}
            <View style={styles.instructionRow}>
              <InfoIcon size={16} color={ORANGE} />
              <Text style={styles.instructionText}>
                Go to the assigned warehouse first, then follow your assigned postcode area for today.
              </Text>
            </View>
          </View>

          {/* ── Assigned ZIP Code card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardTitleRow}>
              <MapPinIcon size={22} color={ORANGE} />
              <Text style={styles.cardTitle}>Today's Assigned ZIP Code</Text>
            </View>

            {/* ZIP + map image */}
            <View style={styles.zipBody}>
              <View style={styles.zipLeft}>
                <Text style={styles.zipNumber}>{ASSIGNMENT.zip}</Text>
                <View>
                  <Text style={styles.zipAreaLabel}>Assigned delivery postcode area</Text>
                  <Text style={styles.zipDesc}>
                    This is the postcode area assigned by the warehouse for your packets today.
                  </Text>
                </View>
              </View>
              <Image
                source={images.assignmentZipMap}
                style={styles.zipMapImage}
                resizeMode="contain"
              />
            </View>

            {/* Note */}
            <View style={styles.instructionRow}>
              <InfoIcon size={16} color={ORANGE} />
              <Text style={styles.instructionText}>
                Please confirm details with the warehouse team before starting.
              </Text>
            </View>
          </View>

          {/* ── Warehouse Contact card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <PhoneIcon size={22} color={ORANGE} />
              <Text style={styles.cardTitle}>Warehouse Contact</Text>
            </View>

            <View style={styles.contactCol}>
              {/* Phone */}
              <View style={styles.contactItem}>
                <View style={styles.contactIconBox}>
                  <PhoneIcon size={18} color={ORANGE} />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{ASSIGNMENT.phone}</Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.contactItem}>
                <View style={styles.contactIconBox}>
                  <MailIcon size={18} color={ORANGE} />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{ASSIGNMENT.email}</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.orangeBtn} onPress={handleContactWarehouse}>
              <PhoneIcon size={18} color={WHITE} />
              <Text style={styles.orangeBtnText}>Contact Warehouse</Text>
            </Pressable>
          </View>

          {/* ── Notes card ────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <NotesIcon size={22} color={ORANGE} />
              <Text style={styles.cardTitle}>Notes from Warehouse</Text>
            </View>

            <Text style={styles.notesText}>
              {"Please arrive 15 minutes before your shift starts.\nYour assigned ZIP code area for today is "}
              <Text style={styles.notesZip}>{ASSIGNMENT.zip}</Text>
              <Text style={styles.notesText}>{"."}</Text>
            </Text>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // ── Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    lineHeight: 34,
    marginTop: 2,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // ── Card title row
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ── Assigned badge
  assignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREEN,
  },
  assignedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },

  // ── Assignment body
  assignmentBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  assignmentLeft: {
    flex: 1,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoSmallLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
  },
  warehouseName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: WHITE,
    marginTop: 1,
  },
  warehouseAddress: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    marginTop: 1,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  dateTimeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  infoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    marginTop: 1,
  },
  warehouseImage: {
    width: 110,
    height: 110,
  },

  // ── Instruction row
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: INNER,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  instructionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    flex: 1,
    lineHeight: 18,
  },

  // ── ZIP card
  zipBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  zipLeft: {
    flex: 1,
    gap: 8,
  },
  zipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 44,
    color: ORANGE,
    lineHeight: 52,
  },
  zipAreaLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: WHITE,
    marginBottom: 3,
  },
  zipDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
  },
  zipMapImage: {
    width: 100,
    height: 110,
  },

  // ── Contact card
  contactCol: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,101,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
  },
  contactValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: WHITE,
    marginTop: 1,
  },
  orangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  orangeBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ── Notes card
  notesText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 22,
  },
  notesZip: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: ORANGE,
  },
});
