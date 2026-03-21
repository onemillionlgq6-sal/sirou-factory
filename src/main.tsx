import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPlatformUI } from "./lib/platform";

// Enforce sovereign dark theme at boot to prevent white/unstyled first paint
if (!document.documentElement.classList.contains("dark")) {
  document.documentElement.classList.add("dark");
}

// Initialize platform detection & visual style before first render
initPlatformUI();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
