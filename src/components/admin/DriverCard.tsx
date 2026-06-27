import { Pressable, StyleSheet, Text, View } from "react-native";

const CARD_BG = "#111E33";
const BORDER = "rgba(255,255,255,0.07)";
const BLUE = "#3B82F6";
const GREEN = "#22C55E";
const RED = "#EF4444";
const ORANGE = "#FF6500";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.55)";
const MUTED = "rgba(255,255,255,0.30)";

export type DriverStatus =
  | "ACTIVE"
  | "PENDING"
  | "APPROVED"
  | "INCOMPLETE"
  | "SUSPENDED"
  | "INACTIVE";

export type DriverType = "own_car" | "company_car";

export type Driver = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  external_driver_id: string | null;
  status: DriverStatus;
  car_type: DriverType;
  warehouse_name: string | null;
  packet_rate: number | null;
  max_capacity: number | null;
};

function statusColor(s: DriverStatus): string {
  switch (s) {
    case "ACTIVE": return GREEN;
    case "PENDING": return AMBER;
    case "APPROVED": return BLUE;
    case "INCOMPLETE": return ORANGE;
    case "SUSPENDED": return RED;
    case "INACTIVE": return MUTED;
  }
}

function statusBg(s: DriverStatus): string {
  switch (s) {
    case "ACTIVE": return "rgba(34,197,94,0.15)";
    case "PENDING": return "rgba(245,158,11,0.15)";
    case "APPROVED": return "rgba(59,130,246,0.15)";
    case "INCOMPLETE": return "rgba(255,101,0,0.15)";
    case "SUSPENDED": return "rgba(239,68,68,0.15)";
    case "INACTIVE": return "rgba(255,255,255,0.08)";
  }
}

function avatarBg(s: DriverStatus): string {
  switch (s) {
    case "ACTIVE": return "rgba(34,197,94,0.18)";
    case "PENDING": return "rgba(245,158,11,0.18)";
    case "APPROVED": return "rgba(59,130,246,0.18)";
    case "INCOMPLETE": return "rgba(255,101,0,0.18)";
    case "SUSPENDED": return "rgba(239,68,68,0.18)";
    case "INACTIVE": return "rgba(255,255,255,0.08)";
  }
}

type Props = { driver: Driver; onPress?: () => void };

export function DriverCard({ driver, onPress }: Props) {
  const initials = driver.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const clr = statusColor(driver.status);
  const bg = statusBg(driver.status);
  const avBg = avatarBg(driver.status);

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={[s.avatar, { backgroundColor: avBg }]}>
        <Text style={[s.avatarText, { color: clr }]}>{initials}</Text>
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>
            {driver.full_name}
          </Text>
          <View style={[s.badge, { backgroundColor: bg }]}>
            <Text style={[s.badgeText, { color: clr }]}>{driver.status}</Text>
          </View>
        </View>

        <Text style={s.extId}>
          {driver.external_driver_id
            ? `ID: ${driver.external_driver_id}`
            : "No External ID assigned"}
        </Text>

        <View style={s.metaRow}>
          <View style={s.typePill}>
            <Text style={s.typeText}>
              {driver.car_type === "own_car" ? "Own Car" : "Company Car"}
            </Text>
          </View>
          {driver.warehouse_name ? (
            <Text style={s.warehouse} numberOfLines={1}>
              {driver.warehouse_name}
            </Text>
          ) : (
            <Text style={s.warehouseNone}>No warehouse</Text>
          )}
        </View>
      </View>

      <View style={s.chevron} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: WHITE,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.4,
  },
  extId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: DIM,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  typePill: {
    backgroundColor: "rgba(59,130,246,0.12)",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: BLUE,
  },
  warehouse: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: MUTED,
    flex: 1,
  },
  warehouseNone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: "rgba(255,255,255,0.18)",
    flex: 1,
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: MUTED,
    transform: [{ rotate: "45deg" }],
    flexShrink: 0,
  },
});
