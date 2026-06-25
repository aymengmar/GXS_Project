import UploadDocumentsScreen from "@/screens/auth/UploadDocumentsScreen";
import { useLocalSearchParams } from "expo-router";

export default function UploadDocumentsPage() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <UploadDocumentsScreen isOwnCar={from === "own-car"} />;
}
