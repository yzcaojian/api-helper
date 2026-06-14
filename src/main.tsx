import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

window.addEventListener("error", (event) => {
  console.error("API Helper runtime error:", event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("API Helper unhandled rejection:", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
