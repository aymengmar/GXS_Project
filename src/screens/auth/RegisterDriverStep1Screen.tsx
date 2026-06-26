import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendEmailVerificationCode, verifyEmailCode } from "@/api/backendClient";
import { registrationStore } from "@/store/registrationStore";

type DriverType = "own_car" | "company_car";

const BG = "#080D1A";
const ORANGE = "#FF6500";
const IC = "rgba(255,255,255,0.48)";
const FIELD_BG = "rgba(255,255,255,0.06)";
const FIELD_BORDER = "rgba(255,255,255,0.13)";

// ─── Country data ─────────────────────────────────────────────────────────────

type Country = { code: string; name: string; flag: string; dial: string };

const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫", dial: "+93" },
  { code: "AL", name: "Albania", flag: "🇦🇱", dial: "+355" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", dial: "+213" },
  { code: "AD", name: "Andorra", flag: "🇦🇩", dial: "+376" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dial: "+244" },
  { code: "AG", name: "Antigua & Barbuda", flag: "🇦🇬", dial: "+1-268" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dial: "+54" },
  { code: "AM", name: "Armenia", flag: "🇦🇲", dial: "+374" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61" },
  { code: "AT", name: "Austria", flag: "🇦🇹", dial: "+43" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", dial: "+994" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", dial: "+1-242" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", dial: "+973" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", dial: "+880" },
  { code: "BB", name: "Barbados", flag: "🇧🇧", dial: "+1-246" },
  { code: "BY", name: "Belarus", flag: "🇧🇾", dial: "+375" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", dial: "+32" },
  { code: "BZ", name: "Belize", flag: "🇧🇿", dial: "+501" },
  { code: "BJ", name: "Benin", flag: "🇧🇯", dial: "+229" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹", dial: "+975" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", dial: "+591" },
  { code: "BA", name: "Bosnia & Herzegovina", flag: "🇧🇦", dial: "+387" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dial: "+267" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55" },
  { code: "BN", name: "Brunei", flag: "🇧🇳", dial: "+673" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", dial: "+359" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dial: "+257" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻", dial: "+238" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", dial: "+855" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", dial: "+237" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1" },
  { code: "CF", name: "Central African Rep.", flag: "🇨🇫", dial: "+236" },
  { code: "TD", name: "Chad", flag: "🇹🇩", dial: "+235" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dial: "+56" },
  { code: "CN", name: "China", flag: "🇨🇳", dial: "+86" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dial: "+57" },
  { code: "KM", name: "Comoros", flag: "🇰🇲", dial: "+269" },
  { code: "CG", name: "Congo", flag: "🇨🇬", dial: "+242" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dial: "+506" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", dial: "+385" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dial: "+53" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", dial: "+357" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", dial: "+420" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", dial: "+45" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", dial: "+253" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴", dial: "+1-809" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩", dial: "+243" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dial: "+593" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dial: "+20" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dial: "+503" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", dial: "+240" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷", dial: "+291" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", dial: "+372" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", dial: "+268" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dial: "+251" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯", dial: "+679" },
  { code: "FI", name: "Finland", flag: "🇫🇮", dial: "+358" },
  { code: "FR", name: "France", flag: "🇫🇷", dial: "+33" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", dial: "+241" },
  { code: "GM", name: "Gambia", flag: "🇬🇲", dial: "+220" },
  { code: "GE", name: "Georgia", flag: "🇬🇪", dial: "+995" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "+233" },
  { code: "GR", name: "Greece", flag: "🇬🇷", dial: "+30" },
  { code: "GD", name: "Grenada", flag: "🇬🇩", dial: "+1-473" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dial: "+502" },
  { code: "GN", name: "Guinea", flag: "🇬🇳", dial: "+224" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", dial: "+245" },
  { code: "GY", name: "Guyana", flag: "🇬🇾", dial: "+592" },
  { code: "HT", name: "Haiti", flag: "🇭🇹", dial: "+509" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dial: "+504" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", dial: "+36" },
  { code: "IS", name: "Iceland", flag: "🇮🇸", dial: "+354" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dial: "+62" },
  { code: "IR", name: "Iran", flag: "🇮🇷", dial: "+98" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", dial: "+964" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dial: "+353" },
  { code: "IL", name: "Israel", flag: "🇮🇱", dial: "+972" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dial: "+39" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", dial: "+225" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", dial: "+1-876" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dial: "+81" },
  { code: "JO", name: "Jordan", flag: "🇯🇴", dial: "+962" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", dial: "+7" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "+254" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", dial: "+686" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", dial: "+965" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", dial: "+996" },
  { code: "LA", name: "Laos", flag: "🇱🇦", dial: "+856" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", dial: "+371" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", dial: "+961" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", dial: "+266" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", dial: "+231" },
  { code: "LY", name: "Libya", flag: "🇱🇾", dial: "+218" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", dial: "+423" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", dial: "+370" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dial: "+352" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", dial: "+261" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", dial: "+265" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60" },
  { code: "MV", name: "Maldives", flag: "🇲🇻", dial: "+960" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dial: "+223" },
  { code: "MT", name: "Malta", flag: "🇲🇹", dial: "+356" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭", dial: "+692" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷", dial: "+222" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", dial: "+230" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dial: "+52" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲", dial: "+691" },
  { code: "MD", name: "Moldova", flag: "🇲🇩", dial: "+373" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", dial: "+377" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", dial: "+976" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", dial: "+382" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", dial: "+212" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", dial: "+258" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", dial: "+95" },
  { code: "NA", name: "Namibia", flag: "🇳🇦", dial: "+264" },
  { code: "NR", name: "Nauru", flag: "🇳🇷", dial: "+674" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", dial: "+977" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dial: "+31" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dial: "+64" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dial: "+505" },
  { code: "NE", name: "Niger", flag: "🇳🇪", dial: "+227" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰", dial: "+389" },
  { code: "NO", name: "Norway", flag: "🇳🇴", dial: "+47" },
  { code: "OM", name: "Oman", flag: "🇴🇲", dial: "+968" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dial: "+92" },
  { code: "PW", name: "Palau", flag: "🇵🇼", dial: "+680" },
  { code: "PA", name: "Panama", flag: "🇵🇦", dial: "+507" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬", dial: "+675" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dial: "+595" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dial: "+51" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dial: "+63" },
  { code: "PL", name: "Poland", flag: "🇵🇱", dial: "+48" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dial: "+351" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", dial: "+974" },
  { code: "RO", name: "Romania", flag: "🇷🇴", dial: "+40" },
  { code: "RU", name: "Russia", flag: "🇷🇺", dial: "+7" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dial: "+250" },
  { code: "KN", name: "Saint Kitts & Nevis", flag: "🇰🇳", dial: "+1-869" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨", dial: "+1-758" },
  { code: "VC", name: "Saint Vincent", flag: "🇻🇨", dial: "+1-784" },
  { code: "WS", name: "Samoa", flag: "🇼🇸", dial: "+685" },
  { code: "SM", name: "San Marino", flag: "🇸🇲", dial: "+378" },
  { code: "ST", name: "São Tomé & Príncipe", flag: "🇸🇹", dial: "+239" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dial: "+966" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", dial: "+221" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", dial: "+381" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", dial: "+248" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", dial: "+232" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dial: "+65" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", dial: "+421" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", dial: "+386" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧", dial: "+677" },
  { code: "SO", name: "Somalia", flag: "🇸🇴", dial: "+252" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸", dial: "+211" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dial: "+34" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", dial: "+94" },
  { code: "SD", name: "Sudan", flag: "🇸🇩", dial: "+249" },
  { code: "SR", name: "Suriname", flag: "🇸🇷", dial: "+597" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dial: "+46" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", dial: "+41" },
  { code: "SY", name: "Syria", flag: "🇸🇾", dial: "+963" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", dial: "+886" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯", dial: "+992" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", dial: "+255" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dial: "+66" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", dial: "+670" },
  { code: "TG", name: "Togo", flag: "🇹🇬", dial: "+228" },
  { code: "TO", name: "Tonga", flag: "🇹🇴", dial: "+676" },
  { code: "TT", name: "Trinidad & Tobago", flag: "🇹🇹", dial: "+1-868" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", dial: "+216" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dial: "+90" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲", dial: "+993" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", dial: "+688" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", dial: "+256" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", dial: "+380" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "+971" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44" },
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dial: "+598" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", dial: "+998" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", dial: "+678" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dial: "+58" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dial: "+84" },
  { code: "YE", name: "Yemen", flag: "🇾🇪", dial: "+967" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", dial: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dial: "+263" },
];

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "DE")!;

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <View style={ic.backWrap}>
      <View style={ic.backChevron} />
    </View>
  );
}

function PersonIcon({ color = IC }: { color?: string }) {
  return (
    <View style={ic.personWrap}>
      <View style={[ic.personHead, { borderColor: color }]} />
      <View style={[ic.personShoulder, { borderColor: color }]} />
    </View>
  );
}

function MailIcon({ color = IC }: { color?: string }) {
  return (
    <View style={[ic.mailBody, { borderColor: color }]}>
      <View style={[ic.mailFlapL, { borderColor: color }]} />
      <View style={[ic.mailFlapR, { borderColor: color }]} />
    </View>
  );
}

function LocationIcon({ color = IC }: { color?: string }) {
  return (
    <View style={ic.locWrap}>
      <View style={[ic.locCircle, { borderColor: color }]} />
      <View style={[ic.locTip, { borderTopColor: color }]} />
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

function CarIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 28, height: 20 }}>
      <View style={{
        position: "absolute", top: 0, left: 5, width: 14, height: 9,
        borderTopLeftRadius: 4, borderTopRightRadius: 4,
        borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
        borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 3, left: 0, right: 0, height: 9,
        borderWidth: 1.5, borderRadius: 2, borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 0, left: 2,
        width: 8, height: 8, borderRadius: 4,
        borderWidth: 1.5, borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 0, right: 2,
        width: 8, height: 8, borderRadius: 4,
        borderWidth: 1.5, borderColor: color,
      }} />
    </View>
  );
}

function VanIcon({ color = IC }: { color?: string }) {
  return (
    <View style={{ width: 30, height: 20 }}>
      <View style={{
        position: "absolute", top: 0, left: 0, width: 20, height: 13,
        borderWidth: 1.5, borderRadius: 2, borderColor: color,
      }} />
      <View style={{
        position: "absolute", top: 2, right: 0, width: 10, height: 11,
        borderTopRightRadius: 3, borderBottomRightRadius: 2,
        borderTopWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5,
        borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 0, left: 2,
        width: 8, height: 8, borderRadius: 4,
        borderWidth: 1.5, borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 0, right: 1,
        width: 8, height: 8, borderRadius: 4,
        borderWidth: 1.5, borderColor: color,
      }} />
    </View>
  );
}

const ic = StyleSheet.create({
  backWrap: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  backChevron: {
    width: 10, height: 10,
    borderLeftWidth: 2.5, borderBottomWidth: 2.5,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },

  personWrap: { width: 18, height: 18, alignItems: "center", justifyContent: "flex-end" },
  personHead: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  personShoulder: {
    width: 14, height: 6,
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
    marginTop: 2,
  },

  mailBody: { width: 18, height: 13, borderWidth: 1.5, borderRadius: 2, overflow: "hidden" },
  mailFlapL: { position: "absolute", top: -3, left: -3, width: 13, height: 10, borderRightWidth: 1.5, transform: [{ rotate: "22deg" }] },
  mailFlapR: { position: "absolute", top: -3, right: -3, width: 13, height: 10, borderLeftWidth: 1.5, transform: [{ rotate: "-22deg" }] },

  locWrap: { width: 14, height: 18, alignItems: "center" },
  locCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  locTip: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent" },

  chevWrap: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  chevDown: { width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: "45deg" }, { translateY: -2 }] },
});

// ─── Country Picker Modal ─────────────────────────────────────────────────────

function CountryPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q),
    );
  }, [search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={pm.overlay}>
        <SafeAreaView style={pm.sheet} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={pm.header}>
            <Text style={pm.title}>Select country</Text>
            <Pressable onPress={onClose} hitSlop={12} style={pm.closeBtn}>
              <View style={pm.closeX1} />
              <View style={pm.closeX2} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={pm.searchRow}>
            <TextInput
              style={pm.searchInput}
              placeholder="Search country or code…"
              placeholderTextColor="rgba(255,255,255,0.32)"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.code === selected.code;
              return (
                <Pressable
                  style={[pm.row, isSelected && pm.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={pm.rowFlag}>{item.flag}</Text>
                  <Text style={pm.rowCode}>{item.code}</Text>
                  <Text style={pm.rowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={[pm.rowDial, isSelected && pm.rowDialSelected]}>
                    {item.dial}
                  </Text>
                  {isSelected && <View style={pm.checkDot} />}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={pm.sep} />}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0E1525",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX1: {
    position: "absolute",
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
    transform: [{ rotate: "45deg" }],
  },
  closeX2: {
    position: "absolute",
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
    transform: [{ rotate: "-45deg" }],
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  rowSelected: {
    backgroundColor: "rgba(255,101,0,0.08)",
  },
  rowFlag: {
    fontSize: 22,
    width: 34,
  },
  rowCode: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
    width: 36,
    marginRight: 4,
  },
  rowName: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
  },
  rowDial: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
    marginLeft: 8,
  },
  rowDialSelected: {
    color: ORANGE,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
    marginLeft: 10,
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
  },
});

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress() {
  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>Step 1 of 3 — Choose your driver type</Text>
      <View style={sp.row}>
        <View style={[sp.dot, sp.dotActive]}>
          <Text style={sp.numActive}>1</Text>
        </View>
        <View style={sp.line} />
        <View style={sp.dot}>
          <Text style={sp.num}>2</Text>
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
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  dotActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  num: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
  },
  numActive: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginHorizontal: 4,
  },
});

// ─── Driver Type Card ─────────────────────────────────────────────────────────

function DriverTypeCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[dt.card, selected && dt.cardSelected]}
      onPress={onPress}
    >
      <View style={[dt.radio, selected && dt.radioSelected]}>
        {selected && <View style={dt.radioDot} />}
      </View>
      <View style={dt.iconBox}>
        {icon}
      </View>
      <View style={dt.textCol}>
        <Text style={[dt.title, selected && dt.titleSelected]}>{title}</Text>
        <Text style={dt.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const dt = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderWidth: 1.5,
    borderColor: FIELD_BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.06)",
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  radioSelected: { borderColor: ORANGE },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  iconBox: {
    width: 40, height: 40,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  textCol: { flex: 1 },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
  },
  titleSelected: { color: "#fff" },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 17,
  },
});

// ─── Email Verify Modal ───────────────────────────────────────────────────────

function ModalLockIcon() {
  return (
    <View style={{ width: 36, height: 38, alignItems: "center" }}>
      <View style={{
        width: 22, height: 16, borderRadius: 4,
        borderWidth: 2.5, borderColor: ORANGE,
        position: "absolute", bottom: 0,
        alignItems: "center", justifyContent: "center",
      }}>
        <View style={{ width: 3, height: 7, backgroundColor: ORANGE, borderRadius: 2 }} />
      </View>
      <View style={{
        width: 14, height: 13,
        borderTopLeftRadius: 7, borderTopRightRadius: 7,
        borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
        borderColor: ORANGE,
        position: "absolute", top: 0,
      }} />
    </View>
  );
}

function EmailVerifyModal({
  visible,
  email,
  code,
  onCodeChange,
  error,
  verifyLoading,
  sendLoading,
  cooldown,
  onVerify,
  onResend,
  onClose,
}: {
  visible: boolean;
  email: string;
  code: string;
  onCodeChange: (v: string) => void;
  error?: string;
  verifyLoading: boolean;
  sendLoading: boolean;
  cooldown: number;
  onVerify: () => void;
  onResend: () => void;
  onClose: () => void;
}) {
  const hiddenInputRef = useRef<TextInput>(null);
  const canVerify = code.length === 6 && !verifyLoading;
  const digits = (code.split("").concat(Array(6 - code.length).fill(""))) as string[];
  const activeIdx = Math.min(code.length, 5);

  const timerLabel =
    cooldown >= 60
      ? `${Math.ceil(cooldown / 60)} minutes`
      : cooldown > 0
        ? `${cooldown} seconds`
        : null;

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => hiddenInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={mv.overlay}>
        <View style={mv.card}>
          {/* X close */}
          <Pressable onPress={onClose} hitSlop={12} style={mv.closeBtn}>
            <View style={mv.closeX1} />
            <View style={mv.closeX2} />
          </Pressable>

          {/* Lock icon circle */}
          <View style={mv.iconCircle}>
            <ModalLockIcon />
          </View>

          {/* Title */}
          <Text style={mv.title}>Verification Code</Text>

          {/* Subtitle + email */}
          <Text style={mv.sub}>We've sent a 6-digit code to your email</Text>
          <Text style={mv.emailHighlight} numberOfLines={1}>{email}</Text>

          {/* 6 digit boxes */}
          <Pressable style={mv.boxesRow} onPress={() => hiddenInputRef.current?.focus()}>
            {digits.map((d, i) => (
              <View
                key={i}
                style={[
                  mv.digitBox,
                  i === activeIdx && mv.digitBoxActive,
                  !!error && mv.digitBoxError,
                ]}
              >
                <Text style={mv.digitText}>{d}</Text>
              </View>
            ))}
          </Pressable>

          {/* Hidden input */}
          <TextInput
            ref={hiddenInputRef}
            style={mv.hiddenInput}
            value={code}
            onChangeText={(t) => onCodeChange(t.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            caretHidden
          />

          {/* Error or expiry line */}
          {error ? (
            <Text style={mv.errorText}>{error}</Text>
          ) : timerLabel ? (
            <Text style={mv.timerText}>
              Code expires in <Text style={mv.timerHighlight}>{timerLabel}</Text>
            </Text>
          ) : (
            <View style={{ height: 20 }} />
          )}

          {/* Verify button */}
          <Pressable
            style={[mv.verifyBtn, !canVerify && mv.verifyBtnDisabled]}
            onPress={onVerify}
            disabled={!canVerify}
          >
            {verifyLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={mv.verifyBtnText}>Verify Code</Text>
            )}
          </Pressable>

          {/* Resend — always visible, grayed during cooldown */}
          <Pressable
            onPress={onResend}
            disabled={cooldown > 0 || sendLoading}
            hitSlop={8}
            style={mv.resendBtn}
          >
            <Text style={[mv.resendText, (cooldown > 0 || sendLoading) && mv.resendDisabled]}>
              {sendLoading ? "Sending…" : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const mv = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0E1525",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX1: {
    position: "absolute",
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "45deg" }],
  },
  closeX2: {
    position: "absolute",
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-45deg" }],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,101,0,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,101,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.50)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 2,
  },
  emailHighlight: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    marginBottom: 18,
  },
  boxesRow: {
    flexDirection: "row",
    gap: 8,
  },
  digitBox: {
    width: 42,
    height: 50,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  digitBoxActive: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.08)",
  },
  digitBoxError: {
    borderColor: "rgba(239,68,68,0.55)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  digitText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#fff",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#FCA5A5",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  timerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  timerHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: ORANGE,
  },
  verifyBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 50,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verifyBtnDisabled: {
    opacity: 0.38,
  },
  verifyBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  resendBtn: {
    paddingVertical: 4,
  },
  resendText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    textAlign: "center",
  },
  resendDisabled: {
    color: "rgba(255,255,255,0.28)",
  },
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFirstName(v: string): string | undefined {
  const t = v.trim();
  if (!t) return "First name is required.";
  if (t.length < 2) return "First name must be at least 2 characters.";
}

function validateLastName(v: string): string | undefined {
  const t = v.trim();
  if (!t) return "Last name is required.";
  if (t.length < 2) return "Last name must be at least 2 characters.";
}

function validateEmail(v: string): string | undefined {
  const t = v.trim();
  if (!t) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Please enter a valid email address.";
}

function validatePhone(v: string, dialCode: string): string | undefined {
  const t = v.trim();
  if (!t) return "Phone number is required.";
  if (/[^0-9]/.test(t)) return "Digits only — no +, spaces, or letters.";
  if (dialCode === "+49") {
    const local = t.startsWith("0") ? t.slice(1) : t;
    if (local.length !== 11) return "Enter 11 digits after the leading 0 (German number).";
    return undefined;
  }
  if (dialCode === "+216") {
    if (t.length !== 8) return "Tunisian number must be exactly 8 digits.";
    return undefined;
  }
  if (t.length < 5) return "Phone number is too short.";
  if (t.length > 15) return "Phone number is too long.";
}

function validatePostalCode(v: string): string | undefined {
  const t = v.trim();
  if (!t) return "Postal code is required.";
  if (!/^\d{5}$/.test(t)) return "Postal code must be exactly 5 digits.";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  driverType?: string;
};

export default function RegisterDriverStep1Screen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [driverType, setDriverType] = useState<DriverType | null>(null);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | undefined>();
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const isFormValid = useMemo(
    () =>
      !validateFirstName(firstName) &&
      !validateLastName(lastName) &&
      !validateEmail(email) &&
      !validatePhone(phone, country.dial) &&
      !validatePostalCode(postalCode) &&
      Boolean(driverType),
    [firstName, lastName, email, phone, postalCode, driverType, country.dial],
  );

  function setFieldError(field: keyof FormErrors, error: string | undefined) {
    setErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function startCooldown() {
    setCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleContinue() {
    const errs: FormErrors = {};
    const e1 = validateFirstName(firstName); if (e1) errs.firstName = e1;
    const e2 = validateLastName(lastName); if (e2) errs.lastName = e2;
    const e3 = validateEmail(email); if (e3) errs.email = e3;
    const e4 = validatePhone(phone, country.dial); if (e4) errs.phone = e4;
    const e5 = validatePostalCode(postalCode); if (e5) errs.postalCode = e5;
    if (!driverType) errs.driverType = "Please select a driver type.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const ph = phone.trim();
    const dialCode = country.dial;
    const normalizedLocal = dialCode === "+49" && ph.startsWith("0") ? ph.slice(1) : ph;
    const fullPhone = `${dialCode}${normalizedLocal}`;

    registrationStore.set({
      email: email.trim(),
      postal_code: postalCode.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: fullPhone,
      car_type: driverType as DriverType,
    });

    setSendLoading(true);
    try {
      await sendEmailVerificationCode(email.trim());
      setVerifyCode("");
      setVerifyError(undefined);
      setShowVerifyModal(true);
      startCooldown();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        email: err instanceof Error ? err.message : "Failed to send verification code.",
      }));
    } finally {
      setSendLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || sendLoading) return;
    setSendLoading(true);
    try {
      await sendEmailVerificationCode(email.trim());
      setVerifyCode("");
      setVerifyError(undefined);
      startCooldown();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setSendLoading(false);
    }
  }

  async function handleVerify() {
    if (verifyCode.length !== 6 || verifyLoading) return;
    setVerifyLoading(true);
    setVerifyError(undefined);
    try {
      const result = await verifyEmailCode(email.trim(), verifyCode);
      if (result.verified && result.auth_user_id && result.access_token) {
        registrationStore.setVerified({
          auth_user_id: result.auth_user_id,
          access_token: result.access_token,
        });
        setShowVerifyModal(false);
        if (driverType === "own_car") {
          router.push("/register/own-car-details" as any);
        } else {
          router.push("/register/upload-documents" as any);
        }
      } else {
        setVerifyError(result.message || "Verification failed. Please try again.");
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Wrong code. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
              <BackArrow />
            </Pressable>
            <Text style={s.headerTitle}>Register as driver</Text>
            <View style={s.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Step indicator ─────────────────────────────────────── */}
            <StepProgress />

            {/* ── Section heading ────────────────────────────────────── */}
            <Text style={s.sectionTitle}>Personal information</Text>
            <Text style={s.sectionSub}>
              Fill in your details and select your driver type
            </Text>

            {/* ── First name ─────────────────────────────────────────── */}
            <Text style={[s.label, s.labelFirst]}>First name</Text>
            <View style={[s.inputRow, errors.firstName ? s.inputRowError : null]}>
              <View style={s.inputIcon}><PersonIcon color={errors.firstName ? "#FCA5A5" : IC} /></View>
              <TextInput
                style={s.inputText}
                placeholder="Enter first name"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => setFieldError("firstName", validateFirstName(firstName))}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => {
                  const err = validateFirstName(firstName);
                  setFieldError("firstName", err);
                  if (!err) lastNameRef.current?.focus();
                }}
              />
            </View>
            {errors.firstName ? <Text style={s.fieldError}>{errors.firstName}</Text> : null}

            {/* ── Last name ──────────────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Last name</Text>
            <View style={[s.inputRow, errors.lastName ? s.inputRowError : null]}>
              <View style={s.inputIcon}><PersonIcon color={errors.lastName ? "#FCA5A5" : IC} /></View>
              <TextInput
                ref={lastNameRef}
                style={s.inputText}
                placeholder="Enter last name"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => setFieldError("lastName", validateLastName(lastName))}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => {
                  const err = validateLastName(lastName);
                  setFieldError("lastName", err);
                  if (!err) emailRef.current?.focus();
                }}
              />
            </View>
            {errors.lastName ? <Text style={s.fieldError}>{errors.lastName}</Text> : null}

            {/* ── Email ──────────────────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Email address</Text>
            <View style={[s.inputRow, errors.email ? s.inputRowError : null]}>
              <View style={s.inputIcon}><MailIcon color={errors.email ? "#FCA5A5" : IC} /></View>
              <TextInput
                ref={emailRef}
                style={s.inputText}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setFieldError("email", validateEmail(email))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => {
                  const err = validateEmail(email);
                  setFieldError("email", err);
                  if (!err) phoneRef.current?.focus();
                }}
              />
            </View>
            {errors.email ? <Text style={s.fieldError}>{errors.email}</Text> : null}

            {/* ── Phone ──────────────────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Phone number</Text>
            <View style={[s.inputRow, errors.phone ? s.inputRowError : null]}>
              {/* Country code selector */}
              <Pressable
                style={s.phonePrefix}
                onPress={() => setShowPicker(true)}
                hitSlop={4}
              >
                <Text style={s.phoneFlag}>{country.flag}</Text>
                <Text style={s.phoneCode}>{country.dial}</Text>
                <ChevronDown color="rgba(255,255,255,0.40)" />
                <View style={s.phoneDivider} />
              </Pressable>
              <TextInput
                ref={phoneRef}
                style={[s.inputText, { flex: 1 }]}
                placeholder="Local number (digits only)"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={phone}
                onChangeText={setPhone}
                onBlur={() => setFieldError("phone", validatePhone(phone, country.dial))}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => {
                  const err = validatePhone(phone, country.dial);
                  setFieldError("phone", err);
                  if (!err) postalRef.current?.focus();
                }}
              />
            </View>
            {errors.phone ? <Text style={s.fieldError}>{errors.phone}</Text> : null}

            {/* ── Postal code ────────────────────────────────────────── */}
            <Text style={[s.label, s.labelGap]}>Postal code</Text>
            <View style={[s.inputRow, errors.postalCode ? s.inputRowError : null]}>
              <View style={s.inputIcon}><LocationIcon color={errors.postalCode ? "#FCA5A5" : IC} /></View>
              <TextInput
                ref={postalRef}
                style={[s.inputText, { flex: 1 }]}
                placeholder="Enter postal code"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={postalCode}
                onChangeText={setPostalCode}
                onBlur={() => setFieldError("postalCode", validatePostalCode(postalCode))}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={5}
                returnKeyType="done"
                onSubmitEditing={() => {
                  const err = validatePostalCode(postalCode);
                  setFieldError("postalCode", err);
                }}
              />
            </View>
            {errors.postalCode ? <Text style={s.fieldError}>{errors.postalCode}</Text> : null}

            {/* ── Driver type ────────────────────────────────────────── */}
            <Text style={s.driverTypeHeading}>Driver type</Text>

            <DriverTypeCard
              icon={<CarIcon color={driverType === "own_car" ? ORANGE : "rgba(255,255,255,0.52)"} />}
              title="Own car driver"
              subtitle={"Higher rates · Cover own car costs"}
              selected={driverType === "own_car"}
              onPress={() => { setDriverType("own_car"); setFieldError("driverType", undefined); }}
            />

            <DriverTypeCard
              icon={<VanIcon color={driverType === "company_car" ? ORANGE : "rgba(255,255,255,0.52)"} />}
              title="Company car driver"
              subtitle={"Standard rate · Company provides car"}
              selected={driverType === "company_car"}
              onPress={() => { setDriverType("company_car"); setFieldError("driverType", undefined); }}
            />

            {errors.driverType ? <Text style={s.fieldError}>{errors.driverType}</Text> : null}

            {/* ── Continue ───────────────────────────────────────────── */}
            <Pressable
              style={[s.continueBtn, (!isFormValid || sendLoading) && s.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isFormValid || sendLoading}
            >
              {sendLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.continueBtnText}>Continue →</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Country picker modal ───────────────────────────────────── */}
      <CountryPickerModal
        visible={showPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowPicker(false)}
      />

      {/* ── Email verification modal ───────────────────────────────── */}
      <EmailVerifyModal
        visible={showVerifyModal}
        email={email.trim()}
        code={verifyCode}
        onCodeChange={setVerifyCode}
        error={verifyError}
        verifyLoading={verifyLoading}
        sendLoading={sendLoading}
        cooldown={cooldown}
        onVerify={handleVerify}
        onResend={handleResend}
        onClose={() => setShowVerifyModal(false)}
      />
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

  scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },

  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
    marginBottom: 5,
  },
  sectionSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
    marginBottom: 22,
  },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 7,
  },
  labelFirst: { marginTop: 0 },
  labelGap: { marginTop: 14 },

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
  inputRowError: {
    borderColor: "rgba(239,68,68,0.60)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  fieldError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#FCA5A5",
    marginTop: 5,
    marginLeft: 2,
  },

  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  phoneFlag: { fontSize: 18, marginRight: 5 },
  phoneCode: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
    marginRight: 5,
  },
  phoneDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginLeft: 8,
  },

  driverTypeHeading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
    marginTop: 26,
    marginBottom: 14,
  },

  continueBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
