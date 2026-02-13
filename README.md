# DexNeXuS — Streaming Lab

A tiny static site for sharing streaming resources (OBS / Streamer.bot / Touch Portal / HTML widgets).

## Run locally

Because this site loads content via `fetch()`, it needs a local server (opening `index.html` via `file://` won’t work reliably).

From the `Streaming/` folder:

- **Python (recommended)**:
  - `python -m http.server 5173`
  - Then open `http://localhost:5173/`

## Add a new page (easy mode)

1. Create a new file in `Streaming/content/`, e.g. `50-my-new-page.html`
2. Put a metadata block at the top (optional but recommended):

```html
<!--dex
title: My New Page
group: Resources
order: 50
description: What this page is about.
tags: obs, streamerbot
-->
```

3. Run the manifest generator:
   - `npm run build` (or `node tools/build-pages.mjs`)
4. Refresh the site — the nav will update automatically.

## Copy-to-clipboard blocks

Use this pattern in any content page:

```html
<div class="dx-copy-box">
  <span class="dx-copy-text" id="my-import" data-copy-text="PASTE_IMPORT_STRING_HERE">
    PASTE_IMPORT_STRING_HERE
  </span>
  <button class="dx-btn dx-btn--primary" type="button" data-copy-id="my-import">Copy</button>
</div>
```

**Collapsible sections (How to / Examples):** Use `<details class="dx-accordion dx-card">` with `<summary>` and `<div class="dx-accordion-body">` so visitors can expand only what they need. Keeps resource pages clean.

Accordions are just `<details>`:

```html
<details class="dx-accordion dx-card" style="margin-top: 14px;">
  <summary>How to set up</summary>
  <div class="dx-accordion-body">
    <p class="dx-muted">Your steps here.</p>
  </div>
</details>
```

**Streamer.bot import box** (`data-dx-import-box="path/to/file.txt"`): Shows a short preview of the import string with **Copy**, **Download**, and **Open** buttons. The box height is limited so it doesn’t dominate the page.

## Folder structure (where things go)

| Folder | Purpose | How to add / link |
|--------|---------|-------------------|
| **content/** | Page HTML fragments. One file per page. | New page → new `NN-name.html`; run `node tools/build-pages.mjs`. Nav reads `assets/data/pages.json`. |
| **assets/data/** | JSON that drives the site: `pages.json`, `overlays.json`, `widgets.json`, `action-imports.json`, `site-config.json`, `mentions.json`, `commands.json`, `discover.json`. | Edit JSON; overlays/widgets/mentions (Inspired by) update automatically. `discover.json` controls Discover grid order (page slugs + widget ids). |
| **assets/images/** | Screenshots, example images. | Put images in any subfolder. Reference by **filename only** in JSON (e.g. `"html-widgets.png"`). Run `npm run build:images` after adding/moving. See `assets/images/README.md`. |
| **assets/css/**, **assets/js/** | Styles and app logic. | Edit as needed. |
| **action-imports/** | Streamer.bot import strings (one .txt per action/plugin). | Add `name.txt`; add an entry in `assets/data/action-imports.json` with `"file": "action-imports/name.txt"`. |
| **overlays/** | OBS browser-source overlays (e.g. `king-queen/`, `rocksmith/`). Each has `index.html` + assets. | Add a folder; add entry in `assets/data/overlays.json` with `"file": "overlay-id/index.html"`. |
| **resources/** | Reference files (e.g. .cs scripts, .ini) for download. | Add `topic/Run.cs` or `topic/file.ini`; link from content as `resources/topic/file.ext`. |

No per-feature asset folders: use **assets/images/** for all page images and downloads so the structure stays simple.

## GitHub Pages notes

- If your repo is published with GitHub Pages, this site will be reachable at:
  - `.../Streaming/` (because `index.html` lives inside `Streaming/`)
- If you want the site at the root (no `/Streaming/`), move the contents of `Streaming/` to the repo root later.

