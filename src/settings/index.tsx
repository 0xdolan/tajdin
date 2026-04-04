import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureLegacyStorageMigrated } from "../shared/storage/storage-migration";
import "../shared/styles/globals.css";

const el = document.getElementById("root");
if (!el) throw new Error("Missing #root");

void ensureLegacyStorageMigrated().then(() => {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
