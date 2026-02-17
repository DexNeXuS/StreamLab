# King-Queen overlay — configuration

Defaults live in `config.js`. You can override any option via the overlay URL so you don’t have to edit the file — add `?param=value` to the Browser Source URL. Param names are **lowercase**; booleans use `1`/`true`/`yes` or `0`/`false`/`no`.

## URL parameters (override config)

Add these to the overlay URL, e.g.:

`.../king-queen/index.html?ws_url=ws://127.0.0.1:8080&timer_duration=30&debug_enabled=true`

| Param | Description |
|-------|-------------|
| `ws_url` | WebSocket URL (e.g. `ws://127.0.0.1:8080`) |
| `ws_enabled` | `1` or `0` |
| `overlay_id` | Unique overlay id |
| `receiver_action_id` | Streamer.bot action GUID for overlay → SB |
| `debug_enabled` | `1` or `0` (show connection log) |
| `king_top`, `king_left` | King panel position (e.g. `50px`) |
| `queen_top`, `queen_right` | Queen panel position |
| `avatar_size`, `crown_height`, `tiara_height`, `name_font_size` | Sizes (e.g. `75px`, `20px`) |
| `timer_duration` | Seconds before auto-hide (number) |
| `startup_hide_duration` | Seconds visible on load (number) |
| `redeem_sound`, `tick_sound` | Path or URL; empty to disable |
| `sound_volume` | `0` to `1` |

## Config file (defaults)

Same options in `config.js`; URL params override them.

### WebSocket

- **WS_ENABLED** — `true` / `false`. Turn off to test without Streamer.bot.
- **WS_URL** — Streamer.bot WebSocket URL, e.g. `ws://127.0.0.1:8080`. Match the port in Streamer.bot → Settings → WebSocket Server.
- **OVERLAY_ID** — Unique id for this overlay (e.g. `king-queen-overlay`). Used when subscribing to events.
- **RECEIVER_ACTION_ID** — Optional. If you want the overlay to send messages back to Streamer.bot, paste the action’s GUID here (right-click action → Copy ID). Leave empty if you don’t need two-way communication.

### Debug

- **DEBUG_ENABLED** — `true` shows connection status and message log on screen; `false` hides it for streaming.

### Position & layout

- **KING_TOP**, **KING_LEFT** — King panel position from top-left (e.g. `50px`).
- **QUEEN_TOP**, **QUEEN_RIGHT** — Queen panel position from top-right.
- **AVATAR_SIZE** — Circular avatar size (e.g. `75px`).
- **CROWN_HEIGHT**, **TIARA_HEIGHT** — Crown/tiara size.
- **NAME_FONT_SIZE** — Name text size.

### Timer

- **TIMER_DURATION** — Seconds before panels auto-hide (e.g. `60`).
- **STARTUP_HIDE_DURATION** — Seconds the panels stay visible on first load before auto-hiding (e.g. `5`). Set `0` to hide immediately.

### Sounds

- **REDEEM_SOUND** — Path or URL for the redeem sound (e.g. `sounds/trumpet.mp3`). Leave empty to disable.
- **TICK_SOUND** — Tick sound when timer is near the end. Leave empty to disable.
- **SOUND_VOLUME** — `0.0` to `1.0`.
