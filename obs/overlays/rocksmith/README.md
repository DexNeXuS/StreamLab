# Rocksmith Widget (OBS / Browser Source)

Location: `Rocksmith/widget/`

This widget is a **Twitch-purple glass** Rocksmith overlay with a **rotating stat deck**:
- Now playing (song / artist / tuning / progress)
- Performance (score / accuracy / notes)
- Streak (streak / multiplier)
- Accuracy (bar + optional lifetime fields)
- Session + Custom cards driven by Streamer.bot

---

## Use in OBS

Add a **Browser Source** pointing to:

`Rocksmith/widget/index.html`

---

## RockSniffer (live Rocksmith stats)

This widget polls RockSniffer at:

`http://127.0.0.1:9938`

If your RockSniffer IP/port are different, edit:

`Rocksmith/widget/config.js`

---

## Streamer.bot live updates (StreamerBot → Widget)

This widget supports **two** Streamer.bot integration styles:

### 1) `tawmae-main/overlays` style (recommended)
Uses `@streamerbot/client` and listens for:

- `Misc.GlobalVariableUpdated`

You set a Global Variable (default name: `dex_ROCKSMITH_WIDGET`) to a JSON payload.

You can change the variable name via URL:
- `?gv=YOUR_GLOBAL_VAR_NAME`

### 2) WebSocket Custom events (fallback / optional)
The widget also supports Streamer.bot WebSocket **event bus** Custom broadcasts:

`ws://127.0.0.1:8080/ws`

### Streamer.bot requirements
- In Streamer.bot: **Servers/Clients → WebSocket Server** must be enabled.
- You must use the `/ws` endpoint (the root endpoint does **not** emit events).

### Send messages from Streamer.bot (C# action)

#### Option A: Global Variable update (recommended)
Set the global variable to a JSON string that looks like the same payload you’d broadcast:

```json
{
  "type": "rs:set",
  "data": {
    "sessMain": "Warmup → Alt picking",
    "sessGoal": "100% Accuracy",
    "sessFocus": "Timing",
    "sessMode": "RR / Learn a Song",
    "customLabel": "Chat Request",
    "customValue": "Through The Fire and Flames",
    "customExtra": "Next up",
    "playerImageUrl": "https://.../avatar.png"
  }
}
```

#### Option B: Broadcast Custom event
Use `CPH.WebsocketBroadcastJson()` to push updates into the widget:

```csharp
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        JObject msg = new JObject
        {
            ["type"] = "rs:set",
            ["data"] = new JObject
            {
                ["sessMain"] = "Warmup → Alt picking",
                ["sessGoal"] = "100% Accuracy",
                ["sessFocus"] = "Timing",
                ["sessMode"] = "RR / Learn a Song",
                ["customLabel"] = "Chat Request",
                ["customValue"] = "Through The Fire and Flames",
                ["customExtra"] = "Next up"
            }
        };

        CPH.WebsocketBroadcastJson(msg.ToString());
        return true;
    }
}
```

### Toast (pop-up)

Broadcast:

```json
{ "type": "rs:toast", "text": "New PB streak!", "ms": 2500 }
```

### Force rotate

```json
{ "type": "rs:rotate", "to": "next" }
```

Or jump to a specific card id:

```json
{ "type": "rs:rotate", "to": "performance" }
```

Card ids: `now`, `performance`, `streak`, `accuracy`, `session`, `custom`

---

## URL parameters (position / size / style)

These match the “URL arguments” pattern you’re using in other overlays.

- **Streamer.bot**
  - `address`: default `127.0.0.1`
  - `port`: default `8080`
  - `password`: default empty
  - `gv`: global variable name (default `dex_ROCKSMITH_WIDGET`)

- **RockSniffer**
  - `rsIp`: default `127.0.0.1`
  - `rsPort`: default `9938`

- **Layout**
  - `pos`: `tl` (default), `tr`, `bl`, `br`, `tc`, `bc`, `ml`, `mr`, `c`
  - `m`: margin in px (default `25`)
  - `x`,`y`: absolute px positioning (overrides `pos`)
  - `w`: width in px (overrides config)
  - `scale`: e.g. `1`, `0.85`, `1.2`
  - `style`: preset layouts
    - `style=default` (default)
    - `style=narrow` (smaller width, **taller** stacked layout)
    - `style=tall` (default width, taller layout)
    - `style=wide` (wider)
    - `narrow=1` (back-compat alias for `style=narrow`)
  - `idleCompact=0`: disable auto “idle compact” mode (enabled by default)
  - `status=0`: hide the status pills
  - `playerImage`: force an image (url or `data:`)
  - `art`: `auto` (default), `album`, `player`, `off`
  - `bg`: alias for `art`

- **Theme overrides (colors)**
  - NOTE: if you pass hex colors, you must URL-encode the `#` as `%23`
  - `accent` (alias `a`): primary accent, e.g. `accent=%238A2BE2`
  - `accent2` (aliases `a2`, `accent_2`): glow accent, e.g. `accent2=%23C285FF`
  - `text`: text color, e.g. `text=%23EDE9FF`
  - `muted`: muted text color, can be `rgba(...)` too
  - `glass`: panel background, e.g. `glass=rgba(10,6,16,0.78)`
  - `stroke`: panel border stroke, e.g. `stroke=rgba(194,133,255,0.55)`
  - `shadow`: main shadow color, e.g. `shadow=rgba(0,0,0,0.65)`
  - `ok`, `warn`, `danger`: status dot colors

- **Background (cover art) tuning**
  - `bgFade`: cover image opacity when enabled (0..1). Default `0.55`
  - `bgBlur`: blur amount in px (0..80). Default `16`
  - `bgSat`: saturation multiplier (0..3). Default `1.1`
  - `bgBright`: brightness multiplier (0..2). Default `0.72`
  - `tint`: tint layer color (any CSS color, e.g. `rgba(6,4,10,0.42)` or `%23000000`)
  - `tintFade`: tint layer opacity (0..1). Default `1`
  - `texture`: analog texture opacity (0..1). Default `0.28` (set `0` to disable)

Example:

`Rocksmith/widget/index.html?pos=br&m=24&style=narrow&w=400&scale=1&address=127.0.0.1&port=8080&gv=dex_ROCKSMITH_WIDGET`

Theme example (hex needs %23):

`Rocksmith/widget/index.html?style=wide&accent=%237C3AED&accent2=%236B21A8&bg=album&bgFade=0.65&tint=rgba(0,0,0,0.35)`

## Optional: Widget → Streamer.bot (DoAction)

If you want the overlay to send messages back into Streamer.bot, set:

`CONFIG.RECEIVER_ACTION_ID`

in `Rocksmith/widget/config.js` to the action’s GUID (right-click action → **Copy ID**).

Then broadcast:

```json
{ "type": "rs:send", "data": { "hello": "from overlay" } }
```

The action will receive that object inside its `args`.

