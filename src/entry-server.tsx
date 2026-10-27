import React from "react";
import { prerenderToNodeStream } from "react-dom/static";
import App from "./App";

export async function render(): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
