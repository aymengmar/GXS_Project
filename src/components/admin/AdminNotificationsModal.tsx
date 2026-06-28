import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const SHEET_BG = "#0F1A2E";
const CARD_BG  = "#111E33";
const BORDER   = "rgba(255,255,255,0.09)";
const ORANGE   = "#FF6500";
const WHITE    = "#FFFFFF";
const DIM      = "rgba(255,255,255,0.45)";
const DIVIDER  = "rgba(255,255,255,0.07)";
const GRAY     = "#3A3A3C";
const HANDLE   = "rgba(255,255,255,0.18)";

const SH = Dimensions.get("window").height;

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon({ color = DIM }: { color?: string })      { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function DocumentIcon({ color = DIM }: { color?: string })  { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function InvoiceIcon({ color = DIM }: { color?: string })   { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="3" y="2" width="18" height="20" rx="2" stroke={color} strokeWidth={1.8} /><Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>; }
function ShieldIcon({ color = DIM }: { color?: string })    { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function PersonIcon({ color = DIM }: { color?: string })    { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} /></Svg>; }
function WarehouseIcon({ color = DIM }: { color?: string }) { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function MailIcon({ color = DIM }: { color?: string })      { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={1.8} /><Path d="M2 7l10 7 10-7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }

type NotifRow = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ color?: string }>;
  defaultOn: boolean;
};

const NOTIF_ROWS: NotifRow[] = [
  { key: "new_driver",  label: "New Driver Registration",  Icon: BellIcon,      defaultOn: true  },
  { key: "doc_upload",  label: "Document Uploaded",        Icon: DocumentIcon,  defaultOn: true  },
  { key: "invoice",     label: "Invoice Submitted",        Icon: InvoiceIcon,   defaultOn: true  },
  { key: "return_rate", label: "High Return Rate",         Icon: ShieldIcon,    defaultOn: true  },
  { key: "activated",   label: "Driver Account Activated", Icon: PersonIcon,    defaultOn: true  },
  { key: "day_closed",  label: "Warehouse Day Closed",     Icon: WarehouseIcon, defaultOn: false },
];

const CHANNEL_ROWS: NotifRow[] = [
  { key: "push",  label: "Push Notifications",  Icon: BellIcon, defaultOn: true },
  { key: "email", label: "Email Notifications", Icon: MailIcon, defaultOn: true },
];

function buildDefaults(rows: NotifRow[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  rows.forEach((r) => { result[r.key] = r.defaultOn; });
  return result;
}

type RowProps = {
  item: NotifRow;
  value: boolean;
  onChange: (key: string, val: boolean) => void;
  showDivider: boolean;
};

function ToggleRow({ item, value, onChange, showDivider }: RowProps) {
  return (
    <>
      <View style={r.row}>
        <View style={r.iconWrap}>
          <item.Icon color={value ? ORANGE : DIM} />
        </View>
        <Text style={r.label}>{item.label}</Text>
        <Switch
          value={value}
          onValueChange={(v) => onChange(item.key, v)}
          trackColor={{ false: GRAY, true: ORANGE }}
          thumbColor={WHITE}
          ios_backgroundColor={GRAY}
        />
      </View>
      {showDivider && <View style={r.divider} />}
    </>
  );
}

const r = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18, gap: 14 },
  iconWrap:{ width: 24, alignItems: "center", justifyContent: "center" },
  label:   { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 14, color: WHITE },
  divider: { height: 1, backgroundColor: DIVIDER, marginHorizontal: 18 },
});

type Props = { visible: boolean; onClose: () => void };

export default function AdminNotificationsModal({ visible, onClose }: Props) {
  const [notifs,   setNotifs]   = useState<Record<string, boolean>>(buildDefaults(NOTIF_ROWS));
  const [channels, setChannels] = useState<Record<string, boolean>>(buildDefaults(CHANNEL_ROWS));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Notifications</Text>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <CloseIcon />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            <View style={s.card}>
              {NOTIF_ROWS.map((item, idx) => (
                <ToggleRow
                  key={item.key}
                  item={item}
                  value={notifs[item.key]}
                  onChange={(k, v) => setNotifs((p) => ({ ...p, [k]: v }))}
                  showDivider={idx < NOTIF_ROWS.length - 1}
                />
              ))}
            </View>

            <Text style={s.sectionTitle}>Notification Channels</Text>

            <View style={s.card}>
              {CHANNEL_ROWS.map((item, idx) => (
                <ToggleRow
                  key={item.key}
                  item={item}
                  value={channels[item.key]}
                  onChange={(k, v) => setChannels((p) => ({ ...p, [k]: v }))}
                  showDivider={idx < CHANNEL_ROWS.length - 1}
                />
              ))}
            </View>

            <View style={{ height: 8 }} />
          </ScrollView>

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
    borderBottomColor: "rgba(255,255,255,0.07)",
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
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: DIM,
    marginBottom: 10,
    marginTop: 16,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
