import "@/styles/index.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/App";

dayjs.extend(utc);

const originalFetch = window.fetch;

window.fetch = (input, init) => {
  if (typeof input === "string" && input.endsWith("wallet-core.wasm"))
    return originalFetch("/wallet-core.wasm", init);

  return originalFetch(input, init);
};

if (import.meta.env.DEV) {
  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
