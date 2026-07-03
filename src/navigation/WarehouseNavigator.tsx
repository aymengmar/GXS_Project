import WarehouseBottomTabs, { WarehouseTab } from "@/components/warehouse/WarehouseBottomTabs";
import WarehouseDashboardScreen from "@/screens/warehouse/WarehouseDashboardScreen";
import WarehouseDocumentsScreen from "@/screens/warehouse/WarehouseDocumentsScreen";
import WarehousePlanAssignScreen from "@/screens/warehouse/WarehousePlanAssignScreen";
import WarehouseReturnsScreen from "@/screens/warehouse/WarehouseReturnsScreen";
import WarehouseZipCountScreen from "@/screens/warehouse/WarehouseZipCountScreen";
import { useState } from "react";
import { View } from "react-native";

export default function WarehouseNavigator() {
  const [activeTab, setActiveTab] = useState<WarehouseTab>("dashboard");

  return (
    <View style={{ flex: 1, backgroundColor: "#080F1D" }}>
      <View style={{ flex: 1 }}>
        {activeTab === "dashboard" && <WarehouseDashboardScreen onNavigate={setActiveTab} />}
        {activeTab === "zipCount" && <WarehouseZipCountScreen />}
        {activeTab === "planAssign" && <WarehousePlanAssignScreen />}
        {activeTab === "returns" && <WarehouseReturnsScreen />}
        {activeTab === "documents" && <WarehouseDocumentsScreen />}
      </View>
      <WarehouseBottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
