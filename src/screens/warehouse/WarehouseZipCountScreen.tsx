import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

// ─── palette ────────────────────────────────────────────────────────────────
const BG = "#080F1D";
const CARD = "#0D1A2E";
const INNER = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const ORANGE = "#FF6500";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.30)";

type ZipStatus = "validated" | "notCounted";

interface ZipEntry {
  zip: string;
  packets: number;
  status: ZipStatus;
}

// ─── mock data (frontend UI only) ────────────────────────────────────────────
const INITIAL_ZIPS: ZipEntry[] = [
  { zip: "12345", packets: 400, status: "validated" },
  { zip: "14725", packets: 280, status: "validated" },
  { zip: "36945", packets: 0, status: "notCounted" },
  { zip: "12536", packets: 0, status: "notCounted" },
];

// ─── SVG icons ────────────────────────────────────────────────────────────────
function CheckCircleIcon({ size = 18, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DashedCircleIcon({ size = 18, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeDasharray="3 3.5" />
    </Svg>
  );
}

function CloseIcon({ size = 14, color = DIM }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BoxIcon({ size = 16, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScanIcon({ size = 30, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 8V6a2 2 0 0 0-2-2h-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16v2a2 2 0 0 0 2 2h2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16v2a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 9v6M10 9v6M13 9v6M16 9v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function PinIcon({ size = 15, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function LockIcon({ size = 16, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 11V7a6 6 0 0 1 12 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── small building blocks ───────────────────────────────────────────────────
function ValidatedZipCard({ entry }: { entry: ZipEntry }) {
  const isValidated = entry.status === "validated";
  return (
    <View
      style={[
        styles.validatedCard,
        { borderColor: isValidated ? "rgba(34,197,94,0.45)" : "rgba(255,101,0,0.45)" },
      ]}
    >
      {isValidated ? <CheckCircleIcon /> : <DashedCircleIcon />}
      <Text style={styles.validatedZipNumber}>{entry.zip}</Text>
      <Text style={styles.validatedZipSub}>
        {isValidated ? `${entry.packets} packets` : "Not counted yet"}
      </Text>
      <View
        style={[
          styles.miniBadge,
          { backgroundColor: isValidated ? "rgba(34,197,94,0.15)" : INNER },
        ]}
      >
        <Text style={[styles.miniBadgeText, { color: isValidated ? GREEN : DIM }]}>
          {isValidated ? "Validated" : "Not counted"}
        </Text>
      </View>
    </View>
  );
}

function ZipChip({
  entry,
  onRemove,
}: {
  entry: ZipEntry;
  onRemove: () => void;
}) {
  const isValidated = entry.status === "validated";
  return (
    <View style={styles.zipChip}>
      <View style={styles.zipChipTopRow}>
        <Text style={styles.zipChipNumber}>{entry.zip}</Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <CloseIcon />
        </Pressable>
      </View>
      <View style={styles.zipChipStatusRow}>
        <View
          style={[
            styles.zipChipDot,
            { backgroundColor: isValidated ? GREEN : MUTED },
          ]}
        />
        <Text style={[styles.zipChipStatusText, { color: isValidated ? GREEN : DIM }]}>
          {isValidated ? "Validated" : "Not counted"}
        </Text>
      </View>
    </View>
  );
}

function ZipListRow({
  entry,
  isLast,
  isSelected,
  onSelect,
}: {
  entry: ZipEntry;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isValidated = entry.status === "validated";
  return (
    <View style={[styles.zipListRow, !isLast && styles.rowDivider]}>
      <View style={styles.zipListTopRow}>
        <View style={styles.zipListLeft}>
          <PinIcon />
          <Text style={styles.zipListNumber}>{entry.zip}</Text>
        </View>
        <Text style={styles.zipListPackets} numberOfLines={1}>
          {entry.packets} packets
        </Text>
      </View>
      <View style={styles.zipListBottomRow}>
        <View
          style={[
            styles.miniBadge,
            { backgroundColor: isValidated ? "rgba(34,197,94,0.15)" : INNER },
          ]}
        >
          <Text style={[styles.miniBadgeText, { color: isValidated ? GREEN : DIM }]}>
            {isValidated ? "Validated" : "Not counted"}
          </Text>
        </View>
        {isValidated ? (
          <View style={styles.lockBox}>
            <LockIcon />
          </View>
        ) : (
          <Pressable
            style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
            onPress={onSelect}
          >
            <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
              {isSelected ? "Selected" : "Select"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function WarehouseZipCountScreen() {
  const [zips, setZips] = useState<ZipEntry[]>(INITIAL_ZIPS);
  const [zipInput, setZipInput] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [selectedZip, setSelectedZip] = useState<string | null>(null);

  const addZip = () => {
    const trimmed = zipInput.trim();
    if (!trimmed || zips.some((z) => z.zip === trimmed)) return;
    setZips((prev) => [...prev, { zip: trimmed, packets: 0, status: "notCounted" }]);
    setZipInput("");
  };

  const removeZip = (zip: string) => {
    setZips((prev) => prev.filter((z) => z.zip !== zip));
    if (selectedZip === zip) setSelectedZip(null);
  };

  const addPacket = () => {
    const trimmed = scanInput.trim();
    if (!trimmed) return;
    setZips((prev) =>
      prev.map((z) =>
        z.zip === trimmed && z.status === "notCounted"
          ? { ...z, packets: z.packets + 1 }
          : z
      )
    );
    setScanInput("");
  };

  const notCountedCount = zips.filter((z) => z.status === "notCounted").length;

  const validateSelectedZip = () => {
    if (!selectedZip) return;
    setZips((prev) =>
      prev.map((z) =>
        z.zip === selectedZip ? { ...z, status: "validated" } : z
      )
    );
    setSelectedZip(null);
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
              <Text style={styles.headerTitle}>ZIP Count</Text>
              <Text style={styles.headerSubtitle}>
                Add ZIP codes manually and count packets one ZIP at a time.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>WU</Text>
              </View>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* ── Validated ZIP Counts ─────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Validated ZIP Counts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.validatedScroll}
            contentContainerStyle={styles.validatedScrollContent}
          >
            {zips.map((entry) => (
              <ValidatedZipCard key={entry.zip} entry={entry} />
            ))}
          </ScrollView>

          {/* ── Today's ZIP Codes ────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today&apos;s ZIP Codes</Text>
            <Text style={styles.cardText}>
              Enter the ZIP codes available in the warehouse today.
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter ZIP code"
                placeholderTextColor={MUTED}
                selectionColor={ORANGE}
                value={zipInput}
                onChangeText={setZipInput}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Pressable style={styles.primaryBtn} onPress={addZip}>
                <Text style={styles.primaryBtnText}>Add ZIP</Text>
              </Pressable>
            </View>

            <View style={styles.chipGrid}>
              {zips.map((entry) => (
                <ZipChip key={entry.zip} entry={entry} onRemove={() => removeZip(entry.zip)} />
              ))}
            </View>

            <View style={styles.infoRow}>
              <BoxIcon />
              <Text style={styles.infoRowText}>{zips.length} ZIP codes added today</Text>
            </View>
          </View>

          {/* ── Scan Packet ZIP ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scan Packet ZIP</Text>
            <View style={styles.scanRow}>
              <View style={styles.scanIconBox}>
                <ScanIcon />
              </View>
              <Text style={styles.scanText}>Scan packet barcode or enter ZIP manually.</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter scanned ZIP"
                placeholderTextColor={MUTED}
                selectionColor={ORANGE}
                value={scanInput}
                onChangeText={setScanInput}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Pressable style={styles.outlineBtn} onPress={addPacket}>
                <Text style={styles.outlineBtnText}>Add Packet</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Today's ZIP List ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Today&apos;s ZIP List</Text>
          <View style={styles.card}>
            {zips.map((entry, i) => (
              <ZipListRow
                key={entry.zip}
                entry={entry}
                isLast={i === zips.length - 1}
                isSelected={selectedZip === entry.zip}
                onSelect={() =>
                  setSelectedZip((prev) => (prev === entry.zip ? null : entry.zip))
                }
              />
            ))}
          </View>

          {/* ── Bottom actions ───────────────────────────────────────────── */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => setSelectedZip(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.validateBtn} onPress={validateSelectedZip}>
              <CheckCircleIcon size={16} color={WHITE} />
              <Text style={styles.validateBtnText}>Validate This ZIP</Text>
            </Pressable>
          </View>

          {notCountedCount === 0 && (
            <Text style={styles.allDoneText}>All ZIP codes validated for today.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
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

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 10,
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
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
    marginBottom: 4,
  },
  cardText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    lineHeight: 18,
    marginBottom: 14,
  },

  // ── Validated ZIP Counts (horizontal cards)
  validatedScroll: { width: "100%", marginBottom: 18 },
  validatedScrollContent: { gap: 10, paddingRight: 4 },
  validatedCard: {
    width: 128,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  validatedZipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
    marginTop: 2,
  },
  validatedZipSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: DIM,
  },
  miniBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  miniBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
  },

  // ── Inputs
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: WHITE,
  },
  primaryBtn: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: WHITE,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: ORANGE,
  },

  // ── ZIP chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginBottom: 14,
  },
  zipChip: {
    width: "47%",
    backgroundColor: INNER,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  zipChipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zipChipNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
  zipChipStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zipChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zipChipStatusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },

  // ── Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRowText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
    color: ORANGE,
  },

  // ── Scan packet
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  scanIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    lineHeight: 18,
  },

  // ── Today's ZIP List
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  zipListRow: {
    gap: 8,
    paddingVertical: 14,
  },
  zipListTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zipListLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zipListNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  zipListPackets: {
    flexShrink: 1,
    marginLeft: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: DIM,
    textAlign: "right",
  },
  zipListBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lockBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  selectBtnActive: {
    backgroundColor: ORANGE,
  },
  selectBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: ORANGE,
  },
  selectBtnTextActive: {
    color: WHITE,
  },

  // ── Bottom actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: INNER,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: ORANGE,
  },
  validateBtn: {
    flex: 1.4,
    flexDirection: "row",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  validateBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
  },
  allDoneText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    marginTop: 14,
  },
});
