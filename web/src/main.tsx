import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/index.css";

const Router = import.meta.env.VITE_STATIC_DEMO === "true" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Router>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Router>
    </MotionConfig>
  </StrictMode>,
);
