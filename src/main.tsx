import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Production builds ship prerendered markup to hydrate; the dev server does not.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
