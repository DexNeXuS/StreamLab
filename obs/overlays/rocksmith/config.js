// ============================================
// Rocksmith Widget Configuration
// ============================================
// This widget combines:
// - RockSniffer polling (local HTTP JSON)
// - Streamer.bot WebSocket broadcasts (StreamerBot -> overlay)
// - Optional DoAction (overlay -> StreamerBot action) for inbound messages
//
// Edit values below to match your setup.

const CONFIG = {
  // --------------------------------------------
  // Visual / Aesthetic
  // --------------------------------------------
  THEME: {
    // Dex neon stack (emissive, moody, not "UI-default")
    // Default purple (matches your stat-label palette)
    ACCENT: "#7C3AED", // violet-600
    ACCENT_2: "#6B21A8", // violet-800 (deep glow)
    TEXT: "#EDE9FF",
    MUTED: "rgba(199, 182, 255, 0.82)",
    // Near-black purple panels
    GLASS_BG: "rgba(10, 6, 16, 0.78)",
    GLASS_STROKE: "rgba(124, 58, 237, 0.6)",
    SHADOW: "rgba(0, 0, 0, 0.65)",
  },

  // Base size (widget is responsive; OBS can also scale the source)
  WIDGET_WIDTH_PX: 520,

  // --------------------------------------------
  // Rotator
  // --------------------------------------------
  ROTATOR_ENABLED: true,
  ROTATOR_INTERVAL_MS: 10000,

  // Order of cards (IDs are defined in script.js)
  ROTATOR_ORDER: ["now", "performance", "streak", "accuracy", "session", "custom"],

  // --------------------------------------------
  // RockSniffer (local sniffer service)
  // --------------------------------------------
  ROCKSNIFFER_ENABLED: true,
  ROCKSNIFFER_IP: "127.0.0.1",
  ROCKSNIFFER_PORT: 9938,
  ROCKSNIFFER_POLL_INTERVAL_MS: 150,

  // Arrangement fallback (used by RockSniffer helpers)
  DEFAULT_PATH: "Lead",

  // --------------------------------------------
  // Streamer.bot WebSocket (StreamerBot -> overlay)
  // --------------------------------------------
  // IMPORTANT: Streamer.bot event bus is /ws (not the root endpoint).
  WS_ENABLED: true,
  WS_URL: "ws://127.0.0.1:8080",

  // Unique ID for this overlay subscription
  OVERLAY_ID: "rocksmith-widget",

  // --------------------------------------------
  // Streamer.bot Client
  // --------------------------------------------
  // This listens for Misc.GlobalVariableUpdated and parses the variable as JSON.
  SB_CLIENT_ENABLED: true,
  SB_CLIENT_ENDPOINT: "/",
  SB_GLOBAL_VAR_NAME: "dex_ROCKSMITH_WIDGET",

  // --------------------------------------------
  // Streamer.bot DoAction (overlay -> StreamerBot)
  // --------------------------------------------
  // Optional. If you want the overlay to send events back to Streamer.bot,
  // create an action in Streamer.bot and paste its ID here.
  RECEIVER_ACTION_ID: "",

  // --------------------------------------------
  // Debug overlay (on-screen)
  // --------------------------------------------
  DEBUG_ENABLED: false,
};

// RockSniffer dependency globals (used by addons/_deps/sniffer-poller.js)
// We set them here so SnifferPoller works without needing addons/config.js.
var ip = CONFIG.ROCKSNIFFER_IP;
var port = CONFIG.ROCKSNIFFER_PORT;
var defaultPath = CONFIG.DEFAULT_PATH;

