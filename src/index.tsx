import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { Waitlist } from "./screens/Waitlist";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Waitlist />
    <Analytics />
  </StrictMode>,
);
