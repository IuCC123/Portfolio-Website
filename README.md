# IuCC Portfolio

My portfolio built with Bun, React, Vite, and TanStack Router.

## Stack

- Bun
- React
- TanStack Router
- Vite
- TypeScript

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
  main.tsx           App entry and top-level page content
  TechSections.tsx   Technology stack section
  styles.css         Global styling
public/
  swiftservers-preview.webp
  SwiftServers Homepage.png
```

## License

MIT
