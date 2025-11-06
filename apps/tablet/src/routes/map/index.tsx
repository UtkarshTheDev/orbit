import { createFileRoute } from "@tanstack/react-router";
import { LocationPicker } from "@/components/Map";

function MapPage() {
  // LocationPicker handles both tablet (sidebar + map) and mobile (3-step flow) layouts
  return <LocationPicker />;
}

export const Route = createFileRoute("/map/")({
  component: MapPage,
});