# Resource module template

Use this checklist to add a new resource in 2–5 minutes without breaking nav or copy behavior. The site is **manifest-driven**: no manual nav edits, no pathname-based logic.

---

## 1. New page (required)

- Create **content/NN-name.html** (e.g. `content/27-my-resource.html`).
- Add a **dex meta block** at the top:

```html
<!--dex
title: My Resource
group: Resources
order: 27
description: One-line description for nav and cards.
tags: streamerbot, obs, my-tag
og_image: assets/images/my-resource/card.png
-->
```

- **Required:** `title`, `group`, `order`, `description`.
- **Optional:** `tags` (comma-separated), `og_image` or `card_image` (path to image for cards/Open Graph), `slug` (if you need a custom URL slug).

- Run **`node tools/build-pages.mjs`**. The new page appears in nav automatically.

---

## 2. Streamer.bot action import (if the resource has an import)

- Add **streamerbot/action-imports/name.txt** with the raw Streamer.bot export string.
- Add an entry to **assets/data/action-imports.json**:

```json
{
  "id": "my-resource",
  "name": "My Resource",
  "file": "streamerbot/action-imports/my-resource.txt",
  "description": "Short description.",
  "pageSlug": "my-resource"
}
```

- On the detail page, add a copy box where the import should appear:

```html
<div data-dx-import-box="streamerbot/action-imports/my-resource.txt"></div>
```

---

## 3. Overlay (if the resource has an OBS browser-source overlay)

- Create **obs/overlays/name/** with `index.html` and any assets (css, js, images).
- Add an entry to **assets/data/overlays.json**:

```json
{
  "id": "my-resource",
  "name": "My Resource",
  "file": "my-resource/index.html",
  "description": "Short description.",
  "pageSlug": "my-resource"
}
```

- On the detail page, add the overlay URL box (same URL as on the OBS page):

```html
<div data-dx-overlay-url="my-resource/index.html"></div>
```

- Overlay URLs use **site-config.json** `baseUrl` — never hardcode the domain.

---

## 4. Reference scripts (.cs, .ini)

- Add **streamerbot/scripts/name/** with Run.cs, config.ini, etc.
- Link from content:

```html
<a href="streamerbot/scripts/my-resource/Run.cs" download target="_blank" rel="noopener noreferrer">Run.cs</a>
```

---

## 5. Images

- Put screenshots and per-resource images under **assets/images/&lt;slug&gt;/** (e.g. `assets/images/my-resource/screenshot.png`).
- Link from content: `assets/images/my-resource/screenshot.png`.
- Touch Portal button files go in **touch-portal/buttons/** (e.g. `touch-portal/buttons/my-resource.tpb`).

---

## 6. Version history (optional)

- Add **versions-and-changes/CHANGES_&lt;slug&gt;.txt** and **versions-and-changes/VERSION_&lt;slug&gt;.txt**.
- Link from the resource page. See **versions-and-changes/README.md** for the convention.

---

## Quick reference: where things live

| What | Where |
|------|--------|
| Page content | content/NN-name.html |
| Action import .txt | streamerbot/action-imports/name.txt |
| Action imports list | assets/data/action-imports.json |
| Overlay HTML | obs/overlays/name/index.html |
| Overlays list | assets/data/overlays.json |
| Reference .cs / .ini | streamerbot/scripts/name/ |
| Images | assets/images/&lt;slug&gt;/ |
| Touch Portal buttons | touch-portal/buttons/ |
| Changelog / version | versions-and-changes/CHANGES_&lt;slug&gt;.txt, VERSION_&lt;slug&gt;.txt |

---

## After adding a new page

1. Run **`node tools/build-pages.mjs`** so pages.json is updated.
2. Commit. No edits to app.js or manual nav.
