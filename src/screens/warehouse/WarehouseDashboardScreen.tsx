import {
  fetchWarehouseAvailableDrivers,
  fetchWarehouseZipCodes,
  updateDriverAvailability,
  type DriverAvailabilityStatus,
  type WarehouseAvailableDriver,
  type WarehouseZipCodeItem,
  type WarehouseZipCodeStatus,
} from "@/api/backendClient";
import type { WarehouseTab } from "@/components/warehouse/WarehouseBottomTabs";
import { images } from "@/constants/images";
import { sessionStore } from "@/store/sessionStore";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const WAREHOUSE = {
  name: "Hamburg Main Warehouse",
  status: "Active",
  id: "WH-2026-001",
  staff: "Warehouse User",
  location: "Billstraße 45, 20539 Hamburg",
};

const WAREHOUSE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Billstraße%2045%2C%2020539%20Hamburg%2C%20Germany";

const OVERVIEW = {
  returnsYesterday: "1,200",
};

function formatPacketCount(value: number | null | undefined): string {
  const safeValue = value ?? 0;
  return safeValue.toLocaleString("en-US");
}

function getRemainingPackets(item: WarehouseZipCodeItem): number {
  return item.remaining_packets ?? item.packet_count;
}

const DRIVER_AVATAR_COLORS: { color: string; bg: string }[] = [
  { color: ORANGE, bg: "rgba(255,101,0,0.15)" },
  { color: BLUE, bg: "rgba(59,130,246,0.15)" },
  { color: GREEN, bg: "rgba(34,197,94,0.15)" },
];

function getInitials(fullName?: string) {
  if (!fullName) return "DR";
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DR"
  );
}

function getZipStatusColor(status: WarehouseZipCodeStatus | string): string {
  switch (status) {
    case "validated":
      return GREEN;
    case "in_progress":
      return ORANGE;
    default:
      return MUTED;
  }
}

const RETURNS: {
  name: string;
  packets: number;
  status: "signature" | "confirmed";
  label: string;
}[] = [
  { name: "Aymouna Gmar", packets: 5, status: "signature", label: "Signature required" },
  { name: "Ahmed Driver", packets: 3, status: "confirmed", label: "Confirmed" },
];

const DOCUMENTS_SUMMARY = { total: 4, approved: 3, pending: 1 };

// ─── SVG icons ────────────────────────────────────────────────────────────────
function ChevronRight({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PersonIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PinIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ size = 22, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshIcon({ size = 22, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 12, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhoneIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── small building blocks ───────────────────────────────────────────────────
function InfoItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.infoIconChip}>{icon}</View>
      <View style={styles.infoTextGroup}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.infoItem,
          pressed && styles.infoItemPressed,
        ]}
        onPress={onPress}
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.infoItem}>{content}</View>;
}

function WarehouseIconBadge() {
  return (
    <View style={styles.warehouseIconBadge}>
      <Svg width="100%" height="100%" viewBox="0 0 110 110">
        <Circle cx={55} cy={55} r={52} stroke="rgba(255,101,0,0.18)" strokeWidth={1.5} />
        <Circle cx={55} cy={55} r={40} stroke="rgba(255,101,0,0.4)" strokeWidth={1.5} />
        <Circle cx={55} cy={4} r={3} fill={ORANGE} />
        <Circle cx={106} cy={55} r={3} fill={ORANGE} />
        <Circle cx={55} cy={106} r={3} fill={ORANGE} />
        <Circle cx={4} cy={55} r={3} fill={ORANGE} />
      </Svg>
      <Image
        source={images.warehouseMainIcon}
        style={styles.warehouseIconImg}
        resizeMode="contain"
      />
    </View>
  );
}

function OverviewCard({
  iconBg,
  icon,
  label,
  value,
  subtitle,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewSubtitle}>{subtitle}</Text>
    </View>
  );
}

function DriverAvatar({
  imageUrl,
  fullName,
  color,
  bg,
  size = 42,
}: {
  imageUrl: string | null;
  fullName: string;
  color: string;
  bg: string;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.driverAvatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.driverInitials, { color, fontSize: size * 0.32 }]}>
        {getInitials(fullName)}
      </Text>
    </View>
  );
}

function DriverRow({
  driver,
  color,
  bg,
  isLast,
  onPress,
}: {
  driver: WarehouseAvailableDriver;
  color: string;
  bg: string;
  isLast: boolean;
  onPress: () => void;
}) {
  const availability = getAvailabilityBadge(driver.availability_status);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.driverRow,
        !isLast && styles.rowDivider,
        pressed && styles.infoItemPressed,
      ]}
      onPress={onPress}
    >
      <DriverAvatar
        imageUrl={driver.profile_image_url}
        fullName={driver.full_name}
        color={color}
        bg={bg}
      />
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driver.full_name}</Text>
        <Text style={styles.driverMeta}>
          Home ZIP {driver.postal_code ?? "—"} · {driver.driver_type_label}
        </Text>
      </View>
      <View style={[styles.readyBadge, { backgroundColor: availability.bg }]}>
        <Text style={[styles.readyBadgeText, { color: availability.color }]}>
          {driver.availability_label}
        </Text>
      </View>
      <ChevronRight size={16} color={ORANGE} />
    </Pressable>
  );
}

function ZipCard({
  zip,
  packets,
  status,
}: {
  zip: string;
  packets: number;
  status: WarehouseZipCodeStatus;
}) {
  return (
    <View style={styles.zipCard}>
      <View style={styles.zipDotRow}>
        <View style={[styles.zipDot, { backgroundColor: getZipStatusColor(status) }]} />
        <Text style={styles.zipNumber}>{zip}</Text>
      </View>
      <Text style={styles.zipPackets}>{formatPacketCount(packets)} packets</Text>
    </View>
  );
}

function ReturnRow({
  item,
  isLast,
}: {
  item: (typeof RETURNS)[number];
  isLast: boolean;
}) {
  const isSignature = item.status === "signature";
  const statusColor = isSignature ? AMBER : GREEN;
  return (
    <View style={[styles.returnRow, !isLast && styles.rowDivider]}>
      <View style={styles.returnAvatar}>
        <PersonIcon size={16} color={ORANGE} />
      </View>
      <View style={styles.returnInfo}>
        <Text style={styles.returnName}>{item.name}</Text>
        <Text style={styles.returnMeta}>
          Returned: <Text style={styles.returnMetaValue}>{item.packets} packets</Text>
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: isSignature ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)" }]}>
        {isSignature ? <ClockIcon color={statusColor} /> : <CheckCircleIcon color={statusColor} />}
        <Text style={[styles.statusPillText, { color: statusColor }]}>{item.label}</Text>
      </View>
    </View>
  );
}

function getAvailabilityBadge(status?: string) {
  if (status === "not_ready") {
    return { label: "Not Ready", color: ORANGE, bg: "rgba(255,101,0,0.15)" };
  }
  return { label: "Ready", color: GREEN, bg: "rgba(34,197,94,0.15)" };
}

function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function handleCallDriver(fullName: string, phone: string | null) {
  if (!phone) {
    Alert.alert("Phone number is not available.");
    return;
  }
  Alert.alert("Call Driver?", `Do you want to call ${fullName} at ${phone}?`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Call",
      onPress: () => {
        Linking.openURL(`tel:${phone}`).catch(() => {
          Alert.alert("Unable to open phone app.");
        });
      },
    },
  ]);
}

function handleSendSms(fullName: string, phone: string) {
  const body = encodeURIComponent(`Hello ${fullName}, this is GXS Warehouse.`);
  Linking.openURL(`sms:${phone}?body=${body}`).catch(() => {
    Alert.alert("Unable to open messages.");
  });
}

function handleSendWhatsApp(fullName: string, phone: string) {
  const whatsappPhone = normalizePhoneForWhatsApp(phone);
  const text = encodeURIComponent(`Hello ${fullName}, this is GXS Warehouse.`);
  const appUrl = `whatsapp://send?phone=${whatsappPhone}&text=${text}`;
  const webUrl = `https://wa.me/${whatsappPhone}?text=${text}`;

  Linking.openURL(appUrl).catch(() => {
    Linking.openURL(webUrl).catch(() => {
      Alert.alert("Unable to open WhatsApp.");
    });
  });
}

function handleMessageDriver(fullName: string, phone: string | null) {
  if (!phone) {
    Alert.alert("Phone number is not available.");
    return;
  }
  Alert.alert("Send Message", undefined, [
    { text: "SMS Message", onPress: () => handleSendSms(fullName, phone) },
    { text: "WhatsApp", onPress: () => handleSendWhatsApp(fullName, phone) },
    { text: "Cancel", style: "cancel" },
  ]);
}

function DriverDetailsModal({
  driver,
  color,
  bg,
  onClose,
  onSetReady,
  onSetNotReady,
  savingStatus,
}: {
  driver: WarehouseAvailableDriver | null;
  color: string;
  bg: string;
  onClose: () => void;
  onSetReady: () => void;
  onSetNotReady: () => void;
  savingStatus: DriverAvailabilityStatus | null;
}) {
  const visible = !!driver;
  const availability = getAvailabilityBadge(driver?.availability_status);
  const isSaving = savingStatus !== null;

  const handleCall = () => {
    if (!driver) return;
    handleCallDriver(driver.full_name, driver.phone);
  };

  const handleMessage = () => {
    if (!driver) return;
    handleMessageDriver(driver.full_name, driver.phone);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Pressable style={styles.modalCloseBtn} onPress={onClose} hitSlop={8}>
            <CloseIcon size={18} color={WHITE} />
          </Pressable>

          {driver && (
            <>
              <View style={styles.modalTopSection}>
                <View style={styles.avatarRing}>
                  <DriverAvatar
                    imageUrl={driver.profile_image_url}
                    fullName={driver.full_name}
                    color={color}
                    bg={bg}
                    size={92}
                  />
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.modalDriverId}>
                  Driver ID: {driver.external_driver_id ?? "—"}
                </Text>
                <View style={[styles.modalAvailabilityBadge, { backgroundColor: availability.bg }]}>
                  <CheckCircleIcon size={13} color={availability.color} />
                  <Text style={[styles.modalAvailabilityText, { color: availability.color }]}>
                    {availability.label}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.modalActionBtnBlue, pressed && styles.infoItemPressed]}
                  onPress={handleCall}
                >
                  <PhoneIcon size={15} color={BLUE} />
                  <Text style={[styles.modalActionText, { color: BLUE }]}>Call</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.modalActionBtnBlue, pressed && styles.infoItemPressed]}
                  onPress={handleMessage}
                >
                  <ChatIcon size={15} color={BLUE} />
                  <Text style={[styles.modalActionText, { color: BLUE }]}>Message</Text>
                </Pressable>
              </View>
              <View style={[styles.modalActionsRow, { marginBottom: 0 }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalActionBtnOutlineGreen,
                    pressed && styles.infoItemPressed,
                    isSaving && styles.modalActionBtnDisabled,
                  ]}
                  onPress={onSetReady}
                  disabled={isSaving}
                >
                  {savingStatus === "ready" ? (
                    <ActivityIndicator size="small" color={GREEN} />
                  ) : (
                    <CheckCircleIcon size={15} color={GREEN} />
                  )}
                  <Text style={[styles.modalActionText, { color: GREEN }]}>Ready</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalActionBtnOutlineRed,
                    pressed && styles.infoItemPressed,
                    isSaving && styles.modalActionBtnDisabled,
                  ]}
                  onPress={onSetNotReady}
                  disabled={isSaving}
                >
                  {savingStatus === "not_ready" ? (
                    <ActivityIndicator size="small" color={RED} />
                  ) : (
                    <ClockIcon size={15} color={RED} />
                  )}
                  <Text style={[styles.modalActionText, { color: RED }]}>Not Ready</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── props ────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate?: (tab: WarehouseTab) => void;
}

export default function WarehouseDashboardScreen({ onNavigate }: Props) {
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [drivers, setDrivers] = useState<WarehouseAvailableDriver[] | null>(null);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [totalPackets, setTotalPackets] = useState<number | null>(null);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<WarehouseAvailableDriver | null>(null);
  const [selectedDriverColor, setSelectedDriverColor] = useState<{ color: string; bg: string }>(
    DRIVER_AVATAR_COLORS[0]
  );
  const [availabilitySaving, setAvailabilitySaving] = useState<DriverAvailabilityStatus | null>(
    null
  );
  const [zipCodes, setZipCodes] = useState<WarehouseZipCodeItem[] | null>(null);
  const [zipCodesLoading, setZipCodesLoading] = useState(true);
  const [zipCodesError, setZipCodesError] = useState<string | null>(null);

  const fetchAvailableDrivers = (accessToken: string) => {
    fetchWarehouseAvailableDrivers(accessToken)
      .then((data) => {
        setDrivers(data.drivers);
        const fallbackCount = data.drivers.filter(
          (driver) => driver.availability_status !== "not_ready"
        ).length;
        setAvailableCount(data.summary?.available_drivers ?? fallbackCount);
        setTotalPackets(data.summary?.total_packets ?? 0);
        setDriversLoading(false);
      })
      .catch(() => {
        setDriversError("Unable to load available drivers.");
        setDriversLoading(false);
      });
  };

  const fetchZipCodesToday = (accessToken: string) => {
    fetchWarehouseZipCodes(accessToken)
      .then((data) => {
        setZipCodes(data.zip_codes);
        setZipCodesLoading(false);
      })
      .catch(() => {
        setZipCodesError("Unable to load ZIP codes.");
        setZipCodesLoading(false);
      });
  };

  useEffect(() => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    fetchAvailableDrivers(session.access_token);
    fetchZipCodesToday(session.access_token);
  }, []);

  const handleRetryDrivers = () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    setDriversLoading(true);
    setDriversError(null);
    fetchAvailableDrivers(session.access_token);
  };

  const handleRetryZipCodes = () => {
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;
    setZipCodesLoading(true);
    setZipCodesError(null);
    fetchZipCodesToday(session.access_token);
  };

  const applyAvailabilityUpdate = (
    driverAuthUserId: string,
    status: DriverAvailabilityStatus,
    label: string
  ) => {
    setDrivers((prev) =>
      prev
        ? prev.map((d) =>
            d.auth_user_id === driverAuthUserId
              ? { ...d, availability_status: status, availability_label: label }
              : d
          )
        : prev
    );
    setSelectedDriver((prev) =>
      prev && prev.auth_user_id === driverAuthUserId
        ? { ...prev, availability_status: status, availability_label: label }
        : prev
    );
  };

  const handleUpdateAvailability = (status: DriverAvailabilityStatus) => {
    if (!selectedDriver) return;
    const session = sessionStore.get();
    if (session?.kind !== "warehouse") return;

    const driverAuthUserId = selectedDriver.auth_user_id;
    const previousStatus = selectedDriver.availability_status;
    setAvailabilitySaving(status);
    updateDriverAvailability(session.access_token, driverAuthUserId, status)
      .then((result) => {
        applyAvailabilityUpdate(driverAuthUserId, result.status, result.label);
        if (result.status !== previousStatus) {
          setAvailableCount((prev) =>
            prev === null ? prev : prev + (result.status === "ready" ? 1 : -1)
          );
        }
        Alert.alert(
          status === "ready" ? "Driver marked as Ready." : "Driver marked as Not Ready."
        );
      })
      .catch((err) => {
        Alert.alert(
          err instanceof Error ? err.message : "Unable to update driver status. Please try again."
        );
      })
      .finally(() => {
        setAvailabilitySaving(null);
      });
  };

  const handleSetReady = () => {
    Alert.alert(
      "Set driver as Ready?",
      "This driver will appear as ready for today’s warehouse work.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Set Ready", onPress: () => handleUpdateAvailability("ready") },
      ]
    );
  };

  const handleSetNotReady = () => {
    Alert.alert(
      "Set driver as Not Ready?",
      "This driver will not be used for today’s assignments unless changed back to Ready.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Set Not Ready", onPress: () => handleUpdateAvailability("not_ready") },
      ]
    );
  };

  const handleOpenLocation = () => {
    Alert.alert(
      "Open Warehouse Location?",
      "Do you want to open Hamburg Main Warehouse in GPS?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open GPS",
          onPress: () => {
            Linking.openURL(WAREHOUSE_MAPS_URL).catch(() => {
              Alert.alert("Unable to open maps.");
            });
          },
        },
      ]
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header ────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Warehouse</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Manage today&apos;s packet count, returns, and assignments.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Warehouse info card ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.warehouseTopRow}>
              <WarehouseIconBadge />
              <View style={styles.warehouseTitleGroup}>
                <View style={styles.warehouseTitleRow}>
                  <Text style={styles.warehouseOverviewTitle}>Warehouse Overview</Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.activeBadgeText}>{WAREHOUSE.status}</Text>
                  </View>
                </View>
                <Text style={styles.warehouseSubtitle}>{WAREHOUSE.name}</Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <InfoItem icon={<ClipboardIcon />} label="Warehouse ID" value={WAREHOUSE.id} />
              <InfoItem
                icon={<PinIcon />}
                label="Location"
                value={WAREHOUSE.location}
                onPress={handleOpenLocation}
              />
              <InfoItem icon={<PersonIcon />} label="Staff" value={WAREHOUSE.staff} />
              <InfoItem icon={<CalendarIcon />} label="Today" value={todayLabel} />
            </View>
          </View>

          {/* ── Today Overview ───────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Today Overview</Text>
          <View style={styles.overviewRow}>
            <OverviewCard
              iconBg="rgba(59,130,246,0.15)"
              icon={<PinIcon size={20} color={BLUE} />}
              label="Drivers available"
              value={driversLoading ? "—" : String(availableCount ?? 0)}
              subtitle="Today"
            />
            <OverviewCard
              iconBg="rgba(34,197,94,0.15)"
              icon={<BoxIcon size={20} color={GREEN} />}
              label="Total Packets"
              value={driversLoading ? "—" : formatPacketCount(totalPackets)}
              subtitle="Validated today"
            />
            <OverviewCard
              iconBg="rgba(255,101,0,0.15)"
              icon={<RefreshIcon size={20} color={ORANGE} />}
              label="Return yesterday"
              value={OVERVIEW.returnsYesterday}
              subtitle="From yesterday"
            />
          </View>

          {/* ── Drivers available ────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Drivers available</Text>
          <View style={styles.card}>
            {driversLoading ? (
              <View style={styles.driversStateBox}>
                <ActivityIndicator size="small" color={ORANGE} />
                <Text style={styles.driversStateText}>Loading available drivers...</Text>
              </View>
            ) : driversError ? (
              <View style={styles.driversStateBox}>
                <Text style={styles.driversStateText}>{driversError}</Text>
                <Pressable style={styles.retryBtn} onPress={handleRetryDrivers}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : !drivers || drivers.length === 0 ? (
              <View style={styles.driversStateBox}>
                <Text style={styles.driversStateText}>No available drivers found.</Text>
                <Text style={styles.driversStateSubtitle}>Approved drivers will appear here.</Text>
              </View>
            ) : (
              drivers.map((driver, i, arr) => {
                const palette = DRIVER_AVATAR_COLORS[i % DRIVER_AVATAR_COLORS.length];
                return (
                  <DriverRow
                    key={driver.id}
                    driver={driver}
                    color={palette.color}
                    bg={palette.bg}
                    isLast={i === arr.length - 1}
                    onPress={() => {
                      setSelectedDriver(driver);
                      setSelectedDriverColor(palette);
                    }}
                  />
                );
              })
            )}
          </View>

          {/* ── ZIP Codes Available Today ────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>ZIP Codes Available Today</Text>
            <Pressable
              style={styles.outlinePill}
              onPress={() => onNavigate?.("zipCount")}
              hitSlop={6}
            >
              <Text style={styles.outlinePillText}>View all</Text>
              <ChevronRight size={13} color={ORANGE} />
            </Pressable>
          </View>
          {zipCodesLoading ? (
            <View style={[styles.card, styles.driversStateBox]}>
              <ActivityIndicator size="small" color={ORANGE} />
              <Text style={styles.driversStateText}>Loading ZIP codes...</Text>
            </View>
          ) : zipCodesError ? (
            <View style={[styles.card, styles.driversStateBox]}>
              <Text style={styles.driversStateText}>{zipCodesError}</Text>
              <Pressable style={styles.retryBtn} onPress={handleRetryZipCodes}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : !zipCodes || zipCodes.filter((z) => getRemainingPackets(z) > 0).length === 0 ? (
            <View style={[styles.card, styles.driversStateBox]}>
              <Text style={styles.driversStateText}>No ZIP codes available today.</Text>
            </View>
          ) : (
            <View style={styles.zipGrid}>
              {zipCodes
                .filter((z) => getRemainingPackets(z) > 0)
                .map((z) => (
                  <ZipCard
                    key={z.id}
                    zip={z.zip_code}
                    packets={getRemainingPackets(z)}
                    status={z.status}
                  />
                ))}
            </View>
          )}

          {/* ── Returned Packets ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Returned Packets</Text>
          <View style={styles.card}>
            <View style={styles.returnsHeaderRow}>
              <View style={styles.returnsHeaderIcon}>
                <RefreshIcon size={16} color={RED} />
              </View>
              <Text style={styles.returnsHeaderText}>Returns waiting for validation</Text>
            </View>
            {RETURNS.map((item, i) => (
              <ReturnRow key={item.name} item={item} isLast={i === RETURNS.length - 1} />
            ))}
            <Pressable
              style={styles.openReturnsBtn}
              onPress={() => onNavigate?.("returns")}
            >
              <Text style={styles.outlinePillText}>Open Returns</Text>
              <ChevronRight size={14} color={ORANGE} />
            </Pressable>
          </View>

          {/* ── Warehouse Documents ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.docsHeaderRow}>
              <DocumentIcon />
              <Text style={styles.docsTitle}>Warehouse Documents</Text>
            </View>
            <Text style={styles.docsText}>
              View your warehouse documents and review status.
            </Text>
            <View style={styles.docsFooterRow}>
              <Text style={styles.docsStatus}>
                Documents: {DOCUMENTS_SUMMARY.total} total ·{" "}
                <Text style={{ color: GREEN }}>{DOCUMENTS_SUMMARY.approved} approved</Text> ·{" "}
                <Text style={{ color: AMBER }}>{DOCUMENTS_SUMMARY.pending} pending</Text>
              </Text>
              <Pressable
                style={styles.outlinePill}
                onPress={() => onNavigate?.("documents")}
              >
                <Text style={styles.outlinePillText}>View Documents</Text>
                <ChevronRight size={13} color={ORANGE} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <DriverDetailsModal
        driver={selectedDriver}
        color={selectedDriverColor.color}
        bg={selectedDriverColor.bg}
        onClose={() => setSelectedDriver(null)}
        onSetReady={handleSetReady}
        onSetNotReady={handleSetNotReady}
        savingStatus={availabilitySaving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },

  // ── Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
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
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    marginTop: 4,
    lineHeight: 17,
  },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: ORANGE,
  },
  avatarDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: BG,
  },

  // ── Card base
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  outlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlinePillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },

  // ── Warehouse info card
  warehouseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  warehouseIconBadge: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  warehouseIconImg: {
    position: "absolute",
    width: 38,
    height: 38,
  },
  warehouseTitleGroup: { flex: 1, gap: 4 },
  warehouseTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  warehouseOverviewTitle: {
    flexShrink: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  warehouseSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    marginBottom: 8,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREEN,
  },
  activeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: GREEN,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
  },
  infoItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 10,
  },
  infoItemPressed: {
    opacity: 0.7,
  },
  infoIconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTextGroup: { flex: 1 },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },
  infoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    marginTop: 1,
  },

  // ── Today overview
  overviewRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 4,
  },
  overviewIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  overviewLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: DIM,
  },
  overviewValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  overviewSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9.5,
    color: MUTED,
  },

  // ── Drivers available
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  driverInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  driverMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  readyBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: GREEN,
  },
  driversStateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  driversStateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: DIM,
    textAlign: "center",
  },
  driversStateSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: MUTED,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },

  // ── ZIP cards
  zipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 18,
  },
  zipCard: {
    width: "31%",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  zipDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ORANGE,
  },
  zipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  zipPackets: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },

  // ── Returned packets
  returnsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  returnsHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  returnsHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  returnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  returnAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,101,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  returnInfo: { flex: 1 },
  returnName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  returnMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
    marginTop: 2,
  },
  returnMetaValue: {
    color: WHITE,
    fontFamily: "Poppins_500Medium",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },
  openReturnsBtn: {
    flexDirection: "row",
    alignSelf: "flex-end",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },

  // ── Warehouse documents
  docsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  docsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },
  docsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
    marginBottom: 12,
  },
  docsFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  docsStatus: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 11.5,
    color: DIM,
    flexShrink: 1,
  },

  // ── Driver Details modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  modalTopSection: {
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    marginBottom: 22,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    borderWidth: 3,
    borderColor: CARD,
  },
  modalDriverId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    marginTop: 10,
  },
  modalAvailabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  modalAvailabilityText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  modalActionBtnBlue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
    borderRadius: 12,
    paddingVertical: 13,
  },
  modalActionBtnOutlineGreen: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "transparent",
    borderWidth: 1.3,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 13,
  },
  modalActionBtnOutlineRed: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "transparent",
    borderWidth: 1.3,
    borderColor: RED,
    borderRadius: 12,
    paddingVertical: 13,
  },
  modalActionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  modalActionBtnDisabled: {
    opacity: 0.5,
  },
});
