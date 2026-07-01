import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

export type DriverTab =
  | "dashboard"
  | "statistic"
  | "assignment"
  | "documents"
  | "vehicle";

const BG = "#060C18";
const ORANGE = "#FF6500";
const INACTIVE = "rgba(255,255,255,0.38)";
const BORDER = "rgba(255,255,255,0.07)";

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StatisticIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="20" x2="6" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="18" y1="20" x2="18" y2="14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function AssignmentIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 15.5l1.5 1.5 3.5-3.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="14 2 14 8 20 8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VehicleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="3"
        y="11"
        width="18"
        height="6"
        rx="1.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
      <Circle cx="16.5" cy="17" r="1.6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

const TABS: {
  id: DriverTab;
  label: string;
  Icon: React.ComponentType<{ color: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
  { id: "statistic", label: "Statistic", Icon: StatisticIcon },
  { id: "assignment", label: "Assignment", Icon: AssignmentIcon },
  { id: "documents", label: "Documents", Icon: DocumentIcon },
  { id: "vehicle", label: "Vehicle", Icon: VehicleIcon },
];

interface Props {
  activeTab: DriverTab;
  onTabPress: (tab: DriverTab) => void;
}

export default function DriverBottomTabs({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
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
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
