# Data files (`assets/data/`)

All JSON files that drive the site. Edit these directly — no build step for most.

---

## `image-map.json`

**Built by** `npm run build:images`. Maps image filenames to their paths under `assets/images/`. Do not edit by hand.

When you add or move images, run `npm run build:images` so the site can find them by filename. In `pages.json`, `widgets.json`, etc., use just the filename (e.g. `"html-widgets.png"`) and the site resolves the path.

---

## `inventory.json`

**DexNeXuS Inventory** — Items, craftables, and materials. Drives the Inventory page with JSON-driven cards and images.

Structure:
```json
{
  "categories": {
    "standalone": { "title": "...", "description": "...", "items": [...] },
    "craftable": { ... },
    "materials": { ... }
  }
}
```

Each item: `id`, `name`, `image` (filename in `assets/images/inventory/`), `price`, `tags`, `flavour`, `effect`, `recipe`, `obtainable`, `use`, `limit`, etc.

Placeholder images: `node tools/create-inventory-placeholders.mjs` creates SVGs. Replace with real PNGs when ready.

---

## `widgets.json`

**Browser-source widgets** for OBS. Each card shows on the HTML Widgets page with Open, Download, and Copy URL buttons.

### Structure

```json
{
  "widgets": [
    {
      "id": "my-widget",
      "name": "My Widget",
      "description": "What it does.",
      "image": null,
      "file": "my-widget.html",
      "link": null,
      "showOnDiscover": false,
      "actions": ["open", "download", "copyUrl"],
      "discoverOrder": 50
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|--------------|
| **id** | Yes | Unique ID (used for anchors, Discover). Defaults from filename if omitted. |
| **name** | Yes | Display name |
| **description** | No | Short description (shown on card) |
| **image** | No | Preview image path or URL. `null` = compact placeholder. |
| **file** | Yes* | Filename in `widgets/` folder (e.g. `my-widget.html`) |
| **link** | No | Hosted URL. If set, Open/Copy URL use this instead of local path. |
| **showOnDiscover** | No | `true` = can appear on home Discover grid (when no discover.json, or in fallback) |
| **actions** | No | `["open","download","copyUrl"]`. Omitted = inferred from file/link. |
| **discoverOrder** | No | Sort order in Discover (default 50) |

\* If you have `link` but no `file`, it's hosted-only (no Download).

### How to add a widget

1. Create an HTML file in `widgets/` (e.g. `widgets/my-widget.html`).
2. Add an entry to `widgets.json`:
   ```json
   {
     "id": "my-widget",
     "name": "My Widget",
     "description": "Does X.",
     "image": null,
     "file": "my-widget.html"
   }
   ```
3. That's it. No build step.

---

## `discover.json`

**Home page Discover grid** order. List page slugs and widget ids in the order you want them.

```json
{
  "items": ["twitch", "commands", "streamerbot", "obs", "simple-clock", "countdown", "html-widgets"]
}
```

- Page slugs: from `pages.json` (e.g. `obs`, `streamerbot`, `html-widgets`).
- Widget ids: from `widgets.json` (e.g. `simple-clock`, `countdown`).

If this file is missing or empty, the grid falls back to: all pages + widgets with `showOnDiscover`, sorted by order.

---

## `mentions.json`

**"Inspired by"** section on the home page. People/resources that inspired this hub.

```json
[
  {
    "name": "Example Creator",
    "url": "https://example.com",
    "description": "Optional short line"
  }
]
```

| Field | Description |
|-------|-------------|
| name | Display name |
| url | Link URL |
| description | Optional short line |

---

## `pages.json`

**Page manifest** — built by `npm run build` from `content/*.html` files. Do not edit directly. To add a page: create `content/NN-name.html` with a `<!--dex ... -->` block, then run `npm run build`.

---

## `overlays.json`

**OBS overlays** (browser sources). Each lives in `obs/overlays/` or similar.

```json
{
  "overlays": [
    {
      "id": "king-queen",
      "name": "King-Queen",
      "file": "king-queen/index.html",
      "description": "Panel overlay; use with Streamer.bot WebSocket.",
      "pageSlug": "king-queen"
    }
  ]
}
```

---

## `action-imports.json`

**Streamer.bot** action import strings. Points to `.txt` files with the import data.

```json
[
  {
    "id": "flash-sale",
    "name": "Flash Sale",
    "file": "streamerbot/action-imports/flash-sale.txt",
    "description": "Turn any channel point reward into a timed flash sale.",
    "pageSlug": "flash-sale"
  }
]
```

---

## `site-config.json`

**Site-wide settings.** Base URL for copy links, header social links.

```json
{
  "baseUrl": "https://yoursite.com",
  "links": [
    { "label": "GitHub", "href": "https://github.com/you", "icon": "simple-icons:github" }
  ]
}
```

---

## `commands.json`

**Twitch commands** catalog. Built/exported from Streamer.bot or another source. Format is custom per export.

---

## `streaming-rota.json`

**Stream schedule.** Recurring days/times, overrides, cancelled dates.

```json
{
  "recurring": [
    { "dayOfWeek": 3, "label": "Game stream", "time": "19:00" }
  ],
  "overrides": {},
  "cancelled": []
}
```

`dayOfWeek`: 0=Sun, 1=Mon … 6=Sat.

---

## `games.json`

**Games Played** — Drives the Games page. Each game is a card on the list; clicking one opens a detail page (`?page=game&id=...`) with trailer, your review, dates, rating, and links.

### Structure

```json
{
  "games": [
    {
      "id": "rocksmith",
      "name": "Rocksmith",
      "description": "What I thought about the game…",
      "rating": 4,
      "dateStarted": "2024-01-15",
      "dateCompleted": null,
      "links": [
        { "label": "Tutorial", "url": "https://youtube.com/..." },
        { "label": "Overlay", "url": "?page=rocksmith" }
      ],
      "youtubeVideoId": "e6vxL0lqP-c",
      "tutorialYoutubeId": null,
      "image": "rocksmith.png",
      "imageUrl": null,
      "platform": "PC",
      "genre": "Rhythm / Music",
      "tags": ["music", "guitar"],
      "status": "playing",
      "rotaDay": "Friday"
    }
  ]
}
```

### Fields (per game)

| Field | Required | Description |
|-------|----------|-------------|
| **id** | Yes | Unique ID. Used in the URL: `?page=game&id=rocksmith`. |
| **name** | Yes | Display name (card and detail page title). |
| **description** | No | Optional short summary (e.g. for cards). |
| **review** | No | **Your full review** — what you thought about the game, what worked, what didn’t, would you recommend it. Line breaks are kept. Shown under “My review” on the detail page. If omitted, `description` is shown instead. |
| **rating** | No | 1–5. Shown as stars (★★★★☆) on card and detail page. |
| **dateStarted** | No | When you started (e.g. `"2024-01-15"`). Shown on card and detail. |
| **dateCompleted** | No | When you finished. Use `null` if still playing (shows “Still playing”). |
| **links** | No | Array of `{ "label": "…", "url": "…" }`. Tutorials, overlays, internal `?page=...` links, etc. |
| **youtubeVideoId** | No | YouTube **video ID** only (e.g. from `youtube.com/watch?v=e6vxL0lqP-c` → `e6vxL0lqP-c`). Embedded as “Trailer” on the detail page. |
| **tutorialYoutubeId** | No | Optional second embed, labelled “Tutorial”. |
| **image** | No* | **Local image:** filename only (e.g. `rocksmith.png`). Loaded from `assets/images/games/`. Put the file in `Streaming/assets/images/games/`. |
| **imageUrl** | No* | **External image:** full URL (e.g. `https://…`). Used for card and detail hero if set; overrides `image` when both exist. |
| **platform** | No | e.g. `"PC"`, `"PS5"`. Shown as meta on detail page. |
| **genre** | No | e.g. `"Rhythm / Music"`. Shown as meta. |
| **tags** | No | Array of strings (for your own use / future filtering). |
| **status** | No | e.g. `"playing"`, `"completed"`. Shown as meta. |
| **rotaDay** | No | e.g. `"Friday"`. Shown as “On my schedule: Friday” with a link to the Streaming Rota page. |

\* Use **one** of `image` or `imageUrl`: **image** = file in `assets/images/games/`; **imageUrl** = any full image URL.

### How to add a game

1. Add an object to the `games` array in `games.json` with at least `id` and `name`.
2. For a **local image**, add the image file to **`Streaming/assets/images/games/`** (e.g. `rocksmith.png`) and set `"image": "rocksmith.png"`.
3. For an **external image**, set `"imageUrl": "https://..."` and leave `image` out (or it will be ignored).
4. Set `youtubeVideoId` to the trailer’s video ID (optional). Add `tutorialYoutubeId` if you want a second embedded video.
5. No build step. The Games list and detail page (`?page=games`, `?page=game&id=...`) read from this file at runtime.

---

## `music.json`

**Music page** — albums, tabs, and tracks. Each track can use a **URL** (recommended for GitHub, no large files) or a **local file** under `assets/music/`.

### Track source (use one)

| Field   | Use |
|--------|-----|
| **url** | Full URL to the audio file (e.g. `https://.../track.mp3`). Use this when you host audio elsewhere so you don’t upload large files to the repo. |
| **file** | Path relative to `assets/music/` (e.g. `album-name/track.wav`). Audio must exist in `Streaming/assets/music/`. |

If both are set, **url** is used. Optional **artworkUrl** = full URL to cover image (otherwise **artwork** = filename in `assets/images/`). Other fields: `title`, `artist`, `album`, `tab`, `id`.

---

## `touch-portal.json`

**Touch Portal** pages and buttons. Built by `npm run build:touch-portal` from `touch-portal/` folder. Edit source files, then run the build.
