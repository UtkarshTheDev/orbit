import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/600.css";
import { useEffect } from "react";
import { useSessionStore } from "@/lib/sessionStore";
import CameraInterface from "./CameraInterface";

export default function Home() {
  const sendWs = useSessionStore((s) => s.sendWs);
  const isTablet = useSessionStore((s) => s.isTablet);

  useEffect(() => {
    if (!isTablet) {
      sendWs({ type: "polaroid_entered" });
    }
  }, [isTablet, sendWs]);

  return (
    <div style={{ fontFamily: '"Quicksand", "Outfit", sans-serif' }}>
      <CameraInterface />
    </div>
  );
}
