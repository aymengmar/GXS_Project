import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const SHEET_BG = "#0F1A2E";
const CARD_BG  = "#111E33";
const BORDER   = "rgba(255,255,255,0.09)";
const ORANGE   = "#FF6500";
const WHITE    = "#FFFFFF";
const DIM      = "rgba(255,255,255,0.45)";
const DIVIDER  = "rgba(255,255,255,0.07)";
const HANDLE   = "rgba(255,255,255,0.18)";

const SH = Dimensions.get("window").height;

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GlobeIcon({ color = DIM }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioButton({ selected }: { selected: boolean }) {
  return (
    <View style={[rb.outer, selected ? rb.outerSelected : rb.outerUnselected]}>
      {selected && <View style={rb.inner} />}
    </View>
  );
}

const rb = StyleSheet.create({
  outer:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  outerSelected:  { borderColor: ORANGE },
  outerUnselected:{ borderColor: "rgba(255,255,255,0.30)" },
  inner:          { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
});

const LANGUAGES = [
  { key: "en", label: "English",            flag: "🇬🇧" },
  { key: "de", label: "Deutsch (German)",   flag: "🇩🇪" },
  { key: "ar", label: "العربية (Arabic)",   flag: "🇸🇦" },
  { key: "fr", label: "Français (French)",  flag: "🇫🇷" },
  { key: "tr", label: "Türkçe (Turkish)",   flag: "🇹🇷" },
];

type Props = { visible: boolean; onClose: () => void };

export default function AdminLanguageModal({ visible, onClose }: Props) {
  const [selected, setSelected] = useState("en");

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
            <Text style={s.sheetTitle}>Language</Text>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <CloseIcon />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            <View style={s.card}>
              {LANGUAGES.map((lang, idx) => (
                <React.Fragment key={lang.key}>
                  <Pressable
                    onPress={() => setSelected(lang.key)}
                    style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                  >
                    <Text style={s.flag}>{lang.flag}</Text>
                    <View style={s.rowIconWrap}>
                      <GlobeIcon color={selected === lang.key ? ORANGE : DIM} />
                    </View>
                    <Text style={[s.rowLabel, selected === lang.key && s.rowLabelSelected]}>
                      {lang.label}
                    </Text>
                    <RadioButton selected={selected === lang.key} />
                  </Pressable>
                  {idx < LANGUAGES.length - 1 && <View style={s.rowDivider} />}
                </React.Fragment>
              ))}
            </View>
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={s.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [s.saveBtn, pressed && s.saveBtnPressed]}
            >
              <Text style={s.saveBtnLabel}>Save</Text>
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
    maxHeight: SH * 0.80,
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  rowIconWrap: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: DIM,
  },
  rowLabelSelected: {
    color: WHITE,
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
  saveBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: {
    backgroundColor: "#E55A00",
  },
  saveBtnLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
    letterSpacing: 0.3,
  },
});
