import DriverBottomTabs, { DriverTab } from "@/components/driver/DriverBottomTabs";
import DriverAssignmentScreen from "@/screens/driver/DriverAssignmentScreen";
import DriverDashboardScreen from "@/screens/driver/DriverDashboardScreen";
import DriverDocumentsScreen from "@/screens/driver/DriverDocumentsScreen";
import DriverStatisticsScreen from "@/screens/driver/DriverStatisticsScreen";
import DriverVehicleScreen from "@/screens/driver/DriverVehicleScreen";
import { useState } from "react";
import { View } from "react-native";

export default function DriverNavigator() {
  const [activeTab, setActiveTab] = useState<DriverTab>("dashboard");

  return (
    <View style={{ flex: 1, backgroundColor: "#080F1D" }}>
      <View style={{ flex: 1 }}>
        {activeTab === "dashboard" && (
          <DriverDashboardScreen onNavigate={setActiveTab} />
        )}
        {activeTab === "statistic" && (
          <DriverStatisticsScreen onNavigate={setActiveTab} />
        )}
        {activeTab === "assignment" && (
          <DriverAssignmentScreen onNavigate={setActiveTab} />
        )}
        {activeTab === "documents" && (
          <DriverDocumentsScreen onNavigate={setActiveTab} />
        )}
        {activeTab === "vehicle" && (
          <DriverVehicleScreen onNavigate={setActiveTab} />
        )}
      </View>
      <DriverBottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
