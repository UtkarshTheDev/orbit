import { createFileRoute } from "@tanstack/react-router";
import { useSessionStore } from "@/lib/sessionStore";
import { CampusNavigationMap, LocationPicker } from "@/components/Map";

function MapPage() {
  const isTablet = useSessionStore((s) => s.isTablet);
  
  // LocationPicker handles both tablet (sidebar + map) and mobile (3-step flow) layouts
  return <LocationPicker />;
}

export const Route = createFileRoute("/map/")({
  component: MapPage,
});