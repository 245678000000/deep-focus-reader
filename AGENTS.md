# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Deep Focus Reader is an immersive English reading learning tool for Chinese-speaking users. It is a **pure static site** (vanilla HTML + JS + Tailwind via CDN) with two Vercel Serverless Functions in `/api`. There is no build step, no npm dependencies, and no database — all persistence is via browser `localStorage`.

### Running the dev server

The canonical dev command is `vercel dev` (see `package.json` scripts). However, this requires Vercel authentication (`vercel login` or `VERCEL_TOKEN`).

A fallback `dev-server.js` (Node.js, zero dependencies) is provided for environments without Vercel credentials. It serves both static files and the `/api/*` serverless function routes on `http://localhost:3000`:

```bash
node dev-server.js
```

Both approaches serve the same content on port 3000.

### Lint / Build / Test

- **Build**: `npm run build` — no-op (static site, prints a message).
- **Lint**: No dedicated linter is configured. HTML files contain inline `<script>` blocks; standard JS linting tools are not wired up.
- **Tests**: No automated test suite exists. Manual testing through the browser is the primary verification method.

### Key pages

All pages are standalone HTML files. Navigate via the Module Hub at `/index.html`, or directly:

| Page | Path |
|---|---|
| Module Hub | `/index.html` |
| Reading View | `/the_study_reading_view/code.html` |
| Library Dashboard | `/library_dashboard/code.html` |
| Vocabulary Notebook | `/vocabulary_insights_sidebar/code.html` |
| Import Text | `/ingest_and_analysis_modal/code.html` |
| Reading Settings | `/reading_settings_panel/code.html` |
| Grammar Popover | `/grammar_analysis_popover/code.html` |
| Analysis Report | `/text_analysis_report/code.html` |

### API routes

- `/api/tts-proxy` — proxies TTS requests to `tts-webs.vercel.app`
- `/api/ai-proxy` — proxies AI requests to NVIDIA API (API key hardcoded in `api/ai-proxy.js`)

### External API dependencies

The app calls several external APIs from the browser. Internet access is required for full functionality. Word lookup (`api.dictionaryapi.dev`) and translation (`google-translate-pro...workers.dev`) are called client-side. TTS is proxied through `/api/tts-proxy`.

### Gotchas

- There is no `package-lock.json` or lockfile — the project has zero npm runtime/dev dependencies.
- All client libraries (Tailwind, PDF.js, mammoth.js, epub.js) are loaded via CDN `<script>` tags.
- The `dev-server.js` script uses Node.js built-in modules only; no `npm install` is needed to run it.
