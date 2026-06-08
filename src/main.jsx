import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Clarity from '@microsoft/clarity';
import "boxicons/css/boxicons.min.css";
import App from "./App.jsx";
import "./index.css";

Clarity.init("x3zqv2v70a");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);