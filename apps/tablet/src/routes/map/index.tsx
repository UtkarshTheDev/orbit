import { createFileRoute } from "@tanstack/react-router";
import { useSessionStore } from "@/lib/sessionStore";
import { CampusNavigationMap, LocationPicker } from "@/components/Map";

function MapPage() {
  const isTablet = useSessionStore((s) => s.isTablet);
  
  // Show appropriate Map component based on device type
  if (isTablet) {
    return <CampusNavigationMap />;
  } else {
    return <LocationPicker />;
  }
}

export const Route = createFileRoute("/map/")({
  component: MapPage,
});