import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from "react-native";

// ─── palette ──────────────────────────────────────────────────────────────────
const BG      = "#080F1D";
const CARD    = "#0E1829";
const CARD2   = "#111E33";
const BORDER  = "rgba(255,255,255,0.07)";
const ORANGE  = "#FF6500";
const GREEN   = "#22C55E";
const RED     = "#EF4444";
const AMBER   = "#F59E0B";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.60)";
const MUTED   = "rgba(255,255,255,0.28)";

// ─── types ─────────────────────────────────────────────────────────────────────
export type DocStatus = "Approved" | "Pending" | "Rejected";
export type IconType  = "passport" | "health" | "bank" | "home";

export interface ReviewDoc {
  id: string;
  title: string;
  description: string;
  uploadedDate: string;
  status: DocStatus;
  iconType: IconType;
}

export interface ReviewDriver {
  name: string;
  extId: string;
  carType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photo: any;
}

type ConfirmStep = "approve" | "reject" | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  doc: ReviewDoc | null;
  driver: ReviewDriver | null;
  onAction: (docId: string, action: "approve" | "reject", reason?: string) => void;
}

// ─── icons ─────────────────────────────────────────────────────────────────────
function CloseXIcon() {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      {[45, -45].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: 14,
            height: 2,
            borderRadius: 1,
            backgroundColor: WHITE,
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
    </View>
  );
}

function CarIcon() {
  return (
    <View style={{ width: 16, height: 11 }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: 16, height: 8, borderRadius: 2, borderWidth: 1.3, borderColor: MUTED }} />
      <View style={{ position: "absolute", bottom: 0, left: 2, width: 4.5, height: 4.5, borderRadius: 2.25, borderWidth: 1.3, borderColor: MUTED, backgroundColor: CARD }} />
      <View style={{ position: "absolute", bottom: 0, right: 2, width: 4.5, height: 4.5, borderRadius: 2.25, borderWidth: 1.3, borderColor: MUTED, backgroundColor: CARD }} />
    </View>
  );
}

function CalIcon() {
  return (
    <View style={{ width: 14, height: 14 }}>
      <View style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 1.2, borderColor: MUTED }} />
      <View style={{ position: "absolute", top: 4, left: 0, right: 0, height: 1, backgroundColor: MUTED }} />
      <View style={{ position: "absolute", top: -1, left: 3,  width: 1.5, height: 4, backgroundColor: MUTED, borderRadius: 1 }} />
      <View style={{ position: "absolute", top: -1, right: 3, width: 1.5, height: 4, backgroundColor: MUTED, borderRadius: 1 }} />
    </View>
  );
}

function ClockIcon() {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.2, borderColor: AMBER }} />
      <View style={{ position: "absolute", width: 1.5, height: 5, backgroundColor: AMBER, borderRadius: 1, bottom: 7 }} />
      <View style={{ position: "absolute", width: 3.5, height: 1.5, backgroundColor: AMBER, borderRadius: 1, left: 7.5 }} />
    </View>
  );
}

function InfoIcon() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "#60A5FA", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 1.8, height: 7, backgroundColor: "#60A5FA", borderRadius: 1, marginTop: 1 }} />
      <View style={{ width: 1.8, height: 1.8, borderRadius: 0.9, backgroundColor: "#60A5FA", marginTop: -9, marginBottom: 0 }} />
    </View>
  );
}

function RejectXIcon() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.8, borderColor: RED, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 9, height: 1.8, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 9, height: 1.8, backgroundColor: RED, borderRadius: 1, transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

function ApproveCheckIcon() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.8, borderColor: GREEN, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 9, height: 5, borderLeftWidth: 1.8, borderBottomWidth: 1.8, borderColor: GREEN, transform: [{ rotate: "-45deg" }], marginTop: -2 }} />
    </View>
  );
}

// ─── mock German ID preview ────────────────────────────────────────────────────
function MockIDCard() {
  return (
    <View style={id.card}>
      {/* top bar */}
      <View style={id.topBar}>
        <View style={id.topLeft}>
          <Text style={id.bundesText}>BUNDESREPUBLIK DEUTSCHLAND</Text>
          <Text style={id.federalText}>FEDERAL REPUBLIC OF GERMANY</Text>
        </View>
        <View style={id.flagRow}>
          <View style={id.euCircle}>
            <Text style={{ fontSize: 9 }}>🇪🇺</Text>
          </View>
          <View style={id.deFlag}>
            <View style={{ flex:1, backgroundColor:"#000" }} />
            <View style={{ flex:1, backgroundColor:"#D00" }} />
            <View style={{ flex:1, backgroundColor:"#FC0" }} />
          </View>
        </View>
      </View>

      {/* body */}
      <View style={id.body}>
        {/* photo placeholder */}
        <View style={id.photoBox}>
          <View style={{ width:"100%", height:"100%", backgroundColor:"#8899BB", borderRadius:2 }} />
        </View>

        {/* fields */}
        <View style={id.fields}>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Name/Surname</Text>
            <Text style={id.fieldValue}>DOE</Text>
          </View>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Vornamen/Given names</Text>
            <Text style={id.fieldValue}>JOHN</Text>
          </View>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Geburtstag/Date of birth</Text>
            <Text style={id.fieldValue}>15.04.1990</Text>
          </View>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Staatsangehörigkeit/Nationality</Text>
            <Text style={id.fieldValue}>DEUTSCH</Text>
          </View>
        </View>

        {/* right side IDs */}
        <View style={id.rightCol}>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Ausweis-Nr./ID No.</Text>
            <Text style={id.fieldValue}>T22000129</Text>
          </View>
          <View style={id.fieldGroup}>
            <Text style={id.fieldLabel}>Gültig bis/Date of expiry</Text>
            <Text style={id.fieldValue}>10.05.2030</Text>
          </View>
          <Text style={id.serialNum}>938568</Text>
        </View>
      </View>

      {/* MRZ bar */}
      <View style={id.mrz}>
        <Text style={id.mrzText}>{"<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"}</Text>
      </View>
    </View>
  );
}

const id = StyleSheet.create({
  card:        { backgroundColor:"#EDE8D8", borderRadius:10, overflow:"hidden", borderWidth:1, borderColor:"rgba(0,0,0,0.15)" },
  topBar:      { backgroundColor:"#1A3A6B", paddingHorizontal:10, paddingVertical:6, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  topLeft:     { flex:1 },
  bundesText:  { color:"#D4AF37", fontSize:6.5, fontWeight:"700", letterSpacing:0.3 },
  federalText: { color:"rgba(212,175,55,0.75)", fontSize:5.5, letterSpacing:0.2, marginTop:1 },
  flagRow:     { flexDirection:"row", gap:4, alignItems:"center" },
  euCircle:    { width:20, height:20, borderRadius:10, borderWidth:1, borderColor:"#D4AF37", alignItems:"center", justifyContent:"center", backgroundColor:"#1A3A6B" },
  deFlag:      { width:20, height:14, borderRadius:2, overflow:"hidden", borderWidth:1, borderColor:"rgba(0,0,0,0.2)" },
  body:        { flexDirection:"row", padding:8, gap:8 },
  photoBox:    { width:56, height:72, flexShrink:0 },
  fields:      { flex:1, gap:4 },
  rightCol:    { width:80, gap:4 },
  fieldGroup:  { gap:0 },
  fieldLabel:  { fontSize:4.5, color:"#7A6A50", lineHeight:7 },
  fieldValue:  { fontSize:7, fontWeight:"700", color:"#2A2A2A", lineHeight:10 },
  serialNum:   { fontSize:14, fontWeight:"700", color:"#2A2A2A", marginTop:4 },
  mrz:         { backgroundColor:"#2A2A2A", paddingHorizontal:8, paddingVertical:5 },
  mrzText:     { fontSize:4, color:"rgba(255,255,255,0.45)", letterSpacing:0.5, fontFamily:"monospace" },
});

// ─── status badge config ───────────────────────────────────────────────────────
function statusCfg(s: DocStatus) {
  switch (s) {
    case "Approved": return { bg:"rgba(34,197,94,0.18)",  text:"#4ADE80", border:"rgba(34,197,94,0.35)" };
    case "Pending":  return { bg:"rgba(245,158,11,0.18)", text:"#FCD34D", border:"rgba(245,158,11,0.45)" };
    case "Rejected": return { bg:"rgba(239,68,68,0.18)",  text:"#FC8181", border:"rgba(239,68,68,0.4)"  };
  }
}

// ─── modal ─────────────────────────────────────────────────────────────────────
export default function AdminDocumentReviewModal({ visible, onClose, doc, driver, onAction }: Props) {
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!doc || !driver) return null;

  const sCfg = statusCfg(doc.status);

  function handleRejectTap() {
    setRejectReason("");
    setConfirmStep("reject");
  }

  function handleApproveTap() {
    setConfirmStep("approve");
  }

  function handleCancelConfirm() {
    setConfirmStep(null);
    setRejectReason("");
  }

  function handleConfirm() {
    if (!doc) return;
    onAction(doc.id, confirmStep!, confirmStep === "reject" ? rejectReason.trim() : undefined);
    setConfirmStep(null);
    setRejectReason("");
  }

  const canConfirmReject = confirmStep === "reject" ? rejectReason.trim().length > 0 : true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* dim overlay */}
      <Pressable style={m.overlay} onPress={onClose} />

      {/* modal card */}
      <View style={m.sheet} pointerEvents="box-none">
        {/* drag handle */}
        <View style={m.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={m.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* header row */}
          <View style={m.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={m.title}>Review Document</Text>
              <Text style={m.subtitle}>Please review the document and take action</Text>
            </View>
            <Pressable
              style={m.closeBtn}
              onPress={onClose}
              hitSlop={10}
            >
              <CloseXIcon />
            </Pressable>
          </View>

          {/* driver summary */}
          <View style={m.driverRow}>
            <Image source={driver.photo} style={m.driverAvatar} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={m.driverName}>{driver.name}</Text>
              <Text style={m.driverExtId}>
                ID: <Text style={{ color: ORANGE }}>{driver.extId}</Text>
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
                <CarIcon />
                <Text style={m.driverCarType}>{driver.carType}</Text>
              </View>
            </View>
          </View>

          {/* doc info grid */}
          <View style={m.infoGrid}>
            {/* Document Type */}
            <View style={m.infoCell}>
              <View style={m.infoCellIcon}>
                <View style={{ width: 16, height: 20, borderRadius: 3, borderWidth: 1.5, borderColor: "#A78BFA" }}>
                  <View style={{ position:"absolute", left:3, top:3, width:7, height:7, borderRadius:3.5, borderWidth:1.2, borderColor:"#A78BFA" }} />
                </View>
              </View>
              <Text style={m.infoCellLabel}>Document Type</Text>
              <Text style={m.infoCellValue}>{doc.title}</Text>
            </View>

            <View style={m.infoCellDivider} />

            {/* Uploaded On */}
            <View style={m.infoCell}>
              <CalIcon />
              <Text style={m.infoCellLabel}>Uploaded On</Text>
              <Text style={m.infoCellValue}>{doc.uploadedDate}</Text>
              <Text style={m.infoCellValue}>09:15 AM</Text>
            </View>

            <View style={m.infoCellDivider} />

            {/* Status */}
            <View style={m.infoCell}>
              <ClockIcon />
              <Text style={m.infoCellLabel}>Status</Text>
              <View style={[m.statusPill, { backgroundColor: sCfg.bg, borderColor: sCfg.border }]}>
                <Text style={[m.statusPillText, { color: sCfg.text }]}>{doc.status === "Pending" ? "Pending Review" : doc.status}</Text>
              </View>
            </View>
          </View>

          {/* document preview */}
          <Text style={m.previewLabel}>Document Preview</Text>
          <View style={m.previewWrap}>
            <MockIDCard />
          </View>

          {/* page counter */}
          <View style={m.pageCounter}>
            <Text style={m.pageCounterText}>1 / 1</Text>
          </View>

          {/* info message */}
          <View style={m.infoBox}>
            <InfoIcon />
            <Text style={m.infoBoxText}>
              Please check if the document is readable, valid and matches the driver information.
            </Text>
          </View>

          {/* action buttons */}
          <View style={m.btnRow}>
            <Pressable
              style={({ pressed }) => [m.rejectBtn, pressed && { opacity: 0.8 }]}
              onPress={handleRejectTap}
            >
              <RejectXIcon />
              <Text style={m.rejectBtnText}>Reject</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [m.approveBtn, pressed && { opacity: 0.8 }]}
              onPress={handleApproveTap}
            >
              <ApproveCheckIcon />
              <Text style={m.approveBtnText}>Approve</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── confirmation dialog ── */}
        {confirmStep !== null && (
          <View style={m.confirmOverlay}>
            <Pressable style={m.confirmBackdrop} onPress={handleCancelConfirm} />
            <View style={m.confirmCard}>
              {/* icon */}
              <View style={[
                m.confirmIconWrap,
                { backgroundColor: confirmStep === "approve" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" },
              ]}>
                {confirmStep === "approve" ? <ApproveCheckIcon /> : <RejectXIcon />}
              </View>

              <Text style={m.confirmTitle}>
                {confirmStep === "approve" ? "Approve Document?" : "Reject Document?"}
              </Text>
              <Text style={m.confirmSubtitle}>
                {confirmStep === "approve"
                  ? "This will mark the document as approved. The driver will be notified."
                  : "Please provide a reason so the driver knows what to fix."}
              </Text>

              {confirmStep === "reject" && (
                <TextInput
                  style={m.reasonInput}
                  placeholder="Enter rejection reason…"
                  placeholderTextColor={MUTED}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}

              <View style={m.confirmBtnRow}>
                <Pressable
                  style={({ pressed }) => [m.confirmCancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleCancelConfirm}
                >
                  <Text style={m.confirmCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    m.confirmActionBtn,
                    confirmStep === "approve" ? m.confirmActionApprove : m.confirmActionReject,
                    !canConfirmReject && { opacity: 0.4 },
                    pressed && canConfirmReject && { opacity: 0.8 },
                  ]}
                  onPress={handleConfirm}
                  disabled={!canConfirmReject}
                >
                  <Text style={[
                    m.confirmActionText,
                    { color: confirmStep === "approve" ? GREEN : RED },
                  ]}>
                    {confirmStep === "approve" ? "Approve" : "Reject"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingBottom: 24,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  // header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 12,
  },
  title:    { fontFamily: "Poppins_700Bold",    fontSize: 22, color: WHITE,   lineHeight: 30 },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, color: DIM,     lineHeight: 18, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },

  // driver row
  driverRow:      { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  driverAvatar:   { width: 56, height: 56, borderRadius: 28, flexShrink: 0 },
  driverName:     { fontFamily: "Poppins_700Bold",    fontSize: 17, color: WHITE },
  driverExtId:    { fontFamily: "Poppins_500Medium",  fontSize: 13, color: DIM  },
  driverCarType:  { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },

  // info grid
  infoGrid: {
    flexDirection: "row",
    backgroundColor: CARD2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  infoCell:        { flex: 1, alignItems: "center", gap: 5 },
  infoCellDivider: { width: 1, backgroundColor: BORDER },
  infoCellIcon:    { height: 22, justifyContent: "center" },
  infoCellLabel:   { fontFamily: "Poppins_400Regular", fontSize: 10.5, color: MUTED, textAlign: "center" },
  infoCellValue:   { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: WHITE, textAlign: "center", lineHeight: 16 },
  statusPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  statusPillText:  { fontFamily: "Poppins_600SemiBold", fontSize: 10.5 },

  // preview
  previewLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: WHITE, marginBottom: 12 },
  previewWrap:  { borderRadius: 12, overflow: "hidden", marginBottom: 12 },

  // page counter
  pageCounter: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  pageCounterText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: WHITE },

  // info box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoBoxText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: DIM, lineHeight: 20 },

  // buttons
  btnRow:      { flexDirection: "row", gap: 12 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.55)",
  },
  rejectBtnText:  { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: RED },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1.5,
    borderColor: "rgba(34,197,94,0.5)",
  },
  approveBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: GREEN },

  // confirmation dialog
  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  confirmBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  confirmCard: {
    width: "88%",
    backgroundColor: "#111E33",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 22,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  confirmTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    textAlign: "center",
    lineHeight: 26,
  },
  confirmSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: DIM,
    textAlign: "center",
    lineHeight: 20,
  },
  reasonInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: WHITE,
    minHeight: 80,
    marginTop: 4,
  },
  confirmBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DIM,
  },
  confirmActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmActionApprove: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.5)",
  },
  confirmActionReject: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.5)",
  },
  confirmActionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
