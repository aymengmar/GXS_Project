import {
  DriverDocumentListItem,
  DriverVehicleResponse,
  fetchDriverVehicle,
  updateDriverInsuranceExpiry,
} from "@/api/backendClient";
import type { DriverTab } from "@/components/driver/DriverBottomTabs";
import DriverDocumentPreviewModal from "@/components/driver/DriverDocumentPreviewModal";
import InsuranceExpiryDateModal from "@/components/driver/InsuranceExpiryDateModal";
import { images } from "@/constants/images";
import { sessionStore } from "@/store/sessionStore";
import { formatDaysLeftLabel, formatExpiryDate } from "@/utils/insuranceExpiry";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const AMBER = "#F59E0B";
const RED = "#EF4444";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.35)";

const NOT_PROVIDED = "Not provided";

const DRIVER_STATUS_COLOR: Record<string, string> = {
  approved: GREEN,
  pending: AMBER,
  rejected: RED,
};

const DOCUMENT_STATUS_COLOR: Record<string, string> = {
  approved: GREEN,
  pending: AMBER,
  rejected: RED,
  not_uploaded: RED,
};

const EXPIRY_STATUS_COLOR: Record<string, string> = {
  valid: GREEN,
  expiring_soon: AMBER,
  expired: RED,
  missing: MUTED,
};

function orFallback(value: string | null | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

// ─── SVG icons ─────────────────────────────────────────────────────────────────
function PersonIcon({ size = 22, color = WHITE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CarFrontIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="11" width="18" height="6" rx="1.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
      <Circle cx="16.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function IdCardIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={1.6} />
      <Circle cx="8" cy="12" r="2.2" stroke={color} strokeWidth={1.4} />
      <Line x1="13" y1="9.5" x2="19" y2="9.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="13" y1="14.5" x2="17" y2="14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ size = 20, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ size = 32, color = RED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ─── small building blocks ──────────────────────────────────────────────────
function IconBox({ children }: { children: React.ReactNode }) {
  return <View style={styles.iconBox}>{children}</View>;
}

function DetailField({
  icon,
  label,
  value,
  valueColor = WHITE,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailField}>
      <IconBox>{icon}</IconBox>
      <View style={styles.detailFieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── props ─────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (tab: DriverTab) => void;
}

export default function DriverVehicleScreen({ onNavigate: _onNavigate }: Props) {
  const [data, setData] = useState<DriverVehicleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [expiryModalVisible, setExpiryModalVisible] = useState(false);
  const [savingExpiry, setSavingExpiry] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    const session = sessionStore.get();
    if (session?.kind !== "driver") return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchErr(null);

    try {
      const result = await fetchDriverVehicle(session.access_token);
      setData(result);
    } catch (err: unknown) {
      setFetchErr(err instanceof Error ? err.message : "Could not load vehicle information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  function handleViewInsurance() {
    if (data?.insurance.document_preview_url) {
      setPreviewVisible(true);
    } else {
      Alert.alert("Insurance document is not available yet.");
    }
  }

  async function handleSaveExpiryDate(isoDate: string) {
    const session = sessionStore.get();
    if (session?.kind !== "driver") return;

    setSavingExpiry(true);
    try {
      await updateDriverInsuranceExpiry(session.access_token, isoDate);
      setExpiryModalVisible(false);
      await load(false);
      Alert.alert("Success", "Insurance expiry date updated.");
    } catch {
      Alert.alert("Error", "Could not update expiry date. Please try again.");
    } finally {
      setSavingExpiry(false);
    }
  }

  const insuranceDocForPreview: DriverDocumentListItem | null =
    data?.insurance.document_preview_url
      ? {
          id: "insurance-document",
          document_type: "vehicle_insurance",
          title: "Insurance Document",
          description: "",
          review_status:
            data.insurance.document_status === "not_uploaded"
              ? "missing"
              : data.insurance.document_status,
          review_status_label: data.insurance.document_status_label,
          review_status_color: "",
          uploaded_at: null,
          updated_at: null,
          last_updated_label: "",
          file_name: null,
          mime_type: data.insurance.mime_type,
          signed_url: data.insurance.document_preview_url,
        }
      : null;

  const driverStatusColor = data ? DRIVER_STATUS_COLOR[data.driver.status] ?? MUTED : GREEN;
  const documentStatusColor = data
    ? DOCUMENT_STATUS_COLOR[data.insurance.document_status] ?? MUTED
    : GREEN;
  const expiryStatusColor = data
    ? EXPIRY_STATUS_COLOR[data.insurance.expiry_status] ?? MUTED
    : MUTED;
  const expiryDaysLeftLabel = data
    ? formatDaysLeftLabel(data.insurance.expiry_status, data.insurance.days_until_expiry)
    : "";

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={ORANGE} />
          }
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSmall}>My vehicle</Text>
              <Text style={styles.headerTitle}>Vehicle</Text>
              <Text style={styles.headerSub}>Your own-car driver information</Text>
            </View>
            <View>
              <View style={styles.profileBtn}>
                <PersonIcon size={22} color={WHITE} />
              </View>
              <View style={styles.notifDot} />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : fetchErr ? (
            <View style={styles.errorBox}>
              <XCircleIcon size={32} color={RED} />
              <Text style={styles.errorTitle}>Could not load vehicle information</Text>
              <Pressable style={styles.retryBtn} onPress={() => load(false)}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : data ? (
            <>
              {/* ── My Vehicle card ──────────────────────────────────────────────── */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>My Vehicle</Text>
                  <View style={[styles.activeBadge, { backgroundColor: `${driverStatusColor}26` }]}>
                    <View style={[styles.greenDot, { backgroundColor: driverStatusColor }]} />
                    <Text style={[styles.activeBadgeText, { color: driverStatusColor }]}>
                      {data.driver.status_label}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleRow}>
                  <View style={styles.vehicleImageBox}>
                    <Image
                      source={images.ownVehicle}
                      style={styles.vehicleImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.vehicleInfoCol}>
                    <Text style={styles.vehicleName}>
                      {orFallback(data.vehicle.make_model, NOT_PROVIDED)}
                    </Text>
                    <View style={styles.plateBox}>
                      <Text style={styles.plateBoxText}>
                        {orFallback(data.vehicle.plate_number, NOT_PROVIDED)}
                      </Text>
                    </View>
                    <View style={styles.driverTypeBadge}>
                      <PersonIcon size={15} color={ORANGE} />
                      <Text style={styles.driverTypeBadgeText}>{data.driver.driver_type_label}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ── Vehicle Details card ─────────────────────────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Vehicle Details</Text>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailsCol}>
                    <DetailField
                      icon={<CarFrontIcon size={16} color={ORANGE} />}
                      label="Make / Model"
                      value={orFallback(data.vehicle.make_model, NOT_PROVIDED)}
                    />
                    <DetailField
                      icon={<PersonIcon size={16} color={ORANGE} />}
                      label="Vehicle Type"
                      value={data.vehicle.vehicle_type}
                    />
                  </View>
                  <View style={styles.detailsCol}>
                    <DetailField
                      icon={<IdCardIcon size={16} color={ORANGE} />}
                      label="Plate Number"
                      value={orFallback(data.vehicle.plate_number, NOT_PROVIDED)}
                    />
                    <DetailField
                      icon={<CheckCircleIcon size={16} color={GREEN} />}
                      label="Registration Status"
                      value={data.vehicle.registration_status}
                      valueColor={GREEN}
                    />
                  </View>
                </View>
              </View>

              {/* ── Insurance Information card ───────────────────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Insurance Information</Text>

                <View style={styles.insuranceList}>
                  <DetailField
                    icon={<ShieldCheckIcon size={16} color={ORANGE} />}
                    label="Insurance Provider"
                    value={orFallback(data.insurance.provider, NOT_PROVIDED)}
                  />
                  <DetailField
                    icon={<DocIcon size={16} color={ORANGE} />}
                    label="Insurance Number"
                    value={orFallback(data.insurance.insurance_number, NOT_PROVIDED)}
                  />
                  <DetailField
                    icon={<CheckCircleIcon size={16} color={documentStatusColor} />}
                    label="Document Status"
                    value={orFallback(data.insurance.document_status_label, "Not uploaded")}
                    valueColor={documentStatusColor}
                  />
                  <Pressable
                    style={styles.detailField}
                    onPress={() => setExpiryModalVisible(true)}
                  >
                    <IconBox>
                      <CalendarIcon size={16} color={expiryStatusColor} />
                    </IconBox>
                    <View style={styles.detailFieldText}>
                      <Text style={styles.fieldLabel}>Expiry Date</Text>
                      <Text style={[styles.fieldValue, { color: expiryStatusColor }]}>
                        {data.insurance.expiry_date
                          ? formatExpiryDate(data.insurance.expiry_date)
                          : "Tap to add expiry date"}
                      </Text>
                      {expiryDaysLeftLabel ? (
                        <Text style={[styles.expirySubtitle, { color: expiryStatusColor }]}>
                          {expiryDaysLeftLabel}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>

                <Pressable style={styles.outlineBtn} onPress={handleViewInsurance}>
                  <DocIcon size={18} color={ORANGE} />
                  <Text style={styles.outlineBtnText}>View Insurance Document</Text>
                </Pressable>
              </View>

              {/* ── Info card ─────────────────────────────────────────────────────── */}
              <View style={styles.infoCard}>
                <InfoIcon size={20} color={ORANGE} />
                <Text style={styles.infoText}>
                  Packet totals and earnings will be calculated from warehouse or
                  external delivery data.
                </Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>

      <DriverDocumentPreviewModal
        visible={previewVisible}
        document={insuranceDocForPreview}
        onClose={() => setPreviewVisible(false)}
      />

      <InsuranceExpiryDateModal
        visible={expiryModalVisible}
        initialDate={data?.insurance.expiry_date ?? null}
        saving={savingExpiry}
        onCancel={() => setExpiryModalVisible(false)}
        onSave={handleSaveExpiryDate}
      />
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
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    marginTop: 1,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
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

  // ── Loading / error states
  loadingBox: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
    marginBottom: 14,
  },

  // ── My Vehicle card
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  greenDot: {
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
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  vehicleImageBox: {
    flex: 1,
    height: 110,
    backgroundColor: INNER,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vehicleImage: {
    width: "88%",
    height: "88%",
  },
  vehicleInfoCol: {
    flex: 1,
    gap: 8,
    alignItems: "flex-start",
  },
  vehicleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  plateBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: INNER,
  },
  plateBoxText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: WHITE,
    letterSpacing: 0.5,
  },
  driverTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  driverTypeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: ORANGE,
  },

  // ── Vehicle Details / Insurance rows
  detailsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  detailsCol: {
    flex: 1,
    gap: 14,
  },
  insuranceList: {
    gap: 14,
    marginBottom: 16,
  },
  detailField: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailFieldText: {
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  expirySubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginTop: 2,
  },

  // ── Insurance document button
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  outlineBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: ORANGE,
  },

  // ── Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },
});
