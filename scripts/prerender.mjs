import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = `${root}dist`;
const serverOut = `${root}dist-server`;

await build({
  root,
  logLevel: "warn",
  build: {
    ssr: "src/entry-server.tsx",
    outDir: serverOut,
    emptyOutDir: true,
    copyPublicDir: false,
  },
});

const { render } = await import(`${serverOut}/entry-server.js`);
const app = await render();

let html = await readFile(`${dist}/index.html`, "utf8");

const stylesheet = html.match(
  /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/,
);
if (!stylesheet) throw new Error("No stylesheet link in dist/index.html");
const css = await readFile(`${dist}${stylesheet[1]}`, "utf8");

const assets = await readdir(`${dist}/assets`);
const font = assets.find((file) =>
  /^geist-latin-wght-normal-.+\.woff2$/.test(file),
);
if (!font) throw new Error("No Geist latin font in dist/assets");

const entry = html.match(
  /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/,
);
if (!entry) throw new Error("No entry script in dist/index.html");

const emptyRoot = '<div id="root"></div>';
if (!html.includes(emptyRoot))
  throw new Error("No empty #root in dist/index.html");

// The prerendered page is complete without JavaScript, so request the app only
// once the first contentful paint is on screen instead of competing with it.
// Background tabs never paint, hence the timeout.
const bootstrap = `<script>(function(){var done=false;function load(){if(done)return;done=true;var s=document.createElement("script");s.type="module";s.crossOrigin="";s.src="${entry[1]}";document.body.appendChild(s)}try{new PerformanceObserver(function(list,observer){if(list.getEntriesByName("first-contentful-paint").length){observer.disconnect();setTimeout(load)}}).observe({type:"paint",buffered:true})}catch(e){}setTimeout(load,3000)})()</script>`;

// Inline the stylesheet so first paint needs only the HTML document, and
// preload the body font so it usually arrives before that paint.
html = html
  .replace(entry[0], "")
  .replace(
    stylesheet[0],
    () =>
      `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>\n    <style>${css}</style>`,
  )
  .replace(emptyRoot, () => `<div id="root">${app}</div>`)
  .replace("</body>", () => `${bootstrap}\n  </body>`);

await writeFile(`${dist}/index.html`, html);
await rm(`${dist}${stylesheet[1]}`);
await rm(serverOut, { recursive: true, force: true });

console.log(
  `prerendered ${(app.length / 1024).toFixed(1)} KiB of markup, inlined ${(css.length / 1024).toFixed(1)} KiB of CSS`,
);
