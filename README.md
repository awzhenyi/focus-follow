# Focus Follow

Interview prep study app with bundled LeetCode/system design content, checkbox-driven spaced repetition, and a simplified sidebar-first UI.

## Local development

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun dev
```

Run the Bun server in production mode:

```bash
bun start
```

Build the static frontend:

```bash
bun run build
```

## GitHub Pages deployment

This repo now includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds the static frontend and deploys the generated `dist/` directory to GitHub Pages.

Build the Pages artifact locally with:

```bash
bun run build:pages
```

### One-time GitHub setup

In the GitHub repository settings:

1. Open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`

After that, every push to `main` will trigger a Pages deployment.

### Important note about APIs

GitHub Pages only hosts the static frontend build. The Bun server entry in `src/index.ts` and any `/api/*` routes do not run on GitHub Pages.

That means:

- `bun dev` / `bun start` can serve the site locally with Bun
- GitHub Pages serves only the browser app built from `src/index.html`
