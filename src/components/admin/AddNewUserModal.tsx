import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  adminCreateDriver,
  adminCreateWarehouseUser,
  CreateDriverResponse,
  CreateWarehouseUserResponse,
} from "@/api/backendClient";

const SCREEN_H = Dimensions.get("window").height;

// ─── palette ──────────────────────────────────────────────────────────────────
const OVERLAY   = "rgba(0,0,0,0.82)";
const SHEET_BG  = "#0D1520";
const FIELD_BG  = "#0A1628";
const BORDER    = "rgba(255,255,255,0.08)";
const ORANGE    = "#FF6500";
const WHITE     = "#FFFFFF";
const DIM       = "rgba(255,255,255,0.55)";
const MUTED     = "rgba(255,255,255,0.28)";
const HANDLE    = "rgba(255,255,255,0.20)";

// ─── icons ────────────────────────────────────────────────────────────────────
function XIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={WHITE}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={MUTED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={MUTED} strokeWidth={1.8} />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={MUTED} strokeWidth={1.8} />
      <Path
        d="M2 7l10 7 10-7"
        stroke={MUTED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ZipIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 10h16M4 14h8M4 18h5"
        stroke={MUTED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapPinIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={MUTED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={MUTED} strokeWidth={1.8} />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={MUTED}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IdBadgeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={MUTED} strokeWidth={1.8} />
      <Path d="M7 9h4M7 13h8M7 17h5" stroke={MUTED} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PhoneIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 0.8h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6.72 6.72l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={MUTED}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={20} viewBox="0 0 24 20" fill="none">
      <Path
        d="M5 9l2.5-5h9L19 9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="2" y="9" width="20" height="8" rx="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="7" cy="17" r="2" stroke={color} strokeWidth={1.8} />
      <Circle cx="17" cy="17" r="2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function BuildingIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v2M12 11v2M16 11v2M8 15v2M12 15v2M16 15v2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SaveIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={WHITE}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 21v-8H7v8M7 3v5h8"
        stroke={WHITE}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── reusable text field ──────────────────────────────────────────────────────
type FieldProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
};

function Field({
  left,
  right,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={f.wrap}>
      {left && <View style={f.iconLeft}>{left}</View>}
      <TextInput
        style={[f.input, !left && { paddingLeft: 16 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        selectionColor={ORANGE}
      />
      {right && <View style={f.iconRight}>{right}</View>}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    minHeight: 52,
  },
  iconLeft:  { paddingLeft: 14, paddingRight: 4 },
  iconRight: { paddingRight: 14 },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: WHITE,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
});

// ─── phone field ──────────────────────────────────────────────────────────────
function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={ph.wrap}>
      <Pressable style={ph.prefix}>
        <Text style={ph.flag}>🇩🇪</Text>
        <Text style={ph.code}>+49</Text>
        <ChevronDownIcon />
      </Pressable>
      <View style={ph.divider} />
      <TextInput
        style={ph.input}
        value={value}
        onChangeText={onChange}
        placeholder="Enter phone number"
        placeholderTextColor={MUTED}
        keyboardType="phone-pad"
        selectionColor={ORANGE}
      />
    </View>
  );
}

const ph = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    minHeight: 52,
    overflow: "hidden",
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  flag:    { fontSize: 18, lineHeight: 22 },
  code:    { fontFamily: "Poppins_500Medium", fontSize: 14, color: WHITE },
  divider: { width: 1, height: 28, backgroundColor: BORDER },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});

// ─── driver type card ─────────────────────────────────────────────────────────
type DriverTypeCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
};

function DriverTypeCard({ icon, title, subtitle, selected, onSelect }: DriverTypeCardProps) {
  return (
    <Pressable
      style={[dt.card, selected && dt.cardSelected]}
      onPress={onSelect}
    >
      <View style={dt.iconWrap}>{icon}</View>
      <View style={dt.textWrap}>
        <Text style={[dt.title, selected && dt.titleSelected]}>{title}</Text>
        <Text style={dt.subtitle}>{subtitle}</Text>
      </View>
      <View style={[dt.radio, selected && dt.radioSelected]}>
        {selected && <View style={dt.radioDot} />}
      </View>
    </Pressable>
  );
}

const dt = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: FIELD_BG,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,101,0,0.08)",
  },
  iconWrap:      { width: 36, alignItems: "center" },
  textWrap:      { flex: 1 },
  title:         { fontFamily: "Poppins_600SemiBold", fontSize: 13.5, color: DIM, lineHeight: 19 },
  titleSelected: { color: WHITE },
  subtitle:      { fontFamily: "Poppins_400Regular", fontSize: 11.5, color: MUTED, lineHeight: 17 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: MUTED,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: ORANGE },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
});

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = "Drivers" | "Warehouse";
type DriverType = "own_car" | "company_car";

type DriverForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  zipCode: string;
  externalDriverId: string;
  driverType: DriverType;
};

type WarehouseForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  externalId: string;
};

// ─── main component ───────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  accessToken?: string;
  onDriverCreated?: (driver: CreateDriverResponse) => void;
  onWarehouseUserCreated?: (user: CreateWarehouseUserResponse) => void;
};

const EMPTY_DRIVER_FORM: DriverForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "Hamburg, Germany",
  zipCode: "",
  externalDriverId: "",
  driverType: "company_car",
};

export default function AddNewUserModal({ visible, onClose, accessToken, onDriverCreated, onWarehouseUserCreated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Drivers");
  const [saving, setSaving] = useState(false);

  // driver form
  const [driverForm, setDriverForm] = useState<DriverForm>(EMPTY_DRIVER_FORM);

  // warehouse form
  const [warehouseForm, setWarehouseForm] = useState<WarehouseForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "Hamburg, Germany",
    externalId: "",
  });

  const handleSave = async () => {
    if (activeTab === "Warehouse") {
      const { firstName, lastName, email, phone, city, externalId } = warehouseForm;

      if (!firstName.trim())  { Alert.alert("Validation", "First name is required.");    return; }
      if (!lastName.trim())   { Alert.alert("Validation", "Last name is required.");     return; }
      if (!email.trim())      { Alert.alert("Validation", "Email is required.");          return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert("Validation", "Please enter a valid email address.");
        return;
      }
      if (!phone.trim())      { Alert.alert("Validation", "Phone number is required.");  return; }
      if (!city.trim())       { Alert.alert("Validation", "City is required.");           return; }
      if (!externalId.trim()) { Alert.alert("Validation", "External ID is required.");   return; }

      if (!accessToken) {
        Alert.alert("Error", "Session expired. Please log in again.");
        return;
      }

      const fullPhone = phone.startsWith("+") ? phone : `+49${phone}`;

      setSaving(true);
      try {
        const result = await adminCreateWarehouseUser(accessToken, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: fullPhone,
          city: city.trim(),
          external_id: externalId.trim(),
        });

        setWarehouseForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          city: "Hamburg, Germany",
          externalId: "",
        });
        onWarehouseUserCreated?.(result);
        onClose();
        Alert.alert("Success", "Warehouse user created successfully.");
        // DEV ONLY: show temporary password so we can test login
        if (result.temporary_password) {
          console.log("[DEV] Warehouse user temp password:", result.temporary_password);
          Alert.alert("Dev — Temporary Password", result.temporary_password);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create warehouse user. Please try again.";
        Alert.alert("Error", msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── Drivers tab ────────────────────────────────────────────────────────────
    const { firstName, lastName, email, phone, zipCode, externalDriverId, driverType } = driverForm;

    if (!firstName.trim()) { Alert.alert("Validation", "First name is required."); return; }
    if (!lastName.trim())  { Alert.alert("Validation", "Last name is required.");  return; }
    if (!email.trim())     { Alert.alert("Validation", "Email is required.");       return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return;
    }
    if (!phone.trim())            { Alert.alert("Validation", "Phone number is required.");        return; }
    if (!zipCode.trim())          { Alert.alert("Validation", "ZIP / postal code is required.");    return; }
    if (!externalDriverId.trim()) { Alert.alert("Validation", "External Driver ID is required.");   return; }
    if (!driverType)              { Alert.alert("Validation", "Please select a driver type.");       return; }

    if (!accessToken) {
      Alert.alert("Error", "Session expired. Please log in again.");
      return;
    }

    const fullPhone = phone.startsWith("+") ? phone : `+49${phone}`;
    const typeLabel = driverType === "own_car" ? "Own Car Driver" : "Company Car Driver";

    Alert.alert(
      "Confirm New Driver",
      `Please review before saving:\n\n` +
      `Name:         ${firstName.trim()} ${lastName.trim()}\n` +
      `Email:        ${email.trim()}\n` +
      `Phone:        ${fullPhone}\n` +
      `ZIP:          ${zipCode.trim()}\n` +
      `External ID:  ${externalDriverId.trim()}\n` +
      `Type:         ${typeLabel}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Driver",
          onPress: async () => {
            setSaving(true);
            try {
              const result = await adminCreateDriver(accessToken!, {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                phone: fullPhone,
                postal_code: zipCode.trim(),
                car_type: driverType,
                external_driver_id: externalDriverId.trim(),
              });

              setDriverForm(EMPTY_DRIVER_FORM);
              onDriverCreated?.(result);
              onClose();
              Alert.alert("Success", "Driver created successfully.");
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed to create driver. Please try again.";
              Alert.alert("Error", msg);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={m.overlay}>
          <View style={m.sheet}>
            {/* drag handle */}
            <View style={m.handleRow}>
              <View style={m.handle} />
            </View>

            {/* header: X | title | spacer */}
            <View style={m.header}>
              <Pressable style={m.closeBtn} onPress={onClose} hitSlop={12}>
                <XIcon />
              </Pressable>
              <Text style={m.title}>Add New User</Text>
              <View style={m.headerSpacer} />
            </View>

            {/* Drivers / Warehouse tabs */}
            <View style={m.tabRow}>
              {(["Drivers", "Warehouse"] as Tab[]).map(tab => (
                <Pressable
                  key={tab}
                  style={[m.tab, activeTab === tab && m.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[m.tabLabel, activeTab === tab && m.tabLabelActive]}>
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* scrollable form area */}
            <ScrollView
              style={m.scroll}
              contentContainerStyle={m.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === "Drivers" ? (
                <>
                  <Text style={m.sectionTitle}>Fill in user details</Text>

                  <Field
                    left={<UserIcon />}
                    value={driverForm.firstName}
                    onChange={v => setDriverForm(p => ({ ...p, firstName: v }))}
                    placeholder="Enter first name"
                    autoCapitalize="words"
                  />
                  <Field
                    left={<UserIcon />}
                    value={driverForm.lastName}
                    onChange={v => setDriverForm(p => ({ ...p, lastName: v }))}
                    placeholder="Enter last name"
                    autoCapitalize="words"
                  />
                  <Field
                    left={<MailIcon />}
                    value={driverForm.email}
                    onChange={v => setDriverForm(p => ({ ...p, email: v }))}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <PhoneField
                    value={driverForm.phone}
                    onChange={v => setDriverForm(p => ({ ...p, phone: v }))}
                  />

                  {/* city with dropdown indicator */}
                  <View style={f.wrap}>
                    <View style={f.iconLeft}><MapPinIcon /></View>
                    <TextInput
                      style={f.input}
                      value={driverForm.city}
                      onChangeText={v => setDriverForm(p => ({ ...p, city: v }))}
                      placeholder="City"
                      placeholderTextColor={MUTED}
                      selectionColor={ORANGE}
                    />
                    <View style={f.iconRight}><ChevronDownIcon /></View>
                  </View>

                  <Field
                    left={<ZipIcon />}
                    value={driverForm.zipCode}
                    onChange={v => setDriverForm(p => ({ ...p, zipCode: v }))}
                    placeholder="Enter ZIP code"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />

                  <Field
                    left={<IdBadgeIcon />}
                    value={driverForm.externalDriverId}
                    onChange={v => setDriverForm(p => ({ ...p, externalDriverId: v }))}
                    placeholder="Enter External Driver ID"
                    autoCapitalize="none"
                  />

                  <Text style={[m.sectionTitle, { marginTop: 8 }]}>Driver type</Text>

                  <DriverTypeCard
                    icon={<CarIcon color={driverForm.driverType === "own_car" ? ORANGE : MUTED} />}
                    title="Own car driver"
                    subtitle="Higher rates • Cover own car costs"
                    selected={driverForm.driverType === "own_car"}
                    onSelect={() => setDriverForm(p => ({ ...p, driverType: "own_car" }))}
                  />
                  <DriverTypeCard
                    icon={<BuildingIcon color={driverForm.driverType === "company_car" ? ORANGE : MUTED} />}
                    title="Company car driver"
                    subtitle="Standard rate • Company provides car"
                    selected={driverForm.driverType === "company_car"}
                    onSelect={() => setDriverForm(p => ({ ...p, driverType: "company_car" }))}
                  />
                </>
              ) : (
                <>
                  <Text style={m.sectionTitle}>Fill in warehouse user details</Text>

                  <Field
                    left={<UserIcon />}
                    value={warehouseForm.firstName}
                    onChange={v => setWarehouseForm(p => ({ ...p, firstName: v }))}
                    placeholder="Enter first name"
                    autoCapitalize="words"
                  />
                  <Field
                    left={<UserIcon />}
                    value={warehouseForm.lastName}
                    onChange={v => setWarehouseForm(p => ({ ...p, lastName: v }))}
                    placeholder="Enter last name"
                    autoCapitalize="words"
                  />
                  <Field
                    left={<MailIcon />}
                    value={warehouseForm.email}
                    onChange={v => setWarehouseForm(p => ({ ...p, email: v }))}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <PhoneField
                    value={warehouseForm.phone}
                    onChange={v => setWarehouseForm(p => ({ ...p, phone: v }))}
                  />

                  {/* city */}
                  <View style={f.wrap}>
                    <View style={f.iconLeft}><MapPinIcon /></View>
                    <TextInput
                      style={f.input}
                      value={warehouseForm.city}
                      onChangeText={v => setWarehouseForm(p => ({ ...p, city: v }))}
                      placeholder="City"
                      placeholderTextColor={MUTED}
                      selectionColor={ORANGE}
                    />
                    <View style={f.iconRight}><ChevronDownIcon /></View>
                  </View>

                  <Field
                    left={<IdBadgeIcon />}
                    value={warehouseForm.externalId}
                    onChange={v => setWarehouseForm(p => ({ ...p, externalId: v }))}
                    placeholder="Enter external ID"
                    autoCapitalize="none"
                  />
                </>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* save button pinned at bottom */}
            <View style={m.footer}>
              <Pressable
                style={({ pressed }) => [m.saveBtn, pressed && m.saveBtnPressed, saving && m.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <SaveIcon />
                )}
                <Text style={m.saveLabel}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    maxHeight: SCREEN_H * 0.90,
  },

  handleRow: { alignItems: "center", paddingTop: 12, paddingBottom: 2 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: HANDLE },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: WHITE,
    lineHeight: 24,
  },
  headerSpacer: { width: 36 },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive:      { backgroundColor: ORANGE },
  tabLabel:       { fontFamily: "Poppins_600SemiBold", fontSize: 13.5, color: MUTED },
  tabLabelActive: { color: WHITE },

  scroll:        { flexShrink: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8 },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DIM,
    marginBottom: 14,
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: SHEET_BG,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnPressed:  { backgroundColor: "#D45400" },
  saveBtnDisabled: { opacity: 0.65 },
  saveLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: WHITE,
  },
});
