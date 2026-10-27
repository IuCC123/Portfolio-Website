# IuCC Portfolio

My portfolio, built with Bun, React, Vite, Tailwind CSS, and Motion.

## Stack

- Bun
- React
- Vite
- TypeScript
- Tailwind CSS
- Motion
- Interior.dev components
- Morphicons
- Geist and Geist Mono

## Development

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Create a production build:

```bash
bun run build
```

## Deploy to Vercel

Import this repository in Vercel and set the project root to this folder. The included `vercel.json` configures the Vite build, serves `dist`, and provides a single-page-app fallback for client-side routes.

Alternatively, from an authenticated terminal:

```bash
npx vercel --prod
```

Preview the production build locally:

```bash
bun run preview
```

## Project Structure

```text
src/
  main.tsx                  App entry, layout and hero
  AsciiHero.tsx             Animated ASCII monogram behind the hero
  Projects.tsx              Project cards
  TechSections.tsx          Technology stack
  styles.css                Global styles and theme tokens
  lib/
    monogram.ts             3D signed-distance model of the IuCC monogram
  components/
    interior/               Interaction components
    unlumen-ui/             GitHub activity graph
public/
  favicon.svg               IuCC monogram (also used as the header logo)
  favicon.ico               16, 32 and 48 px fallback
  apple-touch-icon.png      180 px home screen icon
  projects/                 Project screenshots and icons
```

## License

MIT
