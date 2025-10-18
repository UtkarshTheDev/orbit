import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

// Import fonts for optimal performance
import "@fontsource/pacifico";
import "@fontsource/orbitron/400.css";
import "@fontsource/orbitron/500.css";
import "@fontsource/orbitron/600.css";
import "@fontsource/outfit";
// import "@fontsource/space-grotesk";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
