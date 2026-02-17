# Layout & Navigation — Notes

## What works well

- **Start Here → Home** — Clear entry point; Discover grid lets people browse
- **Grouped nav** — Start Here, Streaming, Resources, About keeps related pages together
- **Search** — Header search filters Discover and nav
- **Related section** — Auto-suggested links at bottom of each page

## What feels "wild"

- **Resources is huge** — 16+ items (Streamer.bot, OBS, Touch Portal, King-Queen, Ollama, Rocksmith, Flash Sale, CMD CTRL, Get Commands, Random Media, etc.). Hard to scan.
- **Streaming vs Resources overlap** — Twitch, Commands, Rota are "Streaming"; Streamer.bot, OBS, Touch Portal are "Resources" but they're all streaming-related.
- **Some pages are very similar** — e.g. CMD CTRL, Get Commands, Flash Sale are all Streamer.bot actions; they could live under a "Streamer.bot Actions" sub-section.

## Suggestions

1. **Split Resources** into sub-groups:
   - **Tools**: OBS, Streamer.bot, Touch Portal, VoiceMeeter, VoiceMod, StreamElements
   - **Actions** (Streamer.bot): King-Queen, Ollama, Rocksmith, Flash Sale, CMD CTRL, Get Commands, Random Media
   - **Widgets**: HTML Widgets

2. **Or** keep flat but reorder by "most used first" (e.g. OBS, Streamer.bot, Touch Portal near top).

3. **Nested nav** — Desktop could show Resources as a mega-menu with sub-sections. Mobile: collapsible groups.

4. **Hide rarely used** — `hideFromNav: true` for Inventory, Backups. Consider hiding more until needed.

## Image guidelines

- **Hero images** (top of page): Already flexible — `height: auto`, `max-height: 70vh`. Good.
- **Page cards** (e.g. Twitch grid): Now `height: auto`, `max-height: 280px` — no fixed aspect ratio.
- **In-content images**: Use `dx-content-img-wrap` or `dx-content-img` for screenshots — max 480px wide, 320px tall so they don't dominate.
