# GB Parametric Tokens

A parametric **Guild Ball** token generator, used by the CCK Guild Ball group. Pick a guild, choose which reminder tokens to print and how many copies of each, tune shape, text and relief, check the live preview, then download a `.3mf` ready to slice.

Everything runs in the browser: text is laid out from real glyph metrics (opentype.js), the geometry is built with Manifold (WebAssembly) in a Web Worker, and the 3MF is zipped client side. There is no server.

Live at [gb-tokens.cckarchev.ar](https://gb-tokens.cckarchev.ar).

## Features

- **Guild catalogs**: every guild's roster (captains, mascots, squaddies, guests) with each character's effect tokens, plus guild special tokens and AOE templates.
- **Generic catalog** (`/generic`): condition markers, Game Plans and the tokens every guild shares.
- **Token layouts**: arc tokens with the name curved along a ribbon, round ring tokens (crest centered, text curved above and below), condition discs with their own icon, and fixed 3″ AOE templates.
- **Auto-fit text**: names shrink to fit the arc using per-glyph advance widths and kerning, not a fixed character spacing.
- **Relief styles**: raised, engraved, or flat inlay (each color its own part, for multicolor printing).
- **Print profiles**: resin (SLA/DLP), FDM 0.4mm and FDM 0.25mm, each with its own minimum stroke, relief height and feature gap.
- **Layout checks**: non-blocking warnings for text or icons that overflow, strokes too thin to print, and broken footprints.
- **Export**: one `.3mf` per guild, each token copy its own named object laid out on the plate like the preview. Settings save and load as `token-settings.json`.

## Stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **CSS Modules**, with every visual value coming from the shared tokens in `@cckarchev/shared` and the app tokens in `src/styles/tokens.css`
- **Lightning CSS** compiles the stylesheets and resolves the shared `@custom-media` breakpoints from `@cckarchev/shared/breakpoints.css`
- **[manifold-3d](https://github.com/elalish/manifold)**: mesh booleans and extrusion, run in a Web Worker
- **[opentype.js](https://opentype.js.org)**: font parsing and glyph metrics
- **[fflate](https://github.com/101arrowz/fflate)**: zips the 3MF archive
- **Vitest** + **React Testing Library** + happy-dom for tests
- **Biome** for lint and format, from the shared preset in `@cckarchev/shared`
- **[Cloudflare Workers](https://workers.cloudflare.com)** with static assets, via Wrangler, deploy

## Commands

Requires Node 24.21 or later (`.node-version`).

| Command              | What it does                                        |
| :------------------- | :-------------------------------------------------- |
| `npm install`        | Install dependencies                                |
| `npm run dev`        | Dev server at `localhost:5173`                      |
| `npm run build`      | Production build to `dist/`                         |
| `npm run preview`    | Preview the local build                             |
| `npm run verify`     | Check, type check, test and build, as CI does       |
| `npm run deploy`     | `verify`, then deploy with Wrangler (manual deploy) |
| `npm run check`      | Biome lint and format check                         |
| `npm run check:fix`  | Biome lint and format with autofix                  |
| `npm run typecheck`  | Type check without emitting                         |
| `npm test`           | Run the unit tests (Vitest)                         |
| `npm run test:watch` | Run the unit tests in watch mode                    |

## Project layout

```
src/
├── core/                # pure logic, each module with its test beside it
│   ├── guildRoute.ts    # /guild/<id> and /generic routing
│   └── token/
│       ├── catalog/     # catalogs, token items, default selection, settings file parsing
│       ├── geometry/    # contours, footprints, icon placement, plate layout
│       ├── text/        # glyph layout, arc and ring text, auto-fit
│       ├── icons/       # icon manifest and path resolution
│       ├── relief/      # raised, engraved and inlay relief parts
│       ├── mesh/        # Manifold meshing: base, arc ribbon, relief parts
│       ├── svg/         # SVG path parsing and flattening
│       ├── preview/     # 2D preview paths
│       ├── validation/  # layout checks (overflow, stroke width, footprint)
│       ├── export/      # 3mf/ (archive, model, PrusaSlicer config) and contact-sheet/ (plate layout)
│       └── printProfiles.ts
├── browser/             # browser-only glue: font and icon loading, catalog loading, Web Worker, downloads
├── data/
│   ├── guilds/          # one JSON file per guild: roster and special tokens
│   ├── characters.json  # each character's token ids
│   ├── effects.json     # effect token text, referenced by id
│   ├── conditions.json  # condition markers
│   ├── gamePlans.json   # Game Plan tokens
│   ├── aoeTemplates.json
│   └── generic.json     # generic catalog
├── hooks/               # token generator state, preview, export, worker
├── components/
│   ├── primitives/      # shared fields, buttons, panels, SVG loupe
│   └── token-editor/    # guild selector, token lists, config, preview and export panels
└── styles/              # design tokens and shared CSS modules
public/
├── fonts/               # token fonts (OFL, license beside each)
└── icons/               # guilds/<Guild>/logo.svg, conditions/, manifest.json
```

Imports inside one area are relative; imports that leave it use the `@/` alias for `src/`.

## Deploy

The app is deployed as a Cloudflare Worker with static assets only, no Worker script (see `wrangler.jsonc`). `not_found_handling: "single-page-application"` serves `index.html` for client-side routes like `/guild/<id>`, and `public/_headers` caches the hashed files under `/assets/` for good.

The repo is connected to Cloudflare Workers Builds, so every merge to `main` builds and deploys on its own. `npm run deploy` still works for a manual deploy from a local checkout after `npx wrangler login`. If the shell exports a narrower Cloudflare API token (`CF_API_TOKEN` or `CLOUDFLARE_API_TOKEN`), Wrangler uses it instead of the login; run the command with `env -u CF_API_TOKEN -u CLOUDFLARE_API_TOKEN` in front.

## Design system

The UI follows the club's design system: dark-only theme, sharp corners, orange accent over a near-black base. The palette, scales and fonts come from [`@cckarchev/shared`](https://github.com/cckarchev/cck-shared) (`fonts.css` and `tokens.css`, imported in `src/main.tsx`). `src/styles/tokens.css` only adds the tokens specific to this tool, and `src/styles/tokens.test.ts` fails on any loose color or size literal outside them.

## Fonts

The token fonts in `public/fonts/` are licensed under the SIL Open Font License, with each license file next to its font: Saira Condensed (default), Fira Sans Condensed, Atkinson Hyperlegible, Lilita One, Germania One and Fraunces. The interface fonts (Big Noodle Titling, Barlow and JetBrains Mono) are self-hosted through `@cckarchev/shared`.

## Credits

The character, effect and guild data started from [GBPlaybook](https://github.com/cleech/GBPlaybook), the Guild Ball play assist app, and the guild crests come from its icon font. Thanks to its author and contributors for the card data and the icons this generator is built on.

## Disclaimer

This website is completely unofficial and in no way endorsed by Steamforged Games Limited. Guild Ball and all associated names, guilds, players, and game terms are trademarks of Steamforged Games Limited. No challenge to their status is intended. All such material is used without permission for non-commercial, fan use only.

See [NOTICE](NOTICE) for the full notice.
