# Page images — hero and card artwork

Images here are used across **content pages** so every page has at least one picture. Many resource pages also have **How to set up** and **Examples** sections that can use optional setup/example images.

**Convention:** `page-images/<slug>.png` for the main hero image; `page-images/<slug>-setup.png` and `page-images/<slug>-example.png` where used.

Replace placeholders with your real screenshots or artwork (recommended: 16:10 or 4:3, min width ~400px). If a file is missing, the layout still works (gradient fallback or broken image until you add it).

**Hero image sizing:** The hero area **width** is always 100% of the content area. The **height** follows your image: a shorter image makes a shorter box, a taller image makes a taller box (up to a max of 70vh so one very tall image doesn’t dominate). No fixed aspect ratio — use any image shape and the box will match it.

---

## Every page — main hero image (at least one per page)

| File | Page |
|------|------|
| `home.png` | Home |
| `streamerbot.png` | Streamer.bot |
| `obs.png` | OBS |
| `touch-portal.png` | Touch Portal |
| `html-widgets.png` | HTML Widgets |
| `twitch-hero.png` | Twitch (top hero; page also uses cards below) |
| `commands.png` | Commands |
| `streaming-rota.png` | Streaming Rota |
| `inventory.png` | DexNeXuS Inventory |
| `about.png` | About |
| `links.png` | Links |

**Resource / overlay pages (one hero each):**

| File | Page |
|------|------|
| `king-queen.png` | King-Queen overlay |
| `ollama.png` | Ollama |
| `rocksmith.png` | Rocksmith |
| `flash-sale.png` | Flash Sale |
| `cmd-ctrl.png` | CMD CTRL |
| `get-commands.png` | Get Commands |
| `random-media-from-folder.png` | Random Media From Folder |
| `voicemeeter.png` | VoiceMeeter |
| `voicemod.png` | VoiceMod |
| `streamelements.png` | StreamElements |

---

## Twitch page cards (`content/60-twitch.html`)

| File | Used for |
|------|----------|
| `twitch-obs.png` | OBS card |
| `twitch-streamelements.png` | StreamElements card |
| `twitch-streamerbot.png` | Streamer.bot card |
| `twitch-touch-portal.png` | Touch Portal card |
| `twitch-voicemeeter.png` | VoiceMeeter card |
| `twitch-voicemod.png` | VoiceMod card |
| `twitch-html-widgets.png` | Custom HTML widgets card |
| `twitch-commands.png` | Commands + schedule card |
| `twitch-rota.png` | Streaming Rota card |

---

## Optional setup / example images (for How to set up & Examples sections)

Add these if you want a screenshot in those sections:

| File | Page |
|------|------|
| `streamerbot-setup.png`, `streamerbot-example.png` | Streamer.bot |
| `ollama-setup.png`, `ollama-example.png` | Ollama (refs in copy; add img if you want) |
| `obs-setup.png`, `obs-example.png` | OBS |
| `rocksmith-example.png` | Rocksmith |
| `flash-sale-setup.png`, `flash-sale-example.png` | Flash Sale |
| `cmd-ctrl-setup.png`, `cmd-ctrl-example.png` | CMD CTRL |
| `get-commands-setup.png` | Get Commands (example already has per-resource path) |
| `random-media-setup.png`, `random-media-example.png` | Random Media From Folder |
| `touch-portal-setup.png`, `touch-portal-example.png` | Touch Portal |
| `html-widgets-setup.png`, `html-widgets-example.png` | HTML Widgets |
| `king-queen-example.png` | King-Queen (optional) |

---

**Usage in HTML:** Hero at top of first card: wrap in `<div class="dx-page-hero-wrap">` and use `<img src="assets/images/page-images/<file>.png" alt="..." class="dx-page-card-img" loading="lazy" />`. For inline setup/example images, use a div with `aspect-ratio: 16/10` and the same img.
