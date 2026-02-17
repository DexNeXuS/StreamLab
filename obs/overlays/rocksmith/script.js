// ============================================
// Rocksmith Widget - main logic
// ============================================

const $id = (id) => document.getElementById(id);

function getParams() {
  try {
    return new URLSearchParams(window.location.search || "");
  } catch {
    return new URLSearchParams("");
  }
}

function getBoolParam(params, name, defaultVal = false) {
  const v = params.get(name);
  if (v == null) return defaultVal;
  return /^(1|true|yes|on)$/i.test(String(v).trim());
}

function getNumParam(params, name, defaultVal = null) {
  const v = params.get(name);
  if (v == null || v === "") return defaultVal;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultVal;
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function getStrParam(params, name, defaultVal = "") {
  const v = params.get(name);
  if (v == null) return defaultVal;
  const s = String(v).trim();
  return s.length ? s : defaultVal;
}

function parseCssColorToRgb(input) {
  if (!input) return null;
  const s = String(input).trim();
  // #rgb / #rrggbb
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
  }
  // rgb(...) / rgba(...)
  const rgb = s.match(/^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+)\s*)?\)$/i);
  if (rgb) {
    const r = clamp(parseInt(rgb[1], 10), 0, 255);
    const g = clamp(parseInt(rgb[2], 10), 0, 255);
    const b = clamp(parseInt(rgb[3], 10), 0, 255);
    return { r, g, b };
  }
  return null;
}

function buildRuntimeConfig() {
  const params = getParams();

  // Streamer.bot params
  const address = params.get("address") || "127.0.0.1";
  const port = parseInt(params.get("port") || "8080", 10);
  const password = params.get("password") || "";

  // RockSniffer params
  const rsIp = params.get("rsIp") || params.get("rsip") || CONFIG.ROCKSNIFFER_IP;
  const rsPort = parseInt(params.get("rsPort") || params.get("rsport") || String(CONFIG.ROCKSNIFFER_PORT), 10);

  const gvName = params.get("gv") || params.get("globalVar") || CONFIG.SB_GLOBAL_VAR_NAME;

  const widthPx = getNumParam(params, "w", null);
  const scale = getNumParam(params, "scale", 1);
  const style = (params.get("style") || "").toLowerCase();
  // Back-compat: narrow=1 implies style=narrow
  const narrowFlag = getBoolParam(params, "narrow", false);
  const resolvedStyle = style || (narrowFlag ? "narrow" : "default");
  const status = getBoolParam(params, "status", true);
  const idleCompact = getBoolParam(params, "idleCompact", true);

  // Positioning
  const pos = (params.get("pos") || "tl").toLowerCase(); // tl,tr,bl,br,tc,bc,ml,mr,c
  const x = getNumParam(params, "x", null);
  const y = getNumParam(params, "y", null);
  const m = getNumParam(params, "m", 50);

  const playerImageUrl = params.get("playerImage") || params.get("avatar") || params.get("img") || "";
  // art/bg controls the cover image behind the widget
  const artMode = (params.get("art") || params.get("bg") || "auto").toLowerCase(); // auto|album|player|off

  // Theme overrides (URL-driven)
  // NOTE: for hex colors you must URL-encode the # as %23 (e.g. accent=%238A2BE2)
  const theme = {
    accent: getStrParam(params, "accent", "") || getStrParam(params, "a", ""),
    accent2: getStrParam(params, "accent2", "") || getStrParam(params, "accent_2", "") || getStrParam(params, "a2", ""),
    text: getStrParam(params, "text", ""),
    muted: getStrParam(params, "muted", ""),
    glass: getStrParam(params, "glass", ""),
    stroke: getStrParam(params, "stroke", ""),
    shadow: getStrParam(params, "shadow", ""),
    ok: getStrParam(params, "ok", ""),
    warn: getStrParam(params, "warn", ""),
    danger: getStrParam(params, "danger", ""),
  };

  // Background layer controls
  const bgFade = getNumParam(params, "bgFade", null);
  const bgBlur = getNumParam(params, "bgBlur", null);
  const bgSat = getNumParam(params, "bgSat", null);
  const bgBright = getNumParam(params, "bgBright", null);
  const tint = getStrParam(params, "tint", "");
  const tintFade = getNumParam(params, "tintFade", null);
  const texture = getNumParam(params, "texture", null);

  return {
    params,
    sb: { address, port, password, endpoint: CONFIG.SB_CLIENT_ENDPOINT || "/" },
    rs: { ip: rsIp, port: Number.isFinite(rsPort) ? rsPort : CONFIG.ROCKSNIFFER_PORT },
    gvName,
    widthPx,
    scale: Number.isFinite(scale) ? scale : 1,
    style: resolvedStyle,
    status,
    idleCompact,
    pos,
    x,
    y,
    m,
    playerImageUrl,
    artMode,
    theme,
    bg: { bgFade, bgBlur, bgSat, bgBright, tint, tintFade, texture },
    wsUrl: `ws://${address}:${port}/ws`,
  };
}

const RUNTIME = buildRuntimeConfig();

const state = {
  sniffer: {
    ok: false,
    lastOkAt: 0,
    lastErrAt: 0,
    data: null,
  },
  ui: {
    compact: false,
    lastRotatorIdx: 0,
  },
  sb: {
    ok: false,
    connected: false,
    hasUpdate: false,
    lastMsgAt: 0,
  },
  custom: {
    // Session card
    sessMain: "—",
    sessGoal: "—",
    sessFocus: "—",
    sessMode: "—",

    // Custom card
    customLabel: "—",
    customValue: "—",
    customExtra: "—",

    // Images (optional)
    playerImageUrl: "",
  },
  rotator: {
    order: Array.isArray(CONFIG.ROTATOR_ORDER) ? CONFIG.ROTATOR_ORDER.slice() : ["now", "performance"],
    idx: 0,
    timer: null,
  },
  toastTimer: null,
  statusHideTimers: { rs: null, ws: null },
};

function applyThemeFromConfig() {
  const theme = (CONFIG && CONFIG.THEME) || {};
  const root = document.documentElement;
  const setColor = (cssVar, value, rgbBase) => {
    if (!value) return;
    const v = String(value).trim();
    if (!v.length) return;
    root.style.setProperty(cssVar, v);
    const rgb = parseCssColorToRgb(v);
    if (rgb && rgbBase) {
      root.style.setProperty(`${rgbBase}-r`, String(rgb.r));
      root.style.setProperty(`${rgbBase}-g`, String(rgb.g));
      root.style.setProperty(`${rgbBase}-b`, String(rgb.b));
    }
  };

  setColor("--accent", theme.ACCENT, "--accent");
  setColor("--accent2", theme.ACCENT_2, "--accent2");
  if (theme.TEXT) root.style.setProperty("--text", theme.TEXT);
  if (theme.MUTED) root.style.setProperty("--muted", theme.MUTED);
  if (theme.GLASS_BG) root.style.setProperty("--glass", theme.GLASS_BG);
  if (theme.GLASS_STROKE) root.style.setProperty("--stroke", theme.GLASS_STROKE);
  if (theme.SHADOW) root.style.setProperty("--shadow", theme.SHADOW);

  // URL overrides (theme + background controls)
  const t = (RUNTIME && RUNTIME.theme) || {};
  const setVar = (name, value) => {
    if (value != null && String(value).trim().length) root.style.setProperty(name, String(value).trim());
  };

  setColor("--accent", t.accent, "--accent");
  setColor("--accent2", t.accent2, "--accent2");
  setVar("--text", t.text);
  setVar("--muted", t.muted);
  setVar("--glass", t.glass);
  setVar("--stroke", t.stroke);
  setVar("--shadow", t.shadow);
  setVar("--ok", t.ok);
  setVar("--warn", t.warn);
  setVar("--danger", t.danger);

  const bg = (RUNTIME && RUNTIME.bg) || {};
  if (bg.bgFade != null) root.style.setProperty("--bg-fade", String(clamp(bg.bgFade, 0, 1)));
  if (bg.bgBlur != null) root.style.setProperty("--bg-blur", `${clamp(bg.bgBlur, 0, 80)}px`);
  if (bg.bgSat != null) root.style.setProperty("--bg-sat", String(clamp(bg.bgSat, 0, 3)));
  if (bg.bgBright != null) root.style.setProperty("--bg-bright", String(clamp(bg.bgBright, 0, 2)));
  if (bg.tint) root.style.setProperty("--tint-color", bg.tint);
  if (bg.tintFade != null) root.style.setProperty("--tint-opacity", String(clamp(bg.tintFade, 0, 1)));
  if (bg.texture != null) root.style.setProperty("--texture-opacity", String(clamp(bg.texture, 0, 1)));

  const glass = document.querySelector(".glass");
  if (glass) {
    glass.classList.remove("style-default", "style-narrow", "style-tall", "style-wide");
    const styleClass = `style-${RUNTIME.style || "default"}`;
    if (styleClass === "style-default" || styleClass === "style-narrow" || styleClass === "style-tall" || styleClass === "style-wide") {
      glass.classList.add(styleClass);
    } else {
      glass.classList.add("style-default");
    }

    // NOTE: inline width overrides CSS, so we choose the width here.
    // If no explicit ?w=, pick a width based on style preset.
    const presetWidth =
      // Make the presets more dramatic so the modes feel distinct.
      RUNTIME.style === "narrow" ? 320 :
      RUNTIME.style === "wide" ? 760 :
      CONFIG.WIDGET_WIDTH_PX;

    const w = RUNTIME.widthPx != null ? RUNTIME.widthPx : presetWidth;
    if (w) glass.style.width = `${w}px`;
  }
}

function setCompactMode(enabled) {
  const glass = document.querySelector(".glass");
  if (!glass) return;

  // If idle compact is disabled, never enter compact mode.
  if (!RUNTIME.idleCompact) enabled = false;
  if (state.ui.compact === enabled) return;

  state.ui.compact = enabled;

  if (enabled) {
    glass.classList.add("compact");

    // Freeze the rotator in compact mode (cleaner idle look)
    state.ui.lastRotatorIdx = state.rotator.idx;
    stopRotator();
    setActiveCard("now");
  } else {
    glass.classList.remove("compact");

    // Restore rotator
    rebuildRotatorOrder();
    rotateToIndex(state.ui.lastRotatorIdx || 0);
    startRotator();
  }
}

function applyLayoutFromUrl() {
  const widget = $id("widget");
  if (!widget) return;

  // Status toggle
  if (!RUNTIME.status) document.body.classList.add("noStatus");

  // Scale (OBS browser source can also scale, but this is convenient)
  const s = clamp(RUNTIME.scale, 0.2, 3);
  widget.style.transform = `scale(${s})`;

  // Anchor/position
  const m = Number.isFinite(RUNTIME.m) ? RUNTIME.m : 16;

  // Explicit x/y wins
  if (RUNTIME.x != null || RUNTIME.y != null) {
    widget.style.left = `${Number.isFinite(RUNTIME.x) ? RUNTIME.x : 0}px`;
    widget.style.top = `${Number.isFinite(RUNTIME.y) ? RUNTIME.y : 0}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    widget.style.transformOrigin = "top left";
    return;
  }

  // Preset positions
  const pos = RUNTIME.pos;
  const set = (left, top, right, bottom, origin) => {
    widget.style.left = left;
    widget.style.top = top;
    widget.style.right = right;
    widget.style.bottom = bottom;
    widget.style.transformOrigin = origin;
  };

  switch (pos) {
    case "tr":
      set("auto", `${m}px`, `${m}px`, "auto", "top right");
      break;
    case "bl":
      set(`${m}px`, "auto", "auto", `${m}px`, "bottom left");
      break;
    case "br":
      set("auto", "auto", `${m}px`, `${m}px`, "bottom right");
      break;
    case "tc":
      set("50%", `${m}px`, "auto", "auto", "top center");
      widget.style.transform = `translateX(-50%) scale(${clamp(RUNTIME.scale, 0.2, 3)})`;
      break;
    case "bc":
      set("50%", "auto", "auto", `${m}px`, "bottom center");
      widget.style.transform = `translateX(-50%) scale(${clamp(RUNTIME.scale, 0.2, 3)})`;
      break;
    case "ml":
      set(`${m}px`, "50%", "auto", "auto", "left center");
      widget.style.transform = `translateY(-50%) scale(${clamp(RUNTIME.scale, 0.2, 3)})`;
      break;
    case "mr":
      set("auto", "50%", `${m}px`, "auto", "right center");
      widget.style.transform = `translateY(-50%) scale(${clamp(RUNTIME.scale, 0.2, 3)})`;
      break;
    case "c":
      set("50%", "50%", "auto", "auto", "center");
      widget.style.transform = `translate(-50%, -50%) scale(${clamp(RUNTIME.scale, 0.2, 3)})`;
      break;
    case "tl":
    default:
      set(`${m}px`, `${m}px`, "auto", "auto", "top left");
      break;
  }
}

function resolveImg(url) {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  const isRemote = /^(https?:\/\/|data:|file:\/\/\/)/i.test(trimmed);
  return isRemote ? trimmed : trimmed;
}

function setPlayerImage(url) {
  const img = $id("playerImage");
  const wrap = img ? img.parentElement : null;
  if (!img || !wrap) return;

  const src = resolveImg(url);
  if (!src) {
    img.removeAttribute("src");
    wrap.classList.remove("has");
    return;
  }

  img.src = src;
  wrap.classList.add("has");
}

function setCoverBlur(url) {
  const el = $id("coverBlur");
  if (!el) return;
  const src = resolveImg(url);
  if (!src) {
    el.style.backgroundImage = "";
    el.classList.remove("on");
    return;
  }
  el.style.backgroundImage = `url('${src.replace(/'/g, "%27")}')`;
  el.classList.add("on");
}

function setDot(dotEl, mode) {
  if (!dotEl) return;
  dotEl.classList.remove("ok", "warn", "bad");
  if (mode) dotEl.classList.add(mode);
}

function updateStatusMode() {
  const pillsWrap = $id("statusPills");
  const signal = $id("signal");
  if (!pillsWrap || !signal) return;

  const allGood = !!state.sniffer.ok && !!state.sb.connected;
  if (allGood) {
    pillsWrap.classList.add("hidden");
    signal.classList.remove("hidden");
  } else {
    pillsWrap.classList.remove("hidden");
    signal.classList.add("hidden");
  }
}

function scheduleHidePill(which) {
  const pill = which === "rs" ? $id("rsPill") : which === "ws" ? $id("wsPill") : null;
  if (!pill) return;
  if (state.statusHideTimers[which]) clearTimeout(state.statusHideTimers[which]);
  state.statusHideTimers[which] = setTimeout(() => {
    pill.classList.add("hidden");
    updateStatusMode();
  }, 1100);
}

function showPill(which) {
  const pill = which === "rs" ? $id("rsPill") : which === "ws" ? $id("wsPill") : null;
  if (!pill) return;
  pill.classList.remove("hidden");
  updateStatusMode();
}

function setStatus(which, ok, text) {
  if (which === "rs") {
    const dot = $id("rsDot");
    const txt = $id("rsText");
    setDot(dot, ok ? "ok" : "warn");
    if (txt && text) txt.textContent = text;
    if (ok) scheduleHidePill("rs");
    else showPill("rs");
  }
  if (which === "ws") {
    const dot = $id("wsDot");
    const txt = $id("wsText");
    setDot(dot, ok ? "ok" : "warn");
    if (txt && text) txt.textContent = text;
    if (ok) scheduleHidePill("ws");
    else showPill("ws");
  }
  updateStatusMode();
}

function rebuildRotatorOrder() {
  const base = Array.isArray(CONFIG.ROTATOR_ORDER) ? CONFIG.ROTATOR_ORDER.slice() : ["now", "performance"];
  const order = base.filter((id) => {
    if (id === "custom") return state.sb.hasUpdate;
    return true;
  });

  state.rotator.order = order.length ? order : ["now", "performance"];

  // If current card vanished (e.g. custom before updates), snap to 0
  const currentId = state.rotator.order[state.rotator.idx];
  if (!currentId) {
    state.rotator.idx = 0;
    setActiveCard(state.rotator.order[0]);
  }
}

function debugLine(line) {
  if (!CONFIG.DEBUG_ENABLED) return;
  const dbg = $id("debug");
  const lines = $id("debugLines");
  if (!dbg || !lines) return;
  dbg.style.display = "block";
  const el = document.createElement("div");
  const ts = new Date().toLocaleTimeString();
  el.textContent = `[${ts}] ${line}`;
  lines.prepend(el);
  while (lines.children.length > 18) lines.removeChild(lines.lastChild);
}

function fmtInt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return Math.round(x).toLocaleString();
}

function fmtPct(n, decimals = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(decimals)}%`;
}

function fmtTimer(seconds) {
  const t = Number(seconds);
  if (!Number.isFinite(t) || t < 0) return "00:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setText(id, value) {
  const el = $id(id);
  if (!el) return;
  el.textContent = value == null || value === "" ? "—" : String(value);
}

function setWidth(id, pct) {
  const el = $id(id);
  if (!el) return;
  el.style.width = `${clamp(pct, 0, 100)}%`;
}

function getArrangementFromSniffer(snifferData) {
  if (!snifferData || !snifferData.songDetails || !snifferData.songDetails.arrangements || !snifferData.memoryReadout) {
    return null;
  }

  const arrangements = snifferData.songDetails.arrangements;
  const arrangementID = snifferData.memoryReadout.arrangementID;

  // Try ID match
  if (arrangementID && String(arrangementID).length === 32) {
    for (const a of arrangements) {
      if (a && a.arrangementID === arrangementID) return a;
    }
  }

  // Fallback: defaultPath if present (Lead/Rhythm/Bass)
  for (const a of arrangements) {
    if (!a) continue;
    if (a.isBonusArrangement || a.isAlternateArrangement) continue;
    if (a.name === defaultPath && a.type === defaultPath) return a;
  }

  // Any non-bonus arrangement
  for (const a of arrangements) {
    if (!a) continue;
    if (a.isBonusArrangement || a.isAlternateArrangement) continue;
    return a;
  }

  return null;
}

function updateFromSniffer(snifferData) {
  state.sniffer.data = snifferData;
  state.sniffer.ok = true;
  state.sniffer.lastOkAt = Date.now();

  const song = snifferData.songDetails || {};
  const readout = snifferData.memoryReadout || {};
  const notes = (readout && readout.noteData) || {};
  const arrangement = getArrangementFromSniffer(snifferData);

  // Auto-compact when not actively in a song
  // RockSniffer states: starting=3, playing=4 (see addons/_deps/sniffer-poller.js)
  const timer = Number(readout.songTimer) || 0;
  const cs = Number(snifferData.currentState);
  const inSong = cs === 3 || cs === 4 || timer > 0.5;
  setCompactMode(!inSong);

  // Image logic:
  // - If URL param provides a player image, use it.
  // - Else use Streamer.bot rs:set playerImageUrl if present.
  // - Else use album art from RockSniffer (if available).
  const albumArt =
    song.albumArt && typeof song.albumArt === "string" && song.albumArt.length > 32
      ? `data:image/jpeg;base64,${song.albumArt}`
      : "";

  const preferred =
    RUNTIME.artMode === "off"
      ? ""
      : RUNTIME.artMode === "player"
        ? RUNTIME.playerImageUrl || state.custom.playerImageUrl || ""
        : RUNTIME.artMode === "album"
          ? albumArt
          : RUNTIME.playerImageUrl || state.custom.playerImageUrl || albumArt || "";

  setPlayerImage(preferred);
  setCoverBlur(preferred);

  // When status pills fade, show a simple "LIVE/READY" signal instead
  const signalText = $id("signalText");
  if (signalText) {
    signalText.textContent = inSong ? "LIVE" : "READY";
  }

  // Make the header subtext more meaningful once status pills fade away
  const brandSub = $id("brandSub");
  if (brandSub) {
    const arrLabel =
      arrangement && arrangement.type
        ? arrangement.type
        : arrangement && arrangement.name
          ? arrangement.name
          : "—";

    if (inSong) {
      brandSub.textContent = `${arrLabel} • ${fmtPct(notes.Accuracy, 1)}`;
    } else {
      brandSub.textContent = `${arrLabel} • Ready`;
    }
  }

  // Now playing
  const title = song.songName ? `${song.songName}` : "—";
  const sub = song.artistName ? song.artistName : "—";
  setText("nowTitle", title);
  setText("nowSub", sub);

  const length = Number(song.songLength) || 0;
  setText("nowTimer", fmtTimer(timer));
  setText("nowLength", fmtTimer(length));

  const progress = length > 0 ? (timer / length) * 100 : 0;
  setWidth("nowMeter", progress);

  const tuningName = arrangement && arrangement.tuning && arrangement.tuning.TuningName ? arrangement.tuning.TuningName : "—";
  setText("nowTuning", tuningName);

  // Performance
  setText("perfScore", fmtInt(notes.CurrentScore));
  setText("perfAccuracy", fmtPct(notes.Accuracy, 1));
  setText(
    "perfNotes",
    Number.isFinite(Number(notes.TotalNotesHit)) && Number.isFinite(Number(notes.TotalNotes))
      ? `${fmtInt(notes.TotalNotesHit)}/${fmtInt(notes.TotalNotes)}`
      : "—"
  );
  setText("perfMissed", fmtInt(notes.TotalNotesMissed));

  const arrLabel =
    arrangement && arrangement.type
      ? arrangement.type
      : arrangement && arrangement.name
        ? arrangement.name
        : readout.arrangementID
          ? String(readout.arrangementID).slice(0, 6)
          : "—";
  setText("perfArrangement", arrLabel);

  // Streak
  setText("streakCurrent", fmtInt(notes.CurrentHitStreak));
  setText("streakBest", fmtInt(notes.HighestHitStreak));
  setText(
    "streakMult",
    Number.isFinite(Number(notes.CurrentMultiplier)) ? `${fmtInt(notes.CurrentMultiplier)}x` : "—"
  );
  setText(
    "streakMultBest",
    Number.isFinite(Number(notes.HighestMultiplier)) ? `${fmtInt(notes.HighestMultiplier)}x` : "—"
  );
  setText("streakMiss", fmtInt(notes.CurrentMissStreak));

  // Accuracy (lifetime/since launch are optional - many setups send them via Streamer.bot instead)
  setText("accNow", fmtPct(notes.Accuracy, 1));
  setWidth("accSpark", Number.isFinite(Number(notes.Accuracy)) ? Number(notes.Accuracy) : 0);
  setText("accTotalNotes", fmtInt(notes.TotalNotes));
  setText("accHitNotes", fmtInt(notes.TotalNotesHit));

  // If your Streamer.bot integration provides these fields, it can update them via rs:set too.
  // We leave them as-is unless set by custom state.
  setText("accSinceLaunch", state.custom.accuracySinceLaunch || "—");
  setText("accLifetime", state.custom.accuracyLifeTime || "—");

  setStatus("rs", true, inSong ? "RockSniffer: playing" : "RockSniffer: connected");
}

function onSnifferError() {
  state.sniffer.ok = false;
  state.sniffer.lastErrAt = Date.now();
  setStatus("rs", false, "Waiting for RockSniffer");
}

function showToast(text, ms = 2500) {
  const toast = $id("toast");
  if (!toast) return;
  toast.textContent = String(text || "");
  toast.classList.add("show");
  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, ms);
}

function setActiveCard(cardId) {
  const cards = document.querySelectorAll(".card");
  cards.forEach((c) => c.classList.remove("active"));
  const next = document.querySelector(`.card[data-card="${cardId}"]`);
  if (next) next.classList.add("active");
}

function rotateToIndex(i) {
  const order = state.rotator.order;
  if (!order.length) return;
  const idx = ((i % order.length) + order.length) % order.length;
  state.rotator.idx = idx;
  setActiveCard(order[idx]);
}

function rotateNext() {
  rotateToIndex(state.rotator.idx + 1);
}

function startRotator() {
  if (!CONFIG.ROTATOR_ENABLED) return;
  stopRotator();
  state.rotator.timer = setInterval(rotateNext, Math.max(1200, CONFIG.ROTATOR_INTERVAL_MS || 4500));
}

function stopRotator() {
  if (state.rotator.timer) clearInterval(state.rotator.timer);
  state.rotator.timer = null;
}

function applyCustomToUI() {
  setText("sessMain", state.custom.sessMain);
  setText("sessGoal", state.custom.sessGoal);
  setText("sessFocus", state.custom.sessFocus);
  setText("sessMode", state.custom.sessMode);

  setText("customLabel", state.custom.customLabel);
  setText("customValue", state.custom.customValue);
  setText("customExtra", state.custom.customExtra);

  if (state.custom.accuracySinceLaunch) setText("accSinceLaunch", state.custom.accuracySinceLaunch);
  if (state.custom.accuracyLifeTime) setText("accLifetime", state.custom.accuracyLifeTime);

  if (state.custom.playerImageUrl && RUNTIME.artMode !== "album" && !RUNTIME.playerImageUrl) {
    setPlayerImage(state.custom.playerImageUrl);
    setCoverBlur(state.custom.playerImageUrl);
  }

  // Hide the custom footer hint in production
  const footer = $id("customFooterHint");
  if (footer) footer.textContent = "";
}

function handleStreamerBotPayload(payload) {
  state.sb.ok = true;
  state.sb.connected = true;
  state.sb.lastMsgAt = Date.now();
  setStatus("ws", true, "Streamer.bot: connected");

  if (!payload || typeof payload !== "object") return;

  // Supported message types:
  // - rs:set { data: { ... } }   -> merge into custom state + redraw
  // - rs:toast { text, ms? }     -> show toast
  // - rs:rotate { to: "now" | "next" | "prev" } -> control rotator
  // - rs:theme { accent, accent2 } -> update CSS vars at runtime
  // - rs:send { data: {...} } -> overlay->SB DoAction (if configured)

  const type = payload.type || payload.event || "";

  if (type === "rs:set" && payload.data && typeof payload.data === "object") {
    state.sb.hasUpdate = true;
    Object.assign(state.custom, payload.data);
    applyCustomToUI();
    rebuildRotatorOrder();
    debugLine(`rs:set ${Object.keys(payload.data).join(", ")}`);
    return;
  }

  if (type === "rs:toast") {
    state.sb.hasUpdate = true;
    showToast(payload.text || payload.message || "—", payload.ms || 2500);
    rebuildRotatorOrder();
    debugLine("rs:toast");
    return;
  }

  if (type === "rs:rotate") {
    const to = payload.to || payload.card || payload.direction || "next";
    if (to === "custom" && !state.sb.hasUpdate) return;
    if (to === "next") rotateNext();
    else if (to === "prev") rotateToIndex(state.rotator.idx - 1);
    else rotateToIndex(state.rotator.order.indexOf(to));
    debugLine(`rs:rotate ${to}`);
    return;
  }

  if (type === "rs:theme" && payload.data && typeof payload.data === "object") {
    const root = document.documentElement;
    if (payload.data.accent) root.style.setProperty("--accent", payload.data.accent);
    if (payload.data.accent2) root.style.setProperty("--accent2", payload.data.accent2);
    debugLine("rs:theme");
    return;
  }

  if (type === "rs:send") {
    const ok = sbSendToStreamerBotDoAction(
      payload.data || {},
      (CONFIG && CONFIG.RECEIVER_ACTION_ID) || ""
    );
    debugLine(`rs:send ${ok ? "ok" : "fail"}`);
    return;
  }
}

function initSniffer() {
  if (!CONFIG.ROCKSNIFFER_ENABLED) {
    setStatus("rs", false, "RockSniffer: disabled");
    return;
  }

  if (typeof SnifferPoller !== "function") {
    setStatus("rs", false, "RockSniffer: missing deps");
    return;
  }

  // Patch poll to detect failures (original implementation has no fail handler)
  if (!SnifferPoller.prototype.__rsWidgetPatched) {
    const originalPoll = SnifferPoller.prototype.poll;
    SnifferPoller.prototype.poll = function () {
      const url = "http://" + this.options.ip + ":" + this.options.port;
      $.getJSON(url)
        .done((data) => {
          this.__lastOkAt = Date.now();
          this.gotData(data);
        })
        .fail(() => {
          this.__lastErrAt = Date.now();
          if (typeof this.options.onError === "function") this.options.onError();
        });
    };
    SnifferPoller.prototype.__rsWidgetPatched = true;
    SnifferPoller.prototype.__rsWidgetOriginalPoll = originalPoll;
  }

  // eslint-disable-next-line no-unused-vars
  const poller = new SnifferPoller({
    ip: RUNTIME.rs.ip,
    port: RUNTIME.rs.port,
    interval: CONFIG.ROCKSNIFFER_POLL_INTERVAL_MS,
    onData: (data) => updateFromSniffer(data),
    onError: () => onSnifferError(),
  });

  setStatus("rs", false, "Connecting to RockSniffer…");
}

function initStreamerBot() {
  if (!CONFIG.WS_ENABLED && !CONFIG.SB_CLIENT_ENABLED) {
    setStatus("ws", false, "Streamer.bot: disabled");
    return;
  }

  setStatus("ws", false, "Streamer.bot: connecting…");
  state.sb.connected = false;

  // 1) StreamerbotClient + GlobalVariableUpdated
  if (CONFIG.SB_CLIENT_ENABLED && typeof window.StreamerbotClient === "function") {
    try {
      const client = new window.StreamerbotClient({
        address: RUNTIME.sb.address,
        port: RUNTIME.sb.port,
        password: RUNTIME.sb.password,
        endpoint: RUNTIME.sb.endpoint || "/",
        autoReconnect: true,
        immediate: true,
        logLevel: "warn",
        onConnect: () => {
          state.sb.connected = true;
          // Mark "alive" so we don't flip to waiting just because no updates yet
          state.sb.lastMsgAt = Date.now();
          setStatus("ws", true, "Streamer.bot: connected");
        },
        onDisconnect: () => {
          state.sb.connected = false;
          setStatus("ws", false, "Streamer.bot: disconnected");
        },
        onError: () => {
          state.sb.connected = false;
          setStatus("ws", false, "Streamer.bot: error");
        },
      });

      // Apply current global value on connect (if available)
      if (typeof client.getGlobal === "function") {
        client
          .getGlobal(RUNTIME.gvName)
          .then((g) => {
            const raw = g?.variable?.value;
            if (!raw) return;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            handleStreamerBotPayload(parsed);
          })
          .catch(() => {});
      }

      client.on("Misc.GlobalVariableUpdated", ({ data }) => {
        if (!data || data.name !== RUNTIME.gvName) return;
        try {
          const v = typeof data.newValue === "string" ? JSON.parse(data.newValue) : data.newValue;
          handleStreamerBotPayload(v);
        } catch {
          // ignore malformed payloads
        }
      });

      return;
    } catch (err) {
      console.error("[SB Client] failed, falling back to WS:", err);
    }
  }

  // 2) Fallback: our /ws Custom broadcast listener (CPH.WebsocketBroadcastJson)
  try {
    const wsCfg = { ...CONFIG, WS_URL: RUNTIME.wsUrl };
    sbConnect(wsCfg, (payload) => handleStreamerBotPayload(payload));
    // If socket opens but no payloads arrive yet, treat it as connected (no "waiting" flip)
    setTimeout(() => {
      if (typeof sbIsConnected === "function" && sbIsConnected()) {
        state.sb.connected = true;
        state.sb.lastMsgAt = Date.now();
        setStatus("ws", true, "Streamer.bot: connected");
      }
    }, 800);
  } catch (err) {
    console.error(err);
    setStatus("ws", false, "Streamer.bot: error");
  }
}

function init() {
  applyThemeFromConfig();
  applyLayoutFromUrl();
  applyCustomToUI();
  rebuildRotatorOrder();
  rotateToIndex(0);
  startRotator();
  updateStatusMode();

  // Update RockSniffer globals for any dependency helpers
  window.ip = RUNTIME.rs.ip;
  window.port = RUNTIME.rs.port;
  window.defaultPath = CONFIG.DEFAULT_PATH;

  if (RUNTIME.playerImageUrl) {
    state.custom.playerImageUrl = RUNTIME.playerImageUrl;
    applyCustomToUI();
  }

  initSniffer();
  initStreamerBot();

  // If SB isn't connected after a moment, show "waiting" (connecting)
  setTimeout(() => {
    if (!state.sb.connected && (CONFIG.WS_ENABLED || CONFIG.SB_CLIENT_ENABLED)) {
      setStatus("ws", false, "Streamer.bot: waiting");
      setDot($id("wsDot"), "warn");
    }
  }, 2500);
}

window.addEventListener("load", init);

