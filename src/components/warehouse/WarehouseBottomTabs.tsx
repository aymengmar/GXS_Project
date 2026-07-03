import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type WarehouseTab =
  | "dashboard"
  | "zipCount"
  | "planAssign"
  | "returns"
  | "documents";

const BG = "#060C18";
const ORANGE = "#FF6500";
const INACTIVE = "rgba(255,255,255,0.38)";
const BORDER = "rgba(255,255,255,0.07)";

function DashboardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ZipCountIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function PlanAssignIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12.5l1.8 1.8L15 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 17h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ReturnsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 0 1 15.36-6.36L21 8M21 3v5h-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12a9 9 0 0 1-15.36 6.36L3 16M3 21v-5h5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const TABS: {
  id: WarehouseTab;
  label: string;
  Icon: React.ComponentType<{ color: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", Icon: DashboardIcon },
  { id: "zipCount", label: "Zip Count", Icon: ZipCountIcon },
  { id: "planAssign", label: "Plan & Assign", Icon: PlanAssignIcon },
  { id: "returns", label: "Returns", Icon: ReturnsIcon },
  { id: "documents", label: "Documents", Icon: DocumentsIcon },
];

interface Props {
  activeTab: WarehouseTab;
  onTabPress: (tab: WarehouseTab) => void;
}

export default function WarehouseBottomTabs({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        const color = active ? ORANGE : INACTIVE;
        return (
          <Pressable
            key={id}
            onPress={() => onTabPress(id)}
            style={styles.tab}
            hitSlop={4}
          >
            {active && <View style={styles.activeIndicator} />}
            <Icon color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    position: "relative",
    paddingBottom: 2,
  },
  activeIndicator: {
    position: "absolute",
    top: -10,
    width: "55%",
    height: 2.5,
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
});
