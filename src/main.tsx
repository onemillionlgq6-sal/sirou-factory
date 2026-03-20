import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPlatformUI } from "./lib/platform";

// Initialize platform detection & visual style before first render
initPlatformUI();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
