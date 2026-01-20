import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Polyfill for __DEV__ in Vite-based React apps
// In Vite, use import.meta.env.DEV, but some libraries expect __DEV__
if (typeof window !== "undefined" && typeof window.__DEV__ === "undefined") {
  window.__DEV__ = import.meta.env.DEV;
}
// Also set it globally for compatibility
if (typeof globalThis !== "undefined" && typeof globalThis.__DEV__ === "undefined") {
  globalThis.__DEV__ = import.meta.env.DEV;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
