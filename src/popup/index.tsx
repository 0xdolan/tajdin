import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../shared/styles/globals.css";

const el = document.getElementById("root");
if (!el) throw new Error("Missing #root");

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
