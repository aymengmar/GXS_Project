import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { registrationStore } from "@/store/registrationStore";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const BG = "#080D1A";
const ORANGE = "#FF6500";
const IC = "rgba(255,255,255,0.48)";
const FIELD_BG = "rgba(255,255,255,0.06)";
const FIELD_BORDER = "rgba(255,255,255,0.13)";
const SHEET_BG = "#0F1626";
const CARD_BG = "rgba(255,255,255,0.05)";
const CARD_BORDER = "rgba(255,255,255,0.10)";
const CARD_SELECTED_BG = "rgba(255,101,0,0.10)";

// ─── Car Make Data ────────────────────────────────────────────────────────────

type MakeItem = {
  id: string;
  display: string;
  fullName: string;
};

const LOGOS: Record<string, number> = {
  audi:     require("@/assets/car-makes/audi.png"),
  bmw:      require("@/assets/car-makes/bmw.png"),
  citroen:  require("@/assets/car-makes/citroen.png"),
  dacia:    require("@/assets/car-makes/dacia.png"),
  fiat:     require("@/assets/car-makes/fiat.png"),
  ford:     require("@/assets/car-makes/ford.png"),
  hyundai:  require("@/assets/car-makes/hyundai.png"),
  kia:      require("@/assets/car-makes/kia.png"),
  mercedes: require("@/assets/car-makes/mercedes.png"),
  nissan:   require("@/assets/car-makes/nissan.png"),
  opel:     require("@/assets/car-makes/opel.png"),
  peugeot:  require("@/assets/car-makes/peugeot.png"),
  renault:  require("@/assets/car-makes/renault.png"),
  skoda:    require("@/assets/car-makes/skoda.png"),
  toyota:   require("@/assets/car-makes/toyota.png"),
  vw:       require("@/assets/car-makes/vw.png"),
};

const MAKES: MakeItem[] = [
  { id: "vw",       display: "VW",       fullName: "Volkswagen" },
  { id: "mercedes", display: "Mercedes", fullName: "Mercedes-Benz" },
  { id: "bmw",      display: "BMW",      fullName: "BMW" },
  { id: "audi",     display: "Audi",     fullName: "Audi" },
  { id: "opel",     display: "Opel",     fullName: "Opel" },
  { id: "ford",     display: "Ford",     fullName: "Ford" },
  { id: "toyota",   display: "Toyota",   fullName: "Toyota" },
  { id: "renault",  display: "Renault",  fullName: "Renault" },
  { id: "peugeot",  display: "Peugeot",  fullName: "Peugeot" },
  { id: "citroen",  display: "Citroën",  fullName: "Citroën" },
  { id: "fiat",     display: "Fiat",     fullName: "Fiat" },
  { id: "dacia",    display: "Dacia",    fullName: "Dacia" },
  { id: "hyundai",  display: "Hyundai",  fullName: "Hyundai" },
  { id: "kia",      display: "Kia",      fullName: "Kia" },
  { id: "nissan",   display: "Nissan",   fullName: "Nissan" },
  { id: "skoda",    display: "Škoda",    fullName: "Škoda" },
  { id: "other",    display: "Other",    fullName: "" },
];

const MODELS: Record<string, string[]> = {
  vw:       ["Golf", "Polo", "Passat", "Tiguan", "T-Roc", "ID.3", "ID.4", "Caddy", "Transporter"],
  mercedes: ["A-Class", "C-Class", "E-Class", "Sprinter", "Vito", "Citan"],
  bmw:      ["1 Series", "2 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
  audi:     ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  opel:     ["Astra", "Corsa", "Insignia", "Zafira", "Combo", "Movano"],
  ford:     ["Fiesta", "Focus", "Mondeo", "Kuga", "Transit", "Transit Custom"],
  toyota:   ["Yaris", "Corolla", "Camry", "RAV4", "Prius", "Hilux", "Proace"],
  renault:  ["Clio", "Megane", "Zoé", "Kangoo", "Trafic", "Master"],
  peugeot:  ["208", "308", "2008", "3008", "Partner", "Boxer"],
  citroen:  ["C3", "C4", "Berlingo", "Jumpy", "Jumper"],
  fiat:     ["500", "Punto", "Panda", "Tipo", "Doblò", "Ducato"],
  dacia:    ["Sandero", "Duster", "Logan", "Spring"],
  hyundai:  ["i20", "i30", "Tucson", "Kona", "Santa Fe", "H-1"],
  kia:      ["Ceed", "Sportage", "Sorento", "Stonic", "Niro"],
  nissan:   ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "NV200"],
  skoda:    ["Fabia", "Octavia", "Superb", "Karoq", "Kodiaq"],
};

function computeVehicleMakeModel(
  makeId: string | null,
  model: string | null,
  customMake: string,
  customModel: string
): string {
  if (!makeId) return "";
  if (makeId === "other") return customMake.trim();
  const make = MAKES.find((m) => m.id === makeId);
  if (!make || !model) return "";
  if (model === "Other") return `${make.fullName} ${customModel.trim()}`.trim();
  return `${make.fullName} ${model}`;
}

// ─── Insurance Provider Data ──────────────────────────────────────────────────

type InsuranceItem = {
  id: string;
  name: string;
  logo: number | null;
  fallback: string;
};

const INSURANCE_LOGOS: Record<string, number> = {
  allianz:      require("@/assets/insurance-providers/allianz.png"),
  huk:          require("@/assets/insurance-providers/huk.png"),
  axa:          require("@/assets/insurance-providers/axa.png"),
  devk:         require("@/assets/insurance-providers/devk.png"),
  rv:           require("@/assets/insurance-providers/rv.png"),
  ergo:         require("@/assets/insurance-providers/ergo.png"),
  generali:     require("@/assets/insurance-providers/generali.png"),
  zurich:       require("@/assets/insurance-providers/zurich.png"),
  adac:         require("@/assets/insurance-providers/adac.png"),
  cosmosdirekt: require("@/assets/insurance-providers/cosmosdirekt.png"),
  vhv:          require("@/assets/insurance-providers/vhv.png"),
  gothaer:      require("@/assets/insurance-providers/gothaer.png"),
};

const INSURANCE_PROVIDERS: InsuranceItem[] = [
  { id: "allianz",      name: "Allianz",         logo: INSURANCE_LOGOS.allianz,      fallback: "" },
  { id: "huk",          name: "HUK-COBURG",       logo: INSURANCE_LOGOS.huk,          fallback: "" },
  { id: "axa",          name: "AXA",              logo: INSURANCE_LOGOS.axa,          fallback: "" },
  { id: "devk",         name: "DEVK",             logo: INSURANCE_LOGOS.devk,         fallback: "" },
  { id: "rv",           name: "R+V",              logo: INSURANCE_LOGOS.rv,           fallback: "" },
  { id: "ergo",         name: "ERGO",             logo: INSURANCE_LOGOS.ergo,         fallback: "" },
  { id: "generali",     name: "Generali",         logo: INSURANCE_LOGOS.generali,     fallback: "" },
  { id: "zurich",       name: "Zurich",           logo: INSURANCE_LOGOS.zurich,       fallback: "" },
  { id: "adac",         name: "ADAC",             logo: INSURANCE_LOGOS.adac,         fallback: "" },
  { id: "cosmosdirekt", name: "CosmosDirekt",     logo: INSURANCE_LOGOS.cosmosdirekt, fallback: "" },
  { id: "vhv",          name: "VHV",              logo: INSURANCE_LOGOS.vhv,          fallback: "" },
  { id: "gothaer",      name: "Gothaer",          logo: INSURANCE_LOGOS.gothaer,      fallback: "" },
  { id: "wur",          name: "Württembergische", logo: null,                         fallback: "WÜR" },
  { id: "other",        name: "Other",            logo: null,                         fallback: "" },
];

function computeInsuranceProvider(id: string | null, custom: string): string {
  if (!id) return "";
  if (id === "other") return custom.trim();
  return INSURANCE_PROVIDERS.find((p) => p.id === id)?.name ?? "";
}

// ─── Brand Logo Badge (car makes) ────────────────────────────────────────────

const LOGO_SIZE_OVERRIDES: Partial<Record<string, number>> = {
  skoda: 76,
};

function BrandLogo({ item }: { item: MakeItem }) {
  if (item.id === "other") {
    return <CarDetailIcon color={ORANGE} />;
  }
  const size = LOGO_SIZE_OVERRIDES[item.id] ?? 54;
  return (
    <Image
      source={LOGOS[item.id]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

// ─── View-based Icons ─────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <View style={ic.backWrap}>
      <View style={ic.backChevron} />
    </View>
  );
}

function CarDetailIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 26, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 5,
          width: 14,
          height: 9,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 2,
          left: 0,
          right: 0,
          height: 9,
          borderWidth: 2,
          borderRadius: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 3,
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 3,
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 2,
          borderColor: color,
        }}
      />
    </View>
  );
}

function PlateIcon({ color = IC }: { color?: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 14,
        borderWidth: 1.5,
        borderRadius: 3,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: 14, height: 3, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function ShieldIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 20, alignItems: "center" }}>
      <View
        style={{
          width: 16,
          height: 14,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 7,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

function ClipboardIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 20 }}>
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1.5,
          borderRadius: 3,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          width: 8,
          height: 5,
          borderWidth: 1.5,
          borderRadius: 2,
          borderColor: color,
          backgroundColor: BG,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 3,
          width: 10,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 3,
          width: 7,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function CalendarIcon({ color = IC }: { color?: string }) {
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
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          right: 0,
          height: 6,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 4,
          width: 2,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 4,
          width: 2,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function ChevronDown({ color = IC }: { color?: string }) {
  return (
    <View style={ic.chevWrap}>
      <View style={[ic.chevDown, { borderColor: color }]} />
    </View>
  );
}

function ChevronRight({ color = IC }: { color?: string }) {
  return (
    <View style={ic.chevWrap}>
      <View style={[ic.chevRight, { borderColor: color }]} />
    </View>
  );
}

function SearchIcon() {
  const c = "rgba(255,255,255,0.38)";
  return (
    <View style={{ width: 18, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: c,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 6,
          height: 1.5,
          backgroundColor: c,
          borderRadius: 1,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

const ic = StyleSheet.create({
  backWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },
  chevWrap: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  chevDown: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }, { translateY: -2 }],
  },
  chevRight: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "-45deg" }],
  },
});

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress() {
  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>Step 2 of 3 — Your vehicle information</Text>
      <View style={sp.row}>
        <View style={[sp.dot, sp.dotDone]}>
          <Text style={sp.numDone}>1</Text>
        </View>
        <View style={[sp.line, sp.lineDone]} />
        <View style={[sp.dot, sp.dotActive]}>
          <Text style={sp.numActive}>2</Text>
        </View>
        <View style={sp.line} />
        <View style={sp.dot}>
          <Text style={sp.num}>3</Text>
        </View>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { marginBottom: 28 },
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
  num: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.38)" },
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

// ─── Make Card ────────────────────────────────────────────────────────────────

function MakeCard({
  item,
  selected,
  cardWidth,
  onPress,
}: {
  item: MakeItem;
  selected: boolean;
  cardWidth: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[mk.card, { width: cardWidth }, selected && mk.cardSelected]}
    >
      {selected && (
        <View style={mk.checkBadge}>
          <Text style={mk.checkIcon}>✓</Text>
        </View>
      )}

      <View style={mk.logoWrap}>
        <BrandLogo item={item} />
      </View>

      <Text style={[mk.name, selected && mk.nameSelected]} numberOfLines={1}>
        {item.display}
      </Text>
    </Pressable>
  );
}

const mk = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    borderRadius: 14,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  cardSelected: {
    backgroundColor: CARD_SELECTED_BG,
    borderColor: ORANGE,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  checkIcon: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
    lineHeight: 14,
  },
  logoWrap: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
  },
  nameSelected: {
    color: ORANGE,
    fontFamily: "Poppins_600SemiBold",
  },
});

// ─── Model Picker Modal ───────────────────────────────────────────────────────

function ModelPickerModal({
  visible,
  makeDisplay,
  models,
  selectedModel,
  customModel,
  onSelectModel,
  onCustomModelChange,
  onClose,
}: {
  visible: boolean;
  makeDisplay: string;
  models: string[];
  selectedModel: string | null;
  customModel: string;
  onSelectModel: (m: string) => void;
  onCustomModelChange: (t: string) => void;
  onClose: () => void;
}) {
  const allModels = [...models, "Other"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={md.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={md.sheet}>
          <View style={md.sheetHeader}>
            <Text style={md.sheetTitle}>Select {makeDisplay} model</Text>
            <Pressable onPress={onClose} hitSlop={12} style={md.closeBtn}>
              <Text style={md.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={md.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {allModels.map((model) => {
              const isSelected = selectedModel === model;
              return (
                <Pressable
                  key={model}
                  style={md.row}
                  onPress={() => {
                    onSelectModel(model);
                    if (model !== "Other") onClose();
                  }}
                >
                  <Text style={[md.rowText, isSelected && md.rowTextSelected]}>
                    {model}
                  </Text>
                  {isSelected && (
                    <View style={md.checkCircle}>
                      <Text style={md.checkMark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {selectedModel === "Other" && (
              <View style={md.customInputWrap}>
                <TextInput
                  style={md.customInput}
                  placeholder="Enter model name"
                  placeholderTextColor="rgba(255,255,255,0.30)"
                  value={customModel}
                  onChangeText={onCustomModelChange}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={onClose}
                />
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {selectedModel === "Other" && (
            <Pressable
              style={[md.confirmBtn, !customModel.trim() && md.confirmBtnDisabled]}
              onPress={onClose}
              disabled={!customModel.trim()}
            >
              <Text style={md.confirmBtnText}>Confirm model</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "78%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.45)",
  },
  scroll: { paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
  },
  rowTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  customInputWrap: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: FIELD_BG,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },
  customInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  confirmBtn: {
    backgroundColor: ORANGE,
    marginHorizontal: 20,
    marginTop: 12,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});

// ─── Insurance Provider Picker ────────────────────────────────────────────────

function InsuranceLogo({
  item,
  size,
}: {
  item: InsuranceItem;
  size: "field" | "sheet";
}) {
  const imgSize = size === "field" ? 28 : 38;
  const boxSize = size === "field" ? 28 : 48;

  if (item.id === "other") {
    return (
      <View style={[ins.logoBox, { width: boxSize, height: boxSize }]}>
        <ShieldIcon color={size === "field" ? ORANGE : "rgba(255,255,255,0.45)"} />
      </View>
    );
  }

  if (item.logo !== null) {
    return (
      <View style={[ins.logoBox, { width: boxSize, height: boxSize }]}>
        <Image
          source={item.logo}
          style={{ width: imgSize, height: imgSize }}
          contentFit="contain"
        />
      </View>
    );
  }

  // text fallback (e.g. Württembergische)
  return (
    <View
      style={[
        ins.logoBox,
        ins.fallbackBox,
        { width: boxSize, height: boxSize },
      ]}
    >
      <Text style={size === "field" ? ins.fallbackTextSmall : ins.fallbackText}>
        {item.fallback}
      </Text>
    </View>
  );
}

function InsuranceProviderPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedId: string | null;
  onSelect: (item: InsuranceItem) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={ins.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={ins.sheet}>
          <View style={ins.sheetHeader}>
            <Text style={ins.sheetTitle}>Select insurance provider</Text>
            <Pressable onPress={onClose} hitSlop={12} style={ins.closeBtn}>
              <Text style={ins.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={ins.scroll}
            showsVerticalScrollIndicator={false}
          >
            {INSURANCE_PROVIDERS.map((provider) => {
              const isSelected = selectedId === provider.id;
              return (
                <Pressable
                  key={provider.id}
                  style={[ins.row, isSelected && ins.rowSelected]}
                  onPress={() => {
                    onSelect(provider);
                    onClose();
                  }}
                >
                  <InsuranceLogo item={provider} size="sheet" />
                  <Text
                    style={[ins.rowText, isSelected && ins.rowTextSelected]}
                    numberOfLines={1}
                  >
                    {provider.name}
                  </Text>
                  {isSelected && (
                    <View style={ins.checkCircle}>
                      <Text style={ins.checkMark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ins = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.45)",
  },
  scroll: { paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 8,
    marginVertical: 1,
  },
  rowSelected: {
    backgroundColor: "rgba(255,101,0,0.08)",
  },
  rowText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    marginLeft: 14,
  },
  rowTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  checkMark: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  fallbackText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.5,
  },
  fallbackTextSmall: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 8,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.3,
  },
});

// ─── Year Picker Modal ────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: string[] = Array.from(
  { length: CURRENT_YEAR - 1979 },
  (_, i) => String(CURRENT_YEAR - i)
);

function YearPickerModal({
  visible,
  selectedYear,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedYear: string;
  onSelect: (year: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={yr.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={yr.sheet}>
          <View style={yr.sheetHeader}>
            <Text style={yr.sheetTitle}>Select vehicle year</Text>
            <Pressable onPress={onClose} hitSlop={12} style={yr.closeBtn}>
              <Text style={yr.closeX}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={yr.scroll} showsVerticalScrollIndicator={false}>
            {YEARS.map((year) => {
              const isSelected = selectedYear === year;
              return (
                <Pressable
                  key={year}
                  style={[yr.row, isSelected && yr.rowSelected]}
                  onPress={() => {
                    onSelect(year);
                    onClose();
                  }}
                >
                  <Text style={[yr.rowText, isSelected && yr.rowTextSelected]}>
                    {year}
                  </Text>
                  {isSelected && (
                    <View style={yr.checkCircle}>
                      <Text style={yr.checkMark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const yr = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "72%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.45)",
  },
  scroll: { paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowSelected: {
    backgroundColor: "rgba(255,101,0,0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  rowText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
  },
  rowTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnCarDetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [customMake, setCustomMake] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [plate, setPlate] = useState("");
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string | null>(null);
  const [customInsuranceProvider, setCustomInsuranceProvider] = useState("");
  const [insurancePickerVisible, setInsurancePickerVisible] = useState(false);
  const [insuranceError, setInsuranceError] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [yearError, setYearError] = useState("");

  const COLS = 3;
  const H_PAD = 48;
  const GAP = 10;
  const cardWidth = Math.floor((width - H_PAD - GAP * (COLS - 1)) / COLS);

  const filteredMakes = searchQuery.trim()
    ? MAKES.filter(
        (m) =>
          m.display.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MAKES;

  const selectedMake = MAKES.find((m) => m.id === selectedMakeId) ?? null;
  const modelsForMake =
    selectedMakeId && selectedMakeId !== "other"
      ? (MODELS[selectedMakeId] ?? [])
      : [];

  const vehicleMakeModel = computeVehicleMakeModel(
    selectedMakeId,
    selectedModel,
    customMake,
    customModel
  );

  const modelLabel =
    selectedModel === "Other"
      ? customModel.trim() || "Other (enter name)"
      : (selectedModel ?? "Select model");

  const hasValidMakeModel = vehicleMakeModel.trim().length > 0;

  const selectedInsurance =
    selectedInsuranceId
      ? INSURANCE_PROVIDERS.find((p) => p.id === selectedInsuranceId) ?? null
      : null;

  function handleMakePress(item: MakeItem) {
    if (item.id === "other") {
      setSelectedMakeId("other");
      setSelectedModel(null);
      setCustomModel("");
    } else {
      if (selectedMakeId !== item.id) {
        setSelectedModel(null);
        setCustomModel("");
      }
      setSelectedMakeId(item.id);
      setModelModalVisible(true);
    }
  }

  function handleInsuranceSelect(item: InsuranceItem) {
    setSelectedInsuranceId(item.id);
    setInsuranceError("");
    if (item.id !== "other") {
      setCustomInsuranceProvider("");
    }
  }

  function handleContinue() {
    if (!hasValidMakeModel) return;

    const finalInsurance = computeInsuranceProvider(
      selectedInsuranceId,
      customInsuranceProvider
    );

    if (!selectedInsuranceId) {
      setInsuranceError("Please select an insurance provider");
      return;
    }
    if (selectedInsuranceId === "other" && !customInsuranceProvider.trim()) {
      setInsuranceError("Please enter your insurance provider name");
      return;
    }

    if (!vehicleYear) {
      setYearError("Please select a vehicle year");
      return;
    }

    setInsuranceError("");
    setYearError("");
    registrationStore.setOwnCarDetails({
      vehicle_make_model: vehicleMakeModel,
      plate_number: plate.trim(),
      insurance_provider: finalInsurance,
      insurance_number: insuranceNumber.trim(),
      vehicle_year: vehicleYear.trim(),
    });
    router.push("/register/upload-documents?from=own-car" as any);
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
              <BackArrow />
            </Pressable>
            <Text style={s.headerTitle}>Own car details</Text>
            <View style={s.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StepProgress />

            <Text style={s.sectionTitle}>Vehicle make</Text>
            <Text style={s.sectionSubtitle}>Select your car make</Text>

            <View style={s.makeGrid}>
              {filteredMakes.map((item) => (
                <MakeCard
                  key={item.id}
                  item={item}
                  selected={selectedMakeId === item.id}
                  cardWidth={cardWidth}
                  onPress={() => handleMakePress(item)}
                />
              ))}

              {filteredMakes.length === 0 && (
                <View style={s.emptySearch}>
                  <Text style={s.emptySearchText}>No make found</Text>
                </View>
              )}
            </View>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or</Text>
              <View style={s.orLine} />
            </View>

            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                placeholder="Search make"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              <View style={s.searchIconWrap}>
                <SearchIcon />
              </View>
            </View>

            {selectedMakeId === "other" && (
              <>
                <Text style={[s.label, s.labelGap]}>Enter make & model</Text>
                <View style={s.inputRow}>
                  <View style={s.inputIcon}>
                    <CarDetailIcon color={ORANGE} />
                  </View>
                  <TextInput
                    style={s.inputText}
                    placeholder="e.g. Citroën Berlingo 2021"
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    value={customMake}
                    onChangeText={setCustomMake}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            {selectedMakeId && selectedMakeId !== "other" && (
              <>
                <Text style={[s.label, s.labelGap]}>Vehicle model</Text>
                <Pressable
                  style={[s.inputRow, selectedModel ? s.inputRowActive : null]}
                  onPress={() => setModelModalVisible(true)}
                >
                  <View style={s.inputIcon}>
                    <CarDetailIcon color={selectedModel ? ORANGE : IC} />
                  </View>
                  <Text
                    style={[s.inputText, !selectedModel && s.inputPlaceholder]}
                    numberOfLines={1}
                  >
                    {modelLabel}
                  </Text>
                  <ChevronDown color={selectedModel ? ORANGE : IC} />
                </Pressable>
              </>
            )}

            <Text style={[s.label, s.labelGap]}>Plate number</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <PlateIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="e.g. HH-AK 1234"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
              />
            </View>

            {/* Insurance Provider — selectable bottom-sheet field */}
            <Text style={[s.label, s.labelGap]}>Insurance provider</Text>
            <Pressable
              style={[
                s.inputRow,
                selectedInsuranceId ? s.inputRowActive : null,
                !!insuranceError && s.inputRowError,
              ]}
              onPress={() => setInsurancePickerVisible(true)}
            >
              <View style={s.inputIcon}>
                {selectedInsurance ? (
                  <InsuranceLogo item={selectedInsurance} size="field" />
                ) : (
                  <ShieldIcon />
                )}
              </View>

              {selectedInsurance ? (
                <Text style={s.inputText} numberOfLines={1}>
                  {selectedInsurance.name}
                </Text>
              ) : (
                <Text style={[s.inputText, s.inputPlaceholder]}>
                  Select insurance provider
                </Text>
              )}

              <ChevronRight color={selectedInsuranceId ? ORANGE : IC} />
            </Pressable>
            {!!insuranceError && (
              <Text style={s.fieldError}>{insuranceError}</Text>
            )}

            {selectedInsuranceId === "other" && (
              <View style={[s.inputRow, s.customInsuranceRow]}>
                <View style={s.inputIcon}>
                  <ShieldIcon color={ORANGE} />
                </View>
                <TextInput
                  style={s.inputText}
                  placeholder="Enter provider name"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  value={customInsuranceProvider}
                  onChangeText={(t) => {
                    setCustomInsuranceProvider(t);
                    if (t.trim()) setInsuranceError("");
                  }}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
            )}

            <Text style={[s.label, s.labelGap]}>Insurance number</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}>
                <ClipboardIcon />
              </View>
              <TextInput
                style={s.inputText}
                placeholder="Enter insurance number"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                autoCapitalize="none"
              />
            </View>

            <Text style={[s.label, s.labelGap]}>Vehicle year</Text>
            <Pressable
              style={[
                s.inputRow,
                vehicleYear ? s.inputRowActive : null,
                !!yearError && s.inputRowError,
              ]}
              onPress={() => setYearPickerVisible(true)}
            >
              <View style={s.inputIcon}>
                <CalendarIcon color={vehicleYear ? ORANGE : IC} />
              </View>
              <Text
                style={[s.inputText, !vehicleYear && s.inputPlaceholder]}
                numberOfLines={1}
              >
                {vehicleYear || "Select vehicle year"}
              </Text>
              <ChevronRight color={vehicleYear ? ORANGE : IC} />
            </Pressable>
            {!!yearError && (
              <Text style={s.fieldError}>{yearError}</Text>
            )}

            <Pressable
              style={[s.continueBtn, (!hasValidMakeModel || !vehicleYear) && s.continueBtnDisabled]}
              onPress={handleContinue}
            >
              <Text style={s.continueBtnText}>Continue to documents →</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {selectedMake && selectedMake.id !== "other" && (
        <ModelPickerModal
          visible={modelModalVisible}
          makeDisplay={selectedMake.display}
          models={modelsForMake}
          selectedModel={selectedModel}
          customModel={customModel}
          onSelectModel={setSelectedModel}
          onCustomModelChange={setCustomModel}
          onClose={() => setModelModalVisible(false)}
        />
      )}

      <InsuranceProviderPickerModal
        visible={insurancePickerVisible}
        selectedId={selectedInsuranceId}
        onSelect={handleInsuranceSelect}
        onClose={() => setInsurancePickerVisible(false)}
      />

      <YearPickerModal
        visible={yearPickerVisible}
        selectedYear={vehicleYear}
        onSelect={(year) => {
          setVehicleYear(year);
          setYearError("");
        }}
        onClose={() => setYearPickerVisible(false)}
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

  scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: "#fff",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 18,
  },

  makeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emptySearch: {
    flex: 1,
    paddingVertical: 20,
    alignItems: "center",
  },
  emptySearchText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  orText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    marginHorizontal: 12,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderWidth: 1.5,
    borderColor: FIELD_BORDER,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  searchIconWrap: { marginLeft: 8 },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 7,
  },
  labelGap: { marginTop: 16 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderWidth: 1.5,
    borderColor: FIELD_BORDER,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 14,
  },
  inputRowActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.06)",
  },
  inputRowError: {
    borderColor: "#FF4444",
  },
  customInsuranceRow: {
    marginTop: 10,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.06)",
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  inputPlaceholder: {
    color: "rgba(255,255,255,0.28)",
  },

  fieldError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#FF4444",
    marginTop: 5,
    marginLeft: 4,
  },

  continueBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
