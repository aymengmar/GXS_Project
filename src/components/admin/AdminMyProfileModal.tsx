import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const CARD_BG  = "#111E33";
const SHEET_BG = "#0F1A2E";
const BORDER   = "rgba(255,255,255,0.09)";
const ORANGE   = "#FF6500";
const WHITE    = "#FFFFFF";
const DIM      = "rgba(255,255,255,0.50)";
const ICON_DIM = "rgba(255,255,255,0.45)";
const DIVIDER  = "rgba(255,255,255,0.07)";
const HANDLE   = "rgba(255,255,255,0.18)";
const GREEN    = "#22C55E";

const SH = Dimensions.get("window").height;

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={WHITE} strokeWidth={1.8} />
    </Svg>
  );
}

function PersonIcon()   { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={ICON_DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={ICON_DIM} strokeWidth={1.8} /></Svg>; }
function MailIcon()     { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Rect x="2" y="4" width="20" height="16" rx="2" stroke={ICON_DIM} strokeWidth={1.8} /><Path d="M2 7l10 7 10-7" stroke={ICON_DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function PhoneIcon()    { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16h1z" stroke={ICON_DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function BadgeIcon()    { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="16" rx="3" stroke={ICON_DIM} strokeWidth={1.8} /><Circle cx="9" cy="10" r="2.5" stroke={ICON_DIM} strokeWidth={1.5} /><Path d="M5.5 17c0-2 1.567-3.5 3.5-3.5s3.5 1.5 3.5 3.5" stroke={ICON_DIM} strokeWidth={1.5} strokeLinecap="round" /><Path d="M15 9h3M15 12h2" stroke={ICON_DIM} strokeWidth={1.5} strokeLinecap="round" /></Svg>; }
function BuildingIcon() { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v2M12 11v2M16 11v2M8 15v2M12 15v2M16 15v2" stroke={ICON_DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function MapPinIcon()   { return <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={ICON_DIM} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="10" r="3" stroke={ICON_DIM} strokeWidth={1.8} /></Svg>; }
function PencilIcon()   { return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={ORANGE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={ORANGE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }

type ProfileRow = { key: string; Icon: React.ComponentType; label: string; value: string };

const PROFILE_ROWS: ProfileRow[] = [
  { key: "name",     Icon: PersonIcon,   label: "Full Name", value: "Admin"                 },
  { key: "email",    Icon: MailIcon,     label: "Email",     value: "admin@gxsdelivery.app" },
  { key: "phone",    Icon: PhoneIcon,    label: "Phone",     value: "+49 123 456 7890"       },
  { key: "role",     Icon: BadgeIcon,    label: "Role",      value: "Super Admin"            },
  { key: "company",  Icon: BuildingIcon, label: "Company",   value: "GXS Delivery"          },
  { key: "location", Icon: MapPinIcon,   label: "Location",  value: "Hamburg, Germany"      },
];

type Props = { visible: boolean; onClose: () => void };

export default function AdminMyProfileModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>My Profile</Text>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <CloseIcon />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

            <View style={s.avatarSection}>
              <View style={s.avatarRing}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarLetter}>A</Text>
                </View>
              </View>
              <View style={s.onlineDot} />
              <View style={s.cameraBadge}>
                <CameraIcon />
              </View>
              <Text style={s.avatarName}>Admin</Text>
              <Text style={s.avatarRole}>Super Admin · GXS Delivery</Text>
            </View>

            <View style={s.card}>
              {PROFILE_ROWS.map(({ key, Icon, label, value }, idx) => (
                <View key={key}>
                  <View style={s.row}>
                    <View style={s.rowIconWrap}><Icon /></View>
                    <Text style={s.rowLabel}>{label}</Text>
                    <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
                  </View>
                  {idx < PROFILE_ROWS.length - 1 && <View style={s.rowDivider} />}
                </View>
              ))}
            </View>

            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={s.footer}>
            <Pressable style={({ pressed }) => [s.editBtn, pressed && s.editBtnPressed]}>
              <PencilIcon />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </Pressable>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: SH * 0.88,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 3,
    backgroundColor: "#1A3A5C",
  },
  avatarCircle: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: WHITE,
    lineHeight: 42,
  },
  onlineDot: {
    position: "absolute",
    top: 64,
    right: "50%",
    marginRight: -52,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: SHEET_BG,
  },
  cameraBadge: {
    position: "absolute",
    top: 60,
    right: "50%",
    marginRight: -44,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: SHEET_BG,
  },
  avatarName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
    marginTop: 10,
    lineHeight: 22,
  },
  avatarRole: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    lineHeight: 18,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIconWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: WHITE,
  },
  rowValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: DIM,
    maxWidth: "46%",
    textAlign: "right",
  },
  rowDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "transparent",
  },
  editBtnPressed: {
    backgroundColor: "rgba(255,101,0,0.10)",
  },
  editBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: ORANGE,
  },
});
