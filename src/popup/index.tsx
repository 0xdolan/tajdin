import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const el = document.getElementById("root");
if (!el) throw new Error("Missing #root");

createRoot(el).render(
  <StrictMode>
    <span>Zeng</span>
  </StrictMode>,
);
