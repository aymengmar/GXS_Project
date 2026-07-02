import DriverBottomTabs, { DriverTab } from "@/components/driver/DriverBottomTabs";
import DriverAssignmentScreen from "@/screens/driver/DriverAssignmentScreen";
import DriverDashboardScreen from "@/screens/driver/DriverDashboardScreen";
import DriverDocumentsScreen from "@/screens/driver/DriverDocumentsScreen";
import DriverInvoicesScreen from "@/screens/driver/DriverInvoicesScreen";
import DriverStatisticsScreen from "@/screens/driver/DriverStatisticsScreen";
import DriverVehicleScreen from "@/screens/driver/DriverVehicleScreen";
import { sessionStore } from "@/store/sessionStore";
import { useState } from "react";
import { View } from "react-native";

export default function DriverNavigator() {
  const [activeTab, setActiveTab] = useState<DriverTab>("dashboard");

  const session = sessionStore.get();
  const carType = session?.kind === "driver" && session.car_type === "company_car"
    ? "company_car"
    : "own_car";

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
        {activeTab === "vehicle" && carType === "own_car" && (
          <DriverVehicleScreen onNavigate={setActiveTab} />
        )}
        {activeTab === "invoices" && carType === "company_car" && (
          <DriverInvoicesScreen onNavigate={setActiveTab} />
        )}
      </View>
      <DriverBottomTabs activeTab={activeTab} onTabPress={setActiveTab} carType={carType} />
    </View>
  );
}
