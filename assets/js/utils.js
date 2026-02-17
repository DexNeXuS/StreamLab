/* DexNeXuS — Streaming Lab — shared utilities
   Pure helpers and loadJsonManifest. No DOM or app state. */

/**
 * Fetch JSON from path. Used for all manifest/config loading.
 * @param {string} path
 * @returns {Promise<unknown>}
 */
export async function loadJsonManifest(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return res.json();
}

/**
 * Escape HTML special characters for safe insertion into DOM/innerHTML.
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Normalize string for comparison/search: lowercase, trim.
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  return (s || "").toLowerCase().trim();
}

/**
 * Sort comparator: by order number then by title.
 * @param {{ order?: number, title?: string }} a
 * @param {{ order?: number, title?: string }} b
 * @returns {number}
 */
export function byOrderThenTitle(a, b) {
  const ao = Number.isFinite(a.order) ? a.order : 9999;
  const bo = Number.isFinite(b.order) ? b.order : 9999;
  if (ao !== bo) return ao - bo;
  return (a.title || "").localeCompare(b.title || "");
}

/** Nav group display order. */
export const GROUP_ORDER = ["Start Here", "Streaming", "Resources", "About"];

/**
 * Rank for a group name (for sorting). Lower = earlier.
 * @param {string} name
 * @returns {number}
 */
export function groupRank(name) {
  const idx = GROUP_ORDER.indexOf(name);
  return idx === -1 ? 999 : idx;
}

/**
 * Split comma-separated string into trimmed non-empty array.
 * @param {string} s
 * @returns {string[]}
 */
export function splitCsv(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Normalize string for search (lowercase). Used in command search.
 * @param {string} s
 * @returns {string}
 */
export function normalizeForSearch(s) {
  return String(s || "").toLowerCase();
}

/**
 * Format a Date as YYYY-MM-DD for rota keys.
 * @param {Date} d
 * @returns {string}
 */
export function dateToKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- Streaming rota (schedule) — pure, only uses dateToKey ---

/**
 * Get stream for a single date from rota (overrides, recurring, cancelled).
 * @param {{ recurring?: Array<{ dayOfWeek: number, label?: string, time?: string }>, overrides?: Record<string, { label?: string, time?: string }>, cancelled?: string[] }} rota
 * @param {Date} d
 * @returns {{ label: string, time: string } | null}
 */
export function getStreamForDate(rota, d) {
  const key = dateToKey(d);
  if (rota.cancelled && rota.cancelled.includes(key)) return null;
  if (rota.overrides && key in rota.overrides) return rota.overrides[key] || null;
  const dayOfWeek = d.getDay();
  const rec = (rota.recurring || []).find((r) => r.dayOfWeek === dayOfWeek);
  return rec ? { label: rec.label, time: rec.time } : null;
}

/**
 * Next stream in the next 14 days from fromDate.
 * @param {Parameters<typeof getStreamForDate>[0]} rota
 * @param {Date} [fromDate]
 * @returns {{ label: string, time: string, dateFormatted: string } | null}
 */
export function getNextStreamFromRota(rota, fromDate = new Date()) {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const stream = getStreamForDate(rota, d);
    if (stream) {
      return {
        label: stream.label,
        time: stream.time,
        dateFormatted: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      };
    }
  }
  return null;
}

/**
 * Next 7 days with stream label/time from rota.
 * @param {Parameters<typeof getStreamForDate>[0]} rota
 * @returns {Array<{ dateFormatted: string, label: string | null, time: string | null }>}
 */
export function getRotaWeekEntries(rota) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const stream = getStreamForDate(rota, d);
    out.push({
      dateFormatted: d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
      label: stream ? stream.label : null,
      time: stream ? stream.time : null,
    });
  }
  return out;
}

// --- Widget normalisation (pure) ---

/**
 * Normalise widget config: default id, file, actions, showOnDiscover, discoverOrder.
 * @param {{ id?: string, file?: string, link?: string, page?: string, actions?: string[], showOnDiscover?: boolean, showOnTwitch?: boolean, discoverOrder?: number } & Record<string, unknown>} w
 * @returns {typeof w & { id: string, page: string | null, showOnDiscover: boolean, showOnTwitch: boolean, discoverOrder: number, actions: string[] }}
 */
export function normalizeWidget(w) {
  const file = w.file || (w.id ? w.id + ".html" : null);
  const link = w.link || null;
  const page = w.page || null;
  let actions = w.actions;
  if (!Array.isArray(actions) || actions.length === 0) {
    actions = [];
    if (page) {
      actions.push("page");
    } else if (file) {
      actions.push("open");
      actions.push("download");
      actions.push("copyUrl");
    } else if (link) {
      actions.push("open");
      if (!actions.includes("copyUrl")) actions.push("copyUrl");
    }
  }
  return {
    ...w,
    id: w.id || (file ? file.replace(/\.html$/, "") : "widget"),
    page: page || null,
    showOnDiscover: Boolean(w.showOnDiscover),
    showOnTwitch: Boolean(w.showOnTwitch),
    discoverOrder: typeof w.discoverOrder === "number" ? w.discoverOrder : 50,
    actions,
  };
}

/**
 * Format seconds as m:ss (e.g. for audio time display).
 * @param {number} sec
 * @returns {string}
 */
export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
