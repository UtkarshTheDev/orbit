import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/600.css";
import { useEffect } from "react";
import { useSessionStore } from "@/lib/sessionStore";
import CameraInterface from "./CameraInterface";
import { Toaster } from "sonner";

export default function Home() {
  const sendWs = useSessionStore((s) => s.sendWs);
  const isTablet = useSessionStore((s) => s.isTablet);
  const wsReady = useSessionStore((s) => s.wsReady);

  useEffect(() => {
    if (!isTablet && wsReady) {
      console.log("[Polaroid] Notifying backend: polaroid_entered");
      sendWs({ type: "polaroid_entered" });
    }
  }, [isTablet, wsReady, sendWs]);

  return (
    <>
      <div style={{ fontFamily: '"Quicksand", "Outfit", sans-serif' }}>
        <CameraInterface />
      </div>
      <Toaster position="top-center" richColors />
    </>
  );
}
