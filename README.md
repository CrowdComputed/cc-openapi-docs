# CrowdComputed OpenAPI Docs

[English](README.md) · [中文](README.zh.md)

Open-source documentation site for the **CrowdComputed API**, built with [Next.js](https://nextjs.org/), [Fumadocs](https://fumadocs.dev/), and [fumadocs-openapi](https://fumadocs.dev/docs/openapi). The site serves both human-written guides (MDX) and auto-generated API reference from OpenAPI specs, with **multi-language support** (English and Chinese). You can switch the documentation language in the UI or via the URL (`/en/` or `/zh/`).

## Features

- **Dual content**: Static MDX docs (welcome, pricing, guides) + dynamic OpenAPI-driven API reference
- **i18n**: Default language English (`en`), with Chinese (`zh`). Language can be switched in the docs (e.g. `/en/`, `/zh/`)
- **Interactive API playground**: Try requests and view responses for workflow and global APIs
- **Code samples**: Request examples in cURL, Python, JavaScript, Go, Java, C#, and more
- **Search & navigation**: Sidebar, table of contents, and shareable links

## Tech Stack

- **Framework**: Next.js 16
- **Docs**: Fumadocs (MDX + OpenAPI)
- **Package manager**: pnpm
- **Styling**: Tailwind CSS

## Getting Started

### Use directly

Run the docs site with the [official Docker image](https://hub.docker.com/r/crowdcomputed/cc-openapi-docs). No build required. The container exposes **port 3000**. The image supports **linux/amd64** and **linux/arm64** (Apple Silicon).

```bash
docker pull crowdcomputed/cc-openapi-docs:stable
docker run -p 3000:3000 crowdcomputed/cc-openapi-docs:stable
```

Then open [http://localhost:3000](http://localhost:3000). If you see `no matching manifest for linux/arm64` (older image), run with amd64 emulation: `docker run --platform linux/amd64 -p 3000:3000 crowdcomputed/cc-openapi-docs:stable`.

To use a custom API base URL:

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-api.example.com crowdcomputed/cc-openapi-docs:stable
```

### Development (clone & customize)

To modify the docs or run from source:

**Prerequisites:** [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/) 9+

1. **Clone and install**

```bash
git clone https://github.com/CrowdComputed/cc-openapi-docs.git
cd cc-openapi-docs
pnpm install
```

2. **Environment**

Create a `.env.local` (or use existing `.env`) and set the API base URL:

```bash
# Required: base URL of the CrowdComputed API (used for OpenAPI and playground)
NEXT_PUBLIC_API_URL=https://api.crowdcomputed.com
```

Adjust the URL if you use a different environment (e.g. staging).

3. **Run locally**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the default locale (e.g. `/en`). Use the language switcher or go to `/zh` for Chinese.

4. **(Optional) Generate static API docs**

To pre-generate API doc files from the OpenAPI spec:

```bash
pnpm run build:docs
```

This script fetches the OpenAPI document from `NEXT_PUBLIC_API_URL` and generates MDX per language. The site can also load OpenAPI at runtime.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start dev server                     |
| `pnpm build`      | Production build                     |
| `pnpm start`      | Start production server              |
| `pnpm run build:docs` | Generate API docs from OpenAPI  |
| `pnpm run types:check` | MDX typegen + TypeScript check |
| `pnpm lint`       | Run Biome check                      |
| `pnpm format`     | Format with Biome                    |

## Project Structure

```
├── content/docs/          # MDX content and meta
│   ├── (api)/             # Generated OpenAPI-based API reference
│   ├── *.mdx / *.zh.mdx   # Static docs (en/zh)
│   └── meta.json          # Sidebar / nav config
├── src/
│   ├── app/[locale]/      # Locale-aware routes (en, zh)
│   ├── lib/               # source, i18n, openapi config
│   ├── openapi/           # OpenAPI parsing, UI, playground, codegen
│   └── components/        # Shared UI
├── scripts/
│   └── generate-docs.ts   # OpenAPI → MDX generation
└── docker/                # Dockerfiles and compose
```

## Language Switching

- **Default language**: English (`en`). Root `/` redirects to `/en`.
- **Supported locales**: `en`, `zh`.
- **URLs**: Docs are under `/{locale}/...`, e.g. `/en`, `/en/docs/welcome`, `/zh`, `/zh/docs/welcome`.
- **Content**: Static pages use `*.mdx` (English) and `*.zh.mdx` (Chinese). API reference is generated per language from the OpenAPI spec (which supports multiple languages via the backend).

You can add more locales in `src/lib/i18n.ts` and provide corresponding MDX files (e.g. `*.ja.mdx` for Japanese).

## Docker

- **Development**: `docker/development/` (Dockerfile + docker-compose).
- **Production**: `docker/production/` (standalone Next.js output + PM2).

Build the app first, then use the production image to run the static export or Node server as needed.

## License

This project is open source. See the [LICENSE](LICENSE) file for details.

## Links

- [CrowdComputed](https://crowdcomputed.com)
- [Docker Hub: crowdcomputed/cc-openapi-docs](https://hub.docker.com/r/crowdcomputed/cc-openapi-docs)
- [Fumadocs](https://fumadocs.dev/)
- [OpenAPI](https://www.openapis.org/)
